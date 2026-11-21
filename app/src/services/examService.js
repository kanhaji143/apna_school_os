const { getDb } = require('../database/db');

class ExamService {
    // -------------------------------------------------------------
    // SUPER ADMIN EXAM POLICY & TERMS CONFIGURATION
    // -------------------------------------------------------------
    static ensureAuditTable() {
        const db = getDb();
        db.exec(`
            CREATE TABLE IF NOT EXISTS policy_audit_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                school_name TEXT NOT NULL DEFAULT 'Apna Institute',
                action_type TEXT NOT NULL,
                preset_key TEXT,
                policy_snapshot_json TEXT NOT NULL,
                terms_snapshot_json TEXT NOT NULL,
                performed_by TEXT DEFAULT 'Platform Owner',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }

    static createAuditSnapshot(actionType, presetKey = null, schoolName = 'Apna Institute', performedBy = 'Platform Owner') {
        try {
            this.ensureAuditTable();
            const db = getDb();
            const currentPolicy = this.getExamPolicy();
            const currentTerms = this.getExamTerms();
            const stmt = db.prepare(`
                INSERT INTO policy_audit_history (school_name, action_type, preset_key, policy_snapshot_json, terms_snapshot_json, performed_by)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            stmt.run(
                schoolName,
                actionType,
                presetKey,
                JSON.stringify(currentPolicy || {}),
                JSON.stringify(currentTerms || []),
                performedBy
            );
        } catch (err) {
            console.error('Failed to create audit snapshot:', err.message);
        }
    }

    static getAuditHistory(schoolName = null) {
        this.ensureAuditTable();
        const db = getDb();
        if (schoolName) {
            return db.prepare('SELECT * FROM policy_audit_history WHERE school_name = ? ORDER BY id DESC LIMIT 20').all(schoolName);
        }
        return db.prepare('SELECT * FROM policy_audit_history ORDER BY id DESC LIMIT 20').all();
    }

    static rollbackPolicy(historyId) {
        this.ensureAuditTable();
        const db = getDb();
        const row = db.prepare('SELECT * FROM policy_audit_history WHERE id = ?').get(historyId);
        if (!row) {
            return { success: false, error: 'Snapshot not found' };
        }

        const currentPolicy = this.getExamPolicy();
        const currentTerms = this.getExamTerms();

        // Restore Policy
        const policy = JSON.parse(row.policy_snapshot_json);
        if (policy && policy.evaluation_mode) {
            const stmt = db.prepare(`
                UPDATE custom_exam_policy SET
                    evaluation_mode = ?,
                    marksheet_layout = ?,
                    show_rank = ?,
                    show_attendance = ?,
                    show_grading_scale = ?,
                    show_qr_code = ?,
                    show_remarks = ?,
                    grade_scale_json = ?,
                    paper_section_names_json = ?,
                    paper_watermark = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = 1
            `);
            stmt.run(
                policy.evaluation_mode || 'BOTH',
                policy.marksheet_layout || 'BOOKLET_2PAGE',
                policy.show_rank ? 1 : 0,
                policy.show_attendance ? 1 : 0,
                policy.show_grading_scale ? 1 : 0,
                policy.show_qr_code ? 1 : 0,
                policy.show_remarks ? 1 : 0,
                JSON.stringify(policy.grade_scale || []),
                JSON.stringify(policy.paper_sections || []),
                policy.paper_watermark || ''
            );
        }

        // Restore Terms
        const terms = JSON.parse(row.terms_snapshot_json);
        if (Array.isArray(terms) && terms.length > 0) {
            const existingTerms = db.prepare('SELECT * FROM exam_terms').all();
            const targetCodes = terms.map(t => t.term_code);
            for (const ext of existingTerms) {
                if (!targetCodes.includes(ext.term_code)) {
                    const markCount = db.prepare('SELECT count(*) as count FROM marks WHERE exam_term_id = ?').get(ext.id);
                    if (markCount && markCount.count === 0) {
                        db.prepare('DELETE FROM exam_terms WHERE id = ?').run(ext.id);
                    }
                }
            }
            for (const tm of terms) {
                const ext = existingTerms.find(x => x.term_code === tm.term_code);
                if (ext) {
                    db.prepare('UPDATE exam_terms SET term_name=?, max_written=?, max_oral=?, display_order=? WHERE id=?')
                      .run(tm.term_name, tm.max_written, tm.max_oral, tm.display_order, ext.id);
                } else {
                    db.prepare('INSERT INTO exam_terms (term_code, term_name, max_written, max_oral, display_order) VALUES (?, ?, ?, ?, ?)')
                      .run(tm.term_code, tm.term_name, tm.max_written, tm.max_oral, tm.display_order);
                }
            }
        }

        // Log rollback event in history
        const stmtLog = db.prepare(`
            INSERT INTO policy_audit_history (school_name, action_type, preset_key, policy_snapshot_json, terms_snapshot_json, performed_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmtLog.run(
            row.school_name,
            `ROLLBACK_TO_#${historyId}`,
            row.preset_key,
            JSON.stringify(currentPolicy || {}),
            JSON.stringify(currentTerms || []),
            'Platform Owner'
        );

        return {
            success: true,
            message: `Successfully rolled back to policy snapshot #${historyId}`,
            policy: this.getExamPolicy(),
            terms: this.getExamTerms()
        };
    }

