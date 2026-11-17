const { getDb } = require('../database/db');
const fs = require('node:fs');
const path = require('node:path');

class OperationsService {
    // ---------------------------------------------------------
    // 1. TRANSPORT ROUTES & FLEET
    // ---------------------------------------------------------
    static getRoutes() {
        const db = getDb();
        return db.prepare(`
            SELECT r.*,
                   (SELECT COUNT(*) FROM students s WHERE s.route_id = r.id AND s.status = 'Active') as student_count
            FROM routes r
            ORDER BY r.id ASC
        `).all();
    }

    // ---------------------------------------------------------
    // 2. SCHOOL ASSETS & INFRASTRUCTURE
    // ---------------------------------------------------------
    static getAssets(category = null) {
        const db = getDb();
        if (category) {
            return db.prepare('SELECT * FROM school_assets WHERE category = ? ORDER BY id ASC').all(category);
        }
        return db.prepare('SELECT * FROM school_assets ORDER BY id ASC').all();
    }

    static addAsset({ assetCode, assetName, category, locationRoom, purchaseDate, cost, quantity, condition = 'working', remarks = '' }) {
        const db = getDb();
        const stmt = db.prepare(`
            INSERT INTO school_assets (asset_code, asset_name, category, location_room, purchase_date, cost, quantity, condition, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(assetCode, assetName, category, locationRoom, purchaseDate, cost, quantity, condition, remarks);
    }

    // ---------------------------------------------------------
    // 3. OFFLINE SCHOOL DRIVE (STUDENT VAULT)
    // ---------------------------------------------------------
    static getStudentDocuments(studentId) {
        const db = getDb();
        return db.prepare('SELECT * FROM student_documents WHERE student_id = ? ORDER BY uploaded_at DESC').all(studentId);
    }

    static saveStudentDocument(studentId, documentType, fileName, sourceFilePath) {
        const db = getDb();
        // Destination directory inside D:\APNA_RMS_DATA\drive\<studentId>\
        const driveBaseDir = fs.existsSync('D:\\') ? 'D:\\APNA_RMS_DATA\\drive' : path.join(process.env.LOCALAPPDATA || process.env.USERPROFILE, 'APNA_RMS_DATA', 'drive');
        const studentDir = path.join(driveBaseDir, String(studentId));
        if (!fs.existsSync(studentDir)) {
            fs.mkdirSync(studentDir, { recursive: true });
        }
        const destPath = path.join(studentDir, `${documentType}_${Date.now()}_${path.basename(fileName)}`);
        
        if (fs.existsSync(sourceFilePath)) {
            fs.copyFileSync(sourceFilePath, destPath);
        }

        const stmt = db.prepare(`
            INSERT INTO student_documents (student_id, document_type, file_name, file_path)
            VALUES (?, ?, ?, ?)
        `);
        return stmt.run(studentId, documentType, fileName, destPath);
    }

    // ---------------------------------------------------------
    // 4. CERTIFICATE GENERATOR (TC, CHARACTER, BONAFIDE)
    // ---------------------------------------------------------
    static generateCertificate(studentId, certType = 'TC') {
        const db = getDb();
        const profile = db.prepare('SELECT * FROM institution_profile WHERE id = 1').get();
        const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
        if (!student) throw new Error('Student not found');

        const certNo = `CERT-${certType}-${Date.now().toString().slice(-6)}`;
        const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        return {
            institution: profile,
            student,
            certificate_type: certType,
            certificate_no: certNo,
            issue_date: issueDate
        };
    }
}

module.exports = OperationsService;
