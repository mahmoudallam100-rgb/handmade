// ===============================================
//  موديلات ثلاثية الأبعاد بتتولّد برمجياً لكل منتج
//  (مش محتاجة صور — كل منتج ليه شكل حقيقي يلف قدام العميل)
// ===============================================
import * as THREE from 'three';

const geoCache = new Map();
function geo(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}

const col = (c) => new THREE.Color(c);

export function matBead(color, shiny = 0.9) {
  return new THREE.MeshPhysicalMaterial({
    color: col(color), roughness: 0.18, metalness: 0.05,
    clearcoat: 1, clearcoatRoughness: 0.08, reflectivity: shiny,
  });
}
export function matMetal(color = '#e6c27a') {
  return new THREE.MeshStandardMaterial({ color: col(color), roughness: 0.28, metalness: 0.8, emissive: col(color), emissiveIntensity: 0.12 });
}
export function matGlass(color = '#ffffff', opacity = 0.45) {
  return new THREE.MeshPhysicalMaterial({
    color: col(color), transmission: 0.6, roughness: 0.05, metalness: 0,
    transparent: true, opacity, thickness: 0.3, ior: 1.4, clearcoat: 1,
  });
}
export function matWood(color = '#d9a66b') {
  return new THREE.MeshStandardMaterial({ color: col(color), roughness: 0.8, metalness: 0 });
}
export function matMatte(color) {
  return new THREE.MeshStandardMaterial({ color: col(color), roughness: 0.6, metalness: 0.05 });
}
export function matWax(color) {
  return new THREE.MeshPhysicalMaterial({ color: col(color), roughness: 0.55, transmission: 0.15, thickness: 0.6, transparent: true, opacity: 0.98 });
}
export function matChoc(color = '#5a3825') {
  return new THREE.MeshStandardMaterial({ color: col(color), roughness: 0.35, metalness: 0.08 });
}

// نقاط لامعة (جليتر) حوالين الموديل
export function sparkles(amount = 0.5, radius = 0.9, color = '#fff4d6') {
  const n = Math.round(10 + amount * 70);
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = radius * (0.55 + Math.random() * 0.55);
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(p) * Math.cos(t);
    pos[i * 3 + 1] = r * Math.cos(p) * 0.8;
    pos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: col(color), size: 0.035, transparent: true, opacity: 0.9, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, m);
  pts.userData.sparkle = true;
  return pts;
}

