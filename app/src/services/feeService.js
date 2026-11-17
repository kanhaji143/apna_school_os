const { getDb, syncShadowVault } = require('../database/db');

class FeeService {
    static getStudentsWithFeeStatus(className = null, search = null) {
        const db = getDb();
        let query = `
            SELECT s.id, s.admission_no, s.roll_no, s.student_name, s.father_name, s.mobile, s.class, s.section, s.status,
                   r.route_name, r.transport_fee as r_fee,
                   fs.expected_fee, fs.old_due, fs.monthly_fee,
                   COALESCE((SELECT SUM(ft.net_amount) FROM fee_transactions ft WHERE ft.student_id = s.id AND ft.status = 'Paid'), 0.0) as total_collected
            FROM students s
            LEFT JOIN routes r ON s.route_id = r.id
            LEFT JOIN student_fee_structure fs ON s.id = fs.student_id
            WHERE 1=1
        `;
        const params = [];
        if (className) {
            query += ` AND s.class = ?`;
            params.push(className);
        }
        if (search) {
            query += ` AND (s.student_name LIKE ? OR s.admission_no LIKE ? OR s.mobile LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        query += ` ORDER BY s.class ASC, CAST(s.roll_no AS INTEGER) ASC`;

        const rows = db.prepare(query).all(...params);

        return rows.map(row => {
            const exp = row.expected_fee || 0.0;
            const coll = row.total_collected || 0.0;
            const due = Math.max(0, exp - coll);
            return {
                ...row,
                due_amount: due,
                fee_badge: due > 0 ? `बाकी ₹${due.toLocaleString('en-IN')}` : 'पूर्ण चुकता (Paid)',
                badge_color: due > 0 ? 'orange' : 'green'
            };
        });
    }

    static collectFee({ studentId, amount, feeHead = 'Monthly Tuition Fee', feeMonth = '', paymentMode = 'Cash', referenceNo = '', collectedBy = 'Admin', remarks = '' }) {
        const db = getDb();
        const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
        if (!student) throw new Error('Student not found');

        // Generate sequential receipt number
        const countRow = db.prepare('SELECT COUNT(*) as cnt FROM fee_transactions').get();
        const nextId = (countRow ? countRow.cnt : 0) + 1;
        const receiptNo = `RCP${String(nextId).padStart(6, '0')}`;
        const txId = `TXN-${Date.now()}-${nextId}`;

        const stmt = db.prepare(`
            INSERT INTO fee_transactions (
                transaction_id, receipt_no, session, student_id, payment_date,
                fee_month, fee_head, standard_fee, amount_received, late_fee,
                discount, net_amount, payment_mode, reference_no, status, collected_by, remarks
            ) VALUES (?, ?, '2026-27', ?, DATE('now'), ?, ?, ?, ?, 0.0, 0.0, ?, ?, ?, 'Paid', ?, ?)
        `);

        stmt.run(txId, receiptNo, studentId, feeMonth, feeHead, amount, amount, amount, paymentMode, referenceNo, collectedBy, remarks);
        syncShadowVault();

        return this.getFeeReceipt(receiptNo);
    }

    static getFeeReceipt(receiptNo) {
        const db = getDb();
        const profile = db.prepare('SELECT * FROM institution_profile WHERE id = 1').get();
        const tx = db.prepare(`
            SELECT ft.*, s.admission_no, s.student_name, s.father_name, s.mother_name, s.class, s.section, s.mobile, s.address,
                   fs.expected_fee,
                   (SELECT SUM(t2.net_amount) FROM fee_transactions t2 WHERE t2.student_id = ft.student_id AND t2.status = 'Paid') as total_collected
            FROM fee_transactions ft
            JOIN students s ON ft.student_id = s.id
            LEFT JOIN student_fee_structure fs ON s.id = fs.student_id
            WHERE ft.receipt_no = ?
        `).get(receiptNo);

        if (!tx) return null;

        const dueBalance = Math.max(0, (tx.expected_fee || 0) - (tx.total_collected || 0));

        // Generate Zero-API WhatsApp URL
        const phone = tx.mobile ? tx.mobile.replace(/\D/g, '') : '';
        let waUrl = '';
        if (phone && phone.length === 10) {
            const textMsg = encodeURIComponent(
                `*${profile.school_name}*\n` +
                `रसीद संख्या: ${tx.receipt_no}\n` +
                `छात्र का नाम: ${tx.student_name} (${tx.class}-${tx.section})\n` +
                `जमा राशि: ₹${tx.net_amount.toLocaleString('en-IN')}\n` +
                `पेमेंट मोड: ${tx.payment_mode}\n` +
                `तारीख: ${tx.payment_date}\n` +
                (dueBalance > 0 ? `शेष बकाया राशि: ₹${dueBalance.toLocaleString('en-IN')}\n` : `फीस स्थिति: पूर्ण चुकता ✅\n`) +
                `धन्यवाद!\nहेल्पलाइन: ${profile.phone}`
            );
            waUrl = `https://wa.me/91${phone}?text=${textMsg}`;
        }

        return {
            institution: profile,
            transaction: tx,
            due_balance: dueBalance,
            whatsapp_url: waUrl
        };
    }

