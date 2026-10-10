// Rendu image par image d'une composition HyperFrames sans la CLI : navigateur sans interface + ffmpeg.
// Reproduit ce que fait le moteur HyperFrames : place la timeline GSAP au temps voulu, émet "hf-seek",
// gère la visibilité des clips (data-start / data-duration), puis capture.
//
//   node outils/rendu.mjs                       rend renders/clip-cercle-ia-v3.mp4
//   node outils/rendu.mjs --images 1.2,4.5,12   images de contrôle + planche + contrôle de mise en page
//   ajouter --qualite brouillon pour un rendu rapide (une seule sous-image, sans lissage)
//
// Prérequis : Node 22+, ffmpeg, et le module playwright (chemin possible via PLAYWRIGHT_MODULE).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projet = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (nom, defaut) => { const i = process.argv.indexOf("--" + nom); return i > 0 ? process.argv[i + 1] : defaut; };
const IPS = +arg("ips", 30);
const sortie = path.resolve(projet, arg("sortie", "renders/clip-cercle-ia-v3.mp4"));
const images = arg("images", null);
const debut = +arg("debut", 0), fin = arg("fin", null), qualite = arg("qualite", null);

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2", ".wav": "audio/wav", ".mp3": "audio/mpeg" };
const serveur = http.createServer((req, res) => {
  const chemin = path.join(projet, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!chemin.startsWith(projet) || !fs.existsSync(chemin) || fs.statSync(chemin).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[path.extname(chemin)] || "application/octet-stream" });
  fs.createReadStream(chemin).pipe(res);
});
await new Promise((r) => serveur.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${serveur.address().port}/index.html`;

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const nav = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await nav.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
if (qualite) await page.addInitScript((q) => { window.__clipQualite = q; }, qualite);
const erreurs = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") erreurs.push(`[${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => erreurs.push("[exception] " + e.message));
page.on("requestfailed", (r) => erreurs.push("[requête] " + r.url()));
await page.goto(url, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

const info = await page.evaluate(() => {
  const racine = document.querySelector("[data-composition-id]");
  const id = racine.dataset.compositionId, tl = window.__timelines && window.__timelines[id];
  const clips = [...racine.querySelectorAll("[data-start]")].filter((c) => c.tagName !== "AUDIO");
  window.__aller = (t) => {
    tl.pause();
    tl.time(t, false);                       // événements actifs : les onUpdate tournent
    for (const c of clips) {
      const d = +c.dataset.start, n = +(c.dataset.duration || 1e9);
      c.style.visibility = t >= d && t < d + n ? "visible" : "hidden";
    }
    window.__hfThreeTime = t;
    window.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: t } }));
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  };
  return { id, duree: +racine.dataset.duration, timeline: tl ? tl.duration() : null,
    sons: [...racine.querySelectorAll("audio[src]")].map((a) => ({ src: a.getAttribute("src"), debut: +(a.dataset.start || 0), volume: +(a.dataset.volume || 1) })),
    polices: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`) };
});
console.log("composition", JSON.stringify(info));
if (!info.timeline) { console.error("timeline introuvable"); process.exit(1); }

if (images) {
  const dossier = path.join(projet, "snapshots");
  fs.mkdirSync(dossier, { recursive: true });
  const temps = images.split(",").map(Number), fichiers = [];
  for (const t of temps) {
    await page.evaluate((x) => window.__aller(x), t);
    const f = path.join(dossier, `t${t.toFixed(2).padStart(5, "0")}.png`);
    await page.screenshot({ path: f, type: "png" });
    fichiers.push(f);
    // contrôle de mise en page : rien de visible hors des marges, aucune ligne plus large que sa zone
    const alertes = await page.evaluate(() => {
      const visible = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const s = getComputedStyle(e); if (s.visibility === "hidden" || +s.opacity < 0.05 || s.display === "none") return false; } return true; };
      const out = [];
      for (const el of document.querySelectorAll(".ligne, .repere, .souligne, #carte, #carte *, #ia")) {
        if (!visible(el)) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        if (r.left < 40 || r.right > 1880 || r.top < 20 || r.bottom > 1062) out.push(`hors marges: ${el.id || el.className} [${Math.round(r.left)},${Math.round(r.top)} → ${Math.round(r.right)},${Math.round(r.bottom)}]`);
        const carte = el.closest(".carte");
        if (carte && el !== carte) { const c = carte.getBoundingClientRect(); if (r.right > c.right - 40 || r.left < c.left + 40) out.push(`déborde de la carte: ${el.id || el.className || el.tagName} (${Math.round(r.left - c.left)} → ${Math.round(c.right - r.right)})`); }
        const zone = el.closest(".phrase, .carte");
        if (zone && el.classList.contains("ligne") && r.width > zone.clientWidth) out.push(`ligne trop large: "${el.textContent.trim()}" ${Math.round(r.width)} > ${zone.clientWidth}`);
      }
      return out;
    });
    console.log(`t=${t}`, alertes.length ? alertes.join(" | ") : "mise en page conforme");
  }
  const col = Math.min(3, temps.length), lig = Math.ceil(temps.length / col);
  spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-pattern_type", "glob", "-i", path.join(dossier, "t*.png"), "-vf", `scale=640:360,tile=${col}x${lig}`, "-frames:v", "1", path.join(dossier, "planche.png")]);
  console.log("planche", path.join(dossier, "planche.png"));
} else {
  fs.mkdirSync(path.dirname(sortie), { recursive: true });
  const n0 = Math.round(debut * IPS), n1 = Math.round((fin ? +fin : info.duree) * IPS);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(IPS), "-i", "-",
    "-vf", "scale=out_color_matrix=bt709:out_range=tv", "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-movflags", "+faststart", sortie], { stdio: ["pipe", "inherit", "inherit"] });
  const t0 = Date.now();
  for (let n = n0; n < n1; n++) {
    await page.evaluate((x) => window.__aller(x), n / IPS);
    const tampon = await page.screenshot({ type: "png" });
    if (!ff.stdin.write(tampon)) await new Promise((r) => ff.stdin.once("drain", r));
    if ((n - n0) % 60 === 59) console.log(`image ${n + 1}/${n1} — ${Math.round((Date.now() - t0) / (n - n0 + 1))} ms/image`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log("images", `${n1 - n0} images en ${Math.round((Date.now() - t0) / 1000)} s`);
  // bande-son : les balises <audio> de la composition sont mixées puis jointes à l'image
  const sons = info.sons.filter((s) => fs.existsSync(path.join(projet, s.src)));
  if (sons.length && !debut && !fin) {
    const muet = sortie.replace(/\.mp4$/, "-muet.mp4");
    fs.renameSync(sortie, muet);
    const entrees = sons.flatMap((s) => ["-i", path.join(projet, s.src)]);
    const filtre = sons.map((s, i) => `[${i + 1}:a]adelay=${Math.round(s.debut * 1000)}:all=1,volume=${s.volume}[a${i}]`).join(";") + ";" + sons.map((s, i) => `[a${i}]`).join("") + `amix=inputs=${sons.length}:normalize=0,apad[mix]`;
    const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", muet, ...entrees, "-filter_complex", filtre, "-map", "0:v", "-map", "[mix]", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", sortie], { stdio: "inherit" });
    if (r.status === 0) fs.unlinkSync(muet); else fs.renameSync(muet, sortie);
  }
  console.log("rendu", sortie);
}
if (erreurs.length) console.log("ERREURS PAGE:\n" + [...new Set(erreurs)].join("\n"));
await nav.close();
serveur.close();
