/* ---------- 單張圖片裁切：點選主體中心＋放大倍率 ---------- */
let cropId=0;
const cropItem=()=>lib.find(x=>x.id===cropId);
function showCrop(){
  const it=cropItem();if(!it)return;const c=it.crop||focalCrop();
  $('cropName').textContent=`第 ${sel.indexOf(it.id)+1} 張・${it.name}`;
  $('cropZ').value=Math.round(c.z*100);$('cropZv').textContent=Math.round(c.z*100)+'%';
  /* 混色與不透明度 */
  $('fxBlend').value=it.blend||'';$('fxOp').value=Math.round((it.op??1)*100);$('fxOpv').textContent=Math.round((it.op??1)*100)+'%';
  const img=$('cropImg'),wr=$('cropWrap'),r=img.getBoundingClientRect(),o=wr.getBoundingClientRect();
  /* 圖片用 object-fit:contain，實際畫面範圍要扣掉留白 */
  const s=Math.min(r.width/it.w,r.height/it.h)||0,dw=it.w*s,dh=it.h*s,ox=r.left-o.left+(r.width-dw)/2,oy=r.top-o.top+(r.height-dh)/2;
  $('cropDot').style.left=(ox+c.fx*dw)+'px';$('cropDot').style.top=(oy+c.fy*dh)+'px';
  return{ox,oy,dw,dh,o};
}
function openCrop(id){cropId=id;const it=cropItem();if(!it)return;$('cropEd').hidden=false;const img=$('cropImg');img.onload=showCrop;img.src=it.thumb;showCrop();drawLib()}
function closeCrop(){cropId=0;$('cropEd').hidden=true}
/* 拖曳時只更新「已裁切」外框，不重建整個圖庫與順序列 */
function markCut(){$('order').querySelectorAll('.o').forEach(o=>o.classList.toggle('cut',!!lib.find(x=>x.id===sel[+o.dataset.i])?.crop))}
function setCrop(p){const it=cropItem();if(!it)return;it.crop=cleanCrop({...(it.crop||focalCrop()),...p});libSave(it);showCrop();markCut();refresh()}
$('cropDone').onclick=()=>{closeCrop();drawLib()};
$('cropReset').onclick=()=>{const it=cropItem();if(!it)return;it.crop=null;libSave(it);showCrop();markCut();refresh()};
$('cropZ').oninput=()=>setCrop({z:+$('cropZ').value/100});
$('cutGo').onclick=()=>doCutout();
$('cutTol').oninput=()=>{$('cutTolv').textContent=$('cutTol').value};
$('cutTolv').textContent=$('cutTol').value;
/* 混色與不透明度：改了就重畫這一頁（也用得到全域焦點，所以走 refresh） */
function setFx(p){const it=cropItem();if(!it)return;
  if('blend' in p)it.blend=p.blend;
  if('op' in p)it.op=p.op;
  libSave(it);refresh();}
$('fxBlend').onchange=()=>setFx({blend:$('fxBlend').value});
$('fxOp').oninput=()=>{const v=+$('fxOp').value/100;$('fxOpv').textContent=Math.round(v*100)+'%';setFx({op:v})};
{const wr=$('cropWrap');let down=false;
  const at=e=>{const g=showCrop();if(!g||!g.dw)return;setCrop({fx:(e.clientX-g.o.left-g.ox)/g.dw,fy:(e.clientY-g.o.top-g.oy)/g.dh})};
  wr.addEventListener('pointerdown',e=>{down=true;wr.setPointerCapture(e.pointerId);at(e)});
  wr.addEventListener('pointermove',e=>{if(down)at(e)});
  wr.addEventListener('pointerup',()=>{down=false});
  wr.addEventListener('pointercancel',()=>{down=false});}
