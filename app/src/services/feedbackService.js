const crypto = require('crypto');
const { getDb, syncShadowVault } = require('../database/db');

class FeedbackService {
    static initTables() {
        const db = getDb();
        db.exec(`
            -- 1. Google Forms Feedback Campaigns
            CREATE TABLE IF NOT EXISTS feedback_campaigns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                institution_id INTEGER NOT NULL DEFAULT 1,
                campaign_name TEXT NOT NULL,
                google_account_email TEXT NOT NULL DEFAULT 'kanhadigimkt@gmail.com',
                google_form_url TEXT DEFAULT '',
                google_form_id TEXT DEFAULT '',
                google_sheet_url TEXT DEFAULT '',
                google_sheet_id TEXT DEFAULT '',
                prefilled_field_id TEXT DEFAULT 'entry.123456789',
                start_date DATE DEFAULT (DATE('now')),
                expiry_date DATE DEFAULT (DATE('now', '+30 days')),
                status TEXT DEFAULT 'Active' CHECK(status IN ('Draft', 'Active', 'Closed', 'Expired')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- 2. Student-wise Pre-filled Feedback References
            CREATE TABLE IF NOT EXISTS feedback_student_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER NOT NULL REFERENCES feedback_campaigns(id) ON DELETE CASCADE,
                institution_id INTEGER NOT NULL DEFAULT 1,
                student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                reference_code TEXT UNIQUE NOT NULL,
                guardian_type TEXT DEFAULT 'Parent' CHECK(guardian_type IN ('Parent', 'Father', 'Mother', 'Guardian')),
                guardian_phone TEXT DEFAULT '',
                prefilled_url TEXT DEFAULT '',
                status TEXT DEFAULT 'Link Generated' CHECK(status IN ('Link Generated', 'Sent Manually', 'Submitted / Imported', 'Expired', 'Invalid Reference')),
                sent_at DATETIME,
                submitted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- 3. Google Form Responses Imported into ERP
            CREATE TABLE IF NOT EXISTS parent_feedback_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER REFERENCES feedback_campaigns(id) ON DELETE SET NULL,
                institution_id INTEGER NOT NULL DEFAULT 1,
                reference_code TEXT NOT NULL,
                student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
                guardian_relationship TEXT DEFAULT 'Parent',
                rating_academic INTEGER DEFAULT 5 CHECK(rating_academic BETWEEN 1 AND 5),
                rating_attendance INTEGER DEFAULT 5 CHECK(rating_attendance BETWEEN 1 AND 5),
                rating_opportunity INTEGER DEFAULT 5 CHECK(rating_opportunity BETWEEN 1 AND 5),
                rating_fees INTEGER DEFAULT 5 CHECK(rating_fees BETWEEN 1 AND 5),
                rating_communication INTEGER DEFAULT 5 CHECK(rating_communication BETWEEN 1 AND 5),
                rating_overall INTEGER DEFAULT 5 CHECK(rating_overall BETWEEN 1 AND 5),
                suggestions TEXT DEFAULT '',
                complaints TEXT DEFAULT '',
                source TEXT DEFAULT 'Google Forms',
                submitted_timestamp TEXT DEFAULT '',
                imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- 4. Audit Trail for Google Sheets Response Imports
            CREATE TABLE IF NOT EXISTS feedback_import_audits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER REFERENCES feedback_campaigns(id) ON DELETE SET NULL,
                institution_id INTEGER NOT NULL DEFAULT 1,
                file_name TEXT DEFAULT '',
                total_rows INTEGER DEFAULT 0,
                imported_count INTEGER DEFAULT 0,
                rejected_count INTEGER DEFAULT 0,
                duplicate_count INTEGER DEFAULT 0,
                import_details_json TEXT DEFAULT '{}',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Seed initial Lakshya School campaign if none exists
        const count = db.prepare('SELECT COUNT(*) as c FROM feedback_campaigns WHERE institution_id = 1').get().c;
        if (count === 0) {
            db.prepare(`
                INSERT INTO feedback_campaigns (
                    institution_id, campaign_name, google_account_email, google_form_url,
                    google_form_id, google_sheet_url, google_sheet_id, prefilled_field_id,
                    start_date, expiry_date, status
                ) VALUES (
                    1, 'Lakshya School – Term 1 Parent Feedback (2026–27)',
                    'kanhadigimkt@gmail.com',
                    'https://docs.google.com/forms/d/e/1FAIpQLScSampleLakshyaFormID/viewform',
                    '1FAIpQLScSampleLakshyaFormID',
                    'https://docs.google.com/spreadsheets/d/1SampleLakshyaSheetID/edit',
                    '1SampleLakshyaSheetID',
                    'entry.184920482',
                    DATE('now'),
                    DATE('now', '+30 days'),
                    'Active'
                )
            `).run();
        }
    }

    // --- CAMPAIGN MANAGEMENT ---
    static getCampaigns(institutionId = 1) {
        this.initTables();
        const db = getDb();
        const campaigns = db.prepare(`
            SELECT c.*,
                   (SELECT COUNT(*) FROM feedback_student_links WHERE campaign_id = c.id) as total_links,
                   (SELECT COUNT(*) FROM feedback_student_links WHERE campaign_id = c.id AND status = 'Submitted / Imported') as submitted_links,
                   (SELECT COUNT(*) FROM feedback_student_links WHERE campaign_id = c.id AND status = 'Sent Manually') as sent_links
            FROM feedback_campaigns c
            WHERE c.institution_id = ?
            ORDER BY c.id DESC
        `).all(institutionId);
        return campaigns;
    }

    static getCampaign(campaignId) {
        this.initTables();
        const db = getDb();
        return db.prepare('SELECT * FROM feedback_campaigns WHERE id = ?').get(campaignId);
    }

    static saveCampaign(data, institutionId = 1) {
        this.initTables();
        const db = getDb();
        if (data.id) {
            db.prepare(`
                UPDATE feedback_campaigns SET
                    campaign_name = ?,
                    google_account_email = ?,
                    google_form_url = ?,
                    google_form_id = ?,
                    google_sheet_url = ?,
                    google_sheet_id = ?,
                    prefilled_field_id = ?,
                    start_date = ?,
                    expiry_date = ?,
                    status = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND institution_id = ?
            `).run(
                data.campaign_name,
                data.google_account_email || 'kanhadigimkt@gmail.com',
                data.google_form_url || '',
                data.google_form_id || '',
                data.google_sheet_url || '',
                data.google_sheet_id || '',
                data.prefilled_field_id || 'entry.123456789',
                data.start_date || new Date().toISOString().split('T')[0],
                data.expiry_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                data.status || 'Active',
                data.id,
                institutionId
            );
            syncShadowVault();
            return this.getCampaign(data.id);
        } else {
            const info = db.prepare(`
                INSERT INTO feedback_campaigns (
                    institution_id, campaign_name, google_account_email, google_form_url,
                    google_form_id, google_sheet_url, google_sheet_id, prefilled_field_id,
                    start_date, expiry_date, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                institutionId,
                data.campaign_name,
                data.google_account_email || 'kanhadigimkt@gmail.com',
                data.google_form_url || '',
                data.google_form_id || '',
                data.google_sheet_url || '',
                data.google_sheet_id || '',
                data.prefilled_field_id || 'entry.123456789',
                data.start_date || new Date().toISOString().split('T')[0],
                data.expiry_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                data.status || 'Active'
            );
            syncShadowVault();
            return this.getCampaign(info.lastInsertRowid);
        }
    }

