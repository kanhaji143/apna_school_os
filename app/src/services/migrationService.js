const { getDb, syncShadowVault } = require('../database/db');
const fs = require('node:fs');
const path = require('node:path');

class MigrationService {
    static initTables(customDb = null) {
        const db = customDb || getDb();
        db.exec(`
            CREATE TABLE IF NOT EXISTS migration_batches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT UNIQUE NOT NULL,
                file_name TEXT NOT NULL,
                imported_by TEXT NOT NULL,
                modules_imported TEXT NOT NULL,
                total_records INTEGER DEFAULT 0,
                inserted_count INTEGER DEFAULT 0,
                skipped_count INTEGER DEFAULT 0,
                failed_count INTEGER DEFAULT 0,
                backup_path TEXT NOT NULL,
                status TEXT DEFAULT 'COMPLETED',
                vault_synced TEXT DEFAULT 'SYNCED',
                details_json TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS migration_batch_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT NOT NULL,
                target_table TEXT NOT NULL,
                record_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_mig_batch_records ON migration_batch_records(batch_id, target_table);
        `);
    }

    /**
     * Dry Run Simulation: Validates mapped data against database, detects duplicates, checks missing classes.
     * ZERO data is written to the database during Dry Run.
     */
    static dryRun(payload, customDb = null) {
        this.initTables(customDb);
        const db = customDb || getDb();

        if (payload.module && Array.isArray(payload.records)) {
            if (payload.module === 'students') payload.students = payload.records;
            else if (payload.module === 'fee_structure' || payload.module === 'fee_structures') payload.fee_structures = payload.records;
            else if (payload.module === 'fee_transactions') payload.fee_transactions = payload.records;
            else if (payload.module === 'student_attendance' || payload.module === 'attendance') payload.attendance = payload.records;
            else if (payload.module === 'exam_marks' || payload.module === 'marks') payload.marks = payload.records;
            else if (payload.module === 'employees') payload.employees = payload.records;
            else if (payload.module === 'salary_payments') payload.salary_payments = payload.records;
        }

        const students = Array.isArray(payload.students) ? payload.students : [];
        const feeStructures = Array.isArray(payload.fee_structures) ? payload.fee_structures : [];
        const feeTransactions = Array.isArray(payload.fee_transactions) ? payload.fee_transactions : [];
        const attendance = Array.isArray(payload.attendance) ? payload.attendance : [];
        const marks = Array.isArray(payload.marks) ? payload.marks : [];
        const employees = Array.isArray(payload.employees) ? payload.employees : [];
        const salaryPayments = Array.isArray(payload.salary_payments) ? payload.salary_payments : [];

        // 1. Existing Students Lookup (Strict Duplicate Detection by Admission No)
        const existingStudentRows = db.prepare("SELECT admission_no, student_name, class, section FROM students").all();
        const existingAdmMap = new Map();
        existingStudentRows.forEach(s => {
            if (s.admission_no) existingAdmMap.set(String(s.admission_no).trim().toLowerCase(), s);
        });

        // 2. Existing Employees Lookup
        const existingEmpRows = db.prepare("SELECT employee_id, employee_name FROM employees").all();
        const existingEmpMap = new Map();
        existingEmpRows.forEach(e => {
            if (e.employee_id) existingEmpMap.set(String(e.employee_id).trim().toLowerCase(), e);
        });

        // 3. Existing Routes
        const existingRoutes = db.prepare("SELECT id, route_code, route_name FROM routes").all();
        const routeCodeMap = new Map();
        existingRoutes.forEach(r => routeCodeMap.set(String(r.route_code).trim().toLowerCase(), r.id));

        // 4. Existing Fee Transactions Lookup (Strict Duplicate Detection by Receipt No & Transaction ID)
        const existingTxRows = db.prepare("SELECT transaction_id, receipt_no, student_id FROM fee_transactions WHERE receipt_no IS NOT NULL OR transaction_id IS NOT NULL").all();
        const existingReceiptMap = new Map();
        const existingTxIdMap = new Map();
        existingTxRows.forEach(tx => {
            if (tx.receipt_no) existingReceiptMap.set(String(tx.receipt_no).trim().toLowerCase(), tx);
            if (tx.transaction_id) existingTxIdMap.set(String(tx.transaction_id).trim().toLowerCase(), tx);
        });

        // 5. Existing Students Lookup (for Fee Transactions mapping to already registered students)
        const allDbStudentRows = db.prepare("SELECT id, admission_no, student_name, class, section FROM students").all();
        const dbStudentByAdm = new Map();
        allDbStudentRows.forEach(s => {
            if (s.admission_no) dbStudentByAdm.set(String(s.admission_no).trim().toLowerCase(), s);
        });

        // Validation Results
        const studentPreview = [];
        let newStudentsCount = 0;
        let skippedStudentsCount = 0;
        let invalidStudentsCount = 0;

        const newClassesDetected = new Set();
        const incomingAdmSetInFile = new Set();

        for (let i = 0; i < students.length; i++) {
            const raw = students[i];
            const admNo = String(raw.admission_no || raw.adm_no || '').trim();
            const name = String(raw.student_name || raw.name || '').trim();
            const cls = String(raw.class || raw.standard || '').trim() || 'Class 1';
            const sec = String(raw.section || '').trim() || 'A';
            const father = String(raw.father_name || raw.father || '—').trim();
            const mobile = String(raw.mobile || raw.phone || '').replace(/\D/g, '').slice(-10);

            if (!admNo || !name) {
                invalidStudentsCount++;
                studentPreview.push({
                    row_index: i + 1,
                    admission_no: admNo || '—',
                    student_name: name || 'Missing Name',
                    class: cls,
                    section: sec,
                    status: 'INVALID',
                    reason: 'अनिवार्य फ़ील्ड अनुपस्थित (Admission No और Student Name आवश्यक हैं)'
                });
                continue;
            }

            // Check duplicate in database
            const lowerAdm = admNo.toLowerCase();
            if (existingAdmMap.has(lowerAdm)) {
                skippedStudentsCount++;
                const existing = existingAdmMap.get(lowerAdm);
                studentPreview.push({
                    row_index: i + 1,
                    admission_no: admNo,
                    student_name: name,
                    class: cls,
                    section: sec,
                    father_name: father,
                    mobile: mobile,
                    status: 'SKIP',
                    reason: `प्रवेश क्रमांक पहले से पंजीकृत है (${existing.student_name} • ${existing.class})`
                });
                continue;
            }

            // Check duplicate inside the same file
            if (incomingAdmSetInFile.has(lowerAdm)) {
                skippedStudentsCount++;
                studentPreview.push({
                    row_index: i + 1,
                    admission_no: admNo,
                    student_name: name,
                    class: cls,
                    section: sec,
                    status: 'SKIP',
                    reason: 'एक्सेल फाइल के भीतर ही प्रवेश क्रमांक दोहराया गया है'
                });
                continue;
            }

            incomingAdmSetInFile.add(lowerAdm);
            newStudentsCount++;
            newClassesDetected.add(`${cls} - ${sec}`);

            studentPreview.push({
                row_index: i + 1,
                admission_no: admNo,
                student_name: name,
                class: cls,
                section: sec,
                father_name: father,
                mobile: mobile,
                status: 'READY',
                reason: 'सत्यापित (नया छात्र रिकॉर्ड तैयार है)'
            });
        }

        // Employee Preview
        let newEmployeesCount = 0;
        let skippedEmployeesCount = 0;
        const employeePreview = [];

        for (let i = 0; i < employees.length; i++) {
            const raw = employees[i];
            const empId = String(raw.employee_code || raw.employee_id || raw.emp_id || `EMP-${1000 + i}`).trim();
            const empName = String(raw.employee_name || raw.name || '').trim();
            const desig = String(raw.designation || 'Teacher').trim();
            const salary = parseFloat(raw.monthly_salary || raw.salary || 0);

            if (!empName) continue;

            if (existingEmpMap.has(empId.toLowerCase())) {
                skippedEmployeesCount++;
                employeePreview.push({
                    employee_id: empId,
                    employee_name: empName,
                    status: 'SKIP',
                    reason: 'कर्मचारी आईडी पहले से पंजीकृत है'
                });
            } else {
                newEmployeesCount++;
                employeePreview.push({
                    employee_id: empId,
                    employee_name: empName,
                    designation: desig,
                    monthly_salary: salary,
                    status: 'READY'
                });
            }
        }

        // Fee Transactions Validation & Deduplication (Receipt No & Transaction ID Duplicate Protection)
        let newTxReady = 0;
        let skippedTxCount = 0;
        let invalidTxCount = 0;
        const feeTxPreview = [];
        const seenReceiptsInFile = new Set();
        const seenTxIdsInFile = new Set();

        for (let i = 0; i < feeTransactions.length; i++) {
            const raw = feeTransactions[i];
            const receiptNo = String(raw.receipt_no || raw.receipt || raw.bill_no || raw.slip_no || '').trim();
            const rawTxId = String(raw.transaction_id || raw.tx_id || '').trim();
            const admNo = String(raw.admission_no || raw.adm_no || raw.scholar_no || '').trim();
            const amount = parseFloat(raw.amount_received || raw.amount || raw.paid_amount || 0);

            // 5. Missing or invalid receipt identifiers produce ERROR (never generate synthetic identifiers)
            if (!receiptNo) {
                invalidTxCount++;
                feeTxPreview.push({
                    row_num: i + 1,
                    identifier: 'MISSING',
                    details: `राशि: ₹${isNaN(amount) ? 0 : amount} • छात्र: ${admNo || 'अनुपस्थित'}`,
                    scope: 'रसीद संख्या अनुपस्थित',
                    status: 'INVALID',
                    remarks: 'अनिवार्य रसीद संख्या (Receipt No) अनुपस्थित है। रसीद पहचानकर्ता आवश्यक है।'
                });
                continue;
            }

            // 6. Existing students correctly resolved using Admission Number
            const lowerAdm = admNo.toLowerCase();
            const studentInfo = existingAdmMap.get(lowerAdm) || dbStudentByAdm.get(lowerAdm);
            if (!studentInfo) {
                invalidTxCount++;
                feeTxPreview.push({
                    row_num: i + 1,
                    identifier: receiptNo,
                    details: `राशि: ₹${isNaN(amount) ? 0 : amount} • छात्र: अनुपलब्ध`,
                    scope: `प्रवेश क्रमांक: ${admNo || '—'}`,
                    status: 'INVALID',
                    remarks: `छात्र प्रवेश क्रमांक '${admNo}' डेटाबेस में नहीं मिला। रसीद दर्ज करने हेतु छात्र पंजीकृत होना अनिवार्य है।`
                });
                continue;
            }

            if (isNaN(amount) || amount <= 0) {
                invalidTxCount++;
                feeTxPreview.push({
                    row_num: i + 1,
                    identifier: receiptNo,
                    details: `${studentInfo.student_name} • अमान्य राशि: ₹${raw.amount || 0}`,
                    scope: studentInfo.class || '—',
                    status: 'INVALID',
                    remarks: 'भुगतान की गई राशि (Amount) 0 से अधिक होनी चाहिए।'
                });
                continue;
            }

            // 1. Existing Receipt Number duplicate detection
            const lowerReceipt = receiptNo.toLowerCase();
            if (existingReceiptMap.has(lowerReceipt)) {
                skippedTxCount++;
                feeTxPreview.push({
                    row_num: i + 1,
                    identifier: receiptNo,
                    details: `${studentInfo.student_name} (₹${amount})`,
                    scope: studentInfo.class || '—',
                    status: 'SKIP',
                    remarks: `रसीद संख्या '${receiptNo}' डेटाबेस में पहले से मौजूद है (Duplicate Receipt No)`
                });
                continue;
            }

            // 2. Existing Transaction ID duplicate detection using actual DB schema
            const lowerTxId = rawTxId.toLowerCase();
            if (rawTxId && existingTxIdMap.has(lowerTxId)) {
                skippedTxCount++;
                feeTxPreview.push({
                    row_num: i + 1,
                    identifier: receiptNo,
                    details: `${studentInfo.student_name} (Tx: ${rawTxId})`,
                    scope: studentInfo.class || '—',
                    status: 'SKIP',
                    remarks: `ट्रांजैक्शन आईडी '${rawTxId}' डेटाबेस में पहले से मौजूद है (Duplicate Transaction ID)`
                });
                continue;
            }

            // 3. Duplicate Receipt Numbers within the same workbook
            if (seenReceiptsInFile.has(lowerReceipt)) {
                skippedTxCount++;
                feeTxPreview.push({
                    row_num: i + 1,
                    identifier: receiptNo,
                    details: `${studentInfo.student_name} (₹${amount})`,
                    scope: studentInfo.class || '—',
                    status: 'SKIP',
                    remarks: `रसीद संख्या '${receiptNo}' वर्कबुक में दोहराई गई है (Duplicate within file)`
                });
                continue;
            }
            seenReceiptsInFile.add(lowerReceipt);

            // 4. Duplicate Transaction IDs within the same workbook
            if (rawTxId && seenTxIdsInFile.has(lowerTxId)) {
                skippedTxCount++;
                feeTxPreview.push({
                    row_num: i + 1,
                    identifier: receiptNo,
                    details: `${studentInfo.student_name} (Tx: ${rawTxId})`,
                    scope: studentInfo.class || '—',
                    status: 'SKIP',
                    remarks: `ट्रांजैक्शन आईडी '${rawTxId}' वर्कबुक में दोहराई गई है (Duplicate within file)`
                });
                continue;
            }
            if (rawTxId) seenTxIdsInFile.add(lowerTxId);

            // 10. Original valid receipt identifiers preserved
            newTxReady++;
            feeTxPreview.push({
                row_num: i + 1,
                identifier: receiptNo,
                details: `${studentInfo.student_name} (₹${amount})`,
                scope: studentInfo.class || '—',
                status: 'READY',
                remarks: 'सत्यापित (रसीद रिकॉर्ड आयात हेतु तैयार है)'
            });
        }

        const totalRecords = students.length || employees.length || feeTransactions.length || feeStructures.length || attendance.length || marks.length || salaryPayments.length;
        const validReady = (newStudentsCount + newEmployeesCount + newTxReady) || (students.length || employees.length || feeTransactions.length ? (newStudentsCount + newEmployeesCount + newTxReady) : totalRecords);
        const duplicatesSkipped = skippedStudentsCount + skippedEmployeesCount + skippedTxCount;
        const invalidFormat = invalidStudentsCount + invalidTxCount;

        let previewRows = [];
        if (studentPreview.length > 0) {
            previewRows = studentPreview.map((s, idx) => ({
                row_num: idx + 1,
                identifier: s.admission_no,
                details: s.student_name,
                scope: s.class || '-',
                status: s.status,
                remarks: s.reason || (s.status === 'READY' ? 'Ready to import' : 'Duplicate - Will be skipped')
            }));
        } else if (employeePreview.length > 0) {
            previewRows = employeePreview.map((e, idx) => ({
                row_num: idx + 1,
                identifier: e.employee_id,
                details: e.employee_name,
                scope: e.designation || '-',
                status: e.status,
                remarks: e.reason || (e.status === 'READY' ? 'Ready to import' : 'Duplicate - Will be skipped')
            }));
        } else if (feeTxPreview.length > 0) {
            previewRows = feeTxPreview;
        }

        return {
            success: true,
            summary: {
                total_records: totalRecords,
                valid_ready: validReady,
                duplicates_skipped: duplicatesSkipped,
                invalid_format: invalidFormat,
                total_students_read: students.length,
                new_students_ready: newStudentsCount,
                duplicate_students_skipped: skippedStudentsCount,
                invalid_students: invalidStudentsCount,
                fee_structures_detected: feeStructures.length,
                fee_transactions_detected: feeTransactions.length,
                attendance_rows_detected: attendance.length,
                marks_rows_detected: marks.length,
                new_employees_ready: newEmployeesCount,
                duplicate_employees_skipped: skippedEmployeesCount,
                salary_payments_detected: salaryPayments.length,
                new_classes_detected: Array.from(newClassesDetected)
            },
            preview_rows: previewRows,
            sample_preview: studentPreview.slice(0, 50),
            employee_preview: employeePreview.slice(0, 20)
        };
    }

