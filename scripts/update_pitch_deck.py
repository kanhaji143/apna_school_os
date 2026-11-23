import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

PPTX_PATH = "01_CLIENT_DEPLOYMENT_PACKAGE/03_Presentations_and_Templates/Apna_School_OS_Client_Pitch_Deck.pptx"

def add_new_slides():
    prs = Presentation(PPTX_PATH)
    blank_layout = prs.slide_layouts[6] # blank layout

    # -------------------------------------------------------------
    # SLIDE 12: BILINGUAL UI & STUDENT 360° LEDGER
    # -------------------------------------------------------------
    slide1 = prs.slides.add_slide(blank_layout)

    # Header background shape
    header_box = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(10), Inches(1.1))
    header_box.fill.solid()
    header_box.fill.fore_color.rgb = RGBColor(14, 116, 144) # #0e7490 (Teal/Ocean)
    header_box.line.color.rgb = RGBColor(14, 116, 144)

    tf = header_box.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "Bilingual UI & Student 360° All-in-One Ledger"
    p1.font.size = Pt(22)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(255, 255, 255)

    p2 = tf.add_paragraph()
    p2.text = "1-Click 🌐 हिन्दी ⇄ English Switcher • Session-Wise Old Dues Breakdown • 1-Second Handover Slip"
    p2.font.size = Pt(11)
    p2.font.color.rgb = RGBColor(224, 242, 254)

    # Left Card: 100% Offline Bilingual Engine
    c1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.4), Inches(4.2), Inches(5.6))
    c1.fill.solid()
    c1.fill.fore_color.rgb = RGBColor(248, 250, 252)
    c1.line.color.rgb = RGBColor(186, 230, 253)

    tf1 = c1.text_frame
    tf1.word_wrap = True
    p = tf1.paragraphs[0]
    p.text = "🌐 100% Offline Native Bilingual Engine"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = RGBColor(3, 105, 161)

    bullets1 = [
        ("1-Click Top Bar Toggle", "Instant switching between authentic हिन्दी and English with 0.00s lag and zero internet required."),
        ("22+ Core Modules Translated", "Dashboard, Student Register, ID Cards, Fee Counter, Marksheets, AI Tools & Settings adapt instantly."),
        ("100% Data Integrity Guaranteed", "Student names, Aadhaar, roll numbers and transactions remain pristine without text corruption."),
        ("Persistent Choice Memory", "Remembers clerk preference permanently via local storage; auto-loads selected language on app startup."),
        ("Pan-India & Global Expansion", "Modular dictionary architecture ready for Tamil, Telugu, Punjabi, Gujarati & international languages.")
    ]
    for title, desc in bullets1:
        p_t = tf1.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = RGBColor(15, 23, 42)
        p_t.space_before = Pt(8)

        p_d = tf1.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = RGBColor(71, 85, 105)

    # Right Card: Student 360° Ledger & Old Dues Engine
    c2 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.2), Inches(1.4), Inches(4.2), Inches(5.6))
    c2.fill.solid()
    c2.fill.fore_color.rgb = RGBColor(248, 250, 252)
    c2.line.color.rgb = RGBColor(254, 215, 170)

    tf2 = c2.text_frame
    tf2.word_wrap = True
    p = tf2.paragraphs[0]
    p.text = "📑 Student 360° Ledger & Old Dues"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = RGBColor(194, 65, 12)

    bullets2 = [
        ("1-Second Admission No Search", "Type admission number (e.g. 9649) or student name to instantly open their complete institutional dossier."),
        ("Dual Session Dues Breakdown", "Separate clear columns for current session fees vs पूर्व सत्रों का पुराना बकाया (Old Dues) to recover locked money."),
        ("1-Click Quick Old Due Pay", "Dedicated payment button directly deducts from old backlogs with instant dual cashier/director receipts."),
        ("Attendance & Exam Matrix", "Working days vs present days %, overall academic grade and advance credit balance on one unified sheet."),
        ("1-Click A4 Parent Handover Slip", "Instant single-sheet print with Cashier & Principal signatures ready to hand to visiting parents at the counter.")
    ]
    for title, desc in bullets2:
        p_t = tf2.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = RGBColor(15, 23, 42)
        p_t.space_before = Pt(8)

        p_d = tf2.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = RGBColor(71, 85, 105)

    # -------------------------------------------------------------
    # SLIDE 13: ENTERPRISE VENDOR MASTER CRM & GIT CLOUD VAULT
    # -------------------------------------------------------------
    slide2 = prs.slides.add_slide(blank_layout)

    # Header background shape
    header_box2 = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(10), Inches(1.1))
    header_box2.fill.solid()
    header_box2.fill.fore_color.rgb = RGBColor(30, 27, 75) # #1e1b4b (Deep Indigo)
    header_box2.line.color.rgb = RGBColor(30, 27, 75)

    tf_h2 = header_box2.text_frame
    tf_h2.word_wrap = True
    p1 = tf_h2.paragraphs[0]
    p1.text = "Enterprise Vendor Master CRM & Cloud-Safe Disaster Recovery"
    p1.font.size = Pt(21)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(255, 255, 255)

    p2 = tf_h2.add_paragraph()
    p2.text = "100+ Client School Portfolio • 1-Click WhatsApp Recovery • Machine HWID License Gen • Crash-Proof Git Vault"
    p2.font.size = Pt(10.5)
    p2.font.color.rgb = RGBColor(199, 210, 254)

    # Left Column: Vendor CRM Dossier & Automation
    c3 = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.4), Inches(4.2), Inches(5.6))
    c3.fill.solid()
    c3.fill.fore_color.rgb = RGBColor(248, 250, 252)
    c3.line.color.rgb = RGBColor(196, 181, 253)

    tf3 = c3.text_frame
    tf3.word_wrap = True
    p = tf3.paragraphs[0]
    p.text = "💼 Vendor Client Portfolio Master CRM"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = RGBColor(76, 29, 149)

    bullets3 = [
        ("360° Client School Dossier", "Track 100+ institutions: School Name, Board, Director Name, Mobile, WhatsApp, Email, Address & City."),
        ("Sales, Advance & Installments", "Track agreed deal value (₹), received down payment, outstanding balance due, and next payment due date."),
        ("1-Click WhatsApp Payment Follow-up", "Generates polite, professional Hindi/English payment reminder directly to Director with due date and balance."),
        ("HWID & Signed License Keygen", "Cryptographic key generator (ASH-XXXX-XXXX-XXXX) tied to machine fingerprint (1-Yr, 30-Day, Lifetime)."),
        ("Voice of Customer (CRM Notes)", "Log operator observations, PC hardware bugs (e.g. old printers/RAM), and principal's custom feature requests.")
    ]
    for title, desc in bullets3:
        p_t = tf3.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = RGBColor(15, 23, 42)
        p_t.space_before = Pt(8)

        p_d = tf3.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = RGBColor(71, 85, 105)

    # Right Column: Git Crash-Proof Vault & Excel Sync
    c4 = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.2), Inches(1.4), Inches(4.2), Inches(5.6))
    c4.fill.solid()
    c4.fill.fore_color.rgb = RGBColor(248, 250, 252)
    c4.line.color.rgb = RGBColor(167, 243, 208)

    tf4 = c4.text_frame
    tf4.word_wrap = True
    p = tf4.paragraphs[0]
    p.text = "🛡️ Crash-Proof Cloud Vault & Excel Master"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = RGBColor(6, 95, 70)

    bullets4 = [
        ("Strict Policy & Vendor Isolation", "Client schools never see vendor data. Protected under Super Admin (hanuganeshan) developer authority."),
        ("Git Crash-Proof Cloud Backup", "Master dossier saved to 02_VENDOR_CONTROL_PRIVATE_HUB/client_portfolio_master.json and pushed to Git."),
        ("Zero Laptop Crash Risk", "If the developer's PC crashes, burns or is formatted, a simple 'git clone' restores all 100 client accounts in 10s."),
        ("1-Click Master Excel Export", "Downloads beautifully styled School_Clients_Master.xlsx with auto-columns, borders, and currency totals."),
        ("Live Enterprise KPI Dashboard", "Real-time visibility: Total Onboarded Schools, Gross Deals (₹), Cash Realized (₹), and Overdue Alerts.")
    ]
    for title, desc in bullets4:
        p_t = tf4.add_paragraph()
        p_t.text = f"• {title}:"
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = RGBColor(15, 23, 42)
        p_t.space_before = Pt(8)

        p_d = tf4.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = RGBColor(71, 85, 105)

    prs.save(PPTX_PATH)
    print(f"✅ Successfully added Slide 12 and Slide 13 to: {PPTX_PATH} (Total slides: {len(prs.slides)})")

add_new_slides()
