import os
import pymupdf

FONT_PATH = "C:/Windows/Fonts/Nirmala.ttf"
FONT_BOLD_PATH = "C:/Windows/Fonts/NirmalaB.ttf"
if not os.path.exists(FONT_BOLD_PATH):
    FONT_BOLD_PATH = FONT_PATH

OUTPUT_PDF = "01_CLIENT_DEPLOYMENT_PACKAGE/02_Official_Manuals/2_MINUTE_EXECUTIVE_SALES_FLASHCARD.pdf"
PUBLIC_PDF = "app/src/ui/public/2_MINUTE_EXECUTIVE_SALES_FLASHCARD.pdf"

def generate_table_flashcard():
    doc = pymupdf.open()
    page = doc.new_page(width=595.27, height=841.89) # A4
    page.insert_font(fontname="Nirmala", fontfile=FONT_PATH)
    page.insert_font(fontname="NirmalaB", fontfile=FONT_BOLD_PATH)

    # 1. Top Header Banner (Midnight Navy #0f172a with Amber Gold Accents)
    page.draw_rect(pymupdf.Rect(0, 0, 595.27, 68), color=None, fill=(0.06, 0.09, 0.16))
    page.insert_text((28, 24), "APNA SCHOOL OS — ⚡ 2-MINUTE SPECIAL FEATURES CHEAT SHEET", fontname="NirmalaB", fontsize=12.5, color=(0.98, 0.8, 0.08)) # Gold
    page.insert_text((28, 43), "२ मिनट में स्कूल डायरेक्टर / प्रिंसिपल को समझाएं अपने सॉफ़्टवेयर की सभी जादुई खूबियाँ", fontname="NirmalaB", fontsize=10.5, color=(1, 1, 1))
    page.insert_text((28, 59), "Apna Software Hub • 100% Offline Secured • Official Helpline: 8504985149 / 8303324088", fontname="Nirmala", fontsize=8.5, color=(0.75, 0.88, 1))

    # 2. Executive Pitch Box
    page.draw_rect(pymupdf.Rect(24, 74, 571, 114), color=(0.14, 0.44, 0.65), fill=(0.94, 0.97, 1.0), width=0.8)
    page.insert_text((32, 88), "🎯 2-मिनट क्विक एग्जीक्यूटिव समरी (Quick Pitch For School Owners):", fontname="NirmalaB", fontsize=9.5, color=(0.08, 0.35, 0.55))
    pitch_line = "“सर, हमारा सॉफ़्टवेयर 100% ऑफ़लाइन है—न इंटरनेट चाहिए, न सर्वर का कोई मासिक बिल। आपके 1 पीसी से स्कूल के वाई-फ़ाई पर 20 शिक्षक अपने मोबाइल से हाजिरी लगाएंगे। डेटा 100% आपके कंप्यूटर में सुरक्षित रहेगा और डिलीट होने पर भी 1 सेकंड में खुद-ब-खुद वापस आ जाएगा!”"
    page.insert_text((32, 102), pitch_line[:145], fontname="Nirmala", fontsize=8.5, color=(0.12, 0.18, 0.28))
    page.insert_text((32, 112), pitch_line[145:], fontname="Nirmala", fontsize=8.5, color=(0.12, 0.18, 0.28))

    # 3. Table Header
    y_tbl = 120
    x_start = 24
    col1_w = 175  # Feature Name
    col2_w = 95   # Status
    col3_w = 277  # Magic 1-Liner Impact
    tbl_w = col1_w + col2_w + col3_w # 547
    x_end = x_start + tbl_w

    # Header Row Background (Deep Navy)
    page.draw_rect(pymupdf.Rect(x_start, y_tbl, x_end, y_tbl + 22), color=None, fill=(0.12, 0.18, 0.28))
    page.insert_text((x_start + 8, y_tbl + 15), "विशेष फ़ीचर का नाम (Feature Name)", fontname="NirmalaB", fontsize=9.0, color=(1, 1, 1))
    page.insert_text((x_start + col1_w + 10, y_tbl + 15), "सिस्टम स्थिति", fontname="NirmalaB", fontsize=9.0, color=(1, 1, 1))
    page.insert_text((x_start + col1_w + col2_w + 10, y_tbl + 15), "शॉर्ट में जादुई विवरण (1-Liner Magic Summary)", fontname="NirmalaB", fontsize=9.0, color=(1, 1, 1))

    # 4. Table Rows (12 Core Features matching User's requested format)
    features_data = [
        ("मल्टी-यूज़र लोकल वाई-फ़ाई एक्सेस",
         "✅ 100% Active",
         "मेन पीसी की आईपी से 20+ शिक्षक व स्टाफ एक साथ बिना इंटरनेट अपने फोन/लैपटॉप पर चला सकते हैं।"),

        ("टीचर्स डेली अटेंडेंस पोर्टल",
         "✅ 100% Active",
         "शिक्षक अपनी क्लास में खड़े होकर मोबाइल से हाजिरी लगाएंगे; संवेदनशील फ़ीस व सैलरी डेटा शिक्षकों से ऑटो-लॉक रहेगा।"),

        ("सेल्फ-हीलिंग शैडो वॉल्ट",
         "✅ 100% Active",
         "मुख्य फोल्डर या डेटाबेस डिलीट होने पर भी हिडन वॉल्ट से 1 सेकंड में 100% डेटा व रसीदें स्वतः रीस्टोर हो जाती हैं।"),

        ("1-क्लिक द्विभाषी इंजन (हिन्दी ⇄ EN)",
         "✅ 100% Active",
         "टॉप मेन्यू से 1 सेकंड में पूरा सॉफ़्टवेयर शुद्ध हिंदी या इंग्लिश में बदल जाता है (शून्य पेज रीलोड, 0 लैग)।"),

        ("डायरेक्टर पेनड्राइव पॉकेट बैकअप",
         "✅ 100% Active",
         "1-क्लिक में डायरेक्टर की जेब वाली पेनड्राइव में डेटाबेस कॉपी; रोज़ शाम को पूरा स्कूल सुरक्षित जेब में घर ले जाएं।"),

        ("EOD डेली क्लोजिंग जीमेल रिपोर्ट",
         "✅ 100% Active",
         "शाम को स्कूल की छुट्टी पर दिनभर की कुल फ़ीस वसूली, खर्चे, कैश बैलेंस व हाजिरी सीधे डायरेक्टर के जीमेल पर।"),

        ("पेरेंट्स को 1-क्लिक व्हाट्सएप रसीद",
         "✅ 100% Active",
         "फ़ीस जमा होते ही डिजिटल रसीद और बकाया फ़ीस का ऑटो-तकाज़ा अभिभावक के व्हाट्सएप पर 1-क्लिक में wa.me द्वारा।"),

        ("4-स्तंभीय मार्कशीट व AI पेपर मेकर",
         "✅ 100% Active",
         "CBSE/ICSE/State Board आधारित समग्र रिपोर्ट कार्ड और 2 सेकंड में विषयवार परीक्षा पेपर उत्तर कुंजी सहित तैयार।"),

        ("वेंडर क्लाइंट पोर्टफोलियो एवं CRM",
         "✅ 100% Active",
         "सुपर एडमिन में 100+ स्कूलों की बिक्री, बकाया पेमेंट, डिजिटल लाइसेंस व व्हाट्सएप पेमेंट रिमाइंडर का मास्टर कंट्रोल।"),

        ("30-दिन VIP ट्रायल व एनुअल लॉक",
         "✅ 100% Active",
         "मशीन HWID लॉक प्रोटेक्शन, SHA-256 क्रिप्टोग्राफिक लाइसेंसिंग से 1-वर्ष या 10-वर्ष का लाइफटाइम ऑथेंटिकेशन।"),

        ("मास्टर इमरजेंसी रिकवरी कीज",
         "✅ 100% Active",
         "APNA-ADMIN-RECOVERY व आधिकारिक हेल्पलाइन द्वारा पासवर्ड भूलने पर भी 1-सेकंड में लाइफटाइम आपातकालीन रीसेट।"),

        ("शून्य-लैग स्पीड व ग्लोबल शॉर्टकट्स",
         "✅ 100% Active",
         "F2 दबाते ही न्यू एडमिशन फॉर्म, Ctrl+1 से 9 तक सुपरफ़ास्ट स्क्रीन स्विचिंग; बिना किसी क्लाउड बफरिंग के बिजली सी तेज़।")
    ]

    curr_y = y_tbl + 22
    row_h = 42

    for idx, (fname, fstatus, fdesc) in enumerate(features_data):
        # Alternating background
        bg_col = (0.97, 0.98, 1.0) if idx % 2 == 0 else (1.0, 1.0, 1.0)
        page.draw_rect(pymupdf.Rect(x_start, curr_y, x_end, curr_y + row_h), color=(0.88, 0.91, 0.94), fill=bg_col, width=0.5)

        # Feature Name (Col 1)
        page.insert_text((x_start + 6, curr_y + 16), fname, fontname="NirmalaB", fontsize=9.0, color=(0.08, 0.25, 0.5))

        # Status Badge (Col 2) - Green Pill Box
        page.draw_rect(pymupdf.Rect(x_start + col1_w + 6, curr_y + 7, x_start + col1_w + col2_w - 6, curr_y + 27), color=None, fill=(0.86, 0.97, 0.88))
        page.insert_text((x_start + col1_w + 12, curr_y + 20), fstatus, fontname="NirmalaB", fontsize=8.5, color=(0.05, 0.55, 0.25))

        # 1-Liner Description (Col 3) - wrapped nicely
        l1 = fdesc[:72]
        l2 = fdesc[72:144]
        l3 = fdesc[144:]
        page.insert_text((x_start + col1_w + col2_w + 8, curr_y + 14), l1, fontname="Nirmala", fontsize=8.0, color=(0.15, 0.2, 0.28))
        if l2:
            page.insert_text((x_start + col1_w + col2_w + 8, curr_y + 26), l2, fontname="Nirmala", fontsize=8.0, color=(0.15, 0.2, 0.28))
        if l3:
            page.insert_text((x_start + col1_w + col2_w + 8, curr_y + 36), l3, fontname="Nirmala", fontsize=8.0, color=(0.15, 0.2, 0.28))

        curr_y += row_h

    # 5. Quick Comparison Bar (Below Table)
    y_comp = curr_y + 8
    page.draw_rect(pymupdf.Rect(x_start, y_comp, x_end, y_comp + 54), color=(0.8, 0.86, 0.92), fill=(0.94, 0.96, 0.98), width=0.8)
    page.insert_text((34, y_comp + 15), "⚖️ डायरेक्टर तुलना (The Director's Decision):", fontname="NirmalaB", fontsize=9.0, color=(0.15, 0.25, 0.4))
    page.insert_text((34, y_comp + 30), "• पुराना ऑनलाइन सॉफ़्टवेयर: इंटरनेट कटते ही स्कूल ठप | हर महीने ₹5,000-₹15,000 बिल | डेटा चोरी का डर", fontname="Nirmala", fontsize=8.2, color=(0.7, 0.15, 0.15))
    page.insert_text((34, y_comp + 45), "• Apna School OS: 100% ऑफ़लाइन (नो इंटरनेट) | ₹0 मासिक बिल (वन-टाइम) | 100% डेटा स्कूल के अपने पीसी में सुरक्षित", fontname="NirmalaB", fontsize=8.5, color=(0.05, 0.52, 0.25))

    # 6. Bottom Footer & Direct Helpline
    y_ft = y_comp + 62
    page.draw_rect(pymupdf.Rect(x_start, y_ft, x_end, y_ft + 56), color=None, fill=(0.06, 0.09, 0.16))
    page.insert_text((34, y_ft + 17), "Apna Software Hub • अधिकृत निर्माता: कृष्णा जी (Krishna ji) | अधिकृत कमर्शियल डेस्कटॉप सॉल्यूशन", fontname="NirmalaB", fontsize=9.5, color=(0.98, 0.8, 0.08))
    page.insert_text((34, y_ft + 33), "📞 आधिकारिक हेल्पलाइन / WhatsApp: 8504985149 / 8303324088  |  सपोर्ट ईमेल: krishnaskb143@gmail.com", fontname="NirmalaB", fontsize=9.0, color=(1, 1, 1))
    page.insert_text((34, y_ft + 48), "🎁 30-दिन निःशुल्क VIP ट्रायल उपलब्ध • अपने स्कूल में 1-क्लिक लाइव डेमो देखने हेतु अभी कॉल या व्हाट्सएप करें!", fontname="Nirmala", fontsize=8.5, color=(0.8, 0.95, 0.85))

    doc.save(OUTPUT_PDF)
    doc.save(PUBLIC_PDF)
    print(f"✅ Generated crisp Table-based Flashcard PDF successfully at:\n  - {OUTPUT_PDF}\n  - {PUBLIC_PDF}")

if __name__ == "__main__":
    generate_table_flashcard()
