#!/usr/bin/env python3
"""Static validation for the Plutus GitHub Pages website."""

from __future__ import annotations

import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]

EXPECTED_HTML = {
    "404.html",
    "about.html",
    "admin.html",
    "blog.html",
    "cloudbeds_pms.html",
    "contact.html",
    "digital_marketing_tips.html",
    "hotel-break-even-calculator.html",
    "hotel_photoshoot_tips.html",
    "index.html",
    "mews_pms.html",
    "privacy_policy.html",
    "revenue_management.html",
    "siteminder_chm.html",
    "software.html",
    "terms_and_conditions.html",
    "tips.html",
    "web_design_tips.html",
}

REPOSITORY_ASSETS = {
    "logo/logo.png",
    "index/heroback.webp",
    "index/heromobileback.webp",
    "index/marketback.webp",
    "index/orv.webp",
    "index/si.webp",
    "index/tai.webp",
    "about/about_background.jpg",
    "about/profile_photo.png",
    "orm/orm.jpg",
    "orm/work with plutus.jpg",
    "softwareinformation/background.jpg",
    "softwareinformation/cloudbeds logo.jpg",
    "softwareinformation/mews logo.png",
    "softwareinformation/siteminder logo.png",
}

SKIP_SCHEMES = {"http", "https", "mailto", "tel", "javascript", "data"}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_depth = 0
        self.title_text: list[str] = []
        self.meta_description = ""
        self.canonical = ""
        self.h1_count = 0
        self.ids: list[str] = []
        self.hrefs: list[str] = []
        self.sources: list[str] = []
        self.stylesheets: list[str] = []
        self.has_header_target = False
        self.has_footer_target = False
        self.has_main_content = False
        self.has_body_page = False
        self.images_without_alt = 0
        self.blank_links_without_rel = 0

    def handle_starttag(self, tag: str, attrs_list: list[tuple[str, str | None]]) -> None:
        attrs = {key: value or "" for key, value in attrs_list}
        if tag == "title":
            self.title_depth += 1
        elif tag == "meta" and attrs.get("name", "").lower() == "description":
            self.meta_description = attrs.get("content", "").strip()
        elif tag == "link" and attrs.get("rel", "").lower() == "canonical":
            self.canonical = attrs.get("href", "").strip()
        elif tag == "link" and "stylesheet" in attrs.get("rel", "").lower():
            self.stylesheets.append(attrs.get("href", ""))
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "body":
            self.has_body_page = bool(attrs.get("data-page"))
        elif tag == "main" and attrs.get("id") == "main-content":
            self.has_main_content = True
        elif tag == "img" and "alt" not in attrs:
            self.images_without_alt += 1

        if "id" in attrs:
            self.ids.append(attrs["id"])
        if "href" in attrs:
            self.hrefs.append(attrs["href"])
        if "src" in attrs:
            self.sources.append(attrs["src"])
        if "data-site-header" in attrs:
            self.has_header_target = True
        if "data-site-footer" in attrs:
            self.has_footer_target = True
        if tag == "a" and attrs.get("target") == "_blank":
            rel = set(attrs.get("rel", "").lower().split())
            if not {"noopener", "noreferrer"}.intersection(rel):
                self.blank_links_without_rel += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == "title" and self.title_depth:
            self.title_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.title_depth:
            self.title_text.append(data)

    @property
    def title(self) -> str:
        return "".join(self.title_text).strip()


def local_path(reference: str) -> str | None:
    reference = reference.strip()
    if not reference or reference.startswith("#"):
        return None
    parsed = urlsplit(reference)
    if parsed.scheme.lower() in SKIP_SCHEMES or parsed.netloc:
        return None
    return parsed.path.lstrip("/")


