const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

// Primary & Shadow Vault Paths with write-safe fallback
function resolvePrimaryDir() {
    if (fs.existsSync('D:\\')) {
        try {
            const candidate = 'D:\\Apna_School_OS_Data';
            if (!fs.existsSync(candidate)) {
                if (fs.existsSync('D:\\APNA_RMS_DATA')) {
                    try { fs.renameSync('D:\\APNA_RMS_DATA', candidate); } catch(e) { fs.mkdirSync(candidate, { recursive: true }); }
                } else {
                    fs.mkdirSync(candidate, { recursive: true });
                }
            }
            const testFile = path.join(candidate, '.write_test');
            fs.writeFileSync(testFile, '1');
            fs.unlinkSync(testFile);
            return candidate;
        } catch (e) {
            console.warn('⚠️ D:\\ drive is not writable or is an optical drive. Safely falling back to %LOCALAPPDATA%');
        }
    }
    const fallback = path.join(process.env.LOCALAPPDATA || process.env.USERPROFILE || 'C:\\ProgramData', 'Apna_School_OS_Data');
    try {
        if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
    } catch (e) {}
    return fallback;
}

function resolveVaultDir() {
    const vDir = path.join(process.env.LOCALAPPDATA || process.env.USERPROFILE || 'C:\\ProgramData', 'APNA_Computer_RMS', 'vault');
    try {
        if (!fs.existsSync(vDir)) fs.mkdirSync(vDir, { recursive: true });
    } catch (e) {}
    return vDir;
}

const PRIMARY_DIR = resolvePrimaryDir();
const PRIMARY_DB_PATH = path.join(PRIMARY_DIR, 'apna_records.db');

const VAULT_DIR = resolveVaultDir();
const VAULT_DB_PATH = path.join(VAULT_DIR, 'apna_records.vault.db');
const RECOVERY_LOG_PATH = path.join(PRIMARY_DIR, 'SECURITY_RECOVERY_LOG.txt');

// Ensure directories exist
function ensureDirs() {
    try {
        if (!fs.existsSync(PRIMARY_DIR)) fs.mkdirSync(PRIMARY_DIR, { recursive: true });
        if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });
    } catch (err) {
        console.error('Directory creation warning:', err.message);
    }
}

let dbInstance = null;