    /**
     * Atomic Commit: Takes pre-import backup snapshot, opens SQLite transaction,
     * inserts records in topological order, logs tracking IDs, and syncs shadow vault.
     */
    static commit(payload, username = 'admin', institutionId = 1, customDb = null) {
        this.initTables(customDb);
        const db = customDb || getDb();

        if (payload.module && Array.isArray(payload.records)) {
            if (payload.module === 'students') payload.students = payload.records;
            else if (payload.module === 'fee_structure' || payload.module === 'fee_structures') payload.fee_structures = payload.records;
            else if (payload.module === 'fee_transactions') payload.fee_transactions = payload.records;
            else if (payload.module === 'student_attendance' || payload.module === 'attendance') payload.attendance = payload.records;
            else if (payload.module === 'exam_marks' || payload.module === 'marks') payload.marks = payload.records;
            else if (payload.module === 'employees') payload.employees = payload.records;
            else if (payload.module === 'salary_payments') payload.salary_payments = payload.records;
        }

        const students = Array.isArray(payload.students) ? payload.students : [];
        const feeStructures = Array.isArray(payload.fee_structures) ? payload.fee_structures : [];
        const feeTransactions = Array.isArray(payload.fee_transactions) ? payload.fee_transactions : [];
        const attendance = Array.isArray(payload.attendance) ? payload.attendance : [];
        const marks = Array.isArray(payload.marks) ? payload.marks : [];
        const employees = Array.isArray(payload.employees) ? payload.employees : [];
        const salaryPayments = Array.isArray(payload.salary_payments) ? payload.salary_payments : [];
        const fileName = String(payload.file_name || payload.fileName || 'School_Migration_Import.xlsx').trim();

        // 1. Create Pre-Import Database Backup Snapshot
        const backupDir = path.join(
            fs.existsSync('D:\\Apna_School_OS_Data') ? 'D:\\Apna_School_OS_Data' : (process.env.LOCALAPPDATA || process.env.USERPROFILE),
            'backups'
        );
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

        const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
        const batchId = 'MIG-' + Date.now();
        const primaryDbPath = fs.existsSync('D:\\Apna_School_OS_Data\\apna_records.db')
            ? 'D:\\Apna_School_OS_Data\\apna_records.db'
            : path.join(process.env.LOCALAPPDATA || process.env.USERPROFILE, 'Apna_School_OS_Data', 'apna_records.db');

        const backupFilePath = customDb ? 'ISOLATED_TEST_BACKUP' : path.join(backupDir, `pre_migration_${batchId}_${timestampStr}.db`);
        if (!customDb) {
            try {
                if (fs.existsSync(primaryDbPath)) {
                    fs.copyFileSync(primaryDbPath, backupFilePath);
                }
            } catch (backupErr) {
                console.error('Warning during pre-import backup:', backupErr.message);
            }
        }

        // 2. Prepare Insertion Statements
        const insertStudentStmt = db.prepare(`
            INSERT INTO students (
                admission_no, sr_no, roll_no, student_name, father_name, mother_name,
                gender, dob, mobile, alt_mobile, aadhaar_no, pen_no, address,
                class, section, route_id, admission_date, status, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
        `);

        const insertFeeStructureStmt = db.prepare(`
            INSERT INTO student_fee_structure (
                student_id, session, admission_fee, monthly_fee, quarterly_exam_fee,
                half_yearly_exam_fee, annual_exam_fee, transport_fee, computer_fee,
                library_fee, sports_fee, activity_fee, fine, old_due, expected_fee
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertFeeTransactionStmt = db.prepare(`
            INSERT INTO fee_transactions (
                transaction_id, receipt_no, session, student_id, payment_date,
                fee_month, fee_period, fee_head, standard_fee, amount_received,
                discount, net_amount, payment_mode, reference_no, status, collected_by, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', ?, ?)
        `);

        const insertAttendanceSummaryStmt = db.prepare(`
            INSERT INTO student_attendance_summary (
                student_id, session, class, total_working_days, days_present, promotion_status, teacher_remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const insertDailyAttendanceStmt = db.prepare(`
            INSERT INTO student_attendance (
                student_id, attendance_date, status, remarks
            ) VALUES (?, ?, ?, ?)
        `);

        const insertMarkStmt = db.prepare(`
            INSERT INTO marks (
                student_id, session, class, exam_term_id, subject_id, written_marks, oral_marks, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertEmployeeStmt = db.prepare(`
            INSERT INTO employees (
                employee_id, employee_name, father_name, mobile_no, joining_date,
                designation, employment_type, department, monthly_salary, bank_account_no, ifsc_code, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
        `);

        const insertSalaryPaymentStmt = db.prepare(`
            INSERT INTO salary_payments (
                voucher_no, employee_id, salary_month, basic_salary, allowances, advance_deduction, absent_deduction, net_paid, payment_mode, payment_date, transaction_status, prepared_by, remarks
            ) VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?, ?, 'Paid', ?, ?)
        `);

        const logBatchRecordStmt = db.prepare(`
            INSERT INTO migration_batch_records (batch_id, target_table, record_id) VALUES (?, ?, ?)
        `);

        // Check Existing Admission Numbers for Skip Protection
        const existingStudentRows = db.prepare("SELECT admission_no FROM students").all();
        const existingAdmSet = new Set(existingStudentRows.map(s => String(s.admission_no).trim().toLowerCase()));

        // Check Existing Receipts and Transaction IDs for Skip Protection
        const existingTxRows = db.prepare("SELECT transaction_id, receipt_no FROM fee_transactions WHERE receipt_no IS NOT NULL OR transaction_id IS NOT NULL").all();
        const existingReceiptSet = new Set(existingTxRows.map(r => String(r.receipt_no).trim().toLowerCase()));
        const existingTxIdSet = new Set(existingTxRows.filter(r => r.transaction_id).map(r => String(r.transaction_id).trim().toLowerCase()));

        // Lookup all existing students in DB for standalone Fee Transaction student resolution
        const allDbStudents = db.prepare("SELECT id, admission_no, student_name, class, section FROM students").all();
        const dbStudentByAdm = new Map();
        allDbStudents.forEach(s => {
            if (s.admission_no) dbStudentByAdm.set(String(s.admission_no).trim().toLowerCase(), s);
        });

        // In-memory mapping of admission_no -> new student_id
        const studentIdMap = new Map();
        let insertedStudents = 0;
        let skippedStudents = 0;
        let insertedFees = 0;
        let insertedTx = 0;
        let skippedTx = 0;
        let insertedAttendance = 0;
        let insertedMarks = 0;
        let insertedEmployees = 0;
        let skippedEmployees = 0;
        let insertedSalaries = 0;

        const modulesTracked = new Set();

        // 3. ATOMIC TRANSACTION EXECUTION
        db.exec('BEGIN IMMEDIATE TRANSACTION');
        try {
            // A. INSERT STUDENTS
            if (students.length > 0) modulesTracked.add('Students');
            for (let i = 0; i < students.length; i++) {
                const s = students[i];
                const admNo = String(s.admission_no || s.adm_no || '').trim();
                const name = String(s.student_name || s.name || '').trim();
                if (!admNo || !name) continue;

                const lowerAdm = admNo.toLowerCase();
                if (existingAdmSet.has(lowerAdm)) {
                    skippedStudents++;
                    continue; // Strict Skip Protection
                }

                existingAdmSet.add(lowerAdm);

                const cls = String(s.class || s.standard || 'Class 1').trim();
                const sec = String(s.section || 'A').trim();
                const father = String(s.father_name || s.father || '—').trim();
                const mother = String(s.mother_name || s.mother || '—').trim();
                const gender = String(s.gender || 'Other').trim();
                const dob = String(s.dob || '2018-01-01').trim();
                const mobile = String(s.mobile || s.phone || '').replace(/\D/g, '').slice(-10);
                const altMobile = String(s.alt_mobile || '').replace(/\D/g, '').slice(-10);
                const aadhaar = String(s.aadhaar_no || '').trim();
                const penNo = String(s.pen_no || '').trim();
                const address = String(s.address || 'Local Campus').trim();
                const rollNo = String(s.roll_no || `${i + 1}`).trim();
                const srNo = String(s.sr_no || admNo).trim();
                const admDate = String(s.admission_date || '2026-04-01').trim();

                const res = insertStudentStmt.run(
                    admNo, srNo, rollNo, name, father, mother, gender, dob, mobile,
                    altMobile, aadhaar, penNo, address, cls, sec, null, admDate, 'Migrated via Excel'
                );

                const newStudentId = res.lastInsertRowid;
                studentIdMap.set(lowerAdm, { id: newStudentId, class: cls, section: sec });
                logBatchRecordStmt.run(batchId, 'students', newStudentId);
                insertedStudents++;

                // B. AUTO-CREATE FEE STRUCTURE IF PROVIDED OR DEFAULT
                const matchingFee = feeStructures.find(f => String(f.admission_no || '').trim().toLowerCase() === lowerAdm) || {};
                const tuition = parseFloat(matchingFee.monthly_fee || matchingFee.tuition_fee || 1000);
                const expected = parseFloat(matchingFee.expected_fee || matchingFee.total_fee || (tuition * 12));
                const oldDue = parseFloat(matchingFee.old_due || 0);

                const fRes = insertFeeStructureStmt.run(
                    newStudentId, '2026-27', 0, tuition, 500, 500, 500,
                    0, 0, 0, 0, 0, 0, oldDue, expected
                );
                logBatchRecordStmt.run(batchId, 'student_fee_structure', fRes.lastInsertRowid);
                insertedFees++;
                modulesTracked.add('Fee Structure');

                // C. AUTO-CREATE ATTENDANCE SUMMARY IF PROVIDED OR DEFAULT
                const matchingAtt = attendance.find(a => String(a.admission_no || '').trim().toLowerCase() === lowerAdm) || {};
                const totalWorking = parseInt(matchingAtt.total_working_days || 120, 10);
                const daysPresent = parseInt(matchingAtt.days_present || 110, 10);

                const attRes = insertAttendanceSummaryStmt.run(
                    newStudentId, '2026-27', cls, totalWorking, daysPresent, 'Promoted', 'Good academic progress'
                );
                logBatchRecordStmt.run(batchId, 'student_attendance_summary', attRes.lastInsertRowid);
                insertedAttendance++;
                modulesTracked.add('Attendance');
            }

            // D. INSERT HISTORICAL FEE TRANSACTIONS
            if (feeTransactions.length > 0) modulesTracked.add('Fee Transactions');
            const seenReceiptsInFile = new Set();
            const seenTxIdsInFile = new Set();

            for (let i = 0; i < feeTransactions.length; i++) {
                const tx = feeTransactions[i];
                const receiptNo = String(tx.receipt_no || tx.receipt || tx.bill_no || tx.slip_no || '').trim();
                const rawTxId = String(tx.transaction_id || tx.tx_id || '').trim();
                const adm = String(tx.admission_no || tx.adm_no || tx.scholar_no || '').trim().toLowerCase();

                // Rule 5: Missing or invalid receipt identifiers produce ERROR/SKIP. Never generate synthetic identifiers.
                if (!receiptNo) {
                    skippedTx++;
                    continue;
                }

                // Rule 6 & 7: Resolve existing students using Admission Number and actual database student IDs
                const stInfo = studentIdMap.get(adm) || dbStudentByAdm.get(adm);
                if (!stInfo) {
                    skippedTx++;
                    continue;
                }

                const amount = parseFloat(tx.amount_received || tx.amount || tx.paid_amount || 0);
                if (isNaN(amount) || amount <= 0) {
                    skippedTx++;
                    continue;
                }

                // Rule 1 & 8: Revalidate duplicate Receipt Numbers against existing database records
                const lowerReceipt = receiptNo.toLowerCase();
                if (existingReceiptSet.has(lowerReceipt)) {
                    skippedTx++;
                    continue; // Rule 9: Skip duplicate receipts without overwriting
                }

                // Rule 2 & 8: Revalidate duplicate Transaction IDs using actual database schema
                const lowerTxId = rawTxId.toLowerCase();
                if (rawTxId && existingTxIdSet.has(lowerTxId)) {
                    skippedTx++;
                    continue; // Rule 9: Skip duplicate receipts without overwriting
                }

                // Rule 3 & 8: Detect duplicate Receipt Numbers within the same uploaded workbook
                if (seenReceiptsInFile.has(lowerReceipt)) {
                    skippedTx++;
                    continue;
                }
                seenReceiptsInFile.add(lowerReceipt);

                // Rule 4 & 8: Detect duplicate Transaction IDs within the same uploaded workbook
                if (rawTxId && seenTxIdsInFile.has(lowerTxId)) {
                    skippedTx++;
                    continue;
                }
                if (rawTxId) seenTxIdsInFile.add(lowerTxId);

                // Rule 10: Original valid receipt identifiers are preserved.
                const txId = rawTxId || `TXN-RCP-${receiptNo.replace(/[^a-zA-Z0-9_-]/g, '_')}-${stInfo.id}`;

                let mode = String(tx.payment_mode || 'Cash').trim();
                if (/upi/i.test(mode)) mode = 'UPI';
                else if (/bank|transfer|neft|rtgs|imps/i.test(mode)) mode = 'Bank_Transfer';
                else if (/cheque|check/i.test(mode)) mode = 'Cheque';
                else if (/card|pos|debit|credit/i.test(mode)) mode = 'Card';
                else mode = 'Cash';

                const payDate = String(tx.payment_date || new Date().toISOString().split('T')[0]).trim();
                const head = String(tx.fee_head || tx.fee_type || 'Tuition Fee').trim();
                const session = String(tx.session || '2026-27').trim();
                const feeMonth = String(tx.fee_month || 'April').trim();
                const feePeriod = String(tx.fee_period || 'Q1').trim();
                const refNo = String(tx.reference_no || tx.ref_no || '').trim();
                const remarks = String(tx.remarks || 'Migrated historical receipt').trim();

                const txRes = insertFeeTransactionStmt.run(
                    txId, receiptNo, session, stInfo.id, payDate,
                    feeMonth, feePeriod, head, amount, amount,
                    0, amount, mode, refNo, username, remarks
                );

                logBatchRecordStmt.run(batchId, 'fee_transactions', txRes.lastInsertRowid);
                insertedTx++;

                existingReceiptSet.add(lowerReceipt);
                existingTxIdSet.add(txId.toLowerCase());
            }

            // E. INSERT MARKS IF PROVIDED
            if (marks.length > 0) modulesTracked.add('Examination Marks');
            const defaultSubjects = db.prepare("SELECT id, subject_name FROM subjects LIMIT 5").all();
            const defaultTerms = db.prepare("SELECT id, term_code FROM exam_terms LIMIT 2").all();

            for (let i = 0; i < marks.length; i++) {
                const m = marks[i];
                const adm = String(m.admission_no || '').trim().toLowerCase();
                const stInfo = studentIdMap.get(adm);
                if (!stInfo) continue;

                const written = parseFloat(m.written_marks || m.marks || 75);
                const oral = parseFloat(m.oral_marks || 15);
                const subId = defaultSubjects[i % defaultSubjects.length]?.id || 1;
                const termId = defaultTerms[0]?.id || 1;

                const mRes = insertMarkStmt.run(
                    stInfo.id, '2026-27', stInfo.class, termId, subId, written, oral, 'Good'
                );
                logBatchRecordStmt.run(batchId, 'marks', mRes.lastInsertRowid);
                insertedMarks++;
            }

            // F. INSERT EMPLOYEES
            if (employees.length > 0) modulesTracked.add('Employees');
            const existingEmpRows = db.prepare("SELECT employee_id FROM employees").all();
            const existingEmpSet = new Set(existingEmpRows.map(e => String(e.employee_id).trim().toLowerCase()));

            for (let i = 0; i < employees.length; i++) {
                const e = employees[i];
                const empId = String(e.employee_code || e.employee_id || e.emp_id || `EMP-${Date.now()}-${i + 1}`).trim();
                const empName = String(e.employee_name || e.name || '').trim();
                if (!empName) continue;

                if (existingEmpSet.has(empId.toLowerCase())) {
                    skippedEmployees++;
                    continue;
                }
                existingEmpSet.add(empId.toLowerCase());

                const salary = parseFloat(e.monthly_salary || e.salary || 15000);
                const desig = String(e.designation || 'Teacher').trim();
                const phone = String(e.mobile_no || e.phone || '').trim();

                const eRes = insertEmployeeStmt.run(
                    empId, empName, '—', phone, '2026-04-01', desig, 'Permanent', 'Teaching', salary, '', ''
                );
                logBatchRecordStmt.run(batchId, 'employees', eRes.lastInsertRowid);
                insertedEmployees++;
            }

            // G. INSERT SALARY PAYMENTS
            if (salaryPayments.length > 0) modulesTracked.add('Salary Payments');
            for (let i = 0; i < salaryPayments.length; i++) {
                const sp = salaryPayments[i];
                const empCode = String(sp.employee_code || sp.emp_id || '').trim();
                const emp = db.prepare("SELECT id, monthly_salary FROM employees WHERE LOWER(employee_id) = ?").get(empCode.toLowerCase());
                if (!emp) continue;

                const voucherNo = String(sp.voucher_no || `VCH-${Date.now()}-${i + 1}`).trim();
                const month = String(sp.month_year || sp.salary_month || '2026-11').trim();
                const basic = parseFloat(sp.basic_salary || emp.monthly_salary || 15000);
                const net = parseFloat(sp.net_paid || basic);
                const mode = String(sp.payment_mode || 'Cash').trim();
                const date = String(sp.payment_date || new Date().toISOString().split('T')[0]).trim();
                const remarks = String(sp.remarks || 'Migrated salary payment').trim();

                const spRes = insertSalaryPaymentStmt.run(
                    voucherNo, emp.id, month, basic, net, mode, date, username, remarks
                );
                logBatchRecordStmt.run(batchId, 'salary_payments', spRes.lastInsertRowid);
                insertedSalaries++;
            }

            db.exec('COMMIT');
        } catch (commitErr) {
            db.exec('ROLLBACK');
            throw new Error('माइग्रेशन ट्रांजैक्शन विफल (Rolled Back cleanly): ' + commitErr.message);
        }

        // 4. Shadow Vault Sync with Decoupled Status
        let vaultSynced = 'SYNCED';
        if (!customDb) {
            try {
                syncShadowVault();
            } catch (vaultErr) {
                console.error('Shadow vault sync failed during migration:', vaultErr.message);
                vaultSynced = 'FAILED';
            }
        }

        // 5. Register in migration_batches
        const totalRecords = insertedStudents + insertedFees + insertedTx + insertedAttendance + insertedMarks + insertedEmployees + insertedSalaries;
        const totalSkipped = skippedStudents + skippedEmployees + skippedTx;
        const modulesStr = Array.from(modulesTracked).join(', ') || 'Students';

        db.prepare(`
            INSERT INTO migration_batches (
                batch_id, file_name, imported_by, modules_imported, total_records,
                inserted_count, skipped_count, failed_count, backup_path, status, vault_synced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'COMPLETED', ?)
        `).run(batchId, fileName, username, modulesStr, totalRecords, insertedStudents || insertedTx || totalRecords, totalSkipped, backupFilePath, vaultSynced);

        // 6. Log to audit_logs
        try {
            db.prepare(`
                INSERT INTO audit_logs (username, user_role, action, details)
                VALUES (?, 'Admin', 'DATA_MIGRATION', ?)
            `).run(username, `Imported batch ${batchId} from ${fileName}: ${insertedStudents} new students inserted, ${insertedTx} transactions inserted, ${totalSkipped} duplicates skipped.`);
        } catch (e) {}

        return {
            success: true,
            batch_id: batchId,
            file_name: fileName,
            module: modulesStr,
            inserted_count: insertedStudents || insertedTx || totalRecords,
            skipped_count: totalSkipped,
            inserted_students: insertedStudents,
            inserted_transactions: insertedTx,
            skipped_duplicates: totalSkipped,
            total_records_inserted: totalRecords,
            modules_imported: modulesStr,
            vault_synced: vaultSynced === 1 || vaultSynced === true,
            backup_path: backupFilePath,
            backup_file: backupFilePath
        };
    }

    /**
     * Get Migration History
     */
    static getHistory(customDb = null) {
        this.initTables(customDb);
        const db = customDb || getDb();
        return db.prepare("SELECT * FROM migration_batches ORDER BY id DESC").all();
    }

    /**
     * Safe Selective Batch Rollback with Exhaustive Pre-Flight Dependency Guard.
     * Prevents any mutation or deletion of subsequent / non-batch data.
     */
    static rollback(batchId, username = 'admin', customDb = null) {
        this.initTables(customDb);
        const db = customDb || getDb();

        const batch = db.prepare("SELECT * FROM migration_batches WHERE batch_id = ?").get(batchId);
        if (!batch) throw new Error(`माइग्रेशन बैच ${batchId} नहीं मिला।`);
        if (batch.status === 'ROLLED_BACK') throw new Error(`बैच ${batchId} पहले ही रोलबैक किया जा चुका है।`);

        // 1. Gather all student IDs and employee IDs inserted in this specific batch
        const studentRecordRows = db.prepare(
            "SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'students'"
        ).all(batchId);
        const batchStudentIds = studentRecordRows.map(r => r.record_id);

        const employeeRecordRows = db.prepare(
            "SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'employees'"
        ).all(batchId);
        const batchEmployeeIds = employeeRecordRows.map(r => r.record_id);

        // 2. EXHAUSTIVE PRE-FLIGHT DEPENDENCY GUARD
        // Check if ANY child record exists referencing these students/employees that was created OUTSIDE this batch
        if (batchStudentIds.length > 0) {
            const placeholders = batchStudentIds.map(() => '?').join(',');

            // A. Subsequent Fee Transactions
            const subTx = db.prepare(`
                SELECT count(*) as c FROM fee_transactions
                WHERE student_id IN (${placeholders})
                AND id NOT IN (SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'fee_transactions')
            `).get(...batchStudentIds, batchId);

            if (subTx && subTx.c > 0) {
                return {
                    success: false,
                    blocked: true,
                    message: `⚠️ रोलबैक रोका गया: माइग्रेशन के बाद इन छात्रों पर ${subTx.c} नई फीस रसीदें काटी जा चुकी हैं। वित्तीय डेटा हानि रोकने हेतु रोलबैक को सुरक्षित रूप से रद्द कर दिया गया है।`
                };
            }

            // B. Subsequent Marks
            const subMarks = db.prepare(`
                SELECT count(*) as c FROM marks
                WHERE student_id IN (${placeholders})
                AND id NOT IN (SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'marks')
            `).get(...batchStudentIds, batchId);

            if (subMarks && subMarks.c > 0) {
                return {
                    success: false,
                    blocked: true,
                    message: `⚠️ रोलबैक रोका गया: माइग्रेशन के बाद इन छात्रों पर ${subMarks.c} नए परीक्षा अंक दर्ज किए जा चुके हैं। रोलबैक सुरक्षित रूप से रद्द कर दिया गया।`
                };
            }

            // C. Parent Feedback (if table exists)
            const feedbackTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'parent_feedback_responses'").get();
            if (feedbackTableExists) {
                const subFeedback = db.prepare(`
                    SELECT count(*) as c FROM parent_feedback_responses
                    WHERE student_id IN (${placeholders})
                `).get(...batchStudentIds);

                if (subFeedback && subFeedback.c > 0) {
                    return {
                        success: false,
                        blocked: true,
                        message: `⚠️ रोलबैक रोका गया: इन छात्रों से जुड़े ${subFeedback.c} अभिभावक फीडबैक रिकॉर्ड्स मौजूद हैं। फॉरेन की सुरक्षा हेतु रोलबैक रद्द कर दिया गया।`
                    };
                }
            }
        }

        // 3. ATOMIC REVERSE TOPOLOGICAL DELETION ORDER
        db.exec('BEGIN IMMEDIATE TRANSACTION');
        try {
            // Step 1: fee_transactions (RESTRICT)
            db.prepare(`
                DELETE FROM fee_transactions WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'fee_transactions'
                )
            `).run(batchId);

            // Step 2: salary_payments (RESTRICT) & salary_advances
            db.prepare(`
                DELETE FROM salary_payments WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'salary_payments'
                )
            `).run(batchId);

            db.prepare(`
                DELETE FROM salary_advances WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'salary_advances'
                )
            `).run(batchId);

            // Step 3: feedback & marks & attendance & documents & achievements
            db.prepare(`
                DELETE FROM marks WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'marks'
                )
            `).run(batchId);

            db.prepare(`
                DELETE FROM student_attendance WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'student_attendance'
                )
            `).run(batchId);

            db.prepare(`
                DELETE FROM student_attendance_summary WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'student_attendance_summary'
                )
            `).run(batchId);

            db.prepare(`
                DELETE FROM student_fee_structure WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'student_fee_structure'
                )
            `).run(batchId);

            db.prepare(`
                DELETE FROM student_documents WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'student_documents'
                )
            `).run(batchId);

            db.prepare(`
                DELETE FROM student_achievements WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'student_achievements'
                )
            `).run(batchId);

            const fslExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'feedback_student_links'").get();
            if (fslExists) {
                db.prepare(`
                    DELETE FROM feedback_student_links WHERE id IN (
                        SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'feedback_student_links'
                    )
                `).run(batchId);
            }

            db.prepare(`
                DELETE FROM staff_attendance WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'staff_attendance'
                )
            `).run(batchId);

            // Step 4: Core Entity Masters
            db.prepare(`
                DELETE FROM students WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'students'
                )
            `).run(batchId);

            db.prepare(`
                DELETE FROM employees WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'employees'
                )
            `).run(batchId);

            // Step 5: Clean Root Tables (Only if batch-created with zero external references)
            db.prepare(`
                DELETE FROM subjects WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'subjects'
                ) AND id NOT IN (SELECT subject_id FROM marks)
            `).run(batchId);

            db.prepare(`
                DELETE FROM exam_terms WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'exam_terms'
                ) AND id NOT IN (SELECT exam_term_id FROM marks)
            `).run(batchId);

            db.prepare(`
                DELETE FROM routes WHERE id IN (
                    SELECT record_id FROM migration_batch_records WHERE batch_id = ? AND target_table = 'routes'
                ) AND id NOT IN (SELECT route_id FROM students WHERE route_id IS NOT NULL)
            `).run(batchId);

            // Step 6: Mark Batch Status as ROLLED_BACK
            db.prepare(`
                UPDATE migration_batches SET status = 'ROLLED_BACK' WHERE batch_id = ?
            `).run(batchId);

            db.exec('COMMIT');
        } catch (rollbackErr) {
            db.exec('ROLLBACK');
            throw new Error('रोलबैक प्रक्रिया विफल: ' + rollbackErr.message);
        }

        // Shadow vault sync after rollback
        let vaultSynced = 'SYNCED';
        try {
            syncShadowVault();
        } catch (vaultErr) {
            vaultSynced = 'FAILED';
        }

        db.prepare("UPDATE migration_batches SET vault_synced = ? WHERE batch_id = ?").run(vaultSynced, batchId);

        return {
            success: true,
            batch_id: batchId,
            message: `✅ माइग्रेशन बैच ${batchId} को सुरक्षित रूप से रोलबैक कर दिया गया है। केवल इसी बैच के रिकॉर्ड्स हटाए गए हैं।`,
            vault_synced: vaultSynced
        };
    }

    /**
     * Standalone Retry for Shadow Vault Mirroring (Copies Primary DB to Vault only).
     * NEVER re-runs any migration or database mutation.
     */
    static retryVaultSync(batchId, customDb = null) {
        this.initTables(customDb);
        const db = customDb || getDb();
        try {
            if (!customDb) syncShadowVault();
            if (batchId) {
                db.prepare("UPDATE migration_batches SET vault_synced = 'SYNCED' WHERE batch_id = ?").run(batchId);
            }
            return { success: true, message: 'शैडो वॉल्ट में डेटाबेस सफलतापूर्वक मिरर हो गया।' };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
}

module.exports = MigrationService;