    static getExamPolicy() {
        const db = getDb();
        const policy = db.prepare('SELECT * FROM custom_exam_policy WHERE id = 1').get();
        if (!policy) return null;
        return {
            ...policy,
            grade_scale: JSON.parse(policy.grade_scale_json || '[]'),
            paper_sections: JSON.parse(policy.paper_section_names_json || '[]')
        };
    }

    static updateExamPolicy(policyData, schoolName = 'Apna Institute', performedBy = 'Platform Owner') {
        this.createAuditSnapshot('POLICY_UPDATED', null, schoolName, performedBy);
        const db = getDb();
        const stmt = db.prepare(`
            UPDATE custom_exam_policy SET
                evaluation_mode = ?,
                marksheet_layout = ?,
                show_rank = ?,
                show_attendance = ?,
                show_grading_scale = ?,
                show_qr_code = ?,
                show_remarks = ?,
                grade_scale_json = ?,
                paper_section_names_json = ?,
                paper_watermark = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        `);
        stmt.run(
            policyData.evaluation_mode || 'BOTH',
            policyData.marksheet_layout || 'BOOKLET_2PAGE',
            policyData.show_rank ? 1 : 0,
            policyData.show_attendance ? 1 : 0,
            policyData.show_grading_scale ? 1 : 0,
            policyData.show_qr_code ? 1 : 0,
            policyData.show_remarks ? 1 : 0,
            JSON.stringify(policyData.grade_scale || []),
            JSON.stringify(policyData.paper_sections || []),
            policyData.paper_watermark || ''
        );
        return this.getExamPolicy();
    }

    static getExamTerms() {
        const db = getDb();
        return db.prepare('SELECT * FROM exam_terms ORDER BY display_order ASC, id ASC').all();
    }

    static saveExamTerm({ id, term_code, term_name, max_written, max_oral, display_order = 1 }) {
        const db = getDb();
        if (id) {
            const stmt = db.prepare(`
                UPDATE exam_terms SET
                    term_code = ?,
                    term_name = ?,
                    max_written = ?,
                    max_oral = ?,
                    display_order = ?
                WHERE id = ?
            `);
            stmt.run(term_code, term_name, max_written, max_oral, display_order, id);
            return { id, term_code, term_name };
        } else {
            const stmt = db.prepare(`
                INSERT INTO exam_terms (term_code, term_name, max_written, max_oral, display_order)
                VALUES (?, ?, ?, ?, ?)
            `);
            const info = stmt.run(term_code, term_name, max_written, max_oral, display_order);
            return { id: info.lastInsertRowid, term_code, term_name };
        }
    }

