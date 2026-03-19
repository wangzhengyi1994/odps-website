#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""更新8个解决方案页面的 feature-img 和 case-thumb 图片路径"""

import re

BASE = "/Users/dang/Documents/maxclaude/odps-website/pages/solutions"
IMG_PREFIX = "../../images/ai-generated"

# 每个页面的图片替换映射
# 格式: 文件名 → [(feature-img 1-5), (case-thumb 1-3)]
PAGES = {
    "public-safety.html": {
        "features": [
            "public-safety-feature-1.jpg",
            "public-safety-feature-2.jpg",
            "public-safety-feature-3.jpg",
            "public-safety-feature-4.jpg",
            "public-safety-feature-5.jpg",
        ],
        "cases": [
            "public-safety-case-1.jpg",
            "public-safety-case-2.jpg",
            "public-safety-case-3.jpg",
        ],
    },
    "traffic.html": {
        "features": [
            "traffic-feature-1.jpg",
            "traffic-feature-2.jpg",
            "traffic-feature-3.jpg",
            "traffic-feature-4.jpg",
            "traffic-feature-5.jpg",
        ],
        "cases": [
            "traffic-case-1.jpg",
            "traffic-case-2.jpg",
            "traffic-case-3.jpg",
        ],
    },
    "emergency.html": {
        "features": [
            "emergency-feature-1.jpg",
            "emergency-feature-2.jpg",
            "emergency-feature-3.jpg",
            "emergency-feature-4.jpg",
            "emergency-feature-5.jpg",
        ],
        "cases": [
            "emergency-case-1.jpg",
            "emergency-case-2.jpg",
            "emergency-case-3.jpg",
        ],
    },
    "city.html": {
        "features": [
            "city-feature-1.jpg",
            "city-feature-2.jpg",
            "city-feature-3.jpg",
            "city-feature-4.jpg",
            "city-feature-5.jpg",
        ],
        "cases": [
            "city-case-1.jpg",
            "city-case-2.jpg",
            "city-case-3.jpg",
        ],
    },
    "energy.html": {
        "features": [
            "energy-feature-1.jpg",
            "energy-feature-2.jpg",
            "energy-feature-3.jpg",
            "energy-feature-4.jpg",
            "energy-feature-5.jpg",
        ],
        "cases": [
            "energy-case-1.jpg",
            "energy-case-2.jpg",
            "energy-case-3.jpg",
        ],
    },
    "surveying.html": {
        "features": [
            "surveying-feature-1.jpg",
            "surveying-feature-2.jpg",
            "surveying-feature-3.jpg",
            "surveying-feature-4.jpg",
            "surveying-feature-5.jpg",
        ],
        "cases": [
            "surveying-case-1.jpg",
            "surveying-case-2.jpg",
            "surveying-case-3.jpg",
        ],
    },
    "water.html": {
        "features": [
            "water-feature-1.jpg",
            "water-feature-2.jpg",
            "water-feature-3.jpg",
            "water-feature-4.jpg",
            "water-feature-5.jpg",
        ],
        "cases": [
            "water-case-1.jpg",
            "water-case-2.jpg",
            "water-case-3.jpg",
        ],
    },
    "agriculture.html": {
        "features": [
            "agriculture-feature-1.jpg",
            "agriculture-feature-2.jpg",
            "agriculture-feature-3.jpg",
            "agriculture-feature-4.jpg",
            "agriculture-feature-5.jpg",
        ],
        "cases": [
            "agriculture-case-1.jpg",
            "agriculture-case-2.jpg",
            "agriculture-case-3.jpg",
        ],
    },
}

for filename, images in PAGES.items():
    filepath = f"{BASE}/{filename}"
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # 找到所有 feature-img 的 background-image
    feature_pattern = re.compile(
        r'(<div class="feature-img" style="background-image:url\()[\'"]([^"\']+)[\'"]\)'
    )
    feature_matches = list(feature_pattern.finditer(html))

    # 找到所有 case-thumb 的 background-image
    case_pattern = re.compile(
        r'(<div class="case-thumb" style="background-image:url\()[\'"]([^"\']+)[\'"]\)'
    )
    case_matches = list(case_pattern.finditer(html))

    print(f"\n{filename}: {len(feature_matches)} features, {len(case_matches)} cases")

    # 替换 feature images（从后往前替换，避免偏移）
    replacements = []
    for i, match in enumerate(feature_matches):
        if i < len(images["features"]):
            old_url = match.group(2)
            new_url = f"{IMG_PREFIX}/{images['features'][i]}"
            replacements.append((match.start(2), match.end(2), new_url, old_url))

    for i, match in enumerate(case_matches):
        if i < len(images["cases"]):
            old_url = match.group(2)
            new_url = f"{IMG_PREFIX}/{images['cases'][i]}"
            replacements.append((match.start(2), match.end(2), new_url, old_url))

    # 从后往前替换
    replacements.sort(key=lambda x: x[0], reverse=True)
    for start, end, new_url, old_url in replacements:
        html = html[:start] + new_url + html[end:]
        print(f"  {old_url} → {new_url}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)

print("\n所有页面更新完成!")