let dragI=null;
$('order').addEventListener('dragstart',e=>{const o=e.target.closest('.o');if(!o)return;dragI=+o.dataset.i;o.classList.add('drag');e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',String(dragI))}catch(_){}});
$('order').addEventListener('dragover',e=>e.preventDefault());
$('order').addEventListener('drop',e=>{e.preventDefault();if(dragI==null)return;
  const o=e.target.closest('.o'),j=o?+o.dataset.i:sel.length-1;
  if(j===dragI){dragI=null;drawLib();return}
  const [m]=sel.splice(dragI,1);sel.splice(j,0,m);dragI=null;drawLib();refresh()});
$('order').addEventListener('dragend',()=>{dragI=null;drawLib()});
$('selAll').onclick=()=>{for(const it of lib)if(!sel.includes(it.id))sel.push(it.id);drawLib();refresh()};
$('selNone').onclick=()=>{sel=[];drawLib();refresh()};
/* 其他頁面用到的圖也算「有用到」，不能只看目前這一頁 */
$('delUnsel').onclick=()=>{storePage();const used=new Set(S.pages.flatMap(p=>p.sel));let n=0;
  for(let i=lib.length-1;i>=0;i--)if(!used.has(lib[i].id)){dropItem(lib[i]);lib.splice(i,1);n++}drawLib();refresh();toast(n?`已移除 ${n} 張`:'每張圖都有頁面在用')};
$('delAll').onclick=()=>{if(!lib.length){toast('目前沒有圖片');return}
  if(!confirm(`確定清空全部 ${lib.length} 張圖片？（所有頁面的文字與設定會保留）`))return;
  for(const it of lib)dropItem(it);lib.length=0;sel=[];for(const p of S.pages)p.sel=[];drawLib();refresh();toast('已清空')};
function pickFiles(){$('file').click()}
const drop=$('drop');drop.onclick=pickFiles;
drop.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pickFiles()}};
$('file').onchange=e=>{addFiles(e.target.files);e.target.value=''};
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over')}));
drop.addEventListener('drop',e=>addFiles(e.dataTransfer.files));
/* 貼上：圖片檔進照片庫；不在輸入框時貼上的 Excel 表格放進這一頁的項目（數字表格自動變圖表） */
document.addEventListener('paste',e=>{const fs=[...(e.clipboardData?.files||[])];if(fs.length){addFiles(fs);return}
  const t=e.target,tag=t&&t.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||(t&&t.isContentEditable))return;pasteTable(e)});

for(const k of['title','subtitle','body','items','number','notes','company','date','page','fname']){$(k).value=S[k];$(k).oninput=()=>{S[k]=$(k).value;save();refresh()}}
const fo=FONTS.map((f,i)=>`<option value="${i}">${f[0]}</option>`).join('');
$('tf').innerHTML=fo;$('bf').innerHTML=fo;$('tf').value=S.tf;$('bf').value=S.bf;
$('tf').onchange=()=>{S.tf=+$('tf').value;save();refresh()};$('bf').onchange=()=>{S.bf=+$('bf').value;save();refresh()};
$('color').value=S.color;$('color').oninput=()=>{S.color=$('color').value;save();refresh()};
$('sw').innerHTML=SWATCH.map(c=>`<button style="background:${c}" data-c="${c}" title="${c}" aria-label="套用 ${c}"></button>`).join('');
$('sw').onclick=e=>{const c=e.target.dataset.c;if(!c)return;S.color=c;$('color').value=c;save();refresh()};
$('accent').value=S.accent;$('accent').oninput=()=>{S.accent=$('accent').value;save();refresh()};
$('biz').innerHTML=BIZ.map(([n,m,a],i)=>`<button data-i="${i}" title="套用 ${n}"><i style="background:${m}"></i><i style="background:${a}"></i>${n}</button>`).join('');
$('biz').onclick=e=>{const b=e.target.closest('button');if(!b)return;const[,m,a]=BIZ[+b.dataset.i];S.color=m;S.accent=a;$('color').value=m;$('accent').value=a;save();refresh()};
$('bg').value=S.bg;$('bg').oninput=()=>{S.bg=$('bg').value;S.bgOn=true;$('bgOn').checked=true;save();refresh()};
$('bgSw').innerHTML=BGS.map(([n,v])=>`<button style="background:${v}" data-c="${v}" title="${n}" aria-label="底色 ${n}"></button>`).join('');
$('bgSw').onclick=e=>{const v=e.target.dataset.c;if(!v)return;S.bg=v;S.bgOn=true;$('bg').value=v;$('bgOn').checked=true;save();refresh()};
for(const k of['footer','logoBg','bgOn','single']){$(k).checked=S[k];$(k).onchange=()=>{S[k]=$(k).checked;save();refresh()}}
/* 打開章節頁同步時，馬上把這一頁的版型與照片套到其他章節頁 */
$('secSync').checked=S.secSync;
$('secSync').onchange=()=>{S.secSync=$('secSync').checked;storePage();const n=syncSections({tpl:true,photo:true});save();drawAll();histLater();
  toast(S.secSync?(n?`已同步 ${n} 個章節頁`:'章節頁同步已開啟'):'章節頁同步已關閉，各章節頁可分開設定')};
