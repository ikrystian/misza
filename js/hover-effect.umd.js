/**
 * hover-effect by Robin Delaporte (https://github.com/robin-dela/hover-effect)
 * Adapted with GSAP 3 support, ResizeObserver, and robust texture loading
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('three'), require('gsap')) :
  typeof define === 'function' && define.amd ? define(['three', 'gsap'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.hoverEffect = factory(global.THREE, global.gsap || global.TweenMax));
})(this, function (THREE, gsap) {
  'use strict';

  return function hoverEffect(opts) {
    if (!opts) opts = {};
    var parent = opts.parent;
    var displacementImage = opts.displacementImage;
    var image1 = opts.image1;
    var image2 = opts.image2;
    var intensity = opts.intensity !== undefined ? opts.intensity : 0.3;
    var intensity1 = opts.intensity1 !== undefined ? opts.intensity1 : intensity;
    var intensity2 = opts.intensity2 !== undefined ? opts.intensity2 : intensity;
    var speedIn = opts.speedIn !== undefined ? opts.speedIn : 1.2;
    var speedOut = opts.speedOut !== undefined ? opts.speedOut : 1.0;
    var angle = opts.angle !== undefined ? opts.angle : Math.PI / 4;
    var angle1 = opts.angle1 !== undefined ? opts.angle1 : angle;
    var angle2 = opts.angle2 !== undefined ? opts.angle2 : -angle * 3;
    var easing = opts.easing || 'expo.out';
    var hover = opts.hover !== undefined ? opts.hover : true;
    var onLoaded = opts.onLoaded;

    if (!parent || !image1 || !image2 || !displacementImage) {
      console.warn('hoverEffect: missing required parameters (parent, image1, image2, displacementImage)');
      return;
    }

    var w = parent.offsetWidth || 300;
    var h = parent.offsetHeight || 200;

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(w / -2, w / 2, h / 2, h / -2, 1, 1000);
    camera.position.z = 1;

    var renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xffffff, 0.0);
    renderer.setSize(w, h);

    var domEl = renderer.domElement;
    parent.appendChild(domEl);

    var render = function () {
      renderer.render(scene, camera);
    };

    var loader = new THREE.TextureLoader();
    loader.crossOrigin = '';

    var loadedCount = 0;
    var totalToLoad = 3;
    var onTextureLoaded = function () {
      loadedCount++;
      render();
      if (loadedCount >= totalToLoad) {
        if (typeof onLoaded === 'function') onLoaded();
      }
    };

    var disp = loader.load(displacementImage, onTextureLoaded);
    disp.magFilter = disp.minFilter = THREE.LinearFilter;

    var texture1 = loader.load(image1, onTextureLoaded);
    var texture2 = loader.load(image2, onTextureLoaded);
    texture1.magFilter = texture1.minFilter = THREE.LinearFilter;
    texture2.magFilter = texture2.minFilter = THREE.LinearFilter;

    var mat = new THREE.ShaderMaterial({
      uniforms: {
        intensity1: { type: 'f', value: intensity1 },
        intensity2: { type: 'f', value: intensity2 },
        dispFactor: { type: 'f', value: 0.0 },
        angle1: { type: 'f', value: angle1 },
        angle2: { type: 'f', value: angle2 },
        texture1: { type: 't', value: texture1 },
        texture2: { type: 't', value: texture2 },
        disp: { type: 't', value: disp }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec2 vUv;',
        'uniform float dispFactor;',
        'uniform sampler2D disp;',
        'uniform sampler2D texture1;',
        'uniform sampler2D texture2;',
        'uniform float intensity1;',
        'uniform float intensity2;',
        'uniform float angle1;',
        'uniform float angle2;',
        '',
        'mat2 getRotM(float angle) {',
        '  float s = sin(angle);',
        '  float c = cos(angle);',
        '  return mat2(c, -s, s, c);',
        '}',
        '',
        'void main() {',
        '  vec4 disp = texture2D(disp, vUv);',
        '  vec2 dispVec = vec2(disp.r, disp.g);',
        '',
        '  mat2 rot1 = getRotM(angle1);',
        '  mat2 rot2 = getRotM(angle2);',
        '',
        '  vec2 distortedPosition1 = vUv + rot1 * dispVec * intensity1 * dispFactor;',
        '  vec2 distortedPosition2 = vUv + rot2 * dispVec * intensity2 * (1.0 - dispFactor);',
        '',
        '  vec4 _texture1 = texture2D(texture1, distortedPosition1);',
        '  vec4 _texture2 = texture2D(texture2, distortedPosition2);',
        '',
        '  gl_FragColor = mix(_texture1, _texture2, dispFactor);',
        '}'
      ].join('\n'),
      transparent: true,
      opacity: 1.0
    });

    var geometry = new THREE.PlaneBufferGeometry(w, h, 1);
    var mesh = new THREE.Mesh(geometry, mat);
    scene.add(mesh);

    var tween = null;
    var animateIn = function () {
      if (tween) tween.kill();
      if (gsap && gsap.to) {
        tween = gsap.to(mat.uniforms.dispFactor, {
          duration: speedIn,
          value: 1,
          ease: easing,
          onUpdate: render
        });
      } else {
        mat.uniforms.dispFactor.value = 1;
        render();
      }
    };

    var animateOut = function () {
      if (tween) tween.kill();
      if (gsap && gsap.to) {
        tween = gsap.to(mat.uniforms.dispFactor, {
          duration: speedOut,
          value: 0,
          ease: easing,
          onUpdate: render
        });
      } else {
        mat.uniforms.dispFactor.value = 0;
        render();
      }
    };

    if (hover) {
      parent.addEventListener('mouseenter', animateIn);
      parent.addEventListener('mouseleave', animateOut);
      parent.addEventListener('touchstart', animateIn, { passive: true });
      parent.addEventListener('touchend', animateOut, { passive: true });
    }

    var resize = function () {
      var newW = parent.offsetWidth;
      var newH = parent.offsetHeight;
      if (!newW || !newH) return;
      camera.left = newW / -2;
      camera.right = newW / 2;
      camera.top = newH / 2;
      camera.bottom = newH / -2;
      camera.updateProjectionMatrix();

      renderer.setSize(newW, newH);
      mesh.geometry.dispose();
      mesh.geometry = new THREE.PlaneBufferGeometry(newW, newH, 1);
      render();
    };

    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var rect = entries[i].contentRect;
          if (rect.width > 0 && rect.height > 0) {
            resize();
          }
        }
      });
      ro.observe(parent);
    } else {
      window.addEventListener('resize', resize);
    }

    // Initial render
    render();

    return {
      next: animateIn,
      previous: animateOut,
      resize: resize,
      destroy: function () {
        if (hover) {
          parent.removeEventListener('mouseenter', animateIn);
          parent.removeEventListener('mouseleave', animateOut);
        }
        if (ro) ro.disconnect();
        window.removeEventListener('resize', resize);
        if (domEl && domEl.parentNode) domEl.parentNode.removeChild(domEl);
        renderer.dispose();
        geometry.dispose();
        mat.dispose();
        texture1.dispose();
        texture2.dispose();
        disp.dispose();
      }
    };
  };
});
