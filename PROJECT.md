# ODPS 奥德帕斯无人机公司官网 - 项目交接文档

## 一、项目概述

**公司名称**：奥德帕斯（ODPS）
**业务领域**：无人机行业应用解决方案提供商，提供无人机产品销售、行业解决方案、AI算法平台、运维服务和飞手培训
**网站类型**：企业官网（纯静态 HTML/CSS/JS，无后端框架）
**线上地址**：部署在 140.143.222.83
**项目路径**：`/Users/dang/Documents/maxclaude/odps-website/`

---

## 二、从 0 到 1 的开发历程

### 阶段 1：模板搭建
- 基于 `templet/1/` 目录下的初始模板（.htm 文件）进行二次开发
- 模板包含基础布局、导航、页脚等公共组件
- 将 .htm 模板转换为完整的 .html 页面

### 阶段 2：页面开发
逐步完成以下页面：
- **首页** index.html — 3D地球、业务场景轮播、数据统计、合作伙伴
- **解决方案** 8个行业页面 — 公共安全、智慧交通、应急消防、城市管理、能源巡检、测绘建模、水利林业、智慧农业
- **产品中心** 5个子页面 — 无人机、机场、挂载、软件平台、飞手培训
- **AI算法** algorithm.html — 算法识别能力展示
- **关于/服务/资质/新闻/联系** 等页面

### 阶段 3：内容标准化与优化（近期）
按时间顺序完成的迭代：
1. **去除具体地名** — 8个解决方案页面中的案例标题，将"上海某区"等改为"某区"
2. **模板标准化** — 统一8个解决方案页面的 HTML 结构和 CSS 类名
3. **方案优势布局** — 将方案优势网格从3列改为2列（`grid-template-columns: repeat(2, 1fr)`），每页6个优势项
4. **功能特性间距** — 调整功能特性标题与第一个 feature-row 之间的间距（padding-bottom:0 + padding-top:0）
5. **feature-list 统一** — 每个 feature-row 的 ul.feature-list 统一为5个 li 项
6. **SVG 图标重新设计** — 48个方案优势 SVG 图标全部重新设计（24x24 viewBox，stroke-based）
7. **功能特性扩充** — 每页从3个 feature-row 扩充到5个（新增16个功能特性）
8. **AI 生图提示词** — 生成64条无人机航拍场景图提示词（Excel清单在桌面）

---

## 三、技术架构

### 技术栈
- **前端**：纯 HTML5 + CSS3 + 原生 JavaScript
- **无框架**：不依赖 React/Vue 等前端框架
- **无构建工具**：无 webpack/vite，直接编辑 HTML 文件
- **3D 效果**：Three.js（首页地球和无人机模型）
- **地图数据**：data/world.json（地球轮廓数据）

### 目录结构
```
odps-website/
├── index.html                    # 首页
├── css/style.css                 # 全局样式（唯一CSS文件）
├── js/
│   ├── main.js                   # 主逻辑（导航、动画、滚动）
│   ├── earth-globe.js            # 首页3D地球
│   └── drone3d.js                # 无人机3D模型
├── data/world.json               # 地球GeoJSON数据
├── models/drone.obj              # 无人机3D模型文件
├── images/
│   ├── logo.png                  # 公司Logo
│   ├── banners/                  # 各页面顶部横幅图
│   ├── cases/                    # 案例和功能特性配图
│   ├── solutions/                # 解决方案相关图片
│   ├── scenes/                   # 应用场景图
│   ├── algo/                     # 算法展示图
│   ├── platform/                 # 平台功能截图
│   ├── certs/                    # 资质证书图
│   ├── partners/                 # 合作伙伴Logo
│   ├── icons/                    # SVG图标和PNG图标
│   ├── stats/                    # 数据统计图标
│   └── ai-generated/            # AI生成的图片（进行中）
├── pages/
│   ├── about.html                # 关于我们
│   ├── algorithm.html            # AI算法平台
│   ├── contact.html              # 联系我们
│   ├── news.html                 # 新闻中心
│   ├── news-detail.html          # 新闻详情
│   ├── service.html              # 运维服务
│   ├── support.html              # 技术支持
│   ├── trust.html                # 资质荣誉
│   ├── products/
│   │   ├── drones.html           # 无人机产品
│   │   ├── dock.html             # 无人机机场
│   │   ├── payloads.html         # 挂载设备
│   │   ├── software.html         # 软件平台
│   │   └── training.html         # 飞手培训
│   └── solutions/
│       ├── public-safety.html    # 公共安全
│       ├── traffic.html          # 智慧交通
│       ├── emergency.html        # 应急消防
│       ├── city.html             # 城市管理
│       ├── energy.html           # 能源巡检
│       ├── surveying.html        # 测绘建模
│       ├── water.html            # 水利林业
│       ├── agriculture.html      # 智慧农业
│       └── unattended.html       # 无人值守（机场方案）
├── templet/1/                    # 原始模板（备份参考，不部署）
├── generate_prompts.py           # AI生图提示词生成脚本
└── 奥德帕斯官网_图片素材清单.xlsx  # 图片素材清单
```

