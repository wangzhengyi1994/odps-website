/**
 * 3D 地球飞线 - 基于 earth-flyline (UMD: window.earthFlyLine)
 * 展示从上海到全球各节点的服务网络
 */
(function () {
  'use strict';

  // 上海坐标 (出发点)
  var SHANGHAI = { lon: 121.47, lat: 31.23 };

  // 目标点位
  var TARGETS = [
    { name: '美国',     city: '洛杉矶',     lon: -118.24, lat: 34.05 },
    { name: '巴西',     city: '巴西利亚',   lon: -47.93,  lat: -15.78 },
    { name: '荷兰',     city: '阿姆斯特丹', lon: 4.90,    lat: 52.37 },
    { name: '匈牙利',   city: '布达佩斯',   lon: 19.04,   lat: 47.50 },
    { name: '德国',     city: '法兰克福',   lon: 8.68,    lat: 50.11 },
    { name: '韩国',     city: '首尔',       lon: 126.98,  lat: 37.57 },
    { name: '日本',     city: '东京',       lon: 139.69,  lat: 35.69 },
    { name: '中国',     city: '深圳',       lon: 114.06,  lat: 22.54 },
    { name: '中国',     city: '香港',       lon: 114.17,  lat: 22.32 },
    { name: '澳洲',    city: 'Burwood',    lon: 151.10,  lat: -33.88 }
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
            show: true
          },
          pathStyle: {
            color: '#3553FD',
            show: true
          },
          flyLineStyle: {
            color: '#6C81FB',
            duration: 3000,
            delay: 0,
            repeat: Infinity
          },
          scatterStyle: {
            color: '#6C81FB'
          },
          hoverRegionStyle: {
            areaColor: '#2a3a6a'
          },
          regions: {
            China: {
              areaColor: '#1e3a6e'
            }
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
