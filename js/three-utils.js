// ===============================================
//  أدوات Three.js: صور مصغّرة، عارض منتج، إضاءة موحدة
// ===============================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildModel } from './models.js';
import { prefersReducedMotion } from './state.js';

export const hasWebGL = (() => {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; }
})();

// بيئة الإضاءة لازم تتعمل لكل رندرر (كل كانفاس ليه سياق WebGL مستقل)
const envByRenderer = new WeakMap();
export function getEnv(renderer) {
  if (!envByRenderer.has(renderer)) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    envByRenderer.set(renderer, pmrem.fromScene(new RoomEnvironment(), 0.04).texture);
    pmrem.dispose();
  }
  return envByRenderer.get(renderer);
}

export function addLights(scene, intensity = 1) {
  const key = new THREE.DirectionalLight('#fff4e0', 2.2 * intensity); key.position.set(3, 5, 4); scene.add(key);
  const fill = new THREE.DirectionalLight('#f4a7c3', 0.7 * intensity); fill.position.set(-4, 2, -2); scene.add(fill);
  const rim = new THREE.DirectionalLight('#e6c27a', 1.1 * intensity); rim.position.set(0, 3, -5); scene.add(rim);
  scene.add(new THREE.AmbientLight('#8c7aa8', 0.5 * intensity));
}

export function disposeGroup(g) {
  g.traverse((o) => {
    if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }
  });
}

// ———— صور مصغّرة (رندرر واحد مشترك → صورة) ————
const thumbCache = new Map();
let thumbCtx = null;
function getThumbCtx() {
  if (thumbCtx) return thumbCtx;
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(360, 320, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.environment = getEnv(renderer);
  addLights(scene);
  const camera = new THREE.PerspectiveCamera(32, 360 / 320, 0.1, 20);
  camera.position.set(1.6, 1.1, 2.4); camera.lookAt(0, -0.05, 0);
  thumbCtx = { canvas, renderer, scene, camera };
  return thumbCtx;
}
export function thumbnail(product) {
  const key = `${product.id}|${product.model}|${(product.colors || []).join()}|${product.glitter}`;
  if (thumbCache.has(key)) return thumbCache.get(key);
  if (!hasWebGL) return '';
  const { canvas, renderer, scene, camera } = getThumbCtx();
  const g = buildModel(product.model, product.colors, product.glitter);
  g.rotation.y = -0.5;
  scene.add(g);
  renderer.render(scene, camera);
  const url = canvas.toDataURL('image/png');
  scene.remove(g); disposeGroup(g);
  thumbCache.set(key, url);
  return url;
}

// ———— عارض منتج واحد (صفحة المنتج + اصنع منتجك) ————
export class Viewer {
  constructor(container, { autoRotate = true } = {}) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    container.prepend(this.canvas);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.scene = new THREE.Scene();
    this.scene.environment = getEnv(this.renderer);
    addLights(this.scene);
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    this.camera.position.set(1.8, 1.2, 2.8);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false; this.controls.minDistance = 1.6; this.controls.maxDistance = 6;
    this.controls.autoRotate = autoRotate && !prefersReducedMotion(); this.controls.autoRotateSpeed = 1.6;
    this.controls.target.set(0, -0.05, 0);
    // أرضية ظل ناعمة
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.3, 48), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28 }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = -0.75; this.scene.add(disc);
    const halo = new THREE.Mesh(new THREE.RingGeometry(1.25, 1.45, 64), new THREE.MeshBasicMaterial({ color: '#e6c27a', transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = -0.74; this.scene.add(halo);
    this.model = null;
    this.clock = new THREE.Clock();
    this._resize = () => this.resize();
    this.ro = new ResizeObserver(this._resize); this.ro.observe(container);
    this.resize();
    this.alive = true;
    this.loop();
  }
  resize() {
    const w = this.container.clientWidth || 300, h = this.container.clientHeight || 300;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  set(type, colors, glitter, opts) {
    if (this.model) { this.scene.remove(this.model); disposeGroup(this.model); }
    this.model = buildModel(type, colors, glitter, opts);
    // توحيد الحجم والموضع: أكبر بُعد ≈ 1.5 والقاعدة على الأرضية
    const bb = new THREE.Box3().setFromObject(this.model);
    const size = bb.getSize(new THREE.Vector3()), center = bb.getCenter(new THREE.Vector3());
    const s = 1.5 / Math.max(size.x, size.y, size.z, 0.001);
    this.fit = s; this.model.scale.setScalar(s);
    this.model.position.set(-center.x * s, -bb.min.y * s - 0.72, -center.z * s);
    this.baseY = this.model.position.y;
    this.scene.add(this.model);
    this.pop = 0;
  }
  loop() {
    if (!this.alive) return;
    requestAnimationFrame(() => this.loop());
    const t = this.clock.getElapsedTime();
    if (this.model) {
      if (this.pop < 1) { this.pop = Math.min(1, this.pop + 0.05); const s = (0.6 + 0.4 * (1 - Math.pow(1 - this.pop, 3))) * this.fit; this.model.scale.setScalar(s); }
      this.model.position.y = this.baseY + Math.sin(t * 1.4) * 0.025;
      this.model.traverse((o) => {
        if (o.userData.sparkle) { o.rotation.y = t * 0.25; o.material.opacity = 0.6 + Math.sin(t * 3) * 0.3; }
        if (o.userData.flame) { o.scale.y = 1.6 + Math.sin(t * 12) * 0.25; }
      });
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  destroy() {
    this.alive = false; this.ro.disconnect(); this.controls.dispose();
    if (this.model) disposeGroup(this.model);
    this.renderer.dispose(); this.canvas.remove();
  }
}