---

## 四、解决方案页面模板规范（核心）

8个解决方案页面是本项目的核心内容，结构完全统一：

### 页面结构（从上到下）
```
Banner（全宽背景图 + 标题）
  ↓
功能特性标题（section, padding-bottom: 0）
  ↓
Feature-row 1（section, padding-top: 0）          ← 普通
  ↓
Feature-row 2（section section-light, reverse）   ← 浅色背景 + 图文反转
  ↓
Feature-row 3（section）                          ← 普通
  ↓
Feature-row 4（section section-light, reverse）   ← 浅色背景 + 图文反转
  ↓
Feature-row 5（section）                          ← 普通
  ↓
方案优势（6项，2列网格，每项含 SVG 图标）
  ↓
相关案例（3张案例卡片）
  ↓
CTA（行动号召横幅）
  ↓
Footer
```

### Feature-row HTML 模板
```html
<!-- 普通行（Row 1, 3, 5） -->
<section class="section">
  <div class="container">
    <div class="feature-row fade-in">
      <div class="feature-img" style="background-image:url('../../images/cases/xxx.jpg')"></div>
      <div class="feature-text">
        <h3>标题</h3>
        <p>描述文字...</p>
        <ul class="feature-list">
          <li>要点1</li>
          <li>要点2</li>
          <li>要点3</li>
          <li>要点4</li>
          <li>要点5</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- 浅色反转行（Row 2, 4） -->
<section class="section section-light">
  <div class="container">
    <div class="feature-row reverse fade-in">
      <div class="feature-img" style="background-image:url('../../images/cases/xxx.jpg')"></div>
      <div class="feature-text">
        <h3>标题</h3>
        <p>描述文字...</p>
        <ul class="feature-list">
          <li>要点1</li>
          <li>要点2</li>
          <li>要点3</li>
          <li>要点4</li>
          <li>要点5</li>
        </ul>
      </div>
    </div>
  </div>
</section>
```

### 方案优势 HTML 模板
```html
<div class="solution-adv-grid">
  <!-- 每页6项，2列布局 -->
  <div class="solution-adv-item">
    <div class="solution-adv-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <!-- SVG path -->
      </svg>
    </div>
    <h4>优势标题</h4>
    <p>优势描述...</p>
  </div>
  <!-- ...共6个 -->
</div>
```

### CSS 关键规则
- `.solution-adv-grid`: `grid-template-columns: repeat(2, 1fr)`
- `.feature-list`: 每个 ul 内固定5个 li
- `.feature-row.reverse`: 图文左右互换
- `.section-light`: 浅灰背景色
- SVG 图标规范: 24x24 viewBox, stroke-based, `stroke="currentColor" stroke-width="2"`

---

## 五、各页面功能特性与案例清单

### 1. 公共安全 (public-safety.html)
**功能特性**：巡逻巡检、大型活动安保、搜救定位、无人机反制、校园安防巡查
**案例**：某区无人机巡防常态化运营、某地民俗节庆空地一体安防、某市跨年活动人群态势管控

### 2. 智慧交通 (traffic.html)
**功能特性**：违停抓拍与处置、事故快处易赔、酒驾夜查与非机动车整治、交通疏导与高峰保障、非机动车与行人违法整治
**案例**：某市交管无人机常态化部署、高考护航交通保障专项、某区渣土车夜间专项整治

### 3. 应急消防 (emergency.html)
**功能特性**：消防巡查、火灾现场支援、搜救与防化侦检、森林防火巡护、应急物资投送
**案例**：某区消防救援站无人机值守、某区森林防火季联合巡护、某市民防应急综合演练

