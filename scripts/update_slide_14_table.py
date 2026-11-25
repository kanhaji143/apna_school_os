import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

PPTX_PATH = "01_CLIENT_DEPLOYMENT_PACKAGE/03_Presentations_and_Templates/Apna_School_OS_Client_Pitch_Deck.pptx"

def update_slide_14_bilingual_table():
    prs = Presentation(PPTX_PATH)
    
    # Target slide 14 (index 13)
    if len(prs.slides) >= 14:
        slide = prs.slides[13]
        for shape in list(slide.shapes):
            sp = shape._element
            sp.getparent().remove(sp)
    else:
        blank_layout = prs.slide_layouts[6]
        slide = prs.slides.add_slide(blank_layout)

    # 1. Header Banner
    header_box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(10), Inches(1.1))
    header_box.fill.solid()
    header_box.fill.fore_color.rgb = RGBColor(15, 23, 42) # Deep Slate #0f172a
    header_box.line.color.rgb = RGBColor(15, 23, 42)

    tf = header_box.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "⚡ 2-Minute Executive Feature Scorecard (द्विभाषी फ़ीचर्स कार्ड)"
    p1.font.size = Pt(19)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(250, 204, 21) # Amber Gold

    p2 = tf.add_paragraph()
    p2.text = "Bilingual Edition for CBSE, ICSE, Convent & State Board Schools • 100% Offline-First • Universal Printer & Zero Cloud Bills"
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = RGBColor(226, 232, 240)

    # 2. Native PPTX Table (14 rows + 1 header = 15 rows)
    rows = 15
    cols = 3
    left = Inches(0.35)
    top = Inches(1.2)
    width = Inches(9.3)
    height = Inches(6.0)

    table_shape = slide.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table

    table.columns[0].width = Inches(2.6)  # Feature
    table.columns[1].width = Inches(1.3)  # Status
    table.columns[2].width = Inches(5.4)  # Description

    # Header Row
    headers = ["Special Feature (विशेष फ़ीचर)", "Status (स्थिति)", "Bilingual Magic Impact & Benefit (जादुई प्रभाव)"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(30, 41, 59)
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.bold = True
        p.font.size = Pt(8.5)
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = PP_ALIGN.LEFT

    features = [
        ("Multi-User Campus Wi-Fi\nमल्टी-यूज़र वाई-फ़ाई शेयरिंग",
         "✅ 100% Active",
         "Zero internet needed. 1 host PC shares server over school Wi-Fi; 20+ teachers & staff connect on phones/laptops simultaneously. (बिना इंटरनेट 20+ डिवाइस)।"),

        ("Teacher Mobile Attendance\nटीचर्स मोबाइल हाजिरी पोर्टल",
         "✅ 100% Active",
         "Teachers mark attendance directly on their mobile phones. Sensitive fees, cash registers & salaries are automatically locked from teachers. (सुरक्षित शिक्षक पोर्टल)।"),

        ("Universal Printer & Receipts\nयूनिवर्सल प्रिंटर व 1-क्लिक रसीद",
         "✅ 100% Active",
         "Auto-detects any HP, Canon, Epson or Thermal POS printer. 1-click Windows native print dialog, Save as PDF, and WhatsApp dispatch. (1-क्लिक ऑटो प्रिंटर)।"),

        ("Direct Parent WhatsApp\nपेरेंट्स 1-क्लिक व्हाट्सएप रसीद",
         "✅ 100% Active",
         "Fee receipts, pending fee reminders, and attendance notifications are delivered directly to parent's WhatsApp with zero SMS gateway costs. (मुफ़्त व्हाट्सएप रसीद)।"),

        ("Apna Software Hub Shield\nसेल्फ-हीलिंग डेटा शील्ड (ISO 27001)",
         "✅ 100% Active",
         "Zero data-loss guarantee. Protected by ISO 27001 aligned shield. If operator deletes database or D: drive, auto-heals in 1 second. (1 सेकंड में स्वतः रीस्टोर)।"),

        ("1-Click Native Bilingual UI\n1-क्लिक द्विभाषी इंजन (हिन्दी ⇄ EN)",
         "✅ 100% Active",
         "Instant top-bar toggle between authentic हिन्दी and English with 0.00s lag across 22+ modules. Rural staff use Hindi; CBSE staff use English. (शून्य लैग)।"),

        ("Hardware RTC Clock & Date\nलाइव हार्डवेयर क्लॉक व तारीख",
         "✅ 100% Active",
         "Motherboard RTC chip keeps live ticking clock, accurate date & dynamic Good Morning/Afternoon greeting 100% offline without internet. (लाइव ऑफलाइन समय)।"),

        ("Director's Pocket USB Vault\nडायरेक्टर पेनड्राइव बैकअप",
         "✅ 100% Active",
         "1-Click offline backup to Director's USB flash drive. Director safely carries 100% of the school's data home in their pocket every evening. (जेब में सुरक्षित बैकअप)।"),

        ("EOD Daily Closing Audit\nदैनिक जीमेल ऑडिट रिपोर्ट",
         "✅ 100% Active",
         "At day end, a complete financial and attendance audit (total fee collections, daily expenses, cash balance) is dispatched to Director's Gmail in 1 click. (EOD ऑडिट)।"),

        ("4-Pillar Marksheets & AI\n4-स्तंभीय मार्कशीट व AI पेपर",
         "✅ 100% Active",
         "CBSE/ICSE/State Board holistic report cards with psychomotor & co-scholastic grading; generate multi-section exam papers with answer keys in 2s. (AI प्रश्न-पत्र)।"),

        ("Vendor Client Master CRM\nवेंडर क्लाइंट पोर्टफोलियो एवं CRM",
         "✅ 100% Active",
         "Super Admin master command to manage 100+ client schools, track deal values, license validity, outstanding dues & WhatsApp reminders. (100+ स्कूल प्रबंधन)।"),

        ("Machine HWID Lock License\nमशीन लॉक व 30-दिन VIP ट्रायल",
         "✅ 100% Active",
         "Tamper-proof machine hardware lock with 30-day free VIP trial and SHA-256 cryptographic annual & lifetime activation keys. (हार्डवेयर-लॉक्ड सुरक्षा)।"),

        ("Master Emergency Recovery\nमास्टर आपातकालीन रिकवरी",
         "✅ 100% Active",
         "Permanent vendor master key (APNA-ADMIN-RECOVERY) and official phone helpline for instant emergency password reset if credentials are lost. (आपातकालीन वेंडर रिकवरी)।"),

        ("Zero-Lag Speed & Hotkeys\nशून्य-लैग स्पीड व हॉटकीज़",
         "✅ 100% Active",
         "F2 for instant New Admission, Ctrl+1 to 9 for lightning-fast tab navigation. Zero cloud spinning wheels, sub-50ms instant desktop response time. (बिजली सी तेज़ स्पीड)।")
    ]

    for idx, (f_name, f_status, f_desc) in enumerate(features):
        r_idx = idx + 1
        row_bg = RGBColor(248, 250, 252) if idx % 2 == 0 else RGBColor(255, 255, 255)

        # Col 0: Feature Name
        c0 = table.cell(r_idx, 0)
        c0.fill.solid()
        c0.fill.fore_color.rgb = row_bg
        p0 = c0.text_frame.paragraphs[0]
        p0.text = f_name
        p0.font.size = Pt(7.8)
        p0.font.bold = True
        p0.font.color.rgb = RGBColor(3, 105, 161) # Deep Cyan/Blue

        # Col 1: Status
        c1 = table.cell(r_idx, 1)
        c1.fill.solid()
        c1.fill.fore_color.rgb = RGBColor(236, 253, 245) # Light Mint Green
        p1 = c1.text_frame.paragraphs[0]
        p1.text = f_status
        p1.font.size = Pt(8.0)
        p1.font.bold = True
        p1.font.color.rgb = RGBColor(21, 128, 61) # Green

        # Col 2: Description
        c2 = table.cell(r_idx, 2)
        c2.fill.solid()
        c2.fill.fore_color.rgb = row_bg
        p2 = c2.text_frame.paragraphs[0]
        p2.text = f_desc
        p2.font.size = Pt(7.4)
        p2.font.color.rgb = RGBColor(30, 41, 59)

    prs.save(PPTX_PATH)
    print(f"✅ Slide 14 in '{PPTX_PATH}' updated successfully with 14 features table!")

if __name__ == "__main__":
    update_slide_14_bilingual_table()
