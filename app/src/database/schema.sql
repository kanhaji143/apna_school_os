-- =========================================================================
-- APNA COMPUTER RMS ENTERPRISE v2.0 - CORE DATABASE SCHEMA
-- Default Pre-loaded Institution: Lakshya Institute Of Child Education
-- Architecture: 100% Offline-First SQLite (WAL Mode) with Self-Healing Shadow Vault
-- =========================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- 1. INSTITUTION WHITE-LABEL PROFILE
CREATE TABLE IF NOT EXISTS institution_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    school_name TEXT NOT NULL DEFAULT 'Lakshya Institute Of Child Education',
    tag_line TEXT DEFAULT 'A Premier Center of Child Development & Education',
    affiliation_no TEXT DEFAULT 'UP-STATE-BOARD / CBSE-ALIGNED',
    udise_code TEXT DEFAULT '09430801234',
    address TEXT NOT NULL DEFAULT 'Amethi - Durgapur Rd, Ngardeeh, Bhadar, Amethi, Uttar Pradesh 227406',
    phone TEXT NOT NULL DEFAULT '8303324088',
    alt_phone TEXT DEFAULT '8504985149',
    email TEXT DEFAULT 'lakshyaschool@gmail.com',
    website TEXT DEFAULT 'https://lakshyachildedu.org',
    logo_path TEXT DEFAULT '',
    board_type TEXT NOT NULL DEFAULT 'UP_STATE', -- 'UP_STATE', 'CBSE', 'CUSTOM'
    current_session TEXT NOT NULL DEFAULT '2026-27',
    principal_name TEXT DEFAULT 'Principal / Director',
    developer_credit TEXT DEFAULT 'Created By: Apna Computer | Helpline: 8504985149',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. USER ROLES & RBAC AUTHENTICATION
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'accountant', 'counselor', 'demo')),
    full_name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. TRANSPORT ROUTE MASTER (15 Pre-loaded Routes)
CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_code TEXT UNIQUE NOT NULL,
    route_name TEXT NOT NULL,
    transport_fee REAL NOT NULL DEFAULT 0.0,
    driver_name TEXT DEFAULT '',
    driver_phone TEXT DEFAULT '',
    vehicle_no TEXT DEFAULT '',
    capacity INTEGER DEFAULT 40,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    remarks TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. STUDENT MASTER
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_no TEXT UNIQUE NOT NULL,
    sr_no TEXT DEFAULT '',
    roll_no TEXT DEFAULT '',
    student_name TEXT NOT NULL,
    father_name TEXT DEFAULT '',
    mother_name TEXT DEFAULT '',
    gender TEXT DEFAULT 'Male' CHECK (gender IN ('Male', 'Female', 'Other')),
    dob DATE,
    mobile TEXT DEFAULT '',
    alt_mobile TEXT DEFAULT '',
    aadhaar_no TEXT DEFAULT '',
    pen_no TEXT DEFAULT '',
    address TEXT DEFAULT '',
    class TEXT NOT NULL,
    section TEXT DEFAULT 'A',
    route_id INTEGER REFERENCES routes(id) ON DELETE SET NULL,
    admission_date DATE DEFAULT (DATE('now')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'TC_Issued', 'Suspended')),
    remarks TEXT DEFAULT '',
    admission_type TEXT DEFAULT 'Regular',
    photo_path TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indices for 10,000+ Student Fast Search
CREATE INDEX IF NOT EXISTS idx_students_adm ON students(admission_no);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class, section);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_mobile ON students(mobile);