### 4. 城市管理 (city.html)
**功能特性**：违建监测与河道整治、场地资源管理、社区综合治理、建筑外立面安全检测、渣土运输与扬尘监管
**案例**：某区城管无人机执法中队、某开发区"一网统管"空中哨兵、某街道垃圾分类督查

### 5. 能源巡检 (energy.html)
**功能特性**：电力巡检、光伏与风电领域巡检、油气管道巡查、变电站智能巡检、化工园区安全监测
**案例**：某电网公司无人机自主巡检体系建设、某风电场叶片近距检查、某油田变电站智能巡检试点

### 6. 测绘建模 (surveying.html)
**功能特性**：二三维建模、土地测绘、建筑外立面检测、工程施工进度监管、数字孪生场景建设
**案例**：某市测绘院城市实景三维合作、某高校数字孪生校园建设、某工地施工进度航拍监管

### 7. 水利林业 (water.html)
**功能特性**：河道检测、林业检测、农田水利巡查、水库大坝安全监测、湿地与自然保护区监测
**案例**：某区"智慧河长"无人机巡河、某景区古树名木数字化保护、某水库汛期应急侦察保障

### 8. 智慧农业 (agriculture.html)
**功能特性**：病虫害监测、农田巡检、植保作业、农业遥感与产量预估、无人农场综合管理
**案例**：某农垦集团无人机管理平台建设、某示范区无人农场试点、某镇统防统治社会化服务

---

## 六、部署信息

### 服务器
- **IP**：140.143.222.83
- **SSH用户**：ubuntu
- **SSH密钥**：`~/.ssh/cloud_server_key`
- **网站根目录**：`/var/www/iot-projects/odps-website/`
- **Web服务器**：Nginx，文件所有者为 www-data

### 部署命令
```bash
# 1. 修改服务器文件权限（允许 ubuntu 用户写入）
ssh -i ~/.ssh/cloud_server_key ubuntu@140.143.222.83 \
  "sudo chown -R ubuntu:ubuntu /var/www/iot-projects/odps-website/pages/solutions/"

# 2. 同步文件到服务器
rsync -avz --no-perms --no-times \
  -e "ssh -i ~/.ssh/cloud_server_key" \
  ./pages/solutions/ \
  ubuntu@140.143.222.83:/var/www/iot-projects/odps-website/pages/solutions/

# 3. 恢复文件权限（Nginx 需要 www-data）
ssh -i ~/.ssh/cloud_server_key ubuntu@140.143.222.83 \
  "sudo chown -R www-data:www-data /var/www/iot-projects/odps-website/pages/solutions/"
```

> **注意**：部署其他目录时，替换路径中的 `pages/solutions/` 为对应目录即可。整站部署时用根目录路径。

---

## 七、待完成事项

### 进行中
- [ ] **AI 生图**：64张无人机航拍场景图待生成（提示词清单在 `generate_prompts.py` 和桌面 Excel）
- [ ] **替换占位图**：生成图片后需替换 HTML 中的 background-image 路径，建议文件名见 Excel 中的"建议文件名"列

### 已知问题
- 部分 feature-row 共用相同占位图片（如 site-management.jpg 用了7次），需替换为独立图片
- `templet/1/` 是原始模板备份，不需要部署到服务器
- `images/ai-generated/` 目录下已有少量 AI 生成图片（公共安全页面的部分图片），其余待生成

### 可能的后续优化
- 响应式适配检查（移动端）
- 新闻页面内容填充
- SEO 优化（meta 标签、结构化数据）
- 图片压缩和 WebP 格式转换
- 页面加载性能优化

---

## 八、设计规范速查

| 项目 | 规范 |
|------|------|
| SVG 图标 | 24x24 viewBox, stroke-based, stroke-width="2", stroke-linecap="round", stroke-linejoin="round" |
| 方案优势网格 | 2列, 每页6项 |
| Feature-row | 每页5个, 交替 normal/section-light+reverse |
| Feature-list | 每行固定5个 li |
| 配图比例 | 16:9 (1920x1080) |
| 配图风格 | 真实摄影, 无人机航拍俯视视角, 中国场景, 无文字无标注 |
| 案例卡片 | 每页3张 |
