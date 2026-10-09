
'use strict';

const CHAR_META=CHARACTERS, HUNTER_META=HUNTERS;
const DEFAULT_DATA=JSON.parse(JSON.stringify(DEFAULT_BALANCE));
function normalizeConfig(source){
 if(!source||typeof source!=='object'||Array.isArray(source))throw new Error('无效的配置');
 const out=JSON.parse(JSON.stringify(DEFAULT_DATA));
 const limits={speedMul:[.1,5],skillCd:[0,60],atkRange:[0,800],maxSlow:[0,1],baseDmgMul:[0,5],moveSpd:[10,200],extraCd:[0,30],charge:[.1,10],maxCharges:[1,10],enemySpeedMul:[0,5],enemyDmgMul:[0,5],enemyRangeMul:[0,5],trailResistMul:[0,5],difficultyBias:[-1,1]};
 function patch(dst,src){for(const k in dst){if(Number.isFinite(src?.[k])){const [lo,hi]=limits[k];dst[k]=Math.min(hi,Math.max(lo,src[k]));if(k==='maxCharges')dst[k]=Math.round(dst[k]);}}}
 for(const group of ['characters','hunters','global']){if(group==='global')patch(out.global,source.global);else for(const id in out[group])patch(out[group][id],source[group]?.[id]);}
 return out;
}
function updateSummary(){
 let n=0;const count=(base,edited)=>{for(const k in base)if(typeof base[k]==='object')count(base[k],edited[k]);else if(base[k]!==edited[k])n++;};count(DEFAULT_DATA,DATA);
 const el=document.getElementById('modifiedCount');if(el)el.textContent=String(n).padStart(2,'0');
 document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('selected',b.dataset.preset==='standard'&&n===0));
}
const STORAGE_KEY = 'pupil_cheat_data';

const CHAR_FIELDS = [
  {key:'speedMul',label:'移速倍率',min:0.1,max:5,step:0.05,unit:'×',digits:2},
  {key:'skillCd', label:'技能 CD', min:0,  max:60,step:0.5, unit:'s',digits:1}
];
const HUNTER_FIELDS = [
  {key:'moveSpd',label:'移动速度',min:10,max:200,step:1,unit:'%',digits:0},
  {key:'atkRange',  label:'攻击范围',min:0,  max:800,step:5,   unit:'', digits:0},
  {key:'maxSlow',   label:'尾流拖曳',min:0,  max:1,  step:0.01,unit:'', digits:2},
  {key:'baseDmgMul',label:'基础伤害倍率',min:0,  max:5,  step:0.05,unit:'×',digits:2},
  {key:'skillCd',   label:'主技能CD',min:0,  max:30, step:0.5, unit:'s',digits:1},
  {key:'extraCd',   label:'副技能CD',min:0,  max:30, step:0.5, unit:'s',digits:1,optional:true},
  {key:'charge',    label:'充能时间',min:0.1,max:10, step:0.1, unit:'s',digits:1,optional:true},
  {key:'maxCharges',label:'最大充能',min:1,  max:10, step:1,   unit:'', digits:0,optional:true}
];
const GLOBAL_FIELDS = [
  {key:'enemySpeedMul', label:'敌速倍率',    min:0,max:5,step:0.05,unit:'×',digits:2},
  {key:'enemyDmgMul',   label:'敌人伤害倍率',min:0,max:5,step:0.05,unit:'×',digits:2},
  {key:'enemyRangeMul', label:'敌人范围倍率',min:0,max:5,step:0.05,unit:'×',digits:2},
  {key:'trailResistMul',label:'尾流抗性倍率',min:0,max:5,step:0.05,unit:'×',digits:2},
  {key:'difficultyBias',label:'难度偏差',    min:-1,max:1,step:0.01,unit:'',digits:2}
];

const clone = o => JSON.parse(JSON.stringify(o));
function merge(base, patch){
  const out = clone(base);
  for (const k in patch){
    if (patch[k] && typeof patch[k]==='object' && !Array.isArray(patch[k])){
      out[k] = merge(out[k]||{}, patch[k]);
    } else out[k] = patch[k];
  }
  return out;
}

