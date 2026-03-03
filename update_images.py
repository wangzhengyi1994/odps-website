#!/usr/bin/env python3
"""
Batch-update all HTML files in the ODPS website to replace placeholder
images with Unsplash external image URLs, and update CSS accordingly.
"""

import re
import os

BASE = "/Users/dang/Documents/maxclaude/odps-website"

# ── 1. CSS Updates ──────────────────────────────────────────────────────────

css_path = os.path.join(BASE, "css", "style.css")
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Update .feature-img
old_feature = ".feature-img { flex: 1; background: var(--bg-light); border-radius: var(--radius); min-height: 300px; display: flex; align-items: center; justify-content: center; color: var(--text-light); font-size: 14px; }"
new_feature = ".feature-img { flex: 1; background: var(--bg-light); background-size: cover; background-position: center; border-radius: var(--radius); min-height: 300px; display: flex; align-items: center; justify-content: center; color: var(--text-light); font-size: 14px; }"

if old_feature in css:
    css = css.replace(old_feature, new_feature)
    print("[CSS] Updated .feature-img with background-size/position")
else:
    print("[CSS] WARNING: .feature-img rule not found as expected")

# Update .case-thumb
old_case = ".case-thumb { height: 200px; background: linear-gradient(135deg, var(--primary-2), var(--primary-1)); display: flex; align-items: center; justify-content: center; color: var(--text-light); font-size: 14px; }"
new_case = ".case-thumb { height: 200px; background: linear-gradient(135deg, var(--primary-2), var(--primary-1)); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: var(--text-light); font-size: 14px; }"

if old_case in css:
    css = css.replace(old_case, new_case)
    print("[CSS] Updated .case-thumb with background-size/position")
else:
    print("[CSS] WARNING: .case-thumb rule not found as expected")

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)


# ── 2. Helper: replace feature-img placeholders in order ────────────────────

def replace_feature_imgs(html, urls):
    """Replace feature-img divs with placeholder text, assigning URLs in order."""
    count = [0]
    def replacer(m):
        idx = count[0]
        if idx < len(urls):
            url = urls[idx]
            count[0] += 1
            return f'<div class="feature-img" style="background-image:url(\'{url}\')"></div>'
        return m.group(0)
    # Match <div class="feature-img">ANY_TEXT</div>
    pattern = r'<div class="feature-img">[^<]+</div>'
    result = re.sub(pattern, replacer, html)
    return result, count[0]


def replace_case_thumbs(html, urls):
    """Replace case-thumb divs with placeholder text, assigning URLs in order."""
    count = [0]
    def replacer(m):
        idx = count[0]
        if idx < len(urls):
            url = urls[idx]
            count[0] += 1
            return f'<div class="case-thumb" style="background-image:url(\'{url}\')"></div>'
        return m.group(0)
    pattern = r'<div class="case-thumb">[^<]+</div>'
    result = re.sub(pattern, replacer, html)
    return result, count[0]


def process_file(rel_path, feature_urls=None, case_urls=None):
    """Process a single HTML file."""
    full_path = os.path.join(BASE, rel_path)
    if not os.path.exists(full_path):
        print(f"  [ERROR] File not found: {rel_path}")
        return

    with open(full_path, "r", encoding="utf-8") as f:
        html = f.read()

    total_replaced = 0

    if feature_urls:
        html, n = replace_feature_imgs(html, feature_urls)
        total_replaced += n
        if n != len(feature_urls):
            print(f"  [WARN] {rel_path}: expected {len(feature_urls)} feature-img, replaced {n}")

    if case_urls:
        html, n = replace_case_thumbs(html, case_urls)
        total_replaced += n
        if n != len(case_urls):
            print(f"  [WARN] {rel_path}: expected {len(case_urls)} case-thumb, replaced {n}")

    with open(full_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"  [OK] {rel_path}: {total_replaced} replacements")


# ── 3. Define all mappings ──────────────────────────────────────────────────

print("\n=== Processing HTML files ===\n")

# about.html
process_file("pages/about.html", feature_urls=[
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
])

