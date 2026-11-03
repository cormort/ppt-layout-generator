/* 斜切時間軸版型：節點數跟著項目走、由左到右且往上、膠囊標籤不可以被裁掉。
   這支是為了「英文標籤比膠囊寬被切掉」這種靜默失敗而寫的（量測字寬沒算字距就踩過一次）。 */
import { test, ok, eq, deepEq } from './lib/check.mjs';

const RESET = `(()=>{S.ratio='16:9';S.fs=100;S.footer=false;S.logo='';S.single=false;
  S.title='發展歷程';S.subtitle='2010–2026';S.body='每一步都寫在同一條航線上。';
  S.items='2010-2014|啟航與奠基|以 3 艘散雜貨船起家。\\n2015-2018|船隊擴張|船隊突破 20 艘。\\n2019-2021|數位轉型|導入船舶智慧排程。\\n2022-2024|綠色航運|訂造甲醇雙燃料船。\\n2025-2026|全球網絡|覆蓋 100 國以上。';
  S.tpl='diagTime';return 1})()`;

const IMGS = `(()=>['#e6194b','#3cb44b','#4363d8','#f58231','#911eb4'].map(c=>{
  const cv=document.createElement('canvas');cv.width=400;cv.height=300;
  const x=cv.getContext('2d');x.fillStyle=c;x.fillRect(0,0,400,300);
  return {src:cv.toDataURL(),w:400,h:300};
}))()`;

/* 節點＝圓點；由左到右、由下往上（時間順序） */
test('斜切時間軸：節點數跟著項目走，由左到右往上排', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    const run=rows=>{
      S.items=rows.map(r=>r.join('|')).join('\\n');
      const svg=renderSVG(TPLBY.diagTime,${IMGS},'d_');
      return {nan:/NaN|Infinity/.test(svg),
        dots:[...svg.matchAll(/<circle cx="([-\\d.]+)" cy="([-\\d.]+)" r="9"/g)].map(m=>[+m[1],+m[2]])};
    };
    const five=run([['2010','甲','說明'],['2012','乙','說明'],['2014','丙','說明'],['2016','丁','說明'],['2018','戊','說明']]);
    const three=run([['2010','甲','說明'],['2015','乙','說明'],['2020','丙','說明']]);
    const eight=run([...Array(8)].map((_,i)=>[String(2000+i*2),'第'+i,'說明']));
    const one=run([['2026','上線','說明']]);
    return {five,three,eight:eight.dots.length,one:one.dots.length};
  })()`);
  eq(got.five.dots.length, 5, '五個項目＝五個節點');
  eq(got.three.dots.length, 3, '三個項目＝三個節點');
  eq(got.eight, 5, '八個項目只畫前五個');
  eq(got.one, 1, '一個項目＝一個節點');
  eq(got.five.nan || got.three.nan, false, '出現 NaN');
  const xs = got.five.dots.map(d => d[0]), ys = got.five.dots.map(d => d[1]);
  ok(xs.every((x, i) => i === 0 || x > xs[i - 1]), '節點要由左到右：' + xs.join(','));
  ok(ys.every((y, i) => i === 0 || y < ys[i - 1]), '節點要由下往上：' + ys.join(','));
});

/* 膠囊裡的標籤一定放得進膠囊（含英文長標籤），文字不能超出畫布 */
test('斜切時間軸：膠囊標籤不會被裁掉', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    S.items=[
      '2010-2014|Setting Sail & Foundation|Founded with 3 bulk carriers.',
      '2015-2018|Fleet Expansion|Fleet surpassed 20 vessels.',
      '2019-2021|Digital Transformation|Implemented smart vessel scheduling.',
      '2022-2024|Green Shipping|Ordered methanol dual-fuel ships.',
      '2025-2026|Global Network|Covered 100+ countries.'
    ].join('\\n');
    const svg=renderSVG(TPLBY.diagTime,${IMGS},'p_');
    const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
    const font=FONTS[S.bf][1],bad=[],boxes=[];
    for(const r of doc.querySelectorAll('rect')){
      const h=+r.getAttribute('height'),rx=+r.getAttribute('rx');
      if(h<24||Math.abs(rx*2-h)>.6)continue;
      const t=r.nextElementSibling;
      if(!t||t.tagName.toLowerCase()!=='text')continue;
      const s=[...t.querySelectorAll('tspan')].map(x=>x.textContent).join('');
      const w=tw(s,+t.getAttribute('font-size'),font,700);
      const pw=+r.getAttribute('width');
      boxes.push({s,pw:Math.round(pw)});
      if(w>pw-2)bad.push(s+'：字 '+Math.round(w)+' > 膠囊 '+Math.round(pw));
    }
    return {pills:boxes.length,bad,overflow:overflowNote(svg)};
  })()`);
  eq(got.pills, 5, '五個膠囊');
  deepEq(got.bad, [], '有標籤被裁掉：\n      ' + got.bad.join('\n      '));
  eq(got.overflow, '', '誤報放不下：' + got.overflow);
});

/* 文字全部畫得出來、不出畫布 */
test('斜切時間軸：文字都畫得出來且不出畫布', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    const svg=renderSVG(TPLBY.diagTime,${IMGS},'t_');
    const need=[S.title,S.subtitle,S.body,'2010-2014','全球網絡','覆蓋 100 國以上'];
    const miss=need.filter(t=>!svg.includes(t));
    const pts=[...svg.matchAll(/<text x="([-\\d.]+)"[^>]*y="([-\\d.]+)"/g)].map(m=>[+m[1],+m[2]]);
    const off=pts.filter(([x,y])=>x<-2||x>${'1920'}+2||y<0||y>${'1080'}+2);
    return {miss,off:off.length,total:pts.length,note:overflowNote(svg)};
  })()`);
  deepEq(got.miss, [], '少了文字：' + got.miss.join('、'));
  eq(got.off, 0, '有文字在畫布外');
  ok(got.total >= 16, '文字太少：' + got.total);
  eq(got.note, '', '誤報放不下：' + got.note);
});

/* 只有 16:9；換成圖卡尺寸時會換成相近的版型 */
test('斜切時間軸：只有 16:9，換尺寸時會換掉', async ({ page }) => {
  const got = await page.run(`(()=>{
    const t=TPLBY.diagTime,out={};
    out.supportsALL=(t.ratios||['16:9']).includes('1:1');
    S.ratio='3:4';out.swapped=tplFor('diagTime');
    S.ratio='16:9';out.kept=tplFor('diagTime');
    return out;
  })()`);
  eq(got.supportsALL, false, '不該支援 1:1');
  ok(got.swapped !== 'diagTime', '切到 3:4 應該換成別的版型，實際：' + got.swapped);
  eq(got.kept, 'diagTime', '16:9 應該保留');
});
