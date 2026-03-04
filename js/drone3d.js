/**
 * 奥德帕斯首页 3D 无人机 Banner
 * 蓝白渐变线框 + 星河粒子 + 鼠标交互
 */
(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  /* ========== 配置 ========== */
  var CONFIG = {
    sliceDuration: 2.5,
    sliceGap: 2.0,
    sliceCount: 30,

    // 蓝白渐变配色
    wireColor: 0x4d8bff,        // 中蓝 - 底部
    wireColorTop: 0xd0e4ff,     // 近白浅蓝 - 顶部
    edgeColor: 0x80b4ff,        // 切割发光蓝
    glowColor: 0xa8cfff,        // 外发光
    particleColor1: 0xffffff,   // 白色星点
    particleColor2: 0x80b4ff,   // 蓝色星点

    // 模型大小
    droneScale: 65,

    cameraFov: 40,
    cameraZ: 100,
    autoRotateSpeed: 0.0015,
  };

  /* ========== 场景初始化 ========== */
  var canvas = document.getElementById('drone-3d-canvas');
  if (!canvas) return;

  // container 用 hero section，因为 canvas-wrap 是 absolute 定位，自身尺寸依赖父级
  var container = canvas.closest('.hero-3d') || canvas.parentElement;
  var width = container.clientWidth || window.innerWidth;
  var height = container.clientHeight || 600;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, 0.002);

  var camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, width / height, 0.1, 1000);
  camera.position.set(0, 0, CONFIG.cameraZ);
  camera.lookAt(0, 0, 0);

  function getDroneOffsetX() {
    var vFov = CONFIG.cameraFov * Math.PI / 180;
    var visH = 2 * Math.tan(vFov / 2) * CONFIG.cameraZ;
    var visW = visH * (width / height);
    return visW * 0.18;
  }

  // 光源 - 蓝白色调
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

  var backLight = new THREE.PointLight(0xd0e4ff, 1.0, 200);
  backLight.position.set(10, 5, -50);
  scene.add(backLight);

  /* ========== 线框着色器 - 蓝白渐变 ========== */
  var wireShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColor: { value: new THREE.Color(CONFIG.wireColor) },
      uColorTop: { value: new THREE.Color(CONFIG.wireColorTop) },
      uEdgeColor: { value: new THREE.Color(CONFIG.edgeColor) },
      uGlowColor: { value: new THREE.Color(CONFIG.glowColor) },
      uSliceCount: { value: CONFIG.sliceCount },
      uSliceGap: { value: CONFIG.sliceGap },
      uModelHeight: { value: 1.0 },
      uModelMin: { value: 0.0 },
      uHover: { value: 0.0 },
    },
    vertexShader: [
      'uniform float uTime;',
      'uniform float uProgress;',
      'uniform float uSliceCount;',
      'uniform float uSliceGap;',
      'uniform float uModelHeight;',
      'uniform float uModelMin;',
      'uniform float uHover;',
      '',
      'varying vec3 vPosition;',
      'varying vec3 vNormal;',
      'varying vec3 vWorldPosition;',
      'varying float vSliceId;',
      '',
      'void main() {',
      '  vPosition = position;',
      '  vNormal = normal;',
      '',
      '  float normalized = (position.y - uModelMin) / uModelHeight;',
      '  float sliceId = floor(normalized * uSliceCount);',
      '  vSliceId = sliceId;',
      '',
      '  float offset = (sliceId - uSliceCount * 0.5) * uSliceGap * (1.0 - uProgress);',
      '',
      '  vec3 pos = position;',
      '  pos.y += offset;',
      '',
      '  float jitter = sin(sliceId * 3.14159 + uTime * 2.0) * 0.5 * (1.0 - uProgress);',
      '  pos.x += jitter;',
      '  pos.z += jitter * 0.5;',
      '',
      '  // hover 时微量膨胀',
      '  pos *= 1.0 + uHover * 0.02;',
      '',
      '  vec4 worldPos = modelMatrix * vec4(pos, 1.0);',
      '  vWorldPosition = worldPos.xyz;',
      '',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);',
      '}',
    ].join('\n'),
    fragmentShader: [
      'uniform float uTime;',
      'uniform float uProgress;',
      'uniform vec3 uColor;',
      'uniform vec3 uColorTop;',
      'uniform vec3 uEdgeColor;',
      'uniform vec3 uGlowColor;',
      'uniform float uSliceCount;',
      'uniform float uModelHeight;',
      'uniform float uModelMin;',
      'uniform float uHover;',
      '',
      'varying vec3 vPosition;',
      'varying vec3 vNormal;',
      'varying vec3 vWorldPosition;',
      'varying float vSliceId;',
      '',
      'void main() {',
      '  float normalized = (vPosition.y - uModelMin) / uModelHeight;',
      '',
      '  // 切片边缘',
      '  float slicePhase = fract(normalized * uSliceCount);',
      '  float edgeDist = min(slicePhase, 1.0 - slicePhase);',
      '  float edgeGlow = smoothstep(0.05, 0.0, edgeDist) * (1.0 - uProgress);',
      '',
      '  // 蓝白渐变: 底部蓝 -> 顶部白',
      '  vec3 baseColor = mix(uColor, uColorTop, normalized);',
      '',
      '  // 切割高亮',
      '  vec3 finalColor = mix(baseColor, uEdgeColor * 1.5, edgeGlow * 0.7);',
      '',
      '  // 菲涅尔轮廓光 - 蓝白色',
      '  vec3 viewDir = normalize(cameraPosition - vWorldPosition);',
      '  float fresnel = 1.0 - abs(dot(normalize(vNormal), viewDir));',
      '  fresnel = pow(fresnel, 2.0);',
      '  finalColor += uGlowColor * fresnel * (0.35 + uHover * 0.25);',
      '',
      '  // 扫描线',
      '  float scanLine = sin(normalized * 35.0 - uTime * 2.5) * 0.5 + 0.5;',
      '  scanLine = pow(scanLine, 10.0) * 0.2;',
      '  finalColor += vec3(0.7, 0.85, 1.0) * scanLine * uProgress;',
      '',
      '  // 呼吸脉冲',
      '  float pulse = 0.93 + 0.07 * sin(uTime * 1.2 + normalized * 6.28);',
      '  finalColor *= pulse;',
      '',
      '  // hover 提亮',
      '  finalColor += vec3(0.15, 0.2, 0.3) * uHover;',
      '',
      '  // 透明度',
      '  float alpha = mix(0.55, 0.92, uProgress);',
      '  alpha += edgeGlow * 0.25;',
      '  alpha += fresnel * 0.2;',
      '  alpha += uHover * 0.08;',
      '',
      '  gl_FragColor = vec4(finalColor, alpha);',
      '}',
    ].join('\n'),
    transparent: true,
    wireframe: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  /* ========== (实体着色器已移除 - 仅保留线框) ========== */

  /* ========== 星河粒子系统 ========== */
  function createStarField(count, spread, baseSize, color, speed) {
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(count * 3);
    var vel = new Float32Array(count * 3);
    var sz = new Float32Array(count);
    var twinkleOffset = new Float32Array(count);

    for (var i = 0; i < count; i++) {
      var i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * spread;
      pos[i3 + 1] = (Math.random() - 0.5) * spread * 0.55;
      pos[i3 + 2] = (Math.random() - 0.5) * spread;
      vel[i3] = (Math.random() - 0.5) * speed;
      vel[i3 + 1] = (Math.random() - 0.5) * speed * 0.6;
      vel[i3 + 2] = (Math.random() - 0.5) * speed;
      sz[i] = Math.random() * baseSize + 0.2;
      twinkleOffset[i] = Math.random() * 6.28;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aVelocity', new THREE.BufferAttribute(vel, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    geo.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkleOffset, 1));

    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uHover: { value: 0.0 },
      },
      vertexShader: [
        'uniform float uTime;',
        'uniform float uPixelRatio;',
        'uniform float uHover;',
        'attribute vec3 aVelocity;',
        'attribute float aSize;',
        'attribute float aTwinkle;',
        'varying float vAlpha;',
        '',
        'void main() {',
        '  vec3 pos = position;',
        '  pos += aVelocity * uTime * 40.0;',
        '',
        '  float bound = 55.0;',
        '  pos = mod(pos + bound, bound * 2.0) - bound;',
        '',
        '  // 闪烁 - 每颗星不同频率和相位',
        '  float twinkle = sin(uTime * (1.5 + aSize * 0.8) + aTwinkle) * 0.5 + 0.5;',
        '  twinkle = pow(twinkle, 2.0);',
        '  vAlpha = 0.1 + 0.5 * twinkle + uHover * 0.15;',
        '',
        '  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);',
        '  gl_Position = projectionMatrix * mvPos;',
        '  gl_PointSize = (aSize + twinkle * 0.5) * uPixelRatio * (55.0 / -mvPos.z);',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uColor;',
        'varying float vAlpha;',
        '',
        'void main() {',
        '  float d = length(gl_PointCoord - 0.5);',
        '  if (d > 0.5) discard;',
        '',
        '  // 柔和的星光衰减',
        '  float core = smoothstep(0.5, 0.0, d);',
        '  float glow = smoothstep(0.5, 0.15, d);',
        '  float alpha = (core * 0.7 + glow * 0.3) * vAlpha;',
        '',
        '  // 中心偏白',
        '  vec3 color = mix(uColor, vec3(1.0), core * 0.4);',
        '',
        '  gl_FragColor = vec4(color, alpha);',
        '}',
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geo, mat);
  }

  // 多层星河: 远处小白星 + 近处蓝色星 + 少量亮星
  var starsWhite = createStarField(2000, 130, 1.0, 0xffffff, 0.008);
  var starsBlue = createStarField(800, 100, 1.4, 0x80b4ff, 0.012);
  var starsBright = createStarField(150, 120, 2.8, 0xd0e4ff, 0.005);
  scene.add(starsWhite);
  scene.add(starsBlue);
  scene.add(starsBright);

  /* ========== 加载 OBJ 模型 ========== */
  var droneGroup = new THREE.Group();
  scene.add(droneGroup);

  // 螺旋桨组 - 用于旋转动画
  var propellerGroups = [];   // [{group, pivotY}]
  var PROP_XRANGE_THRESHOLD = 80; // OBJ 原始坐标中 X 跨度 > 80 的视为螺旋桨

  var modelLoaded = false;
  var animStartTime = 0;

  var loader = new THREE.OBJLoader();
  loader.load(
    'models/drone.obj',
    function (obj) {
      var box = new THREE.Box3().setFromObject(obj);
      var center = box.getCenter(new THREE.Vector3());
      var size = box.getSize(new THREE.Vector3());

      var maxDim = Math.max(size.x, size.y, size.z);
      var scale = CONFIG.droneScale / maxDim;

      obj.position.sub(center);
      obj.scale.setScalar(scale);

      var box2 = new THREE.Box3().setFromObject(obj);
      var size2 = box2.getSize(new THREE.Vector3());
      var min2 = box2.min;

      var modelHeight = size2.y;
      var modelMin = min2.y;

      wireShaderMaterial.uniforms.uModelHeight.value = modelHeight;
      wireShaderMaterial.uniforms.uModelMin.value = modelMin;

      // 第一遍: 收集所有 mesh 并判断是否为螺旋桨
      var bodyMeshes = [];
      var propMeshes = [];

      obj.traverse(function (child) {
        if (child.isMesh) {
          child.geometry.computeVertexNormals();
          child.geometry.computeBoundingBox();
          var bb = child.geometry.boundingBox;
          var xRange = bb.max.x - bb.min.x;

          if (xRange > PROP_XRANGE_THRESHOLD) {
            propMeshes.push(child);
          } else {
            bodyMeshes.push(child);
          }
        }
      });

      // 添加机身部件 (仅线框 + 边缘线，不再有实体层)
      bodyMeshes.forEach(function (child) {
        var wireMesh = new THREE.Mesh(child.geometry, wireShaderMaterial);
        wireMesh.position.copy(child.position);
        wireMesh.rotation.copy(child.rotation);
        wireMesh.scale.copy(child.scale);
        droneGroup.add(wireMesh);

        var edges = new THREE.EdgesGeometry(child.geometry, 25);
        var edgeMat = new THREE.LineBasicMaterial({
          color: CONFIG.glowColor,
          transparent: true,
          opacity: 0.3,
        });
        var edgeLine = new THREE.LineSegments(edges, edgeMat);
        edgeLine.position.copy(child.position);
        edgeLine.rotation.copy(child.rotation);
        edgeLine.scale.copy(child.scale);
        droneGroup.add(edgeLine);
      });

      // 按 Z 坐标聚类螺旋桨到不同旋翼组
      // OBJ 中有前后两组旋翼 (Z≈-133 和 Z≈-36)
      var propClusters = {};
      propMeshes.forEach(function (child) {
        var bb = child.geometry.boundingBox;
        var cz = (bb.max.z + bb.min.z) / 2;
        // 量化到整数 10 以聚类
        var clusterKey = Math.round(cz / 10) * 10;
        if (!propClusters[clusterKey]) {
          propClusters[clusterKey] = [];
        }
        propClusters[clusterKey].push(child);
      });

      // 为每个旋翼组创建一个带 pivot 的 Group
      Object.keys(propClusters).forEach(function (key) {
        var cluster = propClusters[key];

        // 计算该组所有顶点的中心 (作为旋转轴心)
        var clusterBox = new THREE.Box3();
        cluster.forEach(function (child) {
          var bb = child.geometry.boundingBox.clone();
          bb.applyMatrix4(child.matrixWorld);
          clusterBox.union(bb);
        });
        var pivotCenter = clusterBox.getCenter(new THREE.Vector3());

        // 创建 pivot group
        var pivot = new THREE.Group();
        pivot.position.copy(pivotCenter);

        cluster.forEach(function (child) {
          // 线框
          var wireMesh = new THREE.Mesh(child.geometry, wireShaderMaterial);
          wireMesh.position.copy(child.position);
          wireMesh.position.sub(pivotCenter); // 相对于 pivot 中心
          wireMesh.rotation.copy(child.rotation);
          wireMesh.scale.copy(child.scale);
          pivot.add(wireMesh);

          // 边缘线
          var edges = new THREE.EdgesGeometry(child.geometry, 25);
          var edgeMat = new THREE.LineBasicMaterial({
            color: CONFIG.glowColor,
            transparent: true,
            opacity: 0.3,
          });
          var edgeLine = new THREE.LineSegments(edges, edgeMat);
          edgeLine.position.copy(child.position);
          edgeLine.position.sub(pivotCenter);
          edgeLine.rotation.copy(child.rotation);
          edgeLine.scale.copy(child.scale);
          pivot.add(edgeLine);
        });

        droneGroup.add(pivot);
        propellerGroups.push({ group: pivot, speed: 0.15 + Math.random() * 0.03 });
      });

      droneGroup.scale.copy(obj.scale);

      droneGroup.position.x = getDroneOffsetX();
      droneGroup.position.y = 0;
      droneGroup.position.z = 0;

      droneGroup.rotation.x = -0.15;
      droneGroup.rotation.z = 0.05;

      modelLoaded = true;
      animStartTime = performance.now() / 1000;
    },
    function () {},
    function (error) {
      console.warn('Drone OBJ load error:', error);
    }
  );

  /* ========== 缓动函数 ========== */
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ========== 鼠标交互 ========== */
  var animPhase = 'assembling';
  var mouseX = 0, mouseY = 0;
  var isHovering = false;
  var hoverValue = 0;       // 0~1 平滑过渡
  var targetHover = 0;

  // 整个 hero 区域监听鼠标
  var heroSection = canvas.closest('.hero-3d') || container;

  heroSection.addEventListener('mousemove', function (e) {
    var rect = heroSection.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  heroSection.addEventListener('mouseenter', function () {
    isHovering = true;
    targetHover = 1;
  });

  heroSection.addEventListener('mouseleave', function () {
    isHovering = false;
    targetHover = 0;
    mouseX = 0;
    mouseY = 0;
  });

  /* ========== 渲染循环 ========== */
  var rafId = null;

  function animate() {
    rafId = requestAnimationFrame(animate);

    var now = performance.now() / 1000;
    var elapsed = modelLoaded ? now - animStartTime : 0;

    // hover 平滑过渡
    hoverValue += (targetHover - hoverValue) * 0.04;

    // 更新所有粒子
    starsWhite.material.uniforms.uTime.value = now;
    starsWhite.material.uniforms.uHover.value = hoverValue;
    starsBlue.material.uniforms.uTime.value = now;
    starsBlue.material.uniforms.uHover.value = hoverValue;
    starsBright.material.uniforms.uTime.value = now;
    starsBright.material.uniforms.uHover.value = hoverValue;

    if (modelLoaded) {
      var progress = 0;
      if (animPhase === 'assembling') {
        progress = Math.min(elapsed / CONFIG.sliceDuration, 1);
        progress = easeInOutCubic(progress);
        if (progress >= 1) {
          animPhase = 'idle';
          progress = 1;
        }
      } else {
        progress = 1;
      }

      wireShaderMaterial.uniforms.uProgress.value = progress;
      wireShaderMaterial.uniforms.uTime.value = now;
      wireShaderMaterial.uniforms.uHover.value = hoverValue;

      // 螺旋桨旋转 (Y 轴)
      propellerGroups.forEach(function (pg) {
        pg.group.rotation.y += pg.speed;
      });

      // 自动旋转
      droneGroup.rotation.y += CONFIG.autoRotateSpeed;

      // 鼠标跟随 - hover 时响应更大
      var followStrength = 0.06 + hoverValue * 0.12;
      var targetRotX = -0.15 + mouseY * followStrength;
      var targetRotZ = 0.05 - mouseX * followStrength * 0.8;
      droneGroup.rotation.x += (targetRotX - droneGroup.rotation.x) * 0.03;
      droneGroup.rotation.z += (targetRotZ - droneGroup.rotation.z) * 0.03;

      // 悬浮
      droneGroup.position.x = getDroneOffsetX();
      droneGroup.position.y = Math.sin(now * 0.6) * 1.5;

      // 边缘线 (包括嵌套在螺旋桨组内的)
      droneGroup.traverse(function (child) {
        if (child.isLineSegments) {
          child.material.opacity = 0.12 + progress * 0.2 + hoverValue * 0.15;
        }
      });

      // 光源动态
      pointLight1.position.x = 50 + Math.sin(now * 0.4) * 12;
      pointLight1.position.y = 25 + Math.cos(now * 0.3) * 8;
      pointLight1.intensity = 2.5 + hoverValue * 1.0;

      pointLight2.intensity = 1.8 + hoverValue * 0.8;
    }

    // 相机跟随 - hover 时更灵敏
    var camFollow = 0.015 + hoverValue * 0.01;
    camera.position.x += (mouseX * (5 + hoverValue * 4) - camera.position.x) * camFollow;
    camera.position.y += (mouseY * -(3 + hoverValue * 2) - camera.position.y) * camFollow;
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
    if (modelLoaded) {
      droneGroup.position.x = getDroneOffsetX();
    }
  }

  window.addEventListener('resize', onResize);

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
