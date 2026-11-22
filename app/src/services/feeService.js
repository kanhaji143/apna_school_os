const { getDb, syncShadowVault } = require('../database/db');

class FeeService {
    static getStudentsWithFeeStatus(className = null, search = null) {
        const db = getDb();
        let query = `
            SELECT s.id, s.admission_no, s.roll_no, s.student_name, s.father_name, s.mother_name,
                   s.gender, s.dob, s.mobile, s.alt_mobile, s.aadhaar_no, s.pen_no, s.pen_number,
                   s.blood_group, s.category, s.parent_occupation, s.previous_school, s.tc_no,
                   s.address, s.photo_path, s.class, s.section, s.status, s.admission_date,
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

    static collectFee({ studentId, amount, feeHead = 'Monthly Tuition Fee', feeMonth = '', session = '2026-27', paymentMode = 'Cash', referenceNo = '', collectedBy = 'Admin', remarks = '' }) {
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
            ) VALUES (?, ?, ?, ?, DATE('now'), ?, ?, ?, ?, 0.0, 0.0, ?, ?, ?, 'Paid', ?, ?)
        `);

        stmt.run(txId, receiptNo, session || '2026-27', studentId, feeMonth, feeHead, amount, amount, amount, paymentMode, referenceNo, collectedBy, remarks);

        // If paying towards old session due, reduce old_due in student_fee_structure in real time
        if (feeHead === 'Old Session Due' || (session && session !== '2026-27')) {
            db.prepare(`
                UPDATE student_fee_structure 
                SET old_due = MAX(0, old_due - ?)
                WHERE student_id = ?
            `).run(Number(amount) || 0, studentId);
        }

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

