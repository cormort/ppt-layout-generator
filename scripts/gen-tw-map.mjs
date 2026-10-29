#!/usr/bin/env node
/* 產生 src/js/05-tw-map-data.js：台灣 22 縣市輪廓（簡化後的 SVG path），給「地圖・縣市統計標註」版型用。

   來源：內政部縣市界線（`twCounty2010.geo.json`，也就是「臺灣統計地圖產生器」HF Space 用的同一份，
   2010 年鄉鎮市區改制後的 22 縣市；桃園當時還是縣，名稱在腳本裡改成現在的桃園市）。

   用法：
     node scripts/gen-tw-map.mjs                      # 直接抓上面的來源
     node scripts/gen-tw-map.mjs 本地檔.geo.json        # 也可以先下載好再跑
     node scripts/gen-tw-map.mjs --tol 1.5            # 調整簡化程度（數字越大、點越少）

   作法：等距圓柱投影（以 23.7°N 為基準緯度，讓東西向不變形）→ 正規化到主圖寬 1000 →
   Douglas–Peucker 簡化 → 輸出成一支零依賴的 JS 檔（主檔只多 40 KB 左右，不帶 GeoJSON）。 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = 'https://huggingface.co/spaces/cormort/tw_statistic_map/resolve/main/twCounty2010.geo.json';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src/js/05-tw-map-data.js');

const args = process.argv.slice(2);
const tol = (() => { const i = args.indexOf('--tol'); return i >= 0 ? Number(args[i + 1]) : 1.4 })();
const input = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--tol')) || SRC;

/* 舊資料的名稱改成現在的名字；其餘只動「台」→「臺」 */
const RENAME = { '桃園縣': '桃園市' };
/* 離島另外畫成小圖：金門、連江離本島太遠；澎湖雖然不遠，但擺進主圖會把本島擠到一邊 */
const OFF_ISLANDS = new Set(['金門縣', '連江縣', '澎湖縣']);

const LAT0 = 23.7, KX = Math.cos(LAT0 * Math.PI / 180);

const raw = /^https?:/.test(input)
  ? await (await fetch(input)).json()
  : JSON.parse(readFileSync(input, 'utf8'));
if (!raw.features || raw.features.length < 20) throw new Error('這不是縣市界線的 GeoJSON：' + input);

const countyName = n => RENAME[n] || n.replace(/台/g, '臺');

/* 投影：x 往東、y 往南（GeoJSON 的 y 往上，所以取負） */
const project = ([lon, lat]) => [lon * KX, -lat];

/* Douglas–Peucker（陣列版的距離門檻，單位與座標相同） */
function dp(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i0, i1] = stack.pop();
    if (i1 - i0 < 2) continue;
    const [x0, y0] = pts[i0], [x1, y1] = pts[i1];
    const dx = x1 - x0, dy = y1 - y0, len2 = dx * dx + dy * dy || 1e-12;
    let best = -1, bi = -1;
    for (let i = i0 + 1; i < i1; i++) {
      const [x, y] = pts[i];
      const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / len2));
      const px = x0 + t * dx - x, py = y0 + t * dy - y;
      const d = px * px + py * py;
      if (d > best) { best = d; bi = i }
    }
    if (best > eps * eps) { keep[bi] = 1; stack.push([i0, bi], [bi, i1]) }
  }
  return pts.filter((_, i) => keep[i]);
}

/* 平面多邊形面積（有號）與質心 */
function ringInfo(pts) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [x0, y0] = pts[j], [x1, y1] = pts[i];
    const f = x0 * y1 - x1 * y0;
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  a /= 2;
  /* 質心公式 Cx = Σ(x_i+x_j)·cross / (6A)，A 是上面算出的有號面積 */
  const k = a * 6 || 1e-12;
  return { a: Math.abs(a), cx: cx / k, cy: cy / k };
}

/* 取出每個縣市的多邊形（只留比 eps 大的島；金門／連江等離島保留較多） */
const feats = raw.features.map(f => {
  const name = countyName(f.properties.COUNTYNAME || f.properties.name);
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const rings = polys.map(p => p[0].map(project)).filter(r => r.length >= 4);
  return { name, rings };
});

/* 主圖範圍：本島 19 縣市 */
const main = feats.filter(f => !OFF_ISLANDS.has(f.name));
/* 點數是數萬個，不能用 spread 丟進 Math.min（會爆堆疊） */
const bb = pts => pts.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])],
  [Infinity, Infinity, -Infinity, -Infinity]);
