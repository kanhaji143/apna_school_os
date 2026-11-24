import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

PPTX_PATH = "01_CLIENT_DEPLOYMENT_PACKAGE/03_Presentations_and_Templates/Apna_School_OS_Client_Pitch_Deck.pptx"

def add_slide_14():
    prs = Presentation(PPTX_PATH)
    blank_layout = prs.slide_layouts[6] # blank layout

    slide = prs.slides.add_slide(blank_layout)

    # Header banner (Royal Navy Blue / Gold Accent)
    header_box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(10), Inches(1.15))
    header_box.fill.solid()
    header_box.fill.fore_color.rgb = RGBColor(15, 23, 42) # #0f172a (Deep Slate / Dark Navy)
    header_box.line.color.rgb = RGBColor(15, 23, 42)

    tf = header_box.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "⚡ The 2-Minute Magic Pitch: 10 Super-Powers of Apna School OS"
    p1.font.size = Pt(21)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(250, 204, 21) # Amber Gold #facc15

    p2 = tf.add_paragraph()
    p2.text = "Why Directors Choose Us: 100% Offline • Zero Monthly Cloud Bills • Self-Healing Vault • 1-Click WhatsApp & Multi-Station Wi-Fi"
    p2.font.size = Pt(10.5)
    p2.font.color.rgb = RGBColor(226, 232, 240)

    # Left Column: 5 Architecture & Security Super-Powers
    c1 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(1.35), Inches(4.35), Inches(5.8))
    c1.fill.solid()
    c1.fill.fore_color.rgb = RGBColor(248, 250, 252)
    c1.line.color.rgb = RGBColor(2, 132, 199) # Sky Blue Border

    tf1 = c1.text_frame
    tf1.word_wrap = True
    p_h1 = tf1.paragraphs[0]
    p_h1.text = "🛡️ 5 Core Security & Architecture Powers"
    p_h1.font.size = Pt(13)
    p_h1.font.bold = True
    p_h1.font.color.rgb = RGBColor(3, 105, 161)

    bullets1 = [
        ("1. 100% Offline + Campus Wi-Fi Sharing", "Runs entirely without internet. 1 main PC hosts the server; 20+ teachers & staff connect on their own phones, tablets & laptops via campus Wi-Fi simultaneously."),
        ("2. Self-Healing Shadow Vault", "If an operator deletes D:\\ or database file, the hidden vault automatically restores 100% records in 1 second on next launch with zero data loss."),
        ("3. Teacher Mobile Attendance Portal", "Teachers log in on their mobile phones to mark daily student attendance. Financial registers, fee records & salary data are automatically locked from teachers."),
        ("4. Director's Pocket Vault (USB Backup)", "1-Click instant copy to Director's USB pendrive. Director takes the entire school's data safely home in their pocket every evening."),
        ("5. EOD Gmail Daily Audit Dispatch", "At school closing, a complete financial summary (fees collected, expenses, student attendance) is sent to the Director's Gmail in 1 click.")
    ]

    for title, desc in bullets1:
        p_t = tf1.add_paragraph()
        p_t.text = f"• {title}"
        p_t.font.size = Pt(10.5)
        p_t.font.bold = True
        p_t.font.color.rgb = RGBColor(15, 23, 42)

        p_d = tf1.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(9.0)
        p_d.font.color.rgb = RGBColor(71, 85, 105)

    # Right Column: 5 Daily Operations & Parent Delight Super-Powers
    c2 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.15), Inches(1.35), Inches(4.35), Inches(5.8))
    c2.fill.solid()
    c2.fill.fore_color.rgb = RGBColor(248, 250, 252)
    c2.line.color.rgb = RGBColor(16, 185, 129) # Emerald Green Border

    tf2 = c2.text_frame
    tf2.word_wrap = True
    p_h2 = tf2.paragraphs[0]
    p_h2.text = "🚀 5 Operations & Parent Delight Powers"
    p_h2.font.size = Pt(13)
    p_h2.font.bold = True
    p_h2.font.color.rgb = RGBColor(4, 120, 87)

    bullets2 = [
        ("6. 1-Click WhatsApp Receipts & Reminders", "Fee receipts, fee reminder notices, and student progress reports are dispatched directly to parent's WhatsApp with 1 tap via wa.me."),
        ("7. 1-Click Bilingual Engine (हिन्दी ⇄ EN)", "Instant language switch across 22+ modules. Rural staff work comfortably in pure Hindi while urban branches switch to English with zero page reload."),
        ("8. 4-Pillar Marksheets & AI Question Papers", "Print CBSE/ICSE/State Board compliant holistic report cards and generate custom multi-section exam papers with answer keys in 2 seconds."),
        ("9. Zero-Lag Desktop Speed & Global Hotkeys", "F2 for instant New Admission, Ctrl+1 to 9 for lightning-fast tab navigation. No spinning browser wheels, no slow page loads, 0.05s response time."),
        ("10. Centralized Vendor Portfolio & Support", "Vendor Master CRM tracks all school sales, license keys, due payments, and phone helpline support (8504985149) with 24/7 peace of mind.")
    ]

    for title, desc in bullets2:
        p_t = tf2.add_paragraph()
        p_t.text = f"• {title}"
        p_t.font.size = Pt(10.5)
        p_t.font.bold = True
        p_t.font.color.rgb = RGBColor(15, 23, 42)

        p_d = tf2.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(9.0)
        p_d.font.color.rgb = RGBColor(71, 85, 105)

    prs.save(PPTX_PATH)
    print(f"✅ Slide 14 successfully added to {PPTX_PATH}! Total slides now: {len(prs.slides)}")

if __name__ == "__main__":
    add_slide_14()
