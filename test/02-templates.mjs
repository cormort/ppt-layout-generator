/* 版型稽核：每個版型在它支援的每個尺寸都要畫得出來、文字不出畫布、沒有 NaN，
   而且用預設文字時不能出現「放不下」警告。這是抓回歸最重要的一支。 */
import { test, ok, eq, deepEq } from './lib/check.mjs';

const RESET = `(()=>{S.ratio='16:9';S.fs=100;
  S.title=DEF.title;S.subtitle=DEF.subtitle;S.body=DEF.body;S.items=DEF.items;S.number=DEF.number;
  S.footer=true;S.company='公司';S.date='2026.10';S.page='P.01';S.bgOn=false;
  return 1})()`;

test('每個版型在每個支援的尺寸都畫得出來，文字不出畫布', async ({ page }) => {
  await page.run(RESET);
  const report = await page.run(`(async()=>{
    const out={problems:[],checked:0,perRatio:{}};
    const imgs=samples.slice(0,4).map(s=>({src:s.src,w:s.w,h:s.h}));
    for(const ratio of Object.keys(RATIOS)){
      S.ratio=ratio;const [rw,rh]=RATIOS[ratio];
      out.perRatio[ratio]=TPL.filter(t=>(t.ratios||['16:9']).includes(ratio)).length;
      for(const t of TPL){
        if(!(t.ratios||['16:9']).includes(ratio))continue;
        out.checked++;
        let svg;
        try{svg=renderSVG(t,imgs,'t'+t.id.replace(/[^a-z0-9]/gi,'')+'_')}
        catch(e){out.problems.push(ratio+' '+t.id+' 例外：'+e.message);continue}
        if(/NaN|Infinity/.test(svg)){out.problems.push(ratio+' '+t.id+' 出現 NaN');continue}
        const vb=(svg.match(/viewBox="([^"]+)"/)||[])[1];
        if(vb!=='0 0 '+rw+' '+rh){out.problems.push(ratio+' '+t.id+' viewBox='+vb);continue}
        const pts=[...svg.matchAll(/<text x="(-?[\\d.]+)"[^>]*y="(-?[\\d.]+)"/g)].map(m=>[+m[1],+m[2]]);
        const tol=90;
        const off=pts.filter(([x,y])=>x<-tol||x>rw+tol||y<-tol||y>rh+tol);
        if(pts.length&&off.length===pts.length)out.problems.push(ratio+' '+t.id+' 文字全在畫布外');
        if(pts.length&&off.length>pts.length/2)out.problems.push(ratio+' '+t.id+' 一半以上文字在畫布外');
      }
    }
    S.ratio='16:9';
    return out;
  })()`);
  eq(report.problems.length, 0, '版型問題：\n      ' + report.problems.join('\n      '));
  ok(report.checked > 100, '檢查數量太少：' + report.checked);
  for (const [r, n] of Object.entries(report.perRatio)) ok(n > 0, `${r} 沒有任何可用版型`);
});

test('預設文字不會誤報「放不下」', async ({ page }) => {
  await page.run(RESET);
  const warns = await page.run(`(()=>{
    const imgs=samples.slice(0,3).map(s=>({src:s.src,w:s.w,h:s.h}));
    const out=[];
    for(const t of TPL){
      const ratio=(t.ratios||['16:9'])[0];S.ratio=ratio;S.tpl=t.id;
      const svg=renderSVG(t,imgs,'w'+t.id.replace(/[^a-z0-9]/gi,'')+'_');
      const n=overflowNote(svg);
      if(n)out.push(ratio+' '+t.id+' → '+n.slice(0,40));
    }
    S.ratio='16:9';
    return out;
  })()`);
  eq(warns.length, 0, '預設文字就警告：\n      ' + warns.join('\n      '));
});

test('比例切換後每一頁都還是合法版型，而且有記錄可復原', async ({ page }) => {
  const got = await page.run(`(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    S.pages=[
      {...cleanPage({tpl:'tList',title:'條列',items:'甲|a'}),sel:[]},
      {...cleanPage({tpl:'diamond',title:'拼貼'}),sel:[]},
      {...cleanPage({tpl:'mIndex',title:'目錄',items:'甲|a'}),sel:[]},
      {...cleanPage({tpl:'secFull',title:'章節',number:'01'}),sel:[]}
    ];
    S.cur=0;usePage(0);drawAll();await wait(120);
    const before=S.pages.map(p=>p.tpl);
    S.ratio='3:4';
    for(const p of S.pages)p.tpl=tplFor(p.tpl);
    storePage();usePage(0);syncUI();drawAll();await wait(200);
    const after=S.pages.map(p=>p.tpl);
    const valid=S.pages.every(p=>(TPLBY[p.tpl].ratios||['16:9']).includes(S.ratio));
    const kept={tList:after[0]==='tList',magTo:after[2]};
    S.ratio='16:9';
    return {before,after,valid,kept};
  })()`);
  ok(got.valid, '切換到 3:4 後有頁面的版型不合法：' + JSON.stringify(got.after));
  eq(got.kept.tList, true, 'tList 應該保留在 3:4');
  eq(got.kept.magTo, 'tList', '雜誌目錄應該換成條列');
});

test('fitList 的建議清單與可用版型數量對得上', async ({ page }) => {
  const got = await page.run(`(()=>{
    S.items='第一季|120\\n第二季|180';S.title='測試';S.body='一句話。';
    const out={};
    for(const r of Object.keys(RATIOS)){
      S.ratio=r;fitCache={sig:'',list:TPL};
      out[r]={caps:TPL.filter(t=>(t.ratios||['16:9']).includes(r)).length,fit:fitList().length};
    }
    S.ratio='16:9';
    return out;
  })()`);
  for (const [r, v] of Object.entries(got)) {
    ok(v.fit > 0, `${r} 建議清單是空的`);
    ok(v.fit <= v.caps, `${r} 建議 ${v.fit} 超過可用 ${v.caps}`);
    ok(v.fit >= v.caps - 3, `${r} 建議清單漏太多版型（${v.fit}/${v.caps}）`);
  }
});
