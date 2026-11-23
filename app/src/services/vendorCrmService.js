const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const VENDOR_HUB_DIR = path.join(__dirname, '..', '..', '..', '02_VENDOR_CONTROL_PRIVATE_HUB');
const DATA_FILE_PATH = path.join(VENDOR_HUB_DIR, 'client_portfolio_master.json');
const SALT = "APNA_SOFTWARE_HUB_8504985149";

function ensureHubDir() {
    if (!fs.existsSync(VENDOR_HUB_DIR)) {
        fs.mkdirSync(VENDOR_HUB_DIR, { recursive: true });
    }
}

const DEFAULT_SAMPLE_CLIENTS = [
    {
        id: "CLT-2026-001",
        school_name: "Lakshya International Public School",
        board: "CBSE Affiliated (10+2)",
        address: "Station Road, Sadul Colony",
        city: "Bikaner",
        state: "Rajasthan",
        pin: "334001",
        director_name: "Dr. Arvind Rathore",
        phone: "9829012345",
        whatsapp: "9829012345",
        email: "director@lakshyabkn.edu.in",
        sale_date: "2026-11-01",
        deal_value: 35000,
        received_amount: 25000,
        balance_due: 10000,
        next_due_date: "2026-12-05",
        payment_mode: "Bank Transfer (NEFT)",
        payment_status: "PARTIAL",
        license_tier: "1-Year Annual License",
        hwid: "ASH-BKN-4491",
        license_key: "ASH-7A2F-9B1C-3D4E",
        expiry_date: "2027-11-01",
        running_status: "ACTIVE",
        quality_score: 94,
        observations: "बहुत संतुष्ट हैं। क्लर्क ने 1 दिन में 400 एडमिशन इंपोर्ट कर लिए।",
        issues_faced: "अकाउंटेंट का प्रिंटर पुराना (Epson Dot Matrix) था, थर्मल रसीद प्रिंटर लगवाया।",
        requested_features: "अगले सत्र में बस जीपीएस ट्रैकिंग सिंक की मांग की है।"
    },
    {
        id: "CLT-2026-002",
        school_name: "Saraswati Vidya Mandir Sr. Sec. School",
        board: "RBSE (Rajasthan Board)",
        address: "Shastri Nagar, Main Market",
        city: "Alwar",
        state: "Rajasthan",
        pin: "301001",
        director_name: "Pt. Ramesh Chand Sharma",
        phone: "9414056789",
        whatsapp: "9414056789",
        email: "svm.alwar@gmail.com",
        sale_date: "2026-11-10",
        deal_value: 28000,
        received_amount: 28000,
        balance_due: 0,
        next_due_date: "2027-11-10",
        payment_mode: "UPI (Google Pay)",
        payment_status: "PAID",
        license_tier: "1-Year Annual License",
        hwid: "ASH-ALW-8812",
        license_key: "ASH-91D0-E3B5-F82A",
        expiry_date: "2027-11-10",
        running_status: "ACTIVE",
        quality_score: 98,
        observations: "फुल पेमेंट प्राप्त। संपूर्ण छात्र बहीखाता और हिंदी प्रश्न पत्र टूल बेहद पसंद आया।",
        issues_faced: "शुरुआत में क्लर्क को हिंदी फॉन्ट में थोड़ा संशय था, गाइड से हल हो गया।",
        requested_features: "संस्कृत विषय के प्रश्न पत्र में श्लोक बैंक जोड़ने का अनुरोध किया।"
    },
    {
        id: "CLT-2026-003",
        school_name: "St. Xavier's Convent High School",
        board: "ICSE Pattern",
        address: "Civil Lines, Near Circuit House",
        city: "Jaipur",
        state: "Rajasthan",
        pin: "302006",
        director_name: "Father Joseph D'Souza",
        phone: "9828098765",
        whatsapp: "9828098765",
        email: "info@xaviersjaipur.org",
        sale_date: "2026-11-18",
        deal_value: 45000,
        received_amount: 15000,
        balance_due: 30000,
        next_due_date: "2026-11-30",
        payment_mode: "Cheque (HDFC Bank)",
        payment_status: "PARTIAL",
        license_tier: "30-Day VIP Trial",
        hwid: "ASH-JPR-7104",
        license_key: "ASH-33BC-8491-11EF",
        expiry_date: "2026-12-18",
        running_status: "TRIAL",
        quality_score: 91,
        observations: "30-दिन का वीआईपी ट्रायल चल रहा है। 5 कंप्यूटरों पर LAN कैंपस में चला रहे हैं।",
        issues_faced: "LAN शेयरिंग में Windows Firewall ने पोर्ट 8085 ब्लॉक किया था, इनबाउंड रूल बनाकर चालू किया।",
        requested_features: "चेक क्लियर होते ही 30 नवंबर को एनुअल लाइसेंस और ₹30,000 फाइनल पेमेंट देना तय हुआ।"
    }
];

class VendorCrmService {
    static getClientsData() {
        ensureHubDir();
        if (!fs.existsSync(DATA_FILE_PATH)) {
            const initialData = {
                metadata: {
                    vendor_name: "Apna Software Hub (AI & Technology Division)",
                    master_authority: "Hanu Ganeshan",
                    contact: "8504985149 / 8303324088",
                    last_backup: new Date().toISOString()
                },
                clients: DEFAULT_SAMPLE_CLIENTS
            };
            fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf8');
            return initialData;
        }

        try {
            const raw = fs.readFileSync(DATA_FILE_PATH, 'utf8');
            return JSON.parse(raw);
        } catch (err) {
            console.error('[VendorCRM] Error reading client portfolio:', err);
            return {
                metadata: { vendor_name: "Apna Software Hub", master_authority: "Hanu Ganeshan" },
                clients: DEFAULT_SAMPLE_CLIENTS
            };
        }
    }

