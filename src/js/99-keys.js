/* ---------- 快捷鍵 ---------- */
document.addEventListener('keydown',e=>{
  const t=e.target,tag=t&&t.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(t&&t.isContentEditable))return;
  const mod=e.ctrlKey||e.metaKey,key=e.key.toLowerCase();
  if(mod&&key==='z'&&!e.shiftKey){e.preventDefault();histGo(-1)}
  else if(mod&&(key==='y'||(key==='z'&&e.shiftKey))){e.preventDefault();histGo(1)}
  else if(mod&&key==='s'){e.preventDefault();download()}
  else if(mod&&e.shiftKey&&e.key.toLowerCase()==='c'){e.preventDefault();$('copy').click()}
  else if(!mod&&(e.key==='PageDown'||e.key==='PageUp')){e.preventDefault();goPage(S.cur+(e.key==='PageDown'?1:-1))}
  else if(e.altKey&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){
    e.preventDefault();const list=tplList();if(!list.length)return;
    const i=list.findIndex(x=>x.id===S.tpl);
    const n=list[(i+(e.key==='ArrowRight'?1:list.length-1)+list.length)%list.length];
    if(n)pickTpl(n.id);
  }
});

