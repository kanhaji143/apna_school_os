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

    static processSalaryPayment({ employeeId, salaryMonth, basicSalary, allowances = 0, advanceDeduction = 0, absentDeduction = 0, paymentMode = 'Cash', preparedBy = 'Admin', remarks = '' }) {
        const db = getDb();
        const emp = this.getEmployeeById(employeeId);
        if (!emp) throw new Error('Employee not found');

        const netPaid = (basicSalary + allowances) - (advanceDeduction + absentDeduction);
        const voucherNo = `SAL-${salaryMonth.replace(/\s+/g, '-').toUpperCase()}-${String(emp.id).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;

        // Insert salary payment
        const stmt = db.prepare(`
            INSERT INTO salary_payments (
                voucher_no, employee_id, salary_month, basic_salary, allowances,
                advance_deduction, absent_deduction, net_paid, payment_mode, transaction_status, prepared_by, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', ?, ?)
        `);
        stmt.run(voucherNo, employeeId, salaryMonth, basicSalary, allowances, advanceDeduction, absentDeduction, netPaid, paymentMode, preparedBy, remarks);

        // If advance deduction occurred, mark pending advances as settled
        if (advanceDeduction > 0) {
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
                `मूल वेतन (Basic): ₹${payment.basic_salary.toLocaleString('en-IN')}\n` +
                (payment.allowances > 0 ? `भत्ता (Allowances): ₹${payment.allowances.toLocaleString('en-IN')}\n` : '') +
                (payment.advance_deduction > 0 ? `अग्रिम कटौती (Advance): -₹${payment.advance_deduction.toLocaleString('en-IN')}\n` : '') +
                (payment.absent_deduction > 0 ? `अनुपस्थिति कटौती: -₹${payment.absent_deduction.toLocaleString('en-IN')}\n` : '') +
                `*शुद्ध देय राशि (Net Paid): ₹${payment.net_paid.toLocaleString('en-IN')}*\n` +
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