    static saveClientsData(data) {
        ensureHubDir();
        data.metadata = data.metadata || {};
        data.metadata.last_backup = new Date().toISOString();
        data.metadata.vendor_name = "Apna Software Hub (AI & Technology Division)";
        data.metadata.master_authority = "Hanu Ganeshan";
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    }

    static getAll() {
        const data = this.getClientsData();
        const clients = data.clients || [];

        let totalDeal = 0;
        let totalReceived = 0;
        let totalDue = 0;
        let activeCount = 0;
        let trialCount = 0;
        let overdueCount = 0;

        const now = new Date();

        clients.forEach(c => {
            const deal = Number(c.deal_value) || 0;
            const rec = Number(c.received_amount) || 0;
            const due = Number(c.balance_due != null ? c.balance_due : (deal - rec)) || 0;
            c.balance_due = due;

            totalDeal += deal;
            totalReceived += rec;
            totalDue += due;

            if (c.running_status === 'ACTIVE') activeCount++;
            else if (c.running_status === 'TRIAL') trialCount++;

            if (due > 0 && c.next_due_date) {
                const dueDate = new Date(c.next_due_date + 'T23:59:59');
                if (dueDate < now) overdueCount++;
            }
        });

        return {
            success: true,
            summary: {
                total_clients: clients.length,
                total_deal_value: totalDeal,
                total_received: totalReceived,
                total_outstanding: totalDue,
                active_count: activeCount,
                trial_count: trialCount,
                overdue_count: overdueCount
            },
            metadata: data.metadata,
            clients: clients
        };
    }

    static upsertClient(payload) {
        const data = this.getClientsData();
        const clients = data.clients || [];

        const dealVal = Number(payload.deal_value) || 0;
        const recVal = Number(payload.received_amount) || 0;
        const balanceDue = Number(payload.balance_due != null ? payload.balance_due : (dealVal - recVal));

        let paymentStatus = payload.payment_status || 'PENDING';
        if (balanceDue <= 0 && dealVal > 0) paymentStatus = 'PAID';
        else if (recVal > 0 && balanceDue > 0) paymentStatus = 'PARTIAL';

        if (payload.id) {
            // Update
            const idx = clients.findIndex(c => c.id === payload.id);
            if (idx >= 0) {
                clients[idx] = {
                    ...clients[idx],
                    ...payload,
                    deal_value: dealVal,
                    received_amount: recVal,
                    balance_due: balanceDue,
                    payment_status: paymentStatus,
                    updated_at: new Date().toISOString()
                };
                data.clients = clients;
                this.saveClientsData(data);
                return { success: true, client: clients[idx], message: "क्लाइंट रिकॉर्ड सफलतापूर्वक अपडेट हुआ।" };
            }
        }

        // New Client
        const nextNum = clients.length + 1;
        const newId = `CLT-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
        const newClient = {
            id: newId,
            school_name: payload.school_name || "New School",
            board: payload.board || "State Board / CBSE",
            address: payload.address || "",
            city: payload.city || "",
            state: payload.state || "Rajasthan",
            pin: payload.pin || "",
            director_name: payload.director_name || "",
            phone: payload.phone || "",
            whatsapp: payload.whatsapp || payload.phone || "",
            email: payload.email || "",
            sale_date: payload.sale_date || new Date().toISOString().split('T')[0],
            deal_value: dealVal,
            received_amount: recVal,
            balance_due: balanceDue,
            next_due_date: payload.next_due_date || "",
            payment_mode: payload.payment_mode || "Cash / UPI",
            payment_status: paymentStatus,
            license_tier: payload.license_tier || "1-Year Annual License",
            hwid: payload.hwid || "",
            license_key: payload.license_key || "",
            expiry_date: payload.expiry_date || "",
            running_status: payload.running_status || "ACTIVE",
            quality_score: Number(payload.quality_score) || 90,
            observations: payload.observations || "",
            issues_faced: payload.issues_faced || "",
            requested_features: payload.requested_features || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Auto-generate license key if HWID provided and key empty
        if (newClient.hwid && !newClient.license_key) {
            newClient.license_key = this.generateKey(newClient.hwid, 365);
        }

        clients.unshift(newClient);
        data.clients = clients;
        this.saveClientsData(data);
        return { success: true, client: newClient, message: "नया क्लाइंट स्कूल सफलतापूर्वक दर्ज हुआ।" };
    }

    static deleteClient(id) {
        const data = this.getClientsData();
        const initialCount = data.clients.length;
        data.clients = (data.clients || []).filter(c => c.id !== id);
        if (data.clients.length !== initialCount) {
            this.saveClientsData(data);
            return { success: true, message: "क्लाइंट रिकॉर्ड हटाया गया।" };
        }
        return { success: false, message: "क्लाइंट नहीं मिला।" };
    }

    static generateKey(installationId, validityDays = 365) {
        const cleanId = (installationId || '').trim().toUpperCase();
        const raw = `${cleanId}_${validityDays}_${SALT}`;
        const h = crypto.createHash('sha256').update(raw, 'utf8').digest('hex').toUpperCase();
        return `ASH-${h.substring(0, 4)}-${h.substring(4, 8)}-${h.substring(8, 12)}`;
    }
}

module.exports = VendorCrmService;
