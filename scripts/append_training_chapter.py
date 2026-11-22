import os
import pymupdf

FONT_PATH = "C:/Windows/Fonts/Nirmala.ttf"
FONT_BOLD_PATH = "C:/Windows/Fonts/NirmalaB.ttf"
if not os.path.exists(FONT_BOLD_PATH):
    FONT_BOLD_PATH = FONT_PATH

def create_guide_page(doc):
    # A4 dimensions: 595.27 x 841.89
    page = doc.new_page(width=595.27, height=841.89)
    page.insert_font(fontname="Nirmala", fontfile=FONT_PATH)
    page.insert_font(fontname="NirmalaB", fontfile=FONT_BOLD_PATH)

    # Top banner background
    page.draw_rect(pymupdf.Rect(0, 0, 595.27, 70), color=None, fill=(0.01, 0.52, 0.78)) # #0284c7

    # Banner Title
    page.insert_text((36, 32), "APNA SCHOOL OS — डेटा सुरक्षा, बैकअप एवं संस्थागत संचालन SOP", fontname="NirmalaB", fontsize=15, color=(1, 1, 1))
    page.insert_text((36, 52), "Enterprise Edition • अध्याय 5: डेटा सुरक्षा आर्किटेक्चर, दैनिक ऑटोमैटिक बैकअप एवं क्लाइंट सत्यापन", fontname="Nirmala", fontsize=10, color=(0.9, 0.95, 1))

    y = 95

    # Section 1: डेटा कहाँ सुरक्षित रहता है?
    page.draw_rect(pymupdf.Rect(36, y - 14, 559, y + 4), color=None, fill=(0.93, 0.96, 1))
    page.insert_text((42, y), "1. विद्यालय डेटा कहाँ सुरक्षित रहता है? (Zero-Loss Architecture)", fontname="NirmalaB", fontsize=12, color=(0.01, 0.4, 0.65))
    y += 20

    s1_text = (
        "• प्राथमिक डेटाबेस (Primary DB): C:\\Users\\<यूज़र>\\AppData\\Local\\Apna_School_OS_Data\\apna_records.db\n"
        "  (यदि कंप्यूटर में D: ड्राइव उपलब्ध हो तो स्वतः D:\\Apna_School_OS_Data\\ में सुरक्षित होता है)।\n"
        "• शैडो वॉल्ट (Self-Healing Backup): %LOCALAPPDATA%\\APNA_Computer_RMS\\vault\\apna_records.vault.db\n"
        "• सुरक्षा विशेषता: विंडोज़ क्रैश, अचानक बिजली कटने अथवा अनजाने में फ़ाइल डिलीट होने पर सिस्टम\n"
        "  शैडो वॉल्ट से डेटा स्वतः रिकवर कर लेता है। संस्था का 1 भी छात्र रिकॉर्ड अथवा फ़ीस कभी नष्ट नहीं होती।"
    )
    rect1 = pymupdf.Rect(45, y, 555, y + 80)
    page.insert_textbox(rect1, s1_text, fontname="Nirmala", fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    y += 85

    # Section 2: डेटा देखना एवं एक्सेल एक्सपोर्ट
    page.draw_rect(pymupdf.Rect(36, y - 14, 559, y + 4), color=None, fill=(0.93, 0.96, 1))
    page.insert_text((42, y), "2. डेटा देखना, सत्यापन एवं एक्सेल एक्सपोर्ट (Daily Viewing & Export)", fontname="NirmalaB", fontsize=12, color=(0.01, 0.4, 0.65))
    y += 20

    s2_text = (
        "• एक्सेल डाउनलोड: सॉफ्टवेयर में 'Students Directory' मेन्यू में जाकर 'Export to Excel' बटन दबाएं।\n"
        "  सभी छात्रों का पूरा विवरण (नाम, कक्षा, रोल नं., मोबाइल, फ़ीस) तुरंत Downloads फोल्डर में प्राप्त होगा।\n"
        "• प्रत्यक्ष डेटाबेस सत्यापन: यदि कभी तकनीकी रूप से .db फ़ाइल खोलनी हो, तो इंटरनेट से निःशुल्क\n"
        "  'DB Browser for SQLite' डाउनलोड करके apna_records.db को एक्सेल जैसी तालिका में देख सकते हैं।"
    )
    rect2 = pymupdf.Rect(45, y, 555, y + 65)
    page.insert_textbox(rect2, s2_text, fontname="Nirmala", fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    y += 70

    # Section 3: स्वचालित दैनिक बैकअप (Evening Schedule)
    page.draw_rect(pymupdf.Rect(36, y - 14, 559, y + 4), color=None, fill=(0.93, 0.96, 1))
    page.insert_text((42, y), "3. स्वचालित दैनिक बैकअप प्रक्रिया (Automated Evening Backup)", fontname="NirmalaB", fontsize=12, color=(0.01, 0.4, 0.65))
    y += 20

    s3_text = (
        "• 1-क्लिक शेड्यूल सेटअप: डिप्लॉयमेंट पैकेज में मौजूद 'install_and_schedule.bat' को एक बार चलाएं।\n"
        "  यह विंडोज़ टास्क शेड्यूलर में प्रतिदिन शाम 7:00 बजे (19:00) का ऑटो-बैकअप टास्क सेट कर देता है।\n"
        "• बैकअप संग्रह स्थान: सभी दैनिक बैकअप्स Documents\\Apna_Backups\\ फोल्डर में टाइमस्टैम्प के साथ\n"
        "  (उदा. apna_records_2026-11-21_19-00.db) सुरक्षित रूप से सहेजे जाते हैं।\n"
        "• पेनड्राइव बैकअप: ऑपरेटर चाहे तो हफ्ते में एक बार इस पूरे फोल्डर को पेनड्राइव या गूगल ड्राइव पर रख सकता है।"
    )
    rect3 = pymupdf.Rect(45, y, 555, y + 75)
    page.insert_textbox(rect3, s3_text, fontname="Nirmala", fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    y += 80

    # Section 4: पुराने इंस्टॉलेशन को सुरक्षित अपडेट करना (Safe In-Place Update)
    page.draw_rect(pymupdf.Rect(36, y - 14, 559, y + 4), color=None, fill=(0.93, 0.96, 1))
    page.insert_text((42, y), "4. पहले से स्थापित सॉफ़्टवेयर को सुरक्षित अपडेट करना (Zero-Loss In-Place Upgrade)", fontname="NirmalaB", fontsize=12, color=(0.01, 0.4, 0.65))
    y += 20

    s4_text = (
        "• क्या पुराना डेटा नष्ट होगा?: कतई नहीं (0% Risk)। सॉफ़्टवेयर का डेटाबेस ऐप फ़ोल्डर से बाहर रहता है।\n"
        "• अपडेट करने की विधि:\n"
        "  1. नए अपडेटेड पैकेज (Setup_Apna_School_OS.exe अथवा पोर्टेबल फ़ोल्डर) को उसी कंप्यूटर पर चलाएं।\n"
        "  2. नया सॉफ़्टवेयर चालू होते ही स्वतः मौजूदा डेटाबेस (apna_records.db) को पहचान कर लिंक कर लेगा।\n"
        "  3. विद्यालय के पुराने 500 या 1000 छात्रों का डेटा, पुरानी फ़ीस रसीदें और अंक 100% सुरक्षित और उपलब्ध रहेंगे।"
    )
    rect4 = pymupdf.Rect(45, y, 555, y + 80)
    page.insert_textbox(rect4, s4_text, fontname="Nirmala", fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    y += 85

    # Footer note
    page.draw_rect(pymupdf.Rect(36, 775, 559, 815), color=None, fill=(0.96, 0.96, 0.96))
    page.draw_rect(pymupdf.Rect(36, 775, 559, 815), color=(0.8, 0.8, 0.8), width=0.5)
    page.insert_text((45, 792), "📞 तकनीकी सहायता एवं प्रशिक्षण हेल्पलाइन: +91 8504985149  |  ✉️ apnaschool.tech@gmail.com", fontname="NirmalaB", fontsize=9.5, color=(0.2, 0.2, 0.2))
    page.insert_text((45, 807), "APNA SOFTWARE HUB — 100% Offline Institutional Enterprise Edition • 2026", fontname="Nirmala", fontsize=8.5, color=(0.4, 0.4, 0.4))

def update_pdf(pdf_path):
    if not os.path.exists(pdf_path):
        print(f"Skipping {pdf_path}: File not found")
        return
    doc = pymupdf.open(pdf_path)
    # Check if page already added
    already_added = False
    for p in doc:
        txt = p.get_text()
        if "Zero-Loss Architecture" in txt or "अध्याय 5: डेटा सुरक्षा" in txt:
            already_added = True
            break
    if already_added:
        print(f"Already updated: {pdf_path}")
        return
    create_guide_page(doc)
    doc.save(pdf_path + ".tmp")
    doc.close()
    os.replace(pdf_path + ".tmp", pdf_path)
    print(f"✅ Successfully appended Chapter 5 to: {pdf_path}")

targets = [
    "D:/School_Lakshya/app/src/ui/public/STAFF_TRAINING_MANUAL.pdf",
    "D:/School_Lakshya/01_CLIENT_DEPLOYMENT_PACKAGE/02_Official_Manuals/STAFF_TRAINING_MANUAL.pdf",
    "D:/School_Lakshya/app/src/ui/public/USER_OPERATING_MANUAL.pdf",
    "D:/School_Lakshya/01_CLIENT_DEPLOYMENT_PACKAGE/02_Official_Manuals/USER_OPERATING_MANUAL.pdf"
]

for t in targets:
    update_pdf(t)
