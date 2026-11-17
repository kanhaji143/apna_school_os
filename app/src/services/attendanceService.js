const { getDb, syncShadowVault } = require('../database/db');

class AttendanceService {
    static getStudentAttendance(className = 'Class 1', date = null) {
        const db = getDb();
        const dateStr = date || new Date().toISOString().slice(0, 10);
        
        const students = db.prepare(`
            SELECT s.id, s.admission_no, s.roll_no, s.student_name, s.father_name, s.class, s.section,
                   COALESCE(sa.status, 'P') as attendance_status,
                   COALESCE(sa.remarks, '') as remarks
            FROM students s
            LEFT JOIN student_attendance sa ON s.id = sa.student_id AND sa.attendance_date = ?
            WHERE s.class = ? AND s.status = 'Active'
            ORDER BY CAST(s.roll_no AS INTEGER) ASC, s.student_name ASC
        `).all(dateStr, className);

        const presentCount = students.filter(s => s.attendance_status === 'P').length;
        const absentCount = students.filter(s => s.attendance_status === 'A').length;
        const leaveCount = students.filter(s => s.attendance_status === 'L').length;

        return {
            class: className,
            date: dateStr,
            total_students: students.length,
            present_count: presentCount,
            absent_count: absentCount,
            leave_count: leaveCount,
            roster: students
        };
    }

    static saveStudentAttendance(attendanceList, date = null) {
        const db = getDb();
        const dateStr = date || new Date().toISOString().slice(0, 10);
        
        const stmt = db.prepare(`
            INSERT INTO student_attendance (student_id, attendance_date, status, remarks)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(student_id, attendance_date) DO UPDATE SET
                status = excluded.status,
                remarks = excluded.remarks
        `);

        for (const item of attendanceList) {
            stmt.run(item.student_id, dateStr, item.status || 'P', item.remarks || '');
        }

        syncShadowVault();

        return { success: true, count: attendanceList.length, date: dateStr };
    }

    static getStaffAttendance(department = 'Teaching', date = null) {
        const db = getDb();
        const dateStr = date || new Date().toISOString().slice(0, 10);

        let query = `
            SELECT e.id, e.employee_id, e.employee_name, e.designation, e.department, e.monthly_salary, e.mobile_no,
                   COALESCE(sa.status, 'P') as attendance_status,
                   COALESCE(sa.remarks, '') as remarks
            FROM employees e
            LEFT JOIN staff_attendance sa ON e.id = sa.employee_id AND sa.attendance_date = ?
            WHERE e.status = 'Active'
        `;
        const params = [dateStr];
        if (department && department !== 'All') {
            query += ` AND e.department = ?`;
            params.push(department);
        }
        query += ` ORDER BY e.id ASC`;

        const staff = db.prepare(query).all(...params);

        const presentCount = staff.filter(s => s.attendance_status === 'P').length;
        const absentCount = staff.filter(s => s.attendance_status === 'A').length;
        const leaveCount = staff.filter(s => s.attendance_status === 'L').length;

        return {
            department,
            date: dateStr,
            total_staff: staff.length,
            present_count: presentCount,
            absent_count: absentCount,
            leave_count: leaveCount,
            staff
        };
    }

    static saveStaffAttendance(attendanceList, date = null) {
        const db = getDb();
        const dateStr = date || new Date().toISOString().slice(0, 10);

        const stmt = db.prepare(`
            INSERT INTO staff_attendance (employee_id, attendance_date, status, remarks)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(employee_id, attendance_date) DO UPDATE SET
                status = excluded.status,
                remarks = excluded.remarks
        `);

        for (const item of attendanceList) {
            stmt.run(item.employee_id, dateStr, item.status || 'P', item.remarks || '');
        }

        syncShadowVault();

        return { success: true, count: attendanceList.length, date: dateStr };
    }

    static getHolidays() {
        const db = getDb();
        return db.prepare('SELECT * FROM academic_holidays ORDER BY start_date ASC').all();
    }

    static addHoliday({ holiday_name, start_date, end_date, remarks = '' }) {
        const db = getDb();
        const stmt = db.prepare(`
            INSERT INTO academic_holidays (holiday_name, start_date, end_date, session, remarks)
            VALUES (?, ?, ?, '2026-27', ?)
        `);
        const res = stmt.run(holiday_name, start_date, end_date, remarks);
        syncShadowVault();
        return { id: res.lastInsertRowid, holiday_name, start_date, end_date };
    }
}

module.exports = AttendanceService;