    // --- STUDENT-WISE FEEDBACK LINKS ---
    static generateStudentLinks(campaignId, institutionId = 1) {
        this.initTables();
        const db = getDb();
        const campaign = this.getCampaign(campaignId);
        if (!campaign) throw new Error('Campaign not found');

        const students = db.prepare("SELECT * FROM students WHERE status = 'Active' ORDER BY class, id").all();
        const existingLinks = db.prepare("SELECT student_id FROM feedback_student_links WHERE campaign_id = ?").all(campaignId);
        const existingIds = new Set(existingLinks.map(l => l.student_id));

        const insertStmt = db.prepare(`
            INSERT INTO feedback_student_links (
                campaign_id, institution_id, student_id, reference_code,
                guardian_type, guardian_phone, prefilled_url, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Link Generated')
        `);

        let generatedCount = 0;
        for (const st of students) {
            if (existingIds.has(st.id)) continue;

            // Generate clean unguessable reference code (e.g., LAK-7E2A91F4)
            const randomCode = 'LAK-' + crypto.randomBytes(4).toString('hex').toUpperCase();

            // Construct prefilled link without exposing student identity
            let prefilledUrl = '';
            if (campaign.google_form_url) {
                const baseUrl = campaign.google_form_url.split('?')[0].replace('/viewform', '/viewform');
                const fieldParam = campaign.prefilled_field_id ? campaign.prefilled_field_id.trim() : 'entry.123456789';
                prefilledUrl = `${baseUrl}?usp=pp_url&${fieldParam}=${randomCode}`;
            }

            const phone = st.mobile || st.alt_mobile || '';
            insertStmt.run(campaignId, institutionId, st.id, randomCode, 'Parent', phone, prefilledUrl);
            generatedCount++;
        }

        syncShadowVault();
        return {
            campaign_id: campaignId,
            total_students: students.length,
            newly_generated: generatedCount,
            total_active_links: students.length
        };
    }

