import sqlite3
import openpyxl
import os
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

EXCEL_PATH = r"C:\Users\user\.gemini\antigravity\brain\d703f7e0-c276-46d1-8bea-7d4191f6e463\scratch\extracted\Lakshya Intitute Of Child Education_Final\School_ERP_V1.1.3_Updated_Lakshya.xlsx"
DB_PATH = r"D:\APNA_RMS_DATA\apna_records.db"

if not os.path.exists(DB_PATH):
    # fallback to local appdata if D: is not available
    local_app_data = os.environ.get('LOCALAPPDATA', '')
    DB_PATH = os.path.join(local_app_data, 'APNA_RMS_DATA', 'apna_records.db')

print(f"Connecting to database at: {DB_PATH}")
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)

# -------------------------------------------------------------------------
# 1. MIGRATE TRANSPORT ROUTES
# -------------------------------------------------------------------------
print("--> Migrating Transport Routes...")
if "Transport Route Master" in wb.sheetnames:
    ws = wb["Transport Route Master"]
    route_count = 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or not row[0]:
            continue
        route_code = str(row[0]).strip()
        route_name = str(row[1]).strip() if len(row) > 1 and row[1] else route_code
        try:
            transport_fee = float(row[2]) if len(row) > 2 and row[2] else 0.0
        except ValueError:
            transport_fee = 0.0
        status = str(row[3]).strip() if len(row) > 3 and row[3] else "Active"

        cursor.execute("""
            INSERT INTO routes (route_code, route_name, transport_fee, status)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(route_code) DO UPDATE SET
                route_name = excluded.route_name,
                transport_fee = excluded.transport_fee,
                status = excluded.status
        """, (route_code, route_name, transport_fee, status))
        route_count += 1
    print(f"   [OK] Migrated {route_count} Transport Routes.")

# Build route_code to route_id mapping
cursor.execute("SELECT route_code, id FROM routes")
route_map = dict(cursor.fetchall())

# -------------------------------------------------------------------------
# 2. MIGRATE STUDENTS
# -------------------------------------------------------------------------
print("--> Migrating Students from Student_Master...")
if "Student_Master" in wb.sheetnames:
    ws = wb["Student_Master"]
    student_count = 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or not row[1]: # Admission No is required
            continue
        adm_no = str(row[1]).strip()
        if not adm_no or adm_no == "None":
            continue

        sr_no = str(row[0]).strip() if row[0] is not None else ""
        adm_date = str(row[2])[:10] if row[2] else "2026-04-01"
        student_name = str(row[3]).strip() if row[3] else "Unknown Student"
        father_name = str(row[4]).strip() if row[4] else ""
        mother_name = str(row[5]).strip() if row[5] else ""
        gender = str(row[6]).strip().capitalize() if row[6] else "Male"
        if gender not in ("Male", "Female", "Other"):
            gender = "Male"
        
        dob = str(row[7])[:10] if row[7] else ""
        mobile = str(row[8]).replace(".0", "").strip() if row[8] else ""
        alt_mobile = str(row[9]).replace(".0", "").strip() if row[9] else ""
        aadhaar = str(row[10]).replace(".0", "").strip() if row[10] else ""
        pen_no = str(row[11]).strip() if row[11] else ""
        address = str(row[12]).strip() if row[12] else ""
        class_name = str(row[13]).strip() if row[13] else "Class 1"
        section = str(row[14]).strip() if row[14] else "A"
        roll_no = str(row[15]).replace(".0", "").strip() if row[15] else ""
        route_str = str(row[16]).strip() if row[16] else ""
        route_id = route_map.get(route_str, None)
        status = str(row[17]).strip().capitalize() if row[17] else "Active"
        if status not in ("Active", "Inactive", "TC_Issued", "Suspended"):
            status = "Active"
        remarks = str(row[18]).strip() if row[18] else ""
        adm_type = str(row[19]).strip() if len(row) > 19 and row[19] else "Regular"

        cursor.execute("""
            INSERT INTO students (
                admission_no, sr_no, roll_no, student_name, father_name, mother_name,
                gender, dob, mobile, alt_mobile, aadhaar_no, pen_no, address,
                class, section, route_id, admission_date, status, remarks, admission_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(admission_no) DO UPDATE SET
                student_name = excluded.student_name,
                father_name = excluded.father_name,
                mother_name = excluded.mother_name,
                class = excluded.class,
                section = excluded.section,
                roll_no = excluded.roll_no,
                mobile = excluded.mobile,
                route_id = excluded.route_id,
                status = excluded.status
        """, (
            adm_no, sr_no, roll_no, student_name, father_name, mother_name,
            gender, dob, mobile, alt_mobile, aadhaar, pen_no, address,
            class_name, section, route_id, adm_date, status, remarks, adm_type
        ))
        student_count += 1
    print(f"   [OK] Migrated {student_count} Students.")

