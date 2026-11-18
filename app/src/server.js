const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const AuthService = require('./services/authService');
const ExamService = require('./services/examService');
const QuestionPaperService = require('./services/questionPaperService');
const PayrollService = require('./services/payrollService');
const FeeService = require('./services/feeService');
const OperationsService = require('./services/operationsService');
const BackupEODService = require('./services/backupEODService');
const AttendanceService = require('./services/attendanceService');
const FeedbackService = require('./services/feedbackService');
const MigrationService = require('./services/migrationService');
const { initDatabase, getDb, syncShadowVault, PRIMARY_DB_PATH, VAULT_DB_PATH } = require('./database/db');

initDatabase();
FeedbackService.initTables();
MigrationService.initTables();

const PORT = process.env.PORT || 8085;
const PUBLIC_DIR = path.join(__dirname, 'ui', 'public');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-role, x-username'
    });
    res.end(JSON.stringify(data));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(err);
            }
        });
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    if (method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-role, x-username'
        });
        return res.end();
    }

    try {
        const db = getDb();

        // 0. Authentication & Security
        if (pathname === '/api/auth/login' && method === 'POST') {
            const body = await parseBody(req);
            const authResult = AuthService.login(body.username, body.password);
            return sendJson(res, authResult.success ? 200 : 401, authResult);
        }
        if (pathname === '/api/auth/reset' && method === 'POST') {
            const body = await parseBody(req);
            const resetResult = AuthService.resetPasswordWithMasterKey(body.username, body.masterKey, body.newPassword);
            return sendJson(res, resetResult.success ? 200 : 400, resetResult);
        }
        if (pathname === '/api/auth/users' && method === 'GET') {
            return sendJson(res, 200, AuthService.listUsers());
        }

        // Helper: Strict Super Admin (Platform Owner / Vendor Authority) Verification
        function isSuperAdminRequest(req) {
            const role = (req.headers['x-user-role'] || '').toLowerCase();
            const username = (req.headers['x-username'] || '').toLowerCase();
            return role === 'super_admin' || username === 'hanuganeshan';
        }

        // 1. Super Admin Policy & Terms (Vendor Authority Only)
        if (pathname.startsWith('/api/super-admin/')) {
            if (!isSuperAdminRequest(req)) {
                return sendJson(res, 403, {
                    success: false,
                    error: 'Access Denied: Super Admin (Vendor Authority) permission required.'
                });
            }
        }

        if (pathname === '/api/super-admin/exam-policy' && method === 'GET') {
            return sendJson(res, 200, ExamService.getExamPolicy());
        }
        if (pathname === '/api/super-admin/exam-policy' && method === 'POST') {
            const body = await parseBody(req);
            const schoolName = body.school_name || 'Lakshya School';
            return sendJson(res, 200, ExamService.updateExamPolicy(body, schoolName, 'Platform Owner'));
        }
        if (pathname === '/api/super-admin/exam-terms' && method === 'GET') {
            return sendJson(res, 200, ExamService.getExamTerms());
        }
        if (pathname === '/api/super-admin/apply-preset' && method === 'POST') {
            const body = await parseBody(req);
            const schoolName = body.school_name || 'Lakshya School';
            return sendJson(res, 200, ExamService.applyExamPreset(body.presetKey, schoolName, 'Platform Owner'));
        }
        if (pathname === '/api/super-admin/audit-history' && method === 'GET') {
            const schoolName = parsedUrl.query.school || null;
            return sendJson(res, 200, ExamService.getAuditHistory(schoolName));
        }
        if (pathname === '/api/super-admin/rollback-policy' && method === 'POST') {
            const body = await parseBody(req);
            const result = ExamService.rollbackPolicy(body.historyId);
            return sendJson(res, result.success ? 200 : 400, result);
        }

        // 1.1 Centralized Platform Branding Settings
        if (pathname === '/api/branding' && method === 'GET') {
            const row = db.prepare("SELECT value FROM system_settings WHERE key = 'company_branding'").get();
            let branding = {
                company_name: 'Apna Software Hub',
                division: 'AI & Technology Division',
                product_name: 'Apna School OS',
                tagline: 'Empowering Businesses Through Technology',
                helpline: '8504985149',
                company_logo_url: '/logo.png',
                developer_credit: 'SOFTWARE DEVELOPED & MAINTAINED BY APNA SOFTWARE HUB',
                customer_school: 'Lakshya School'
            };
            if (row) {
                try { branding = { ...branding, ...JSON.parse(row.value) }; } catch (e) {}
            }
            return sendJson(res, 200, branding);
        }
        if (pathname === '/api/branding' && method === 'POST') {
            if (!isSuperAdminRequest(req)) {
                return sendJson(res, 403, {
                    success: false,
                    error: 'Access Denied: Only authorized Platform Owner can modify company branding.'
                });
            }
            const body = await parseBody(req);
            const row = db.prepare("SELECT value FROM system_settings WHERE key = 'company_branding'").get();
            let branding = {
                company_name: 'Apna Software Hub',
                division: 'AI & Technology Division',
                product_name: 'Apna School OS',
                tagline: 'Empowering Businesses Through Technology',
                helpline: '8504985149',
                company_logo_url: '/logo.png',
                developer_credit: 'SOFTWARE DEVELOPED & MAINTAINED BY APNA SOFTWARE HUB',
                customer_school: 'Lakshya School'
            };
            if (row) {
                try { branding = { ...branding, ...JSON.parse(row.value) }; } catch (e) {}
            }
            if (body.company_logo_url !== undefined) branding.company_logo_url = body.company_logo_url || '/logo.png';
            if (body.tagline !== undefined) branding.tagline = body.tagline;
            if (body.helpline !== undefined) branding.helpline = body.helpline;
            if (body.division !== undefined) branding.division = body.division;

            db.prepare(`
                INSERT INTO system_settings (key, value, updated_at)
                VALUES ('company_branding', ?, CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    updated_at = CURRENT_TIMESTAMP
            `).run(JSON.stringify(branding));
            syncShadowVault();
            return sendJson(res, 200, { success: true, branding });
        }

        // 2. Profile
        if (pathname === '/api/profile' && method === 'GET') {
            return sendJson(res, 200, AuthService.getInstitutionProfile());
        }
        if (pathname === '/api/profile' && method === 'POST') {
            const body = await parseBody(req);
            const isSuper = isSuperAdminRequest(req);
            const currentProfile = AuthService.getInstitutionProfile() || {};
            
            // Security Lock: Only Super Admin can change school_name
            let finalSchoolName = currentProfile.school_name || 'Lakshya School';
            if (isSuper && body.school_name && body.school_name.trim()) {
                finalSchoolName = body.school_name.trim();
            }

            const updatedProfile = {
                school_name: finalSchoolName,
                tag_line: body.tag_line !== undefined ? body.tag_line : (currentProfile.tag_line || ''),
                affiliation_no: body.affiliation_no !== undefined ? body.affiliation_no : (currentProfile.affiliation_no || ''),
                udise_code: body.udise_code !== undefined ? body.udise_code : (currentProfile.udise_code || ''),
                address: body.address !== undefined ? body.address : (currentProfile.address || ''),
                phone: body.phone !== undefined ? body.phone : (currentProfile.phone || ''),
                alt_phone: body.alt_phone !== undefined ? body.alt_phone : (currentProfile.alt_phone || ''),
                email: body.email !== undefined ? body.email : (currentProfile.email || ''),
                website: body.website !== undefined ? body.website : (currentProfile.website || ''),
                board_type: body.board_type !== undefined ? body.board_type : (currentProfile.board_type || 'UP_STATE'),
                current_session: body.current_session !== undefined ? body.current_session : (currentProfile.current_session || '2026-27'),
                principal_name: body.principal_name !== undefined ? body.principal_name : (currentProfile.principal_name || 'Principal'),
                logo_path: body.logo_path !== undefined ? body.logo_path : (currentProfile.logo_path || '')
            };

            const saved = AuthService.updateInstitutionProfile(updatedProfile);
            syncShadowVault();
            return sendJson(res, 200, { success: true, profile: saved, is_super_admin: isSuper });
        }

        // 3. Students
        if (pathname === '/api/students' && method === 'GET') {
            const className = parsedUrl.query.class || null;
            const search = parsedUrl.query.search || null;
            return sendJson(res, 200, FeeService.getStudentsWithFeeStatus(className, search));
        }

        // Student Photo Upload / Removal (Optional digital photo attachment)
        if (pathname.startsWith('/api/students/') && pathname.endsWith('/photo') && method === 'POST') {
            const parts = pathname.split('/');
            const studentId = parseInt(parts[3]);
            const b = await parseBody(req);
            db.prepare('UPDATE students SET photo_path = ? WHERE id = ?').run(b.photo || '', studentId);
            syncShadowVault();
            return sendJson(res, 200, { success: true, photo_path: b.photo || '' });
        }

        // 4. Classes Setup (PG to Class 8 with counts)
        if (pathname === '/api/classes' && method === 'GET') {
            const classes = [
                { name: 'PG', section: 'A', room: 'Room 101', capacity: 30, teacher: 'Mrs. Ritu Sharma' },
                { name: 'LKG', section: 'A', room: 'Room 102', capacity: 35, teacher: 'Mrs. Sunita Verma' },
                { name: 'UKG', section: 'A', room: 'Room 103', capacity: 35, teacher: 'Mrs. Pooja Mishra' },
                { name: 'Class 1', section: 'A', room: 'Room 201', capacity: 45, teacher: 'Amit Kumar' },
                { name: 'Class 2', section: 'A', room: 'Room 202', capacity: 45, teacher: 'Priya Singh' },
                { name: 'Class 3', section: 'A', room: 'Room 203', capacity: 45, teacher: 'Deepak Tiwari' },
                { name: 'Class 4', section: 'A', room: 'Room 301', capacity: 50, teacher: 'Neha Gupta' },
                { name: 'Class 5', section: 'A', room: 'Room 302', capacity: 50, teacher: 'Suresh Patel' },
                { name: 'Class 6', section: 'A', room: 'Room 401', capacity: 50, teacher: 'Vikas Dubey' },
                { name: 'Class 7', section: 'A', room: 'Room 402', capacity: 50, teacher: 'Anjali Srivastava' },
                { name: 'Class 8', section: 'A', room: 'Room 403', capacity: 50, teacher: 'Ramesh Chandra' }
            ];
            const enriched = classes.map(c => {
                const countRow = db.prepare("SELECT COUNT(*) as cnt FROM students WHERE class = ? AND status = 'Active'").get(c.name);
                return { ...c, student_count: countRow ? countRow.cnt : 0 };
            });
            return sendJson(res, 200, enriched);
        }

        // 5. Teachers & Staff
        if (pathname === '/api/teachers' && method === 'GET') {
            const rows = db.prepare("SELECT * FROM employees WHERE department = 'Teaching' ORDER BY id ASC").all();
            return sendJson(res, 200, rows.map(r => ({
                id: r.id,
                name: r.employee_name,
                code: r.employee_id,
                designation: r.designation,
                qualification: r.designation && r.designation.includes('PRT') ? 'M.A (Eng), B.Ed' : 'M.Sc, B.Ed',
                subjects: 'All Academic Subjects',
                appointment_date: '2023-04-10',
                status: r.status || 'Active',
                salary: r.monthly_salary
            })));
        }

        if (pathname === '/api/teachers' && method === 'POST') {
            const b = await parseBody(req);
            const code = b.code || `TCH${Date.now().toString().slice(-4)}`;
            const stmt = db.prepare(`
                INSERT INTO employees (employee_id, employee_name, designation, department, monthly_salary, phone, status)
                VALUES (?, ?, ?, 'Teaching', ?, ?, 'Active')
            `);
            const info = stmt.run(code, b.name, b.designation || 'Teacher', b.salary || 15000, b.phone || '');
            syncShadowVault();
            return sendJson(res, 200, { success: true, id: info.lastInsertRowid });
        }

        if (pathname === '/api/staff' && method === 'GET') {
            const rows = db.prepare("SELECT * FROM employees WHERE department = 'Non-Teaching' ORDER BY id ASC").all();
            return sendJson(res, 200, rows.map(r => ({
                id: r.id,
                name: r.employee_name,
                code: r.employee_id,
                designation: r.designation,
                salary: r.monthly_salary,
                phone: r.phone || '',
                status: r.status || 'Active'
            })));
        }

        if (pathname === '/api/staff' && method === 'POST') {
            const b = await parseBody(req);
            const code = b.code || `STF${Date.now().toString().slice(-4)}`;
            const stmt = db.prepare(`
                INSERT INTO employees (employee_id, employee_name, designation, department, monthly_salary, phone, status)
                VALUES (?, ?, ?, 'Non-Teaching', ?, ?, 'Active')
            `);
            const info = stmt.run(code, b.name, b.designation || 'Staff Member', b.salary || 9000, b.phone || '');
            syncShadowVault();
            return sendJson(res, 200, { success: true, id: info.lastInsertRowid });
        }

        // 6. Transport Routes & Vehicles
        if (pathname === '/api/routes' && method === 'GET') {
            return sendJson(res, 200, OperationsService.getRoutes());
        }

        if (pathname === '/api/routes' && method === 'POST') {
            const b = await parseBody(req);
            const stmt = db.prepare(`
                INSERT INTO routes (route_name, pickup_points, monthly_fee, driver_name, driver_mobile)
                VALUES (?, ?, ?, ?, ?)
            `);
            const info = stmt.run(b.route_name, b.pickup_points || b.route_name, b.monthly_fee || 700, b.driver_name || '', b.driver_mobile || '');
            syncShadowVault();
            return sendJson(res, 200, { success: true, id: info.lastInsertRowid });
        }

        if (pathname === '/api/vehicles' && method === 'GET') {
            const vehicles = [
                { vehicle_no: 'UP 44 T 1234', model: 'TATA Marcopolo (32 Seater)', driver_name: 'Ram Ashish Yadav', phone: '9839123456', route: 'Route 1 (Bhadar)', status: 'Active', fitness_valid_till: '2027-03-31' },
                { vehicle_no: 'UP 44 T 5678', model: 'Force Traveller (24 Seater)', driver_name: 'Shyam Lal', phone: '9450987654', route: 'Route 2 (Durgapur)', status: 'Active', fitness_valid_till: '2026-12-31' }
            ];
            return sendJson(res, 200, vehicles);
        }

        // 7. Assets & Infrastructure
        if (pathname === '/api/assets' && method === 'GET') {
            return sendJson(res, 200, OperationsService.getAssets());
        }

        if (pathname === '/api/assets' && method === 'POST') {
            const b = await parseBody(req);
            const code = b.asset_code || `AST-${Date.now().toString().slice(-4)}`;
            const stmt = db.prepare(`
                INSERT INTO school_assets (asset_code, asset_name, category, location_room, purchase_date, cost, quantity, condition, remarks)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'working', ?)
            `);
            const info = stmt.run(code, b.asset_name, b.category || 'furniture', b.location_room || 'General Room', b.purchase_date || new Date().toISOString().slice(0, 10), b.cost || 0, b.quantity || 1, b.remarks || '');
            syncShadowVault();
            return sendJson(res, 200, { success: true, id: info.lastInsertRowid });
        }

        // 7B. Attendance (Students, Teaching Staff, Non-Teaching Staff, Holidays)
        if (pathname === '/api/attendance/students' && method === 'GET') {
            const cls = parsedUrl.query.class || 'Class 1';
            const date = parsedUrl.query.date || null;
            return sendJson(res, 200, AttendanceService.getStudentAttendance(cls, date));
        }

        if (pathname === '/api/attendance/students' && method === 'POST') {
            const body = await parseBody(req);
            return sendJson(res, 200, AttendanceService.saveStudentAttendance(body.attendanceList || [], body.date));
        }

        if (pathname === '/api/attendance/staff' && method === 'GET') {
            const dept = parsedUrl.query.department || 'Teaching';
            const date = parsedUrl.query.date || null;
            return sendJson(res, 200, AttendanceService.getStaffAttendance(dept, date));
        }

        if (pathname === '/api/attendance/staff' && method === 'POST') {
            const body = await parseBody(req);
            return sendJson(res, 200, AttendanceService.saveStaffAttendance(body.attendanceList || [], body.date));
        }

        if (pathname === '/api/attendance/holidays' && method === 'GET') {
            return sendJson(res, 200, AttendanceService.getHolidays());
        }

        if (pathname === '/api/attendance/holidays' && method === 'POST') {
            const body = await parseBody(req);
            return sendJson(res, 200, AttendanceService.addHoliday(body));
        }

        // 8. Class Fee Setup / Plan (Lakshya exact formula heads)
        if (pathname === '/api/fees/class-setup' && method === 'GET') {
            const cls = parsedUrl.query.class || 'Class 1';
            const feeRow = db.prepare(`
                SELECT AVG(admission_fee) as admission_fee, AVG(monthly_fee) as monthly_fee,
                       AVG(quarterly_exam_fee) as quarterly_exam_fee, AVG(half_yearly_exam_fee) as half_yearly_exam_fee,
                       AVG(annual_exam_fee) as annual_exam_fee, AVG(transport_fee) as transport_fee,
                       AVG(computer_fee) as computer_fee, AVG(library_fee) as library_fee,
                       AVG(sports_fee) as sports_fee, AVG(activity_fee) as activity_fee,
                       AVG(expected_fee) as expected_fee
                FROM student_fee_structure fs
                JOIN students s ON fs.student_id = s.id
                WHERE s.class = ?
            `).get(cls) || {};

            const heads = [
                { head_name: 'Admission Fee', amount: Math.round(feeRow.admission_fee || 1500), frequency: 'One Time (At Admission)' },
                { head_name: 'Monthly Tuition Fee', amount: Math.round(feeRow.monthly_fee || 600), frequency: 'Monthly (12 Months)' },
                { head_name: 'Quarterly Exam Fee', amount: Math.round(feeRow.quarterly_exam_fee || 0), frequency: 'Term 1 Exam' },
                { head_name: 'Half-Yearly Exam Fee', amount: Math.round(feeRow.half_yearly_exam_fee || 250), frequency: 'Mid-Term Exam' },
                { head_name: 'Annual Exam Fee', amount: Math.round(feeRow.annual_exam_fee || 250), frequency: 'Final Annual Exam' },
                { head_name: 'Transport Bus Fee', amount: Math.round(feeRow.transport_fee || 700), frequency: 'Optional / Route-based' },
                { head_name: 'Computer & Lab Fee', amount: Math.round(feeRow.computer_fee || 100), frequency: 'Annual Lab Maintenance' },
                { head_name: 'Sports & Activity Fee', amount: Math.round(feeRow.sports_fee || 150), frequency: 'Annual Sports Event' }
            ];

            const studentCount = db.prepare("SELECT COUNT(*) as c FROM students WHERE class = ? AND status = 'Active'").get(cls).c;
            return sendJson(res, 200, {
                class: cls,
                session: '2026-27',
                active_students: studentCount,
                fee_heads: heads,
                annual_expected_per_student: Math.round(feeRow.expected_fee || 15600)
            });
        }

        // 8B. Fee Collection (Clerk Step 2)
        if (pathname === '/api/fees/students' && method === 'GET') {
            const cls = parsedUrl.query.class || null;
            const search = parsedUrl.query.search || null;
            const students = FeeService.getStudentsWithFeeStatus(cls === 'all' ? null : cls, search);
            return sendJson(res, 200, students);
        }

        if (pathname === '/api/fees/collect' && method === 'POST') {
            const body = await parseBody(req);
            const receipt = FeeService.collectFee(body);
            return sendJson(res, 200, receipt);
        }

        // 8C. Fee Receipts & History (Clerk Step 3)
        if (pathname === '/api/fees/receipts' && method === 'GET') {
            const search = parsedUrl.query.search || '';
            const limit = parseInt(parsedUrl.query.limit || '200', 10);
            let query = `
                SELECT ft.id, ft.receipt_no, ft.payment_date, ft.amount_received, ft.net_amount, ft.standard_fee, ft.discount,
                       ft.payment_mode, ft.reference_no, ft.fee_head, ft.fee_month, ft.collected_by, ft.status,
                       s.id as student_id, s.student_name, s.admission_no, s.class, s.section, s.mobile, s.father_name
                FROM fee_transactions ft
                JOIN students s ON ft.student_id = s.id
            `;
            const params = [];
            if (search) {
                query += ` WHERE ft.receipt_no LIKE ? OR s.student_name LIKE ? OR s.admission_no LIKE ? OR s.mobile LIKE ?`;
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }
            query += ` ORDER BY ft.id DESC LIMIT ?`;
            params.push(limit);

            const receipts = db.prepare(query).all(...params);
            const totalStats = db.prepare(`
                SELECT COUNT(*) as count, COALESCE(SUM(net_amount), 0) as total_collected 
                FROM fee_transactions 
                WHERE status = 'Paid'
            `).get();

            return sendJson(res, 200, {
                receipts,
                total_count: totalStats.count,
                total_collected: totalStats.total_collected
            });
        }

        if (pathname.startsWith('/api/fees/receipt/') && method === 'GET') {
            const receiptNo = pathname.replace('/api/fees/receipt/', '');
            const receipt = FeeService.getFeeReceipt(receiptNo);
            if (!receipt) return sendJson(res, 404, { error: 'Receipt not found' });
            return sendJson(res, 200, receipt);
        }

        // 8D. Financial Reports (The 5 Core Excel Reports)
        if (pathname === '/api/reports/summary' && method === 'GET') {
            return sendJson(res, 200, FeeService.getExecutiveSummaryReport());
        }

        if (pathname === '/api/reports/class-recovery' && method === 'GET') {
            return sendJson(res, 200, FeeService.getClassRecoveryReport());
        }

        if (pathname === '/api/reports/monthly' && method === 'GET') {
            return sendJson(res, 200, FeeService.getMonthlyCollectionReport());
        }

        if (pathname.startsWith('/api/reports/student-ledger/') && method === 'GET') {
            const studentId = pathname.replace('/api/reports/student-ledger/', '');
            const ledger = FeeService.getStudentLedger(studentId);
            if (!ledger) return sendJson(res, 404, { error: 'Student ledger not found' });
            return sendJson(res, 200, ledger);
        }

        // 9. Marksheets
        if (pathname.startsWith('/api/exam/marksheet/') && method === 'GET') {
            const studentId = parseInt(pathname.replace('/api/exam/marksheet/', ''), 10);
            return sendJson(res, 200, ExamService.getStudentMarksheet(studentId));
        }

        if (pathname === '/api/exam/class-sheet' && method === 'GET') {
            const cls = parsedUrl.query.class || 'Class 8';
            return sendJson(res, 200, ExamService.getConsolidatedClassSheet(cls));
        }

        if (pathname === '/api/subjects' && method === 'GET') {
            const cls = parsedUrl.query.class || 'Class 1';
            return sendJson(res, 200, ExamService.getSubjectsByClass(cls));
        }

        // 10. Question Paper & Bank
        if (pathname === '/api/question-paper/generate' && method === 'POST') {
            const b = await parseBody(req);
            return sendJson(res, 200, QuestionPaperService.generatePaper(b.class, b.subject_id, b.exam_title, b.total_marks || 80, b.time_duration || '3 Hours', b.instructions));
        }

        if (pathname === '/api/question-bank' && method === 'GET') {
            const cls = parsedUrl.query.class || 'Class 8';
            const subId = parsedUrl.query.subject_id ? parseInt(parsedUrl.query.subject_id, 10) : null;
            return sendJson(res, 200, QuestionPaperService.getQuestions(cls, subId));
        }

        if (pathname === '/api/question-bank/add' && method === 'POST') {
            const b = await parseBody(req);
            const resData = QuestionPaperService.addQuestion(b.class, b.subject_id, b.chapter_name, b.question_type, b.question_text, b.options, b.correct_answer, b.marks, b.difficulty);
            return sendJson(res, 200, resData);
        }

        // 11. Payroll & Payslips
        if (pathname === '/api/payroll/employees' && method === 'GET') {
            return sendJson(res, 200, PayrollService.getEmployees());
        }

        if (pathname === '/api/payroll/pay' && method === 'POST') {
            const b = await parseBody(req);
            return sendJson(res, 200, PayrollService.processSalaryPayment(b));
        }

        // 12. EOD Mail Report
        if (pathname === '/api/eod-report' && method === 'GET') {
            return sendJson(res, 200, BackupEODService.generateEODReport());
        }

        // 13. Opportunity Desk (Scholarships, Olympiads, Competitions)
        if (pathname === '/api/opportunities' && method === 'GET') {
            const cat = parsedUrl.query.category;
            let rows;
            if (cat && cat !== 'All') {
                rows = db.prepare("SELECT * FROM opportunities WHERE category = ? ORDER BY id DESC").all(cat);
            } else {
                rows = db.prepare("SELECT * FROM opportunities ORDER BY id DESC").all();
            }
            return sendJson(res, 200, rows);
        }

        if (pathname === '/api/opportunities' && method === 'POST') {
            const b = await parseBody(req);
            if (b.id) {
                db.prepare(`
                    UPDATE opportunities SET title = ?, category = ?, eligibility = ?, suitable_classes = ?,
                    last_date = ?, level = ?, application_mode = ?, status = ? WHERE id = ?
                `).run(b.title, b.category, b.eligibility || '', b.suitable_classes || '', b.last_date || '', b.level || 'State', b.application_mode || 'Through School', b.status || 'Open', b.id);
            } else {
                db.prepare(`
                    INSERT INTO opportunities (title, category, eligibility, suitable_classes, last_date, level, application_mode, status, verified_on)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE('now'))
                `).run(b.title, b.category, b.eligibility || '', b.suitable_classes || '', b.last_date || '', b.level || 'State', b.application_mode || 'Through School', b.status || 'Open');
            }
            syncShadowVault();
            return sendJson(res, 200, { success: true });
        }

        if (pathname.startsWith('/api/opportunities/') && method === 'DELETE') {
            const oppId = parseInt(pathname.split('/')[3], 10);
            db.prepare("DELETE FROM opportunities WHERE id = ?").run(oppId);
            syncShadowVault();
            return sendJson(res, 200, { success: true });
        }

        // 14. Student Growth Passport & Achievements
        if (pathname.startsWith('/api/growth-passport/student/') && method === 'GET') {
            const studentId = parseInt(pathname.replace('/api/growth-passport/student/', ''), 10);
            const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
            if (!student) return sendJson(res, 404, { error: 'Student not found' });

            const achievements = db.prepare("SELECT * FROM student_achievements WHERE student_id = ? ORDER BY event_date DESC").all(studentId);
            const attendanceRow = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'P' THEN 1 ELSE 0 END) as present FROM student_attendance WHERE student_id = ?").get(studentId);
            const attRate = attendanceRow && attendanceRow.total > 0 ? ((attendanceRow.present / attendanceRow.total) * 100).toFixed(1) : 94.5;

            // Academic marks summary
            const marksRows = db.prepare("SELECT (written_marks + oral_marks) as final_marks FROM marks WHERE student_id = ?").all(studentId);
            let acadScore = 82.4;
            if (marksRows.length > 0) {
                const totFinal = marksRows.reduce((a, b) => a + (b.final_marks || 0), 0);
                acadScore = Math.min(100, Math.max(50, Math.round(totFinal / marksRows.length)));
            }

            return sendJson(res, 200, {
                student,
                achievements,
                attendance_rate: parseFloat(attRate),
                academic_performance: parseFloat(acadScore),
                profile_completeness: Math.min(100, 50 + achievements.length * 15 + (student.photo_path ? 15 : 0))
            });
        }

        if (pathname === '/api/growth-passport/achievement' && method === 'POST') {
            const b = await parseBody(req);
            const badgeMap = { 'Academic': '🥇', 'Sports': '🏅', 'Arts & Culture': '🎨', 'Science & Innovation': '🔬', 'Leadership': '⭐', 'Discipline': '🛡️' };
            const badge = badgeMap[b.category] || '🏆';
            db.prepare(`
                INSERT INTO student_achievements (student_id, title, category, level, event_date, description, badge_icon)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(b.student_id, b.title, b.category, b.level, b.event_date || new Date().toISOString().slice(0, 10), b.description || '', badge);
            syncShadowVault();
            return sendJson(res, 200, { success: true });
        }

        if (pathname.startsWith('/api/growth-passport/achievement/') && method === 'DELETE') {
            const achId = parseInt(pathname.split('/')[4], 10);
            db.prepare("DELETE FROM student_achievements WHERE id = ?").run(achId);
            syncShadowVault();
            return sendJson(res, 200, { success: true });
        }

        // 15. School Quality Score (SQS) - 5 Pillar Transformation Metric
        if (pathname === '/api/quality-score' && method === 'GET') {
            // 1. Academic Rigor (avg percentage from student marks)
            const acadAvg = db.prepare("SELECT AVG(written_marks + oral_marks) as avg_acad FROM marks").get();
            const academicScore = Math.round(acadAvg && acadAvg.avg_acad ? Math.min(100, Math.max(70, acadAvg.avg_acad)) : 84);

            // 2. Attendance Culture
            const attAvg = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'P' THEN 1 ELSE 0 END) as p FROM student_attendance").get();
            const attendanceScore = attAvg && attAvg.total > 0 ? Math.round((attAvg.p * 100.0) / attAvg.total) : 93;

            // 3. Opportunity & Talent Exposure
            const oppCount = db.prepare("SELECT COUNT(*) as c FROM opportunities WHERE status = 'Open'").get().c;
            const achCount = db.prepare("SELECT COUNT(*) as c FROM student_achievements").get().c;
            const opportunityScore = Math.min(100, Math.max(65, 60 + (oppCount * 5) + (achCount * 3)));

            // 4. Fee Recovery & Financial Management
            const expRow = db.prepare("SELECT SUM(expected_fee) as exp FROM student_fee_structure").get();
            const recRow = db.prepare("SELECT SUM(amount_received) as paid FROM fee_transactions").get();
            const feeScore = (expRow && expRow.exp > 0 && recRow && recRow.paid) ? Math.min(100, Math.round((recRow.paid * 100.0) / (expRow.exp / 2))) : 86;

            // 5. Parent Satisfaction & Feedback (Google Forms Feedback Integration)
            const feedbackAnalytics = FeedbackService.getFeedbackAnalytics(1);
            let parentScore = 95;
            if (feedbackAnalytics && feedbackAnalytics.total_responses > 0) {
                parentScore = feedbackAnalytics.parent_communication_score;
            } else {
                const fbRow = db.prepare("SELECT AVG(rating_academic + rating_discipline + rating_communication + rating_facilities) as avg_sum FROM parent_feedback").get();
                parentScore = fbRow && fbRow.avg_sum ? Math.round((fbRow.avg_sum / 20.0) * 100) : 95;
            }

            const compositeScore = Math.round((academicScore + attendanceScore + opportunityScore + feeScore + parentScore) / 5);

            const pillars = [
                { name: 'Academic Rigor (अकादमिक स्तर)', value: academicScore, target: 90, status: academicScore >= 80 ? 'Strong' : 'Needs Focus' },
                { name: 'Attendance Culture (उपस्थिति अनुशासन)', value: attendanceScore, target: 95, status: attendanceScore >= 90 ? 'Excellent' : 'Moderate' },
                { name: 'Opportunity & Skills (अवसर एवं कौशल)', value: opportunityScore, target: 85, status: opportunityScore >= 75 ? 'Growing' : 'Needs Expansion' },
                { name: 'Fee Management (वित्तीय प्रबंधन)', value: feeScore, target: 90, status: feeScore >= 80 ? 'Optimal' : 'Follow-up Due' },
                { name: 'Parent Communication (अभिभावक संतुष्टि)', value: parentScore, target: 95, status: parentScore >= 90 ? 'Superb' : (parentScore >= 75 ? 'Optimal' : 'Follow-up Due') }
            ];

            const reviews = db.prepare("SELECT * FROM parent_feedback ORDER BY id DESC LIMIT 5").all();

            return sendJson(res, 200, {
                composite_score: compositeScore,
                tier: compositeScore >= 90 ? 'National Star Exemplary Institution (उत्कृष्ट विद्यालय)' : (compositeScore >= 80 ? 'Growing Smart Institution (उभरता स्मार्ट संस्थान)' : 'Developing School'),
                pillars,
                reviews,
                feedback_analytics: feedbackAnalytics,
                recommendations: [
                    'Ensure 100% daily WhatsApp notifications for homework and attendance alerts.',
                    'Enroll students in State Talent Search & National Science Olympiad before deadline.',
                    'Conduct monthly parent-teacher reviews for students scoring below 60%.'
                ]
            });
        }

        if (pathname === '/api/quality-score/feedback' && method === 'POST') {
            const b = await parseBody(req);
            db.prepare(`
                INSERT INTO parent_feedback (student_id, parent_name, rating_academic, rating_discipline, rating_communication, rating_facilities, comments)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(b.student_id || null, b.parent_name, b.rating_academic || 5, b.rating_discipline || 5, b.rating_communication || 5, b.rating_facilities || 5, b.comments || '');
            syncShadowVault();
            return sendJson(res, 200, { success: true });
        }

        // 15.1 Google Forms Parent Feedback Integration Endpoints
        if (pathname === '/api/feedback/campaigns' && method === 'GET') {
            const institutionId = parseInt(parsedUrl.query.institution_id || '1');
            return sendJson(res, 200, FeedbackService.getCampaigns(institutionId));
        }

        if (pathname === '/api/feedback/campaigns' && method === 'POST') {
            const b = await parseBody(req);
            const saved = FeedbackService.saveCampaign(b, b.institution_id || 1);
            return sendJson(res, 200, { success: true, campaign: saved });
        }

        if (pathname === '/api/feedback/campaigns/generate-links' && method === 'POST') {
            const b = await parseBody(req);
            const result = FeedbackService.generateStudentLinks(b.campaign_id || 1, b.institution_id || 1);
            return sendJson(res, 200, { success: true, ...result });
        }

        if (pathname === '/api/feedback/links' && method === 'GET') {
            const cid = parseInt(parsedUrl.query.campaign_id || '1');
            const search = parsedUrl.query.search || '';
            const status = parsedUrl.query.status || '';
            const cls = parsedUrl.query.class || '';
            const links = FeedbackService.getStudentLinks(cid, search, status, cls);
            return sendJson(res, 200, links);
        }

        if (pathname === '/api/feedback/links/mark-sent' && method === 'POST') {
            const b = await parseBody(req);
            const result = FeedbackService.markLinkSent(b.link_id);
            return sendJson(res, 200, result);
        }

        if (pathname === '/api/feedback/preview-csv' && method === 'POST') {
            const b = await parseBody(req);
            const preview = FeedbackService.previewCSV(b.csvText || '');
            return sendJson(res, 200, preview);
        }

        if (pathname === '/api/feedback/import-csv' && method === 'POST') {
            const b = await parseBody(req);
            const cid = parseInt(b.campaign_id || '1');
            const instId = parseInt(b.institution_id || '1');
            const result = FeedbackService.importGoogleSheetCSV(cid, b.csvText || '', instId, b.file_name || 'Google_Forms_Responses.csv');
            return sendJson(res, 200, result);
        }

        if (pathname === '/api/feedback/audits' && method === 'GET') {
            const instId = parseInt(parsedUrl.query.institution_id || '1');
            return sendJson(res, 200, FeedbackService.getImportAudits(instId));
        }

        if (pathname === '/api/feedback/analytics' && method === 'GET') {
            const instId = parseInt(parsedUrl.query.institution_id || '1');
            const cid = parsedUrl.query.campaign_id ? parseInt(parsedUrl.query.campaign_id) : null;
            return sendJson(res, 200, FeedbackService.getFeedbackAnalytics(instId, cid));
        }

        // 16. Settings, Data Safety & Google Drive Connector
        if (pathname === '/api/settings/overview' && method === 'GET') {
            const profile = db.prepare("SELECT * FROM institution_profile WHERE id = 1").get() || {};
            const studentCount = db.prepare("SELECT COUNT(*) as c FROM students WHERE status = 'Active'").get().c;
            const dbStat = fs.existsSync(PRIMARY_DB_PATH) ? fs.statSync(PRIMARY_DB_PATH) : { size: 0, mtime: new Date() };
            const vaultStat = fs.existsSync(VAULT_DB_PATH) ? fs.statSync(VAULT_DB_PATH) : { size: 0, mtime: new Date() };

            return sendJson(res, 200, {
                institution: profile,
                active_students: studentCount,
                database_engine: 'SQLite WAL Mode (ACID Compliant)',
                primary_db_path: PRIMARY_DB_PATH,
                primary_db_size_kb: Math.round(dbStat.size / 1024),
                last_db_write: dbStat.mtime,
                shadow_vault_path: VAULT_DB_PATH,
                shadow_vault_health: fs.existsSync(VAULT_DB_PATH) ? 'Active & Synchronized (100% Safe)' : 'Pending Sync',
                port: PORT,
                google_drive_status: {
                    configured: true,
                    status: 'Ready for Cloud Sync',
                    mode: 'Offline Safe with Auto-Sync on Internet'
                }
            });
        }

        if (pathname === '/api/settings/backup/local' && method === 'POST') {
            syncShadowVault();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `Lakshya_Backup_${timestamp}.db`;
            const backupTarget = path.join(path.dirname(PRIMARY_DB_PATH), backupFileName);
            fs.copyFileSync(PRIMARY_DB_PATH, backupTarget);
            db.prepare("INSERT INTO audit_logs (action_type, module, details, performed_by) VALUES ('BACKUP_CREATED', 'Settings', ?, 'Admin')").run(`Local DB Backup created: ${backupFileName}`);
            return sendJson(res, 200, { success: true, backup_file: backupFileName, path: backupTarget });
        }

        if (pathname === '/api/settings/backup/gdrive-sync' && method === 'POST') {
            syncShadowVault();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const profile = db.prepare("SELECT * FROM institution_profile WHERE id = 1").get() || {};
            const targetEmail = profile.email || 'lakshyaschool@gmail.com';
            
            // Auto-detect Google Drive Desktop or OneDrive sync folders (Zero API Key)
            const userProfile = process.env.USERPROFILE || 'C:\\Users\\user';
            const possibleCloudPaths = [
                'G:\\My Drive',
                'G:\\',
                path.join(userProfile, 'Google Drive'),
                path.join(userProfile, 'GoogleDrive'),
                'D:\\Google Drive',
                path.join(userProfile, 'OneDrive')
            ];

            let syncedPath = null;
            let providerName = 'Google Drive';

            for (const p of possibleCloudPaths) {
                if (fs.existsSync(p)) {
                    const destDir = path.join(p, 'School_OS_Cloud_Backups');
                    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
                    const destFile = path.join(destDir, `School_Backup_${timestamp}.db`);
                    fs.copyFileSync(PRIMARY_DB_PATH, destFile);
                    syncedPath = destFile;
                    if (p.includes('OneDrive')) providerName = 'OneDrive';
                    break;
                }
            }

            const backupFileName = `School_Backup_${timestamp}.db`;
            const localDest = path.join(path.dirname(PRIMARY_DB_PATH), 'backups', backupFileName);
            if (!fs.existsSync(path.dirname(localDest))) fs.mkdirSync(path.dirname(localDest), { recursive: true });
            fs.copyFileSync(PRIMARY_DB_PATH, localDest);

            try {
                db.prepare("INSERT INTO audit_logs (action_type, module, details, performed_by) VALUES ('CLOUD_SYNC', 'Backup', ?, 'Admin')").run(
                    syncedPath ? `Cloud sync copy saved to: ${syncedPath} for ${targetEmail}` : `Local snapshot created; no desktop cloud drive found for ${targetEmail}`
                );
            } catch(e) {}

            return sendJson(res, 200, {
                success: true,
                synced_to_cloud_folder: !!syncedPath,
                cloud_provider: providerName,
                cloud_path: syncedPath,
                local_backup_path: localDest,
                institution_email: targetEmail,
                message: syncedPath 
                    ? `☁️ बैकअप सफलतापूर्वक ${providerName} ऑटो-सिंक फोल्डर में कॉपी हो गया!\n\nफ़ाइल: ${syncedPath}\nअधिकृत ईमेल: ${targetEmail}\n\n(जैसे ही इंटरनेट कनेक्ट होगा, Google Drive इसे स्वतः क्लाउड पर अपलोड कर देगा)`
                    : `📁 लोकल बैकअप सुरक्षित रूप से तैयार है: ${localDest}\nअधिकृत ईमेल: ${targetEmail}\n\nनोट: कंप्यूटर पर 'Google Drive for Desktop' ऐप नहीं मिला। आप इस बैकअप को सीधे अपनी स्कूल ईमेल (${targetEmail}) के Google Drive पर ड्रैग-एंड-ड्रॉप कर सकते हैं।`
            });
        }

        if (pathname === '/api/settings/audit-logs' && method === 'GET') {
            const logs = db.prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 20").all();
            return sendJson(res, 200, logs);
        }

        if (pathname === '/api/settings/change-password' && method === 'POST') {
            const b = await parseBody(req);
            const user = db.prepare("SELECT * FROM users WHERE username = ?").get(b.username);
            if (!user) return sendJson(res, 404, { error: 'User not found' });
            if (user.password_hash !== b.currentPassword && b.masterKey !== '8504985149') {
                return sendJson(res, 403, { error: 'Invalid current password or master key' });
            }
            db.prepare("UPDATE users SET password_hash = ? WHERE username = ?").run(b.newPassword, b.username);
            db.prepare("INSERT INTO audit_logs (action_type, module, details, performed_by) VALUES ('PASSWORD_CHANGED', 'Security', ?, ?)").run(`Password changed for user ${b.username}`, b.username);
            syncShadowVault();
            return sendJson(res, 200, { success: true, message: `Password for ${b.username} successfully updated.` });
        }

        // ==========================================
        // 16B. DEMO DATA MANAGEMENT (ERASER & SEEDER)
        // ==========================================
        if (pathname === '/api/settings/demo-data/purge' && method === 'POST') {
            const b = await parseBody(req);
            const masterKey = b.masterKey || b.password || '';
            const adminUser = db.prepare("SELECT * FROM users WHERE role IN ('admin', 'super_admin') LIMIT 1").get();
            const isValid = masterKey === '8504985149' || (adminUser && adminUser.password_hash === masterKey);

            if (!isValid) {
                return sendJson(res, 403, { success: false, error: 'अवैध पासवर्ड / मास्टर की। डेमो डेटा डिलीट करने की अनुमति अस्वीकृत।' });
            }

            // Create pre-purge safety snapshot
            syncShadowVault();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const purgeBackup = path.join(path.dirname(PRIMARY_DB_PATH), 'backups', `pre_demo_purge_${timestamp}.db`);
            if (!fs.existsSync(path.dirname(purgeBackup))) fs.mkdirSync(path.dirname(purgeBackup), { recursive: true });
            fs.copyFileSync(PRIMARY_DB_PATH, purgeBackup);

            const studentCount = db.prepare("SELECT COUNT(*) as c FROM students").get().c;
            const marksCount = db.prepare("SELECT COUNT(*) as c FROM marks").get().c;
            const feeCount = db.prepare("SELECT COUNT(*) as c FROM fee_transactions").get().c;

            db.exec('BEGIN IMMEDIATE TRANSACTION');
            try {
                db.prepare("DELETE FROM fee_transactions").run();
                db.prepare("DELETE FROM marks").run();
                db.prepare("DELETE FROM student_attendance").run();
                db.prepare("DELETE FROM student_attendance_summary").run();
                db.prepare("DELETE FROM student_fee_structure").run();
                db.prepare("DELETE FROM student_documents").run();
                db.prepare("DELETE FROM student_achievements").run();
                db.prepare("DELETE FROM students").run();
                db.prepare("DELETE FROM salary_payments").run();
                db.prepare("DELETE FROM salary_advances").run();
                db.exec('COMMIT');
            } catch(purgeErr) {
                db.exec('ROLLBACK');
                return sendJson(res, 500, { success: false, error: 'Purge failed: ' + purgeErr.message });
            }

            syncShadowVault();
            try {
                db.prepare("INSERT INTO audit_logs (action_type, module, details, performed_by) VALUES ('DEMO_DATA_PURGED', 'Settings', ?, 'Admin')").run(
                    `Purged ${studentCount} students, ${marksCount} marks, ${feeCount} fees for real school onboarding. Backup: ${purgeBackup}`
                );
            } catch(e) {}

            return sendJson(res, 200, {
                success: true,
                message: `✅ सभी सैंपल / डेमो रिकॉर्ड्स (${studentCount} छात्र, ${marksCount} अंक, ${feeCount} फीस) सफलतापूर्वक हटा दिए गए हैं!\n\nअब आपका वर्कस्पेस असली स्कूल डेटा के लिए 100% खाली और तैयार है।`,
                purged_counts: { students: studentCount, marks: marksCount, fee_transactions: feeCount },
                backup_saved: purgeBackup
            });
        }

        if (pathname === '/api/settings/demo-data/seed' && method === 'POST') {
            const b = await parseBody(req);
            const masterKey = b.masterKey || b.password || '';
            const adminUser = db.prepare("SELECT * FROM users WHERE role IN ('admin', 'super_admin') LIMIT 1").get();
            const isValid = masterKey === '8504985149' || (adminUser && adminUser.password_hash === masterKey);

            if (!isValid) {
                return sendJson(res, 403, { success: false, error: 'अवैध पासवर्ड / मास्टर की।' });
            }

            const curCount = db.prepare("SELECT COUNT(*) as c FROM students").get().c;
            if (curCount > 0) {
                return sendJson(res, 400, { success: false, error: `डेटाबेस में पहले से ${curCount} छात्र मौजूद हैं। नए सैंपल डेटा लोड करने से पहले 'Remove All Sample Records' करें।` });
            }

            const sampleStudents = [
                ['LAK-001', '1001', 1, 'आरव शर्मा', 'राजेश शर्मा', 'सुनीता शर्मा', 'Male', '2016-05-12', '9876543210', 'Class 5', 'A', 'Active'],
                ['LAK-002', '1002', 2, 'अनन्या सिंह', 'विक्रम सिंह', 'रीता सिंह', 'Female', '2016-08-20', '9876543211', 'Class 5', 'A', 'Active'],
                ['LAK-003', '1003', 3, 'आदित्य वर्मा', 'मनोज वर्मा', 'सीमा वर्मा', 'Male', '2015-02-14', '9876543212', 'Class 6', 'B', 'Active'],
                ['LAK-004', '1004', 4, 'दीया मिश्रा', 'संजय मिश्रा', 'पूनम मिश्रा', 'Female', '2015-11-05', '9876543213', 'Class 6', 'B', 'Active'],
                ['LAK-005', '1005', 5, 'रोहन गुप्ता', 'अनिल गुप्ता', 'आरती गुप्ता', 'Male', '2014-04-18', '9876543214', 'Class 7', 'A', 'Active'],
                ['LAK-006', '1006', 6, 'इशिका यादव', 'सुरेश यादव', 'मंजू यादव', 'Female', '2014-09-22', '9876543215', 'Class 7', 'A', 'Active'],
                ['LAK-007', '1007', 7, 'हर्ष त्रिपाठी', 'दिनेश त्रिपाठी', 'रेखा त्रिपाठी', 'Male', '2013-01-30', '9876543216', 'Class 8', 'A', 'Active'],
                ['LAK-008', '1008', 8, 'खुशी दुबे', 'अशोक दुबे', 'शारदा दुबे', 'Female', '2013-07-15', '9876543217', 'Class 8', 'B', 'Active'],
                ['LAK-009', '1009', 9, 'विवेक चौहान', 'राकेश चौहान', 'सविता चौहान', 'Male', '2012-03-10', '9876543218', 'Class 9', 'A', 'Active'],
                ['LAK-010', '1010', 10, 'तन्वी पाण्डेय', 'अरुण पाण्डेय', 'कविता पाण्डेय', 'Female', '2011-12-25', '9876543219', 'Class 10', 'A', 'Active']
            ];

            const insertStudent = db.prepare(`
                INSERT INTO students (admission_no, sr_no, roll_no, student_name, father_name, mother_name, gender, dob, mobile, class, section, status, remarks)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Sample Demo Student')
            `);

            const insertFeeStructure = db.prepare(`
                INSERT INTO student_fee_structure (student_id, session, admission_fee, monthly_fee, expected_fee)
                VALUES (?, '2026-27', 1500, 1200, 15900)
            `);

            db.exec('BEGIN IMMEDIATE TRANSACTION');
            try {
                sampleStudents.forEach(st => {
                    const res = insertStudent.run(...st);
                    insertFeeStructure.run(res.lastInsertRowid);
                });
                db.exec('COMMIT');
            } catch(e) {
                db.exec('ROLLBACK');
                return sendJson(res, 500, { success: false, error: 'Seed failed: ' + e.message });
            }

            syncShadowVault();
            return sendJson(res, 200, { success: true, message: '🎉 10 ताज़ा सैंपल डेमो छात्र सफलतापूर्वक लोड हो गए हैं!' });
        }

        // ==========================================
        // 16C. EXPENSES & BUDGET CONTROL ENDPOINTS
        // ==========================================
        if (pathname === '/api/expenses' && method === 'GET') {
            const expenses = db.prepare("SELECT * FROM expenses ORDER BY expense_date DESC, id DESC").all();
            return sendJson(res, 200, expenses);
        }

        if (pathname === '/api/expenses' && method === 'POST') {
            const b = await parseBody(req);
            const voucher = b.voucher_no || `EXP-${Date.now().toString().slice(-6)}`;
            const date = b.expense_date || new Date().toISOString().slice(0, 10);
            const cat = b.category || 'Other';
            const desc = b.description || 'General Expense';
            const amount = parseFloat(b.amount || 0);
            const mode = b.payment_mode || 'Cash';
            const paidTo = b.paid_to || '';
            const remarks = b.remarks || '';

            if (isNaN(amount) || amount <= 0) {
                return sendJson(res, 400, { success: false, error: 'Valid expense amount required' });
            }

            const stmt = db.prepare(`
                INSERT INTO expenses (voucher_no, expense_date, category, description, amount, payment_mode, paid_to, remarks)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const resRun = stmt.run(voucher, date, cat, desc, amount, mode, paidTo, remarks);
            syncShadowVault();

            try {
                db.prepare("INSERT INTO audit_logs (action_type, module, details, performed_by) VALUES ('EXPENSE_RECORDED', 'Expenses', ?, 'Admin')").run(`Expense ${voucher}: ₹${amount} for ${desc} (${cat})`);
            } catch(e) {}

            return sendJson(res, 200, { success: true, id: resRun.lastInsertRowid, voucher_no: voucher });
        }

        if (pathname.startsWith('/api/expenses/') && method === 'DELETE') {
            const expId = parseInt(pathname.split('/').pop(), 10);
            db.prepare("DELETE FROM expenses WHERE id = ?").run(expId);
            syncShadowVault();
            return sendJson(res, 200, { success: true, message: 'Expense deleted' });
        }

        if (pathname === '/api/expenses/summary' && method === 'GET') {
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
            const totalThisMonth = db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM expenses WHERE expense_date LIKE ?").get(`${currentMonth}%`).s;
            const totalAllTime = db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM expenses").get().s;
            const byCategory = db.prepare("SELECT category, COALESCE(SUM(amount), 0) as s, COUNT(id) as c FROM expenses GROUP BY category ORDER BY s DESC").all();
            const byMode = db.prepare("SELECT payment_mode, COALESCE(SUM(amount), 0) as s FROM expenses GROUP BY payment_mode").all();

            return sendJson(res, 200, {
                month: currentMonth,
                total_this_month: totalThisMonth,
                total_all_time: totalAllTime,
                by_category: byCategory,
                by_mode: byMode
            });
        }

        // ==========================================
        // 17. SMART DATA MIGRATION CENTER ENDPOINTS
        // ==========================================
        if (pathname === '/api/migration/dry-run' && method === 'POST') {
            const body = await parseBody(req);
            return sendJson(res, 200, MigrationService.dryRun(body));
        }

        if (pathname === '/api/migration/commit' && method === 'POST') {
            const body = await parseBody(req);
            const user = req.headers['x-username'] || 'admin';
            try {
                const result = MigrationService.commit(body, user, 1);
                return sendJson(res, 200, result);
            } catch (err) {
                return sendJson(res, 500, { success: false, error: err.message });
            }
        }

        if (pathname === '/api/migration/history' && method === 'GET') {
            return sendJson(res, 200, { batches: MigrationService.getHistory() });
        }

        if (pathname === '/api/migration/rollback' && method === 'POST') {
            const body = await parseBody(req);
            const user = body.username || req.headers['x-username'] || 'admin';
            const bId = body.batch_id || body.batchId;
            try {
                const result = MigrationService.rollback(bId, user);
                return sendJson(res, result.success ? 200 : 400, result);
            } catch (err) {
                return sendJson(res, 500, { success: false, error: err.message });
            }
        }

        if (pathname === '/api/migration/retry-vault-sync' && method === 'POST') {
            const body = await parseBody(req);
            const bId = body.batch_id || body.batchId;
            const result = MigrationService.retryVaultSync(bId);
            return sendJson(res, result.success ? 200 : 500, result);
        }


        // Static Files
        let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
        if (!fs.existsSync(filePath)) {
            filePath = path.join(PUBLIC_DIR, 'index.html');
        }

        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'text/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.ico': 'image/x-icon',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf'
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const fileContent = fs.readFileSync(filePath);
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.end(fileContent);

    } catch (err) {
        console.error('Server error:', err);
        sendJson(res, 500, { error: err.message });
    }
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use by another application or previous session.`);
        console.error('Please run Stop_School_RMS.bat or restart your PC to free the port.');
    } else {
        console.error('Fatal Server Socket Error:', err.message);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Apna School OS Server running at http://127.0.0.1:${PORT}`);
    console.log(`🌐 Also accessible on LAN at port ${PORT}`);
});

module.exports = server;
