import os
import pymupdf

FONT_PATH = "C:/Windows/Fonts/Nirmala.ttf"
FONT_BOLD_PATH = "C:/Windows/Fonts/NirmalaB.ttf"
if not os.path.exists(FONT_BOLD_PATH):
    FONT_BOLD_PATH = FONT_PATH

def add_chapter_6(doc):
    page = doc.new_page(width=595.27, height=841.89)
    page.insert_font(fontname="Nirmala", fontfile=FONT_PATH)
    page.insert_font(fontname="NirmalaB", fontfile=FONT_BOLD_PATH)

    # Top banner background (Teal #0e7490)
    page.draw_rect(pymupdf.Rect(0, 0, 595.27, 70), color=None, fill=(0.05, 0.45, 0.56))
    page.insert_text((36, 32), "APNA SCHOOL OS — ऑफ़लाइन द्विभाषी यूआई व संपूर्ण छात्र बही-खाता", fontname="NirmalaB", fontsize=14.5, color=(1, 1, 1))
    page.insert_text((36, 52), "Enterprise Edition • अध्याय 6: 1-क्लिक भाषा परिवर्तन (हिन्दी ⇄ English) व छात्र 360° लेजर SOP", fontname="Nirmala", fontsize=9.5, color=(0.9, 0.96, 1))

    y = 95

    # Section 1: 1-Click Offline Bilingual Engine
    page.draw_rect(pymupdf.Rect(36, y - 14, 559, y + 4), color=None, fill=(0.91, 0.96, 0.98))
    page.insert_text((42, y), "1. ऑफ़लाइन द्विभाषी यूआई (Bilingual हिन्दी ⇄ English Switcher)", fontname="NirmalaB", fontsize=11.5, color=(0.05, 0.4, 0.5))
    y += 20

    s1_text = (
        "• 1-क्लिक हेडर टॉगल: टॉप नेविगेशन बार में '🌐 हिन्दी / English' बटन पर क्लिक करते ही 0.01 सेकंड में\n"
        "  पूरे सॉफ्टवेयर का इंटरफ़ेस चुनी हुई भाषा में बदल जाता है (शून्य इंटरनेट, 100% ऑफ़लाइन नेटिव शब्दकोश)।\n"
        "• 22+ कोर मॉड्यूल अनुवाद: डैशबोर्ड, छात्र रजिस्टर, आई-कार्ड, फ़ीस वसूली, अंकतालिका, प्रश्न पत्र मेकर,\n"
        "  एआई टूल्स, और सेटिंग्स के सभी मेनू, बटन व टेबल हेडिंग्स स्वतः द्विभाषी रूपांतरित होते हैं।\n"
        "• डेटा सुरक्षा: छात्रों के वास्तविक नाम, रोल नंबर और रसीदों का डेटा 100% सुरक्षित और अपरिवर्तित रहता है।\n"
        "• स्थायी वरीयता: ऑपरेटर की चुनी हुई भाषा कंप्यूटर बंद करने के बाद भी अगली बार स्वतः लोड होती है।"
    )
    rect1 = pymupdf.Rect(45, y, 555, y + 75)
    page.insert_textbox(rect1, s1_text, fontname="Nirmala", fontsize=9, color=(0.15, 0.15, 0.15), lineheight=1.3)
    y += 82

    # Section 2: संपूर्ण छात्र बही-खाता
    page.draw_rect(pymupdf.Rect(36, y - 14, 559, y + 4), color=None, fill=(0.91, 0.96, 0.98))
    page.insert_text((42, y), "2. संपूर्ण छात्र बही-खाता (Student 360° All-in-One Ledger)", fontname="NirmalaB", fontsize=11.5, color=(0.05, 0.4, 0.5))
    y += 20

    s2_text = (
        "• 1-सेकंड छात्र खोज: केवल छात्र का 'एडमिशन नंबर' (जैसे 9649) अथवा 'नाम' टाइप करते ही छात्र का\n"
        "  संपूर्ण प्रोफाइल, फोटो, माता-पिता का नाम, मोबाइल व आधार स्क्रीन पर तुरंत खुल जाता है।\n"
        "• 360° एकीकृत वित्तीय खाता: छात्र की कुल वार्षिक फीस, जमा रसीदों की पूरी सूची (तारीख, रसीद नं., मदवार विवरण),\n"
        "  और वर्तमान शुद्ध बाकी (Net Due) रंगीन बैज (हरा/नारंगी) के साथ तुरंत दिखता है।\n"
        "• उपस्थिति व परीक्षा मैट्रिक्स: कुल कार्य दिवसों में उपस्थिति %, शैक्षणिक ग्रेड, और एडवांस जमा राशि का स्पष्ट विवरण।\n"
        "• 1-क्लिक A4 सिंगल-शीट प्रिंट: अभिभावक के काउंटर पर आते ही 1 क्लिक में पूरा बही-खाता प्रिंट करके हाथ में सौंपें।"
    )
    rect2 = pymupdf.Rect(45, y, 555, y + 75)
    page.insert_textbox(rect2, s2_text, fontname="Nirmala", fontsize=9, color=(0.15, 0.15, 0.15), lineheight=1.3)
    y += 82

    # Section 3: पुराने सत्रों का पुराना बकाया
    page.draw_rect(pymupdf.Rect(36, y - 14, 559, y + 4), color=None, fill=(0.91, 0.96, 0.98))
    page.insert_text((42, y), "3. पुराने सत्रों का पुराना बकाया वसूली SOP (Session-Wise Old Dues Engine)", fontname="NirmalaB", fontsize=11.5, color=(0.05, 0.4, 0.5))
    y += 20

    s3_text = (
        "• समस्या समाधान: छोटे/मध्यम स्कूलों में पिछले सत्रों का लाखों रुपया बकाया रह जाता है। अब चालू सत्र (2026-27)\n"
        "  और पूर्व सत्रों का पुराना बकाया (Old Due) दोनों अलग-अलग स्पष्ट रूप से प्रदर्शित होते हैं।\n"
        "• ⚡ पुराने सत्र का बकाया जमा करें: फ़ीस काउंटर पर 1 क्लिक में पुराना बकाया जमा करने की सुविधा।\n"
        "• पुराना बकाया मास्टर रजिस्टर: 'Reports & Ledgers' -> 'सत्र-वार बकाया' में पूरे स्कूल का पुराना बकाया एक क्लिक में देखें।\n"
        "• 1-क्लिक व्हाट्सएप तकादा: अभिभावक के फोन पर सीधे विनम्र फीस तकादा संदेश भेजने का विकल्प।"
    )
    rect3 = pymupdf.Rect(45, y, 555, y + 75)
    page.insert_textbox(rect3, s3_text, fontname="Nirmala", fontsize=9, color=(0.15, 0.15, 0.15), lineheight=1.3)
    y += 82

    # Section 4: आई-कार्ड 2.0 मल्टी-लेआउट
    page.draw_rect(pymupdf.Rect(36, y - 14, 559, y + 4), color=None, fill=(0.91, 0.96, 0.98))
    page.insert_text((42, y), "4. आई-कार्ड 2.0 मल्टी-लेआउट इंजन एवं प्रिंसिपल सिग्नेचर", fontname="NirmalaB", fontsize=11.5, color=(0.05, 0.4, 0.5))
    y += 20

    s4_text = (
        "• दो क्लासिक प्रारूप: 🔄 हॉरिजॉन्टल (Landscape 85x54mm) पॉकेट क्लिप कार्ड अथवा 📱 वर्टिकल (Portrait 54x85mm) लेनयार्ड।\n"
        "• ऑटोमैटिक लोगो व फोटो सिंक: स्कूल प्रोफाइल का लोगो व छात्र प्रवेश फॉर्म की फोटो आई-कार्ड पर स्वतः प्रदर्शित होती है।\n"
        "• अधिकृत मुहर व हस्ताक्षर: छात्र फोटो के ठीक नीचे 'Principal Signature' का समर्पित आधिकारिक बैंड उपलब्ध है।\n"
        "• 6 क्लासिक कलर थीम्स: Royal Blue, Dark Navy, Forest Green, Maroon, Classic Orange, Minimal White."
    )
    rect4 = pymupdf.Rect(45, y, 555, y + 70)
    page.insert_textbox(rect4, s4_text, fontname="Nirmala", fontsize=9, color=(0.15, 0.15, 0.15), lineheight=1.3)
    y += 75

    # Footer note
    page.draw_rect(pymupdf.Rect(36, 775, 559, 815), color=None, fill=(0.96, 0.96, 0.96))
    page.draw_rect(pymupdf.Rect(36, 775, 559, 815), color=(0.8, 0.8, 0.8), width=0.5)
    page.insert_text((45, 792), "📞 तकनीकी सहायता एवं प्रशिक्षण हेल्पलाइन: +91 8504985149  |  ✉️ apnaschool.tech@gmail.com", fontname="NirmalaB", fontsize=9.5, color=(0.2, 0.2, 0.2))
    page.insert_text((45, 807), "APNA SOFTWARE HUB — 100% Offline Institutional Enterprise Edition • 2026", fontname="Nirmala", fontsize=8.5, color=(0.4, 0.4, 0.4))