const sphere = (r = 0.08, s = 18) => geo(`sph${r}${s}`, () => new THREE.SphereGeometry(r, s, s));
const box = (w, h, d) => geo(`box${w}${h}${d}`, () => new THREE.BoxGeometry(w, h, d));
const cyl = (rt, rb, h, s = 32) => geo(`cyl${rt}${rb}${h}${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
const torus = (r, t, s = 48) => geo(`tor${r}${t}${s}`, () => new THREE.TorusGeometry(r, t, 16, s));

function ringOfBeads(radius, count, colors, beadR = 0.085, alt = true) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const c = alt ? colors[i % colors.length] : colors[0];
    const m = new THREE.Mesh(sphere(beadR), matBead(c));
    m.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    g.add(m);
  }
  return g;
}

function textPlate(w, h, color, text = '') {
  // لوحة صغيرة بتمثل مكان الكتابة/الحفر
  const m = new THREE.Mesh(box(w, 0.02, h), matMatte(color));
  return m;
}

const B = {};

B.bracelet = (c, opts = {}) => {
  const g = new THREE.Group();
  const pattern = opts.pattern || [c[0], c[0], c[1]];
  const ring = ringOfBeads(0.6, opts.count || 22, pattern, opts.beadR || 0.085);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  if (opts.charm !== false) {
    const charm = new THREE.Mesh(opts.charmGeo || geo('star', () => starGeo(0.12)), matMetal(opts.charmColor || '#e6c27a'));
    charm.position.set(0, -0.72, 0);
    g.add(charm);
  }
  if (opts.letters) {
    [...opts.letters].slice(0, 6).forEach((ch, i, arr) => {
      const a = Math.PI / 2 + ((i - (arr.length - 1) / 2) * 0.3);
      const cube = new THREE.Mesh(box(0.14, 0.14, 0.14), matMatte('#ffffff'));
      cube.position.set(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0);
      g.add(cube);
    });
  }
  return g;
};

B.necklace = (c, opts = {}) => {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.7, 0.6, 0), new THREE.Vector3(-0.72, 0.1, 0), new THREE.Vector3(-0.35, -0.45, 0),
    new THREE.Vector3(0, -0.6, 0), new THREE.Vector3(0.35, -0.45, 0), new THREE.Vector3(0.72, 0.1, 0), new THREE.Vector3(0.7, 0.6, 0),
  ]);
  const chain = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.018, 8, false), matMetal(c[0]));
  g.add(chain);
  const n = opts.count || 18;
  for (let i = 0; i <= n; i++) {
    const p = curve.getPoint(i / n);
    const b = new THREE.Mesh(sphere(0.06), matBead(i % 2 ? c[1] : c[0]));
    b.position.copy(p);
    g.add(b);
  }
  const pend = new THREE.Mesh(opts.charmGeo || geo('star', () => starGeo(0.14)), matMetal(c[0]));
  pend.position.set(0, -0.78, 0);
  g.add(pend);
  return g;
};

B.earrings = (c) => {
  const g = new THREE.Group();
  [-0.35, 0.35].forEach((x) => {
    const hook = new THREE.Mesh(torus(0.12, 0.012, 24), matMetal('#e6c27a'));
    hook.position.set(x, 0.45, 0);
    g.add(hook);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(sphere(0.09, 14), matBead(c[0]));
      petal.position.set(x + Math.cos(a) * 0.16, 0.05 + Math.sin(a) * 0.16, 0);
      g.add(petal);
    }
    const center = new THREE.Mesh(sphere(0.07, 14), matBead('#ffffff'));
    center.position.set(x, 0.05, 0.05);
    g.add(center);
    const leaf = new THREE.Mesh(sphere(0.07, 12), matBead(c[1]));
    leaf.scale.set(1.6, 0.8, 0.6); leaf.position.set(x, -0.27, 0);
    g.add(leaf);
  });
  return g;
};

B.phonecharm = (c, opts = {}) => {
  const g = new THREE.Group();
  const strap = new THREE.Mesh(cyl(0.02, 0.02, 1.2, 10), matMatte(c[0]));
  strap.position.y = 0.1; g.add(strap);
  const beads = opts.pattern || [c[0], c[1], '#ffffff'];
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(sphere(0.075 + (i % 3 === 1 ? 0.02 : 0)), matBead(beads[i % beads.length]));
    b.position.y = 0.6 - i * 0.14;
    g.add(b);
  }
  const heart = new THREE.Mesh(geo('heart', () => heartGeo(0.16)), matMetal(c[1]));
  heart.position.y = -0.8; g.add(heart);
  const loop = new THREE.Mesh(torus(0.12, 0.02, 24), matMetal('#c8c8c8'));
  loop.position.y = 0.78; g.add(loop);
  return g;
};

B.keychain = (c, opts = {}) => {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(torus(0.18, 0.025, 32), matMetal('#c8c8c8'));
  ring.position.y = 0.62; g.add(ring);
  const disc = new THREE.Mesh(cyl(0.42, 0.42, 0.08, 48), matGlass(c[0], 0.55));
  disc.rotation.x = Math.PI / 2; disc.position.y = -0.05; g.add(disc);
  const inner = sparkles(1, 0.35, c[1]); inner.position.y = -0.05; g.add(inner);
  const sym = new THREE.Mesh(geo('star', () => starGeo(0.18)), matMetal(c[1]));
  sym.position.set(0, -0.05, 0.05); g.add(sym);
  return g;
};

B.candle = (c, opts = {}) => {
  const g = new THREE.Group();
  const jar = new THREE.Mesh(cyl(0.42, 0.38, 0.9, 40), matGlass('#f0c26b', 0.5));
  g.add(jar);
  const wax = new THREE.Mesh(cyl(0.36, 0.33, 0.7, 32), matWax(c[0]));
  wax.position.y = -0.08; g.add(wax);
  const wick = new THREE.Mesh(cyl(0.012, 0.012, 0.2, 8), matMatte('#222'));
  wick.position.y = 0.36; g.add(wick);
  const flame = new THREE.Mesh(sphere(0.05, 10), new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
  flame.scale.set(1, 1.8, 1); flame.position.y = 0.5; flame.userData.flame = true; g.add(flame);
  const light = new THREE.PointLight('#ffb866', 0.8, 2.5); light.position.y = 0.55; g.add(light);
  const label = textPlate(0.5, 0.3, c[1]); label.rotation.x = Math.PI / 2; label.position.set(0, 0, 0.42); g.add(label);
  return g;
};

B.waxart = (c) => {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(box(1.3, 1.0, 0.06), matWood('#5a3825'));
  g.add(frame);
  const cols = [c[0], c[1], '#e6c27a', '#ffffff'];
  for (let y = 0; y < 5; y++) for (let x = 0; x < 7; x++) {
    const t = new THREE.Mesh(box(0.14, 0.14, 0.06), matWax(cols[(x * 3 + y) % cols.length]));
    t.position.set(-0.48 + x * 0.16, -0.32 + y * 0.16, 0.05);
    t.rotation.z = (Math.random() - 0.5) * 0.3;
    g.add(t);
  }
  return g;
};

B.chocolate = (c, opts = {}) => {
  const g = new THREE.Group();
  const bar = new THREE.Mesh(box(1.1, 0.12, 0.6), matChoc(c[0]));
  g.add(bar);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const sq = new THREE.Mesh(box(0.22, 0.06, 0.24), matChoc(c[0]));
    sq.position.set(-0.4 + i * 0.265, 0.09, -0.14 + j * 0.28);
    g.add(sq);
  }
  const wrap = new THREE.Mesh(box(0.45, 0.16, 0.66), matMetal(c[1]));
  wrap.position.x = 0.34; g.add(wrap);
  return g;
};

B.chocobox = (c) => {
  const g = new THREE.Group();
  const base = new THREE.Mesh(box(1.1, 0.25, 0.8), matMatte(c[1]));
  base.position.y = -0.1; g.add(base);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const h = new THREE.Mesh(geo('heart', () => heartGeo(0.12)), matChoc(c[0]));
    h.position.set(-0.33 + i * 0.33, 0.06, -0.18 + j * 0.36);
    h.rotation.x = -Math.PI / 2;
    g.add(h);
  }
  const lid = new THREE.Mesh(box(1.12, 0.06, 0.82), matGlass('#ffffff', 0.3));
  lid.position.y = 0.16; g.add(lid);
  return g;
};

B.giftbox = (c, opts = {}) => {
  const g = new THREE.Group();
  const bx = new THREE.Mesh(box(0.9, 0.62, 0.9), matMatte(c[0]));
  g.add(bx);
  const lid = new THREE.Mesh(box(0.96, 0.14, 0.96), matMatte(c[0]));
  lid.position.y = 0.37; g.add(lid);
  const r1 = new THREE.Mesh(box(0.98, 0.8, 0.12), matMetal(c[1])); r1.position.y = 0.03; g.add(r1);
  const r2 = new THREE.Mesh(box(0.12, 0.8, 0.98), matMetal(c[1])); r2.position.y = 0.03; g.add(r2);
  [-1, 1].forEach((s) => {
    const loop = new THREE.Mesh(torus(0.13, 0.04, 24), matMetal(c[1]));
    loop.position.set(s * 0.16, 0.52, 0); loop.rotation.y = s * 0.5;
    g.add(loop);
  });
  return g;
};

B.sign = (c, opts = {}) => {
  const g = new THREE.Group();
  const plank = new THREE.Mesh(box(1.3, 0.75, 0.05), matWood(c[0]));
  g.add(plank);
  // "حفر" بشكل خطوط
  const lines = [0.5, 0.9, 0.7];
  lines.forEach((w, i) => {
    const l = new THREE.Mesh(box(w, 0.06, 0.012), matMatte(c[1] === c[0] ? '#5a3825' : c[1]));
    l.position.set(0, 0.2 - i * 0.2, 0.03);
    g.add(l);
  });
  const base = new THREE.Mesh(box(0.6, 0.06, 0.3), matWood('#8a6243'));
  base.position.y = -0.4; g.add(base);
  return g;
};

B.tray = (c) => {
  const g = new THREE.Group();
  const wood = new THREE.Mesh(box(1.3, 0.06, 0.8), matWood(c[0]));
  g.add(wood);
  const resin = new THREE.Mesh(box(0.55, 0.065, 0.8), matGlass(c[1], 0.8));
  resin.position.x = 0.37; g.add(resin);
  const sp = sparkles(0.8, 0.3, '#e6c27a'); sp.position.set(0.37, 0.05, 0); sp.scale.set(1, 0.1, 1.2); g.add(sp);
  [-0.6, 0.6].forEach((x) => {
    const h = new THREE.Mesh(torus(0.1, 0.018, 24), matMetal('#b87333'));
    h.position.set(x, 0.1, 0); h.rotation.y = Math.PI / 2; g.add(h);
  });
  return g;
};

B.mirror = (c) => {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(torus(0.5, 0.07, 48), matMetal(c[0]));
  g.add(frame);
  const glass = new THREE.Mesh(cyl(0.46, 0.46, 0.03, 48), new THREE.MeshStandardMaterial({ color: '#dfe9f3', roughness: 0.02, metalness: 1 }));
  glass.rotation.x = Math.PI / 2; g.add(glass);
  const beads = ringOfBeads(0.5, 26, ['#ffffff', c[1]], 0.06); g.add(beads);
  const handle = new THREE.Mesh(cyl(0.05, 0.04, 0.7, 16), matMetal(c[0]));
  handle.position.y = -0.85; g.add(handle);
  return g;
};

B.flowers = (c) => {
  const g = new THREE.Group();
  for (let f = 0; f < 5; f++) {
    const a = (f / 5) * Math.PI * 2, r = f ? 0.32 : 0;
    const x = Math.cos(a) * r, z = Math.sin(a) * r, y = f ? 0.15 : 0.35;
    const stem = new THREE.Mesh(cyl(0.015, 0.015, 1.0, 8), matMatte('#4c8f5c'));
    stem.position.set(x, y - 0.5, z); g.add(stem);
    for (let p = 0; p < 7; p++) {
      const pa = (p / 7) * Math.PI * 2;
      const petal = new THREE.Mesh(sphere(0.09, 12), matBead(c[0]));
      petal.scale.set(1, 0.6, 1.5);
      petal.position.set(x + Math.cos(pa) * 0.15, y, z + Math.sin(pa) * 0.15);
      petal.rotation.y = -pa; g.add(petal);
    }
    const core = new THREE.Mesh(sphere(0.07, 12), matBead('#e6c27a')); core.position.set(x, y + 0.03, z); g.add(core);
    const leaf = new THREE.Mesh(sphere(0.06, 10), matBead(c[1])); leaf.scale.set(1, 0.4, 2.2); leaf.position.set(x + 0.1, y - 0.3, z); g.add(leaf);
  }
  const wrap = new THREE.Mesh(cyl(0.3, 0.12, 0.6, 24, true), matMatte('#f6e7c1'));
  wrap.position.y = -0.55; g.add(wrap);
  return g;
};

B.topper = (c) => {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(cyl(0.012, 0.012, 0.6, 8), matMatte('#f6e7c1')); stick.position.y = -0.4; g.add(stick);
  const plate = new THREE.Mesh(geo('starBig', () => starGeo(0.45)), matMetal(c[0]));
  plate.position.y = 0.1; g.add(plate);
  const sp = sparkles(1, 0.5, c[1]); sp.position.y = 0.1; g.add(sp);
  const band = new THREE.Mesh(box(0.7, 0.12, 0.03), matMatte(c[1])); band.position.set(0, 0.0, 0.04); g.add(band);
  return g;
};

B.ringdish = (c) => {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(cyl(0.05, 0.07, 0.9, 12), matWood(c[0])); g.add(trunk);
  const base = new THREE.Mesh(cyl(0.35, 0.38, 0.05, 32), matWood(c[0])); base.position.y = -0.45; g.add(base);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const br = new THREE.Mesh(cyl(0.02, 0.03, 0.45, 8), matWood(c[0]));
    br.position.set(Math.cos(a) * 0.2, 0.15 + (i % 2) * 0.2, Math.sin(a) * 0.2);
    br.rotation.z = Math.cos(a) * 0.9; br.rotation.x = -Math.sin(a) * 0.9;
    g.add(br);
    const ring = new THREE.Mesh(torus(0.07, 0.015, 20), matMetal(c[1]));
    ring.position.set(Math.cos(a) * 0.36, 0.28 + (i % 2) * 0.2, Math.sin(a) * 0.36);
    g.add(ring);
  }
  return g;
};

B.lantern = (c) => {
  const g = new THREE.Group();
  const body = new THREE.Mesh(cyl(0.3, 0.38, 0.8, 6), matWood(c[0])); g.add(body);
  const inner = new THREE.Mesh(cyl(0.26, 0.34, 0.7, 6), new THREE.MeshBasicMaterial({ color: '#ffcc80' })); g.add(inner);
  const light = new THREE.PointLight('#ffb866', 0.9, 2.5); g.add(light);
  const top = new THREE.Mesh(cyl(0.05, 0.36, 0.3, 6), matWood(c[0])); top.position.y = 0.55; g.add(top);
  const ring = new THREE.Mesh(torus(0.12, 0.02, 24), matMetal(c[1])); ring.position.y = 0.8; g.add(ring);
  const foot = new THREE.Mesh(cyl(0.42, 0.42, 0.06, 6), matWood('#8a6243')); foot.position.y = -0.43; g.add(foot);
  return g;
};

B.hairpin = (c) => {
  const g = new THREE.Group();
  const pin = new THREE.Mesh(cyl(0.015, 0.015, 1.2, 8), matMetal(c[1])); pin.rotation.z = 0.9; g.add(pin);
  [0.55, 0.42, 0.3].forEach((r, i) => {
    const b = new THREE.Mesh(sphere(0.07 + i * 0.03, 18), matBead(c[0]));
    b.position.set(Math.cos(0.9 + Math.PI / 2) * r, Math.sin(0.9 + Math.PI / 2) * r, 0.06);
    g.add(b);
  });
  return g;
};

B.kit = (c) => {
  const g = new THREE.Group();
  const bx = new THREE.Mesh(box(1.2, 0.3, 0.9), matMatte('#1d1230')); g.add(bx);
  const cols = [c[0], c[1], '#ffffff', '#e6c27a', '#8fc9a8', '#7fb3d5'];
  for (let i = 0; i < 6; i++) {
    const cup = new THREE.Mesh(cyl(0.14, 0.14, 0.2, 20), matGlass('#ffffff', 0.4));
    cup.position.set(-0.45 + (i % 3) * 0.45, 0.2, -0.2 + Math.floor(i / 3) * 0.4);
    g.add(cup);
    const fill = new THREE.Mesh(cyl(0.12, 0.12, 0.14, 16), matBead(cols[i]));
    fill.position.copy(cup.position); fill.position.y -= 0.02; g.add(fill);
  }
  return g;
};

B.veil = (c) => {
  const g = new THREE.Group();
  const cloth = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: col(c[0]), transparent: true, opacity: 0.55, roughness: 0.9, side: THREE.DoubleSide }));
  cloth.position.y = -0.3; g.add(cloth);
  const beads = ringOfBeads(0.75, 30, [c[1]], 0.045); beads.position.y = -0.3; g.add(beads);
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    const t = new THREE.Mesh(cyl(0.005, 0.005, 0.16, 6), matMetal(c[1]));
    t.position.set(Math.cos(a) * 0.75, -0.42, Math.sin(a) * 0.75); g.add(t);
  }
  const comb = new THREE.Mesh(box(0.4, 0.06, 0.1), matMetal(c[1])); comb.position.y = 0.45; g.add(comb);
  return g;
};

B.tiara = (c) => {
  const g = new THREE.Group();
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.02, 10, 48, Math.PI), matMetal('#d8d8d8'));
  band.rotation.x = Math.PI / 2; band.rotation.z = Math.PI; g.add(band);
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.1 + 0.8 * (i / 8));
    const h = 0.12 + Math.sin((i / 8) * Math.PI) * 0.35;
    const spike = new THREE.Mesh(cyl(0.006, 0.015, h, 6), matMetal('#d8d8d8'));
    spike.position.set(Math.cos(a) * 0.62, h / 2, Math.sin(a) * 0.62); g.add(spike);
    const gem = new THREE.Mesh(sphere(0.06 + (i === 4 ? 0.04 : 0), 16), matBead(i % 2 ? c[0] : c[1]));
    gem.position.set(Math.cos(a) * 0.62, h, Math.sin(a) * 0.62); g.add(gem);
  }
  g.rotation.y = Math.PI;
  return g;
};

B.cardset = (c) => {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const card = new THREE.Mesh(box(0.7, 1.0, 0.02), matGlass('#ffffff', 0.5));
    card.position.set(-0.25 + i * 0.25, 0, -0.1 + i * 0.1); card.rotation.z = -0.1 + i * 0.1; g.add(card);
    [0.3, 0.1, -0.1].forEach((y, j) => {
      const line = new THREE.Mesh(box(0.4 - j * 0.1, 0.04, 0.005), matMetal(c[1]));
      line.position.set(card.position.x, y, card.position.z + 0.015); line.rotation.z = card.rotation.z; g.add(line);
    });
  }
  const env = new THREE.Mesh(box(0.9, 0.6, 0.06), matMatte(c[0])); env.position.set(0, -0.55, -0.1); g.add(env);
  return g;
};

// ———— أشكال مساعدة ————
function starGeo(r) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 });
}
function heartGeo(r) {
  const s = new THREE.Shape();
  const x = 0, y = 0;
  s.moveTo(x, y + r * 0.5);
  s.bezierCurveTo(x, y + r * 0.9, x - r, y + r * 0.9, x - r, y + r * 0.2);
  s.bezierCurveTo(x - r, y - r * 0.4, x, y - r * 0.7, x, y - r);
  s.bezierCurveTo(x, y - r * 0.7, x + r, y - r * 0.4, x + r, y + r * 0.2);
  s.bezierCurveTo(x + r, y + r * 0.9, x, y + r * 0.9, x, y + r * 0.5);
  return new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 });
}
export { starGeo, heartGeo };

// الواجهة الرئيسية
export function buildModel(type, colors = ['#e6c27a', '#f4a7c3'], glitter = 0.3, opts = {}) {
  const make = B[type] || B.giftbox;
  const g = make(colors, opts);
  if (glitter > 0.05) g.add(sparkles(glitter, 0.95));
  g.userData.type = type;
  return g;
}

export const MODEL_TYPES = Object.keys(B);