    static deleteExamTerm(termId) {
        const db = getDb();
        return db.prepare('DELETE FROM exam_terms WHERE id = ?').run(termId);
    }

    static applyExamPreset(presetKey, schoolName = 'Apna Institute', performedBy = 'Platform Owner') {
        this.createAuditSnapshot('PRESET_APPLIED', presetKey, schoolName, performedBy);
        const db = getDb();
        
        let targetTerms = [];
        if (presetKey === 'APNA_4_TERM' || presetKey === 'LAKSHYA_4_TERM') {
            targetTerms = [
                { term_code: 'UNIT_1', term_name: 'First Unit Test', max_written: 10.0, max_oral: 10.0, display_order: 1 },
                { term_code: 'HALF_YEARLY', term_name: 'First Term / Half-Yearly Exam', max_written: 70.0, max_oral: 10.0, display_order: 2 },
                { term_code: 'UNIT_2', term_name: 'Second Unit Test', max_written: 10.0, max_oral: 10.0, display_order: 3 },
                { term_code: 'ANNUAL', term_name: 'Second Term / Annual Exam', max_written: 70.0, max_oral: 10.0, display_order: 4 }
            ];
        } else if (presetKey === 'STANDARD_2_TERM') {
            targetTerms = [
                { term_code: 'HALF_YEARLY', term_name: 'Half-Yearly Examination', max_written: 80.0, max_oral: 20.0, display_order: 1 },
                { term_code: 'ANNUAL', term_name: 'Annual Final Examination', max_written: 80.0, max_oral: 20.0, display_order: 2 }
            ];
        } else if (presetKey === 'TRIMESTER_3_TERM') {
            targetTerms = [
                { term_code: 'QUARTERLY', term_name: 'Quarterly Examination', max_written: 40.0, max_oral: 10.0, display_order: 1 },
                { term_code: 'HALF_YEARLY', term_name: 'Half-Yearly Examination', max_written: 70.0, max_oral: 10.0, display_order: 2 },
                { term_code: 'ANNUAL', term_name: 'Annual Final Examination', max_written: 70.0, max_oral: 10.0, display_order: 3 }
            ];
        } else if (presetKey === 'CBSE_PERIODIC') {
            targetTerms = [
                { term_code: 'PT_1', term_name: 'Periodic Test 1 (PT-1)', max_written: 20.0, max_oral: 5.0, display_order: 1 },
                { term_code: 'TERM_1', term_name: 'Term 1 Mid-Term Exam', max_written: 80.0, max_oral: 20.0, display_order: 2 },
                { term_code: 'PT_2', term_name: 'Periodic Test 2 (PT-2)', max_written: 20.0, max_oral: 5.0, display_order: 3 },
                { term_code: 'TERM_2', term_name: 'Term 2 Final Exam', max_written: 80.0, max_oral: 20.0, display_order: 4 }
            ];
        }

        const existingTerms = db.prepare('SELECT * FROM exam_terms').all();
        const targetCodes = targetTerms.map(t => t.term_code);

        // Delete only terms not in target preset that have 0 marks
        for (const ext of existingTerms) {
            if (!targetCodes.includes(ext.term_code)) {
                const markCount = db.prepare('SELECT count(*) as count FROM marks WHERE exam_term_id = ?').get(ext.id);
                if (markCount && markCount.count === 0) {
                    db.prepare('DELETE FROM exam_terms WHERE id = ?').run(ext.id);
                }
            }
        }

        // Upsert target terms
        for (const tm of targetTerms) {
            const ext = existingTerms.find(x => x.term_code === tm.term_code);
            if (ext) {
                db.prepare(`
                    UPDATE exam_terms SET
                        term_name = ?,
                        max_written = ?,
                        max_oral = ?,
                        display_order = ?
                    WHERE id = ?
                `).run(tm.term_name, tm.max_written, tm.max_oral, tm.display_order, ext.id);
            } else {
                db.prepare(`
                    INSERT INTO exam_terms (term_code, term_name, max_written, max_oral, display_order)
                    VALUES (?, ?, ?, ?, ?)
                `).run(tm.term_code, tm.term_name, tm.max_written, tm.max_oral, tm.display_order);
            }
        }

        return this.getExamTerms();
    }

