/* 地圖版型：縣市名比對（臺／台、市縣後綴、俗稱）與標註框數量。
   這支是為了「打了縣市名卻沒標在地圖上」這種靜默失敗而寫的。 */
import { test, ok, eq, deepEq } from './lib/check.mjs';

const RESET = `(()=>{S.ratio='16:9';S.fs=100;S.footer=false;S.logo='';
  S.title='縣市統計';S.subtitle='';S.body='';S.items='';S.tpl='twMap';
  return 1})()`;

test('縣市名比對：臺／台互通、可省略市縣、俗稱與改制前的名字', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    const one=s=>{const e=twFind(s);return e?e.n:null};
    return {
      taipei: [one('臺北市'), one('台北市'), one('台北')],
      taoyuan: [one('桃園市'), one('桃園'), one('桃園縣')],
      hsinchu: [one('新竹市'), one('新竹縣'), one('新竹')],
      matsu: [one('連江縣'), one('馬祖')],
      isles: [one('澎湖縣'), one('金門縣'), one('澎湖')],
      junk: [one('高雄區'), one(''), one('第一季')],
    };
  })()`);
  deepEq(got.taipei, ['臺北市', '臺北市', '臺北市'], '臺北市的三種寫法');
  deepEq(got.taoyuan, ['桃園市', '桃園市', '桃園市'], '桃園（改制前的桃園縣）');
  deepEq(got.hsinchu, ['新竹市', '新竹縣', null], '新竹同時有市與縣時不猜');
  deepEq(got.matsu, ['連江縣', '連江縣'], '馬祖＝連江縣');
  deepEq(got.isles, ['澎湖縣', '金門縣', '澎湖縣'], '離島');
  deepEq(got.junk, [null, null, null], '認不得的名字要回 null，不能亂配');
});

test('22 個縣市都認得；超過 12 列只標前 12 個', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    const all=TW_MAP.counties.concat(TW_MAP.islands).map(e=>e.n);
    S.items=all.map(n=>n+'|說明一|說明二').join('\\n');
    const rows=twRows({t:{items:S.items}}).slice(0,12);
    const shown=rows.map(r=>r.e.n);
    const svg=renderSVG(TPLBY.twMap,chosen('full'),'t_');
    const inSvg=n=>svg.includes('>'+n+'<');
    return {rows:twRows({t:{items:S.items}}).length,shownOk:shown.every(inSvg),
      hidden:all.filter(n=>!shown.includes(n)).filter(inSvg),nan:/NaN|Infinity/.test(svg),note:overflowNote(svg)};
  })()`);
  deepEq(got.rows, 22, '22 個縣市都認得');
  eq(got.shownOk, true, '前 12 個縣市名都要出現在圖上');
  deepEq(got.hidden, [], '第 13 個以後的縣市不該出現在圖上');
  eq(got.nan, false, 'SVG 出現 NaN');
  ok(got.note === '', '不該有放不下的提醒：' + got.note);
});

test('沒有縣市名時用示意資料，縮圖不會是空白地圖', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    S.items='工作概述|Job Overview';
    const svg=renderSVG(TPLBY.twMap,chosen('thumb'),'t2_');
    /* 標註框＝標題條＋白底說明各一個 rect，寬度等於框寬 */
    const box=svg.split('width="'+Math.round(1920*0.26)+'"').length-1;
    return {sample:TW_SAMPLE.filter(([n])=>svg.includes('>'+n+'<')).length,box,
      nan:/NaN|Infinity/.test(svg),note:overflowNote(svg)};
  })()`);
  ok(got.sample >= 4, '示意資料也該標出縣市，實際 ' + got.sample);
  ok(got.box > 0, '示意資料也要畫出標註框');
  eq(got.nan, false, 'SVG 出現 NaN');
  eq(got.note, '', '示意資料不該觸發放不下提醒：' + got.note);
});

test('只有 16:9 可用，換尺寸時會換成條列頁', async ({ page }) => {
  const got = await page.run(`(()=>{
    const out={};
    for(const r of Object.keys(RATIOS)){S.ratio=r;out[r]=tplFor('twMap')}
    S.ratio='16:9';
    return out;
  })()`);
  eq(got['16:9'], 'twMap', '16:9 要保留地圖版型');
  for (const r of ['1:1', '4:5', '3:4', '9:16']) eq(got[r], 'tList', `${r} 應該換成條列頁`);
});

test('貼上 Excel 的 Tab 表格也能變成標註框', async ({ page }) => {
  const got = await page.run(`(()=>{
    const t=tableFromClip('新北市\\t農糧：茶\\t畜牧：豬\\n屏東縣\\t漁業：漁船、定置網');
    return {t,rows:twRows({t:{items:t}}).map(r=>[r.e.n,r.lines])};
  })()`);
  eq(got.t, '新北市|農糧：茶|畜牧：豬\n屏東縣|漁業：漁船、定置網', 'Tab 轉成「|」');
  deepEq(got.rows, [['新北市', ['農糧：茶', '畜牧：豬']], ['屏東縣', ['漁業：漁船、定置網']]], '欄位變成各一行說明');
});
