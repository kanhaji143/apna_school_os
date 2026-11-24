import os
import pymupdf

FONT_PATH = "C:/Windows/Fonts/Nirmala.ttf"
FONT_BOLD_PATH = "C:/Windows/Fonts/NirmalaB.ttf"
if not os.path.exists(FONT_BOLD_PATH):
    FONT_BOLD_PATH = FONT_PATH

OUTPUT_PDF = "01_CLIENT_DEPLOYMENT_PACKAGE/02_Official_Manuals/2_MINUTE_EXECUTIVE_SALES_FLASHCARD.pdf"
PUBLIC_PDF = "app/src/ui/public/2_MINUTE_EXECUTIVE_SALES_FLASHCARD.pdf"

def generate_flashcard():
    doc = pymupdf.open()
    page = doc.new_page(width=595.27, height=841.89) # A4
    page.insert_font(fontname="Nirmala", fontfile=FONT_PATH)
    page.insert_font(fontname="NirmalaB", fontfile=FONT_BOLD_PATH)

    # 1. Top Header Banner (Midnight Navy #0f172a)
    page.draw_rect(pymupdf.Rect(0, 0, 595.27, 72), color=None, fill=(0.06, 0.09, 0.16))
    page.insert_text((32, 26), "APNA SCHOOL OS — ⚡ 2-MINUTE EXECUTIVE SALES FLASHCARD", fontname="NirmalaB", fontsize=13, color=(0.98, 0.8, 0.08)) # Gold
    page.insert_text((32, 45), "स्कूल डायरेक्टर / प्रिंसिपल के सामने मात्र 2 मिनट में समझाएं अपने सॉफ़्टवेयर का संपूर्ण जादू", fontname="NirmalaB", fontsize=11, color=(1, 1, 1))
    page.insert_text((32, 62), "Apna Software Hub (AI & Tech Division) • Official Tech Helpline: 8504985149 / 8303324088", fontname="Nirmala", fontsize=9, color=(0.8, 0.9, 1))

    # 2. Executive 30-Second Elevator Pitch Box
    page.draw_rect(pymupdf.Rect(28, 80, 567, 126), color=(0.14, 0.44, 0.65), fill=(0.93, 0.97, 1.0), width=1)
    page.insert_text((36, 96), "🎯 डायरेक्टर के सामने 30-सेकंड की शुरुआती पंचलाइन (The Winning Opening Pitch):", fontname="NirmalaB", fontsize=10.5, color=(0.08, 0.35, 0.55))
    pitch_line = "“सर, हमारा सॉफ़्टवेयर 100% ऑफ़लाइन है—न इंटरनेट चाहिए, न सर्वर का कोई मासिक किराया। आपके 1 कंप्यूटर पर चलेगा और स्कूल के वाई-फ़ाई से 20 शिक्षक अपने मोबाइल से बच्चों की हाजिरी लगा सकेंगे। डेटा 100% आपके स्कूल में सुरक्षित रहेगा और डिलीट होने पर भी 1 सेकंड में स्वतः रीस्टोर हो जाएगा!”"
    # wrap text
    page.insert_text((36, 114), pitch_line[:145], fontname="Nirmala", fontsize=9, color=(0.1, 0.15, 0.25))
    page.insert_text((36, 126), pitch_line[145:], fontname="Nirmala", fontsize=9, color=(0.1, 0.15, 0.25))

    # 3. Two Columns Layout for 10 Super-Powers
    col_w = 264
    x1 = 28
    x2 = 303
    y_start = 138

    # Left Column Header: Security & Architecture
    page.draw_rect(pymupdf.Rect(x1, y_start, x1 + col_w, y_start + 24), color=None, fill=(0.01, 0.45, 0.72))
    page.insert_text((x1 + 10, y_start + 16), "🛡️ 5 सुरक्षा एवं आर्किटेक्चर सुपर-पावर्स", fontname="NirmalaB", fontsize=10.5, color=(1, 1, 1))

    # Right Column Header: Operations & Parent Delight
    page.draw_rect(pymupdf.Rect(x2, y_start, x2 + col_w, y_start + 24), color=None, fill=(0.02, 0.55, 0.38))
    page.insert_text((x2 + 10, y_start + 16), "🚀 5 दैनिक संचालन व पेरेंट्स डिलाइट सुपर-पावर्स", fontname="NirmalaB", fontsize=10.5, color=(1, 1, 1))

    powers_left = [
        ("1. 100% ऑफ़लाइन + कैंपस वाई-फ़ाई शेयरिंग",
         "इंटरनेट की शून्य निर्भरता। 1 मेन कंप्यूटर पर चलेगा और स्कूल के सामान्य वाई-फ़ाई से 20+ शिक्षक व क्लर्क अपने खुद के मोबाइल/लैपटॉप से एक साथ एक्सेस कर सकेंगे।"),
        
        ("2. सेल्फ-हीलिंग शैडो वॉल्ट (Self-Healing Vault)",
         "अगर कोई ऑपरेटर जानबूझकर या गलती से D: ड्राइव या डेटाबेस डिलीट कर दे, तो हिडन वॉल्ट से 1 सेकंड में 100% डेटा व रसीदें अपने आप रीस्टोर हो जाती हैं।"),
        
        ("3. टीचर्स मोबाइल अटेंडेंस पोर्टल (Role Security)",
         "कक्षा में खड़े होकर शिक्षक अपने मोबाइल से बच्चों की हाजिरी लगाएंगे। संवेदनशील फ़ीस वसूली, खर्चे व सैलरी रजिस्टर शिक्षकों से पूरी तरह लॉक रहेंगे।"),
        
        ("4. डायरेक्टर पॉकेट वॉल्ट (पेनड्राइव बैकअप)",
         "1-क्लिक में डायरेक्टर की जेब वाली पेनड्राइव में डेटाबेस कॉपी। डायरेक्टर रोज़ शाम को पूरे स्कूल का 100% डेटा सुरक्षित अपनी जेब में घर ले जा सकते हैं।"),
        
        ("5. EOD डेली क्लोजिंग जीमेल रिपोर्ट (Audit)",
         "शाम को स्कूल की छुट्टी पर दिनभर की कुल फ़ीस वसूली, खर्चे, कैश बैलेंस व हाजिरी की संपूर्ण ऑडिट रिपोर्ट 1-क्लिक में डायरेक्टर के जीमेल पर डिस्पैच।")
    ]

    powers_right = [
        ("6. 1-क्लिक डायरेक्ट व्हाट्सएप रसीद व तकाज़ा",
         "फ़ीस जमा होते ही डिजिटल रसीद और बकाया फ़ीस का ऑटो-तकाज़ा अभिभावक के व्हाट्सएप पर 1-क्लिक में wa.me द्वारा बिना किसी अतिरिक्त शुल्क के तुरंत।"),
        
        ("7. 1-क्लिक द्विभाषी इंजन (हिन्दी ⇄ English)",
         "टॉप नेवबार से 1 सेकंड में पूरा सॉफ़्टवेयर शुद्ध हिंदी या इंग्लिश में बदल जाता है। ग्रामीण स्टाफ हिंदी में और अर्बन शाखाएं अंग्रेजी में बिना रुकावट काम करें।"),
        
        ("8. 4-स्तंभीय मार्कशीट व AI प्रश्न-पत्र मेकर",
         "CBSE/ICSE/State Board का 4-स्तंभीय समग्र रिपोर्ट कार्ड और विषय, कक्षा व कठिनाई स्तर चुनकर 2 सेकंड में बहु-खंडीय परीक्षा पेपर उत्तर कुंजी सहित तैयार।"),
        
        ("9. शून्य-लैग स्पीड व ग्लोबल शॉर्टकट्स",
         "F2 दबाते ही 1 सेकंड में न्यू एडमिशन फॉर्म, Ctrl+1 से 9 तक सुपरफास्ट नेविगेशन। क्लाउड के गोल घूमने वाले बफरिंग पहियों से 100% हमेशा की मुक्ति।"),
        
        ("10. वेंडर मास्टर कंट्रोल व आधिकारिक हेल्पलाइन",
         "सुपर एडमिन में 100+ स्कूलों का बिक्री, बकाया व लाइसेंस प्रबंधन। हर संस्थान को मशीन HWID लॉक प्रोटेक्शन तथा 8504985149 पर डायरेक्ट फोन सपोर्ट।")
    ]

    curr_y = y_start + 32
    box_h = 92

    for title, desc in powers_left:
        page.draw_rect(pymupdf.Rect(x1, curr_y, x1 + col_w, curr_y + box_h), color=(0.85, 0.9, 0.95), fill=(0.97, 0.98, 1.0), width=0.8)
        page.insert_text((x1 + 8, curr_y + 16), title, fontname="NirmalaB", fontsize=9.5, color=(0.05, 0.35, 0.65))
        # render description lines
        words = desc
        l1 = words[:75]
        l2 = words[75:150]
        l3 = words[150:]
        page.insert_text((x1 + 8, curr_y + 34), l1, fontname="Nirmala", fontsize=8.5, color=(0.15, 0.2, 0.3))
        if l2: page.insert_text((x1 + 8, curr_y + 48), l2, fontname="Nirmala", fontsize=8.5, color=(0.15, 0.2, 0.3))
        if l3: page.insert_text((x1 + 8, curr_y + 62), l3, fontname="Nirmala", fontsize=8.5, color=(0.15, 0.2, 0.3))
        curr_y += box_h + 8

    curr_y2 = y_start + 32
    for title, desc in powers_right:
        page.draw_rect(pymupdf.Rect(x2, curr_y2, x2 + col_w, curr_y2 + box_h), color=(0.85, 0.95, 0.9), fill=(0.96, 1.0, 0.98), width=0.8)
        page.insert_text((x2 + 8, curr_y2 + 16), title, fontname="NirmalaB", fontsize=9.5, color=(0.02, 0.48, 0.32))
        words = desc
        l1 = words[:75]
        l2 = words[75:150]
        l3 = words[150:]
        page.insert_text((x2 + 8, curr_y2 + 34), l1, fontname="Nirmala", fontsize=8.5, color=(0.15, 0.2, 0.3))
        if l2: page.insert_text((x2 + 8, curr_y2 + 48), l2, fontname="Nirmala", fontsize=8.5, color=(0.15, 0.2, 0.3))
        if l3: page.insert_text((x2 + 8, curr_y2 + 62), l3, fontname="Nirmala", fontsize=8.5, color=(0.15, 0.2, 0.3))
        curr_y2 += box_h + 8

    # 4. Comparison Table (पुराना ऑनलाइन सॉफ़्टवेयर vs Apna School OS)
    y_tbl = 648
    page.draw_rect(pymupdf.Rect(28, y_tbl, 567, y_tbl + 82), color=(0.8, 0.85, 0.9), fill=(0.98, 0.98, 0.99), width=1)
    page.draw_rect(pymupdf.Rect(28, y_tbl, 567, y_tbl + 20), color=None, fill=(0.2, 0.25, 0.35))
    page.insert_text((36, y_tbl + 14), "📊 तुलनात्मक अंतर: पुराना ऑनलाइन क्लाउड सॉफ़्टवेयर  बनाम  Apna School OS", fontname="NirmalaB", fontsize=9.5, color=(1, 1, 1))

    comparisons = [
        ("मापदंड (Metric)", "पारंपरिक ऑनलाइन ERP / वेब ऐप्स", "Apna School OS (एंटरप्राइज डेस्कटॉप)"),
        ("इंटरनेट की जरूरत", "इंटरनेट कटते ही स्कूल का काम ठप", "100% ऑफ़लाइन (बिना इंटरनेट निर्बाध)"),
        ("मासिक सर्वर खर्च", "हर महीने ₹3,000 - ₹12,000 का अतिरिक्त बिल", "शून्य (₹0) मासिक बिल — वन-टाइम लाइसेंस"),
        ("डेटा पर मालिकाना हक", "डेटा बाहरी सर्वर पर — चोरी/लीक का जोखिम", "100% स्कूल के अपने पीसी व पेनड्राइव में")
    ]
    r_y = y_tbl + 34
    for m, old, apna in comparisons[1:]:
        page.insert_text((36, r_y), f"• {m}:", fontname="NirmalaB", fontsize=8.5, color=(0.1, 0.15, 0.25))
        page.insert_text((150, r_y), f"❌ {old}", fontname="Nirmala", fontsize=8.5, color=(0.7, 0.1, 0.1))
        page.insert_text((350, r_y), f"✅ {apna}", fontname="NirmalaB", fontsize=8.5, color=(0.05, 0.5, 0.25))
        r_y += 15

    # 5. Bottom Footer Call-To-Action Box
    y_ft = 736
    page.draw_rect(pymupdf.Rect(28, y_ft, 567, y_ft + 72), color=None, fill=(0.06, 0.09, 0.16))
    page.insert_text((38, y_ft + 20), "Apna Software Hub • सॉफ़्टवेयर निर्माता: कृष्णा जी (Krishna ji) | अधिकृत कमर्शियल डेस्कटॉप सॉल्यूशन", fontname="NirmalaB", fontsize=10, color=(0.98, 0.8, 0.08))
    page.insert_text((38, y_ft + 38), "📞 आधिकारिक हेल्पलाइन / WhatsApp: 8504985149 / 8303324088  |  ईमेल: krishnaskb143@gmail.com", fontname="NirmalaB", fontsize=9.5, color=(1, 1, 1))
    page.insert_text((38, y_ft + 56), "🎁 30-दिवसीय निःशुल्क वीआईपी ट्रायल उपलब्ध • अपने स्कूल में 1-क्लिक में लाइव डेमो देखने हेतु अभी संपर्क करें!", fontname="Nirmala", fontsize=9, color=(0.8, 0.95, 0.85))

    doc.save(OUTPUT_PDF)
    doc.save(PUBLIC_PDF)
    print(f"✅ Generated 1-Page Sales Flashcard PDF successfully at:\n  - {OUTPUT_PDF}\n  - {PUBLIC_PDF}")

if __name__ == "__main__":
    generate_flashcard()