    static getStudentLedger(studentIdOrAdmNo) {
        const db = getDb();
        const profile = db.prepare('SELECT * FROM institution_profile WHERE id = 1').get();

        const student = db.prepare(`
            SELECT s.*, r.route_name, r.transport_fee as route_standard_fee
            FROM students s
            LEFT JOIN routes r ON s.route_id = r.id
            WHERE s.id = ? OR s.admission_no = ?
        `).get(studentIdOrAdmNo, String(studentIdOrAdmNo));

        if (!student) return null;

        const feeStruct = db.prepare(`
            SELECT * FROM student_fee_structure WHERE student_id = ?
        `).get(student.id) || {};

        const transactions = db.prepare(`
            SELECT * FROM fee_transactions
            WHERE student_id = ? AND status = 'Paid'
            ORDER BY payment_date ASC, id ASC
        `).all(student.id);

        const totalExpected = feeStruct.expected_fee || 0.0;
        const totalOldDue = feeStruct.old_due || 0.0;
        const totalPaid = transactions.reduce((sum, tx) => sum + (tx.net_amount || 0.0), 0.0);
        const totalDiscount = transactions.reduce((sum, tx) => sum + (tx.discount || 0.0), 0.0);
        const netDue = Math.max(0, (totalExpected + totalOldDue) - totalPaid);

        // Pre-build 1-click WhatsApp Ledger Summary URL
        const phone = student.mobile ? student.mobile.replace(/\D/g, '') : '';
        let waUrl = '';
        if (phone && phone.length === 10) {
            const msg = encodeURIComponent(
                `*${profile.school_name} - छात्र फीस विवरण (Ledger)*\n` +
                `छात्र का नाम: ${student.student_name}\n` +
                `कक्षा: ${student.class} (${student.section}) | SR: ${student.admission_no}\n` +
                `कुल वार्षिक अपेक्षित फीस: ₹${totalExpected.toLocaleString('en-IN')}\n` +
                `कुल जमा राशि: ₹${totalPaid.toLocaleString('en-IN')}\n` +
                `कुल छूट: ₹${totalDiscount.toLocaleString('en-IN')}\n` +
                `शेष बकाया (Outstanding Balance): ₹${netDue.toLocaleString('en-IN')}\n` +
                `लेनदेन रसीदें: ${transactions.length} रसीदें निर्गत\n` +
                `स्थिति: ${netDue === 0 ? 'पूर्ण चुकता (No Dues) ✅' : 'बकाया शेष ⚠️'}\n` +
                `हेल्पलाइन: ${profile.phone}`
            );
            waUrl = `https://wa.me/91${phone}?text=${msg}`;
        }

        return {
            institution: profile,
            student,
            fee_structure: feeStruct,
            transactions,
            summary: {
                expected_fee: totalExpected,
                old_due: totalOldDue,
                gross_payable: totalExpected + totalOldDue,
                total_paid: totalPaid,
                total_discount: totalDiscount,
                outstanding_due: netDue,
                fee_status: netDue === 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid'),
                receipts_count: transactions.length
            },
            whatsapp_url: waUrl
        };
    }

