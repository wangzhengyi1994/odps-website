#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""将 AI 生成的图片压缩、重命名并复制到项目目录"""

import os
import subprocess
import shutil

SRC_DIR = "/Users/dang/Desktop/export 2"
DST_DIR = "/Users/dang/Documents/maxclaude/odps-website/images/ai-generated"

# 中文文件名（去掉.png后缀）→ 英文规范文件名的映射
# 按 generate_prompts.py 中的顺序：每页 feature 1-5, case 1-3
MAPPING = {
    # === 公共安全 ===
    "城市街道与居民社区俯瞰": "public-safety-feature-1",
    "大型体育场馆或城市广场举办活动俯瞰": "public-safety-feature-2",
    "山区丛林地带俯瞰": "public-safety-feature-3",
    "城市重要建筑设施周边区域俯瞰": "public-safety-feature-4",
    "现代化校园全景俯瞰": "public-safety-feature-5",
    "城市城区夜间街道俯瞰": "public-safety-case-1",
    "传统节庆活动现场俯瞰": "public-safety-case-2",
    "城市广场夜间大型活动俯瞰": "public-safety-case-3",

    # === 智慧交通 ===
    "城市主干道交叉路口俯瞰": "traffic-feature-1",
    "城市道路上两车碰擦的轻微交通事故现场俯瞰": "traffic-feature-2",
    "城市夜间道路临时检查点俯瞰": "traffic-feature-3",
    "城市早高峰时段俯瞰": "traffic-feature-4",
    "城市十字路口俯瞰": "traffic-feature-5",
    "城市多个路口交通全景俯瞰": "traffic-case-1",
    "学校周边道路俯瞰": "traffic-case-2",
    "夜间城市道路俯瞰": "traffic-case-3",

    # === 应急消防 ===
    "工业园区或商业综合体屋顶俯瞰": "emergency-feature-1",
    "城市建筑火灾现场俯瞰": "emergency-feature-2",
    "化工厂区事故现场俯瞰": "emergency-feature-3",
    "广袤的山林区域秋冬季节俯瞰": "emergency-feature-4",
    "山洪或泥石流灾害后的偏远山村俯瞰": "emergency-feature-5",
    "消防救援站院内俯瞰": "emergency-case-1",
    "山区茂密森林俯瞰": "emergency-case-2",
    "城市开阔场地俯瞰": "emergency-case-3",

    # === 城市管理 ===
    "城市河道两岸俯瞰": "city-feature-1",
    "城市大型停车场或仓储区域俯瞰": "city-feature-2",
    "城市老旧居民小区俯瞰": "city-feature-3",
    "高层建筑群斜上方航拍": "city-feature-4",
    "建筑工地区域俯瞰": "city-feature-5",
    "城市商业街道俯瞰": "city-case-1",
    "现代化产业开发区全景俯瞰": "city-case-2",
    "居民小区垃圾分类投放点俯瞰": "city-case-3",

    # === 能源巡检 ===
    "高压输电线路走廊俯瞰": "energy-feature-1",
    "大规模光伏发电站俯瞰": "energy-feature-2",
    "荒野或山区中的石油天然气管道走廊俯瞰": "energy-feature-3",
    "大型变电站全景俯瞰": "energy-feature-4",
    "化工产业园区俯瞰": "energy-feature-5",
    "输电线路铁塔群俯瞰": "energy-case-1",
    "海边或山顶风力发电机群俯瞰": "energy-case-2",
    "油田区域俯瞰": "energy-case-3",

    # === 测绘建模 ===
    "城市建筑群和街区的高精度航拍正射影像": "surveying-feature-1",
    "农村或城郊大面积耕地和宅基地俯瞰": "surveying-feature-2",
    "现代化高层建筑近距离斜拍": "surveying-feature-3",
    "大型建筑工地全景俯瞰": "surveying-feature-4",
    "现代化园区或校园的高精度航拍全景": "surveying-feature-5",  # 文件名可能不完全匹配
    "城市中心区域高精度航拍": "surveying-case-1",
    "大学校园全景航拍": "surveying-case-2",
    "大型施工工地航拍": "surveying-case-3",

    # === 水利林业 ===
    "蜿蜒的河流穿过城镇和乡村俯瞰": "water-feature-1",
    "大片森林或人工林区域航拍俯瞰": "water-feature-2",
    "灌溉渠系和连片农田俯瞰": "water-feature-3",
    "大型水库和混凝土大坝全景俯瞰": "water-feature-4",
    "湿地或自然保护区全景航拍俯瞰": "water-feature-5",
    "城市河道蜿蜒穿过社区俯瞰": "water-case-1",
    "山区景区中古老的参天大树俯瞰": "water-case-2",
    "暴雨后水库水位上涨俯瞰": "water-case-3",

    # === 智慧农业 ===
    "大面积农作物田地航拍俯瞰": "agriculture-feature-1",
    "广袤的农田航拍全景俯瞰": "agriculture-feature-2",
    "农田上空植保无人机低空飞行喷洒作业": "agriculture-feature-3",
    "大规模农业种植区航拍俯瞰": "agriculture-feature-4",
    "现代化大型农场全景俯瞰": "agriculture-feature-5",
    "大型国营农场航拍全景": "agriculture-case-1",
    "现代化农场航拍俯瞰": "agriculture-case-2",
    "乡镇连片农田上空俯瞰": "agriculture-case-3",
}

# 确保目标目录存在
os.makedirs(DST_DIR, exist_ok=True)

# 获取源文件列表
src_files = [f for f in os.listdir(SRC_DIR) if f.endswith('.png')]
print(f"源文件夹共 {len(src_files)} 张 PNG")

matched = 0
unmatched = []

# 额外映射：处理文件名中可能缺少"俯瞰"等后缀的情况
# 先建立一个从源文件名（去掉.png）到文件路径的映射
src_name_map = {}
for f in src_files:
    name = f.replace('.png', '')
    src_name_map[name] = os.path.join(SRC_DIR, f)

for src_name, src_path in src_name_map.items():
    target_name = None

    # 精确匹配
    if src_name in MAPPING:
        target_name = MAPPING[src_name]
    else:
        # 模糊匹配：源文件名包含在某个 key 中，或反过来
        for key, val in MAPPING.items():
            if key in src_name or src_name in key:
                target_name = val
                break

    if target_name:
        dst_path = os.path.join(DST_DIR, f"{target_name}.jpg")
        # 用 sips 压缩：调整宽度到 1920px，转 JPG
        cmd = [
            "sips",
            "-s", "format", "jpeg",
            "-s", "formatOptions", "80",  # 质量80%
            "--resampleWidth", "1920",
            src_path,
            "--out", dst_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            size_kb = os.path.getsize(dst_path) / 1024
            print(f"  OK  {target_name}.jpg ({size_kb:.0f}KB) ← {src_name}")
            matched += 1
        else:
            print(f"  ERR {target_name} ← {src_name}: {result.stderr.strip()}")
    else:
        unmatched.append(src_name)

print(f"\n处理完成: {matched}/64 匹配成功")
if unmatched:
    print(f"未匹配的文件 ({len(unmatched)}):")
    for u in unmatched:
        print(f"  - {u}")

# 统计输出目录
jpg_files = [f for f in os.listdir(DST_DIR) if f.endswith('.jpg')]
total_size = sum(os.path.getsize(os.path.join(DST_DIR, f)) for f in jpg_files)
print(f"\n输出目录: {len(jpg_files)} 张 JPG, 总大小: {total_size/1024/1024:.1f}MB, 平均: {total_size/len(jpg_files)/1024:.0f}KB/张")