-- 5. OFFLINE SCHOOL DRIVE (STUDENT DOCUMENT VAULT)
CREATE TABLE IF NOT EXISTS student_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('aadhaar', 'tc', 'marksheet', 'photo', 'income', 'caste', 'other')),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. STUDENT FEE STRUCTURE & LEDGER
CREATE TABLE IF NOT EXISTS student_fee_structure (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session TEXT NOT NULL DEFAULT '2026-27',
    admission_fee REAL DEFAULT 0.0,
    monthly_fee REAL DEFAULT 0.0,
    quarterly_exam_fee REAL DEFAULT 0.0,
    half_yearly_exam_fee REAL DEFAULT 0.0,
    annual_exam_fee REAL DEFAULT 0.0,
    transport_fee REAL DEFAULT 0.0,
    computer_fee REAL DEFAULT 0.0,
    library_fee REAL DEFAULT 0.0,
    sports_fee REAL DEFAULT 0.0,
    activity_fee REAL DEFAULT 0.0,
    fine REAL DEFAULT 0.0,
    old_due REAL DEFAULT 0.0,
    expected_fee REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. FEE TRANSACTIONS & RECEIPTS
CREATE TABLE IF NOT EXISTS fee_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT UNIQUE NOT NULL,
    receipt_no TEXT NOT NULL,
    session TEXT NOT NULL DEFAULT '2026-27',
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    payment_date DATE NOT NULL DEFAULT (DATE('now')),
    fee_month TEXT DEFAULT '',
    fee_period TEXT DEFAULT '',
    fee_head TEXT NOT NULL,
    standard_fee REAL DEFAULT 0.0,
    amount_received REAL NOT NULL,
    late_fee REAL DEFAULT 0.0,
    discount REAL DEFAULT 0.0,
    net_amount REAL NOT NULL,
    payment_mode TEXT DEFAULT 'Cash' CHECK (payment_mode IN ('Cash', 'UPI', 'Bank_Transfer', 'Cheque', 'Card')),
    reference_no TEXT DEFAULT '', -- UTR No. for UPI
    payment_screenshot_path TEXT DEFAULT '',
    status TEXT DEFAULT 'Paid' CHECK (status IN ('Paid', 'Pending', 'Cancelled')),
    collected_by TEXT DEFAULT 'Admin',
    receipt_batch TEXT DEFAULT '',
    remarks TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tx_student ON fee_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_tx_date ON fee_transactions(payment_date);
CREATE INDEX IF NOT EXISTS idx_tx_receipt ON fee_transactions(receipt_no);

-- 8. STAFF & EMPLOYEE MASTER
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT UNIQUE NOT NULL,
    employee_name TEXT NOT NULL,
    father_name TEXT DEFAULT '',
    mobile_no TEXT DEFAULT '',
    joining_date DATE,
    designation TEXT NOT NULL, -- 'Principal', 'Teacher', 'Accountant', 'Driver', 'Peon'
    employment_type TEXT DEFAULT 'Permanent' CHECK (employment_type IN ('Permanent', 'Contract', 'Part-Time', 'Guest')),
    department TEXT DEFAULT 'Teaching',
    monthly_salary REAL NOT NULL DEFAULT 0.0,
    bank_account_no TEXT DEFAULT '',
    ifsc_code TEXT DEFAULT '',
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'On_Leave', 'Resigned', 'Terminated')),
    remarks TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. SALARY ADVANCES TRACKER
CREATE TABLE IF NOT EXISTS salary_advances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    advance_date DATE NOT NULL DEFAULT (DATE('now')),
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'settled')),
    settled_voucher_no TEXT DEFAULT '',
    remarks TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. PAYROLL & PRINTABLE SALARY SLIPS
CREATE TABLE IF NOT EXISTS salary_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voucher_no TEXT UNIQUE NOT NULL,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    salary_month TEXT NOT NULL, -- e.g. 'November 2026'
    basic_salary REAL NOT NULL,
    allowances REAL DEFAULT 0.0,
    advance_deduction REAL DEFAULT 0.0,
    absent_deduction REAL DEFAULT 0.0,
    net_paid REAL NOT NULL,
    payment_mode TEXT DEFAULT 'Cash' CHECK (payment_mode IN ('Cash', 'Bank_Transfer', 'Cheque', 'UPI')),
    payment_date DATE NOT NULL DEFAULT (DATE('now')),
    transaction_status TEXT DEFAULT 'Paid' CHECK (transaction_status IN ('Paid', 'Pending')),
    prepared_by TEXT DEFAULT 'Admin',
    remarks TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_salary_emp ON salary_payments(employee_id);

-- 11. EXPENSE REGISTER (P&L Tracking)
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voucher_no TEXT UNIQUE NOT NULL,
    expense_date DATE NOT NULL DEFAULT (DATE('now')),
    category TEXT NOT NULL, -- 'Housekeeping', 'Electricity', 'Stationery', 'Transport Fuel', 'Maintenance', 'Rent', 'Other'
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_mode TEXT DEFAULT 'Cash' CHECK (payment_mode IN ('Cash', 'UPI', 'Cheque', 'Bank_Transfer')),
    paid_to TEXT DEFAULT '',
    receipt_doc_path TEXT DEFAULT '',
    remarks TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expense_date ON expenses(expense_date);

-- 12. EXAM TERMS (Universal 4-Pillar Configuration)
CREATE TABLE IF NOT EXISTS exam_terms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    term_code TEXT UNIQUE NOT NULL,
    term_name TEXT NOT NULL,
    max_written REAL NOT NULL DEFAULT 70.0,
    max_oral REAL NOT NULL DEFAULT 10.0,
    display_order INTEGER NOT NULL DEFAULT 1
);

-- 13. SUBJECTS MASTER
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    UNIQUE(class, subject_name)
);

-- 14. MARKS REGISTER (Consolidated Permanent Sheet)
CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session TEXT NOT NULL DEFAULT '2026-27',
    class TEXT NOT NULL,
    exam_term_id INTEGER NOT NULL REFERENCES exam_terms(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    written_marks REAL DEFAULT 0.0,
    oral_marks REAL DEFAULT 0.0,
    remarks TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, session, exam_term_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id, session);