function logRecoveryEvent(message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [SELF-HEALING SHADOW VAULT] ${message}\n`;
    try {
        fs.appendFileSync(RECOVERY_LOG_PATH, logLine, 'utf8');
    } catch (err) {
        console.error('Could not write to recovery log:', err);
    }
}

function syncShadowVault() {
    try {
        if (fs.existsSync(PRIMARY_DB_PATH)) {
            fs.copyFileSync(PRIMARY_DB_PATH, VAULT_DB_PATH);
        }
    } catch (err) {
        console.error('Error syncing shadow vault:', err.message);
    }
}

function initDatabase() {
    ensureDirs();

    const primaryExists = fs.existsSync(PRIMARY_DB_PATH);
    const vaultExists = fs.existsSync(VAULT_DB_PATH);

    // Fresh Installation Check: Seed from bundled template if both primary and vault are absent
    const templatePath = path.join(__dirname, 'template_records.db');
    if (!primaryExists && !vaultExists && fs.existsSync(templatePath)) {
        console.log('📦 Fresh installation detected! Initializing database from bundled template...');
        try {
            fs.copyFileSync(templatePath, PRIMARY_DB_PATH);
            fs.copyFileSync(templatePath, VAULT_DB_PATH);
            logRecoveryEvent('Primary database and Shadow Vault initialized from bundled institutional template.');
        } catch (copyErr) {
            console.error('Error copying template database:', copyErr.message);
        }
    }

    // SELF-HEALING RECOVERY CHECK
    if (!primaryExists && vaultExists) {
        console.warn('⚠️ Primary database missing! Initiating Self-Healing recovery from Shadow Vault...');
        try {
            fs.copyFileSync(VAULT_DB_PATH, PRIMARY_DB_PATH);
            logRecoveryEvent('Primary database was restored automatically from %LOCALAPPDATA% Shadow Vault.');
        } catch (e) {}
    }

    try {
        dbInstance = new DatabaseSync(PRIMARY_DB_PATH);
    } catch (dbErr) {
        console.error('⚠️ Could not open primary DB at ' + PRIMARY_DB_PATH + ': ' + dbErr.message);
        console.warn('🔄 Safely falling back to local AppData database...');
        const emergencyPath = path.join(process.env.LOCALAPPDATA || process.env.USERPROFILE || 'C:\\ProgramData', 'APNA_RMS_DATA', 'apna_records.db');
        try {
            const emergencyDir = path.dirname(emergencyPath);
            if (!fs.existsSync(emergencyDir)) fs.mkdirSync(emergencyDir, { recursive: true });
            if (!fs.existsSync(emergencyPath) && fs.existsSync(templatePath)) {
                fs.copyFileSync(templatePath, emergencyPath);
            }
            dbInstance = new DatabaseSync(emergencyPath);
        } catch (emErr) {
            console.error('Critical fallback to in-memory DB:', emErr.message);
            dbInstance = new DatabaseSync(':memory:');
        }
    }
    
    // Enable WAL mode & foreign keys
    try {
        dbInstance.exec('PRAGMA foreign_keys = ON;');
        dbInstance.exec('PRAGMA journal_mode = WAL;');
        dbInstance.exec('PRAGMA synchronous = NORMAL;');
    } catch (pragmaErr) {
        console.warn('Pragma warning:', pragmaErr.message);
    }

    // Load schema if fresh
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        dbInstance.exec(schemaSql);
    }

    // Initialize Default Profiles & Super Admin if not present
    seedDefaults();

    // Auto-migrate schema for legacy databases (ensure phone, email, etc. exist)
    ensureSchemaMigrations(dbInstance);

    // Mirror to Vault
    syncShadowVault();

    console.log(`✅ APNA Computer RMS Database initialized at: ${PRIMARY_DB_PATH}`);
    console.log(`🛡️ Self-Healing Shadow Vault active at: ${VAULT_DB_PATH}`);
    return dbInstance;
}

function ensureSchemaMigrations(db) {
    if (!db) return;
    try {
        // 1. Ensure 'users' table columns exist
        const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name.toLowerCase());
        if (!userCols.includes('phone')) {
            db.exec("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT '';");
            console.log('✅ Migrated users table: added phone column');
        }
        if (!userCols.includes('email')) {
            db.exec("ALTER TABLE users ADD COLUMN email TEXT DEFAULT '';");
            console.log('✅ Migrated users table: added email column');
        }
        if (!userCols.includes('status')) {
            db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';");
            console.log('✅ Migrated users table: added status column');
        }
        if (!userCols.includes('last_login')) {
            db.exec("ALTER TABLE users ADD COLUMN last_login DATETIME;");
            console.log('✅ Migrated users table: added last_login column');
        }

        // 2. Ensure official user accounts exist and match official training manual (admin, clerk, teacher, hanuganeshan)
        try {
            // Check & seed / sync 'admin' (Director / Principal)
            const adminUser = db.prepare("SELECT id FROM users WHERE LOWER(username) = 'admin'").get();
            if (adminUser) {
                db.prepare("UPDATE users SET password_hash = 'admin123', role = 'admin', full_name = 'School Director / Principal', phone = '9005924960', email = 'lakshyaschool@gmail.com' WHERE id = ?").run(adminUser.id);
            } else {
                db.prepare("INSERT INTO users (username, password_hash, role, full_name, phone, email, status) VALUES ('admin', 'admin123', 'admin', 'School Director / Principal', '9005924960', 'lakshyaschool@gmail.com', 'active')").run();
            }

            // Check & seed / sync 'clerk' (Accounts Clerk / Cashier)
            const clerkUser = db.prepare("SELECT id FROM users WHERE LOWER(username) = 'clerk'").get();
            if (clerkUser) {
                db.prepare("UPDATE users SET password_hash = 'clerk123', role = 'accountant', full_name = 'Accounts Clerk / Cashier', phone = '8303324088', email = 'accountant@lakshyaschool.in' WHERE id = ?").run(clerkUser.id);
            } else {
                db.prepare("INSERT INTO users (username, password_hash, role, full_name, phone, email, status) VALUES ('clerk', 'clerk123', 'accountant', 'Accounts Clerk / Cashier', '8303324088', 'accountant@lakshyaschool.in', 'active')").run();
            }

            // Check & seed / sync 'teacher' (Academic In-charge / Teacher)
            const teacherUser = db.prepare("SELECT id FROM users WHERE LOWER(username) = 'teacher'").get();
            if (teacherUser) {
                db.prepare("UPDATE users SET password_hash = 'teacher123', role = 'counselor', full_name = 'Academic In-charge / Teacher', phone = '8303324089', email = 'academics@lakshyaschool.in' WHERE id = ?").run(teacherUser.id);
            } else {
                db.prepare("INSERT INTO users (username, password_hash, role, full_name, phone, email, status) VALUES ('teacher', 'teacher123', 'counselor', 'Academic In-charge / Teacher', '8303324089', 'academics@lakshyaschool.in', 'active')").run();
            }

            // Keep legacy aliases (accountant & counselor) in sync so old shortcuts never break
            const accUser = db.prepare("SELECT id FROM users WHERE LOWER(username) = 'accountant'").get();
            if (accUser) {
                db.prepare("UPDATE users SET password_hash = 'clerk123', role = 'accountant', full_name = 'Accounts Clerk / Cashier', phone = '8303324088', email = 'accountant@lakshyaschool.in' WHERE id = ?").run(accUser.id);
            }
            const counsUser = db.prepare("SELECT id FROM users WHERE LOWER(username) = 'counselor'").get();
            if (counsUser) {
                db.prepare("UPDATE users SET password_hash = 'teacher123', role = 'counselor', full_name = 'Academic In-charge / Teacher', phone = '8303324089', email = 'academics@lakshyaschool.in' WHERE id = ?").run(counsUser.id);
            }

            // Super Admin: Ensure untouched vendor authority
            const superUser = db.prepare("SELECT id FROM users WHERE LOWER(username) = 'hanuganeshan'").get();
            if (!superUser) {
                db.prepare("INSERT INTO users (username, password_hash, role, full_name, phone, email, status) VALUES ('hanuganeshan', 'Admin@123', 'super_admin', 'Platform Owner', '8504985149', 'krishnaskb143@gmail.com', 'active')").run();
            } else {
                db.prepare("UPDATE users SET phone = '8504985149', email = 'krishnaskb143@gmail.com' WHERE id = ? AND (phone IS NULL OR phone = '')").run(superUser.id);
            }
        } catch (uErr) {
            console.warn('User account sync notice:', uErr.message);
        }

        // 2. Ensure 'students' table columns exist
        const studentCols = db.prepare("PRAGMA table_info(students)").all().map(c => c.name.toLowerCase());
        if (studentCols.length > 0) {
            if (!studentCols.includes('sr_number')) db.exec("ALTER TABLE students ADD COLUMN sr_number TEXT DEFAULT '';");
            if (!studentCols.includes('apaar_id')) db.exec("ALTER TABLE students ADD COLUMN apaar_id TEXT DEFAULT '';");
            if (!studentCols.includes('pen_number')) db.exec("ALTER TABLE students ADD COLUMN pen_number TEXT DEFAULT '';");
            if (!studentCols.includes('route_id')) db.exec("ALTER TABLE students ADD COLUMN route_id INTEGER DEFAULT 0;");
            if (!studentCols.includes('blood_group')) db.exec("ALTER TABLE students ADD COLUMN blood_group TEXT DEFAULT '';");
            if (!studentCols.includes('category')) db.exec("ALTER TABLE students ADD COLUMN category TEXT DEFAULT 'General';");
            if (!studentCols.includes('parent_occupation')) db.exec("ALTER TABLE students ADD COLUMN parent_occupation TEXT DEFAULT '';");
            if (!studentCols.includes('previous_school')) db.exec("ALTER TABLE students ADD COLUMN previous_school TEXT DEFAULT '';");
            if (!studentCols.includes('tc_no')) db.exec("ALTER TABLE students ADD COLUMN tc_no TEXT DEFAULT '';");

            // 4. Ensure 'salary_payments' table has full allowance & deduction breakdowns
            const salCols = db.prepare("PRAGMA table_info(salary_payments)").all().map(c => c.name.toLowerCase());
            if (!salCols.includes('da_amount')) db.exec("ALTER TABLE salary_payments ADD COLUMN da_amount REAL DEFAULT 0.0;");
            if (!salCols.includes('hra_amount')) db.exec("ALTER TABLE salary_payments ADD COLUMN hra_amount REAL DEFAULT 0.0;");
            if (!salCols.includes('conveyance_amount')) db.exec("ALTER TABLE salary_payments ADD COLUMN conveyance_amount REAL DEFAULT 0.0;");
            if (!salCols.includes('medical_allowance')) db.exec("ALTER TABLE salary_payments ADD COLUMN medical_allowance REAL DEFAULT 0.0;");
            if (!salCols.includes('incentive_amount')) db.exec("ALTER TABLE salary_payments ADD COLUMN incentive_amount REAL DEFAULT 0.0;");
            if (!salCols.includes('bonus_amount')) db.exec("ALTER TABLE salary_payments ADD COLUMN bonus_amount REAL DEFAULT 0.0;");
            if (!salCols.includes('epf_deduction')) db.exec("ALTER TABLE salary_payments ADD COLUMN epf_deduction REAL DEFAULT 0.0;");
            if (!salCols.includes('esi_deduction')) db.exec("ALTER TABLE salary_payments ADD COLUMN esi_deduction REAL DEFAULT 0.0;");
            if (!salCols.includes('other_deduction')) db.exec("ALTER TABLE salary_payments ADD COLUMN other_deduction REAL DEFAULT 0.0;");
            if (!salCols.includes('gross_salary')) db.exec("ALTER TABLE salary_payments ADD COLUMN gross_salary REAL DEFAULT 0.0;");
            if (!salCols.includes('total_deductions')) db.exec("ALTER TABLE salary_payments ADD COLUMN total_deductions REAL DEFAULT 0.0;");

            // 5. Ensure system_settings table exists and has default form configs
            db.exec(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);

            const defAdmConfig = JSON.stringify({
                show_mother_name: true,
                show_dob: true,
                show_gender: true,
                show_alt_mobile: true,
                show_aadhaar: true,
                show_pen: true,
                show_blood_group: true,
                show_category: true,
                show_parent_occupation: true,
                show_previous_school: true,
                show_address: true,
                show_section: true,
                show_roll_no: true,
                show_route: true,
                show_fee: true
            });

            const defSalaryConfig = JSON.stringify({
                enable_da: false,
                enable_hra: false,
                enable_conveyance: true,
                enable_incentive: true,
                enable_bonus: true,
                enable_medical: false,
                enable_absent_deduction: true,
                enable_advance_recovery: true,
                enable_epf: false,
                enable_esi: false,
                enable_other_deduction: true
            });

            const existingAdm = db.prepare("SELECT key FROM system_settings WHERE key = 'admission_form_config'").get();
            if (!existingAdm) {
                db.prepare("INSERT INTO system_settings (key, value) VALUES ('admission_form_config', ?)").run(defAdmConfig);
            }

            const existingSal = db.prepare("SELECT key FROM system_settings WHERE key = 'salary_heads_config'").get();
            if (!existingSal) {
                db.prepare("INSERT INTO system_settings (key, value) VALUES ('salary_heads_config', ?)").run(defSalaryConfig);
            }

            // 6. Ensure 'employees' table has full profile, KYC, photo, and ID card fields
            const empCols = db.prepare("PRAGMA table_info(employees)").all().map(c => c.name.toLowerCase());
            if (!empCols.includes('mother_name')) db.exec("ALTER TABLE employees ADD COLUMN mother_name TEXT DEFAULT '';");
            if (!empCols.includes('gender')) db.exec("ALTER TABLE employees ADD COLUMN gender TEXT DEFAULT 'Male';");
            if (!empCols.includes('dob')) db.exec("ALTER TABLE employees ADD COLUMN dob DATE;");
            if (!empCols.includes('blood_group')) db.exec("ALTER TABLE employees ADD COLUMN blood_group TEXT DEFAULT '';");
            if (!empCols.includes('aadhaar_no')) db.exec("ALTER TABLE employees ADD COLUMN aadhaar_no TEXT DEFAULT '';");
            if (!empCols.includes('pan_no')) db.exec("ALTER TABLE employees ADD COLUMN pan_no TEXT DEFAULT '';");
            if (!empCols.includes('qualification')) db.exec("ALTER TABLE employees ADD COLUMN qualification TEXT DEFAULT '';");
            if (!empCols.includes('experience_years')) db.exec("ALTER TABLE employees ADD COLUMN experience_years TEXT DEFAULT '';");
            if (!empCols.includes('email')) db.exec("ALTER TABLE employees ADD COLUMN email TEXT DEFAULT '';");
            if (!empCols.includes('alt_mobile')) db.exec("ALTER TABLE employees ADD COLUMN alt_mobile TEXT DEFAULT '';");
            if (!empCols.includes('address')) db.exec("ALTER TABLE employees ADD COLUMN address TEXT DEFAULT '';");
            if (!empCols.includes('bank_name')) db.exec("ALTER TABLE employees ADD COLUMN bank_name TEXT DEFAULT '';");
            if (!empCols.includes('photo_path')) db.exec("ALTER TABLE employees ADD COLUMN photo_path TEXT DEFAULT '';");
            if (!empCols.includes('phone')) db.exec("ALTER TABLE employees ADD COLUMN phone TEXT DEFAULT '';");

            // 7. Ensure Licensing & 30-Day VIP Trial records exist in system_settings
            const installIdRow = db.prepare("SELECT value FROM system_settings WHERE key = 'installation_id'").get();
            if (!installIdRow) {
                const randCode = Math.floor(1000 + Math.random() * 9000);
                const installId = 'ASH-' + randCode;
                db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('installation_id', ?)").run(installId);
            }

            const licStatusRow = db.prepare("SELECT value FROM system_settings WHERE key = 'license_status'").get();
            if (!licStatusRow) {
                const now = new Date();
                const trialStartDate = now.toISOString().split('T')[0];
                const expiryDateObj = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
                const expiryDate = expiryDateObj.toISOString().split('T')[0];

                db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('license_status', 'TRIAL')").run();
                db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('trial_start_date', ?)").run(trialStartDate);
                db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('trial_days', '30')").run();
                db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('license_expiry_date', ?)").run(expiryDate);
                db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('license_key', '')").run();
                db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('last_known_date', ?)").run(trialStartDate);
            }
        }
    } catch (migErr) {
        console.warn('Schema migration notice:', migErr.message);
    }
}

function seedDefaults() {
    // 1. Check Institution Profile
    const profileCount = dbInstance.prepare('SELECT COUNT(*) as cnt FROM institution_profile').get().cnt;
    if (profileCount === 0) {
        dbInstance.prepare(`
            INSERT INTO institution_profile (
                id, school_name, tag_line, affiliation_no, udise_code, address,
                phone, alt_phone, email, website, board_type, current_session, principal_name
            ) VALUES (
                1, 'Lakshya Institute Of Child Education',
                'A Premier Center of Child Development & Education',
                'UP-STATE-BOARD / CBSE-ALIGNED', '09430801234',
                'Amethi - Durgapur Rd, Ngardeeh, Bhadar, Amethi, Uttar Pradesh 227406',
                '8303324088', '8504985149', 'lakshyaschool@gmail.com', 'https://lakshyachildedu.org',
                'UP_STATE', '2026-27', 'Principal / Director'
            )
        `).run();
    }

    // 2. Check Default Users
    const userCount = dbInstance.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
    if (userCount === 0) {
        const insertUser = dbInstance.prepare(`
            INSERT INTO users (username, password_hash, role, full_name, phone)
            VALUES (?, ?, ?, ?, ?)
        `);
        // Super Admin (Vendor-protected developer authority - STRICTLY CONFIDENTIAL)
        insertUser.run('hanuganeshan', 'Admin@123', 'super_admin', 'Platform Owner', '8504985149');
        // 1. School Owner / Director
        insertUser.run('admin', 'admin123', 'admin', 'School Director / Principal', '9005924960');
        // 2. Accounts Clerk / Cashier
        insertUser.run('clerk', 'clerk123', 'clerk', 'Accounts Clerk / Cashier', '8303324088');
        // 3. Academic In-charge / Teacher
        insertUser.run('teacher', 'teacher123', 'teacher', 'Academic In-charge / Teacher', '8303324089');
    }

    // 3. Check Exam Terms (Universal 4-Pillar Configuration)
    const examTermCount = dbInstance.prepare('SELECT COUNT(*) as cnt FROM exam_terms').get().cnt;
    if (examTermCount === 0) {
        const insertTerm = dbInstance.prepare(`
            INSERT INTO exam_terms (term_code, term_name, max_written, max_oral, display_order)
            VALUES (?, ?, ?, ?, ?)
        `);
        insertTerm.run('UNIT_1', 'First Unit Test', 10.0, 10.0, 1);
        insertTerm.run('HALF_YEARLY', 'First Term / Half-Yearly Exam', 70.0, 10.0, 2);
        insertTerm.run('UNIT_2', 'Second Unit Test', 10.0, 10.0, 3);
        insertTerm.run('ANNUAL', 'Second Term / Annual Exam', 70.0, 10.0, 4);
    }
}

function getDb() {
    if (!dbInstance) {
        initDatabase();
    }
    return dbInstance;
}

module.exports = {
    initDatabase,
    getDb,
    ensureSchemaMigrations,
    syncShadowVault,
    PRIMARY_DB_PATH,
    VAULT_DB_PATH,
    RECOVERY_LOG_PATH
};