    // -------------------------------------------------------------
    // DYNAMIC GRADE & MARKSHEET CALCULATION
    // -------------------------------------------------------------
    static getSubjectsByClass(className) {
        const db = getDb();
        return db.prepare('SELECT * FROM subjects WHERE class = ? ORDER BY display_order ASC').all(className);
    }

    static calculateGrade(percentage) {
        const policy = this.getExamPolicy();
        const scales = (policy && policy.grade_scale && policy.grade_scale.length > 0) ? policy.grade_scale : [
            { grade: 'A1', min: 91, remark: 'Outstanding' },
            { grade: 'A2', min: 81, remark: 'Excellent' },
            { grade: 'B1', min: 71, remark: 'Very Good' },
            { grade: 'B2', min: 61, remark: 'Good' },
            { grade: 'C1', min: 51, remark: 'Fair' },
            { grade: 'C2', min: 41, remark: 'Average' },
            { grade: 'D', min: 33, remark: 'Satisfactory' },
            { grade: 'E', min: 0, remark: 'Needs Improvement' }
        ];

        // Sort descending by min
        scales.sort((a, b) => b.min - a.min);
        for (const tier of scales) {
            if (percentage >= tier.min) {
                return { grade: tier.grade, remark: tier.remark };
            }
        }
        return { grade: 'NI', remark: 'Needs Improvement' };
    }

    static saveMark(studentId, session, className, examTermId, subjectId, writtenMarks, oralMarks, remarks = '') {
        const db = getDb();
        const stmt = db.prepare(`
            INSERT INTO marks (student_id, session, class, exam_term_id, subject_id, written_marks, oral_marks, remarks, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(student_id, session, exam_term_id, subject_id) DO UPDATE SET
                written_marks = excluded.written_marks,
                oral_marks = excluded.oral_marks,
                remarks = excluded.remarks,
                updated_at = CURRENT_TIMESTAMP
        `);
        return stmt.run(studentId, session, className, examTermId, subjectId, writtenMarks, oralMarks, remarks);
    }