def add_chapter_7(doc):
    page = doc.new_page(width=595.27, height=841.89)
    page.insert_font(fontname="Nirmala", fontfile=FONT_PATH)
    page.insert_font(fontname="NirmalaB", fontfile=FONT_BOLD_PATH)

    # Top banner background (Deep Indigo #1e1b4b)
    page.draw_rect(pymupdf.Rect(0, 0, 595.27, 70), color=None, fill=(0.12, 0.11, 0.29))
    page.insert_text((36, 32), "APNA SOFTWARE HUB — वेंडर मास्टर CRM व क्लाइंट पोर्टफोलियो", fontname="NirmalaB", fontsize=14.5, color=(1, 1, 1))
    page.insert_text((36, 52), "Enterprise Edition • अध्याय 7: वेंडर क्लाइंट पोर्टफोलियो CRM, लाइसेंसिंग एवं क्रैश-प्रूफ गिट आर्किटेक्चर", fontname="Nirmala", fontsize=9.5, color=(0.85, 0.88, 1))

    y = 95

    # Section 1: वेंडर क्लाइंट CRM व 100+ स्कूल ट्रैकिंग
    page.draw_rect(pymupdf.Rect(36, y - 14, 559, y + 4), color=None, fill=(0.94, 0.93, 0.98))
    page.insert_text((42, y), "1. वेंडर क्लाइंट पोर्टफोलियो व 100+ स्कूल सेल्स लेजर (Vendor Master Dossier)", fontname="NirmalaB", fontsize=11.5, color=(0.28, 0.15, 0.55))
    y += 20

    s1_text = (
        "• एक्सक्लूसिव सुपर एडमिन एक्सेस: केवल सॉफ्टवेयर निर्माता / प्लेटफॉर्म ओनर (hanuganeshan) के लिए आरक्षित।\n"
        "• 360° क्लाइंट प्रोफाइल: स्कूल का नाम, बोर्ड, शहर, राज्य, पिन, डायरेक्टर का नाम, कॉलिंग फोन व व्हाट्सएप।\n"
        "• कमर्शियल व पेमेंट लेजर: सेल दिनांक, तय सौदा राशि (Deal ₹), प्राप्त एडवांस (₹), शुद्ध बाकी और अगली किश्त देय तिथि।\n"
        "• देय तिथि बीतने पर अलर्ट: अगली किश्त की तिथि निकलते ही सिस्टम तालिका में लाल '⚠️ OVERDUE' अलर्ट दिखाता है।\n"
        "• 4 मास्टर KPI कार्ड्स: कुल पंजीकृत स्कूल, कुल सकल बिक्री, कुल प्राप्त भुगतान, और बाज़ार में फंसा बकाया एक नज़र में।"
    )
    rect1 = pymupdf.Rect(45, y, 555, y + 75)
    page.insert_textbox(rect1, s1_text, fontname="Nirmala", fontsize=9, color=(0.15, 0.15, 0.15), lineheight=1.3)
    y += 82

    # Section 2: 1-Click WhatsApp तकादा व लाइसेंस जनरेटर
    page.draw_rect(pymupdf.Rect(36, y - 14, 559, y + 4), color=None, fill=(0.94, 0.93, 0.98))
    page.insert_text((42, y), "2. 1-क्लिक व्हाट्सएप तकादा व क्रिप्टोग्राफिक लाइसेंस की जनरेटर", fontname="NirmalaB", fontsize=11.5, color=(0.28, 0.15, 0.55))
    y += 20

    s2_text = (
        "• 1-Click WhatsApp तकादा: तालिका में '📲 तकादा' बटन दबाते ही स्कूल डायरेक्टर के व्हाट्सएप पर शेष राशि, देय तिथि,\n"
        "  संस्थान का नाम और हेल्पलाइन सहित पेशेवर तकादा संदेश स्वतः तैयार होकर प्रेषित हो जाता है।\n"
        "• मशीन HWID लिंक्ड लाइसेंस की: स्कूल कंप्यूटर की Installation ID (HWID) से बंधी हुई 365 दिन, 30 दिन अथवा आजीवन\n"
        "  मास्टर लाइसेंस की (ASH-XXXX-XXXX-XXXX) 1 क्लिक में जनरेट एवं कॉपी करने की सुविधा।\n"
        "• वॉयस ऑफ कस्टमर (CRM नोट्स): स्कूल ऑपरेटर का अनुभव, हार्डवेयर की स्थिति (पुराना प्रिंटर, रैम), एवं भावी मांगें दर्ज करें।"
    )
    rect2 = pymupdf.Rect(45, y, 555, y + 75)
    page.insert_textbox(rect2, s2_text, fontname="Nirmala", fontsize=9, color=(0.15, 0.15, 0.15), lineheight=1.3)
    y += 82

    # Section 3: क्रैश-प्रूफ गिट आर्किटेक्चर
    page.draw_rect(pymupdf.Rect(36, y - 14, 559, y + 4), color=None, fill=(0.94, 0.93, 0.98))
    page.insert_text((42, y), "3. क्रैश-प्रूफ क्लाउड गिट बैकअप (Developer PC Disaster Recovery)", fontname="NirmalaB", fontsize=11.5, color=(0.28, 0.15, 0.55))
    y += 20

    s3_text = (
        "• पीसी क्रैश होने का 0% खतरा: मास्टर क्लाइंट डेटा सीधे '02_VENDOR_CONTROL_PRIVATE_HUB/client_portfolio_master.json'\n"
        "  में सहेजा जाता है, जो गिट रिपोजिटरी के साथ सिंक रहता है।\n"
        "• आपदा से 10 सेकंड में पुनर्प्राप्ति: यदि डेवलपर का लैपटॉप चोरी हो जाए या हार्ड डिस्क जल जाए, तो किसी भी नए\n"
        "  कंप्यूटर पर सिर्फ 'git clone' करते ही आपके पूरे 100 स्कूलों का बहीखाता, फ़ोन नंबर व लाइसेंस रिकॉर्ड्स वापस आ जाएंगे!\n"
        "• गोपनीयता व सुरक्षा: सामान्य क्लाइंट स्कूल कभी भी वेंडर के दूसरे क्लाइंट्स या कुल कमाई का डेटा नहीं देख सकते।"
    )
    rect3 = pymupdf.Rect(45, y, 555, y + 75)
    page.insert_textbox(rect3, s3_text, fontname="Nirmala", fontsize=9, color=(0.15, 0.15, 0.15), lineheight=1.3)
    y += 82

    # Section 4: 1-Click मास्टर एक्सेल एक्सपोर्ट
    page.draw_rect(pymupdf.Rect(36, y - 14, 559, y + 4), color=None, fill=(0.94, 0.93, 0.98))
    page.insert_text((42, y), "4. 1-क्लिक मास्टर एक्सेल एक्सपोर्ट (School_Clients_Master.xlsx)", fontname="NirmalaB", fontsize=11.5, color=(0.28, 0.15, 0.55))
    y += 20

    s4_text = (
        "• '📥 Export Master Excel (.XLSX)' बटन दबाते ही पूरे 100+ स्कूलों का वित्तीय व तकनीकी रिकॉर्ड एक्सेल शीट में डाउनलोड होता है।\n"
        "• प्रोफेशनल फॉर्मेटिंग: रॉयल पर्पल हेडर, करंसी फॉर्मेट (₹), बॉर्डर, और ऑटोमैटिक कॉलम चौड़ाई के साथ तैयार।\n"
        "• ऑफलाइन प्रिंट व ऑडिट: सीए, अकाउंटेंट अथवा व्यावसायिक पार्टनर्स के साथ साझा करने व मुद्रित करने हेतु सर्वोत्तम।"
    )
    rect4 = pymupdf.Rect(45, y, 555, y + 55)
    page.insert_textbox(rect4, s4_text, fontname="Nirmala", fontsize=9, color=(0.15, 0.15, 0.15), lineheight=1.3)
    y += 65

    # Footer note
    page.draw_rect(pymupdf.Rect(36, 775, 559, 815), color=None, fill=(0.96, 0.96, 0.96))
    page.draw_rect(pymupdf.Rect(36, 775, 559, 815), color=(0.8, 0.8, 0.8), width=0.5)
    page.insert_text((45, 792), "📞 वेंडर मास्टर हेल्पलाइन: +91 8504985149 / 8303324088  |  मुख्य डेवलपर: Hanu Ganeshan", fontname="NirmalaB", fontsize=9.5, color=(0.2, 0.2, 0.2))
    page.insert_text((45, 807), "APNA SOFTWARE HUB — AI & Technology Division • Confidential Master Platform • 2026", fontname="Nirmala", fontsize=8.5, color=(0.4, 0.4, 0.4))


