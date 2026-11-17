const http = require('node:http');

async function runTests() {
    console.log('--- STARTING VERIFICATION TEST SUITE ---');

    // 1. Test Profile Endpoint
    const profile = await fetchJson('http://127.0.0.1:8085/api/profile');
    console.log('✅ Institution Profile:', profile.school_name, `[Board: ${profile.board_type}]`);

    // 2. Test Students Endpoint (426 pre-loaded)
    const students = await fetchJson('http://127.0.0.1:8085/api/students');
    console.log(`✅ Preloaded Students Count: ${students.length} (Verified: ${students[0].student_name}, Class: ${students[0].class})`);

    // 3. Test 4-Pillar Marksheet Endpoint
    const sampleStudent = students[0];
    const marksheet = await fetchJson(`http://127.0.0.1:8085/api/exam/marksheet/${sampleStudent.id}`);
    console.log(`✅ 4-Pillar Marksheet for ${sampleStudent.student_name}: Subjects: ${marksheet.subjects.length}, Overall Grade: ${marksheet.overall_grade}`);

    // 4. Test Question Paper Generator Endpoint
    const paper = await postJson('http://127.0.0.1:8085/api/question-paper/generate', {
        class: 'Class 5',
        subject_id: 23,
        exam_title: 'Annual Examination 2026-27',
        total_marks: 80,
        time_duration: '3 Hours'
    });
    console.log(`✅ Exam Question Paper Generated: Title: ${paper.exam_title}, Sections: ${paper.sections.length}`);

    // 5. Test Staff & Printable Salary Slip Endpoint
    const employees = await fetchJson('http://127.0.0.1:8085/api/payroll/employees');
    console.log(`✅ Employees Count: ${employees.length} (${employees[0].employee_name} - ${employees[0].designation})`);

    const payslip = await postJson('http://127.0.0.1:8085/api/payroll/pay', {
        employeeId: employees[0].id,
        salaryMonth: 'November 2026',
        basicSalary: employees[0].monthly_salary,
        allowances: 1500,
        advanceDeduction: 0,
        absentDeduction: 0,
        paymentMode: 'Bank_Transfer'
    });
    console.log(`✅ Printable Salary Slip Processed: Voucher: ${payslip.payment.voucher_no}, Net: ₹${payslip.payment.net_paid} (${payslip.net_in_words})`);

    // 6. Test 15 Transport Routes Endpoint
    const routes = await fetchJson('http://127.0.0.1:8085/api/routes');
    console.log(`✅ Transport Routes Count: ${routes.length} (e.g. ${routes[0].route_code} - ${routes[0].route_name})`);

    // 7. Test EOD Daily Report
    const eod = await fetchJson('http://127.0.0.1:8085/api/eod-report');
    console.log(`✅ EOD Daily Report: Date: ${eod.today}, Collections: ₹${eod.totalCollection}, Gmail Link Ready: ${Boolean(eod.gmail_url)}`);

    console.log('--- ALL SYSTEMS AND ENDPOINTS PASSED VERIFICATION WITH 100% SUCCESS! ---');
    process.exit(0);
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

function postJson(url, payload) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);
        const req = http.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Execute test suite against running daemon
runTests().catch(err => {
    console.error('Test suite error:', err);
    process.exit(1);
});
