const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

// Primary & Shadow Vault Paths with write-safe fallback
function resolvePrimaryDir() {
    if (fs.existsSync('D:\\')) {
        try {
            const candidate = 'D:\\APNA_RMS_DATA';
            if (!fs.existsSync(candidate)) fs.mkdirSync(candidate, { recursive: true });
            const testFile = path.join(candidate, '.write_test');
            fs.writeFileSync(testFile, '1');
            fs.unlinkSync(testFile);
            return candidate;
        } catch (e) {
            console.warn('⚠️ D:\\ drive is not writable or is an optical drive. Safely falling back to %LOCALAPPDATA%');
        }
    }
    const fallback = path.join(process.env.LOCALAPPDATA || process.env.USERPROFILE || 'C:\\ProgramData', 'APNA_RMS_DATA');
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
        fs.copyFileSync(VAULT_DB_PATH, PRIMARY_DB_PATH);
        logRecoveryEvent('Primary database was restored automatically from %LOCALAPPDATA% Shadow Vault.');
    }

    dbInstance = new DatabaseSync(PRIMARY_DB_PATH);
    
    // Enable WAL mode & foreign keys
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA synchronous = NORMAL;');

    // Load schema if fresh
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        dbInstance.exec(schemaSql);
    }

    // Initialize Default Profiles & Super Admin if not present
    seedDefaults();

    // Mirror to Vault
    syncShadowVault();

    console.log(`✅ APNA Computer RMS Database initialized at: ${PRIMARY_DB_PATH}`);
    console.log(`🛡️ Self-Healing Shadow Vault active at: ${VAULT_DB_PATH}`);
    return dbInstance;
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
        // Super Admin (Vendor-protected developer authority)
        insertUser.run('hanuganeshan', 'Admin@123', 'super_admin', 'Platform Owner', '8504985149');
        // School Owner / Director
        insertUser.run('admin', 'Admin@123', 'admin', 'School Director', '8303324088');
        // Accountant
        insertUser.run('accountant', 'accountant@123', 'accountant', 'Chief Accountant', '8303324088');
        // Counselor (Reception)
        insertUser.run('counselor', 'staff@123', 'counselor', 'Admission Counselor', '8303324088');
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
    syncShadowVault,
    PRIMARY_DB_PATH,
    VAULT_DB_PATH,
    RECOVERY_LOG_PATH
};
