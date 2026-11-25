import os
import pymupdf

FONT_PATH = "C:/Windows/Fonts/Nirmala.ttf"
FONT_BOLD_PATH = "C:/Windows/Fonts/NirmalaB.ttf"
if not os.path.exists(FONT_BOLD_PATH):
    FONT_BOLD_PATH = FONT_PATH

OUTPUT_PDF = "01_CLIENT_DEPLOYMENT_PACKAGE/02_Official_Manuals/2_MINUTE_EXECUTIVE_SALES_FLASHCARD.pdf"
PUBLIC_PDF = "app/src/ui/public/2_MINUTE_EXECUTIVE_SALES_FLASHCARD.pdf"

def generate_bilingual_table_flashcard():
    doc = pymupdf.open()
    page = doc.new_page(width=595.27, height=841.89) # A4
    page.insert_font(fontname="Nirmala", fontfile=FONT_PATH)
    page.insert_font(fontname="NirmalaB", fontfile=FONT_BOLD_PATH)

    # 1. Top Header Banner (Midnight Navy #0f172a with Amber Gold Accents)
    page.draw_rect(pymupdf.Rect(0, 0, 595.27, 66), color=None, fill=(0.06, 0.09, 0.16))
    page.insert_text((26, 23), "APNA SCHOOL OS — ⚡ 2-MINUTE EXECUTIVE FEATURE SCORECARD", fontname="NirmalaB", fontsize=12.2, color=(0.98, 0.8, 0.08)) # Gold
    page.insert_text((26, 40), "द्विभाषी एग्जीक्यूटिव फ़ीचर्स कार्ड • Bilingual Edition for CBSE, ICSE, Convent & State Board Schools", fontname="NirmalaB", fontsize=9.5, color=(1, 1, 1))
    page.insert_text((26, 56), "Apna Software Hub • 100% Offline-First Architecture • Tech Helpline: 8504985149 / 8303324088", fontname="Nirmala", fontsize=8.2, color=(0.75, 0.88, 1))

    # 2. Executive Pitch Box (Bilingual)
    page.draw_rect(pymupdf.Rect(24, 72, 571, 114), color=(0.14, 0.44, 0.65), fill=(0.94, 0.97, 1.0), width=0.8)
    page.insert_text((32, 85), "🎯 Executive Pitch for School Directors & Principals (डायरेक्टर व प्रिंसिपल हेतु 30-सेकंड सारांश):", fontname="NirmalaB", fontsize=9.0, color=(0.08, 0.35, 0.55))
    pitch_en = "“Apna School OS is an enterprise Offline-First School ERP with ZERO monthly cloud bills and NO internet dependency. One host PC on campus Wi-Fi enables 20+ teachers & clerks to mark attendance and manage fees concurrently on phones & PCs, with 1-second self-healing data recovery.”"
    pitch_hi = "“सर, हमारा सॉफ़्टवेयर 100% ऑफ़लाइन है—न इंटरनेट चाहिए, न सर्वर का मासिक बिल। 1 पीसी से स्कूल के वाई-फ़ाई पर 20 शिक्षक अपने मोबाइल से हाजिरी लगाएंगे। डेटा 100% स्कूल में सुरक्षित रहेगा और डिलीट होने पर भी 1 सेकंड में स्वतः रीस्टोर हो जाएगा!”"
    page.insert_text((32, 98), pitch_en[:135], fontname="Nirmala", fontsize=7.6, color=(0.1, 0.2, 0.3))
    page.insert_text((32, 108), pitch_en[135:], fontname="Nirmala", fontsize=7.6, color=(0.1, 0.2, 0.3))

    # 3. Table Header
    y_tbl = 118
    x_start = 24
    col1_w = 175  # Feature Name (Bilingual)
    col2_w = 95   # Status
    col3_w = 277  # Magic 1-Liner Impact (Bilingual)
    tbl_w = col1_w + col2_w + col3_w # 547
    x_end = x_start + tbl_w

    # Header Row Background (Deep Navy)
    page.draw_rect(pymupdf.Rect(x_start, y_tbl, x_end, y_tbl + 20), color=None, fill=(0.12, 0.18, 0.28))
    page.insert_text((x_start + 8, y_tbl + 14), "विशेष फ़ीचर / Feature Name", fontname="NirmalaB", fontsize=8.6, color=(1, 1, 1))
    page.insert_text((x_start + col1_w + 10, y_tbl + 14), "Status (स्थिति)", fontname="NirmalaB", fontsize=8.6, color=(1, 1, 1))
    page.insert_text((x_start + col1_w + col2_w + 10, y_tbl + 14), "Bilingual Magic Impact & Benefit (जादुई प्रभाव)", fontname="NirmalaB", fontsize=8.6, color=(1, 1, 1))

    # 4. Table Rows (14 Core Bilingual Features)
    features_data = [
        ("Multi-User Campus Wi-Fi",
         "मल्टी-यूज़र वाई-फ़ाई शेयरिंग",
         "✅ 100% Active",
         "Zero internet needed. 1 host PC shares server over school Wi-Fi; 20+ teachers & staff connect on phones/laptops simultaneously. (बिना इंटरनेट 20+ डिवाइस)।"),

        ("Teacher Mobile Attendance",
         "टीचर्स मोबाइल हाजिरी पोर्टल",
         "✅ 100% Active",
         "Teachers mark attendance directly on their mobile phones. Sensitive fees, cash registers & salaries are automatically locked from teachers. (सुरक्षित शिक्षक पोर्टल)।"),

        ("Universal Printer & Receipts",
         "यूनिवर्सल प्रिंटर व 1-क्लिक रसीद",
         "✅ 100% Active",
         "Auto-detects any HP, Canon, Epson or Thermal POS printer. 1-click Windows native print dialog, Save as PDF, and WhatsApp dispatch. (1-क्लिक ऑटो प्रिंटर)।"),

        ("Direct Parent WhatsApp",
         "पेरेंट्स 1-क्लिक व्हाट्सएप रसीद",
         "✅ 100% Active",
         "Fee receipts, pending fee reminders, and attendance notifications are delivered directly to parent's WhatsApp with zero SMS gateway costs. (मुफ़्त व्हाट्सएप रसीद)।"),

        ("Apna Software Hub Shield",
         "सेल्फ-हीलिंग डेटा शील्ड (ISO 27001)",
         "✅ 100% Active",
         "Zero data-loss guarantee. Protected by ISO 27001 aligned shield. If operator deletes database or D: drive, auto-heals in 1 second. (1 सेकंड में स्वतः रीस्टोर)।"),

        ("1-Click Native Bilingual UI",
         "1-क्लिक द्विभाषी इंजन (हिन्दी ⇄ EN)",
         "✅ 100% Active",
         "Instant top-bar toggle between authentic हिन्दी and English with 0.00s lag across 22+ modules. Rural staff use Hindi; CBSE staff use English. (शून्य लैग)।"),

        ("Hardware RTC Clock & Date",
         "लाइव हार्डवेयर क्लॉक व तारीख",
         "✅ 100% Active",
         "Motherboard RTC chip keeps live ticking clock, accurate date & dynamic Good Morning/Afternoon greeting 100% offline without internet. (लाइव ऑफलाइन समय)।"),

        ("Director's Pocket USB Vault",
         "डायरेक्टर पेनड्राइव बैकअप",
         "✅ 100% Active",
         "1-Click offline backup to Director's USB flash drive. Director safely carries 100% of the school's data home in their pocket every evening. (जेब में सुरक्षित बैकअप)।"),

        ("EOD Daily Closing Audit",
         "दैनिक जीमेल ऑडिट रिपोर्ट",
         "✅ 100% Active",
         "At day end, a complete financial and attendance audit (total fee collections, daily expenses, cash balance) is dispatched to Director's Gmail in 1 click. (EOD ऑडिट)।"),

        ("4-Pillar Marksheets & AI",
         "4-स्तंभीय मार्कशीट व AI पेपर",
         "✅ 100% Active",
         "CBSE/ICSE/State Board holistic report cards with psychomotor & co-scholastic grading; generate multi-section exam papers with answer keys in 2s. (AI प्रश्न-पत्र)।"),

        ("Vendor Client Master CRM",
         "वेंडर क्लाइंट पोर्टफोलियो एवं CRM",
         "✅ 100% Active",
         "Super Admin master command to manage 100+ client schools, track deal values, license validity, outstanding dues & WhatsApp reminders. (100+ स्कूल प्रबंधन)।"),

        ("Machine HWID Lock License",
         "मशीन लॉक व 30-दिन VIP ट्रायल",
         "✅ 100% Active",
         "Tamper-proof machine hardware lock with 30-day free VIP trial and SHA-256 cryptographic annual & lifetime activation keys. (हार्डवेयर-लॉक्ड सुरक्षा)।"),

        ("Master Emergency Recovery",
         "मास्टर आपातकालीन रिकवरी",
         "✅ 100% Active",
         "Permanent vendor master key (APNA-ADMIN-RECOVERY) and official phone helpline for instant emergency password reset if credentials are lost. (आपातकालीन वेंडर रिकवरी)।"),

        ("Zero-Lag Speed & Hotkeys",
         "शून्य-लैग स्पीड व हॉटकीज़",
         "✅ 100% Active",
         "F2 for instant New Admission, Ctrl+1 to 9 for lightning-fast tab navigation. Zero cloud spinning wheels, sub-50ms instant desktop response time. (बिजली सी तेज़ स्पीड)।")
    ]

    curr_y = y_tbl + 20
    row_h = 36.5

    for idx, (en_name, hi_name, fstatus, fdesc) in enumerate(features_data):
        bg_col = (0.97, 0.98, 1.0) if idx % 2 == 0 else (1.0, 1.0, 1.0)
        page.draw_rect(pymupdf.Rect(x_start, curr_y, x_end, curr_y + row_h), color=(0.88, 0.91, 0.94), fill=bg_col, width=0.5)

        # Col 1: Bilingual Feature Name
        page.insert_text((x_start + 6, curr_y + 13), en_name, fontname="NirmalaB", fontsize=8.4, color=(0.05, 0.35, 0.65))
        page.insert_text((x_start + 6, curr_y + 25), hi_name, fontname="Nirmala", fontsize=7.4, color=(0.35, 0.45, 0.55))

        # Col 2: Status Badge (Green Pill Box)
        page.draw_rect(pymupdf.Rect(x_start + col1_w + 6, curr_y + 6, x_start + col1_w + col2_w - 6, curr_y + 24), color=None, fill=(0.86, 0.97, 0.88))
        page.insert_text((x_start + col1_w + 12, curr_y + 18), fstatus, fontname="NirmalaB", fontsize=8.0, color=(0.05, 0.55, 0.25))

        # Col 3: Bilingual Description
        l1 = fdesc[:72]
        l2 = fdesc[72:144]
        l3 = fdesc[144:]
        page.insert_text((x_start + col1_w + col2_w + 8, curr_y + 12), l1, fontname="Nirmala", fontsize=7.4, color=(0.15, 0.2, 0.28))
        if l2:
            page.insert_text((x_start + col1_w + col2_w + 8, curr_y + 22), l2, fontname="Nirmala", fontsize=7.4, color=(0.15, 0.2, 0.28))
        if l3:
            page.insert_text((x_start + col1_w + col2_w + 8, curr_y + 32), l3, fontname="Nirmala", fontsize=7.4, color=(0.15, 0.2, 0.28))

        curr_y += row_h

    # 5. Quick Comparison Bar (Below Table)
    y_comp = curr_y + 6
    page.draw_rect(pymupdf.Rect(x_start, y_comp, x_end, y_comp + 48), color=(0.8, 0.86, 0.92), fill=(0.94, 0.96, 0.98), width=0.8)
    page.insert_text((34, y_comp + 14), "⚖️ Executive Comparison: Outdated Cloud ERP  vs  Apna School OS", fontname="NirmalaB", fontsize=8.6, color=(0.15, 0.25, 0.4))
    page.insert_text((34, y_comp + 27), "• Traditional Cloud ERPs: Internet outage halts school | ₹5,000-₹15,000 recurring monthly bills | Data on third-party cloud", fontname="Nirmala", fontsize=7.5, color=(0.7, 0.15, 0.15))
    page.insert_text((34, y_comp + 40), "• Apna School OS: 100% Offline-First (No Internet) | ZERO Monthly Bills (One-Time) | 100% Data on School's Own PC & Pendrive", fontname="NirmalaB", fontsize=7.9, color=(0.05, 0.52, 0.25))

    # 6. Bottom Footer & Direct Helpline
    y_ft = y_comp + 54
    page.draw_rect(pymupdf.Rect(x_start, y_ft, x_end, y_ft + 52), color=None, fill=(0.06, 0.09, 0.16))
    page.insert_text((34, y_ft + 16), "Apna Software Hub • Developer & Technology Partner: Krishna ji (कृष्णा जी) | Commercial Desktop Solution", fontname="NirmalaB", fontsize=9.0, color=(0.98, 0.8, 0.08))
    page.insert_text((34, y_ft + 30), "📞 Official Tech Helpline / WhatsApp: 8504985149 / 8303324088  |  Support Email: krishnaskb143@gmail.com", fontname="NirmalaB", fontsize=8.6, color=(1, 1, 1))
    page.insert_text((34, y_ft + 44), "🎁 30-Day Complimentary VIP Trial Available • Contact now to schedule a 1-click live on-campus interactive demo!", fontname="Nirmala", fontsize=8.0, color=(0.8, 0.95, 0.85))

    doc.save(OUTPUT_PDF)
    doc.save(PUBLIC_PDF)
    print(f"✅ Generated Bilingual Table Flashcard PDF successfully at:\n  - {OUTPUT_PDF}\n  - {PUBLIC_PDF}")

if __name__ == "__main__":
    generate_bilingual_table_flashcard()
