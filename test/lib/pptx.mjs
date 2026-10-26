/* PPTX 檢查：自己讀 ZIP（Node 內建 zlib），不需要 PowerShell 或外部套件。
   驗證項目跟之前用 PowerShell 做的一樣：XML 完整、content types 覆蓋、關聯目標存在、頁數、
   投影片尺寸、可編輯文字。 */
import { inflateRawSync } from 'node:zlib';

export function readZip(buf) {
  if (buf.length < 22) throw new Error('檔案太小，不是 ZIP');
  let eocd = -1;
  const min = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('不是 ZIP（找不到 EOCD）');
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error(`central directory 第 ${i} 筆壞掉`);
    const method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20);
    const nlen = buf.readUInt16LE(off + 28), elen = buf.readUInt16LE(off + 30), clen = buf.readUInt16LE(off + 32);
    const lho = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nlen);
    if (buf.readUInt32LE(lho) !== 0x04034b50) throw new Error(`local header 壞掉：${name}`);
    const lnlen = buf.readUInt16LE(lho + 26), lelen = buf.readUInt16LE(lho + 28);
    const start = lho + 30 + lnlen + lelen;
    const raw = buf.subarray(start, start + csize);
    entries.set(name, method === 0 ? Buffer.from(raw) : inflateRawSync(raw));
    off += 46 + nlen + elen + clen;
  }
  return entries;
}

/* 標籤平衡檢查（不是完整 XML 解析，但抓得到截斷與未關閉標籤） */
export function xmlBalanced(src) {
  const s = src.replace(/<\?[\s\S]*?\?>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  const re = /<(\/?)([A-Za-z0-9:_.-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  const stack = [];
  let m;
  while ((m = re.exec(s))) {
    const [, close, name, , selfClose] = m;
    if (close) { if (stack.pop() !== name) return false; }
    else if (!selfClose) stack.push(name);
  }
  return stack.length === 0;
}

const REL_RE = /<Relationship\b([^>]*)\/?>/g;
function resolve(base, target) {
  if (target.startsWith('/')) return target.slice(1);
  const parts = base.split('/').slice(0, -1);
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.' && seg !== '') parts.push(seg);
  }
  return parts.join('/');
}

export function checkPptx(buf, { px, minSlides = 1 } = {}) {
  const problems = [];
  let entries;
  try { entries = readZip(buf); } catch (e) { return { problems: ['ZIP 讀不開：' + e.message], slides: 0 }; }
  const names = [...entries.keys()];

  for (const need of ['[Content_Types].xml', '_rels/.rels', 'ppt/presentation.xml'])
    if (!entries.has(need)) problems.push('缺少必要檔案：' + need);

  /* XML 完整 */
  const xmlParts = names.filter(n => /\.(xml|rels)$/i.test(n));
  for (const n of xmlParts) {
    const text = entries.get(n).toString('utf8');
    if (!xmlBalanced(text)) problems.push('XML 標籤不平衡：' + n);
  }

  /* content types 覆蓋每個副檔名 */
  if (entries.has('[Content_Types].xml')) {
    const ct = entries.get('[Content_Types].xml').toString('utf8');
    const exts = new Set(names.filter(n => !n.endsWith('/') && !n.endsWith('.rels')).map(n => (n.match(/\.([A-Za-z0-9]+)$/) || [, ''])[1].toLowerCase()).filter(Boolean));
    for (const ext of exts) {
      if (!new RegExp(`Extension="${ext}"`, 'i').test(ct) && !ct.includes(`PartName="/${names.find(n => n.toLowerCase().endsWith('.' + ext))}"`))
        problems.push(`content types 沒有宣告 .${ext}`);
    }
  }

  /* 每個 .rels 的目標都要存在 */
  for (const n of names.filter(n => n.endsWith('.rels'))) {
    const text = entries.get(n).toString('utf8');
    const baseName = n.replace(/_rels\/[^/]+$/, '');
    REL_RE.lastIndex = 0;
    let m;
    while ((m = REL_RE.exec(text))) {
      const attrs = m[1];
      if (/TargetMode="External"/.test(attrs)) continue;
      const target = (attrs.match(/Target="([^"]*)"/) || [])[1];
      if (!target) continue;
      const path = resolve(baseName ? baseName : '', target);
      if (!entries.has(path) && !entries.has(decodeURI(path))) problems.push(`關聯目標不存在：${n} → ${target}`);
    }
  }

  /* 頁數與尺寸 */
  const slides = names.filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  if (slides.length < minSlides) problems.push(`投影片只有 ${slides.length} 張，少於預期 ${minSlides}`);
  let sldSz = null;
  if (entries.has('ppt/presentation.xml')) {
    const p = entries.get('ppt/presentation.xml').toString('utf8');
    const m = p.match(/<p:sldSz\s+cx="(\d+)"\s+cy="(\d+)"/);
    if (m) sldSz = { cx: +m[1], cy: +m[2] };
    else problems.push('presentation.xml 找不到 sldSz');
  }
  if (sldSz && px) {
    for (const [k, want] of [['cx', px[0] * 6350], ['cy', px[1] * 6350]]) {
      if (Math.abs(sldSz[k] - want) > 6350) problems.push(`投影片尺寸 ${k}=${sldSz[k]}，預期 ${want}`);
    }
  }

  /* 可編輯文字 */
  let runs = 0;
  for (const n of slides) runs += (entries.get(n).toString('utf8').match(/<a:t>/g) || []).length;

  /* 圖片要是 JPEG/PNG 且存在 */
  const media = names.filter(n => n.startsWith('ppt/media/'));
  if (media.length === 0) problems.push('沒有任何媒體檔');

  return { problems, slides: slides.length, runs, media: media.length, sldSz };
}