    static getStudentMarksheet(studentId, session = '2026-27') {
        const db = getDb();
        const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
        if (!student) return null;

        const profile = db.prepare('SELECT * FROM institution_profile WHERE id = 1').get();
        const policy = this.getExamPolicy();
        const terms = this.getExamTerms();
        const subjects = this.getSubjectsByClass(student.class);

        // Fetch marks
        const marksRows = db.prepare(`
            SELECT m.*, s.subject_name, s.display_order as sub_order, t.term_code
            FROM marks m
            JOIN subjects s ON m.subject_id = s.id
            JOIN exam_terms t ON m.exam_term_id = t.id
            WHERE m.student_id = ? AND m.session = ?
        `).all(studentId, session);

        const marksMap = {};
        for (const row of marksRows) {
            if (!marksMap[row.subject_id]) marksMap[row.subject_id] = {};
            marksMap[row.subject_id][row.term_code] = {
                written: row.written_marks || 0,
                oral: row.oral_marks || 0,
                total: (row.written_marks || 0) + (row.oral_marks || 0)
            };
        }

        const att = db.prepare('SELECT * FROM student_attendance_summary WHERE student_id = ? AND session = ?').get(studentId, session) || {
            total_working_days: 220,
            days_present: 205,
            attendance_percentage: 93.18,
            promotion_status: 'Promoted to Next Class',
            teacher_remarks: 'Consistently diligent, respectful and academically curious.'
        };

        let grandTotalMarks = 0;
        let grandMaxMarks = 0;

        // Calculate max marks per subject dynamically based on configured terms
        const totalMaxPerSubject = terms.reduce((acc, t) => acc + (t.max_written + t.max_oral), 0);

        const subjectsData = subjects.map(sub => {
            const sm = marksMap[sub.id] || {};
            let subTotal = 0;

            const termBreakdowns = terms.map(t => {
                const termScore = sm[t.term_code] || { written: 0, oral: 0, total: 0 };
                subTotal += termScore.total;
                return {
                    term_id: t.id,
                    term_code: t.term_code,
                    term_name: t.term_name,
                    written: termScore.written,
                    oral: termScore.oral,
                    total: termScore.total,
                    max_written: t.max_written,
                    max_oral: t.max_oral
                };
            });

            const subMax = totalMaxPerSubject || 100;
            const subPct = (subTotal / subMax) * 100;
            const gradeInfo = this.calculateGrade(subPct);

            grandTotalMarks += subTotal;
            grandMaxMarks += subMax;

            return {
                subject_id: sub.id,
                subject_name: sub.subject_name,
                term_scores: termBreakdowns,
                grand_total: subTotal,
                max_marks: subMax,
                percentage: parseFloat(subPct.toFixed(2)),
                grade: gradeInfo.grade
            };
        });

        const overallPercentage = grandMaxMarks > 0 ? parseFloat(((grandTotalMarks / grandMaxMarks) * 100).toFixed(2)) : 0;
        const overallGrade = this.calculateGrade(overallPercentage);

        // Calculate class rank
        const peers = db.prepare(`
            SELECT m.student_id, SUM(m.written_marks + m.oral_marks) as peer_total
            FROM marks m
            WHERE m.class = ? AND m.session = ?
            GROUP BY m.student_id
            ORDER BY peer_total DESC
        `).all(student.class, session);

        let classRank = 1;
        const peerIdx = peers.findIndex(p => p.student_id === student.id);
        if (peerIdx >= 0) {
            classRank = peerIdx + 1;
        }

        return {
            institution: profile,
            policy,
            student,
            session,
            terms,
            subjects: subjectsData,
            grand_total: parseFloat(grandTotalMarks.toFixed(1)),
            grand_max: grandMaxMarks,
            overall_percentage: overallPercentage,
            overall_grade: overallGrade.grade,
            overall_remark: overallGrade.remark,
            class_rank: classRank,
            total_students_in_class: peers.length || 1,
            attendance: att
        };
    }

    static getConsolidatedClassSheet(className, session = '2026-27') {
        const db = getDb();
        const policy = this.getExamPolicy();
        const terms = this.getExamTerms();
        const students = db.prepare('SELECT id, admission_no, roll_no, student_name, father_name FROM students WHERE class = ? AND status = \'Active\' ORDER BY CAST(roll_no AS INTEGER) ASC, student_name ASC').all(className);
        const subjects = this.getSubjectsByClass(className);

        const list = students.map(st => {
            const sheet = this.getStudentMarksheet(st.id, session);
            return {
                id: st.id,
                admission_no: st.admission_no,
                roll_no: st.roll_no,
                student_name: st.student_name,
                father_name: st.father_name,
                grand_total: sheet ? sheet.grand_total : 0,
                percentage: sheet ? sheet.overall_percentage : 0,
                grade: sheet ? sheet.overall_grade : 'NI',
                promotion_status: sheet && sheet.attendance ? sheet.attendance.promotion_status : 'Promoted'
            };
        });

        list.sort((a, b) => b.grand_total - a.grand_total);
        list.forEach((item, idx) => {
            item.class_rank = idx + 1;
        });

        list.sort((a, b) => (parseInt(a.roll_no, 10) || 999) - (parseInt(b.roll_no, 10) || 999));

        return {
            class: className,
            session,
            policy,
            terms,
            total_students: list.length,
            subjects,
            students: list
        };
    }
}

module.exports = ExamService;