const [minX, minY, maxX, maxY] = bb(main.flatMap(f => f.rings.flat()));
const S = 1000 / (maxX - minX);
const W = 1000, H = Math.round((maxY - minY) * S * 10) / 10;
const norm = ([x, y]) => [(x - minX) * S, (y - minY) * S];

/* 主圖：太小的島（<8 平方單位，約等於畫面上不到 3px 的點）直接丟掉 */
const MIN_AREA = 8;
let pts0 = 0, pts1 = 0;
const counties = [];
for (const f of main) {
  const rings = f.rings.map(r => r.map(norm)).filter(r => ringInfo(r).a >= MIN_AREA);
  if (!rings.length) throw new Error('縣市沒有夠大的多邊形：' + f.name);
  /* 錨點（指標線要指到的位置）：最大那塊的質心 */
  const big = rings.reduce((a, b) => ringInfo(b).a > ringInfo(a).a ? b : a);
  const { cx, cy } = ringInfo(big);
  pts0 += rings.reduce((n, r) => n + r.length, 0);
  const simp = rings.map(r => dp(r, tol));
  pts1 += simp.reduce((n, r) => n + r.length, 0);
  counties.push({ n: f.name, a: [round1(cx), round1(cy)], d: simp.map(pathOf).join('') });
}
counties.sort((a, b) => a.n.localeCompare(b.n, 'zh-Hant'));

/* 離島（金門、連江）：各自用自己的範圍正規化到長邊 100，畫在左下角的小框裡 */
const islands = [];
for (const f of feats.filter(f => OFF_ISLANDS.has(f.name))) {
  const rings = f.rings.filter(r => ringInfo(r).a >= 0.0006);
  if (!rings.length) continue;
  const [x0, y0, x1, y1] = bb(rings.flat());
  const k = 100 / Math.max(x1 - x0, y1 - y0);
  const local = rings.map(r => r.map(([x, y]) => [(x - x0) * k, (y - y0) * k]));
  const big = local.reduce((a, b) => ringInfo(b).a > ringInfo(a).a ? b : a);
  const { cx, cy } = ringInfo(big);
  islands.push({
    n: f.name, w: round1((x1 - x0) * k), h: round1((y1 - y0) * k), a: [round1(cx), round1(cy)],
    d: local.map(r => dp(r, tol * k / S)).map(pathOf).join(''),
  });
}
islands.sort((a, b) => a.n.localeCompare(b.n, 'zh-Hant'));

function round1(v) { return Math.round(v * 10) / 10 }
/* 「M x y x2 y2 …」：moveto 之後的座標對是隱含的 lineto，比每點都寫 L 省約 1/8 的體積 */
function pathOf(pts) {
  const round = pts.map(([x, y]) => `${round1(x)} ${round1(y)}`);
  if (round[0] === round[round.length - 1]) round.pop();
  return 'M' + round.join(' ') + 'Z';
}

const q = s => JSON.stringify(s);
const js = `/* 台灣縣市輪廓：由 scripts/gen-tw-map.mjs 產生，不要手改。
   來源 ${SRC}
   投影：等距圓柱（基準緯度 ${LAT0}°N），正規化到主圖寬 ${W}；Douglas–Peucker 門檻 ${tol}。
   d＝SVG path（座標為「主圖單位」），a＝指標線要指的錨點，離島（islands）各自用自己的座標系（長邊 100）。 */
const TW_MAP={
  w:${W},h:${H},
  counties:[
${counties.map(c => `    {n:${q(c.n)},a:[${c.a}],d:${q(c.d)}}`).join(',\n')}
  ],
  islands:[
${islands.map(i => `    {n:${q(i.n)},w:${i.w},h:${i.h},a:[${i.a}],d:${q(i.d)}}`).join(',\n')}
  ]
};
`;
writeFileSync(out, js);
console.log(`已產生 ${out}`);
console.log(`  主圖 ${W}×${H}，${counties.length} 個縣市、離島 ${islands.length} 組`);
console.log(`  點數 ${pts0} → ${pts1}（簡化後保留 ${(pts1 / pts0 * 100).toFixed(1)}%），檔案 ${(js.length / 1024).toFixed(1)} KB`);
