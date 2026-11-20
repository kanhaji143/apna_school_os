#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
======================================================================
  APNA SOFTWARE HUB — OFFLINE MASTER LICENSE KEY GENERATOR
  Authorized Platform Owner: Hanu Ganeshan
  Helpline: 8504985149 / 8303324088
======================================================================
"""

import sys
import hashlib

SALT = "APNA_SOFTWARE_HUB_8504985149"

def generate_key(installation_id, validity_days=365):
    clean_id = installation_id.strip().upper()
    raw = f"{clean_id}_{validity_days}_{SALT}"
    h = hashlib.sha256(raw.encode('utf-8')).hexdigest().upper()
    return f"ASH-{h[:4]}-{h[4:8]}-{h[8:12]}"

def main():
    print("=" * 68)
    print("  🔑 APNA SOFTWARE HUB — MASTER LICENSE KEY GENERATOR")
    print("  Official Vendor Remote Control & Renewal System")
    print("  Platform Owner: Hanu Ganeshan | Helpline: 8504985149")
    print("=" * 68)
    print()

    if len(sys.argv) > 1:
        install_id = sys.argv[1]
    else:
        install_id = input("👉 स्कूल कंप्यूटर की Installation ID दर्ज करें (e.g. ASH-9213): ").strip()

    if not install_id:
        print("❌ त्रुटि: मान्य Installation ID दर्ज करना अनिवार्य है!")
        return

    print()
    print("वैधता अवधि चुनें (Select License Duration):")
    print("  [1] 1 वर्ष (365 दिन) — वार्षिक रिन्यूअल लाइसेंस (अनुशंसित)")
    print("  [2] 2 वर्ष (730 दिन)")
    print("  [3] 3 वर्ष (1095 दिन)")
    print("  [4] आजीवन / 10 वर्ष (3650 दिन)")
    print("  [5] 30 दिन एक्सटेंशन (30 दिन अतिरिक्त)")
    print()

    choice = input("विकल्प चुनें [1-5, डिफ़ॉल्ट 1]: ").strip()
    duration_map = {
        '1': (365, "1 वर्ष (365 दिन)"),
        '2': (730, "2 वर्ष (730 दिन)"),
        '3': (1095, "3 वर्ष (1095 दिन)"),
        '4': (3650, "आजीवन / 10 वर्ष"),
        '5': (30, "30 दिन एक्सटेंशन")
    }

    days, label = duration_map.get(choice, (365, "1 वर्ष (365 दिन)"))
    key = generate_key(install_id, days)

    print()
    print("=" * 68)
    print("  ✅ जनरेट की गई आधिकारिक मास्टर लाइसेंस की:")
    print("  " + "-" * 50)
    print(f"  🔑 {key}")
    print("  " + "-" * 50)
    print(f"  🏢 स्कूल Installation ID: {install_id.upper()}")
    print(f"  ⏳ लाइसेंस वैधता: {label}")
    print(f"  ⚡ यूनिवर्सल वेंडर मास्टर बाईपास: APNA8504985149")
    print("=" * 68)
    print()
    print("👉 यह की (Key) कॉपी करके स्कूल डायरेक्टर/क्लर्क को WhatsApp पर भेज दीजिए।")
    print("   वे सॉफ़्टवेयर में 'लाइसेंस की दर्ज करें' बॉक्स में पेस्ट करके तुरंत अनलॉक कर लेंगे।")
    print()

if __name__ == '__main__':
    main()