def update_pdf_chapters(pdf_path):
    if not os.path.exists(pdf_path):
        print(f"Skipping {pdf_path}: File not found")
        return
    doc = pymupdf.open(pdf_path)

    # Check if Chapter 6 or 7 already added
    has_ch6 = False
    has_ch7 = False
    for p in doc:
        txt = p.get_text()
        if "अध्याय 6: 1-क्लिक भाषा परिवर्तन" in txt:
            has_ch6 = True
        if "अध्याय 7: वेंडर क्लाइंट पोर्टफोलियो" in txt:
            has_ch7 = True

    if not has_ch6:
        add_chapter_6(doc)
        print(f"Added Chapter 6 to {pdf_path}")
    if not has_ch7:
        add_chapter_7(doc)
        print(f"Added Chapter 7 to {pdf_path}")

    if not has_ch6 or not has_ch7:
        doc.save(pdf_path + ".tmp")
        doc.close()
        os.replace(pdf_path + ".tmp", pdf_path)
        print(f"✅ Successfully updated manual: {pdf_path}")
    else:
        doc.close()
        print(f"Already updated: {pdf_path}")


targets = [
    "D:/School_Lakshya/app/src/ui/public/STAFF_TRAINING_MANUAL.pdf",
    "D:/School_Lakshya/01_CLIENT_DEPLOYMENT_PACKAGE/02_Official_Manuals/STAFF_TRAINING_MANUAL.pdf",
    "D:/School_Lakshya/app/src/ui/public/USER_OPERATING_MANUAL.pdf",
    "D:/School_Lakshya/01_CLIENT_DEPLOYMENT_PACKAGE/02_Official_Manuals/USER_OPERATING_MANUAL.pdf"
]

for t in targets:
    update_pdf_chapters(t)
