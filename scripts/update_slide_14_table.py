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
    header_box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(10), Inches(1.15))
    header_box.fill.solid()
    header_box.fill.fore_color.rgb = RGBColor(15, 23, 42) # Deep Slate #0f172a
    header_box.line.color.rgb = RGBColor(15, 23, 42)

    tf = header_box.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "⚡ 2-Minute Executive Feature Scorecard (द्विभाषी फ़ीचर्स कार्ड)"
    p1.font.size = Pt(20)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(250, 204, 21) # Amber Gold

    p2 = tf.add_paragraph()
    p2.text = "Bilingual Edition for CBSE, ICSE, Convent & State Board Schools • 100% Offline-First • Zero Cloud Bills"
    p2.font.size = Pt(10)
    p2.font.color.rgb = RGBColor(226, 232, 240)

    # 2. Native PPTX Table
    rows = 13 # 1 header + 12 data rows
    cols = 3
    left = Inches(0.4)
    top = Inches(1.3)
    width = Inches(9.2)
    height = Inches(5.8)

    table_shape = slide.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table

    table.columns[0].width = Inches(2.7)  # Feature
    table.columns[1].width = Inches(1.4)  # Status
    table.columns[2].width = Inches(5.1)  # Description

    # Header Row
    headers = ["Special Feature (विशेष फ़ीचर)", "Status (स्थिति)", "Bilingual Magic Impact & Benefit (जादुई प्रभाव)"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(30, 41, 59) # Slate 800
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = PP_ALIGN.CENTER if i == 1 else PP_ALIGN.LEFT

    features = [
        ("Multi-User Campus Wi-Fi\n(मल्टी-यूज़र वाई-फ़ाई शेयरिंग)", "✅ 100% Active", "Zero internet needed. 1 host PC shares server over school Wi-Fi; 20+ staff connect on phones/PCs simultaneously. (बिना इंटरनेट 20+ डिवाइस)।"),
        ("Teacher Mobile Attendance\n(टीचर्स मोबाइल हाजिरी पोर्टल)", "✅ 100% Active", "Teachers mark attendance directly on mobile phones. Sensitive fees, cash registers & salaries are locked from teachers. (सुरक्षित शिक्षक पोर्टल)।"),
        ("Self-Healing Shadow Vault\n(सेल्फ-हीलिंग शैडो वॉल्ट)", "✅ 100% Active", "Zero data loss. If an operator deletes database or D:\\, the hidden vault automatically restores 100% records in 1 second. (1 सेकंड में रीस्टोर)।"),
        ("1-Click Native Bilingual UI\n(1-क्लिक द्विभाषी इंजन)", "✅ 100% Active", "Instant top-bar toggle between authentic हिन्दी and English with 0.00s lag across 22+ modules. (शून्य पेज रीलोड, 0 लैग)।"),
        ("Director's Pocket USB Vault\n(डायरेक्टर पेनड्राइव बैकअप)", "✅ 100% Active", "1-Click offline backup to Director's USB flash drive. Director safely carries 100% school data home in pocket. (जेब में सुरक्षित बैकअप)।"),
        ("EOD Daily Closing Audit\n(दैनिक जीमेल ऑडिट रिपोर्ट)", "✅ 100% Active", "At day end, a complete financial and attendance audit (collections, expenses, cash balance) is sent to Director's Gmail in 1 click. (EOD ऑडिट)।"),
        ("Direct Parent WhatsApp\n(पेरेंट्स 1-क्लिक व्हाट्सएप)", "✅ 100% Active", "Fee receipts, pending fee reminders, and attendance notifications are delivered to parent's WhatsApp via wa.me. (मुफ़्त व्हाट्सएप रसीद)।"),
        ("4-Pillar Marksheets & AI\n(4-स्तंभीय मार्कशीट व AI पेपर)", "✅ 100% Active", "CBSE/ICSE/State Board holistic report cards; generate multi-section exam papers with answer keys in 2 seconds. (हॉलिस्टिक रिपोर्ट कार्ड)।"),
        ("Vendor Client Master CRM\n(वेंडर क्लाइंट पोर्टफोलियो)", "✅ 100% Active", "Super Admin master command to manage 100+ client schools, track deal values, license validity & payment reminders. (100+ स्कूल प्रबंधन)।"),
        ("Machine HWID Lock License\n(मशीन लॉक व एनुअल लाइसेंस)", "✅ 100% Active", "Tamper-proof machine hardware lock with 30-day free VIP trial and SHA-256 cryptographic annual & lifetime activation. (हार्डवेयर-लॉक्ड सुरक्षा)।"),
        ("Master Emergency Recovery\n(मास्टर आपातकालीन रिकवरी)", "✅ 100% Active", "Permanent vendor master key (APNA-ADMIN-RECOVERY) and official phone helpline for instant emergency password reset. (आपातकालीन वेंडर रिकवरी)।"),
        ("Zero-Lag Speed & Hotkeys\n(शून्य-लैग स्पीड व हॉटकीज़)", "✅ 100% Active", "F2 for instant New Admission, Ctrl+1 to 9 for lightning-fast tab navigation. Zero cloud spinning wheels, sub-50ms speed. (बिजली सी तेज़ स्पीड)।")
    ]

    for row_idx, (fname, fstatus, fdesc) in enumerate(features, start=1):
        bg = RGBColor(248, 250, 252) if row_idx % 2 == 1 else RGBColor(255, 255, 255)
        
        # Col 0: Feature Name
        c0 = table.cell(row_idx, 0)
        c0.fill.solid()
        c0.fill.fore_color.rgb = bg
        p = c0.text_frame.paragraphs[0]
        p.text = fname
        p.font.size = Pt(8.0)
        p.font.bold = True
        p.font.color.rgb = RGBColor(14, 116, 144)
        
        # Col 1: Status
        c1 = table.cell(row_idx, 1)
        c1.fill.solid()
        c1.fill.fore_color.rgb = RGBColor(236, 253, 245) if row_idx % 2 == 1 else RGBColor(240, 253, 244)
        p = c1.text_frame.paragraphs[0]
        p.text = fstatus
        p.font.size = Pt(8.5)
        p.font.bold = True
        p.font.color.rgb = RGBColor(5, 150, 105)
        p.alignment = PP_ALIGN.CENTER

        # Col 2: 1-Liner Impact
        c2 = table.cell(row_idx, 2)
        c2.fill.solid()
        c2.fill.fore_color.rgb = bg
        p = c2.text_frame.paragraphs[0]
        p.text = fdesc
        p.font.size = Pt(7.8)
        p.font.color.rgb = RGBColor(51, 65, 85)

    prs.save(PPTX_PATH)
    print("✅ Slide 14 successfully updated with Bilingual table format!")

if __name__ == "__main__":
    update_slide_14_bilingual_table()
