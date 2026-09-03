from pathlib import Path
from html.parser import HTMLParser
import sys

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    "index.html", "about.html", "revenue_management.html", "software.html",
    "mews_pms.html", "cloudbeds_pms.html", "siteminder_chm.html", "tips.html",
    "break_even_calculator.html", "hotel_photoshoot_tips.html", "web_design_tips.html",
    "digital_marketing_tips.html", "blog.html", "contact.html", "privacy_policy.html",
    "terms_and_conditions.html"
}

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = []
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if "id" in data:
            self.ids.append(data["id"])
        if tag == "a" and "href" in data:
            self.links.append(data["href"])

errors = []
missing = [name for name in EXPECTED if not (ROOT / name).exists()]
if missing:
    errors.append(f"Missing expected pages: {', '.join(sorted(missing))}")

for path in sorted(ROOT.glob("*.html")):
    parser = Parser()
    parser.feed(path.read_text(encoding="utf-8"))
    duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
    if duplicates:
        errors.append(f"{path.name}: duplicate IDs {duplicates}")
    for href in parser.links:
        local = href.split("#", 1)[0]
        if not local or local.startswith(("http://", "https://", "mailto:", "tel:")):
            continue
        if not (ROOT / local).exists():
            errors.append(f"{path.name}: missing local link target {local}")

for required in ("styles.css", "navigation.js", "calculator.js", "logo/plutus-mark.svg"):
    if not (ROOT / required).exists():
        errors.append(f"Missing required asset: {required}")

if errors:
    print("Plutus redesign validation FAILED")
    for error in errors:
        print("-", error)
    sys.exit(1)

print(f"Plutus redesign validation passed ({len(list(ROOT.glob('*.html')))} HTML pages checked).")