$('bullet').innerHTML=BULLETS.map(([v,n])=>`<option value="${v}">${n}</option>`).join('');
$('bullet').value=S.bullet;$('bullet').onchange=()=>{S.bullet=$('bullet').value;save();refresh()};
$('logoPos').value=S.logoPos;$('logoPos').onchange=()=>{S.logoPos=$('logoPos').value;save();refresh()};
$('logoSize').value=S.logoSize;$('logoSize').oninput=()=>{S.logoSize=+$('logoSize').value;showLogoSize();save();refresh()};
const showLogoSize=()=>{$('logoSizeVal').textContent=S.logoSize+'px'};showLogoSize();
const showFs=()=>{$('fsVal').textContent=S.fs+'%'};
$('fs').value=S.fs;showFs();$('fs').oninput=()=>{S.fs=+$('fs').value;showFs();save();refresh()};
const showLogo=()=>{$('logoPrev').src=S.logo||'';$('logoPrev').style.display=S.logo?'':'none'};showLogo();
$('logoBtn').onclick=()=>$('logoFile').click();
$('logoDel').onclick=()=>{S.logo='';save();showLogo();refresh()};
$('logoFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const bmp=await createImageBitmap(f),s=Math.min(1,480/Math.max(bmp.width,bmp.height)),cv=document.createElement('canvas');
    cv.width=Math.max(1,Math.round(bmp.width*s));cv.height=Math.max(1,Math.round(bmp.height*s));
    cv.getContext('2d').drawImage(bmp,0,0,cv.width,cv.height);if(bmp.close)bmp.close();
    S.logo=cv.toDataURL('image/png');S.logoAR=cv.width/cv.height;save();showLogo();refresh();toast('已加入 Logo')}catch(err){toast('Logo 讀取失敗，換成 PNG 試試')}};
$('pick').onclick=()=>{const src=chosen('thumb')[0].src;if(!src)return;const im=new Image();
  im.onerror=()=>toast('這張圖讀不進來，取不到顏色');
  im.onload=()=>{try{
    const cv=document.createElement('canvas');cv.width=cv.height=40;const x=cv.getContext('2d');x.drawImage(im,0,0,40,40);
    const d=x.getImageData(0,0,40,40).data,bins=Array.from({length:12},()=>({w:0,r:0,g:0,b:0}));
    for(let i=0;i<d.length;i+=4){const[r,g,b]=[d[i],d[i+1],d[i+2]],mx=Math.max(r,g,b),mn=Math.min(r,g,b),s=mx?(mx-mn)/mx:0;if(s<.15||mx<40)continue;
      let h;if(mx===r)h=((g-b)/(mx-mn)+6)%6;else if(mx===g)h=(b-r)/(mx-mn)+2;else h=(r-g)/(mx-mn)+4;const bi=bins[Math.floor(h*2)%12],w=s*mx;bi.w+=w;bi.r+=r*w;bi.g+=g*w;bi.b+=b*w}
    const best=bins.sort((a,b)=>b.w-a.w)[0];if(!best.w){toast('這張圖顏色太淡，取不到主色');return}
    let col='#'+[best.r,best.g,best.b].map(v=>Math.round(v/best.w).toString(16).padStart(2,'0')).join('');
    const[r,g,b]=hex2rgb(col),L=(Math.max(r,g,b)+Math.min(r,g,b))/510;if(L>.5)col=mix(col,'#000000',(L-.45)/L);
    S.color=col;$('color').value=col;save();refresh();toast('已套用圖片主色 '+col)
  }catch(e){toast('取色失敗')}};
  im.src=src};