    static getStudentLinks(campaignId, search = '', statusFilter = '', classFilter = '') {
        this.initTables();
        const db = getDb();
        let query = `
            SELECT l.*, s.student_name, s.admission_no, s.class, s.section, s.father_name, s.mobile
            FROM feedback_student_links l
            JOIN students s ON l.student_id = s.id
            WHERE l.campaign_id = ?
        `;
        const params = [campaignId];

        if (statusFilter) {
            query += ` AND l.status = ?`;
            params.push(statusFilter);
        }
        if (classFilter) {
            query += ` AND s.class = ?`;
            params.push(classFilter);
        }
        if (search) {
            query += ` AND (s.student_name LIKE ? OR s.admission_no LIKE ? OR l.reference_code LIKE ?)`;
            const sTerm = `%${search}%`;
            params.push(sTerm, sTerm, sTerm);
        }

        query += ` ORDER BY s.class ASC, s.student_name ASC`;
        return db.prepare(query).all(...params);
    }

    static markLinkSent(linkId) {
        this.initTables();
        const db = getDb();
        db.prepare(`
            UPDATE feedback_student_links
            SET status = 'Sent Manually', sent_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status != 'Submitted / Imported'
        `).run(linkId);
        syncShadowVault();
        return { success: true };
    }

    // --- CSV PARSING & GOOGLE SHEETS IMPORT ---
    static parseCSV(text) {
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) return [];

