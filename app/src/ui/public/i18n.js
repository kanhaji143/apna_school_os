/**
 * ======================================================================
 *   APNA SCHOOL OS — OFFLINE BILINGUAL / MULTI-LANGUAGE (i18n) ENGINE
 *   100% Offline • Zero Internet Required • Instant Runtime Switching
 *   Supported Languages: English (en), हिन्दी (hi)
 *   Architecture: Extensible for Punjabi, Tamil, Telugu, Gujarati, etc.
 * ======================================================================
 */

const APNA_I18N = {
    current: localStorage.getItem('apna_app_language') || 'hi',

    dictionaries: {
        en: {
            lang_name: "English",
            lang_toggle_btn: "🌐 हिन्दी",
            offline_badge: "🟢 100% Offline Active",
            demo_badge: "🎮 Live Demo Mode",
            trial_loading: "30-Day VIP Trial (Loading...)",
            training_pdf_btn: "📖 Training Manual (PDF)",
            refresh_btn: "🔄 Refresh & Sync",
            eod_btn: "📧 EOD Mail",
            logout_btn: "🚪 Logout",
            search_placeholder: "Search students, classes, receipts... (Ctrl+K)",

            // Sidebar Nav Items
            nav_dashboard: "Dashboard",
            nav_profile: "School Profile",
            nav_students: "Students Directory",
            nav_id_cards: "ID Cards 2.0",
            nav_classes: "Class & Section Setup",
            nav_passport: "Growth Passport",
            nav_attendance: "Attendance",
            nav_exams: "Marksheets (4-Pillar)",
            nav_papers: "Question Paper Maker",
            nav_ai_tools: "AI Teaching Tools",
            nav_fees: "Fee Collection",
            nav_expenses: "Expenses & Budget",
            nav_payroll: "Salary & Payslips",
            nav_teachers: "Teachers",
            nav_staff: "Non-Teaching Staff",
            nav_transport: "Transport & Routes",
            nav_assets: "Infrastructure & Assets",
            nav_opportunity: "Opportunity Desk",
            nav_reports: "Reports & Ledgers",
            nav_quality: "School Quality Score",
            nav_settings: "Settings & Data Safety",
            nav_migration: "Live Demo Data",
            nav_support: "Contact & Support",
            nav_super_admin: "Super Admin Control",

            // Common Actions & Buttons
            btn_save: "💾 Save Changes",
            btn_cancel: "Cancel",
            btn_close: "Close",
            btn_print: "🖨️ Print",
            btn_export_excel: "📥 Export to Excel",
            btn_download_csv: "📥 Download CSV",
            btn_search: "Search",
            btn_add_new: "+ Add New",
            btn_edit: "Edit",
            btn_delete: "Delete",
            btn_whatsapp_share: "📲 WhatsApp Share",
            btn_filter: "Filter",
            btn_apply: "Apply",
            btn_reset: "Reset",

            // Common Table Headers
            th_sr_no: "S.No",
            th_adm_no: "Adm. No",
            th_name: "Name",
            th_class: "Class",
            th_section: "Sec",
            th_father_name: "Father's Name",
            th_mobile: "Mobile / Phone",
            th_status: "Status",
            th_actions: "Actions",
            th_amount: "Amount",
            th_balance_due: "Balance Due",
            th_date: "Date",
            th_receipt_no: "Receipt #",

            // Vendor CRM Labels
            vendor_title: "💼 Vendor Client Portfolio & Sales CRM",
            vendor_subtitle: "Enterprise Client Portfolio, Sales Recovery, Offline Deployment & Device Ledger (Platform Owner Authority)",
            vendor_total_clients: "Total Client Schools",
            vendor_total_sales: "Total Gross Deals",
            vendor_total_collected: "Total Collected",
            vendor_total_outstanding: "Market Dues Recovery",
            vendor_btn_add_client: "+ Onboard New Client School",
            vendor_btn_export_master: "📥 Export Master CRM (Excel)",
            vendor_filter_all: "All Clients",
            vendor_filter_active: "Active Live",
            vendor_filter_trial: "Trial Running",
            vendor_filter_overdue: "Payment Overdue",
            vendor_filter_expiring: "License Expiring Soon"
        },

        hi: {
            lang_name: "हिन्दी",
            lang_toggle_btn: "🌐 English",
            offline_badge: "🟢 100% ऑफ़लाइन सक्रिय",
            demo_badge: "🎮 लाइव डेमो डेटा मोड",
            trial_loading: "30-दिन VIP ट्रायल (लोडिंग...)",
            training_pdf_btn: "📖 ट्रेनिंग मैनुअल (PDF)",
            refresh_btn: "🔄 रिफ्रेश व EOD सिंक",
            eod_btn: "📧 EOD रिपोर्ट",
            logout_btn: "🚪 लॉगआउट",
            search_placeholder: "छात्र, कक्षा, रसीद खोजें... (Ctrl+K)",

            // Sidebar Nav Items
            nav_dashboard: "मुख्य डैशबोर्ड",
            nav_profile: "स्कूल प्रोफ़ाइल",
            nav_students: "छात्र रजिस्टर व खोज",
            nav_id_cards: "पहचान पत्र (आई-कार्ड 2.0)",
            nav_classes: "कक्षा व सेक्शन सेटअप",
            nav_passport: "समग्र प्रगति पासपोर्ट",
            nav_attendance: "दैनिक उपस्थिति प्रबंधन",
            nav_exams: "परीक्षा परिणाम व अंकतालिका",
            nav_papers: "प्रश्न पत्र निर्माण केंद्र",
            nav_ai_tools: "एआई शिक्षण उपकरण",
            nav_fees: "फ़ीस वसूली व बकाया खाता",
            nav_expenses: "स्कूल व्यय व दैनिक खर्च",
            nav_payroll: "स्टाफ वेतन व पे-स्लिप",
            nav_teachers: "शिक्षक वर्ग (Teachers)",
            nav_staff: "गैर-शैक्षणिक स्टाफ (Staff)",
            nav_transport: "परिवहन व बस रूट्स",
            nav_assets: "स्कूल संपत्ति व इन्फ्रास्ट्रक्चर",
            nav_opportunity: "अवसर व छात्रवृत्ति केंद्र",
            nav_reports: "संपूर्ण बही-खाता व रिपोर्ट्स",
            nav_quality: "स्कूल गुणवत्ता स्कोर (SQS)",
            nav_settings: "सेटिंग्स व डेटा सुरक्षा",
            nav_migration: "लाइव डेमो डेटा",
            nav_support: "संपर्क व सहायता",
            nav_super_admin: "सुपर एडमिन वेंडर कंट्रोल",

            // Common Actions & Buttons
            btn_save: "💾 सुरक्षित करें",
            btn_cancel: "रद्द करें",
            btn_close: "बंद करें",
            btn_print: "🖨️ प्रिंट निकालें",
            btn_export_excel: "📥 एक्सेल में डाउनलोड करें",
            btn_download_csv: "📥 CSV डाउनलोड",
            btn_search: "खोजें",
            btn_add_new: "+ नया जोड़ें",
            btn_edit: "संशोधित करें",
            btn_delete: "हटाएं",
            btn_whatsapp_share: "📲 व्हाट्सएप शेयर",
            btn_filter: "फ़िल्टर करें",
            btn_apply: "लागू करें",
            btn_reset: "रीसेट करें",

            // Common Table Headers
            th_sr_no: "क्र.सं.",
            th_adm_no: "प्रवेश सं.",
            th_name: "विद्यार्थी का नाम",
            th_class: "कक्षा",
            th_section: "वर्ग",
            th_father_name: "पिता का नाम",
            th_mobile: "मोबाइल / फोन",
            th_status: "स्थिति",
            th_actions: "कार्यवाहियाँ",
            th_amount: "राशि (₹)",
            th_balance_due: "बकाया राशि (₹)",
            th_date: "दिनांक",
            th_receipt_no: "रसीद सं.",

            // Vendor CRM Labels
            vendor_title: "💼 वेंडर क्लाइंट पोर्टफोलियो व सेल्स CRM",
            vendor_subtitle: "एंटरप्राइज क्लाइंट स्कूल ट्रैकिंग, भुगतान वसूली, ऑफ़लाइन डिप्लॉयमेंट व डिवाइस लेजर (प्लेटफॉर्म ओनर)",
            vendor_total_clients: "कुल पंजीकृत स्कूल",
            vendor_total_sales: "कुल सकल बिक्री (Deals)",
            vendor_total_collected: "कुल प्राप्त भुगतान",
            vendor_total_outstanding: "बाज़ार में फंसा बकाया",
            vendor_btn_add_client: "+ नया क्लाइंट स्कूल जोड़ें",
            vendor_btn_export_master: "📥 मास्टर CRM एक्सेल डाउनलोड",
            vendor_filter_all: "सभी क्लाइंट्स",
            vendor_filter_active: "सक्रिय चल रहे (Active)",
            vendor_filter_trial: "ट्रायल में चालू",
            vendor_filter_overdue: "भुगतान बकाया (Overdue)",
            vendor_filter_expiring: "लाइसेंस समाप्त होने वाले"
        }
    },

    t: function(key, fallback = "") {
        const lang = this.current;
        const dict = this.dictionaries[lang] || this.dictionaries['en'];
        return dict[key] || fallback || key;
    },

    apply: function(lang) {
        if (lang) {
            this.current = lang;
            localStorage.setItem('apna_app_language', lang);
        }
        const activeLang = this.current;
        const dict = this.dictionaries[activeLang] || this.dictionaries['en'];

        // Update Language Selector in Header (Dropdown or Button)
        const langDropdown = document.getElementById('lang-dropdown');
        if (langDropdown) {
            langDropdown.value = activeLang;
        }
        const langBtnText = document.getElementById('lang-switch-text');
        if (langBtnText) {
            langBtnText.textContent = activeLang === 'hi' ? 'हिन्दी' : 'English';
        }

        // 1. Elements with data-i18n (replaces textContent)
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.textContent = dict[key];
            }
        });

        // 2. Elements with data-i18n-html (replaces innerHTML safely)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (dict[key]) {
                el.innerHTML = dict[key];
            }
        });

        // 3. Elements with data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key]) {
                el.placeholder = dict[key];
            }
        });

        // 4. Elements with data-i18n-title
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (dict[key]) {
                el.title = dict[key];
            }
        });

        // Emit custom event for any live modules listening to language changes
        window.dispatchEvent(new CustomEvent('apnaLanguageChanged', { detail: { language: activeLang } }));
    },

    toggle: function() {
        const nextLang = this.current === 'hi' ? 'en' : 'hi';
        this.apply(nextLang);
        if (typeof showToast === 'function') {
            const msg = nextLang === 'hi' ? '🇮🇳 भाषा बदलकर हिन्दी की गई।' : '🇬🇧 Language switched to English.';
            showToast(msg, 'success');
        }
    }
};

// Global helper for inline scripts
function t(key, fallback) {
    return APNA_I18N.t(key, fallback);
}

function toggleAppLanguage() {
    APNA_I18N.toggle();
}

function changeAppLanguage(lang) {
    if (typeof APNA_I18N !== 'undefined') {
        APNA_I18N.apply(lang);
        if (typeof showToast === 'function') {
            const msg = lang === 'hi' ? '🇮🇳 भाषा बदलकर हिन्दी की गई।' : '🇬🇧 Language switched to English.';
            showToast(msg, 'success');
        }
    }
}

// Auto-run on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    APNA_I18N.apply();
});