# service.html
process_file("pages/service.html", feature_urls=[
    "https://images.unsplash.com/photo-1581092160607-ee67df30e7f2?w=800&h=600&fit=crop",
])

# cases.html - 17 case-thumb divs
process_file("pages/cases.html", case_urls=[
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1473445215827-8fface68568b?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1610586618549-a05378824c91?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1582560475093-ba66accbc953?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1504502350688-00f5d59bbdeb?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1628155849837-648cf206ec31?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1615797534094-7fde0a4861f3?w=800&h=600&fit=crop",
])

# ── Product pages ──

process_file("pages/products/drones.html", feature_urls=[
    "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&h=600&fit=crop",
])

process_file("pages/products/payloads.html", feature_urls=[
    "https://images.unsplash.com/photo-1566145756403-c29f4aa3ce30?w=800&h=600&fit=crop",
])

process_file("pages/products/dock.html", feature_urls=[
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
])

process_file("pages/products/software.html", feature_urls=[
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
])

process_file("pages/products/training.html", feature_urls=[
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop",
])

# ── Solution pages ──

process_file("pages/solutions/public-safety.html",
    feature_urls=[
        "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1504502350688-00f5d59bbdeb?w=800&h=600&fit=crop",
    ],
    case_urls=[
        "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1504502350688-00f5d59bbdeb?w=800&h=600&fit=crop",
    ],
)

process_file("pages/solutions/traffic.html", feature_urls=[
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&h=600&fit=crop",
])

process_file("pages/solutions/emergency.html",
    feature_urls=[
        "https://images.unsplash.com/photo-1610586618549-a05378824c91?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1582560475093-ba66accbc953?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1504502350688-00f5d59bbdeb?w=800&h=600&fit=crop",
    ],
    case_urls=[
        "https://images.unsplash.com/photo-1610586618549-a05378824c91?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1582560475093-ba66accbc953?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1504502350688-00f5d59bbdeb?w=800&h=600&fit=crop",
    ],
)

process_file("pages/solutions/city.html", feature_urls=[
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=600&fit=crop",
])

process_file("pages/solutions/energy.html", feature_urls=[
    "https://images.unsplash.com/photo-1615797534094-7fde0a4861f3?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=800&h=600&fit=crop",
])

process_file("pages/solutions/surveying.html", feature_urls=[
    "https://images.unsplash.com/photo-1628155849837-648cf206ec31?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop",
])

process_file("pages/solutions/water.html", feature_urls=[
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop",
])

process_file("pages/solutions/agriculture.html", feature_urls=[
    "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&h=600&fit=crop",
])

# ── 4. Verification ────────────────────────────────────────────────────────

print("\n=== Verification ===\n")

# Count remaining placeholders
remaining_feature = 0
remaining_case = 0
for root, dirs, files in os.walk(BASE):
    for fname in files:
        if not fname.endswith(".html"):
            continue
        fpath = os.path.join(root, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        feat = len(re.findall(r'<div class="feature-img">[^<]+</div>', content))
        case = len(re.findall(r'<div class="case-thumb">[^<]+</div>', content))
        if feat or case:
            print(f"  [REMAINING] {os.path.relpath(fpath, BASE)}: {feat} feature-img, {case} case-thumb still with text")
        remaining_feature += feat
        remaining_case += case

if remaining_feature == 0 and remaining_case == 0:
    print("  All placeholders have been replaced successfully!")
else:
    print(f"\n  Total remaining: {remaining_feature} feature-img, {remaining_case} case-thumb")

# Count how many now have background-image
total_bg_feature = 0
total_bg_case = 0
for root, dirs, files in os.walk(BASE):
    for fname in files:
        if not fname.endswith(".html"):
            continue
        fpath = os.path.join(root, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        total_bg_feature += len(re.findall(r'<div class="feature-img" style="background-image:url\(', content))
        total_bg_case += len(re.findall(r'<div class="case-thumb" style="background-image:url\(', content))

print(f"\n  Total feature-img with background-image: {total_bg_feature}")
print(f"  Total case-thumb with background-image: {total_bg_case}")
print(f"  Grand total replacements: {total_bg_feature + total_bg_case}")

print("\nDone!")