let DATA = (()=>{
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeConfig(JSON.parse(raw)) : clone(DEFAULT_DATA);
  }catch(e){ return clone(DEFAULT_DATA); }
})();

const statusEl = document.getElementById('status');
let statusTimer = null;
function setStatus(msg, err){
  statusEl.textContent = msg;
  statusEl.classList.toggle('error', !!err);
  statusEl.classList.add('show');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(()=>statusEl.classList.remove('show'), 1200);
}
function save(){
  updateSummary();
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA));
    setStatus('已保存');
  }catch(e){ setStatus('保存失败：'+e.message, true); }
}

function el(tag, attrs, children){
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs){
    if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  if (children) (Array.isArray(children)?children:[children]).forEach(c=>{
    if (c == null) return;
    e.appendChild(typeof c==='string'?document.createTextNode(c):c);
  });
  return e;
}

function makeRow(field, value, onChange){
  const row = el('div', {class:'row'});
  row.appendChild(el('label', null, field.label));
  const range = document.createElement('input');
  range.type='range';
  range.min=field.min; range.max=field.max; range.step=field.step;
  range.value=value;
  const num = document.createElement('input');
  num.type='number';
  num.min=field.min; num.max=field.max; num.step=field.step;
  num.value=Number(value).toFixed(field.digits);
  const unit = el('span', {class:'unit'}, field.unit||'');

  function commit(v, syncRange){
    v = Number(v);
    if (!isFinite(v)) return;
    v = Math.min(field.max, Math.max(field.min, v));
    if (syncRange) range.value = v;
    num.value = v.toFixed(field.digits);
    onChange(v);
  }
  range.addEventListener('input', ()=>commit(range.value, false));
  num.addEventListener('change', ()=>commit(num.value, true));
  num.addEventListener('blur',   ()=>commit(num.value, true));

  row.appendChild(range);
  row.appendChild(num);
  row.appendChild(unit);
  return row;
}

function renderChars(){
  const grid = document.getElementById('charsGrid');
  grid.innerHTML = '';
  for (const id in CHAR_META){
    const m = CHAR_META[id];
    const card = el('div',{class:'card'});
    const head = el('div',{class:'cardHeader'});
    const av = el('div',{class:'avatar'});
    const portrait=el('canvas',{'data-art':id,'data-kind':CHAR_META[id]?'char':'hunter'});portrait.width=portrait.height=140;av.appendChild(portrait);PupilArt.draw(portrait.getContext('2d'),id,70,70,40,0,CHAR_META[id]?'char':'hunter');
    av.style.background = `radial-gradient(circle at 35% 30%, rgba(${m.rim},0.5), rgba(${m.rim},0.15))`;
    av.style.border = `1.5px solid rgba(${m.rim},0.7)`;
    av.style.color = `rgb(${m.rim})`;
    head.appendChild(av);
    head.appendChild(el('div',{class:'charInfo'},[
      el('div',{class:'charName'}, m.name+' · '+ROSTER_NOTES[id].tag),
      el('div',{class:'charSub'}, m.sub)
    ]));
    card.appendChild(head);
    for (const f of CHAR_FIELDS){
      card.appendChild(makeRow(f, DATA.characters[id][f.key], v=>{
        DATA.characters[id][f.key]=v; save(); refreshExport();
      }));
    }
    grid.appendChild(card);
  }
}

function renderHunters(){
  const grid = document.getElementById('huntersGrid');
  grid.innerHTML = '';
  for (const id in HUNTER_META){
    const m = HUNTER_META[id];
    const card = el('div',{class:'card'});
    const head = el('div',{class:'cardHeader'});
    const av = el('div',{class:'avatar'});
    const portrait=el('canvas',{'data-art':id,'data-kind':CHAR_META[id]?'char':'hunter'});portrait.width=portrait.height=140;av.appendChild(portrait);PupilArt.draw(portrait.getContext('2d'),id,70,70,40,0,CHAR_META[id]?'char':'hunter');
    av.style.background = `radial-gradient(circle at 35% 30%, rgba(${m.rim},0.5), rgba(${m.rim},0.15))`;
    av.style.border = `1.5px solid rgba(${m.rim},0.7)`;
    av.style.color = `rgb(${m.rim})`;
    head.appendChild(av);
    head.appendChild(el('div',{class:'charInfo'},[
      el('div',{class:'charName'}, m.name+' · '+ROSTER_NOTES[id].tag),
      el('div',{class:'charSub'}, m.sub)
    ]));
    card.appendChild(head);
    for (const f of HUNTER_FIELDS){
      if (f.optional && DATA.hunters[id][f.key] === undefined) continue;
      card.appendChild(makeRow(f, DATA.hunters[id][f.key] ?? 0, v=>{
        DATA.hunters[id][f.key]=v; save(); refreshExport();
      }));
    }
    grid.appendChild(card);
  }
}

