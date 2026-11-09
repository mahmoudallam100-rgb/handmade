// ===============================================
//  المتجر ثلاثي الأبعاد: جدار أرفف زجاجية، كل قسم وحدة،
//  والمنتجات موديلات حية على الأرفف. تلفّ بالماوس/اللمس/الأسهم.
// ===============================================
import * as THREE from 'three';
import { buildModel } from './models.js';
import { addLights, getEnv, disposeGroup } from './three-utils.js';
import { CATS, inCat, fmt, esc, prefersReducedMotion } from './state.js';

const GAP = 0.9, SCALE = 0.5;
// تخطيط الوحدة: 3 أعمدة على الشاشات العريضة، وعمودين و4 أرفف على الموبايل الطولي
const LAYOUTS = {
  wide: { w: 4.4, slots: 3, sy: { 2: [1.55, 0.3], 3: [1.72, 0.9, 0.08] }, top: 2.72, h: 3.0, plaque: 2.98, cy: 1.75 },
  tall: { w: 3.0, slots: 2, sy: { 2: [2.0, 0.5], 3: [2.4, 1.25, 0.08], 4: [2.55, 1.72, 0.9, 0.08] }, top: 3.55, h: 3.85, plaque: 3.82, cy: 1.85 },
};
function shelvesFor(L, n) { const rows = Math.max(2, Math.min(Object.keys(L.sy).length, Math.ceil(n / L.slots))); return L.sy[rows]; }

