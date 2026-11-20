const { getDb, syncShadowVault } = require('../database/db');

class PayrollService {
    static getEmployees() {
        const db = getDb();
        return db.prepare('SELECT * FROM employees ORDER BY id ASC').all();
    }

    static getEmployeeById(employeeId) {
        const db = getDb();
        return db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
    }

    static recordAdvance(employeeId, amount, advanceDate = null, remarks = 'Emergency Advance') {
        const db = getDb();
        const dateStr = advanceDate || new Date().toISOString().slice(0, 10);
        const stmt = db.prepare(`
            INSERT INTO salary_advances (employee_id, advance_date, amount, status, remarks)
            VALUES (?, ?, ?, 'pending', ?)
        `);
        return stmt.run(employeeId, dateStr, amount, remarks);
    }

    static getPendingAdvance(employeeId) {
        const db = getDb();
        const row = db.prepare(`
            SELECT SUM(amount) as total_advance
            FROM salary_advances
            WHERE employee_id = ? AND status = 'pending'
        `).get(employeeId);
        return row && row.total_advance ? row.total_advance : 0.0;
    }

    static processSalaryPayment({
        employeeId, employee_id,
        salaryMonth, salary_month,
        basicSalary, basic_salary,
        daAmount = 0, da_amount = 0,
        hraAmount = 0, hra_amount = 0,
        conveyanceAmount = 0, conveyance_amount = 0,
        medicalAllowance = 0, medical_allowance = 0,
        incentiveAmount = 0, incentive_amount = 0,
        bonusAmount = 0, bonus_amount = 0,
        allowances = 0,
        advanceDeduction = 0, advance_deduction = 0,
        absentDeduction = 0, absent_deduction = 0,
        epfDeduction = 0, epf_deduction = 0,
        esiDeduction = 0, esi_deduction = 0,
        otherDeduction = 0, other_deduction = 0,
        paymentMode = 'Cash', payment_mode = 'Cash',
        preparedBy = 'Admin', prepared_by = 'Admin',
        remarks = ''
    }) {
        const targetEmpId = employeeId || employee_id;
        const targetMonth = salaryMonth || salary_month;
        const base = parseFloat(basicSalary || basic_salary) || 0;
        const da = parseFloat(daAmount || da_amount) || 0;
        const hra = parseFloat(hraAmount || hra_amount) || 0;
        const conv = parseFloat(conveyanceAmount || conveyance_amount) || 0;
        const med = parseFloat(medicalAllowance || medical_allowance) || 0;
        const inc = parseFloat(incentiveAmount || incentive_amount) || 0;
        const bon = parseFloat(bonusAmount || bonus_amount) || 0;
        const advDed = parseFloat(advanceDeduction || advance_deduction) || 0;
        const absDed = parseFloat(absentDeduction || absent_deduction) || 0;
        const epfDed = parseFloat(epfDeduction || epf_deduction) || 0;
        const esiDed = parseFloat(esiDeduction || esi_deduction) || 0;
        const othDed = parseFloat(otherDeduction || other_deduction) || 0;
        const payMode = paymentMode || payment_mode || 'Cash';
        const prepBy = preparedBy || prepared_by || 'Admin';

        const db = getDb();
        const emp = this.getEmployeeById(targetEmpId);
        if (!emp) throw new Error('Employee not found');

        const computedAllowances = da + hra + conv + med + inc + bon;
        const finalAllowances = computedAllowances > 0 ? computedAllowances : (parseFloat(allowances) || 0);
        const grossSalary = base + finalAllowances;
        const totalDeductions = advDed + absDed + epfDed + esiDed + othDed;

        const netPaid = Math.max(0, grossSalary - totalDeductions);
        const voucherNo = `SAL-${String(targetMonth).replace(/\s+/g, '-').toUpperCase()}-${String(emp.id).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;

        // Insert salary payment
        const stmt = db.prepare(`
            INSERT INTO salary_payments (
                voucher_no, employee_id, salary_month, basic_salary, allowances,
                advance_deduction, absent_deduction, net_paid, payment_mode, transaction_status, prepared_by, remarks,
                da_amount, hra_amount, conveyance_amount, medical_allowance, incentive_amount, bonus_amount,
                epf_deduction, esi_deduction, other_deduction, gross_salary, total_deductions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            voucherNo, targetEmpId, targetMonth, base, finalAllowances,
            advDed, absDed, netPaid, payMode, prepBy, remarks,
            da, hra, conv, med, inc, bon,
            epfDed, esiDed, othDed, grossSalary, totalDeductions
        );

        // If advance deduction occurred, mark pending advances as settled
        if (advDed > 0) {
            db.prepare(`
                UPDATE salary_advances
                SET status = 'settled', settled_voucher_no = ?
                WHERE employee_id = ? AND status = 'pending'
            `).run(voucherNo, employeeId);
        }

        // Also record this salary expense into expenses table for P&L auto-tracking
        const expVoucher = `EXP-${voucherNo}`;
        db.prepare(`
            INSERT OR REPLACE INTO expenses (voucher_no, expense_date, category, description, amount, payment_mode, paid_to, remarks)
            VALUES (?, DATE('now'), 'Staff Salary', ?, ?, ?, ?, ?)
        `).run(expVoucher, `Staff Salary for ${emp.employee_name} (${salaryMonth})`, netPaid, paymentMode, emp.employee_name, `Auto-synced from payroll voucher ${voucherNo}`);

        syncShadowVault();

        return this.getSalarySlip(voucherNo);
    }

