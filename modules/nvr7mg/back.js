/* surec-hafta-tahmin — Süreç Hafta Tahmini — hafta oranlı bant, cetvel ve teslim tarihi hesabı (16 Kas 2026 · mcp:webmaker/20261116-113510-tlwf · D17).
   Üstte toplam süre ve sipariş tarihi alanı (seçilen tarihten tahmini teslim tarihi), altında adımların süresiyle orantılı yatay bant ve hafta cetveli, en altta adım kartları (etiket, başlık, metin, süre ve hesaplanan bitiş tarihi). Bant dilimi ile kartı birlikte vurgulanır. Hafta verisi yoksa dilimler eşit, cetvel ve tarih hesabı basılmaz.
   Üretici: scripts/modul-fabrika (aile surec) — elle düzenleme yerine tanımı değiştirip yeniden üret.
   Veri: data: [{ baslik, metin?, ikon?, sure?, no?, img?, url? }] — metinler dil sözlüğü; başlıksız adım atlanır. desing `adimEtiket` (eski `stepLabel`) «Adım {n}» kalıbı. */
const P = "modulex-surec-hafta-tahmin";
const IMG_KOK = "/img/";
/* --- ortak ön ek (scripts/modul-fabrika/on-ek.js) — dil · güvenlik · sayı yardımcıları --- */
const pick = (v) => {
  if (v == null) return "";
  if (typeof v !== "object") return String(v);
  if (typeof wmPickLang === "function") { try { return wmPickLang(v, json.lang) || ""; } catch (e) { /* alt satır */ } }
  return String(v[json.lang] ?? Object.values(v)[0] ?? "");
};
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const medyaUrl = (v) => {
  const s = String(v ?? "").trim();
  if (!s || /^\s*(javascript|vbscript|file):/i.test(s)) return "";
  if (/^data:/i.test(s)) return /^data:(image|video|audio)\//i.test(s) ? s : "";
  if (s.startsWith("/") || /^https?:\/\//i.test(s)) return s;
  return `${IMG_KOK}${s}`;
};
const href = (v) => {
  const s = String(v ?? "").trim();
  if (!s || /^\s*(javascript|vbscript|data):/i.test(s)) return "";
  if (/^(https?:)?\/\//i.test(s) || /^(mailto:|tel:|#)/i.test(s)) return s;
  return wxLangInternalHref(s);
};
const dogru = (v, d) => (v === undefined || v === null || v === "") ? d : !(v === false || v === "false" || v === 0 || v === "0");
const ikonAd = (v) => String(v ?? "").trim().replace(/[^a-z0-9_]/gi, "");
const satirlar = (s) => esc(s).replace(/\r?\n/g, "<br />");
/* ilk dolu alan: yeni ad önce, eski kuşak şablonun adı yedek (G6 yalnız path değiştirerek takas eder) */
const ilk = (o, ks) => {
  for (const k of ks) {
    const v = o == null ? undefined : o[k];
    if (v == null || v === "") continue;
    if (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length) continue;
    return v;
  }
  return "";
};
const metinAl = (o, ks) => pick(ilk(o, ks)).trim();
const { desing: des = {} } = json;
const setting = webmakerdata?.setting ?? {};
const veri = Array.isArray(json.data) ? json.data : [];
const dil = String(json.lang || "");
const sayiBicim = (v, ondalik) => {
  try { return new Intl.NumberFormat(dil || undefined, { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik }).format(v); } catch (e) { return String(v); }
};
const ikonH = (ad, sinif) => (ad ? `<span class="${sinif} material-symbols-outlined" aria-hidden="true">${ad}</span>` : "");
const no = (i) => String(i + 1).padStart(2, "0");
const ctaHtml = () => {
  const a1 = metinAl(des, ["cta_ad", "button"]); const u1 = href(ilk(des, ["cta_url", "buttonurl", "url"]));
  const a2 = metinAl(des, ["cta2_ad"]); const u2 = href(ilk(des, ["cta2_url"]));
  const d = (a, u, ek) => (a && u ? `<a class="${P}-dugme${ek}" href="${esc(u)}">${esc(a)}<span class="material-symbols-outlined mx-flip" aria-hidden="true">arrow_forward</span></a>` : "");
  const ic = d(a1, u1, "") + d(a2, u2, ` ${P}-dugme--ikincil`);
  return ic ? `<div class="${P}-cta">${ic}</div>` : "";
};
const basHtml = (B, ek) => {
  if (!B.ust && !B.baslik && !B.metin && !ek) return "";
  return `<header class="${P}-bas">`
    + (B.ust ? `<p class="${P}-ust">${esc(B.ust)}</p>` : "")
    + (B.baslik ? `<h2 class="${P}-baslik" id="${P}-{{id}}-b">${esc(B.baslik)}</h2>` : "")
    + (B.metin ? `<p class="${P}-metin">${satirlar(B.metin)}</p>` : "")
    + (ek || "")
    + "</header>";
};
/* --- aile: surec --- */
const kaynak = veri.length ? veri : (json.data && Array.isArray(json.data.adimlar) ? json.data.adimlar : (Array.isArray(des.adimlar) ? des.adimlar : []));
const adimKalip = metinAl(des, ["adimEtiket", "stepLabel"]);
const kayitlar = kaynak.map((o) => ({
  no: String(ilk(o, ["no", "numara"]) || "").trim(), baslik: metinAl(o, ["baslik", "title", "name", "ad"]),
  metin: metinAl(o, ["metin", "text", "description", "aciklama", "ozet"]), ikon: ikonAd(ilk(o, ["ikon", "icon"])),
  sure: metinAl(o, ["sure", "duration", "zaman"]), img: medyaUrl(ilk(o, ["img", "image", "gorsel"])), url: href(ilk(o, ["url", "link"])),
})).filter((k) => k.baslik);
kayitlar.forEach((k, i) => { k.sira = k.no || no(i); k.etiket = adimKalip ? adimKalip.replace(/\{n\}/g, k.no || String(i + 1)) : ""; });
const bH = (k, s, t) => `<${t || "h3"} class="${P}-${s || "kbaslik"}">${k.url ? `<a class="${P}-bag" href="${esc(k.url)}">${esc(k.baslik)}</a>` : esc(k.baslik)}</${t || "h3"}>`;
const mH = (k, s) => (k.metin ? `<p class="${P}-${s || "kmetin"}">${satirlar(k.metin)}</p>` : "");
const eH = (k, s) => (k.etiket ? `<p class="${P}-${s || "etiket"}">${esc(k.etiket)}</p>` : "");
const sH = (k) => (k.sure ? `<p class="${P}-sure"><span class="material-symbols-outlined" aria-hidden="true">schedule</span>${esc(k.sure)}</p>` : "");
const gH = (k, s) => (k.img ? `<img class="${P}-${s || "gorsel"}" src="${esc(k.img)}" alt="" width="800" height="560" loading="lazy" decoding="async" />` : "");
/* --- modül: surec-hafta-tahmin --- */
const kart = (k, i) => {
    const o = kaynak.filter((x) => metinAl(x, ["baslik", "title", "name", "ad"]))[i] || {};
    const h = Number(String(ilk(o, ["hafta", "week", "weeks"])).replace(",", "."));
    return `<li class="${P}-adim" data-hafta-i="${i}"${h > 0 && h < 260 ? ` data-hafta="${h}"` : ""} style="--k: ${i}"><div class="${P}-aust"><span class="${P}-renk" aria-hidden="true"></span>${eH(k)}</div>${bH(k)}${mH(k)}${sH(k)}<p class="${P}-bitis" data-hafta-tarih hidden><span class="material-symbols-outlined" aria-hidden="true">event_available</span><span data-hafta-yaz></span></p></li>`;
  };
const sar = (ic, A) => {
    const ham = kaynak.filter((x) => metinAl(x, ["baslik", "title", "name", "ad"]));
    const hf = A.map((k, i) => { const v = Number(String(ilk(ham[i] || {}, ["hafta", "week", "weeks"])).replace(",", ".")); return v > 0 && v < 260 ? v : 0; });
    const tam = hf.every((v) => v > 0);
    const top = tam ? hf.reduce((a, b) => a + b, 0) : 0;
    const kalip = metinAl(des, ["haftaKalip"]);
    const hY = (n) => { const x = sayiBicim(n, n % 1 ? 1 : 0); return kalip ? kalip.split("{n}").join(x) : x; };
    const toplamE = metinAl(des, ["toplamEtiket"]);
    const tarihE = metinAl(des, ["tarihEtiket"]);
    const teslimE = metinAl(des, ["teslimEtiket"]);
    const toplam = tam && toplamE ? `<p class="${P}-toplam"><span class="${P}-tetiket">${esc(toplamE)}</span><strong class="${P}-tdeger">${esc(hY(top))}</strong></p>` : "";
    const tahmin = tam && tarihE ? `<div class="${P}-tahmin"><div class="${P}-talan"><label class="${P}-tetk" for="${P}-{{id}}-tarih">${esc(tarihE)}</label><input class="${P}-tgir" type="date" id="${P}-{{id}}-tarih" data-hafta-gir /></div>${teslimE ? `<p class="${P}-teslim"><span class="${P}-tsetk">${esc(teslimE)}</span><strong data-hafta-son></strong></p>` : ""}</div>` : "";
    const bant = `<ol class="${P}-bant" aria-hidden="true">${A.map((k, i) => `<li class="${P}-dilim" data-hafta-i="${i}" style="--k: ${i}; --h: ${tam ? hf[i] : 1}"><span class="${P}-dno">${esc(k.sira)}</span><span class="${P}-dad">${esc(k.baslik)}</span>${tam ? `<span class="${P}-dhf">${esc(hY(hf[i]))}</span>` : ""}</li>`).join("")}</ol>`;
    const cetvel = tam && top <= 40 && top === Math.round(top) ? `<div class="${P}-cetvel" aria-hidden="true">${Array.from({ length: top }, (x, j) => `<span>${sayiBicim(j + 1, 0)}</span>`).join("")}</div>` : "";
    return `<div class="${P}-plan">${toplam || tahmin ? `<div class="${P}-panel">${toplam}${tahmin}</div>` : ""}${bant}${cetvel}<ol class="${P}-adimlar">${ic}</ol></div>`;
  };
const B = { ust: metinAl(des, ["ust","eyebrow","badge","kicker"]), baslik: metinAl(des, ["baslik","title"]), metin: metinAl(des, ["metin","description","aciklama"]) };
/* veri yoksa gövde hiç kurulmaz (sarmalayıcı boş listeye dokunmaz) */
const BOS = !kayitlar.length;
const govde = BOS ? "" : sar(kayitlar.map((k, i) => kart(k, i, kayitlar.length, kayitlar)).join(""), kayitlar, B);
const bas = basHtml(B, "");
const sinif = (bas || B.ust || B.baslik || B.metin ? "" : ` ${P}--bassiz`);
html = html
  .replaceAll("{{fbsinif}}", () => sinif)
  .replaceAll("{{fbetiket}}", () => (B.baslik ? `aria-labelledby="${P}-{{id}}-b"` : ""))
  .replaceAll("{{fbbas}}", () => bas)
  .replaceAll("{{fbgovde}}", () => govde);
if (BOS) html = "";
