/**
 * 3D 地球飞线 - 基于 earth-flyline (UMD: window.earthFlyLine)
 * 展示从上海到全球各节点的服务网络
 */
(function () {
  'use strict';

  // 上海坐标 (出发点)
  var SHANGHAI = { lon: 121.47, lat: 31.23 };

  // 目标点位 — 全国重点城市（精简，避免过密）
  var TARGETS = [
    { name: '北京',     lon: 116.41, lat: 39.90 },
    { name: '广州',     lon: 113.26, lat: 23.13 },
    { name: '深圳',     lon: 114.06, lat: 22.54 },
    { name: '成都',     lon: 104.07, lat: 30.67 },
    { name: '武汉',     lon: 114.30, lat: 30.59 },
    { name: '重庆',     lon: 106.55, lat: 29.56 },
    { name: '西安',     lon: 108.94, lat: 34.26 },
    { name: '哈尔滨',   lon: 126.63, lat: 45.75 },
    { name: '沈阳',     lon: 123.43, lat: 41.80 },
    { name: '昆明',     lon: 102.83, lat: 25.02 },
    { name: '乌鲁木齐', lon: 87.62,  lat: 43.83 },
    { name: '拉萨',     lon: 91.11,  lat: 29.65 },
    { name: '海口',     lon: 110.35, lat: 20.02 },
    { name: '兰州',     lon: 103.83, lat: 36.06 },
    { name: '福州',     lon: 119.30, lat: 26.08 }
  ];

  var container = document.getElementById('earth-container');
  if (!container) return;

  // 加载 GeoJSON
  function loadJSON(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try { cb(JSON.parse(xhr.responseText)); } catch (e) { console.warn('GeoJSON parse error', e); }
      }
    };
    xhr.send();
  }

  // IntersectionObserver — 只在可见时初始化
  var initialized = false;
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !initialized) {
        initialized = true;
        obs.disconnect();
        initGlobe();
      }
    });
  }, { threshold: 0.05 });
  obs.observe(container);

  function initGlobe() {
    if (typeof earthFlyLine === 'undefined') {
      console.warn('earth-flyline not loaded');
      return;
    }

    loadJSON('data/world.json', function (geojson) {
      // 注册地图
      earthFlyLine.registerMap('world', geojson);

      // 初始化
      var chart = earthFlyLine.init({
        dom: container,
        map: 'world',
        autoRotate: true,
        rotateSpeed: 0.005,
        mode: '3d',
        config: {
          R: 140,
          stopRotateByHover: true,
          earth: {
            color: '#0a1628',
            material: 'MeshPhongMaterial'
          },
          bgStyle: {
            color: 'transparent',
            opacity: 0
          },
          mapStyle: {
            areaColor: '#162040',
            lineColor: '#3553FD'
          },
          spriteStyle: {
            color: '#3553FD',
            show: true,
            size: 2
          },
          pathStyle: {
            color: '#3553FD',
            show: true
          },
          flyLineStyle: {
            color: '#6C81FB',
            duration: 3000,
            delay: 0,
            repeat: Infinity,
            size: 0.8
          },
          scatterStyle: {
            color: '#6C81FB',
            size: 1.5
          },
          hoverRegionStyle: {
            areaColor: '#162040'
          },
          enableZoom: false
        }
      });

      // 构建飞线数据
      var flyLines = TARGETS.map(function (t, i) {
        return {
          from: {
            lon: SHANGHAI.lon,
            lat: SHANGHAI.lat,
            id: 'sh'
          },
          to: {
            lon: t.lon,
            lat: t.lat,
            id: 'to-' + i
          }
        };
      });

      // 添加飞线
      try {
        chart.addData('flyLine', flyLines);
      } catch (e) {
        console.warn('addData flyLine failed, trying setData:', e);
        try { chart.setData('flyLine', flyLines); } catch (e2) { console.warn('setData also failed:', e2); }
      }
    });
  }
})();
