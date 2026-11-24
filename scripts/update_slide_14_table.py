import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

PPTX_PATH = "01_CLIENT_DEPLOYMENT_PACKAGE/03_Presentations_and_Templates/Apna_School_OS_Client_Pitch_Deck.pptx"

def update_slide_14_table():
    prs = Presentation(PPTX_PATH)
    
    # Target slide 14 (index 13)
    if len(prs.slides) >= 14:
        slide = prs.slides[13]
        # Remove old shapes on slide 14
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
    p1.text = "⚡ 2-Minute Special Features Scorecard: What Makes Us Unique"
    p1.font.size = Pt(20)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(250, 204, 21) # Amber Gold

    p2 = tf.add_paragraph()
    p2.text = "100% Offline Secured Architecture • Zero Monthly Cloud Bills • Self-Healing Vault • Multi-Station Campus Wi-Fi"
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

    # Set column widths
    table.columns[0].width = Inches(2.6)  # Feature
    table.columns[1].width = Inches(1.5)  # Status
    table.columns[2].width = Inches(5.1)  # Description

    # Header Row
    headers = ["विशेष फ़ीचर (Feature Name)", "सिस्टम स्थिति", "1-लाइन जादुई प्रभाव व स्कूल को लाभ (1-Liner Impact)"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(30, 41, 59) # Slate 800
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = PP_ALIGN.CENTER if i == 1 else PP_ALIGN.LEFT

    features = [
        ("मल्टी-यूज़र लोकल वाई-फ़ाई एक्सेस", "✅ 100% Active", "मेन पीसी की IP से 20+ शिक्षक व स्टाफ एक साथ बिना इंटरनेट अपने फोन/लैपटॉप पर चला सकते हैं।"),
        ("टीचर्स डेली अटेंडेंस पोर्टल", "✅ 100% Active", "शिक्षक क्लास में खड़े होकर मोबाइल से हाजिरी लगाएंगे; संवेदनशील फ़ीस व सैलरी डेटा शिक्षकों से ऑटो-लॉक रहेगा।"),
        ("सेल्फ-हीलिंग शैडो वॉल्ट", "✅ 100% Active", "मुख्य फोल्डर या डेटाबेस डिलीट होने पर भी हिडन वॉल्ट से 1 सेकंड में 100% डेटा व रसीदें स्वतः रीस्टोर हो जाती हैं।"),
        ("1-क्लिक द्विभाषी इंजन (हिन्दी ⇄ EN)", "✅ 100% Active", "टॉप मेन्यू से 1 सेकंड में पूरा सॉफ़्टवेयर शुद्ध हिंदी या इंग्लिश में बदल जाता है (शून्य पेज रीलोड, 0 लैग)।"),
        ("डायरेक्टर पेनड्राइव पॉकेट बैकअप", "✅ 100% Active", "1-क्लिक में डायरेक्टर की जेब वाली पेनड्राइव में डेटाबेस कॉपी; रोज़ शाम को पूरा स्कूल सुरक्षित जेब में घर ले जाएं।"),
        ("EOD डेली क्लोजिंग जीमेल रिपोर्ट", "✅ 100% Active", "शाम को स्कूल की छुट्टी पर दिनभर की कुल फ़ीस वसूली, खर्चे, कैश बैलेंस व हाजिरी सीधे डायरेक्टर के जीमेल पर।"),
        ("पेरेंट्स को 1-क्लिक व्हाट्सएप रसीद", "✅ 100% Active", "फ़ीस जमा होते ही डिजिटल रसीद और बकाया फ़ीस का ऑटो-तकाज़ा अभिभावक के व्हाट्सएप पर 1-क्लिक में wa.me द्वारा।"),
        ("4-स्तंभीय मार्कशीट व AI पेपर मेकर", "✅ 100% Active", "CBSE/ICSE/State Board आधारित समग्र रिपोर्ट कार्ड और 2 सेकंड में विषयवार परीक्षा पेपर उत्तर कुंजी सहित तैयार।"),
        ("वेंडर क्लाइंट पोर्टफोलियो एवं CRM", "✅ 100% Active", "सुपर एडमिन में 100+ स्कूलों की बिक्री, बकाया पेमेंट, डिजिटल लाइसेंस व व्हाट्सएप पेमेंट रिमाइंडर का मास्टर कंट्रोल।"),
        ("30-दिन VIP ट्रायल व एनुअल लॉक", "✅ 100% Active", "मशीन HWID लॉक प्रोटेक्शन, SHA-256 क्रिप्टोग्राफिक लाइसेंसिंग से 1-वर्ष या 10-वर्ष का लाइफटाइम ऑथेंटिकेशन।"),
        ("मास्टर इमरजेंसी रिकवरी कीज", "✅ 100% Active", "APNA-ADMIN-RECOVERY व आधिकारिक हेल्पलाइन द्वारा पासवर्ड भूलने पर भी 1-सेकंड में लाइफटाइम आपातकालीन रीसेट।"),
        ("शून्य-लैग स्पीड व ग्लोबल हॉटकीज़", "✅ 100% Active", "F2 दबाते ही न्यू एडमिशन फॉर्म, Ctrl+1 से 9 तक सुपरफ़ास्ट स्क्रीन स्विचिंग; बिना किसी क्लाउड बफरिंग के बिजली सी तेज़।")
    ]

    for row_idx, (fname, fstatus, fdesc) in enumerate(features, start=1):
        bg = RGBColor(248, 250, 252) if row_idx % 2 == 1 else RGBColor(255, 255, 255)
        
        # Col 0: Feature Name
        c0 = table.cell(row_idx, 0)
        c0.fill.solid()
        c0.fill.fore_color.rgb = bg
        p = c0.text_frame.paragraphs[0]
        p.text = fname
        p.font.size = Pt(8.5)
        p.font.bold = True
        p.font.color.rgb = RGBColor(14, 116, 144) # Deep Teal
        
        # Col 1: Status
        c1 = table.cell(row_idx, 1)
        c1.fill.solid()
        c1.fill.fore_color.rgb = RGBColor(236, 253, 245) if row_idx % 2 == 1 else RGBColor(240, 253, 244) # Soft green
        p = c1.text_frame.paragraphs[0]
        p.text = fstatus
        p.font.size = Pt(8.5)
        p.font.bold = True
        p.font.color.rgb = RGBColor(5, 150, 105) # Emerald Green
        p.alignment = PP_ALIGN.CENTER

        # Col 2: 1-Liner Impact
        c2 = table.cell(row_idx, 2)
        c2.fill.solid()
        c2.fill.fore_color.rgb = bg
        p = c2.text_frame.paragraphs[0]
        p.text = fdesc
        p.font.size = Pt(8.0)
        p.font.color.rgb = RGBColor(51, 65, 85) # Slate 700

    prs.save(PPTX_PATH)
    print("✅ Slide 14 successfully updated with native 3-column table format!")

if __name__ == "__main__":
    update_slide_14_table()