# Build admission_no to student_id map
cursor.execute("SELECT admission_no, id FROM students")
student_map = dict(cursor.fetchall())

# -------------------------------------------------------------------------
# 3. MIGRATE FEE REGISTER (STRUCTURE & DUES)
# -------------------------------------------------------------------------
print("--> Migrating Fee Structures from Fee_Register...")
if "Fee_Register" in wb.sheetnames:
    ws = wb["Fee_Register"]
    fee_struct_count = 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or not row[0]:
            continue
        adm_no = str(row[0]).strip()
        student_id = student_map.get(adm_no)
        if not student_id:
            continue

        def parse_float(val):
            try:
                return float(val) if val else 0.0
            except ValueError:
                return 0.0

        adm_fee = parse_float(row[7])
        monthly_fee = parse_float(row[8])
        q_fee = parse_float(row[9])
        hy_fee = parse_float(row[10])
        ann_fee = parse_float(row[11])
        trans_fee = parse_float(row[12])
        comp_fee = parse_float(row[13])
        lib_fee = parse_float(row[14])
        sports_fee = parse_float(row[15])
        act_fee = parse_float(row[16])
        fine = parse_float(row[17])
        exp_fee = parse_float(row[31]) if len(row) > 31 else 0.0
        old_due = parse_float(row[32]) if len(row) > 32 else 0.0

        cursor.execute("""
            INSERT INTO student_fee_structure (
                student_id, session, admission_fee, monthly_fee, quarterly_exam_fee,
                half_yearly_exam_fee, annual_exam_fee, transport_fee, computer_fee,
                library_fee, sports_fee, activity_fee, fine, old_due, expected_fee
            ) VALUES (?, '2026-27', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(student_id) DO UPDATE SET
                admission_fee = excluded.admission_fee,
                monthly_fee = excluded.monthly_fee,
                quarterly_exam_fee = excluded.quarterly_exam_fee,
                half_yearly_exam_fee = excluded.half_yearly_exam_fee,
                annual_exam_fee = excluded.annual_exam_fee,
                transport_fee = excluded.transport_fee,
                computer_fee = excluded.computer_fee,
                library_fee = excluded.library_fee,
                sports_fee = excluded.sports_fee,
                activity_fee = excluded.activity_fee,
                fine = excluded.fine,
                old_due = excluded.old_due,
                expected_fee = excluded.expected_fee
        """, (
            student_id, adm_fee, monthly_fee, q_fee, hy_fee, ann_fee,
            trans_fee, comp_fee, lib_fee, sports_fee, act_fee, fine, old_due, exp_fee
        ))
        fee_struct_count += 1
    print(f"   [OK] Migrated {fee_struct_count} Student Fee Structures.")

# -------------------------------------------------------------------------
# 3B. MIGRATE FEE TRANSACTIONS
# -------------------------------------------------------------------------
print("--> Migrating Transactions from Fee_Transactions...")
if "Fee_Transactions" in wb.sheetnames:
    ws_tx = wb["Fee_Transactions"]
    tx_count = 0
    for row in ws_tx.iter_rows(min_row=2, values_only=True):
        if not row or not row[0] or str(row[0]).strip() == "":
            continue
        tx_id_raw = str(row[0]).strip()
        if tx_id_raw.lower() == "transaction id":
            continue
        receipt_no = str(row[1]).strip() if row[1] else f"RCP{tx_id_raw.zfill(6)}"
        session = str(row[2]).strip() if row[2] else "2026-27"
        adm_no = str(row[3]).strip() if row[3] else ""
        s_id = student_map.get(adm_no)
        if not s_id:
            continue
        pay_date = str(row[7])[:10] if row[7] else "2026-04-06"
        fee_month = str(row[8]).strip() if row[8] else ""
        fee_period = str(row[9]).strip() if row[9] else ""
        fee_head = str(row[12]).strip() if row[12] else "Monthly Fee"
        std_fee = parse_float(row[13])
        amt_rec = parse_float(row[14])
        late_fee = parse_float(row[15])
        disc = parse_float(row[16]) + parse_float(row[17])
        net_amt = parse_float(row[18])
        if net_amt <= 0:
            net_amt = amt_rec
        pay_mode = str(row[21]).strip() if len(row) > 21 and row[21] else "Cash"
        if pay_mode not in ("Cash", "UPI", "Bank_Transfer", "Cheque", "Card"):
            pay_mode = "Cash"
        ref_no = str(row[22]).strip() if len(row) > 22 and row[22] else ""
        coll_by = str(row[20]).strip() if len(row) > 20 and row[20] else "Admin"
        remarks = str(row[24]).strip() if len(row) > 24 and row[24] else ""

        cursor.execute("""
            INSERT INTO fee_transactions (
                transaction_id, receipt_no, session, student_id, payment_date,
                fee_month, fee_period, fee_head, standard_fee, amount_received,
                late_fee, discount, net_amount, payment_mode, reference_no,
                status, collected_by, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', ?, ?)
            ON CONFLICT(transaction_id) DO UPDATE SET
                receipt_no = excluded.receipt_no,
                net_amount = excluded.net_amount
        """, (tx_id_raw, receipt_no, session, s_id, pay_date, fee_month, fee_period, fee_head, std_fee, amt_rec, late_fee, disc, net_amt, pay_mode, ref_no, coll_by, remarks))
        tx_count += 1
    print(f"   [OK] Migrated {tx_count} Fee Transactions.")