    static getSalarySlip(voucherNo) {
        const db = getDb();
        const profile = db.prepare('SELECT * FROM institution_profile WHERE id = 1').get();
        const payment = db.prepare(`
            SELECT p.*, e.employee_id as code, e.employee_name, e.designation, e.department, e.bank_account_no, e.ifsc_code, e.mobile_no
            FROM salary_payments p
            JOIN employees e ON p.employee_id = e.id
            WHERE p.voucher_no = ?
        `).get(voucherNo);

        if (!payment) return null;

        const phone = payment.mobile_no ? payment.mobile_no.replace(/\D/g, '') : '';
        let waUrl = '';
        if (phone && phone.length === 10) {
            const msg = encodeURIComponent(
                `*${profile.school_name} - मासिक वेतन पर्ची (Salary Slip)*\n` +
                `कर्मचारी: ${payment.employee_name} (${payment.designation})\n` +
                `वेतन माह: ${payment.salary_month}\n` +
                `वाउचर नं: ${payment.voucher_no}\n` +
                `मूल वेतन (Basic): ₹${Number(payment.basic_salary).toLocaleString('en-IN')}\n` +
                (payment.da_amount > 0 ? `महंगाई भत्ता (DA): ₹${Number(payment.da_amount).toLocaleString('en-IN')}\n` : '') +
                (payment.hra_amount > 0 ? `मकान किराया (HRA): ₹${Number(payment.hra_amount).toLocaleString('en-IN')}\n` : '') +
                (payment.conveyance_amount > 0 ? `यातायात भत्ता (Conveyance): ₹${Number(payment.conveyance_amount).toLocaleString('en-IN')}\n` : '') +
                (payment.incentive_amount > 0 ? `इंसेंटिव (Incentive): ₹${Number(payment.incentive_amount).toLocaleString('en-IN')}\n` : '') +
                (payment.bonus_amount > 0 ? `बोनस (Bonus): ₹${Number(payment.bonus_amount).toLocaleString('en-IN')}\n` : '') +
                (payment.medical_allowance > 0 ? `चिकित्सा भत्ता (Medical): ₹${Number(payment.medical_allowance).toLocaleString('en-IN')}\n` : '') +
                (payment.advance_deduction > 0 ? `अग्रिम कटौती (Advance): -₹${Number(payment.advance_deduction).toLocaleString('en-IN')}\n` : '') +
                (payment.absent_deduction > 0 ? `अनुपस्थिति कटौती (LOP): -₹${Number(payment.absent_deduction).toLocaleString('en-IN')}\n` : '') +
                (payment.epf_deduction > 0 ? `EPF कटौती (12%): -₹${Number(payment.epf_deduction).toLocaleString('en-IN')}\n` : '') +
                (payment.esi_deduction > 0 ? `ESI कटौती: -₹${Number(payment.esi_deduction).toLocaleString('en-IN')}\n` : '') +
                (payment.other_deduction > 0 ? `अन्य कटौती: -₹${Number(payment.other_deduction).toLocaleString('en-IN')}\n` : '') +
                `*कुल देय वेतन (Gross): ₹${Number(payment.gross_salary || (payment.basic_salary + payment.allowances)).toLocaleString('en-IN')}*\n` +
                `*शुद्ध इन-हैंड राशि (Net In-Hand): ₹${Number(payment.net_paid).toLocaleString('en-IN')}*\n` +
                `शब्दों में: ${this.numberToWords(payment.net_paid)}\n` +
                `भुगतान मोड: ${payment.payment_mode}\n` +
                `धन्यवाद!`
            );
            waUrl = `https://wa.me/91${phone}?text=${msg}`;
        }

        return {
            institution: profile,
            payment,
            net_in_words: this.numberToWords(payment.net_paid),
            whatsapp_url: waUrl
        };
    }

    static numberToWords(num) {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const n = ('000000000' + Math.floor(num)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return '';
        let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees Only' : 'Rupees Only';
        return str.trim();
    }
}

module.exports = PayrollService;
