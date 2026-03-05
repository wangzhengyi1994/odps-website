/**
 * 奥德帕斯首页 3D 粒子 Banner
 * 三模型粒子切换 + 星河背景 + 鼠标交互
 */
(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  /* ========== 配置 ========== */
  var PARTICLE_COUNT = 30000;
  var MORPH_DURATION = 1.8;       // 切换动画时长(秒)
  var AUTO_SWITCH_INTERVAL = 6;   // 自动切换间隔(秒)

  var MODELS = [
    'models/drone.obj',
    'models/drone2.obj',
    'models/drone3.obj'
  ];

  var CONFIG = {
    cameraFov: 40,
    cameraZ: 60,
    autoRotateSpeed: 0.001,
    modelScale: 18,
    // 蓝白配色 - 更亮更醒目
    particleColor1: 0x6ea8ff,
    particleColor2: 0xe8f2ff,
    glowColor: 0xc0dcff,
  };

  /* ========== 场景初始化 ========== */
  var canvas = document.getElementById('drone-3d-canvas');
  if (!canvas) return;

  var container = canvas.closest('.hero-3d') || canvas.parentElement;
  var width = container.clientWidth || window.innerWidth;
  var height = container.clientHeight || 540;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x050a18, 1);

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050a18);
  scene.fog = new THREE.FogExp2(0x050a18, 0.002);

  var camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, width / height, 0.1, 1000);
  camera.position.set(0, 0, CONFIG.cameraZ);
  camera.lookAt(0, 0, 0);

  /* ========== 右侧偏移 ========== */
  function getDroneOffsetX() {
    var vFov = CONFIG.cameraFov * Math.PI / 180;
    var visH = 2 * Math.tan(vFov / 2) * CONFIG.cameraZ;
    var visW = visH * (width / height);
    return visW * 0.18;
  }

  /* ========== 光源 ========== */
  scene.add(new THREE.AmbientLight(0x1a2a4a, 0.6));
  var dirLight = new THREE.DirectionalLight(0xc8dcff, 0.8);
  dirLight.position.set(30, 40, 50);
  scene.add(dirLight);
  var pointLight1 = new THREE.PointLight(0x80b4ff, 2.5, 300);
  pointLight1.position.set(50, 25, 40);
  scene.add(pointLight1);
  var pointLight2 = new THREE.PointLight(0x4d8bff, 1.8, 250);
  pointLight2.position.set(-20, -10, 30);
  scene.add(pointLight2);

  /* ========== 星河粒子 ========== */
  function createStarField(count, spread, baseSize, color, speed) {
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(count * 3);
    var sz = new Float32Array(count);
    var twk = new Float32Array(count);
    var vel = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * spread;
      pos[i3 + 1] = (Math.random() - 0.5) * spread * 0.55;
      pos[i3 + 2] = (Math.random() - 0.5) * spread;
      vel[i3] = (Math.random() - 0.5) * speed;
      vel[i3 + 1] = (Math.random() - 0.5) * speed * 0.6;
      vel[i3 + 2] = (Math.random() - 0.5) * speed;
      sz[i] = Math.random() * baseSize + 0.2;
      twk[i] = Math.random() * 6.28;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aVelocity', new THREE.BufferAttribute(vel, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    geo.setAttribute('aTwinkle', new THREE.BufferAttribute(twk, 1));

    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: [
        'uniform float uTime;',
        'uniform float uPixelRatio;',
        'attribute vec3 aVelocity;',
        'attribute float aSize;',
        'attribute float aTwinkle;',
        'varying float vAlpha;',
        'void main() {',
        '  vec3 pos = position + aVelocity * uTime * 40.0;',
        '  float bound = 55.0;',
        '  pos = mod(pos + bound, bound * 2.0) - bound;',
        '  float twinkle = sin(uTime * (1.5 + aSize * 0.8) + aTwinkle) * 0.5 + 0.5;',
        '  vAlpha = 0.1 + 0.5 * pow(twinkle, 2.0);',
        '  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);',
        '  gl_Position = projectionMatrix * mvPos;',
        '  gl_PointSize = (aSize + twinkle * 0.5) * uPixelRatio * (55.0 / -mvPos.z);',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uColor;',
        'varying float vAlpha;',
        'void main() {',
        '  float d = length(gl_PointCoord - 0.5);',
        '  if (d > 0.5) discard;',
        '  float core = smoothstep(0.5, 0.0, d);',
        '  float glow = smoothstep(0.5, 0.15, d);',
        '  float alpha = (core * 0.7 + glow * 0.3) * vAlpha;',
        '  vec3 color = mix(uColor, vec3(1.0), core * 0.4);',
        '  gl_FragColor = vec4(color, alpha);',
        '}',
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geo, mat);
  }

  var starsWhite = createStarField(2000, 130, 1.0, 0xffffff, 0.008);
  var starsBlue = createStarField(800, 100, 1.4, 0x80b4ff, 0.012);
  var starsBright = createStarField(150, 120, 2.8, 0xd0e4ff, 0.005);
  scene.add(starsWhite);
  scene.add(starsBlue);
  scene.add(starsBright);

  /* ========== 从 OBJ 提取顶点坐标 ========== */
  function extractVertices(obj, targetCount) {
    var allVerts = [];
    obj.traverse(function (child) {
      if (child.isMesh) {
        var posAttr = child.geometry.getAttribute('position');
        for (var i = 0; i < posAttr.count; i++) {
          allVerts.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        }
      }
    });

    // 居中 & 归一化缩放
    var minX = Infinity, minY = Infinity, minZ = Infinity;
    var maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (var i = 0; i < allVerts.length; i += 3) {
      if (allVerts[i] < minX) minX = allVerts[i];
      if (allVerts[i] > maxX) maxX = allVerts[i];
      if (allVerts[i + 1] < minY) minY = allVerts[i + 1];
      if (allVerts[i + 1] > maxY) maxY = allVerts[i + 1];
      if (allVerts[i + 2] < minZ) minZ = allVerts[i + 2];
      if (allVerts[i + 2] > maxZ) maxZ = allVerts[i + 2];
    }
    var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
    var span = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
    var scale = CONFIG.modelScale / span;

    for (var i = 0; i < allVerts.length; i += 3) {
      allVerts[i] = (allVerts[i] - cx) * scale;
      allVerts[i + 1] = (allVerts[i + 1] - cy) * scale;
      allVerts[i + 2] = (allVerts[i + 2] - cz) * scale;
    }

    // 填充/裁剪到目标数量
    var result = new Float32Array(targetCount * 3);
    var srcCount = allVerts.length / 3;
    for (var i = 0; i < targetCount; i++) {
      var si = (i % srcCount) * 3;
      result[i * 3] = allVerts[si];
      result[i * 3 + 1] = allVerts[si + 1];
      result[i * 3 + 2] = allVerts[si + 2];
    }
    return result;
  }

  /* ========== 粒子系统 ========== */
  var particleGroup = new THREE.Group();
  scene.add(particleGroup);

  // 当前位置 & 目标位置
  var currentPositions = new Float32Array(PARTICLE_COUNT * 3);
  var targetPositions = new Float32Array(PARTICLE_COUNT * 3);
  var startPositions = new Float32Array(PARTICLE_COUNT * 3);

  // 每个粒子的随机延迟
  var particleDelays = new Float32Array(PARTICLE_COUNT);
  for (var i = 0; i < PARTICLE_COUNT; i++) {
    particleDelays[i] = Math.random();
    // 初始随机分散 - 更广范围
    currentPositions[i * 3] = (Math.random() - 0.5) * 50;
    currentPositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
    currentPositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
  }

  var particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
  particleGeo.setAttribute('aDelay', new THREE.BufferAttribute(particleDelays, 1));
  // 随机大小 - 更大更亮
  var particleSizes = new Float32Array(PARTICLE_COUNT);
  for (var i = 0; i < PARTICLE_COUNT; i++) {
    particleSizes[i] = 1.0 + Math.random() * 2.5;
  }
  particleGeo.setAttribute('aSize', new THREE.BufferAttribute(particleSizes, 1));

  var particleMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(CONFIG.particleColor1) },
      uColor2: { value: new THREE.Color(CONFIG.particleColor2) },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uMorphProgress: { value: 0 },
    },
    vertexShader: [
      'uniform float uTime;',
      'uniform float uPixelRatio;',
      'uniform float uMorphProgress;',
      'attribute float aDelay;',
      'attribute float aSize;',
      'varying float vAlpha;',
      'varying float vHeight;',
      '',
      'void main() {',
      '  vec3 pos = position;',
      '',
      '  // 呼吸浮动',
      '  pos.y += sin(uTime * 0.8 + pos.x * 0.5) * 0.15;',
      '  pos.x += cos(uTime * 0.6 + pos.z * 0.3) * 0.1;',
      '',
      '  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);',
      '  gl_Position = projectionMatrix * mvPos;',
      '',
      '  // 切换过程中粒子闪烁变大',
      '  float morphFlash = sin(uMorphProgress * 3.14159) * 0.8;',
      '  float size = aSize * (1.0 + morphFlash);',
      '  gl_PointSize = size * uPixelRatio * (55.0 / -mvPos.z);',
      '',
      '  // 归一化高度用于着色',
      '  vHeight = (pos.y + 10.0) / 20.0;',
      '  vAlpha = 0.75 + 0.25 * sin(uTime * 2.0 + aDelay * 6.28);',
      '  // 切换时整体更亮',
      '  vAlpha += morphFlash * 0.3;',
      '}',
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 uColor1;',
      'uniform vec3 uColor2;',
      'varying float vAlpha;',
      'varying float vHeight;',
      '',
      'void main() {',
      '  float d = length(gl_PointCoord - 0.5);',
      '  if (d > 0.5) discard;',
      '',
      '  float core = smoothstep(0.5, 0.0, d);',
      '  float glow = smoothstep(0.5, 0.08, d);',
      '  float alpha = (core * 0.85 + glow * 0.35) * vAlpha;',
      '',
      '  // 蓝白渐变: 底部蓝 -> 顶部白',
      '  vec3 color = mix(uColor1, uColor2, clamp(vHeight, 0.0, 1.0));',
      '  // 核心偏白 - 更强烈的白色核心',
      '  color = mix(color, vec3(1.0), core * 0.5);',
      '',
      '  gl_FragColor = vec4(color, alpha);',
      '}',
    ].join('\n'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  var particles = new THREE.Points(particleGeo, particleMat);
  particleGroup.add(particles);

  /* ========== 模型加载 & 切换逻辑 ========== */
  var modelVertices = [];  // Float32Array[] 每个模型的目标顶点
  var modelsLoaded = 0;
  var currentModelIndex = 0;
  var morphing = false;
  var morphStartTime = 0;
  var allModelsReady = false;

  var loader = new THREE.OBJLoader();

  function loadModel(url, index) {
    loader.load(url, function (obj) {
      modelVertices[index] = extractVertices(obj, PARTICLE_COUNT);
      modelsLoaded++;
      if (modelsLoaded === MODELS.length) {
        allModelsReady = true;
        // 初始切换到第一个模型
        startMorph(0);
      }
    }, undefined, function (err) {
      console.warn('Failed to load model:', url, err);
    });
  }

  MODELS.forEach(function (url, i) {
    loadModel(url, i);
  });

  /* ========== 缓动函数 ========== */
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ========== 切换控制 ========== */
  function startMorph(toIndex) {
    if (morphing) return;

    currentModelIndex = toIndex;
    morphing = true;
    morphStartTime = performance.now() / 1000;

    // 保存当前位置作为起点
    startPositions.set(currentPositions);
    // 设置目标
    targetPositions.set(modelVertices[toIndex]);

    // 切换 banner 文字
    updateBannerText(toIndex);
    // 更新导航指示器
    updateIndicators(toIndex);
  }

  function switchToNext() {
    var next = (currentModelIndex + 1) % MODELS.length;
    startMorph(next);
  }

  /* ========== banner 文字切换 ========== */
  function updateBannerText(index) {
    var slides = document.querySelectorAll('.hero-slide');
    slides.forEach(function (el, i) {
      if (i === index) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  function updateIndicators(index) {
    var dots = document.querySelectorAll('.hero-indicator');
    dots.forEach(function (el, i) {
      el.classList.toggle('active', i === index);
    });
  }

  /* ========== 导航指示器点击 ========== */
  document.querySelectorAll('.hero-indicator').forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      if (!allModelsReady || morphing) return;
      if (i !== currentModelIndex) {
        startMorph(i);
        lastSwitchTime = performance.now() / 1000;
      }
    });
  });

  /* ========== 点击 canvas 切换 ========== */
  var heroSection = canvas.closest('.hero-3d') || container;
  heroSection.addEventListener('click', function (e) {
    // 排除按钮和链接点击
    if (e.target.closest('a, button, .hero-indicator')) return;
    if (!allModelsReady || morphing) return;
    switchToNext();
    lastSwitchTime = performance.now() / 1000;
  });

  /* ========== 鼠标交互 ========== */
  var mouseX = 0, mouseY = 0;

  heroSection.addEventListener('mousemove', function (e) {
    var rect = heroSection.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  });
  heroSection.addEventListener('mouseleave', function () {
    mouseX = 0;
    mouseY = 0;
  });

  /* ========== 渲染循环 ========== */
  var rafId = null;
  var lastSwitchTime = 0;

  function animate() {
    rafId = requestAnimationFrame(animate);

    var now = performance.now() / 1000;

    // 更新星河
    starsWhite.material.uniforms.uTime.value = now;
    starsBlue.material.uniforms.uTime.value = now;
    starsBright.material.uniforms.uTime.value = now;

    // 粒子 morph
    if (morphing) {
      var elapsed = now - morphStartTime;
      var rawProgress = Math.min(elapsed / MORPH_DURATION, 1);
      var progress = easeInOutCubic(rawProgress);

      particleMat.uniforms.uMorphProgress.value = rawProgress;

      var posArr = particleGeo.attributes.position.array;
      var delayArr = particleDelays;

      for (var i = 0; i < PARTICLE_COUNT; i++) {
        var i3 = i * 3;
        // 每个粒子有自己的延迟 => 错落效果
        var individualProgress = Math.max(0, Math.min(1, (rawProgress - delayArr[i] * 0.3) / 0.7));
        individualProgress = easeInOutCubic(individualProgress);

        posArr[i3] = startPositions[i3] + (targetPositions[i3] - startPositions[i3]) * individualProgress;
        posArr[i3 + 1] = startPositions[i3 + 1] + (targetPositions[i3 + 1] - startPositions[i3 + 1]) * individualProgress;
        posArr[i3 + 2] = startPositions[i3 + 2] + (targetPositions[i3 + 2] - startPositions[i3 + 2]) * individualProgress;
      }
      particleGeo.attributes.position.needsUpdate = true;

      if (rawProgress >= 1) {
        morphing = false;
        currentPositions.set(targetPositions);
        particleMat.uniforms.uMorphProgress.value = 0;
        lastSwitchTime = now;
      }
    }

    // 自动切换
    if (allModelsReady && !morphing && (now - lastSwitchTime) > AUTO_SWITCH_INTERVAL) {
      switchToNext();
    }

    // 粒子组旋转和位置
    particleGroup.rotation.y += CONFIG.autoRotateSpeed;
    // 鼠标跟随
    var targetRotX = mouseY * 0.08;
    var targetRotZ = -mouseX * 0.06;
    particleGroup.rotation.x += (targetRotX - particleGroup.rotation.x) * 0.03;
    particleGroup.rotation.z += (targetRotZ - particleGroup.rotation.z) * 0.03;
    // 右侧偏移 + 悬浮
    particleGroup.position.x = getDroneOffsetX();
    particleGroup.position.y = Math.sin(now * 0.6) * 1.0;

    particleMat.uniforms.uTime.value = now;

    // 光源动态
    pointLight1.position.x = 50 + Math.sin(now * 0.4) * 12;
    pointLight1.position.y = 25 + Math.cos(now * 0.3) * 8;

    // 相机微动
    camera.position.x += (mouseX * 3 - camera.position.x) * 0.015;
    camera.position.y += (-mouseY * 2 - camera.position.y) * 0.015;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();

  /* ========== 响应式 ========== */
  function onResize() {
    width = container.clientWidth || window.innerWidth;
    height = container.clientHeight || 600;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    var pr = renderer.getPixelRatio();
    starsWhite.material.uniforms.uPixelRatio.value = pr;
    starsBlue.material.uniforms.uPixelRatio.value = pr;
    starsBright.material.uniforms.uPixelRatio.value = pr;
    particleMat.uniforms.uPixelRatio.value = pr;
    particleGroup.position.x = getDroneOffsetX();
  }
  window.addEventListener('resize', onResize);

  /* ========== 可见性优化 ========== */
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        if (!rafId) animate();
      } else {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    });
  }, { threshold: 0.1 });
  observer.observe(canvas);

})();