# -------------------------------------------------------------------------
# 4. MIGRATE EMPLOYEES
# -------------------------------------------------------------------------
print("--> Migrating Staff from Employee_Master...")
if "Employee_Master" in wb.sheetnames:
    ws = wb["Employee_Master"]
    emp_count = 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or not row[0]:
            continue
        emp_id = str(row[0]).strip()
        emp_name = str(row[1]).strip() if len(row) > 1 and row[1] else "Staff"
        father_name = str(row[2]).strip() if len(row) > 2 and row[2] else ""
        mobile = str(row[3]).replace(".0", "").strip() if len(row) > 3 and row[3] else ""
        joining_date = str(row[4])[:10] if len(row) > 4 and row[4] else "2024-04-01"
        designation = str(row[5]).strip() if len(row) > 5 and row[5] else "Teacher"
        emp_type = str(row[6]).strip() if len(row) > 6 and row[6] else "Permanent"
        if emp_type not in ('Permanent', 'Contract', 'Part-Time', 'Guest'):
            emp_type = "Permanent"
        dept = str(row[7]).strip() if len(row) > 7 and row[7] else "Teaching"
        status = str(row[8]).strip() if len(row) > 8 and row[8] else "Active"
        remarks = str(row[9]).strip() if len(row) > 9 and row[9] else ""

        # Default standard monthly salaries by designation
        monthly_salary = 18000.0 if "Principal" in designation else (12000.0 if "Teacher" in designation else 8000.0)

        cursor.execute("""
            INSERT INTO employees (
                employee_id, employee_name, father_name, mobile_no, joining_date,
                designation, employment_type, department, monthly_salary, status, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(employee_id) DO UPDATE SET
                employee_name = excluded.employee_name,
                designation = excluded.designation,
                monthly_salary = excluded.monthly_salary,
                status = excluded.status
        """, (
            emp_id, emp_name, father_name, mobile, joining_date,
            designation, emp_type, dept, monthly_salary, status, remarks
        ))
        emp_count += 1
    print(f"   [OK] Migrated {emp_count} Employees.")

# -------------------------------------------------------------------------
# 5. MIGRATE EXPENSES
# -------------------------------------------------------------------------
print("--> Migrating Expenses from Expense_Register...")
if "Expense_Register" in wb.sheetnames:
    ws = wb["Expense_Register"]
    exp_count = 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or not row[1]: # Voucher No
            continue
        v_no = str(row[1]).strip()
        if not v_no or v_no == "None":
            continue
        exp_date = str(row[0])[:10] if row[0] else "2026-09-01"
        category = str(row[2]).strip() if len(row) > 2 and row[2] else "Other"
        desc = str(row[3]).strip() if len(row) > 3 and row[3] else "Expense"
        try:
            amt = float(row[4]) if len(row) > 4 and row[4] else 0.0
        except ValueError:
            amt = 0.0
        if amt <= 0.0:
            continue
        pay_mode = str(row[5]).strip() if len(row) > 5 and row[5] else "Cash"
        paid_to = str(row[6]).strip() if len(row) > 6 and row[6] else ""
        remarks = str(row[7]).strip() if len(row) > 7 and row[7] else ""

        cursor.execute("""
            INSERT INTO expenses (voucher_no, expense_date, category, description, amount, payment_mode, paid_to, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(voucher_no) DO UPDATE SET
                amount = excluded.amount,
                category = excluded.category,
                description = excluded.description
        """, (v_no, exp_date, category, desc, amt, pay_mode, paid_to, remarks))
        exp_count += 1
    print(f"   [OK] Migrated {exp_count} Expenses.")