function makeTextTexture(text, { size = 72, color = '#f7efe4', font = 'Marhey' } = {}) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 192;
  const x = c.getContext('2d');
  x.clearRect(0, 0, c.width, c.height);
  x.font = `500 ${size}px "${font}", "Tajawal", sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = 'rtl';
  x.shadowColor = 'rgba(230,194,122,0.6)'; x.shadowBlur = 24;
  x.fillStyle = color; x.fillText(text, c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export class Store3D {
  constructor(root, { onOpen, onUnit, startCat = 0 } = {}) {
    this.root = root; this.onOpen = onOpen; this.onUnit = onUnit;
    this.cats = CATS.filter((c) => inCat(c.id).length);
    this.canvas = document.createElement('canvas'); this.canvas.className = 'scene';
    root.prepend(this.canvas);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.0;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2('#120b1c', 0.06);
    this.scene.environment = getEnv(this.renderer);
    addLights(this.scene, 0.9);
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    this.camera.position.set(0, 1.45, 7.6);
    this.target = new THREE.Vector3(0, 1.3, 0);
    this.L = LAYOUTS[(root.clientWidth || innerWidth) / (root.clientHeight || innerHeight) < 0.8 ? 'tall' : 'wide'];
    this.units = []; this.hitboxes = []; this.hover = null;
    this.current = Math.min(startCat, this.cats.length - 1);
    this.camX = this.unitX(this.current); this.wantX = this.camX;
    this.pointer = new THREE.Vector2(-9, -9); this.mouse = { x: 0, y: 0 };
    this.ray = new THREE.Raycaster();
    this.buildWorld();
    this.cats.forEach((_, i) => this.buildUnit(i));
    this.ensureProducts();
    this.bindEvents();
    this.clock = new THREE.Clock();
    this.resize(); this.alive = true; this.loop();
    this.onUnit && this.onUnit(this.current);
  }
  unitX(i) { return -(i * (this.L.w + GAP)); } // RTL: الوحدة الأولى يمين والباقي شمال

  buildWorld() {
    // أرضية عاكسة
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 40), new THREE.MeshStandardMaterial({ color: '#1a1026', roughness: 0.25, metalness: 0.7 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.35; this.scene.add(floor);
    // خط ضوء ذهبي على الأرض
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(200, 0.05), new THREE.MeshBasicMaterial({ color: '#e6c27a', transparent: true, opacity: 0.5 }));
    strip.rotation.x = -Math.PI / 2; strip.position.set(0, -0.34, 1.9); this.scene.add(strip);
    // غبار لامع في الهوا
    const n = 500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 60 - 15; pos[i * 3 + 1] = Math.random() * 4; pos[i * 3 + 2] = (Math.random() - 0.5) * 8; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(g, new THREE.PointsMaterial({ color: '#f4a7c3', size: 0.03, transparent: true, opacity: 0.55, depthWrite: false }));
    this.scene.add(this.dust);
  }

  buildUnit(i) {
    const cat = this.cats[i];
    const x = this.unitX(i);
    const grp = new THREE.Group(); grp.position.x = x;
    const tone = cat.tone === 'rose' ? '#f4a7c3' : '#e6c27a';
    // لوح خلفي زجاجي
    const back = new THREE.Mesh(new THREE.BoxGeometry(this.L.w, this.L.h, 0.08), new THREE.MeshPhysicalMaterial({ color: '#4a3566', roughness: 0.2, metalness: 0.05, transmission: 0.3, transparent: true, opacity: 0.7, thickness: 0.4, clearcoat: 1, emissive: '#2a1b3d', emissiveIntensity: 0.6 }));
    back.position.set(0, this.L.h / 2 - 0.3, -0.45); grp.add(back);
    // ضوء علوي على كل وحدة
    const spot = new THREE.SpotLight(tone, 6, 7, 0.6, 0.5, 1); spot.position.set(0, this.L.top + 1.3, 1.6); spot.target.position.set(0, 1, 0); grp.add(spot); grp.add(spot.target);
    // إطار ذهبي
    const frameMat = new THREE.MeshStandardMaterial({ color: tone, metalness: 1, roughness: 0.3 });
    [[-this.L.w / 2, 0], [this.L.w / 2, 0]].forEach(([fx]) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, this.L.h + 0.1, 0.9), frameMat); post.position.set(fx, this.L.h / 2 - 0.3, 0); grp.add(post);
    });
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(this.L.w, 0.05, 0.9), frameMat); topBar.position.set(0, this.L.top, 0); grp.add(topBar);
    // الأرفف الزجاجية
    const sy = shelvesFor(this.L, inCat(cat.id).length);
    sy.forEach((y) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(this.L.w - 0.1, 0.05, 0.9), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, metalness: 0, transmission: 0.75, transparent: true, opacity: 0.7, thickness: 0.2, clearcoat: 1 }));
      shelf.position.set(0, y - 0.03, 0); grp.add(shelf);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(this.L.w - 0.1, 0.012, 0.02), new THREE.MeshBasicMaterial({ color: tone })); edge.position.set(0, y - 0.03, 0.45); grp.add(edge);
      const l = new THREE.PointLight(tone, 0.9, 2.8); l.position.set(0, y + 0.55, 0.7); grp.add(l);
    });
    // لافتة القسم
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.6), new THREE.MeshBasicMaterial({ map: makeTextTexture(`${cat.emoji} ${cat.name}`), transparent: true, depthWrite: false }));
    plaque.position.set(0, this.L.plaque, 0.25); grp.add(plaque);
    this.scene.add(grp);
    this.units[i] = { grp, cat, products: inCat(cat.id), built: false, models: [], sy };
  }

  ensureProducts() {
    this.units.forEach((u, i) => {
      const near = Math.abs(i - this.current) <= 1;
      if (near && !u.built) this.populate(i);
      else if (!near && u.built && Math.abs(i - this.current) > 2) this.depopulate(i);
    });
  }
  populate(i) {
    const u = this.units[i]; u.built = true;
    const SLOTS = this.L.slots, SHELF_Y = u.sy;
    u.products.slice(0, SHELF_Y.length * SLOTS).forEach((p, k) => {
      const row = Math.floor(k / SLOTS), slot = k % SLOTS;
      const sx = ((SLOTS - 1) / 2 - slot) * (this.L.w / SLOTS) * 0.92; // من اليمين لليسار
      const m = buildModel(p.model, p.colors, p.glitter);
      m.scale.setScalar(SCALE);
      const bb = new THREE.Box3().setFromObject(m);
      const lift = -bb.min.y; // خلي المنتج قاعد على الرف
      m.position.set(sx, SHELF_Y[row] + lift + 0.01, 0.05);
      m.rotation.y = -0.35;
      m.userData.baseY = m.position.y; m.userData.phase = Math.random() * 6.28; m.userData.product = p;
      u.grp.add(m);
      const size = bb.getSize(new THREE.Vector3());
      const hit = new THREE.Mesh(new THREE.BoxGeometry(Math.max(size.x, 0.6), Math.max(size.y, 0.6), Math.max(size.z, 0.6)), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.set(sx, SHELF_Y[row] + size.y / 2 + 0.02, 0.05); hit.userData.model = m; hit.userData.product = p;
      u.grp.add(hit); this.hitboxes.push(hit); u.models.push(m, hit);
    });
  }
  depopulate(i) {
    const u = this.units[i]; u.built = false;
    u.models.forEach((m) => { u.grp.remove(m); disposeGroup(m); });
    this.hitboxes = this.hitboxes.filter((h) => !u.models.includes(h));
    u.models = [];
  }

  bindEvents() {
    const c = this.canvas;
    let down = null, moved = 0, lastX = 0, vel = 0;
    this._wheel = (e) => { e.preventDefault(); this.wantX -= (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * -0.004; this.clampWant(); };
    c.addEventListener('wheel', this._wheel, { passive: false });
    c.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; moved = 0; lastX = e.clientX; vel = 0; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.mouse.x = this.pointer.x; this.mouse.y = this.pointer.y;
      if (down) {
        const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
        vel = dx; this.wantX += dx * 0.012; this.camX += dx * 0.012; this.clampWant();
      }
    });
    const up = (e) => {
      if (!down) return;
      if (moved < 6) this.pick(true);
      else { this.wantX += vel * 0.25; this.snap(); }
      down = null;
    };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    c.addEventListener('pointerleave', () => { this.pointer.set(-9, -9); });
    this._key = (e) => { if (e.key === 'ArrowLeft') this.next(); if (e.key === 'ArrowRight') this.prev(); };
    window.addEventListener('keydown', this._key);
    this._resize = () => this.resize(); window.addEventListener('resize', this._resize);
  }
  clampWant() { const min = this.unitX(this.cats.length - 1) - 1.2, max = 1.2; this.wantX = Math.max(min, Math.min(max, this.wantX)); }
  snap() { const i = Math.round(-this.wantX / (this.L.w + GAP)); this.goto(Math.max(0, Math.min(this.cats.length - 1, i))); }
  goto(i) { this.current = i; this.wantX = this.unitX(i); this.ensureProducts(); this.onUnit && this.onUnit(i); }
  next() { this.goto(Math.min(this.cats.length - 1, this.current + 1)); }
  prev() { this.goto(Math.max(0, this.current - 1)); }

  pick(click) {
    this.ray.setFromCamera(this.pointer, this.camera);
    const hits = this.ray.intersectObjects(this.hitboxes, false);
    const h = hits[0]?.object || null;
    if (click) { if (h) this.onOpen && this.onOpen(h.userData.product); return; }
    if (h !== this.hover) { this.hover = h; this.canvas.style.cursor = h ? 'pointer' : 'grab'; this.root.dispatchEvent(new CustomEvent('hover', { detail: h ? h.userData.product : null })); }
  }
  projectHover() {
    if (!this.hover) return null;
    const v = this.hover.position.clone().applyMatrix4(this.hover.parent.matrixWorld);
    v.y += this.hover.geometry.parameters.height / 2;
    v.project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: (v.x + 1) / 2 * r.width, y: (-v.y + 1) / 2 * r.height };
  }
  resize() {
    const w = this.root.clientWidth || innerWidth, h = this.root.clientHeight || innerHeight;
    const want = LAYOUTS[w / h < 0.8 ? 'tall' : 'wide'];
    if (want !== this.L && this.units.length) { this.L = want; this.rebuild(); }
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.8 ? 46 : 34; this.camera.updateProjectionMatrix();
    // نبعد الكاميرا لحد ما الوحدة كلها تبان بالعرض
    const halfW = this.L.w / 2 + 0.45, tanV = Math.tan((this.camera.fov / 2) * Math.PI / 180);
    this.camera.position.z = Math.max(7.6, halfW / (tanV * this.camera.aspect));
  }
  rebuild() {
    this.units.forEach((u, i) => { this.depopulate(i); this.scene.remove(u.grp); });
    this.units = []; this.hitboxes = []; this.hover = null;
    this.cats.forEach((_, i) => this.buildUnit(i));
    this.camX = this.wantX = this.unitX(this.current);
    this.ensureProducts();
  }
  loop() {
    if (!this.alive) return;
    requestAnimationFrame(() => this.loop());
    const t = this.clock.getElapsedTime();
    this.camX += (this.wantX - this.camX) * 0.08;
    const i = Math.round(-this.camX / (this.L.w + GAP));
    if (i !== this.current && i >= 0 && i < this.cats.length) { this.current = i; this.ensureProducts(); this.onUnit && this.onUnit(i); }
    this.camera.position.x = this.camX + this.mouse.x * 0.25;
    const cy = this.L.cy;
    this.camera.position.y = cy + 0.15 + this.mouse.y * 0.15;
    this.target.set(this.camX, cy, 0); this.camera.lookAt(this.target);
    const reduce = prefersReducedMotion();
    this.units.forEach((u) => u.models.forEach((m) => {
      if (!m.userData.product || m.userData.model) return;
      if (!reduce) { m.rotation.y = -0.35 + Math.sin(t * 0.6 + m.userData.phase) * 0.35; m.position.y = m.userData.baseY + Math.sin(t * 1.5 + m.userData.phase) * 0.012; }
      const hov = this.hover && this.hover.userData.model === m;
      const s = hov ? SCALE * 1.18 : SCALE; m.scale.lerp(new THREE.Vector3(s, s, s), 0.15);
      m.traverse((o) => { if (o.userData.sparkle) o.rotation.y = t * 0.3; if (o.userData.flame) o.scale.y = 1.6 + Math.sin(t * 12) * 0.25; });
    }));
    if (!reduce) { this.dust.rotation.y = t * 0.01; this.dust.position.y = Math.sin(t * 0.3) * 0.1; }
    if (this.pointer.x > -5) this.pick(false);
    this.renderer.render(this.scene, this.camera);
  }
  destroy() {
    this.alive = false;
    this.canvas.removeEventListener('wheel', this._wheel); window.removeEventListener('keydown', this._key); window.removeEventListener('resize', this._resize);
    this.units.forEach((_, i) => this.depopulate(i));
    this.renderer.dispose(); this.canvas.remove();
  }
}
