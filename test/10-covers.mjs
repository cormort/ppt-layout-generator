/* 封面類新增的兩個版型：下緣色帶、中央字標。
   這支抓的是「色帶裡的標題跑出色帶」與「置中字標其實沒置中」這種看著像、其實錯的問題。 */
import { test, ok, eq, deepEq } from './lib/check.mjs';

const IMGS = `(()=>[...Array(4)].map((_,i)=>{
  const cv=document.createElement('canvas');cv.width=480;cv.height=320;
  cv.getContext('2d').fillStyle='hsl('+(i*70)+',50%,55%)';cv.getContext('2d').fillRect(0,0,480,320);
  return {src:cv.toDataURL(),w:480,h:320};
}))()`;

const SET = `(()=>{S.fs=100;S.footer=false;S.logo='';S.single=false;S.color='#1f3a5f';S.accent='#c9a24a';
  S.title='2026 年度成果發表會';S.subtitle='主計總處 · 中部辦公室';S.body='年度預算執行成果與明年展望，歡迎各機關派員參加。';
  return 1})()`;

test('中央字標：每個尺寸都置中、文字不出畫布', async ({ page }) => {
  await page.run(SET);
  const got = await page.run(`(()=>{
    const out=[];
    for(const ratio of Object.keys(RATIOS)){
      S.ratio=ratio;const [rw,rh]=RATIOS[ratio];
      const svg=renderSVG(TPLBY.cLockup,${IMGS},'lk'+ratio.replace(':','')+'_');
      const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
      const texts=[...doc.querySelectorAll('text')];
      const notMid=texts.filter(t=>t.getAttribute('text-anchor')!=='middle'||Math.abs(+t.getAttribute('x')-rw/2)>1).length;
      out.push({ratio,nan:/NaN|Infinity/.test(svg),texts:texts.length,notMid,has:svg.includes('2026')});
    }
    S.ratio='16:9';return out;
  })()`);
  for (const r of got) {
    eq(r.nan, false, r.ratio + ' 出現 NaN');
    ok(r.has, r.ratio + ' 標題沒畫出來');
    ok(r.texts >= 3, r.ratio + ' 文字太少：' + r.texts);
    eq(r.notMid, 0, r.ratio + ' 有文字沒有置中（应全部 x=W/2、anchor=middle）：' + r.notMid);
  }
});

test('下緣色帶：標題真的落在色帶裡（不是浮在照片上）', async ({ page }) => {
  await page.run(SET);
  const got = await page.run(`(()=>{
    const out=[];
    for(const ratio of ['16:9','1:1','4:5','3:4','9:16']){
      S.ratio=ratio;const [rw,rh]=RATIOS[ratio];
      const svg=renderSVG(TPLBY.cBand,${IMGS},'bd'+ratio.replace(':','')+'_');
      const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
      /* 色帶＝寬度滿版的大矩形 */
      const band=[...doc.querySelectorAll('rect')].find(r=>Math.abs(+r.getAttribute('width')-rw)<2&&+r.getAttribute('height')>rh*.2);
      const bandTop=band?+band.getAttribute('y'):null;
      const texts=[...doc.querySelectorAll('text')];
      const big=texts.reduce((a,b)=>+b.getAttribute('font-size')>+(a?.getAttribute('font-size')||0)?b:a,null);
      const ty=big?+big.getAttribute('y'):null;
      out.push({ratio,nan:/NaN|Infinity/.test(svg),bandTop,ty,title:big?big.textContent:''});
    }
    S.ratio='16:9';return out;
  })()`);
  for (const r of got) {
    eq(r.nan, false, r.ratio + ' 出現 NaN');
    ok(r.bandTop !== null, r.ratio + ' 找不到色帶');
    ok(r.ty !== null && r.ty > r.bandTop, `${r.ratio} 標題（y=${r.ty}）沒有落在色帶裡（色帶從 ${r.bandTop} 起）`);
    ok(String(r.title).includes('2026'), r.ratio + ' 最大字級的不是標題：' + r.title);
  }
});

/* 兩個新版型的「不該有的行為」：鏤空字與色帶都只能 16:9 以外，這兩個相反 —— 任何尺寸都能用 */
test('兩個新封面都支援任何尺寸（ALLR），換尺寸不會被踢掉', async ({ page }) => {
  const got = await page.run(`(()=>{
    const out={};
    for(const id of ['cBand','cLockup']){
      S.ratio='9:16';out[id+'_tall']=tplFor(id);
      S.ratio='16:9';out[id+'_wide']=tplFor(id);
    }
    return out;
  })()`);
  deepEq(got, { cBand_tall: 'cBand', cBand_wide: 'cBand', cLockup_tall: 'cLockup', cLockup_wide: 'cLockup' }, '換尺寸後應保留原版型');
});
