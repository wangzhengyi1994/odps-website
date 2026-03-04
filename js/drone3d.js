/**
 * 奥德帕斯首页 3D 无人机 Banner
 * 线框切割组装动画 + 粒子效果
 * 参考科技风格：青蓝色线框 + 黑色背景
 * 基于 Three.js 实现
 */
(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  /* ========== 配置 ========== */
  const CONFIG = {
    // 切割动画
    sliceDuration: 2.5,
    sliceGap: 2.0,
    sliceCount: 30,

    // 粒子
    particleCount: 1500,
    particleSize: 1.2,
    particleSpread: 100,

    // 科幻配色 - 青蓝色调
    wireColor: 0x00e5ff,        // 青色 - 主线框色
    wireColorSub: 0x40c4ff,     // 浅蓝色
    edgeColor: 0x00bcd4,        // 切割边缘色
    glowColor: 0x0091ea,        // 深蓝发光
    particleColor: 0x00e5ff,    // 粒子青色

    // 相机
    cameraFov: 40,
    cameraZ: 100,

    // 旋转
    autoRotateSpeed: 0.002,
  };

  /* ========== 场景初始化 ========== */
  const canvas = document.getElementById('drone-3d-canvas');
  if (!canvas) return;

  const container = canvas.parentElement;
  let width = container.clientWidth;
  let height = container.clientHeight;

  // 渲染器
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);  // 纯黑背景

  // 场景
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);  // 纯黑

  // 轻微雾效增加深度感
  scene.fog = new THREE.FogExp2(0x000000, 0.003);

  // 相机 - 正对画面中心，无人机通过模型偏移到右侧
  const camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, width / height, 0.1, 1000);
  camera.position.set(0, 0, CONFIG.cameraZ);
  camera.lookAt(0, 0, 0);

  // 计算无人机在右侧的 X 偏移量（基于视口宽高比）
  function getDroneOffsetX() {
    var vFov = CONFIG.cameraFov * Math.PI / 180;
    var visibleHeight = 2 * Math.tan(vFov / 2) * CONFIG.cameraZ;
    var visibleWidth = visibleHeight * (width / height);
    // 无人机放在右侧 1/4 处
    return visibleWidth * 0.2;
  }

  // 光源 - 青蓝色调光照
  const ambientLight = new THREE.AmbientLight(0x0a1628, 0.5);
  scene.add(ambientLight);

  // 主方向光 - 冷色调
  const dirLight = new THREE.DirectionalLight(0x40c4ff, 0.6);
  dirLight.position.set(30, 30, 50);
  scene.add(dirLight);

  // 青色点光源 - 从右上方照射
  const pointLight1 = new THREE.PointLight(0x00e5ff, 2.0, 250);
  pointLight1.position.set(40, 20, 40);
  scene.add(pointLight1);

  // 深蓝点光源 - 从左下方
  const pointLight2 = new THREE.PointLight(0x0091ea, 1.5, 200);
  pointLight2.position.set(-30, -15, 30);
  scene.add(pointLight2);

  // 背光 - 微弱轮廓光
  const backLight = new THREE.PointLight(0x00bcd4, 0.8, 150);
  backLight.position.set(0, 0, -40);
  scene.add(backLight);

  /* ========== 自定义着色器材质 ========== */

  // 线框着色器
  const wireShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColor: { value: new THREE.Color(CONFIG.wireColor) },
      uColorSub: { value: new THREE.Color(CONFIG.wireColorSub) },
      uEdgeColor: { value: new THREE.Color(CONFIG.edgeColor) },
      uSliceCount: { value: CONFIG.sliceCount },
      uSliceGap: { value: CONFIG.sliceGap },
      uModelHeight: { value: 1.0 },
      uModelMin: { value: 0.0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uProgress;
      uniform float uSliceCount;
      uniform float uSliceGap;
      uniform float uModelHeight;
      uniform float uModelMin;

      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vSliceId;

      void main() {
        vPosition = position;
        vNormal = normal;

        float axisVal = position.y;
        float normalized = (axisVal - uModelMin) / uModelHeight;
        float sliceId = floor(normalized * uSliceCount);
        vSliceId = sliceId;

        float offset = (sliceId - uSliceCount * 0.5) * uSliceGap * (1.0 - uProgress);

        vec3 pos = position;
        pos.y += offset;

        // 切割抖动
        float jitter = sin(sliceId * 3.14159 + uTime * 2.0) * 0.5 * (1.0 - uProgress);
        pos.x += jitter;
        pos.z += jitter * 0.5;

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uProgress;
      uniform vec3 uColor;
      uniform vec3 uColorSub;
      uniform vec3 uEdgeColor;
      uniform float uSliceCount;
      uniform float uModelHeight;
      uniform float uModelMin;

      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vSliceId;

      void main() {
        float normalized = (vPosition.y - uModelMin) / uModelHeight;

        // 切片边缘发光
        float slicePhase = fract(normalized * uSliceCount);
        float edgeDist = min(slicePhase, 1.0 - slicePhase);
        float edgeGlow = smoothstep(0.05, 0.0, edgeDist) * (1.0 - uProgress);

        // 渐变混色 - 从底部青色到顶部浅蓝
        vec3 baseColor = mix(uColor, uColorSub, normalized);

        // 切割边缘高亮
        vec3 finalColor = mix(baseColor, uEdgeColor * 1.5, edgeGlow * 0.8);

        // 菲涅尔轮廓光
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float fresnel = 1.0 - abs(dot(normalize(vNormal), viewDir));
        fresnel = pow(fresnel, 2.5);
        finalColor += vec3(0.0, 0.9, 1.0) * fresnel * 0.4;

        // 能量脉冲扫描
        float scanLine = sin(normalized * 40.0 - uTime * 3.0) * 0.5 + 0.5;
        scanLine = pow(scanLine, 8.0) * 0.3;
        finalColor += vec3(0.0, 1.0, 1.0) * scanLine * uProgress;

        // 整体呼吸
        float pulse = 0.92 + 0.08 * sin(uTime * 1.5 + normalized * 6.28);
        finalColor *= pulse;

        // 透明度
        float alpha = mix(0.5, 0.9, uProgress);
        alpha += edgeGlow * 0.3;
        alpha += fresnel * 0.2;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    wireframe: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // 实体表面着色器
  const solidShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColor: { value: new THREE.Color(CONFIG.wireColor) },
      uEdgeColor: { value: new THREE.Color(CONFIG.edgeColor) },
      uSliceCount: { value: CONFIG.sliceCount },
      uSliceGap: { value: CONFIG.sliceGap },
      uModelHeight: { value: 1.0 },
      uModelMin: { value: 0.0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uProgress;
      uniform float uSliceCount;
      uniform float uSliceGap;
      uniform float uModelHeight;
      uniform float uModelMin;

      varying vec3 vPosition;
      varying vec3 vNormal;
      varying float vSliceId;

      void main() {
        vPosition = position;
        vNormal = normal;

        float normalized = (position.y - uModelMin) / uModelHeight;
        float sliceId = floor(normalized * uSliceCount);
        vSliceId = sliceId;

        float offset = (sliceId - uSliceCount * 0.5) * uSliceGap * (1.0 - uProgress);

        vec3 pos = position;
        pos.y += offset;

        float jitter = sin(sliceId * 3.14159 + uTime * 2.0) * 0.5 * (1.0 - uProgress);
        pos.x += jitter;
        pos.z += jitter * 0.5;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uProgress;
      uniform vec3 uColor;
      uniform vec3 uEdgeColor;
      uniform float uSliceCount;
      uniform float uModelHeight;
      uniform float uModelMin;

      varying vec3 vPosition;
      varying vec3 vNormal;
      varying float vSliceId;

      void main() {
        float normalized = (vPosition.y - uModelMin) / uModelHeight;

        float slicePhase = fract(normalized * uSliceCount);
        float edgeDist = min(slicePhase, 1.0 - slicePhase);
        float edgeGlow = smoothstep(0.05, 0.0, edgeDist) * (1.0 - uProgress);

        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float diffuse = max(dot(normalize(vNormal), lightDir), 0.0) * 0.5 + 0.5;

        vec3 baseColor = uColor * diffuse * 0.15;
        vec3 finalColor = mix(baseColor, uEdgeColor * 0.6, edgeGlow);

        float alpha = mix(0.05, 0.12, uProgress);
        alpha += edgeGlow * 0.15;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    wireframe: false,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  /* ========== 粒子系统 ========== */
  function createParticles() {
    var count = CONFIG.particleCount;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var velocities = new Float32Array(count * 3);
    var sizes = new Float32Array(count);

    for (var i = 0; i < count; i++) {
      var i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * CONFIG.particleSpread;
      positions[i3 + 1] = (Math.random() - 0.5) * CONFIG.particleSpread * 0.6;
      positions[i3 + 2] = (Math.random() - 0.5) * CONFIG.particleSpread;

      velocities[i3] = (Math.random() - 0.5) * 0.015;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.015;

      sizes[i] = Math.random() * CONFIG.particleSize + 0.3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    var material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(CONFIG.particleColor) },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;
        attribute vec3 aVelocity;
        attribute float aSize;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          pos += aVelocity * uTime * 50.0;

          float bound = 50.0;
          pos = mod(pos + bound, bound * 2.0) - bound;

          vAlpha = 0.15 + 0.2 * sin(uTime * 1.0 + position.x * 0.08);

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPos;
          gl_PointSize = aSize * uPixelRatio * (60.0 / -mvPos.z);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.05, d) * vAlpha;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }

  var particles = createParticles();
  scene.add(particles);

  /* ========== 加载 OBJ 模型 ========== */
  var droneGroup = new THREE.Group();
  scene.add(droneGroup);

  var modelLoaded = false;
  var animStartTime = 0;

  var loader = new THREE.OBJLoader();
  loader.load(
    'models/drone.obj',
    function (obj) {
      var box = new THREE.Box3().setFromObject(obj);
      var center = box.getCenter(new THREE.Vector3());
      var size = box.getSize(new THREE.Vector3());

      // 归一化
      var maxDim = Math.max(size.x, size.y, size.z);
      var scale = 45 / maxDim;

      obj.position.sub(center);
      obj.scale.setScalar(scale);

      var box2 = new THREE.Box3().setFromObject(obj);
      var size2 = box2.getSize(new THREE.Vector3());
      var min2 = box2.min;

      var modelHeight = size2.y;
      var modelMin = min2.y;

      wireShaderMaterial.uniforms.uModelHeight.value = modelHeight;
      wireShaderMaterial.uniforms.uModelMin.value = modelMin;
      solidShaderMaterial.uniforms.uModelHeight.value = modelHeight;
      solidShaderMaterial.uniforms.uModelMin.value = modelMin;

      obj.traverse(function (child) {
        if (child.isMesh) {
          child.geometry.computeVertexNormals();

          // 线框层
          var wireMesh = new THREE.Mesh(child.geometry, wireShaderMaterial);
          wireMesh.position.copy(child.position);
          wireMesh.rotation.copy(child.rotation);
          wireMesh.scale.copy(child.scale);
          droneGroup.add(wireMesh);

          // 半透明实体层
          var solidMesh = new THREE.Mesh(child.geometry, solidShaderMaterial);
          solidMesh.position.copy(child.position);
          solidMesh.rotation.copy(child.rotation);
          solidMesh.scale.copy(child.scale);
          droneGroup.add(solidMesh);

          // 边缘高亮线
          var edges = new THREE.EdgesGeometry(child.geometry, 25);
          var edgeMat = new THREE.LineBasicMaterial({
            color: CONFIG.wireColor,
            transparent: true,
            opacity: 0.25,
          });
          var edgeLine = new THREE.LineSegments(edges, edgeMat);
          edgeLine.position.copy(child.position);
          edgeLine.rotation.copy(child.rotation);
          edgeLine.scale.copy(child.scale);
          droneGroup.add(edgeLine);
        }
      });

      droneGroup.scale.copy(obj.scale);

      // 无人机定位到画面右侧居中
      droneGroup.position.x = getDroneOffsetX();
      droneGroup.position.y = 0;
      droneGroup.position.z = 0;

      // 轻微倾斜 - 科技感角度
      droneGroup.rotation.x = -0.2;
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

  /* ========== 动画状态 ========== */
  var animPhase = 'assembling';
  var mouseX = 0, mouseY = 0;

  container.addEventListener('mousemove', function (e) {
    var rect = container.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  /* ========== 渲染循环 ========== */
  var rafId = null;

  function animate() {
    rafId = requestAnimationFrame(animate);

    var now = performance.now() / 1000;
    var elapsed = modelLoaded ? now - animStartTime : 0;

    // 粒子
    particles.material.uniforms.uTime.value = now;

    if (modelLoaded) {
      // 切割动画
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
      solidShaderMaterial.uniforms.uProgress.value = progress;
      solidShaderMaterial.uniforms.uTime.value = now;

      // 自动旋转
      droneGroup.rotation.y += CONFIG.autoRotateSpeed;

      // 鼠标跟随（微量）
      var targetRotX = -0.2 + mouseY * 0.08;
      var targetRotZ = 0.05 - mouseX * 0.06;
      droneGroup.rotation.x += (targetRotX - droneGroup.rotation.x) * 0.025;
      droneGroup.rotation.z += (targetRotZ - droneGroup.rotation.z) * 0.025;

      // 悬浮 - Y 方向微量上下浮动，X 保持右侧
      droneGroup.position.x = getDroneOffsetX();
      droneGroup.position.y = Math.sin(now * 0.6) * 1.2;

      // 边缘线透明度
      droneGroup.children.forEach(function (child) {
        if (child.isLineSegments) {
          child.material.opacity = 0.1 + progress * 0.2;
        }
      });

      // 点光源随时间微动
      pointLight1.position.x = 40 + Math.sin(now * 0.5) * 10;
      pointLight1.position.y = 20 + Math.cos(now * 0.3) * 8;
    }

    // 相机 - 只做微量跟随，Y 始终围绕 0 居中
    camera.position.x += (mouseX * 5 - camera.position.x) * 0.015;
    camera.position.y += (mouseY * -3 - camera.position.y) * 0.015;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();

  /* ========== 响应式 ========== */
  function onResize() {
    width = container.clientWidth;
    height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    particles.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    // 重新计算无人机右侧偏移
    if (modelLoaded) {
      droneGroup.position.x = getDroneOffsetX();
    }
  }

  window.addEventListener('resize', onResize);

  // 可见性检测
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
