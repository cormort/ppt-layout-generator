/* 夜空羽化版型：截圖牆張數、羽化遮罩、主圖與倒影、共用圖片、沒有照片也不爆。
   這支是為了「羽化遮罩接錯 id（畫面看起來沒壞，但邊緣根本沒淡出）」這類靜默失敗而寫的。 */
import { test, ok, eq, deepEq } from './lib/check.mjs';

const RESET = `(()=>{S.ratio='16:9';S.fs=100;S.footer=false;S.logo='';S.single=false;
  S.title='DISNEY';S.subtitle='三十部動畫';S.body='這裡是成年人的世界里\\n唯一被允許徹底做回小孩的地方';
  S.tpl='nightWall';S.color='#1f3a5f';S.accent='#e8c27a';return 1})()`;

const MK = n => `(()=>[...Array(${n})].map((_,i)=>{
  const cv=document.createElement('canvas');cv.width=480;cv.height=320;
  const x=cv.getContext('2d');x.fillStyle='hsl('+(i*41)+',55%,58%)';x.fillRect(0,0,480,320);
  return {src:cv.toDataURL(),w:480,h:320};
}))()`;

test('夜空羽化：畫得出來、文字都在、網格 28 格', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    const svg=renderSVG(TPLBY.nightWall,${MK(8)},'nw_');
    return {nan:/NaN|Infinity/.test(svg),clips:(svg.match(/<clipPath/g)||[]).length,
      hasTitle:svg.includes('DISNEY'),hasSub:svg.includes('三十部動畫'),
      hasBody:svg.includes('唯一被允許'),note:overflowNote(svg)};
  })()`);
  eq(got.nan, false, '出現 NaN');
  ok(got.hasTitle && got.hasSub && got.hasBody, '文字沒畫出來');
  ok(got.clips >= 28, '格子太少：' + got.clips);
  eq(got.note, '', '誤報放不下：' + got.note);
});

/* 關鍵：羽化遮罩要真的接上（遮罩 id 與 mask="url(#…)" 必須對得上） */
test('夜空羽化：羽化遮罩與漸層真的接上', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    const svg=renderSVG(TPLBY.nightWall,${MK(8)},'m_');
    const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
    const ids=new Set([...doc.querySelectorAll('*')].map(e=>e.id).filter(Boolean));
    const refs=[...new Set([...svg.matchAll(/(?:mask|filter|clip-path)="url\(#([^)]+)\)"/g)].map(m=>m[1]))];
    return {masks:doc.querySelectorAll('mask').length,radial:doc.querySelectorAll('radialGradient').length,
      missing:refs.filter(r=>!ids.has(r))};
  })()`);
  ok(got.masks >= 2, '遮罩太少：' + got.masks);
  ok(got.radial >= 2, '徑向漸層太少：' + got.radial);
  deepEq(got.missing, [], '有 url(#…) 指到不存在的 id：' + got.missing.join(', '));
});

/* 照片共用：主圖 1 份 + 牆上每張 1 份；超過 12 張只取前 12 張 */
test('夜空羽化：照片只內嵌一次，超過 12 張會截掉', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    const cnt=s=>(s.match(/<image /g)||[]).length;
    return {
      one:cnt(renderSVG(TPLBY.nightWall,${MK(1)},'a_')),
      eight:cnt(renderSVG(TPLBY.nightWall,${MK(8)},'b_')),
      twenty:cnt(renderSVG(TPLBY.nightWall,${MK(20)},'c_')),
    };
  })()`);
  eq(got.one, 1, '一張照片＝主圖 1：' + got.one);
  eq(got.eight, 8, '八張照片＝主圖 1＋牆上 7：' + got.eight);
  eq(got.twenty, 13, '二十張＝主圖 1＋牆上 12：' + got.twenty);
});

/* 只有 16:9；沒有照片也不能爆 */
test('夜空羽化：只有 16:9，沒有照片也畫得出來', async ({ page }) => {
  const got = await page.run(`(()=>{
    S.ratio='16:9';S.title='沒有照片';S.subtitle='';S.body='';S.tpl='nightWall';
    const svg=renderSVG(TPLBY.nightWall,[],'e_');
    const t=TPLBY.nightWall,out={nan:/NaN|Infinity/.test(svg),has:svg.includes('沒有照片'),
      all:(t.ratios||['16:9']).includes('1:1')};
    S.ratio='3:4';out.swapped=tplFor('nightWall');S.ratio='16:9';out.kept=tplFor('nightWall');
    return out;
  })()`);
  eq(got.nan, false, '沒有照片時出現 NaN');
  eq(got.has, true, '標題不見了');
  eq(got.all, false, '不該支援 1:1');
  ok(got.swapped !== 'nightWall', '切到 3:4 應該換版型，實際：' + got.swapped);
  eq(got.kept, 'nightWall', '16:9 應該保留');
});