def validate() -> list[str]:
    problems: list[str] = []
    html_files = {path.name for path in ROOT.glob("*.html")}
    missing_pages = sorted(EXPECTED_HTML - html_files)
    if missing_pages:
        problems.append(f"Missing expected HTML pages: {', '.join(missing_pages)}")

    for required in ("styles.css", "plutus-v2.css", "plutus-v3.css", "navigation.js", "calculator.js", "robots.txt", "sitemap.xml"):
        if not (ROOT / required).is_file():
            problems.append(f"Missing required file: {required}")

    for page_name in sorted(html_files):
        page = ROOT / page_name
        parser = PageParser()
        try:
            parser.feed(page.read_text(encoding="utf-8"))
        except Exception as exc:
            problems.append(f"{page_name}: could not parse HTML ({exc})")
            continue

        if not parser.title:
            problems.append(f"{page_name}: missing <title>")
        if not parser.meta_description:
            problems.append(f"{page_name}: missing meta description")
        if page_name != "404.html" and not parser.canonical:
            problems.append(f"{page_name}: missing canonical URL")
        if parser.h1_count != 1:
            problems.append(f"{page_name}: expected one H1, found {parser.h1_count}")
        if not parser.has_body_page:
            problems.append(f"{page_name}: body is missing data-page")
        if not parser.has_main_content:
            problems.append(f"{page_name}: missing main#main-content")
        if not parser.has_header_target or not parser.has_footer_target:
            problems.append(f"{page_name}: missing shared header or footer target")
        if parser.images_without_alt:
            problems.append(f"{page_name}: {parser.images_without_alt} image(s) missing alt text")
        if parser.blank_links_without_rel:
            problems.append(f"{page_name}: target=_blank link missing noopener/noreferrer")

        duplicate_ids = sorted(name for name, count in Counter(parser.ids).items() if count > 1)
        if duplicate_ids:
            problems.append(f"{page_name}: duplicate id(s): {', '.join(duplicate_ids)}")

        for href in parser.hrefs:
            if href.strip() == "#":
                problems.append(f"{page_name}: contains an empty href='#'")
                continue
            path = local_path(href)
            if path and not ((ROOT / path).exists() or path in REPOSITORY_ASSETS):
                problems.append(f"{page_name}: broken local link '{href}'")

        for src in parser.sources:
            path = local_path(src)
            if path and not ((ROOT / path).exists() or path in REPOSITORY_ASSETS):
                problems.append(f"{page_name}: missing local source '{src}'")

        for href in parser.stylesheets:
            path = local_path(href)
            if path and not ((ROOT / path).exists() or path in REPOSITORY_ASSETS):
                problems.append(f"{page_name}: missing stylesheet '{href}'")

    for css_name in ("styles.css", "plutus-v2.css", "plutus-v3.css"):
        css_path = ROOT / css_name
        if css_path.is_file():
            css = css_path.read_text(encoding="utf-8")
            if css.count("{") != css.count("}"):
                problems.append(f"{css_name}: unbalanced braces")
            for match in re.finditer(r"url\(\s*['\"]?([^)'\"]+)", css):
                reference = match.group(1).strip()
                if reference.startswith("#"):
                    continue
                path = local_path(reference)
                if path and not ((ROOT / path).exists() or path in REPOSITORY_ASSETS):
                    problems.append(f"{css_name}: missing local asset '{reference}'")

    calculator_path = ROOT / "hotel-break-even-calculator.html"
    if calculator_path.is_file():
        calculator_html = calculator_path.read_text(encoding="utf-8")
        required_ids = {
            "breakEvenForm", "breakEvenChart", "currency", "rooms", "days", "adr",
            "variableCost", "fixedCost", "currentOccupancy", "targetProfit",
            "ancillaryRevenue", "otaShare", "otaCommission", "paymentFee"
        }
        for required_id in sorted(required_ids):
            if f'id="{required_id}"' not in calculator_html:
                problems.append(f"hotel-break-even-calculator.html: missing #{required_id}")
        if 'src="calculator.js' not in calculator_html:
            problems.append("hotel-break-even-calculator.html: calculator.js is not loaded")

    navigation = ROOT / "navigation.js"
    if navigation.is_file():
        navigation_text = navigation.read_text(encoding="utf-8")
        for destination in (
            "index.html", "about.html", "revenue_management.html", "software.html", "tips.html",
            "hotel-break-even-calculator.html", "blog.html", "contact.html"
        ):
            if destination not in navigation_text:
                problems.append(f"navigation.js: missing shared navigation destination '{destination}'")

    return problems


def main() -> int:
    problems = validate()
    if problems:
        print("Site validation failed:", file=sys.stderr)
        for problem in problems:
            print(f" - {problem}", file=sys.stderr)
        return 1
    print("Site validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
