/* 曲面拼貼版型：透視網格、倒影、共用圖片、沒有照片也不爆。
   這支是為了「每格都內嵌一次照片 → SVG 變成十幾 MB」與「網格方向算錯」而寫的。 */
import { test, ok, eq, deepEq } from './lib/check.mjs';

const RESET = `(()=>{S.ratio='16:9';S.fs=100;S.footer=false;S.logo='';S.single=false;
  S.title='THE GRAND BUDAPEST HOTEL';S.subtitle='A WES ANDERSON FILM';
  S.body='1932 年，布達佩斯郊外的粉色飯店；一名門房、一張畫、一場跨越三十年的追逐。';
  S.tpl='posterWall';S.color='#b06a7f';S.accent='#e8c27a';return 1})()`;

const MK = n => `(()=>[...Array(${n})].map((_,i)=>{
  const cv=document.createElement('canvas');cv.width=640;cv.height=480;
  const x=cv.getContext('2d');x.fillStyle='hsl('+(i*37)+',60%,55%)';x.fillRect(0,0,640,480);
  x.fillStyle='#fff';x.fillRect(0,0,120,80);
  return {src:cv.toDataURL(),w:640,h:480};
}))()`;

test('曲面拼貼：畫得出來、文字都在、沒有 NaN', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    const svg=renderSVG(TPLBY.posterWall,${MK(6)},'po_');
    return {nan:/NaN|Infinity/.test(svg),bytes:svg.length,
      cells:(svg.match(/<clipPath/g)||[]).length,
      hasTitle:svg.includes('GRAND')&&svg.includes('BUDAPEST'),hasSub:svg.includes('A WES ANDERSON FILM'),
      hasBody:svg.includes('1932'),note:overflowNote(svg)};
  })()`);
  eq(got.nan, false, '出現 NaN');
  ok(got.hasTitle && got.hasSub && got.hasBody, '文字沒畫出來');
  ok(got.cells >= 35, '格子太少：' + got.cells);
  eq(got.note, '', '誤報放不下：' + got.note);
});

/* 關鍵：35 格共用 <use>，照片只內嵌一次；超過 12 張只取前 12 張 */
test('曲面拼貼：35 格共用同一份圖片，不重複內嵌', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    const one=renderSVG(TPLBY.posterWall,${MK(1)},'c1_');
    const six=renderSVG(TPLBY.posterWall,${MK(6)},'c6_');
    const many=renderSVG(TPLBY.posterWall,${MK(24)},'c24_');
    const cnt=s=>({imgs:(s.match(/<image /g)||[]).length,uses:(s.match(/<use /g)||[]).length,cells:(s.match(/<clipPath/g)||[]).length});
    return {one:cnt(one),six:cnt(six),many:cnt(many)};
  })()`);
  /* 主圖 1 張 + 網格每張照片 1 份（共用 <use>），不是 35 份 */
  eq(got.one.imgs, 2, '一張照片＝主圖 1＋網格 1：' + JSON.stringify(got.one));
  eq(got.six.imgs, 7, '六張照片＝主圖 1＋網格 6：' + JSON.stringify(got.six));
  eq(got.many.imgs, 13, '最多 12 張＋主圖：' + JSON.stringify(got.many));
  /* 網格 35 格 ×（主網格＋倒影）都要用 use，不能各自內嵌 */
  ok(got.six.uses >= 70, 'use 太少：' + got.six.uses);
  ok(got.six.cells >= 35, 'clipPath 太少：' + got.six.cells);
});

/* 網格真的往左收束：最左邊的格子比最右邊小（透視，不是拉歪） */
test('曲面拼貼：網格往左收束（近大遠小）', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    const svg=renderSVG(TPLBY.posterWall,${MK(4)},'g_');
    /* 用 DOMParser 讀 clipPath 的四個角：算每格的左緣 x 與高度 */
    const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
    const cells=[...doc.querySelectorAll('clipPath > path')].map(el=>{
      const n=(el.getAttribute('d').match(/-?[0-9]+(\\.[0-9]+)?/g)||[]).map(Number);
      if(n.length!==8)return null;                    /* 面板的圓弧不是格子 */
      const xs=[n[0],n[2],n[4],n[6]],ys=[n[1],n[3],n[5],n[7]];
      const w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);
      if(w>W*.14)return null;                         /* 整個牆面的外框也不算 */
      return {x0:Math.min(...xs),h};
    }).filter(Boolean);
    const sorted=cells.slice().sort((a,b)=>a.x0-b.x0);
    const left=sorted.slice(0,7),right=sorted.slice(-7);
    const avg=a=>a.reduce((s,c)=>s+c.h,0)/a.length;
    return {n:cells.length,left:Math.round(avg(left)),right:Math.round(avg(right))};
  })()`);
  ok(got.n >= 35, '格子數：' + got.n);
  ok(got.left < got.right * .8, `左邊的格子要明顯比右邊矮（近大遠小）：左 ${got.left} vs 右 ${got.right}`);
});

/* 只有 16:9；沒照片也不能爆（面板還是畫得出來） */
test('曲面拼貼：只有 16:9，沒有照片也畫得出來', async ({ page }) => {
  const got = await page.run(`(()=>{
    S.ratio='16:9';S.title='沒有照片';S.subtitle='';S.body='';S.tpl='posterWall';
    const svg=renderSVG(TPLBY.posterWall,[],'e_');
    const t=TPLBY.posterWall;
    const out={nan:/NaN|Infinity/.test(svg),hasTitle:svg.includes('沒有照片'),
      all:(t.ratios||['16:9']).includes('1:1')};
    S.ratio='3:4';out.swapped=tplFor('posterWall');S.ratio='16:9';out.kept=tplFor('posterWall');
    return out;
  })()`);
  eq(got.nan, false, '沒有照片時出現 NaN');
  eq(got.hasTitle, true, '標題不見了');
  eq(got.all, false, '不該支援 1:1');
  ok(got.swapped !== 'posterWall', '切到 3:4 應該換版型，實際：' + got.swapped);
  eq(got.kept, 'posterWall', '16:9 應該保留');
});