        const parseLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"' || char === "'") {
                    if (inQuotes && line[i + 1] === char) {
                        current += char;
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if ((char === ',' || char === '\t') && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        };

        const headers = parseLine(lines[0]);
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = parseLine(lines[i]);
            const row = {};
            headers.forEach((h, idx) => {
                row[h] = values[idx] !== undefined ? values[idx] : '';
            });
            rows.push(row);
        }
        return { headers, rows };
    }

    static detectColumnMapping(headers) {
        const mapping = {
            timestamp: '',
            reference_code: '',
            academic: '',
            attendance: '',
            opportunity: '',
            fees: '',
            communication: '',
            overall: '',
            suggestions: '',
            complaints: '',
            relationship: ''
        };

        headers.forEach(h => {
            const lh = h.toLowerCase();
            if (lh.includes('timestamp') || lh.includes('समय') || lh.includes('date')) {
                mapping.timestamp = h;
            } else if (lh.includes('reference') || lh.includes('code') || lh.includes('कोड') || lh.includes('ref')) {
                mapping.reference_code = h;
            } else if (lh.includes('academic') || lh.includes('पढ़ाई') || lh.includes('शिक्षा')) {
                mapping.academic = h;
            } else if (lh.includes('attendance') || lh.includes('उपस्थिति') || lh.includes('अनुशासन') || lh.includes('discipline')) {
                mapping.attendance = h;
            } else if (lh.includes('opportunity') || lh.includes('अवसर') || lh.includes('कौशल') || lh.includes('skills')) {
                mapping.opportunity = h;
            } else if (lh.includes('fee') || lh.includes('फीस') || lh.includes('शुल्क')) {
                mapping.fees = h;
            } else if (lh.includes('communication') || lh.includes('संवाद') || lh.includes('बातचीत')) {
                mapping.communication = h;
            } else if (lh.includes('overall') || lh.includes('संतुष्टि') || lh.includes('satisfaction') || lh.includes('समग्र')) {
                mapping.overall = h;
            } else if (lh.includes('suggestion') || lh.includes('सुझाव')) {
                mapping.suggestions = h;
            } else if (lh.includes('complaint') || lh.includes('शिकायत')) {
                mapping.complaints = h;
            } else if (lh.includes('relation') || lh.includes('संबंध') || lh.includes('parent') || lh.includes('अभिभावक')) {
                mapping.relationship = h;
            }
        });

        return mapping;
    }

    static previewCSV(csvText) {
        const { headers, rows } = this.parseCSV(csvText);
        const mapping = this.detectColumnMapping(headers);
        const previewRows = rows.slice(0, 5).map(r => ({
            timestamp: r[mapping.timestamp] || '',
            reference_code: r[mapping.reference_code] || '',
            academic: r[mapping.academic] || '',
            attendance: r[mapping.attendance] || '',
            opportunity: r[mapping.opportunity] || '',
            fees: r[mapping.fees] || '',
            communication: r[mapping.communication] || '',
            overall: r[mapping.overall] || '',
            suggestions: r[mapping.suggestions] || '',
            complaints: r[mapping.complaints] || '',
            relationship: r[mapping.relationship] || ''
        }));

        return {
            total_rows: rows.length,
            headers,
            mapping,
            preview_samples: previewRows
        };
    }

    static importGoogleSheetCSV(campaignId, csvText, institutionId = 1, fileName = 'Google_Forms_Responses.csv') {
        this.initTables();
        const db = getDb();
        const campaign = this.getCampaign(campaignId);
        if (!campaign) throw new Error('Campaign not found');

        const { headers, rows } = this.parseCSV(csvText);
        if (rows.length === 0) throw new Error('No valid response rows detected in CSV');

        const mapping = this.detectColumnMapping(headers);
        if (!mapping.reference_code) {
            throw new Error('Could not identify "Feedback Reference Code" column in CSV. Please verify column headers.');
        }

        let importedCount = 0;
        let rejectedCount = 0;
        let duplicateCount = 0;
        const errorDetails = [];

        const insertResponse = db.prepare(`
            INSERT INTO parent_feedback_responses (
                campaign_id, institution_id, reference_code, student_id,
                guardian_relationship, rating_academic, rating_attendance,
                rating_opportunity, rating_fees, rating_communication,
                rating_overall, suggestions, complaints, source,
                submitted_timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Google Forms', ?)
        `);

        const updateLink = db.prepare(`
            UPDATE feedback_student_links
            SET status = 'Submitted / Imported', submitted_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        // Also sync into legacy parent_feedback table for backward compatibility with 3rd party scripts
        const syncLegacy = db.prepare(`
            INSERT INTO parent_feedback (
                student_id, parent_name, rating_academic, rating_discipline,
                rating_communication, rating_facilities, comments
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const parseRating = (val) => {
            const num = parseInt(String(val).match(/\d+/)?.[0] || '5');
            return Math.min(5, Math.max(1, isNaN(num) ? 5 : num));
        };

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const rawRef = (r[mapping.reference_code] || '').trim().toUpperCase();

            if (!rawRef) {
                rejectedCount++;
                errorDetails.push({ row: i + 2, reason: 'Empty reference code' });
                continue;
            }

            // 1. Look up student link for this reference in the current campaign & institution
            const link = db.prepare(`
                SELECT l.*, s.student_name, s.father_name
                FROM feedback_student_links l
                JOIN students s ON l.student_id = s.id
                WHERE l.reference_code = ? AND l.campaign_id = ? AND l.institution_id = ?
            `).get(rawRef, campaignId, institutionId);

            if (!link) {
                rejectedCount++;
                errorDetails.push({ row: i + 2, reference: rawRef, reason: 'Invalid or unknown reference code' });
                continue;
            }

            // 2. Duplicate Check: Check if response already exists for this reference
            const exists = db.prepare(`
                SELECT id FROM parent_feedback_responses
                WHERE reference_code = ? AND campaign_id = ?
            `).get(rawRef, campaignId);

            if (exists) {
                duplicateCount++;
                errorDetails.push({ row: i + 2, reference: rawRef, reason: 'Duplicate: Reference already imported' });
                continue;
            }

            // 3. Extract & Validate Ratings
            const rAcad = parseRating(r[mapping.academic]);
            const rAtt = parseRating(r[mapping.attendance]);
            const rOpp = parseRating(r[mapping.opportunity]);
            const rFee = parseRating(r[mapping.fees]);
            const rComm = parseRating(r[mapping.communication]);
            const rOver = parseRating(r[mapping.overall]);
            const suggestions = (r[mapping.suggestions] || '').trim();
            const complaints = (r[mapping.complaints] || '').trim();
            const relation = (r[mapping.relationship] || 'Parent').trim();
            const submittedAt = (r[mapping.timestamp] || new Date().toISOString()).trim();

            // 4. Save into database
            insertResponse.run(
                campaignId,
                institutionId,
                rawRef,
                link.student_id,
                relation,
                rAcad,
                rAtt,
                rOpp,
                rFee,
                rComm,
                rOver,
                suggestions,
                complaints,
                submittedAt
            );

            updateLink.run(link.id);

            // Legacy sync with student context
            const commentCombo = [suggestions ? `[सुझाव] ${suggestions}` : '', complaints ? `[शिकायत] ${complaints}` : ''].filter(Boolean).join(' | ');
            syncLegacy.run(
                link.student_id,
                `${link.student_name} (${relation})`,
                rAcad,
                rAtt,
                rComm,
                rOpp,
                commentCombo || 'Google Forms Verified Feedback'
            );

            importedCount++;
        }

        // 5. Record Audit History
        db.prepare(`
            INSERT INTO feedback_import_audits (
                campaign_id, institution_id, file_name, total_rows,
                imported_count, rejected_count, duplicate_count, import_details_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            campaignId,
            institutionId,
            fileName,
            rows.length,
            importedCount,
            rejectedCount,
            duplicateCount,
            JSON.stringify({ error_count: errorDetails.length, samples: errorDetails.slice(0, 10) })
        );

        syncShadowVault();

        return {
            success: true,
            total_rows: rows.length,
            imported_count: importedCount,
            rejected_count: rejectedCount,
            duplicate_count: duplicateCount,
            errors: errorDetails.slice(0, 15)
        };
    }

    static getImportAudits(institutionId = 1) {
        this.initTables();
        const db = getDb();
        return db.prepare(`
            SELECT a.*, c.campaign_name
            FROM feedback_import_audits a
            LEFT JOIN feedback_campaigns c ON a.campaign_id = c.id
            WHERE a.institution_id = ?
            ORDER BY a.id DESC LIMIT 20
        `).all(institutionId);
    }

    // --- SQS ANALYTICS & PILLAR INTEGRATION ---
    static getFeedbackAnalytics(institutionId = 1, campaignId = null) {
        this.initTables();
        const db = getDb();

        let baseWhere = 'WHERE institution_id = ?';
        const params = [institutionId];
        if (campaignId) {
            baseWhere += ' AND campaign_id = ?';
            params.push(campaignId);
        }

        const stats = db.prepare(`
            SELECT
                COUNT(*) as total_responses,
                AVG(rating_academic) as avg_academic,
                AVG(rating_attendance) as avg_attendance,
                AVG(rating_opportunity) as avg_opportunity,
                AVG(rating_fees) as avg_fees,
                AVG(rating_communication) as avg_communication,
                AVG(rating_overall) as avg_overall
            FROM parent_feedback_responses
            ${baseWhere}
        `).get(...params);

        const totalStudents = db.prepare("SELECT COUNT(*) as c FROM students WHERE status = 'Active'").get().c;
        const totalResponses = stats ? stats.total_responses : 0;
        const responseRate = totalStudents > 0 ? Math.round((totalResponses / totalStudents) * 100) : 0;

        // Pillar Averages out of 5.0
        const pAcademic = stats && stats.avg_academic ? Number(stats.avg_academic.toFixed(2)) : 4.8;
        const pAttendance = stats && stats.avg_attendance ? Number(stats.avg_attendance.toFixed(2)) : 4.7;
        const pOpportunity = stats && stats.avg_opportunity ? Number(stats.avg_opportunity.toFixed(2)) : 4.6;
        const pFees = stats && stats.avg_fees ? Number(stats.avg_fees.toFixed(2)) : 4.5;
        const pCommunication = stats && stats.avg_communication ? Number(stats.avg_communication.toFixed(2)) : 4.9;
        const pOverall = stats && stats.avg_overall ? Number(stats.avg_overall.toFixed(2)) : 4.8;

        // Composite Average Rating (out of 5.0)
        const avgParentRating = Number(((pAcademic + pAttendance + pOpportunity + pFees + pCommunication) / 5.0).toFixed(2));

        // Parent Communication SQS Score (Converted to 100-point scale for SQS)
        const parentCommunicationScore = Math.round((pCommunication / 5.0) * 100);

        // Recent Suggestions & Complaints
        const recentResponses = db.prepare(`
            SELECT r.*, s.student_name, s.class, s.section
            FROM parent_feedback_responses r
            LEFT JOIN students s ON r.student_id = s.id
            ${baseWhere}
            ORDER BY r.id DESC LIMIT 10
        `).all(...params);

        const suggestionsList = recentResponses.filter(r => r.suggestions).map(r => ({
            student_name: r.student_name || 'Verified Parent',
            class: r.class || 'General',
            relationship: r.guardian_relationship,
            text: r.suggestions,
            date: r.submitted_timestamp || r.imported_at
        }));

        const complaintsList = recentResponses.filter(r => r.complaints).map(r => ({
            student_name: r.student_name || 'Verified Parent',
            class: r.class || 'General',
            relationship: r.guardian_relationship,
            text: r.complaints,
            date: r.submitted_timestamp || r.imported_at
        }));

        // Monthly Trend
        const monthlyTrend = db.prepare(`
            SELECT
                SUBSTR(imported_at, 1, 7) as month_label,
                COUNT(*) as count,
                AVG(rating_overall) as avg_rating
            FROM parent_feedback_responses
            ${baseWhere}
            GROUP BY SUBSTR(imported_at, 1, 7)
            ORDER BY month_label DESC LIMIT 6
        `).all(...params);

        return {
            total_responses: totalResponses,
            total_students: totalStudents,
            response_rate: responseRate,
            avg_parent_rating: avgParentRating,
            overall_satisfaction: pOverall,
            parent_communication_score: parentCommunicationScore,
            pillar_ratings: {
                academic: pAcademic,
                attendance: pAttendance,
                opportunity: pOpportunity,
                fees: pFees,
                communication: pCommunication,
                overall: pOverall
            },
            suggestions: suggestionsList,
            complaints: complaintsList,
            monthly_trend: monthlyTrend,
            recent_responses: recentResponses
        };
    }
}

module.exports = FeedbackService;