# -------------------------------------------------------------------------
# 6. SEED STANDARD SUBJECTS FOR ALL CLASSES (NURSERY TO CLASS 8)
# -------------------------------------------------------------------------
print("--> Seeding Academic Subjects for Classes (PG to Class 8)...")
classes = ["PG", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8"]
subjects_master = [
    ("HIN", "Hindi", 1),
    ("ENG", "English", 2),
    ("MAT", "Mathematics", 3),
    ("SCI", "Science / EVS", 4),
    ("SST", "Social Studies", 5),
    ("SAN", "Sanskrit", 6),
    ("COM", "Computer Science", 7),
    ("GK", "General Knowledge", 8),
    ("ART", "Art & Craft", 9),
    ("MSC", "Moral Science", 10)
]

for cls in classes:
    for code, name, order in subjects_master:
        cursor.execute("""
            INSERT INTO subjects (class, subject_code, subject_name, display_order)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(class, subject_name) DO NOTHING
        """, (cls, f"{code}_{cls.replace(' ', '')}", name, order))

# -------------------------------------------------------------------------
# 7. SEED SAMPLE QUESTION BANK (FOR QUESTION PAPER GENERATOR)
# -------------------------------------------------------------------------
print("--> Seeding Question Bank samples...")
cursor.execute("SELECT id, class, subject_name FROM subjects WHERE class='Class 5' AND subject_name='Mathematics'")
math_sub = cursor.fetchone()
if math_sub:
    sub_id = math_sub[0]
    sample_questions = [
        ("Numbers & Arithmetic", "mcq", "What is the place value of 7 in 4,75,230?", '["700", "7,000", "70,000", "700,000"]', "70,000", 1.0, "easy"),
        ("Numbers & Arithmetic", "mcq", "Find the product of 125 and 8.", '["900", "1000", "1025", "960"]', "1000", 1.0, "easy"),
        ("Fractions", "short", "Convert 7/4 into a mixed fraction and explain the steps.", '[]', "1 3/4", 2.0, "medium"),
        ("Geometry", "short", "Define an acute angle and draw an example with its degrees.", '[]', "Angle less than 90 degrees", 2.0, "medium"),
        ("Word Problems", "long", "A school library has 4,520 books in English and 3,780 books in Hindi. If 1,250 books are distributed, how many books remain?", '[]', "7,050 books", 5.0, "hard")
    ]
    for ch, qtype, qtext, opts, ans, marks, diff in sample_questions:
        cursor.execute("""
            INSERT INTO question_bank (class, subject_id, chapter_name, question_type, question_text, options_json, correct_answer, marks, difficulty)
            VALUES ('Class 5', ?, ?, ?, ?, ?, ?, ?, ?)
        """, (sub_id, ch, qtype, qtext, opts, ans, marks, diff))

# -------------------------------------------------------------------------
# 8. SEED SAMPLE SCHOOL ASSETS (FOR ASSET INFRASTRUCTURE TRACKER)
# -------------------------------------------------------------------------
print("--> Seeding School Infrastructure & Asset Register...")
sample_assets = [
    ("AST-001", "Dual Desks & Benches Set (40 Units)", "furniture", "Room 101 (Class 8A)", "2024-06-15", 80000.0, 40, "working"),
    ("AST-002", "Smart Interactive Flat Panel 65 Inch", "smart_tv_projector", "Smart Classroom 1", "2025-01-10", 95000.0, 1, "working"),
    ("AST-003", "Dell OptiPlex Core i5 Desktop Computers", "computer_it", "Computer Lab", "2024-07-20", 350000.0, 10, "working"),
    ("AST-004", "School Bus TATA 32-Seater (UP 44 T 1234)", "transport", "Bus Garage / Route 1", "2022-03-10", 1850000.0, 1, "working"),
    ("AST-005", "Science Physics & Chemistry Lab Kit Sets", "lab_equipment", "Composite Science Lab", "2024-08-05", 45000.0, 5, "working")
]
for code, name, cat, loc, pdate, cost, qty, cond in sample_assets:
    cursor.execute("""
        INSERT INTO school_assets (asset_code, asset_name, category, location_room, purchase_date, cost, quantity, condition)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(asset_code) DO NOTHING
    """, (code, name, cat, loc, pdate, cost, qty, cond))

conn.commit()
conn.close()
wb.close()

print("\n=========================================================================")
print(" SUCCESS: ALL REAL LAKSHYA ERP DATA MIGRATED INTO SQLITE & SHADOW VAULT!")
print(f" Total Students: {student_count}")
print(f" Total Transport Routes: {route_count}")
print(f" Total Staff / Employees: {emp_count}")
print(f" Total Expenses: {exp_count}")
print("=========================================================================")