-- 15. STUDENT ATTENDANCE & PROMOTION SUMMARY
CREATE TABLE IF NOT EXISTS student_attendance_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session TEXT NOT NULL DEFAULT '2026-27',
    class TEXT NOT NULL,
    total_working_days INTEGER DEFAULT 220,
    days_present INTEGER DEFAULT 200,
    attendance_percentage REAL GENERATED ALWAYS AS (ROUND((CAST(days_present AS REAL) / total_working_days) * 100, 2)) STORED,
    promotion_status TEXT DEFAULT 'Promoted' CHECK (promotion_status IN ('Promoted', 'Passed', 'Detained', 'Pending')),
    teacher_remarks TEXT DEFAULT 'Satisfactory performance. Keep it up!',
    UNIQUE(student_id, session)
);

-- 16. QUESTION BANK & EXAM PAPER GENERATOR
CREATE TABLE IF NOT EXISTS question_bank (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class TEXT NOT NULL,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    chapter_name TEXT DEFAULT '',
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'fill_blanks', 'short', 'long')),
    question_text TEXT NOT NULL,
    options_json TEXT DEFAULT '[]', -- JSON array of options if MCQ
    correct_answer TEXT DEFAULT '',
    marks REAL NOT NULL DEFAULT 1.0,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. SCHOOL ASSETS & INFRASTRUCTURE REGISTER
CREATE TABLE IF NOT EXISTS school_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_code TEXT UNIQUE NOT NULL,
    asset_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('furniture', 'lab_equipment', 'computer_it', 'smart_tv_projector', 'electrical', 'transport', 'sports', 'other')),
    location_room TEXT NOT NULL, -- e.g. 'Room 101', 'Computer Lab', 'Physics Lab'
    purchase_date DATE,
    cost REAL DEFAULT 0.0,
    quantity INTEGER DEFAULT 1,
    condition TEXT DEFAULT 'working' CHECK (condition IN ('working', 'needs_maintenance', 'damaged', 'discarded')),
    warranty_expiry DATE,
    remarks TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 18. SYSTEM RECOVERY & SECURITY AUDIT LOGS
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL, -- 'SHADOW_RESTORE', 'UNAUTHORIZED_ACCESS', 'PASSWORD_RESET', 'DATA_EXPORT', 'RECORD_DELETE'
    details TEXT NOT NULL,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 19. STUDENT ATTENDANCE REGISTER
CREATE TABLE IF NOT EXISTS student_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'P' CHECK (status IN ('P', 'A', 'L', 'H')),
    remarks TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_stu_att_date ON student_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_stu_att_stu ON student_attendance(student_id);

-- 20. STAFF ATTENDANCE REGISTER (TEACHING & NON-TEACHING)
CREATE TABLE IF NOT EXISTS staff_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'P' CHECK (status IN ('P', 'A', 'L', 'H')),
    remarks TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_staff_att_date ON staff_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_staff_att_emp ON staff_attendance(employee_id);

-- 21. ACADEMIC HOLIDAYS & CALENDAR
CREATE TABLE IF NOT EXISTS academic_holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    holiday_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    session TEXT NOT NULL DEFAULT '2026-27',
    remarks TEXT DEFAULT ''
);

-- 22. OPPORTUNITY DESK (Scholarships, Olympiads, Competitions)
CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Scholarship', 'Olympiad', 'Competition', 'Talent Hunt', 'Workshop', 'Other')),
    eligibility TEXT DEFAULT '',
    suitable_classes TEXT DEFAULT '',
    last_date TEXT DEFAULT '',
    level TEXT DEFAULT 'State' CHECK (level IN ('School', 'District', 'State', 'National', 'International')),
    application_mode TEXT DEFAULT 'Through School',
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closing Soon', 'Upcoming', 'Closed')),
    verified_on DATE DEFAULT (DATE('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 23. STUDENT GROWTH PASSPORT (Academic & Extra-Curricular Achievements)
CREATE TABLE IF NOT EXISTS student_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Academic', 'Sports', 'Arts & Culture', 'Science & Innovation', 'Leadership', 'Discipline', 'Other')),
    level TEXT NOT NULL CHECK (level IN ('School', 'District', 'State', 'National')),
    event_date DATE DEFAULT (DATE('now')),
    description TEXT DEFAULT '',
    badge_icon TEXT DEFAULT '🏆',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 24. PARENT FEEDBACK & SCHOOL QUALITY ASSESSMENTS
CREATE TABLE IF NOT EXISTS parent_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
    parent_name TEXT NOT NULL,
    rating_academic INTEGER DEFAULT 5,
    rating_discipline INTEGER DEFAULT 5,
    rating_communication INTEGER DEFAULT 5,
    rating_facilities INTEGER DEFAULT 5,
    comments TEXT DEFAULT '',
    feedback_date DATE DEFAULT (DATE('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 25. SYSTEM SETTINGS KEY-VALUE VAULT
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 26. AUDIT TRAIL LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    module TEXT NOT NULL,
    details TEXT NOT NULL,
    performed_by TEXT DEFAULT 'Admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