        // Generate Zero-API WhatsApp URL (Bilingual Standard: English on Top, Hindi Translation Below)
        const phone = tx.mobile ? tx.mobile.replace(/\D/g, '') : '';
        let waUrl = '';
        if (phone && phone.length === 10) {
            const dueStatusEn = dueBalance > 0 ? `Net Outstanding Dues: ₹${dueBalance.toLocaleString('en-IN')}` : `Status: Fully Paid (No Dues) ✅`;
            const dueStatusHi = dueBalance > 0 ? `शेष बकाया राशि: ₹${dueBalance.toLocaleString('en-IN')}` : `फीस स्थिति: पूर्ण चुकता (कोई बकाया नहीं) ✅`;

            const textMsg = encodeURIComponent(
                `*${(profile.school_name || 'Apna Institute').toUpperCase()}*\n` +
                `*OFFICIAL FEE PAYMENT RECEIPT*\n` +
                `Receipt No: ${tx.receipt_no}\n` +
                `Student: ${tx.student_name} (${tx.class}-${tx.section || 'A'})\n` +
                `Amount Received: ₹${tx.net_amount.toLocaleString('en-IN')}\n` +
                `Payment Mode: ${tx.payment_mode}\n` +
                `Date: ${tx.payment_date}\n` +
                `${dueStatusEn}\n\n` +
                `------------------------------------\n` +
                `*आधिकारिक फ़ीस भुगतान रसीद (हिंदी विवरण)*\n` +
                `रसीद संख्या: ${tx.receipt_no}\n` +
                `छात्र का नाम: ${tx.student_name}\n` +
                `प्राप्त राशि: ₹${tx.net_amount.toLocaleString('en-IN')}\n` +
                `${dueStatusHi}\n\n` +
                `Thank you / धन्यवाद!\n` +
                `Helpline: ${profile.phone || '8504985149'}`
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

    static getStudentLedger(studentIdOrAdmNo, selectedSession = 'all') {
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

        let allTransactions = db.prepare(`
            SELECT * FROM fee_transactions
            WHERE student_id = ? AND status = 'Paid'
            ORDER BY payment_date ASC, id ASC
        `).all(student.id);

        let transactions = allTransactions;
        if (selectedSession && selectedSession !== 'all') {
            transactions = allTransactions.filter(tx => tx.session === selectedSession);
        }

        const totalExpected = (selectedSession === 'all' || selectedSession === '2026-27') ? (feeStruct.expected_fee || 0.0) : 0.0;
        const totalOldDue = feeStruct.old_due || 0.0;
        const totalPaid = transactions.reduce((sum, tx) => sum + (tx.net_amount || 0.0), 0.0);
        const totalDiscount = transactions.reduce((sum, tx) => sum + (tx.discount || 0.0), 0.0);
        
        let netDue = 0;
        let advanceAmount = 0;

        if (selectedSession === '2025-26' || selectedSession === '2024-25') {
            // For past session, expected is old_due
            netDue = Math.max(0, totalOldDue - totalPaid);
            advanceAmount = Math.max(0, totalPaid - totalOldDue);
        } else {
            // For current or all sessions
            netDue = Math.max(0, (totalExpected + totalOldDue) - totalPaid);
            advanceAmount = Math.max(0, totalPaid - (totalExpected + totalOldDue));
        }

        // Pre-build 1-click WhatsApp Ledger Summary URL
        const phone = student.mobile ? student.mobile.replace(/\D/g, '') : '';
        let waUrl = '';
        if (phone && phone.length === 10) {
            const dueTxt = netDue === 0 ? 'पूर्ण चुकता (No Dues) ✅' : `शेष बकाया: ₹${netDue.toLocaleString('en-IN')} ⚠️`;
            const advTxt = advanceAmount > 0 ? `\nअग्रिम जमा (Advance): ₹${advanceAmount.toLocaleString('en-IN')} 💰` : '';
            const msg = encodeURIComponent(
                `*${profile.school_name} - छात्र बही-खाता (360° Ledger)*\n` +
                `छात्र का नाम: ${student.student_name}\n` +
                `कक्षा: ${student.class} (${student.section || 'A'}) | Adm No: ${student.admission_no}\n` +
                `सत्र (Session): ${selectedSession === 'all' ? 'समस्त सत्र' : selectedSession}\n` +
                `चालू सत्र फीस: ₹${totalExpected.toLocaleString('en-IN')}\n` +
                `पुराना सत्र बकाया: ₹${totalOldDue.toLocaleString('en-IN')}\n` +
                `कुल जमा राशि: ₹${totalPaid.toLocaleString('en-IN')}\n` +
                `स्थिति: ${dueTxt}${advTxt}\n` +
                `कुल रसीदें: ${transactions.length}\n` +
                `हेल्पलाइन: ${profile.phone || '8504985149'}`
            );
            waUrl = `https://wa.me/91${phone}?text=${msg}`;
        }

        return {
            institution: profile,
            student,
            fee_structure: feeStruct,
            transactions,
            all_transactions_count: allTransactions.length,
            selected_session: selectedSession,
            summary: {
                selected_session: selectedSession,
                expected_fee: totalExpected,
                old_due: totalOldDue,
                gross_payable: totalExpected + totalOldDue,
                total_paid: totalPaid,
                total_discount: totalDiscount,
                outstanding_due: netDue,
                advance_amount: advanceAmount,
                fee_status: netDue === 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid'),
                receipts_count: transactions.length
            },
            whatsapp_url: waUrl
        };
    }

    static getSessionOutstandingReport(session = 'all_previous', className = 'all') {
        const db = getDb();
        let query = `
            SELECT s.id, s.admission_no, s.roll_no, s.student_name, s.father_name, s.mobile,
                   s.class, s.section,
                   COALESCE(fs.old_due, 0) as old_due,
                   COALESCE(fs.expected_fee, 0) as expected_fee,
                   COALESCE((SELECT SUM(ft.net_amount) FROM fee_transactions ft WHERE ft.student_id = s.id AND ft.status = 'Paid'), 0.0) as total_collected,
                   COALESCE((SELECT SUM(ft.net_amount) FROM fee_transactions ft WHERE ft.student_id = s.id AND ft.status = 'Paid' AND (ft.fee_head = 'Old Session Due' OR ft.session != '2026-27')), 0.0) as old_due_collected
            FROM students s
            LEFT JOIN student_fee_structure fs ON s.id = fs.student_id
            WHERE s.status = 'Active'
        `;
        const params = [];
        if (className && className !== 'all') {
            query += ` AND s.class = ? `;
            params.push(className);
        }

        query += ` ORDER BY s.class ASC, s.student_name ASC`;
        const allStudents = db.prepare(query).all(...params);

        const studentsWithDues = allStudents.map(s => {
            const currentExpected = s.expected_fee || 0;
            const currentCollected = Math.max(0, s.total_collected - s.old_due_collected);
            const currentDue = Math.max(0, currentExpected - currentCollected);
            const remainingOldDue = Math.max(0, s.old_due);
            const totalNetDue = remainingOldDue + currentDue;

            return {
                id: s.id,
                admission_no: s.admission_no,
                roll_no: s.roll_no,
                student_name: s.student_name,
                father_name: s.father_name,
                mobile: s.mobile,
                class: s.class,
                section: s.section || 'A',
                old_due: remainingOldDue,
                current_fee: currentExpected,
                current_due: currentDue,
                total_collected: s.total_collected,
                net_due: totalNetDue,
                has_old_due: remainingOldDue > 0
            };
        }).filter(s => {
            if (session === 'all_previous' || session === '2025-26' || session === '2024-25') {
                return s.old_due > 0;
            }
            return s.net_due > 0;
        });

        const totalOldDues = studentsWithDues.reduce((sum, s) => sum + s.old_due, 0);
        const totalCurrentDues = studentsWithDues.reduce((sum, s) => sum + s.current_due, 0);
        const totalNetDues = studentsWithDues.reduce((sum, s) => sum + s.net_due, 0);

        return {
            session: session || 'all_previous',
            class_filter: className || 'all',
            student_count: studentsWithDues.length,
            total_old_dues: totalOldDues,
            total_current_dues: totalCurrentDues,
            total_net_dues: totalNetDues,
            students: studentsWithDues
        };
    }

    static importOldDuesBatch(records) {
        const db = getDb();
        if (!Array.isArray(records) || records.length === 0) {
            throw new Error('No records provided for import');
        }

        const updateStmt = db.prepare(`
            UPDATE student_fee_structure
            SET old_due = ?
            WHERE student_id = (SELECT id FROM students WHERE admission_no = ? OR sr_no = ? LIMIT 1)
        `);

        let updatedCount = 0;
        let notFoundCount = 0;

        const tx = db.transaction(() => {
            for (const r of records) {
                const admNo = String(r.admission_no || r.adm_no || r.sr_no || '').trim();
                const dueAmount = parseFloat(r.old_due || r.amount || r.due || 0);
                if (admNo && !isNaN(dueAmount)) {
                    const res = updateStmt.run(dueAmount, admNo, admNo);
                    if (res.changes > 0) {
                        updatedCount++;
                    } else {
                        notFoundCount++;
                    }
                }
            }
        });

        tx();
        syncShadowVault();

        return {
            success: true,
            updated_count: updatedCount,
            not_found_count: notFoundCount,
            total_received: records.length
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