/* 外觀 */
const THEMES=[['auto','自動'],['light','淺色'],['dark','深色']];
$('theme').innerHTML=THEMES.map(([v,n])=>`<button data-v="${v}">${n}</button>`).join('');
function applyTheme(){
  const el=document.documentElement;
  if(S.theme==='auto')el.removeAttribute('data-theme');else el.setAttribute('data-theme',S.theme);
  [...$('theme').children].forEach(b=>{b.classList.toggle('on',b.dataset.v===S.theme);b.setAttribute('aria-pressed',String(b.dataset.v===S.theme))});
}
$('theme').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.theme=b.dataset.v;applyTheme();save()};

/* 圖片焦點 */
$('focal').innerHTML=FOCAL.map(()=>'<button></button>').join('');
[...$('focal').children].forEach((b,i)=>{b.dataset.v=FOCAL[i];b.setAttribute('aria-label',`焦點 ${['左','中','右'][i%3]}${['上','中','下'][Math.floor(i/3)]}`)});
function applyFocal(){[...$('focal').children].forEach(b=>{b.classList.toggle('on',b.dataset.v===S.focal);b.setAttribute('aria-pressed',String(b.dataset.v===S.focal))})}
$('focal').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.focal=b.dataset.v;applyFocal();save();refresh()};

/* 輸出設定 */
$('fmt').value=S.fmt;$('scale').value=S.scale;
$('fmt').onchange=()=>{S.fmt=$('fmt').value;save()};
$('scale').onchange=()=>{S.scale=+$('scale').value;save()};
for(const k of['pptText','pptQ']){$(k).value=S[k];$(k).onchange=()=>{S[k]=$(k).value;save()}}

/* 範本分類 */
/* 「建議」：用這一頁的內容把每個版型試排一次，只列出放得下的；項目多、內文長或沒放照片時文字頁排前面 */
let fitCache={sig:'',list:TPL};
function fitList(){
  const sig=contentSig();if(fitCache.sig===sig)return fitCache.list;
  const th=chosen('thumb'),n=String(S.items||'').split('\n').filter(s=>s.trim()).length,wordy=n>=4||String(S.body||'').length>80||!sel.length;
  const pool=TPL.filter(tplOK),ok=pool.filter(t=>!overflowNote(renderSVG(t,th,'f'+t.id+'_')));
  /* 項目是數字表格時圖表排最前面 */
  const numeric=isNumericTable(S.items);
  const rank=t=>numeric&&t.cat==='chart'?-1:(t.cat==='text'||t.cat==='card')?(wordy?0:2):t.cat==='chart'?3:1;
  fitCache={sig,list:(ok.length?ok:pool).slice().sort((a,b)=>rank(a)-rank(b))};
  return fitCache.list;
}
const ofCat=v=>v==='fit'?fitList():TPL.filter(t=>tplOK(t)&&(v==='all'||t.cat===v));
function tplList(){return ofCat(S.cat)}
function drawFilters(){
  if(S.cat!=='fit'&&!ofCat(S.cat).length)S.cat='fit';
  $('filters').innerHTML=CATS.map(([v,n])=>{const c=ofCat(v).length;if(!c&&v!==S.cat)return'';
    return`<button data-v="${v}" class="${S.cat===v?'on':''}" aria-pressed="${S.cat===v}">${n} ${c}</button>`}).join('');
}
$('filters').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  S.cat=b.dataset.v;save();drawFilters();
  /* 目前範本不在新分類裡就跳到該分類第一個，避免看不到自己正在用哪個 */
  const list=tplList();
  if(S.cat!=='fit'&&list.length&&!list.some(t=>t.id===S.tpl)){S.tpl=list[0].id;storePage();drawStage();drawPages()}
  drawGallery(true);
};

/* 繪製 */
let tA=0,tB=0;