function renderGlobal(){
  const box = document.getElementById('globalRows');
  box.innerHTML = '';
  for (const f of GLOBAL_FIELDS){
    box.appendChild(makeRow(f, DATA.global[f.key], v=>{
      DATA.global[f.key]=v; save(); refreshExport();
    }));
  }
}

function refreshExport(){
  updateSummary();
  document.getElementById('exportArea').value = JSON.stringify(DATA, null, 2);
}

document.querySelectorAll('nav button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
  });
});

document.querySelectorAll('button[data-reset]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const w = btn.dataset.reset;
    if (w==='chars')   { DATA.characters = clone(DEFAULT_DATA.characters); renderChars(); }
    if (w==='hunters') { DATA.hunters    = clone(DEFAULT_DATA.hunters);    renderHunters(); }
    if (w==='global')  { DATA.global     = clone(DEFAULT_DATA.global);     renderGlobal(); }
    save(); refreshExport();
  });
});

document.getElementById('copyJsonBtn').addEventListener('click', async ()=>{
  try{ await navigator.clipboard.writeText(JSON.stringify(DATA)); setStatus('JSON 已复制'); }
  catch(e){ setStatus('复制失败', true); }
});

document.getElementById('downloadBtn').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(DATA, null, 2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download='pupil_cheat_data.json'; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('importBtn').addEventListener('click', ()=>{
  const raw = document.getElementById('importArea').value.trim();
  if (!raw){ setStatus('请先粘贴 JSON', true); return; }
  try{
    DATA = normalizeConfig(JSON.parse(raw));
    save();
    renderChars(); renderHunters(); renderGlobal(); refreshExport();
    setStatus('导入成功');
  }catch(e){ setStatus('JSON 解析失败', true); }
});

document.getElementById('resetAllBtn').addEventListener('click', ()=>{
  if (!confirm('恢复标准平衡数值？当前修改将被替换。')) return;
  DATA = clone(DEFAULT_DATA);
  save();
  renderChars(); renderHunters(); renderGlobal(); refreshExport();
  setStatus('已重置');
});

renderChars();
renderHunters();
renderGlobal();
refreshExport();

document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{
 const presets={standard:{enemySpeedMul:1,enemyDmgMul:1,enemyRangeMul:1,trailResistMul:1,difficultyBias:0},gentle:{enemySpeedMul:.85,enemyDmgMul:.75,enemyRangeMul:.9,trailResistMul:1.1,difficultyBias:-.2},pressure:{enemySpeedMul:1.12,enemyDmgMul:1.12,enemyRangeMul:1.08,trailResistMul:.92,difficultyBias:.15}};
 DATA.global=clone(presets[b.dataset.preset]);renderGlobal();save();refreshExport();setStatus('已应用全局预设');
}));
document.getElementById('fileImport').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{DATA=normalizeConfig(JSON.parse(await f.text()));save();renderChars();renderHunters();renderGlobal();refreshExport();setStatus('已导入配置');}catch(_){setStatus('配置格式无效',true);}e.target.value='';});

// The visible specimens gently swim; hidden tabs do not consume drawing work.
let labArtLast=0;
function animateLaboratory(now){
 requestAnimationFrame(animateLaboratory);
 if(document.hidden||now-labArtLast<50||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 labArtLast=now;
 for(const c of document.querySelectorAll('.tab.active [data-art]')){const rect=c.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight)continue;const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);PupilArt.draw(g,c.dataset.art,70,70,40,now/1000,c.dataset.kind);}
}
requestAnimationFrame(animateLaboratory);
