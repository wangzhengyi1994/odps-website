/**
 * 奥德帕斯首页 3D 无人机 Banner
 * 线框切割组装动画 + 粒子效果
 * 基于 Three.js 实现
 */
(function () {
  'use strict';

  // 确保 THREE 已加载
  if (typeof THREE === 'undefined') return;

  /* ========== 配置 ========== */
  const CONFIG = {
    // 切割动画
    sliceDuration: 2.5,       // 切割组装动画时长(秒)
    sliceAxis: 'y',           // 切割轴
    sliceGap: 2.0,            // 切割层间距
    sliceCount: 30,           // 切割层数

    // 粒子
    particleCount: 2000,
    particleSize: 1.5,
    particleSpread: 80,

    // 颜色
    wireColor: 0x183BFF,       // 主色 --primary-6
    wireColorSub: 0x6B7FFF,    // 浅色
    edgeColor: 0x00D4FF,       // 切割边缘发光色
    particleColor: 0x183BFF,
    bgColor: 0x0a0e27,         // 深色背景

    // 相机
    cameraFov: 45,
    cameraZ: 120,

    // 旋转
    autoRotateSpeed: 0.003,
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
    alpha: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // 场景
  const scene = new THREE.Scene();

  // 相机
  const camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, width / height, 0.1, 1000);
  camera.position.set(0, 10, CONFIG.cameraZ);
  camera.lookAt(0, 0, 0);

  // 光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(50, 50, 50);
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(CONFIG.wireColor, 1.5, 200);
  pointLight.position.set(-30, 20, 40);
  scene.add(pointLight);

  const pointLight2 = new THREE.PointLight(CONFIG.edgeColor, 1.0, 200);
  pointLight2.position.set(30, -10, 30);
  scene.add(pointLight2);

  /* ========== 自定义着色器材质 ========== */

  // 线框着色器 - 带切割面发光效果
  const wireShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },        // 0 = 完全切开, 1 = 完全合拢
      uColor: { value: new THREE.Color(CONFIG.wireColor) },
      uColorSub: { value: new THREE.Color(CONFIG.wireColorSub) },
      uEdgeColor: { value: new THREE.Color(CONFIG.edgeColor) },
      uSliceAxis: { value: 1 },        // 0=x, 1=y, 2=z
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
      uniform int uSliceAxis;

      varying vec3 vPosition;
      varying vec3 vNormal;
      varying float vSliceId;

      void main() {
        vPosition = position;
        vNormal = normal;

        // 计算归一化位置 (0~1)
        float axisVal = position.y;
        float normalized = (axisVal - uModelMin) / uModelHeight;

        // 计算所在切片ID
        float sliceId = floor(normalized * uSliceCount);
        vSliceId = sliceId;

        // 切割偏移: 每片按ID偏移，进度控制
        float offset = (sliceId - uSliceCount * 0.5) * uSliceGap * (1.0 - uProgress);

        vec3 pos = position;
        pos.y += offset;

        // 轻微的随机抖动
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
      uniform vec3 uColorSub;
      uniform vec3 uEdgeColor;
      uniform float uSliceCount;
      uniform float uModelHeight;
      uniform float uModelMin;

      varying vec3 vPosition;
      varying vec3 vNormal;
      varying float vSliceId;

      void main() {
        // 归一化位置
        float normalized = (vPosition.y - uModelMin) / uModelHeight;

        // 切片边缘检测
        float slicePhase = fract(normalized * uSliceCount);
        float edgeDist = min(slicePhase, 1.0 - slicePhase);
        float edgeGlow = smoothstep(0.05, 0.0, edgeDist) * (1.0 - uProgress);

        // 基础颜色混合
        float gradient = normalized;
        vec3 baseColor = mix(uColor, uColorSub, gradient);

        // 边缘发光
        vec3 finalColor = mix(baseColor, uEdgeColor, edgeGlow * 0.8);

        // 菲涅尔边缘光
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float fresnel = 1.0 - abs(dot(normalize(vNormal), viewDir));
        fresnel = pow(fresnel, 3.0);
        finalColor += uEdgeColor * fresnel * 0.3;

        // 整体脉冲
        float pulse = 0.9 + 0.1 * sin(uTime * 2.0 + normalized * 6.28);
        finalColor *= pulse;

        // 透明度: 合拢后更实，切开时半透
        float alpha = mix(0.6, 0.85, uProgress);
        alpha += edgeGlow * 0.3;
        alpha += fresnel * 0.15;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    wireframe: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // 实体表面着色器（半透明实体，切割动画同步）
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

        // 切片边缘
        float slicePhase = fract(normalized * uSliceCount);
        float edgeDist = min(slicePhase, 1.0 - slicePhase);
        float edgeGlow = smoothstep(0.05, 0.0, edgeDist) * (1.0 - uProgress);

        // 法线光照
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float diffuse = max(dot(normalize(vNormal), lightDir), 0.0) * 0.5 + 0.5;

        vec3 baseColor = uColor * diffuse * 0.3;
        vec3 finalColor = mix(baseColor, uEdgeColor * 0.5, edgeGlow);

        float alpha = mix(0.08, 0.2, uProgress);
        alpha += edgeGlow * 0.2;

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
    const count = CONFIG.particleCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * CONFIG.particleSpread;
      positions[i3 + 1] = (Math.random() - 0.5) * CONFIG.particleSpread;
      positions[i3 + 2] = (Math.random() - 0.5) * CONFIG.particleSpread;

      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

      sizes[i] = Math.random() * CONFIG.particleSize + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
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
          pos += aVelocity * uTime * 60.0;

          // 循环
          float bound = 40.0;
          pos = mod(pos + bound, bound * 2.0) - bound;

          vAlpha = 0.3 + 0.3 * sin(uTime * 1.5 + position.x * 0.1);

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPos;
          gl_PointSize = aSize * uPixelRatio * (80.0 / -mvPos.z);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, d) * vAlpha;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    return particles;
  }

  const particles = createParticles();
  scene.add(particles);

  /* ========== 加载 OBJ 模型 ========== */
  let droneGroup = new THREE.Group();
  scene.add(droneGroup);

  let modelLoaded = false;
  let animStartTime = 0;

  const loader = new THREE.OBJLoader();
  loader.load(
    'models/drone.obj',
    function (obj) {
      // 计算包围盒
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // 归一化大小
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 50 / maxDim;

      obj.position.sub(center);
      obj.scale.setScalar(scale);

      // 重新计算包围盒
      const box2 = new THREE.Box3().setFromObject(obj);
      const size2 = box2.getSize(new THREE.Vector3());
      const min2 = box2.min;

      // 更新着色器 uniforms
      const modelHeight = size2.y;
      const modelMin = min2.y;

      wireShaderMaterial.uniforms.uModelHeight.value = modelHeight;
      wireShaderMaterial.uniforms.uModelMin.value = modelMin;
      solidShaderMaterial.uniforms.uModelHeight.value = modelHeight;
      solidShaderMaterial.uniforms.uModelMin.value = modelMin;

      // 遍历子对象，应用着色器
      obj.traverse(function (child) {
        if (child.isMesh) {
          // 计算法线（OBJ 可能没有）
          child.geometry.computeVertexNormals();

          // 线框层
          const wireMesh = new THREE.Mesh(child.geometry, wireShaderMaterial);
          wireMesh.position.copy(child.position);
          wireMesh.rotation.copy(child.rotation);
          wireMesh.scale.copy(child.scale);
          droneGroup.add(wireMesh);

          // 实体半透明层
          const solidMesh = new THREE.Mesh(child.geometry, solidShaderMaterial);
          solidMesh.position.copy(child.position);
          solidMesh.rotation.copy(child.rotation);
          solidMesh.scale.copy(child.scale);
          droneGroup.add(solidMesh);

          // 边缘线条
          const edges = new THREE.EdgesGeometry(child.geometry, 30);
          const edgeMat = new THREE.LineBasicMaterial({
            color: CONFIG.edgeColor,
            transparent: true,
            opacity: 0.15,
          });
          const edgeLine = new THREE.LineSegments(edges, edgeMat);
          edgeLine.position.copy(child.position);
          edgeLine.rotation.copy(child.rotation);
          edgeLine.scale.copy(child.scale);
          droneGroup.add(edgeLine);
        }
      });

      droneGroup.position.copy(obj.position);
      droneGroup.scale.copy(obj.scale);

      // 轻微倾斜
      droneGroup.rotation.x = -0.15;
      droneGroup.rotation.z = 0.05;

      modelLoaded = true;
      animStartTime = performance.now() / 1000;
    },
    function (xhr) {
      // 加载进度
    },
    function (error) {
      console.warn('Drone OBJ load error:', error);
    }
  );

  /* ========== 缓动函数 ========== */
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ========== 动画状态 ========== */
  let animPhase = 'assembling';  // assembling -> idle
  let mouseX = 0, mouseY = 0;

  // 鼠标交互
  container.addEventListener('mousemove', function (e) {
    const rect = container.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  /* ========== 渲染循环 ========== */
  let rafId = null;

  function animate() {
    rafId = requestAnimationFrame(animate);

    const now = performance.now() / 1000;
    const elapsed = modelLoaded ? now - animStartTime : 0;

    // 更新粒子
    particles.material.uniforms.uTime.value = now;

    if (modelLoaded) {
      // 切割动画进度
      let progress = 0;
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

      // 更新着色器 uniforms
      wireShaderMaterial.uniforms.uProgress.value = progress;
      wireShaderMaterial.uniforms.uTime.value = now;
      solidShaderMaterial.uniforms.uProgress.value = progress;
      solidShaderMaterial.uniforms.uTime.value = now;

      // 自动旋转
      droneGroup.rotation.y += CONFIG.autoRotateSpeed;

      // 鼠标跟随（轻微）
      const targetRotX = -0.15 + mouseY * 0.1;
      const targetRotZ = 0.05 - mouseX * 0.08;
      droneGroup.rotation.x += (targetRotX - droneGroup.rotation.x) * 0.03;
      droneGroup.rotation.z += (targetRotZ - droneGroup.rotation.z) * 0.03;

      // 轻微悬浮
      droneGroup.position.y = Math.sin(now * 0.8) * 1.5;

      // 边缘线随进度显隐
      droneGroup.children.forEach(function (child) {
        if (child.isLineSegments) {
          child.material.opacity = 0.05 + progress * 0.15;
        }
      });
    }

    // 相机轻微跟随鼠标
    camera.position.x += (mouseX * 8 - camera.position.x) * 0.02;
    camera.position.y += (10 - mouseY * 5 - camera.position.y) * 0.02;
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
  }

  window.addEventListener('resize', onResize);

  // 可见性检测 - 不在视口内时暂停渲染
  const observer = new IntersectionObserver(function (entries) {
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
