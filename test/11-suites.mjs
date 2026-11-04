/* 套裝：一鍵把整份簡報換成同一套設計。
   這支抓的是「角色對錯版型」（例如結尾頁被換成封面）與「套用兩次改不動」這兩種問題。 */
import { test, ok, eq, deepEq } from './lib/check.mjs';

test('每個套裝的每個角色都指到存在、而且支援 16:9 的版型', async ({ page }) => {
  const got = await page.run(`(()=>{
    const bad=[];
    for(const su of SUITES){
      for(const [role,id] of Object.entries(su.roles)){
        const t=TPLBY[id];
        if(!t)bad.push(su.id+'/'+role+'→'+id+' 不存在');
        else if(!(t.ratios||['16:9']).includes('16:9'))bad.push(su.id+'/'+role+'→'+id+' 不支援 16:9');
      }
      if(typeof su.tf!=='number'||su.tf<0||su.tf>=FONTS.length)bad.push(su.id+' 標題字體索引不對');
      if(typeof su.bf!=='number'||su.bf<0||su.bf>=FONTS.length)bad.push(su.id+' 內文字體索引不對');
      if(!HEXRE.test(su.color)||!HEXRE.test(su.accent))bad.push(su.id+' 顏色格式不對');
    }
    return {bad,suites:SUITES.map(s=>s.id)};
  })()`);
  deepEq(got.bad, [], '套裝設定有問題：\n      ' + got.bad.join('\n      '));
  eq(got.suites.length >= 3, true, '套裝太少：' + got.suites.length);
});

test('角色判斷：感謝頁是結尾、封面分割是封面、照片牆是牆', async ({ page }) => {
  const got = await page.run(`(()=>({
    thanks:roleOf({tpl:'thanks'}),split:roleOf({tpl:'split'}),wall:roleOf({tpl:'wall'}),
    chart:roleOf({tpl:'cBar'}),card:roleOf({tpl:'kNumber'}),text:roleOf({tpl:'tList'}),
    empty:roleOf({tpl:'不存在'}),none:roleOf(null),quote:roleOf({tpl:'tQuote'}),table:roleOf({tpl:'tTable'})
  }))()`);
  deepEq(got, { thanks: 'closing', split: 'cover', wall: 'wall', chart: 'data', card: 'card', text: 'text', empty: 'text', none: 'text', quote: 'quote', table: 'table' }, '角色判斷');
});

test('套用套裝：版型照角色換、樣式跟著換、內容一個字都不動', async ({ page }) => {
  const got = await page.run(`(()=>{
    S.ratio='16:9';
    S.pages=[
      cleanPage({tpl:'cFrame',title:'封面標題',subtitle:'副標',body:'',items:''}),
      cleanPage({tpl:'bignum',title:'第一章',number:'01',body:'',items:''}),
      cleanPage({tpl:'tQuote',title:'一句話',body:'',items:''}),
      cleanPage({tpl:'tTable',title:'表格頁',body:'',items:'甲|1\\n乙|2'}),
      cleanPage({tpl:'wall',title:'照片頁',body:'',items:''}),
      cleanPage({tpl:'thanks',title:'謝謝',body:'',items:''}),
    ];
    S.cur=0;S.color='#333333';S.accent='#999999';
    const before=S.pages.map(p=>({tpl:p.tpl,title:p.title,items:p.items}));
    const n=applySuite('annual');
    const after=S.pages.map(p=>({tpl:p.tpl,title:p.title,items:p.items}));
    const again=applySuite('annual');
    return {n,again,before,after,color:S.color,accent:S.accent,fonts:[S.tf,S.bf]};
  })()`);
  /* 引言、表格、照片牆、結尾頁本來就是 annual 套裝要的版型，所以只有 2 頁真的被換掉 */
  eq(got.n, 2, '應該換掉 2 頁（cFrame→split、bignum→secStrip），實際 ' + got.n + ' 頁');
  deepEq(got.after.map(p => p.tpl), ['split', 'secStrip', 'tQuote', 'tTable', 'wall', 'thanks'], '每頁應該照角色換成 annual 套裝的版型');
  deepEq(got.after.map(p => p.title), got.before.map(p => p.title), '標題被動到了');
  eq(got.after[3].items, got.before[3].items, '表格的項目被動到了');
  eq(got.again, 0, '套用第二次不該再變（可重複套用）');
  eq(got.color, '#1f3a5f', '主色沒換');
  eq(got.accent, '#c9a24a', '輔色沒換');
});

test('中文名稱也認得（命令列打「年度報告」）', async ({ page }) => {
  const got = await page.run(`(()=>{
    const a=suiteFrom('年度報告'),b=suiteFrom('annual'),c=suiteFrom('品牌'),d=suiteFrom('不存在的套裝');
    return {a:a&&a.id,b:b&&b.id,c:c&&c.id,d:d===null};
  })()`);
  deepEq(got, { a: 'annual', b: 'annual', c: 'brand', d: true }, '套裝名稱比對');
});
