/* ------------------------------ Scène 3D ------------------------------ */
function creerScene(canvas, lieux, titre, MODELES, surChoix) {
  const T = window.THREE;
  if (!T || !T.OrbitControls) return null;
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;

  const scene = new T.Scene();
  const col = h => new T.Color(h).convertSRGBToLinear();
  const M = h => new T.MeshLambertMaterial({ color: col(h) });                       // matière éclairée
  const U = (h, o) => new T.MeshBasicMaterial(Object.assign({ color: col(h) }, o));  // aplat, couleur exacte
  const SOL = 0xE8E5DF;
  scene.background = col(SOL);

  const cam = new T.PerspectiveCamera(30, 1, 2, 4000);
  const ctl = new T.OrbitControls(cam, canvas);
  ctl.enableDamping = true; ctl.dampingFactor = 0.12;
  ctl.screenSpacePanning = false;
  ctl.minPolarAngle = 0.3; ctl.maxPolarAngle = 1.12; ctl.minDistance = 16;

  const hemi = new T.HemisphereLight(0xffffff, col(SOL), 0.7);
  const soleil = new T.DirectionalLight(col(0xFFF3E2), 0.6);
  soleil.position.set(-34, 64, 42);
  soleil.castShadow = true;
  soleil.shadow.mapSize.set(2048, 2048);
  Object.assign(soleil.shadow.camera, { left: -58, right: 58, top: 58, bottom: -58, near: 1, far: 220 });
  soleil.shadow.camera.updateProjectionMatrix();
  soleil.shadow.radius = 3.5; soleil.shadow.bias = -0.0006; soleil.shadow.normalBias = 0.04;
  scene.add(hemi, soleil);

  const C = { blanc: 0xFAFAF7, rouge: 0xD3262E, marine: 0x1F2A44, nuit: 0x171B24, gris: 0xB9BCC2, grisF: 0x6E7480,
              laiton: 0xC9A24A, vert: 0x7CC583, sapin: 0x5E9E6A, tronc: 0x8A7462, creme: 0xEDE3CC, sable: 0xE3D3A8,
              olive: 0x6B7550, bleu: 0x2F5DA8, ciel: 0xA9CBE8, bois: 0xA9825A, sauge: 0xBFD3A6, ardoise: 0x5F6B7C,
              pierre: 0xEFE9DC, bronze: 0x6F8F86 };
  const mat = {}; for (const k in C) mat[k] = M(C[k]);
  const PEAUX = [0xE8BE9A, 0xC99874, 0x9A6B4B, 0xF0CDB0], CHEVEUX = [0x2B2320, 0x5A3B24, 0x8A6A3A, 0x1A1A1E, 0xB9B4AC];
  const TENUES = [C.marine, C.olive, 0x6E7480, 0x4E6E5D, 0x3B3F52];

  /* --- briques --- */
  let racine = scene;                               // parent par défaut : la scène, ou le groupe du lieu en construction
  const ySol = () => racine.userData.sol || 0;      // hauteur de la dalle du lieu
  function pose(m, x, y, z, parent, ombre = true) {
    m.position.set(x, y, z); m.castShadow = ombre; m.receiveShadow = true; (parent || racine).add(m); return m;
  }
  // Boîte aux arêtes adoucies dès qu'elle est assez épaisse.
  function box(w, h, d, m, x, y, z, p, o) {
    const mini = Math.min(w, h, d);
    const g = T.RoundedBoxGeometry && mini >= 0.24 ? new T.RoundedBoxGeometry(w, h, d, 2, Math.min(0.09, mini * 0.22)) : new T.BoxGeometry(w, h, d);
    return pose(new T.Mesh(g, m), x, y, z, p, o);
  }
  const cyl = (rt, rb, h, m, x, y, z, p, s = 14, o) => pose(new T.Mesh(new T.CylinderGeometry(rt, rb, h, s), m), x, y, z, p, o);
  const sph = (r, m, x, y, z, p, o) => pose(new T.Mesh(new T.SphereGeometry(r, 16, 12), m), x, y, z, p, o);
  const caps = (r, l, m, x, y, z, p, o) => pose(new T.Mesh(new T.CapsuleGeometry(r, l, 4, 10), m), x, y, z, p, o);
  // Aplat posé au sol (marquage, rivière).
  function plat(w, d, m, x, z, y = 0.012, ry = 0) {
    const p = new T.Mesh(new T.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.rotation.z = ry;
    p.position.set(x, y + ySol(), z); p.renderOrder = 1; racine.add(p); return p;
  }
  function groupe(x, z, ry, parent) { const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; (parent || racine).add(g); return g; }
  let graine = 11;
  const alea = () => { graine = (graine * 1664525 + 1013904223) >>> 0; return graine / 4294967296; };
  const tirage = a => a[Math.floor(alea() * a.length)];

  // Ombre de contact : tache douce sous un objet, pour qu'il tienne au sol.
  const texContact = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), im = g.createImageData(64, 64);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const d = Math.max(Math.abs(x - 31.5), Math.abs(y - 31.5)) / 31.5, a = d < 0.62 ? 1 : Math.max(0, 1 - (d - 0.62) / 0.38);
      im.data[(y * 64 + x) * 4 + 3] = Math.round(255 * a * a * (3 - 2 * a));
    }
    g.putImageData(im, 0, 0); return new T.CanvasTexture(c);
  })();
  const matContact = new T.MeshBasicMaterial({ map: texContact, color: col(0x2A3148), transparent: true, opacity: 0.26, depthWrite: false });
  function contact(w, d, x, z, ry, parent) {
    const p = new T.Mesh(new T.PlaneGeometry(w + 0.9, d + 0.9), matContact); p.rotation.x = -Math.PI / 2; p.rotation.z = ry || 0;
    p.position.set(x, ySol() + 0.026, z); p.renderOrder = 1; (parent || racine).add(p); return p;
  }

  // Texte dessiné sur une texture (nom de zone au sol, enseigne).
  function etiquette(txt, hauteur, couleur) {
    const px = 96, c = document.createElement('canvas'), g = c.getContext('2d');
    const police = `700 ${px}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    const regler = () => { g.font = police; try { g.letterSpacing = '9px'; } catch (e) {} };
    regler(); c.width = Math.ceil(g.measureText(txt).width) + px; c.height = Math.ceil(px * 1.5); regler();
    g.fillStyle = couleur; g.textBaseline = 'middle'; g.fillText(txt, px / 2, c.height / 2);
    const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const m = new T.Mesh(new T.PlaneGeometry(hauteur * c.width / c.height, hauteur),
      new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.renderOrder = 1; return m;
  }

  /* --- modèles 3D (KayKit, CC0) : géométrie et couleurs par sommet, reteintées à la demande --- */
  const matModele = new T.MeshLambertMaterial({ vertexColors: true }), geos = {};
  function geometrie(nom, ton) {
    const cle = nom + '|' + (ton === undefined ? '' : ton);
    if (geos[cle] !== undefined) return geos[cle];
    const m = MODELES && MODELES.index[nom];
    if (!m) return (geos[cle] = null);
    const g = new T.BufferGeometry(), buf = MODELES.tampon;
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(buf, m.p, m.n * 3), 3));
    g.setAttribute('normal', new T.BufferAttribute(new Int8Array(buf, m.nm, m.n * 3), 3, true));
    const cb = new Uint8Array(buf, m.c, m.n * 3), cf = new Float32Array(m.n * 3), c = new T.Color(), hsl = {}, cible = {};
    const pale = new T.Color(0xF4F2EC);
    if (typeof ton === 'number') new T.Color(ton).getHSL(cible);
    for (let i = 0; i < m.n; i++) {
      c.setRGB(cb[i * 3] / 255, cb[i * 3 + 1] / 255, cb[i * 3 + 2] / 255); c.getHSL(hsl);
      if (ton === 'pale') { c.setHSL(hsl.h, hsl.s * 0.4, hsl.l); c.lerp(pale, 0.6); }                 // maquette blanche
      else if (typeof ton === 'number') { if (hsl.s > 0.28 && hsl.l > 0.1 && hsl.l < 0.92) c.setHSL(cible.h, cible.s, Math.max(0.03, Math.min(0.97, cible.l + (hsl.l - 0.5) * 0.45))); }
      else c.setHSL(hsl.h, hsl.s * 0.85, hsl.l);
      c.convertSRGBToLinear(); cf[i * 3] = c.r; cf[i * 3 + 1] = c.g; cf[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(cf, 3));
    g.setIndex(new T.BufferAttribute(m.u32 ? new Uint32Array(buf, m.ix, m.i) : new Uint16Array(buf, m.ix, m.i), 1));
    return (geos[cle] = g);
  }
  // Pose un modèle. Options : e (échelle), ton ('pale' ou couleur), y, parent, sansContact.
  function modele(nom, x, z, ry, o = {}) {
    const g = geometrie(nom, o.ton); if (!g) return null;
    const e = o.e || 1, m = new T.Mesh(g, matModele), t = MODELES.index[nom].t;
    m.scale.setScalar(e); m.rotation.y = ry || 0;
    pose(m, x, o.y || 0, z, o.parent);
    if (!o.sansContact && !o.y && !o.parent) contact(t[0] * e, t[2] * e, x, z, ry);
    return m;
  }

  // Personnage : regarde vers +z ; jambes et bras articulés.
  function perso(o = {}) {
    const g = new T.Group(), u = g.userData;
    const m1 = M(o.manteau || C.marine), m2 = M(o.jambes || 0x232838), peau = o.matiere || M(o.peau || tirage(PEAUX));
    const membre = (x, y, r, l, m) => { const p = new T.Group(); p.position.set(x, y, 0); caps(r, l, m, 0, -(l / 2 + r), 0, p); g.add(p); return p; };
    u.jambeG = membre(-0.14, 0.93, 0.125, 0.62, o.matiere || m2); u.jambeD = membre(0.14, 0.93, 0.125, 0.62, o.matiere || m2);
    caps(0.26, 0.42, o.matiere || m1, 0, 1.36, 0, g).scale.z = 0.72;
    if (o.redingote) cyl(0.27, 0.36, 0.6, o.matiere || m1, 0, 0.8, 0, g, 12);
    u.brasG = membre(-0.36, 1.74, 0.085, 0.52, o.matiere || m1); u.brasD = membre(0.36, 1.74, 0.085, 0.52, o.matiere || m1);
    const tete = new T.Group(); tete.position.set(0, 2.03, 0); sph(0.23, peau, 0, 0, 0, tete);
    if (o.kepi) {
      cyl(0.22, 0.24, 0.2, o.matiere || mat.marine, 0, 0.22, 0, tete); if (!o.matiere) cyl(0.245, 0.245, 0.05, mat.rouge, 0, 0.14, 0, tete);
      box(0.28, 0.03, 0.18, o.matiere || mat.nuit, 0, 0.12, 0.22, tete, false);
    } else if (o.bicorne) {
      const b = pose(new T.Mesh(new T.SphereGeometry(0.3, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat.nuit), 0, 0.15, 0, tete);
      b.scale.set(2.0, 0.9, 0.42); box(0.1, 0.1, 0.04, mat.rouge, 0.2, 0.28, 0.13, tete, false);
    } else {
      const ch = pose(new T.Mesh(new T.SphereGeometry(0.25, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(o.cheveux || tirage(CHEVEUX))), 0, 0.02, -0.02, tete, false);
      ch.rotation.x = -0.35;
    }
    g.add(tete); u.tete = tete;
    return g;
  }
  const debout = (o, x, z, ry) => { const p = perso(o); p.position.set(x, 0, z); p.rotation.y = ry || 0; racine.add(p); return p; };
  // Personnage assis sur un siège (modèle de chaise, ou simple tabouret si les modèles manquent).
  const dactylos = [];
  function assis(o, x, z, ry, siege = 'chair_C', ton = C.marine) {
    const g = groupe(x, z, ry);
    if (!siege || !modele(siege, 0, siege === 'chair_C' ? -0.1 : 0, 0, { e: 1.3, ton, parent: g })) { box(0.6, 0.08, 0.6, mat.nuit, 0, 0.56, 0, g); box(0.6, 0.7, 0.07, mat.nuit, 0, 0.95, -0.3, g); }
    contact(0.9, 0.9, 0, 0, 0, g);
    const p = perso(o), u = p.userData; p.position.y = -0.3; g.add(p);
    u.jambeG.rotation.x = u.jambeD.rotation.x = -Math.PI / 2; u.brasG.rotation.x = u.brasD.rotation.x = -1.15;
    if (o.tape) dactylos.push({ u, ph: alea() * 6 });
    return p;
  }
  function marche(p, t, enMouvement) {
    const u = p.userData; if (!u.jambeG) return;
    const a = enMouvement ? Math.sin(t * (u.cadence || 7)) * 0.55 : 0;
    u.jambeG.rotation.x = a; u.jambeD.rotation.x = -a; u.brasG.rotation.x = -a * 0.7;
    if (!u.geste) u.brasD.rotation.x = a * 0.7;
  }
  const tourner = (a, b, k) => { const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * Math.min(1, k); };
  const acteurs = [];
  // Ronde : suite de points {x, z, attente, face, geste}. À l'arrêt, le personnage se tourne vers « face ».
  function ronde(p, pts, vitesse) {
    p.userData.ronde = { pts, i: 1 % pts.length, attente: 0, v: vitesse, ici: pts[0] };
    p.position.x = pts[0].x; p.position.z = pts[0].z; acteurs.push(p);
  }
  function avancer(p, dt, t) {
    const s = p.userData.ronde, u = p.userData;
    if (s.attente > 0) {
      s.attente -= dt; marche(p, t, false);
      if (s.ici.face !== undefined) p.rotation.y = tourner(p.rotation.y, s.ici.face, dt * 6);
      if (u.brasD) {
        u.geste = !!s.ici.geste && s.attente > 0.35;
        const cible = u.geste ? -2.1 + Math.sin(t * 3) * 0.1 : 0;
        u.brasD.rotation.x += (cible - u.brasD.rotation.x) * Math.min(1, dt * 7);
      }
      return;
    }
    u.geste = false;
    const c = s.pts[s.i], dx = c.x - p.position.x, dz = c.z - p.position.z, d = Math.hypot(dx, dz);
    if (d < 0.08) { s.ici = c; s.attente = c.attente || 0; s.i = (s.i + 1) % s.pts.length; return; }
    const pas = Math.min(d, s.v * dt);
    p.position.x += dx / d * pas; p.position.z += dz / d * pas;
    p.rotation.y = tourner(p.rotation.y, Math.atan2(dx, dz), dt * 9);
    marche(p, t, true);
  }
  // Deux personnes qui discutent : chacune parle à son tour.
  const duos = [];
  function duo(x, z, ry, o1, o2) {
    const g = groupe(x, z, ry), a = perso(o1), b = perso(o2);
    a.position.set(-0.6, 0, 0); a.rotation.y = Math.PI / 2; b.position.set(0.6, 0, 0); b.rotation.y = -Math.PI / 2; g.add(a, b);
    duos.push({ a: a.userData, b: b.userData, ph: alea() * 6 });
  }

  /* --- mobilier maison --- */
  function bureau(x, z, w, d, ry, h = 0.95, plateau = mat.blanc) {
    const g = groupe(x, z, ry);
    box(w, 0.09, d, plateau, 0, h, 0, g);
    box(0.07, h - 0.04, d * 0.8, mat.nuit, -w / 2 + 0.14, (h - 0.04) / 2, 0, g); box(0.07, h - 0.04, d * 0.8, mat.nuit, w / 2 - 0.14, (h - 0.04) / 2, 0, g);
    contact(w, d, 0, 0, 0, g);
    return g;
  }
  function portable(g, x, y, z) {
    box(0.5, 0.03, 0.36, mat.grisF, x, y + 0.02, z, g, false);
    box(0.5, 0.34, 0.03, mat.nuit, x, y + 0.19, z - 0.2, g, false).rotation.x = -0.2;
  }
  const ECRAN = U(0xA8CBEA);
  function ecran(x, z, ry) {
    const g = groupe(x, z, ry);
    cyl(0.4, 0.4, 0.05, mat.grisF, 0, 0.03, 0, g); cyl(0.06, 0.06, 1.3, mat.grisF, 0, 0.65, 0, g);
    box(2.6, 1.5, 0.1, mat.nuit, 0, 1.95, 0, g); box(2.4, 1.3, 0.02, ECRAN, 0, 1.95, 0.06, g, false);
    box(0.5, 0.2, 0.02, U(C.bleu), -0.5, 1.75, 0.075, g, false); box(0.4, 0.2, 0.02, U(C.rouge), 0.5, 2.2, 0.075, g, false);
    contact(1, 0.8, 0, 0, 0, g);
    return g;
  }
  const verre = new T.MeshLambertMaterial({ color: col(0xCFE2EC), transparent: true, opacity: 0.3, depthWrite: false });
  // Cloison vitrée entre deux points, montants gris.
  function vitrage(x1, z1, x2, z2, h = 2.5) {
    const L = Math.hypot(x2 - x1, z2 - z1), g = groupe((x1 + x2) / 2, (z1 + z2) / 2, -Math.atan2(z2 - z1, x2 - x1));
    const v = pose(new T.Mesh(new T.BoxGeometry(L, h - 0.2, 0.05), verre), 0, h / 2 + 0.05, 0, g, false); v.receiveShadow = false; v.renderOrder = 3;
    box(L, 0.07, 0.1, mat.gris, 0, h, 0, g); box(L, 0.12, 0.1, mat.gris, 0, 0.06, 0, g);
    const n = Math.max(1, Math.round(L / 2.4));
    for (let i = 0; i <= n; i++) box(0.08, h, 0.1, mat.gris, -L / 2 + i * L / n, h / 2, 0, g);
    contact(L, 0.1, 0, 0, 0, g);
  }
  // Porte vitrée coulissante : elle s'efface quand le lieu est ouvert.
  const portes = [];
  function porte(id, x1, z1, x2, z2, h = 2.5) {
    const L = Math.hypot(x2 - x1, z2 - z1), g = groupe(x1, z1, -Math.atan2(z2 - z1, x2 - x1));
    const v = new T.Group(); v.position.x = L / 2; g.add(v);
    const p = pose(new T.Mesh(new T.BoxGeometry(L, h - 0.25, 0.05), verre), 0, h / 2, 0.09, v, false); p.receiveShadow = false; p.renderOrder = 3;
    box(0.06, h - 0.2, 0.07, mat.rouge, L / 2 - 0.03, h / 2, 0.09, v, false); box(0.06, h - 0.2, 0.07, mat.rouge, -L / 2 + 0.03, h / 2, 0.09, v, false);
    portes.push({ v, L, id });
  }
  // Étagère longue de « len » selon x, tournée vers +z. Livres serrés, ou bacs de rangement.
  const TEINTES = [0x1F2A44, 0xD3262E, 0xC9A24A, 0xEDE3CC, 0x4E6E5D, 0x8C97A8, 0xF2F0EA, 0xD3262E];
  function etagere(len, double, x, z, ry, bacs) {
    const g = groupe(x, z, ry), prof = double ? 0.74 : 0.44;
    box(len, 2.6, 0.05, mat.gris, 0, 1.3, double ? 0 : -prof / 2 + 0.03, g);
    for (let i = 0; i < 4; i++) box(len, 0.06, prof, mat.blanc, 0, 0.06 + i * 0.84, 0, g);
    box(0.07, 2.6, prof, mat.blanc, -len / 2, 1.3, 0, g); box(0.07, 2.6, prof, mat.blanc, len / 2, 1.3, 0, g);
    const lots = [];
    (double ? [1, -1] : [1]).forEach(cote => {
      for (let niv = 0; niv < 3; niv++) {
        let px = -len / 2 + 0.1;
        while (px < len / 2 - (bacs ? 0.6 : 0.3)) {
          if (alea() < (bacs ? 0.15 : 0.07)) { px += 0.25 + alea() * 0.3; continue; }
          const w = bacs ? 0.42 + alea() * 0.2 : 0.1 + alea() * 0.12, h = bacs ? 0.3 + alea() * 0.12 : 0.44 + alea() * 0.26;
          lots.push({ x: px + w / 2, y: 0.09 + niv * 0.84 + h / 2, z: cote * (double ? 0.2 : 0.03), w, h });
          px += w + (bacs ? 0.08 : 0.012);
        }
      }
    });
    const inst = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshLambertMaterial({ color: 0xffffff }), lots.length);
    const m4 = new T.Matrix4(), q = new T.Quaternion();
    lots.forEach((b, i) => {
      m4.compose(new T.Vector3(b.x, b.y, b.z), q, new T.Vector3(b.w, b.h, 0.28));
      inst.setMatrixAt(i, m4); inst.setColorAt(i, col(tirage(TEINTES)));
    });
    inst.castShadow = true; inst.receiveShadow = true; g.add(inst);
    contact(len, prof, 0, 0, 0, g);
  }
  function arbre(x, z, s) {
    cyl(0.1 * s, 0.14 * s, 1.9 * s, mat.tronc, x, 0.95 * s, z, null, 6); sph(1.35 * s, mat.vert, x, 2.9 * s, z); contact(0.8 * s, 0.8 * s, x, z);
  }
  const buisson = (x, z, e = 0.85) => modele('bush', x, z, alea() * 6, { e, ton: C.vert }) || sph(0.6 * e, mat.vert, x, 0.5 * e, z);
  const TONS_AUTO = [0xF4F4F1, C.nuit, C.olive, 0x8C97A8, undefined, 0xF4F4F1, C.marine];
  function voiture(x, z, ry, k, roule) {
    const nom = ['car_sedan', 'car_hatchback', 'car_stationwagon'][k % 3];
    return modele(nom, x, z, ry, { ton: TONS_AUTO[k % TONS_AUTO.length], sansContact: roule }) || box(2.2, 1.4, 4.6, mat.blanc, x, 0.8, z);
  }

  /* --- sol, enceinte --- */
  plat(4000, 4000, U(SOL), 0, 0, 0);
  const ombres = new T.Mesh(new T.PlaneGeometry(150, 150), new T.ShadowMaterial({ color: col(0x2A3148), opacity: 0.2, depthWrite: false }));
  ombres.rotation.x = -Math.PI / 2; ombres.position.y = 0.03; ombres.receiveShadow = true; ombres.renderOrder = 2; scene.add(ombres);

  const mur = (w, h, d, x, z) => { box(w, h, d, mat.blanc, x, h / 2, z); box(w + 0.12, 0.28, d + 0.12, mat.rouge, x, h + 0.14, z); contact(w, d, x, z); };
  mur(14.2, 2.8, 0.4, -17.1, -16); mur(14.2, 2.8, 0.4, 17.1, -16); mur(0.4, 2.8, 30, -24, -1);     // fond et côté gauche : murs hauts
  mur(0.4, 1.0, 30, 24, -1); mur(20.8, 1.0, 0.4, -13.6, 14); mur(20.8, 1.0, 0.4, 13.6, 14);
  [-3.05, 3.05].forEach(x => { box(0.7, 1.9, 0.7, mat.blanc, x, 0.95, 14); box(0.84, 0.2, 0.84, mat.rouge, x, 2.0, 14); });
  const nomQuartier = (titre || 'Quartier IA').toUpperCase();
  const enseigne2 = etiquette(nomQuartier, 1.9, '#D3262E');
  enseigne2.position.set(-23.78, 1.45, -1.2); enseigne2.rotation.y = Math.PI / 2; scene.add(enseigne2);

  /* --- bâtiment d'honneur, inspiré de l'École militaire : fronton, pilastres, dôme quadrangulaire --- */
  box(20, 5.6, 4.6, mat.pierre, 0, 2.8, -17.05); box(20.4, 0.3, 5, mat.blanc, 0, 5.75, -17.05);            // corps et corniche
  box(20.2, 0.9, 4.8, mat.ardoise, 0, 6.3, -17.05);                                                         // toit en ardoise
  box(7.6, 8.0, 0.5, mat.pierre, 0, 4.0, -14.62);                                                          // avant-corps
  box(8.2, 0.25, 1.1, mat.blanc, 0, 3.25, -14.25);                                                         // balcon
  [-3.3, -1.1, 1.1, 3.3].forEach(x => { cyl(0.22, 0.25, 3.4, mat.blanc, x, 5.15, -14.05, null, 12); box(0.62, 0.2, 0.62, mat.blanc, x, 6.9, -14.05); box(0.62, 0.16, 0.62, mat.blanc, x, 3.45, -14.05); });
  box(8.2, 1.0, 1.0, mat.blanc, 0, 7.5, -14.2);                                                            // frise
  const fronton = pose(new T.Mesh(new T.CylinderGeometry(1, 1, 0.9, 3, 1, false, Math.PI), mat.pierre), 0, 8.0 + 0.72, -14.2);
  fronton.rotation.x = Math.PI / 2; fronton.scale.set(4.75, 1, 1.4);
  for (let i = 0; i < 10; i++) { const x = -8.9 + i * 1.98; if (Math.abs(x) > 4) { box(0.9, 1.4, 0.08, mat.ardoise, x, 4.4, -14.74, null, false); box(0.9, 1.5, 0.08, mat.ardoise, x, 1.6, -14.74, null, false); } }
  [-2.2, 0, 2.2].forEach(x => box(0.9, 1.7, 0.08, mat.ardoise, x, 5.1, -14.36, null, false));
  box(6.2, 1.2, 4.4, mat.pierre, 0, 7.5, -17.05);                                                           // attique
  const dome = pose(new T.Mesh(new T.SphereGeometry(3.3, 4, 10, Math.PI / 4, Math.PI * 2, 0, Math.PI / 2), new T.MeshLambertMaterial({ color: col(C.ardoise), flatShading: true })), 0, 8.1, -17.05);
  dome.scale.set(1.25, 1.05, 0.9);
  box(1.5, 0.7, 1.2, mat.pierre, 0, 11.75, -17.05); cyl(0.05, 0.05, 1.6, mat.laiton, 0, 12.9, -17.05, null, 6); sph(0.2, mat.laiton, 0, 12.25, -17.05);
  const enseigne = etiquette(nomQuartier, 0.95, '#D3262E'); enseigne.position.set(0, 7.5, -13.68); scene.add(enseigne);
  contact(20, 4.6, 0, -17.05);

  /* --- abords : clôture, ville, rue, stationnement --- */
  const poteaux = [];
  for (let x = -29; x <= 29.01; x += 2.42) poteaux.push([x, -22]);
  for (let z = -19.6; z <= 19; z += 2.4) { poteaux.push([-29, z]); poteaux.push([29, z]); }
  const pot = new T.InstancedMesh(new T.BoxGeometry(0.1, 1.7, 0.1), mat.gris, poteaux.length), m4p = new T.Matrix4();
  poteaux.forEach(([x, z], i) => pot.setMatrixAt(i, m4p.makeTranslation(x, 0.85, z)));
  pot.castShadow = true; scene.add(pot);
  [0.7, 1.4].forEach(y => {
    box(58, 0.05, 0.05, mat.gris, 0, y, -22, null, false); box(0.05, 0.05, 41.5, mat.gris, -29, y, -1.2, null, false); box(0.05, 0.05, 41.5, mat.gris, 29, y, -1.2, null, false);
  });
  const IMMEUBLES = ['building_A', 'building_C', 'building_E', 'building_G', 'building_H'];
  [-36, -24.6, -13.2, 13.2, 24.6, 36].forEach((x, i) => modele(IMMEUBLES[(i * 2 + 1) % 5], x, -30.5, 0, { ton: 'pale' }));
  modele('building_A', -1.8, -31.5, 0, { ton: 'pale' });
  [-19, -7.4, 4.2].forEach((z, i) => modele(IMMEUBLES[(i * 3) % 5], -37, z, Math.PI / 2, { ton: 'pale' }));
  [[-26.5, -19, 1], [-13, -19.3, .85], [13, -19.2, .9], [26.5, -19, 1], [26.6, -10, .95], [26.8, 2, 1.05], [26.6, 11, .85], [-26.6, -8, .9], [-26.6, 7, 1],
   [33, -16, 1.1], [34, -2, .95], [33, 12, 1.05], [-30, 31, 1], [-14, 31.5, .9], [2, 31, 1.1], [18, 31.4, .95], [34, 31, 1], [-8.4, -1.6, .75], [8.4, -1.6, .75]].forEach(([x, z, s]) => arbre(x, z, s));
  for (let i = 0; i < 11; i++) {
    const r = modele(i === 5 ? 'road_straight_crossing' : 'road_straight', -35.2 + i * 7.04, 23.5, 0, { sansContact: true });
    if (r) { r.scale.set(0.64, 0.12, 0.64); r.castShadow = false; }
  }
  [-35, -21, -7, 7, 21, 35].forEach(x => modele('streetlight', x, 27.6, Math.PI / 2));
  modele('trafficlight_A', 4.4, 19.6, Math.PI); modele('firehydrant', -5.2, 19.5, 0); modele('dumpster', -26.6, 16.2, Math.PI / 2, { ton: C.olive });
  [-19.6, -16.4, -10, 7.2, 10.4, 16.8, 20].forEach((x, k) => voiture(x, 16.9, k % 2 ? Math.PI : 0, k));
  const ligne = U(0xFFFFFF);
  [-21.2, -18, -14.8, -11.6, -8.4, 5.6, 8.8, 12, 15.2, 18.4, 21.6].forEach(x => plat(0.1, 4.6, ligne, x, 16.9));
  const circulation = [0, 1, 2].map(k => {
    const v = voiture(0, k === 1 ? 25.1 : 21.9, k === 1 ? -Math.PI / 2 : Math.PI / 2, k + 3, true);
    v.position.y = 0.07; v.userData = { sens: k === 1 ? -1 : 1, x0: [-30, 10, 34][k], v: [6.5, 5.5, 7][k] }; return v;
  });

  /* --- allée centrale : place d'armes, statue, bancs, réverbères --- */
  cyl(1.6, 1.6, 0.1, mat.rouge, 0, 0.05, -1.3, null, 28); cyl(1.35, 1.35, 0.22, mat.blanc, 0, 0.11, -1.3, null, 28); contact(2.6, 2.6, 0, -1.3);
  cyl(0.07, 0.1, 8.4, mat.gris, 0, 4.2, -1.3); sph(0.16, mat.laiton, 0, 8.5, -1.3);
  const pavillon = [0x21468B, 0xF4F4F1, 0xD3262E].map((c, i) => {
    const g = new T.PlaneGeometry(0.95, 1.8, 6, 1);
    const m = new T.Mesh(g, new T.MeshLambertMaterial({ color: col(c), side: T.DoubleSide }));
    m.position.set(0.09 + 0.475 + i * 0.95, 7.4, -1.3); m.castShadow = true; scene.add(m);
    return { pos: g.attributes.position, dec: i * 0.95 };
  });
  // Statue équestre en bronze sur son socle.
  const st = groupe(-12.5, -1.3, Math.PI / 2);
  box(1.8, 1.5, 3.4, mat.pierre, 0, 0.75, 0, st); box(2.1, 0.2, 3.7, mat.blanc, 0, 0.1, 0, st); contact(2.1, 3.7, 0, 0, 0, st);
  caps(0.42, 1.2, mat.bronze, 0, 2.75, 0, st).rotation.x = Math.PI / 2;
  [[-0.24, 0.72], [0.24, 0.72], [-0.24, -0.72], [0.24, -0.72]].forEach(([x, z]) => cyl(0.09, 0.08, 1.05, mat.bronze, x, 2.0, z, st, 8));
  caps(0.2, 0.6, mat.bronze, 0, 3.3, 0.95, st).rotation.x = 0.7; box(0.26, 0.3, 0.6, mat.bronze, 0, 3.72, 1.38, st).rotation.x = 0.5;
  caps(0.07, 0.6, mat.bronze, 0, 2.6, -1.05, st).rotation.x = -0.5;
  const cavalier = perso({ matiere: mat.bronze, kepi: true }); cavalier.scale.setScalar(0.92); cavalier.position.set(0, 2.2, -0.05); st.add(cavalier);
  cavalier.userData.jambeG.rotation.z = -0.5; cavalier.userData.jambeD.rotation.z = 0.5; cavalier.userData.brasD.rotation.x = -0.9;
  [[-6.6, 3.6, Math.PI / 2], [6.6, 3.6, -Math.PI / 2], [12.5, -1.2, Math.PI / 2], [-4.4, -1.2, Math.PI / 2], [4.4, -1.2, -Math.PI / 2]].forEach(([x, z, ry]) => {
    if (!modele('bench', x, z, ry, { e: 1.1 })) box(2.2, 0.1, 0.6, mat.bois, x, 0.5, z);
  });
  [[-8.8, 2.4], [8.8, 2.4], [-7.5, -4.2], [7.5, -4.2]].forEach(([x, z]) => modele('streetlight', x, z, x < 0 ? 0 : Math.PI, { e: 0.8 }));
  [[-23.2, -3.9], [-23.2, 1.4], [23.2, -3.9], [23.2, 1.4], [-6.2, 13], [6.2, 13], [-23.2, 12.6], [23.2, 12.6], [-9, -15.2], [9, -15.2]].forEach(([x, z]) => buisson(x, z, 0.9));
  duo(16.5, -1.1, 0.5, { manteau: C.marine }, { manteau: C.olive }); duo(-17.5, -1.2, -0.4, { manteau: 0x6E7480 }, { manteau: C.marine });

  /* --- zones : un groupe par lieu, dalle, liseré rouge, nom au sol --- */
  const boites = {}, groupes = {}, noms = [], trait = U(C.rouge);
  function ouvrirLieu(id) {
    const L = LIEUX3D[id], g = new T.Group(); g.userData.sol = 0.06; scene.add(g); groupes[id] = g; racine = g;
    box(L.w, 0.1, L.d, M(L.sol), L.x, 0.01, L.z, g, false);
    const e = 0.14;
    plat(L.w + e, e, trait, L.x, L.z - L.d / 2, 0.004); plat(L.w + e, e, trait, L.x, L.z + L.d / 2, 0.004);
    plat(e, L.d, trait, L.x - L.w / 2, L.z, 0.004); plat(e, L.d, trait, L.x + L.w / 2, L.z, 0.004);
    boites[id] = new T.Box3(new T.Vector3(L.x - L.w / 2, 0, L.z - L.d / 2), new T.Vector3(L.x + L.w / 2, L.h, L.z + L.d / 2));
    return L;
  }
  lieux.forEach(l => {
    const L = LIEUX3D[l.id]; if (!L) return;
    const g = new T.Group(), e = etiquette(l.nom.toUpperCase(), 1.1, '#4A5062');
    e.rotation.x = -Math.PI / 2; g.add(e); g.position.y = 0.022; scene.add(g); noms.push({ g, L });
  });
  let quart = -1;
  // Les noms au sol se replacent du côté de la caméra, pour rester lisibles quand la scène tourne.
  function orienterNoms() {
    const q = ((Math.round(Math.atan2(cam.position.x - ctl.target.x, cam.position.z - ctl.target.z) / (Math.PI / 2)) % 4) + 4) % 4;
    if (q === quart) return; quart = q;
    const sx = Math.round(Math.sin(q * Math.PI / 2)), sz = Math.round(Math.cos(q * Math.PI / 2));
    noms.forEach(({ g, L }) => {
      const c = L.arriere ? -1 : 1;   // l'accueil touche le mur d'enceinte : son nom passe du côté opposé
      g.rotation.y = q * Math.PI / 2; g.position.x = L.x + c * sx * (L.w / 2 + 0.9); g.position.z = L.z + c * sz * (L.d / 2 + 0.9);
    });
  }
  let survol = null, choisi = null;

  /* --- Accueil : poste de garde, barrière, panneau, planton --- */
  const A = ouvrirLieu('accueil');
  box(3, 2.5, 2.4, mat.blanc, A.x - 2.6, 1.25, A.z - 1.4); box(3.6, 0.22, 3, mat.marine, A.x - 2.6, 2.6, A.z - 1.4); contact(3, 2.4, A.x - 2.6, A.z - 1.4);
  box(1.8, 0.9, 0.06, mat.nuit, A.x - 2.6, 1.6, A.z - 0.18, null, false); box(2.1, 0.1, 0.4, mat.laiton, A.x - 2.6, 1.08, A.z - 0.05);
  cyl(0.06, 0.06, 2.2, mat.gris, A.x + 1.2, 1.1, A.z - 2.6); cyl(0.06, 0.06, 2.2, mat.gris, A.x + 3.2, 1.1, A.z - 2.6);
  box(2.3, 1.3, 0.1, mat.marine, A.x + 2.2, 1.75, A.z - 2.6);
  [-0.7, 0, 0.7].forEach((dx, i) => box(0.5, i === 1 ? 0.9 : 0.7, 0.03, mat.blanc, A.x + 2.2 + dx, 1.78, A.z - 2.53, null, false));
  modele('cactus_medium_A', A.x - 0.6, A.z - 2.5, 0, { e: 1.3 }); modele('bench', A.x + 2.6, A.z - 0.6, 0, { e: 1 });
  const barriere = new T.Group(); barriere.position.set(-2.55, 1.15, 14); A && racine.add(barriere);
  for (let i = 0; i < 6; i++) box(0.82, 0.16, 0.16, i % 2 ? mat.blanc : mat.rouge, 0.41 + i * 0.82, 0, 0, barriere);
  const planton = debout({ manteau: C.marine, kepi: true }, 0, 0);
  ronde(planton, [{ x: A.x - 0.4, z: A.z + 2.3, attente: 2.2, face: 0 }, { x: A.x + 3.6, z: A.z + 2.3, attente: 2.2, face: 0 }], 1.5);

  /* --- Bibliothèque : rayonnages, table de lecture, coin salon, lecteurs, flâneur --- */
  const B = ouvrirLieu('bibliotheque');
  box(14, 3, 0.25, mat.blanc, B.x, 1.5, B.z - 4.87); box(0.25, 3, 10, mat.blanc, B.x - 6.87, 1.5, B.z); contact(14, 0.25, B.x, B.z - 4.87); contact(0.25, 10, B.x - 6.87, B.z);
  vitrage(B.x - 7, B.z + 4.9, B.x + 1, B.z + 4.9); vitrage(B.x + 3.6, B.z + 4.9, B.x + 7, B.z + 4.9); vitrage(B.x + 6.9, B.z - 5, B.x + 6.9, B.z + 4.9);
  porte('bibliotheque', B.x + 1, B.z + 4.9, B.x + 3.6, B.z + 4.9);
  etagere(11.6, false, B.x + 0.3, B.z - 4.5, 0);
  [-5.2, -2.8, -0.4].forEach(dx => etagere(4.2, true, B.x + dx, B.z - 1.5, Math.PI / 2));
  const tx = B.x + 3.9, tz = B.z + 2.3;
  modele('rug_rectangle_stripes_A', tx, tz, 0, { e: 1.5, ton: C.rouge, sansContact: true });
  if (!modele('table_medium_long', tx, tz, 0, { e: 1.05, ton: 'pale' })) bureau(tx, tz, 2.8, 1.8, 0);
  modele('lamp_table', tx + 0.95, tz - 0.35, 0, { e: 0.7, y: 0.95, ton: C.laiton }); modele('book_set', tx - 0.2, tz + 0.5, 0.4, { e: 1, y: 0.95 });
  const lecteur = assis({ manteau: 0x4E6E5D }, tx - 0.5, tz - 1.35, 0, 'chair_A');
  assis({ manteau: C.marine }, tx + 0.6, tz + 1.35, Math.PI, 'chair_A');
  const livre = new T.Group(); livre.position.set(tx - 0.5, 0.96, tz - 0.55); racine.add(livre);
  box(0.36, 0.03, 0.5, mat.creme, 0.19, 0.02, 0, livre, false).rotation.z = 0.1;
  box(0.36, 0.03, 0.5, mat.creme, -0.19, 0.02, 0, livre, false).rotation.z = -0.1;
  box(0.78, 0.02, 0.54, mat.rouge, 0, -0.005, 0, livre, false);
  const page = new T.Group(); page.position.y = 0.04; livre.add(page);
  box(0.34, 0.012, 0.48, mat.blanc, 0.17, 0, 0, page, false);
  // coin salon
  modele('rug_oval_A', B.x + 4.2, B.z - 2.2, 0, { e: 1.25, ton: 0x8C97A8, sansContact: true });
  modele('couch_pillows', B.x + 4.2, B.z - 3.3, 0, { ton: C.rouge }); modele('armchair', B.x + 2.1, B.z - 1.9, 1.1, { e: 0.95, ton: 0x8C97A8 });
  modele('table_low', B.x + 4.3, B.z - 1.6, 0, { e: 0.6, ton: 'pale' }); modele('lamp_standing', B.x + 6.1, B.z - 3.4, 0, { ton: C.laiton });
  modele('cactus_medium_A', B.x + 6.1, B.z + 0.2, 0, { e: 1.4 });
  const salon = perso({ manteau: C.olive }); salon.position.set(B.x + 3.7, -0.3, B.z - 3.25); racine.add(salon);
  salon.userData.jambeG.rotation.x = salon.userData.jambeD.rotation.x = -Math.PI / 2; salon.userData.brasG.rotation.x = salon.userData.brasD.rotation.x = -0.9;
  modele('cabinet_medium_decorated', B.x - 5.3, B.z + 4.1, Math.PI, { ton: 'pale' });
  modele('pictureframe_large_B', B.x - 6.7, B.z + 2.2, Math.PI / 2, { y: 1.4, e: 1.1 });
  const flaneur = debout({ manteau: 0x8A4B3A, jambes: 0x3B3F52 }, 0, 0);
  ronde(flaneur, [
    { x: B.x - 4, z: B.z + 2.4 }, { x: B.x - 4, z: B.z - 1.6, attente: 2.8, face: Math.PI / 2, geste: true },
    { x: B.x - 4, z: B.z + 2.4 }, { x: B.x - 1.6, z: B.z + 2.4 },
    { x: B.x - 1.6, z: B.z - 0.6, attente: 2.4, face: -Math.PI / 2, geste: true },
    { x: B.x - 1.6, z: B.z + 2.4 }, { x: B.x + 0.8, z: B.z + 3.7, attente: 1.4, face: 0.6 }
  ], 1.25);

  /* --- Salle de classe : tableau, écran, neuf postes, instructeur --- */
  const K = ouvrirLieu('classe');
  box(4.6, 1.7, 0.08, mat.marine, K.x - 1.9, 1.9, K.z - 4.82, null, false); box(4.4, 1.5, 0.1, mat.blanc, K.x - 1.9, 1.9, K.z - 4.82, null, false);
  [[-3.2, 2.3, 1.6, C.rouge], [-2.9, 2.0, 2.2, C.marine], [-3.3, 1.7, 1.4, C.marine], [-0.9, 2.1, 1.1, C.rouge]]
    .forEach(([dx, y, w, c]) => box(w, 0.07, 0.02, U(c), K.x + dx + w / 2 - 0.4, y, K.z - 4.76, null, false));
  box(3.4, 1.9, 0.08, mat.nuit, K.x + 3.9, 1.9, K.z - 4.82, null, false); box(3.2, 1.7, 0.02, ECRAN, K.x + 3.9, 1.9, K.z - 4.77, null, false);
  vitrage(K.x - 6.4, K.z - 4.85, K.x - 6.4, K.z + 4.9); vitrage(K.x + 6.4, K.z - 4.85, K.x + 6.4, K.z + 4.9);
  vitrage(K.x - 6.4, K.z + 4.9, K.x - 1.3, K.z + 4.9); vitrage(K.x + 1.3, K.z + 4.9, K.x + 6.4, K.z + 4.9);
  porte('classe', K.x - 1.3, K.z + 4.9, K.x + 1.3, K.z + 4.9);
  [-3.8, 0, 3.8].forEach(dx => [-0.7, 1.2, 3.1].forEach(dz => {
    const g = bureau(K.x + dx, K.z + dz, 2.6, 0.9, 0); portable(g, 0, 0.99, 0.05);
    assis({ manteau: tirage(TENUES), tape: true }, K.x + dx, K.z + dz + 0.78, Math.PI);
  }));
  modele('cabinet_small', K.x - 5.7, K.z - 4.2, 0, { ton: 'pale' }); modele('cactus_medium_A', K.x - 5.7, K.z - 4.2, 0, { y: 0.9, e: 0.9, sansContact: true });
  modele('cactus_medium_A', K.x + 5.6, K.z + 4.1, 1, { e: 1.5 });
  const instructeur = debout({ manteau: C.marine, jambes: 0x232838 }, 0, 0);
  ronde(instructeur, [
    { x: K.x - 4.6, z: K.z - 3.3, attente: 2.6, face: 0.25, geste: true },
    { x: K.x - 1.6, z: K.z - 3.5, attente: 2.4, face: Math.PI, geste: true },
    { x: K.x + 1.8, z: K.z - 3.2, attente: 2.2, face: -0.3 }
  ], 1.2);

  /* --- Champ de bataille : relief, rivière, unités, canons, bivouac, l'Empereur --- */
  const F = ouvrirLieu('bataille');
  const eau = U(0x9EC5E6), cours = [[-7, -0.5], [-3.6, -1.9], [0, -1.2], [3.3, -2.5], [7, -1.7]];
  for (let i = 0; i < cours.length - 1; i++) {
    const [x1, z1] = cours[i], [x2, z2] = cours[i + 1];
    plat(Math.hypot(x2 - x1, z2 - z1) + (i < cours.length - 2 ? 0.5 : 0), 1.0, eau, F.x + (x1 + x2) / 2, F.z + (z1 + z2) / 2, 0.006, -Math.atan2(z2 - z1, x2 - x1));
  }
  [[-3.8, -3.6, 2.6], [4.4, -3.9, 1.9]].forEach(([dx, dz, r]) => { const c = sph(r, mat.sauge, F.x + dx, 0.05, F.z + dz); c.scale.y = 0.42; });
  [[-6, -3.2], [-1.2, -4.2], [1.6, -3.4], [6.2, -2.9], [-5.4, -4.4], [2.6, -4.5]].forEach(([dx, dz]) => {
    cyl(0.07, 0.09, 0.5, mat.tronc, F.x + dx, 0.25, F.z + dz, null, 6); cyl(0, 0.5, 1.5, mat.sapin, F.x + dx, 1.2, F.z + dz, null, 8);
  });
  [[-2, -3], [0.2, -2.6], [2.6, -3.6], [4.6, -2.2]].forEach(([dx, dz]) => box(1.1, 0.3, 0.55, mat.rouge, F.x + dx, 0.2, F.z + dz));
  const bleus = [[-5.2, 0.9], [-3.4, 0.5], [-1.4, 0.8], [0.8, 0.4], [2.8, 0.7]].map(([dx, dz]) => {
    const b = box(1.1, 0.3, 0.55, mat.bleu, F.x + dx, 0.2, F.z + dz); b.userData.z0 = F.z + dz; return b;
  });
  [[-0.6, 2.4], [1.9, 2.6]].forEach(([dx, dz]) => {
    const g = groupe(F.x + dx, F.z + dz);
    cyl(0.1, 0.14, 1.4, mat.laiton, 0, 0.62, -0.25, g).rotation.x = -Math.PI / 2 + 0.16;
    [-0.42, 0.42].forEach(wx => { cyl(0.4, 0.4, 0.08, mat.bois, wx, 0.4, 0, g, 14).rotation.z = Math.PI / 2; });
    box(0.16, 0.12, 1.1, mat.bois, 0, 0.26, 0.6, g).rotation.x = 0.28; contact(1, 1.6, 0, 0.1, 0, g);
  });
  const fumee = sph(0.5, U(0xFFFFFF, { transparent: true, opacity: 0, depthWrite: false }), F.x - 0.6, 0.8, F.z + 1.3, null, false);
  fumee.receiveShadow = false; fumee.renderOrder = 4;
  [[4.9, 3.1], [3.0, 3.8]].forEach(([dx, dz]) => {
    pose(new T.Mesh(new T.CylinderGeometry(0.95, 0.95, 1.9, 3, 1, false, Math.PI / 2), mat.blanc), F.x + dx, 0.5, F.z + dz).rotation.z = Math.PI / 2; contact(1.9, 1.6, F.x + dx, F.z + dz);
  });
  modele('Barrel_A', F.x + 6.2, F.z + 2.2, 0, { e: 0.8, ton: C.bois }); modele('Barrel_A', F.x + 6.3, F.z + 3.2, 1, { e: 0.8, ton: C.bois }); modele('Box_C', F.x + 5.6, F.z + 4.4, 0.3, { e: 1.2 });
  const empereur = debout({ manteau: 0x6E7480, jambes: 0xF2F0EA, bicorne: true, redingote: true, peau: 0xE8BE9A }, 0, 0);
  ronde(empereur, [
    { x: F.x - 5.2, z: F.z + 3.5, attente: 3.2, face: Math.PI - 0.3, geste: true },
    { x: F.x - 2.6, z: F.z + 3.9, attente: 1.6, face: Math.PI },
    { x: F.x + 0.8, z: F.z + 4.0, attente: 2.6, face: Math.PI + 0.3, geste: true }
  ], 1.0);
  duo(F.x + 1.4, F.z + 4.3, 0.2, { manteau: C.bleu, jambes: 0xF2F0EA }, { manteau: C.bleu, jambes: 0xF2F0EA });

  /* --- Salle tactique : caisse à sable, écrans, opérateurs --- */
  const Q = ouvrirLieu('tactique');
  vitrage(Q.x - 6.4, Q.z - 4.4, Q.x + 6.4, Q.z - 4.4); vitrage(Q.x + 6.4, Q.z - 4.4, Q.x + 6.4, Q.z + 4.4); vitrage(Q.x - 6.4, Q.z + 4.4, Q.x + 6.4, Q.z + 4.4);
  vitrage(Q.x - 6.4, Q.z - 4.4, Q.x - 6.4, Q.z - 1.3); vitrage(Q.x - 6.4, Q.z + 1.5, Q.x - 6.4, Q.z + 4.4);
  porte('tactique', Q.x - 6.4, Q.z + 1.5, Q.x - 6.4, Q.z - 1.3);
  const cs = groupe(Q.x - 0.6, Q.z + 0.5);
  box(4.8, 0.8, 2.8, mat.blanc, 0, 0.4, 0, cs); box(5.1, 0.14, 3.1, mat.marine, 0, 0.87, 0, cs, false); box(4.7, 0.08, 2.7, mat.sable, 0, 0.95, 0, cs, false); contact(5.1, 3.1, 0, 0, 0, cs);
  [[-1.3, -0.6, 0.7], [1.2, 0.5, 0.55]].forEach(([x, z, r]) => { const c = sph(r, mat.sauge, x, 0.97, z, cs, false); c.scale.y = 0.35; });
  pose(new T.Mesh(new T.BoxGeometry(4.4, 0.02, 0.22), U(0x9EC5E6)), 0, 1.0, -0.15, cs, false).rotation.y = 0.22;
  [[-1.8, 0.8], [-0.9, 0.9], [0, 0.75], [0.6, 1.0]].forEach(([x, z]) => box(0.4, 0.12, 0.22, mat.bleu, x, 1.05, z, cs, false));
  [[-0.2, -0.9], [0.9, -0.7], [1.8, -1.0]].forEach(([x, z]) => box(0.4, 0.12, 0.22, mat.rouge, x, 1.05, z, cs, false));
  ecran(Q.x - 3.4, Q.z - 3.6, 0.15); ecran(Q.x + 0.2, Q.z - 3.7, -0.1);
  [[4.7, -2.9], [4.7, 0.4]].forEach(([dx, dz], i) => {
    const g = bureau(Q.x + dx, Q.z + dz, 2, 0.9, 0); portable(g, 0, 0.99, 0.05);
    assis({ manteau: i ? C.marine : C.olive, tape: true }, Q.x + dx, Q.z + dz + 0.78, Math.PI);
  });
  modele('cabinet_small', Q.x - 5.6, Q.z - 3.6, Math.PI / 2, { ton: 'pale' }); modele('cactus_medium_A', Q.x + 5.6, Q.z + 3.6, 0, { e: 1.5 });
  modele('rug_rectangle_A', Q.x - 3.9, Q.z + 3.1, 0, { e: 0.9, ton: 0x8C97A8, sansContact: true }); modele('armchair', Q.x - 4.6, Q.z + 3.2, 2.2, { e: 0.9, ton: C.rouge });
  const pointeur = debout({ manteau: C.marine }, Q.x - 0.6, Q.z + 2.7, Math.PI);
  debout({ manteau: C.olive }, Q.x - 4.1, Q.z + 0.4, Math.PI / 2);
  const officier = debout({ manteau: 0x6E7480 }, 0, 0);
  ronde(officier, [
    { x: Q.x + 2.9, z: Q.z + 2.6, attente: 2.2, face: -2.3 },
    { x: Q.x + 2.9, z: Q.z - 1.6, attente: 2.8, face: -0.95, geste: true }
  ], 1.1);

  /* --- Atelier : établi, servantes, bacs, palettes, imprimante 3D, drone, robot --- */
  const W = ouvrirLieu('atelier');
  box(6, 0.9, 0.9, mat.blanc, W.x - 1.5, 0.45, W.z - 3.6); box(6.2, 0.12, 1.1, mat.grisF, W.x - 1.5, 0.96, W.z - 3.6, null, false); contact(6.2, 1.1, W.x - 1.5, W.z - 3.6);
  box(6.2, 1.5, 0.08, mat.blanc, W.x - 1.5, 2.0, W.z - 4.15, null, false);
  cyl(0.05, 0.05, 2.7, mat.gris, W.x - 4.5, 1.35, W.z - 4.15, null, 6); cyl(0.05, 0.05, 2.7, mat.gris, W.x + 1.5, 1.35, W.z - 4.15, null, 6);
  [[-4, 0.7, C.rouge], [-3.3, 0.5, C.nuit], [-2.7, 0.9, C.grisF], [-1.9, 0.6, C.rouge], [-1.2, 0.8, C.nuit], [-0.4, 0.5, C.laiton], [0.3, 0.7, C.grisF]]
    .forEach(([dx, h, c]) => box(0.14, h, 0.04, M(c), W.x + dx, 2.5 - h / 2, W.z - 4.09, null, false));
  box(0.9, 0.38, 0.4, mat.rouge, W.x + 0.6, 1.21, W.z - 3.6); modele('Can_A', W.x - 3.9, W.z - 3.5, 0, { y: 1.02, sansContact: true }); modele('Box_A', W.x - 0.6, W.z - 3.6, 0.3, { y: 1.02, e: 0.8, sansContact: true });
  [3.2, 4.5].forEach(dx => {
    box(1.1, 1.3, 0.8, mat.rouge, W.x + dx, 0.72, W.z - 3.6); box(1.14, 0.06, 0.84, mat.nuit, W.x + dx, 1.4, W.z - 3.6, null, false); contact(1.1, 0.8, W.x + dx, W.z - 3.6);
    [0.4, 0.75, 1.1].forEach(y => box(0.9, 0.05, 0.02, mat.nuit, W.x + dx, y, W.z - 3.19, null, false));
  });
  etagere(4.6, false, W.x - 5.9, W.z + 0.6, Math.PI / 2, true);
  modele('Pallet_Small_Decorated_A', W.x - 5.2, W.z + 3.6, 0, { ton: C.rouge }); modele('Pallet_Small', W.x - 3.2, W.z + 3.7, 0.1);
  modele('Box_B', W.x - 3.3, W.z + 3.6, 0.4, { y: 0.45, e: 1.3, sansContact: true }); modele('Barrel_B', W.x + 5.6, W.z - 1.6, 0, { e: 0.85, ton: C.olive }); modele('Barrel_A', W.x + 5.7, W.z - 0.6, 0, { e: 0.85 });
  modele('Box_C', W.x + 0.4, W.z - 2.2, 0.5, { e: 1.2 }); modele('chair_stool', W.x - 3.6, W.z - 2.5, 0, { ton: C.nuit });
  const ti = bureau(W.x + 4, W.z + 1.2, 1.8, 1.3, 0);
  [[-0.5, -0.45], [0.5, -0.45], [-0.5, 0.45], [0.5, 0.45]].forEach(([x, z]) => pose(new T.Mesh(new T.BoxGeometry(0.06, 0.95, 0.06), mat.nuit), x, 1.47, z, ti));
  box(1.08, 0.06, 0.98, mat.nuit, 0, 1.96, 0, ti); box(0.86, 0.04, 0.76, mat.grisF, 0, 1.03, 0, ti, false);
  box(0.26, 0.3, 0.26, mat.rouge, 0, 1.2, 0, ti, false);
  const buse = box(0.16, 0.14, 0.16, mat.laiton, 0, 1.46, 0, ti, false);
  cyl(1.1, 1.1, 0.04, mat.blanc, W.x - 1.2, 0.08, W.z + 1.7, null, 28, false); cyl(0.8, 0.8, 0.05, mat.rouge, W.x - 1.2, 0.08, W.z + 1.7, null, 28, false);
  cyl(0.7, 0.7, 0.06, mat.blanc, W.x - 1.2, 0.08, W.z + 1.7, null, 28, false);
  const drone = new T.Group(); drone.position.set(W.x - 1.2, 1.8, W.z + 1.7); racine.add(drone);
  box(0.46, 0.16, 0.46, mat.nuit, 0, 0, 0, drone); box(0.12, 0.1, 0.12, mat.rouge, 0, -0.1, 0.2, drone, false);
  const helices = [];
  [Math.PI / 4, -Math.PI / 4].forEach(a => { pose(new T.Mesh(new T.BoxGeometry(1.5, 0.05, 0.1), mat.grisF), 0, 0.02, 0, drone).rotation.y = a; });
  [[0.53, 0.53], [-0.53, 0.53], [0.53, -0.53], [-0.53, -0.53]].forEach(([x, z]) => {
    cyl(0.05, 0.05, 0.14, mat.nuit, x, 0.1, z, drone, 6, false); helices.push(pose(new T.Mesh(new T.BoxGeometry(0.62, 0.02, 0.07), mat.gris), x, 0.18, z, drone, false));
  });
  const robot = new T.Group(); racine.add(robot);
  box(0.95, 0.3, 0.62, mat.olive, 0, 0.42, 0, robot); box(0.5, 0.12, 0.4, mat.nuit, 0, 0.63, 0.05, robot, false);
  cyl(0.03, 0.03, 0.5, mat.gris, 0, 0.9, -0.15, robot, 6); box(0.2, 0.14, 0.16, mat.rouge, 0, 1.18, -0.15, robot, false);
  [[-0.5, -0.28], [0.5, -0.28], [-0.5, 0.28], [0.5, 0.28]].forEach(([x, z]) => { cyl(0.22, 0.22, 0.14, mat.nuit, x, 0.22, z, robot, 12).rotation.z = Math.PI / 2; });
  ronde(robot, [{ x: W.x + 1.2, z: W.z + 3.6 }, { x: W.x + 5.5, z: W.z + 3.6, attente: 0.8 }, { x: W.x + 5.5, z: W.z + 2.7 }, { x: W.x + 1.2, z: W.z + 2.7, attente: 0.8 }], 1.6);
  const monteur = debout({ manteau: 0x6E7480, jambes: 0x232838 }, W.x - 2.4, W.z - 2.6, Math.PI);
  const magasinier = debout({ manteau: C.olive }, 0, 0);
  ronde(magasinier, [
    { x: W.x - 4.6, z: W.z + 0.6, attente: 2.6, face: -Math.PI / 2, geste: true },
    { x: W.x + 2.2, z: W.z + 0.4, attente: 3, face: Math.PI / 2 - 0.4 }
  ], 1.2);
  racine = scene;

  /* --- allées : coureur, visiteur --- */
  const coureur = debout({ manteau: C.rouge, jambes: 0x232838 }, 0, 0); coureur.userData.cadence = 11;
  ronde(coureur, [{ x: -21.5, z: 0.9 }, { x: 21.5, z: 0.9 }, { x: 22.2, z: -1.1 }, { x: 21.5, z: -3.1 }, { x: -21.5, z: -3.1 }, { x: -22.2, z: -1.1 }], 3.6);
  const visiteur = debout({ manteau: 0x3B3F52, jambes: 0x6E7480 }, 0, 0);
  ronde(visiteur, [
    { x: B.x + 2.3, z: B.z + 5.9, attente: 2, face: Math.PI }, { x: -6.5, z: 0.4 },
    { x: Q.x - 7.6, z: Q.z + 0.1, attente: 3, face: Math.PI / 2 }, { x: -6.5, z: 0.4 }
  ], 1.35);

  /* --- animation --- */
  const lisse = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  function animer(dt, t) {
    acteurs.forEach(p => avancer(p, dt, t));
    const ph = t % 12;                                 // la barrière se lève toutes les 12 secondes
    barriere.rotation.z = 1.25 * (ph < 5 ? 0 : ph < 6 ? lisse(ph - 5) : ph < 10 ? 1 : ph < 11 ? 1 - lisse(ph - 10) : 0);
    pavillon.forEach(f => {
      for (let k = 0; k < f.pos.count; k++) { const u = f.dec + f.pos.getX(k) + 0.475; f.pos.setZ(k, Math.sin(u * 2.3 - t * 3.4) * 0.075 * u); }
      f.pos.needsUpdate = true;
    });
    const pp = t % 5;                                  // une page toutes les 5 secondes
    page.rotation.z = pp < 0.9 ? lisse(pp / 0.9) * Math.PI : 0;
    lecteur.userData.tete.rotation.x = 0.32 + Math.sin(t * 0.7) * 0.07; lecteur.userData.tete.rotation.y = Math.sin(t * 0.4) * 0.18;
    bleus.forEach((b, i) => { b.position.z = b.userData.z0 - (0.5 + 0.5 * Math.sin(t * 0.45 + i * 0.7)) * 0.8; });
    const pf = t % 7;                                  // un coup de canon toutes les 7 secondes
    fumee.material.opacity = pf < 1.5 ? 0.8 * (1 - pf / 1.5) : 0;
    fumee.scale.setScalar(0.3 + pf * 0.9); fumee.position.y = 0.8 + pf * 0.5;
    buse.position.x = Math.sin(t * 2.2) * 0.3; buse.position.z = Math.sin(t * 1.3) * 0.22;
    drone.position.y = 1.8 + Math.sin(t * 1.4) * 0.3; drone.rotation.y += dt * 0.4; drone.rotation.z = Math.sin(t * 0.9) * 0.06;
    helices.forEach(h => { h.rotation.y = t * 32; });
    monteur.userData.brasD.rotation.x = -1.25 + Math.abs(Math.sin(t * 5)) * 0.7;
    pointeur.userData.brasD.rotation.x = -1.3 + Math.sin(t * 1.1) * 0.22; pointeur.rotation.y = Math.PI + Math.sin(t * 0.5) * 0.25;
    dactylos.forEach(d => { d.u.brasG.rotation.x = -1.15 + Math.sin(t * 9 + d.ph) * 0.07; d.u.brasD.rotation.x = -1.15 + Math.cos(t * 8 + d.ph) * 0.07; d.u.tete.rotation.x = 0.12 + Math.sin(t * 0.6 + d.ph) * 0.08; });
    duos.forEach(d => {                                // chacun parle à son tour, l'autre hoche la tête
      const tour = Math.floor((t + d.ph) / 3.5) % 2, qui = tour ? d.a : d.b, autre = tour ? d.b : d.a;
      qui.brasD.rotation.x += (-0.95 + Math.sin(t * 4.2) * 0.3 - qui.brasD.rotation.x) * Math.min(1, dt * 6); qui.tete.rotation.x = 0;
      autre.brasD.rotation.x += (0 - autre.brasD.rotation.x) * Math.min(1, dt * 6); autre.tete.rotation.x = Math.max(0, Math.sin(t * 3.3)) * 0.16;
    });
    circulation.forEach(v => { const u = v.userData; v.position.x = ((u.x0 + u.sens * t * u.v + 46) % 92 + 92) % 92 - 46; });
  }
  // Réactions au pointeur : le lieu visé ou ouvert se soulève, sa porte coulisse.
  function reagir(dt) {
    const k = Math.min(1, dt * 7);
    for (const id in groupes) { const g = groupes[id], cible = id === choisi ? 0.3 : id === survol ? 0.18 : 0; g.position.y += (cible - g.position.y) * k; }
    portes.forEach(p => { const cible = p.id === choisi ? -p.L * 0.45 : 0; p.v.position.z = 0; p.v.position.x += (p.L / 2 + cible * 2 - p.v.position.x) * k; });
  }

  /* --- pastille du lieu survolé ou ouvert --- */
  const pastille = $('#pastille'), proj = new T.Vector3();
  const nomDe = {}; lieux.forEach(l => { nomDe[l.id] = l.nom; });
  function placerPastille(w, h) {
    const id = survol || choisi, L = id && LIEUX3D[id];
    if (!L) { pastille.hidden = true; return; }
    proj.set(L.x, L.h + 0.9, L.z).project(cam);
    pastille.hidden = false; if (pastille.textContent !== nomDe[id]) pastille.textContent = nomDe[id] || '';
    pastille.style.transform = `translate(${((proj.x + 1) / 2 * w).toFixed(1)}px,${((1 - proj.y) / 2 * h).toFixed(1)}px) translate(-50%,-100%)`;
  }

  /* --- cadrage --- */
  const ENCEINTE = new T.Box3(new T.Vector3(-24.6, 0, -18), new T.Vector3(24.6, 3, 19)), CENTRE = new T.Vector3(0, 0, 0.5);
  const sonde = new T.PerspectiveCamera(30, 1, 2, 4000), v3 = new T.Vector3();
  let W_ = 1, H_ = 1, libre = false, trajet = null;
  const dirDe = (az, pol) => new T.Vector3(Math.sin(pol) * Math.sin(az), Math.cos(pol), Math.sin(pol) * Math.cos(az));
  // Plus petite distance à laquelle la boîte tient dans la fraction (fw, fh) de l'écran.
  function distancePour(boite, cible, dir, fw, fh) {
    sonde.aspect = cam.aspect; sonde.updateProjectionMatrix();
    let lo = 6, hi = 900;
    for (let i = 0; i < 24; i++) {
      const d = (lo + hi) / 2; let ok = true;
      sonde.position.copy(cible).addScaledVector(dir, d); sonde.lookAt(cible); sonde.updateMatrixWorld();
      for (let k = 0; k < 8 && ok; k++) {
        v3.set(k & 1 ? boite.max.x : boite.min.x, k & 2 ? boite.max.y : boite.min.y, k & 4 ? boite.max.z : boite.min.z).project(sonde);
        ok = Math.abs(v3.x) <= fw && Math.abs(v3.y) <= fh && v3.z < 1;
      }
      if (ok) hi = d; else lo = d;
    }
    return hi;
  }
  function vueDepart() {
    const dir = etroit.matches ? dirDe(1.36, 0.74) : dirDe(0.44, 0.8);
    const d = distancePour(ENCEINTE, CENTRE, dir, etroit.matches ? 1 : 0.94, Math.max(0.5, (H_ - 170) / H_));
    return { c: CENTRE.clone(), r: dir.multiplyScalar(d) };
  }
  function redim() {
    W_ = canvas.clientWidth || 1; H_ = canvas.clientHeight || 1;
    renderer.setSize(W_, H_, false); cam.aspect = W_ / H_; cam.updateProjectionMatrix();
    const v = vueDepart(); ctl.maxDistance = v.r.length() * 1.5;
    if (!libre) { ctl.target.copy(v.c); cam.position.copy(v.c).add(v.r); }
  }
  // Déplacement de caméra : la cible glisse, l'orientation tourne sur la sphère, le tout en douceur.
  const sA = new T.Spherical(), sB = new T.Spherical(), sC = new T.Spherical();
  function aller(cible, recul) {
    libre = true;
    trajet = { c0: ctl.target.clone(), c1: cible, r0: cam.position.clone().sub(ctl.target), r1: recul, t: reduit ? 1 : 0 };
  }
  function viser(id) {
    const L = LIEUX3D[id]; if (!L) return;
    const recul = cam.position.clone().sub(ctl.target), dir = recul.clone().normalize(), tel = etroit.matches;
    const centre = new T.Vector3(L.x, 1, L.z);
    const fw = tel ? 0.86 : Math.max(0.3, (W_ - 440) / W_ * 0.8), fh = tel ? Math.max(0.2, (H_ * 0.5 - 150) / H_ * 0.9) : Math.max(0.3, (H_ - 170) / H_ * 0.8);
    const d = Math.min(ctl.maxDistance, Math.max(ctl.minDistance, distancePour(boites[id], centre, dir, fw, fh)));
    const parPixel = 2 * d * Math.tan(cam.fov * Math.PI / 360) / H_, h = new T.Vector3(dir.x, 0, dir.z).normalize();
    if (tel) centre.addScaledVector(h, (H_ * 0.25 - 2) * parPixel / Math.max(0.3, dir.y));   // le lieu remonte au-dessus de la feuille
    else centre.addScaledVector(new T.Vector3(h.z, 0, -h.x), 205 * parPixel);                // le lieu se décale à gauche du panneau
    aller(centre, dir.multiplyScalar(d));
  }
  function vueEnsemble() { const v = vueDepart(); aller(v.c, v.r); }
  ctl.addEventListener('start', () => { trajet = null; libre = true; $('#aide').hidden = true; });

  /* --- pointage --- */
  const rayon = new T.Raycaster(), ndc = new T.Vector2(), touche = new T.Vector3();
  function lieuSous(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -(ev.clientY - r.top) / r.height * 2 + 1);
    rayon.setFromCamera(ndc, cam);
    let mieux = null, dMin = Infinity;
    lieux.forEach(l => {
      const b = boites[l.id]; if (!b || !rayon.ray.intersectBox(b, touche)) return;
      const d = touche.distanceTo(rayon.ray.origin); if (d < dMin) { dMin = d; mieux = l.id; }
    });
    return mieux;
  }
  let appui = null;
  canvas.addEventListener('pointerdown', ev => { appui = { x: ev.clientX, y: ev.clientY }; });
  window.addEventListener('pointerup', ev => {
    if (!appui || ev.target !== canvas) { appui = null; return; }
    const court = Math.hypot(ev.clientX - appui.x, ev.clientY - appui.y) < 7; appui = null;
    if (court) { const id = lieuSous(ev); if (id) surChoix(id); }
  });
  canvas.addEventListener('pointermove', ev => {
    if (ev.pointerType !== 'mouse' || ev.buttons) return;
    const id = lieuSous(ev);
    if (id !== survol) { survol = id; canvas.style.cursor = id ? 'pointer' : 'grab'; }
  });
  canvas.addEventListener('pointerleave', () => { survol = null; });

  /* --- boucle --- */
  const horloge = new T.Clock(), borne = (x, a, b) => Math.max(a, Math.min(b, x)); let temps = 0;
  // Qualité adaptative : si l'appareil peine, la définition baisse et les ombres se rafraîchissent moins souvent.
  renderer.shadowMap.autoUpdate = false;
  let niveau = 0, cumul = 0, mesures = 0, images = 0;
  function image() {
    requestAnimationFrame(image);
    const brut = horloge.getDelta(), dt = Math.min(brut, 0.05);
    if (++images % (niveau + 1) === 0) renderer.shadowMap.needsUpdate = true;
    if (images > 40 && !document.hidden) { cumul += brut; mesures++; }
    if (mesures >= 90) {
      if (cumul / mesures > 0.03 && niveau < 2) {
        niveau++; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, niveau === 1 ? 1.5 : 1)); renderer.setSize(W_, H_, false);
      }
      cumul = 0; mesures = 0;
    }
    if (!reduit) { temps += dt; animer(dt, temps); }
    reagir(reduit ? 1 : dt);
    if (trajet) {
      trajet.t = Math.min(1, trajet.t + dt / 1.15);
      const k = lisse(trajet.t);
      sA.setFromVector3(trajet.r0); sB.setFromVector3(trajet.r1);
      let dTheta = sB.theta - sA.theta; dTheta -= Math.round(dTheta / (2 * Math.PI)) * 2 * Math.PI;
      sC.set(sA.radius + (sB.radius - sA.radius) * k, sA.phi + (sB.phi - sA.phi) * k, sA.theta + dTheta * k);
      ctl.target.lerpVectors(trajet.c0, trajet.c1, k); cam.position.setFromSpherical(sC).add(ctl.target);
      if (trajet.t >= 1) trajet = null;
    } else {
      const x = borne(ctl.target.x, -28, 28), z = borne(ctl.target.z, -22, 24);   // la caméra ne quitte pas le quartier
      cam.position.x += x - ctl.target.x; cam.position.z += z - ctl.target.z; ctl.target.x = x; ctl.target.z = z;
    }
    ctl.update(); orienterNoms();
    renderer.render(scene, cam);
    placerPastille(W_, H_);
  }

  new ResizeObserver(redim).observe(canvas);
  redim();
  if (reduit) animer(0, 0);
  canvas.style.cursor = 'grab';
  image();

  return { viser, vueEnsemble, activer(id) { choisi = id; } };
}