    static getClassRecoveryReport() {
        const db = getDb();
        const classes = ['PG', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'];

        return classes.map(cls => {
            const countRow = db.prepare("SELECT COUNT(*) as cnt FROM students WHERE class = ? AND status = 'Active'").get(cls);
            const totalStudents = countRow ? countRow.cnt : 0;

            const feeSumRow = db.prepare(`
                SELECT SUM(fs.expected_fee) as exp, SUM(fs.old_due) as old_d
                FROM student_fee_structure fs
                JOIN students s ON fs.student_id = s.id
                WHERE s.class = ? AND s.status = 'Active'
            `).get(cls) || {};

            const expected = (feeSumRow.exp || 0.0) + (feeSumRow.old_d || 0.0);

            const collRow = db.prepare(`
                SELECT SUM(ft.net_amount) as coll
                FROM fee_transactions ft
                JOIN students s ON ft.student_id = s.id
                WHERE s.class = ? AND ft.status = 'Paid'
            `).get(cls) || {};

            const collected = collRow.coll || 0.0;
            const outstanding = Math.max(0, expected - collected);
            const recoveryPercent = expected > 0 ? ((collected / expected) * 100).toFixed(1) : '0.0';

            return {
                class_name: cls,
                total_students: totalStudents,
                expected_fee: expected,
                collected_fee: collected,
                outstanding_fee: outstanding,
                recovery_percentage: parseFloat(recoveryPercent)
            };
        });
    }

    static getMonthlyCollectionReport() {
        const db = getDb();
        const months = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

        return months.map(m => {
            const txRow = db.prepare(`
                SELECT 
                    COALESCE(SUM(net_amount), 0.0) as collection,
                    COUNT(id) as transactions_count,
                    COUNT(DISTINCT student_id) as students_paid
                FROM fee_transactions
                WHERE status = 'Paid' AND (fee_month = ? OR fee_period LIKE ?)
            `).get(m, `%${m}%`);

            const coll = txRow.collection || 0.0;
            const txs = txRow.transactions_count || 0;
            const avg = txs > 0 ? Math.round(coll / txs) : 0;

            return {
                month: m,
                collection: coll,
                transactions: txs,
                students_paid: txRow.students_paid || 0,
                average_collection: avg
            };
        });
    }

    static getExecutiveSummaryReport() {
        const db = getDb();
        const profile = db.prepare('SELECT * FROM institution_profile WHERE id = 1').get();

        const studentCounts = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive
            FROM students
        `).get();

        const feeSums = db.prepare(`
            SELECT 
                COALESCE(SUM(expected_fee), 0.0) as total_expected,
                COALESCE(SUM(old_due), 0.0) as total_old_due
            FROM student_fee_structure
        `).get();

        const txSums = db.prepare(`
            SELECT 
                COALESCE(SUM(net_amount), 0.0) as total_collected,
                COUNT(id) as total_transactions,
                COALESCE(SUM(CASE WHEN payment_date = DATE('now') THEN net_amount ELSE 0.0 END), 0.0) as today_collection,
                COALESCE(SUM(CASE WHEN strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now') THEN net_amount ELSE 0.0 END), 0.0) as this_month_collection
            FROM fee_transactions
            WHERE status = 'Paid'
        `).get();

        const expenseSum = db.prepare(`
            SELECT COALESCE(SUM(amount), 0.0) as total_expenses FROM expenses
        `).get();

        const totalExpectedGross = (feeSums.total_expected || 0.0) + (feeSums.total_old_due || 0.0);
        const totalCollected = txSums.total_collected || 0.0;
        const totalOutstanding = Math.max(0, totalExpectedGross - totalCollected);
        const collectionEfficiency = totalExpectedGross > 0 ? ((totalCollected / totalExpectedGross) * 100).toFixed(2) : '0.00';

        // Categorize student payment status
        const studentFeeStatuses = db.prepare(`
            SELECT 
                s.id,
                (fs.expected_fee + fs.old_due) as exp,
                COALESCE(SUM(ft.net_amount), 0.0) as paid
            FROM students s
            LEFT JOIN student_fee_structure fs ON s.id = fs.student_id
            LEFT JOIN fee_transactions ft ON s.id = ft.student_id AND ft.status = 'Paid'
            WHERE s.status = 'Active'
            GROUP BY s.id
        `).all();

        let paidCount = 0;
        let partialCount = 0;
        let dueCount = 0;

        studentFeeStatuses.forEach(row => {
            const exp = row.exp || 0.0;
            const paid = row.paid || 0.0;
            if (paid >= exp && exp > 0) {
                paidCount++;
            } else if (paid > 0) {
                partialCount++;
            } else {
                dueCount++;
            }
        });

        return {
            institution: profile,
            kpis: {
                total_students: studentCounts.total || 0,
                active_students: studentCounts.active || 0,
                inactive_students: studentCounts.inactive || 0,
                total_expected_revenue: totalExpectedGross,
                total_collected: totalCollected,
                total_outstanding: totalOutstanding,
                collection_efficiency_percentage: parseFloat(collectionEfficiency),
                fully_paid_students: paidCount,
                partial_paid_students: partialCount,
                due_students: dueCount,
                today_collection: txSums.today_collection || 0.0,
                this_month_collection: txSums.this_month_collection || 0.0,
                total_transactions_count: txSums.total_transactions || 0,
                total_school_expenses: expenseSum.total_expenses || 0.0,
                net_surplus_balance: totalCollected - (expenseSum.total_expenses || 0.0)
            }
        };
    }
}

module.exports = FeeService;
