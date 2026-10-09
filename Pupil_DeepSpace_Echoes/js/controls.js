/* ========================= N. UI Panel & Buttons ======================== */
const panel = document.getElementById('panel');
const panelToggle = document.getElementById('panelToggle');
const panelClose = document.getElementById('panelClose');
const speedSlider = document.getElementById('speedSlider');
const speedVal = document.getElementById('speedVal');
const dmgSlider = document.getElementById('dmgSlider');
const dmgVal = document.getElementById('dmgVal');
const rangeSlider = document.getElementById('rangeSlider');
const rangeVal = document.getElementById('rangeVal');
const trailSlider = document.getElementById('trailSlider');
const trailVal = document.getElementById('trailVal');
const btnAuto = document.getElementById('btnAuto');
const btnManual = document.getElementById('btnManual');
const btnTouchOn = document.getElementById('btnTouchOn');
const btnTouchOff = document.getElementById('btnTouchOff');
const skillBtn = document.getElementById('skillBtn');
const charBtn = document.getElementById('charBtn');
const shadowBtn = document.getElementById('shadowBtn');
const touchVBtn = document.getElementById('touchVBtn');
const touchEBtn = document.getElementById('touchEBtn');
const touchFBtn = document.getElementById('touchFBtn');
const touchKBtn = document.getElementById('touchKBtn');
const pauseBtnEl = document.getElementById('pauseBtn');

function setPanelVisible(v){
  const s = v && showTouchButtons;
  panel.style.display = v ? 'block' : 'none';
  panelToggle.style.display = v ? 'flex' : 'none';
  skillBtn.style.display = s ? 'flex' : 'none';
  charBtn.style.display = s ? 'flex' : 'none';
  shadowBtn.style.display = s ? 'flex' : 'none';
  if (!s){ touchVBtn.style.display = 'none'; touchEBtn.style.display = 'none'; touchFBtn.style.display = 'none'; touchKBtn.style.display = 'none'; }
}
function syncTouchToggleBtns(){
  if (showTouchButtons){ btnTouchOn.classList.add('on'); btnTouchOff.classList.remove('on'); }
  else { btnTouchOn.classList.remove('on'); btnTouchOff.classList.add('on'); }
}
panelToggle.addEventListener('pointerdown', e=>{ e.stopPropagation(); panel.classList.remove('collapsed'); panelToggle.classList.add('hidden'); });
panelClose.addEventListener('pointerdown', e=>{ e.stopPropagation(); panel.classList.add('collapsed'); panelToggle.classList.remove('hidden'); });
speedSlider.addEventListener('input', ()=>{ enemySpeedMul = parseFloat(speedSlider.value); speedVal.textContent = enemySpeedMul.toFixed(2)+'×'; });
dmgSlider.addEventListener('input', ()=>{ enemyDmgMul = parseFloat(dmgSlider.value); dmgVal.textContent = enemyDmgMul.toFixed(2)+'×'; });
rangeSlider.addEventListener('input', ()=>{ enemyRangeMul = parseFloat(rangeSlider.value); rangeVal.textContent = enemyRangeMul.toFixed(2)+'×'; });
trailSlider.addEventListener('input', ()=>{ trailResistMul = parseFloat(trailSlider.value); trailVal.textContent = trailResistMul.toFixed(2)+'×'; });
btnAuto.addEventListener('click', ()=>{ enemyMode='auto'; btnAuto.classList.add('on'); btnManual.classList.remove('on'); });
btnManual.addEventListener('click', ()=>{ enemyMode='manual'; btnManual.classList.add('on'); btnAuto.classList.remove('on'); });
btnTouchOn.addEventListener('click', ()=>{ showTouchButtons = true; savePrefs(); syncTouchToggleBtns(); });
btnTouchOff.addEventListener('click', ()=>{ showTouchButtons = false; savePrefs(); syncTouchToggleBtns(); });
skillBtn.addEventListener('pointerdown', e=>{ e.stopPropagation(); e.preventDefault(); if (gameState === 'playing' && !practiceMode) useSkill(); });
charBtn.addEventListener('pointerdown', e=>{ e.stopPropagation(); e.preventDefault(); if (gameState === 'playing' && !practiceMode) useCharSkill(); });
shadowBtn.addEventListener('pointerdown', e=>{ e.stopPropagation(); e.preventDefault(); if (gameState === 'playing') useShadowSkill(); });
touchVBtn.addEventListener('pointerdown', e=>{
  e.stopPropagation(); e.preventDefault();
  if (gameState !== 'playing') return;
  if (enemy.hunterType === 'smoke'){
    if (enemy.smokeCharges > 0 && !enemy.dying) useSmokeSkill();
  } else if (enemy.hunterType === 'arachne' && enemy.skillTimer > 0 && spiderlings.length > 0){
    for (const sp of spiderlings){
      const dx = enemy.x - sp.x, dy = enemy.y - sp.y;
      const d = Math.hypot(dx, dy) || 1;
      sp.vx += (dx/d) * ARACHNE_V_PULL_IMPULSE;
      sp.vy += (dy/d) * ARACHNE_V_PULL_IMPULSE;
      sp.pulledTimer = 0.3;
    }
  } else {
    if (enemy.skillTimer <= 0 && !enemy.dying) tryHunterSkill();
  }
});
touchEBtn.addEventListener('pointerdown', e=>{ e.stopPropagation(); e.preventDefault(); if (gameState === 'playing') useEmpowerSkill(); });
touchFBtn.addEventListener('pointerdown', e=>{
  e.stopPropagation(); e.preventDefault();
  if (gameState !== 'playing') return;
  if (enemy.hunterType === 'arachne') useArachnePull();
  else useDriftSkill();
});
touchKBtn.addEventListener('pointerdown', e=>{
  e.stopPropagation(); e.preventDefault();
  if (gameState !== 'playing' || practiceMode) return;
  if (player.charType === 'wu') useKBlind();
  else if (player.charType === 'jing') useKMirror();
});
pauseBtnEl.addEventListener('pointerdown', e=>{ e.stopPropagation(); e.preventDefault(); if (gameState === 'playing') gameState = 'paused'; else if (gameState === 'paused') gameState = 'playing'; });
syncTouchToggleBtns();
setPanelVisible(false);

let lastSkillText = '', lastCharText = '', lastCharActive = null, lastShadowState = null,
    lastFText = '', lastFCool = null, lastVCool = null, lastKText = '', lastKCool = null,
    lastEText = '', lastECool = null, lastEArmed = null, lastKShield = null;
function updateSkillBtn(){
  const playing = (gameState === 'playing');
  const show = playing && showTouchButtons;

  skillBtn.style.display = (show && !practiceMode) ? 'flex' : 'none';
  charBtn.style.display = (show && !practiceMode) ? 'flex' : 'none';
  shadowBtn.style.display = show ? 'flex' : 'none';
  const vShow = show && (practiceMode || enemyMode === 'manual');
  touchVBtn.style.display = vShow ? 'flex' : 'none';
  const eShow = show && (practiceMode || enemyMode === 'manual');
  touchEBtn.style.display = eShow ? 'flex' : 'none';
  const fShow = show && (practiceMode || enemyMode === 'manual') && (enemy.hunterType === 'pale' || enemy.hunterType === 'eclipse' || enemy.hunterType === 'arachne');
  touchFBtn.style.display = fShow ? 'flex' : 'none';
  const kShow = show && !practiceMode && (player.charType === 'wu' || player.charType === 'jing');
  touchKBtn.style.display = kShow ? 'flex' : 'none';

  if (!playing || !showTouchButtons){
    if (lastSkillText !== ''){ lastSkillText = ''; skillBtn.textContent = 'P'; }
    if (lastCharText !== ''){ lastCharText = ''; charBtn.textContent = '['; }
    charBtn.classList.remove('active');
    lastCharActive = null;
    shadowBtn.textContent = 'B';
    shadowBtn.classList.remove('ready');
    lastShadowState = null;
    if (lastFText !== ''){ lastFText = ''; touchFBtn.textContent = 'F'; }
    if (lastKText !== ''){ lastKText = ''; touchKBtn.textContent = ']'; }
    if (lastEText !== ''){ lastEText = ''; touchEBtn.textContent = 'E'; }
    lastFCool = null; lastVCool = null; lastKCool = null; lastECool = null; lastEArmed = null;
    touchEBtn.classList.remove('armed');
    touchKBtn.classList.remove('shield');
    return;
  }

  const vCool = (enemy.hunterType === 'smoke') ? (enemy.smokeCharges <= 0) : (enemy.skillTimer > 0);
  if (vCool !== lastVCool){ lastVCool = vCool; touchVBtn.classList.toggle('cool', vCool); }
  const eCool = enemy.empowerCd > 0;
  if (eCool !== lastECool){ lastECool = eCool; touchEBtn.classList.toggle('cool', eCool); }
  const eArmed = !!enemy.empowered;
  if (eArmed !== lastEArmed){ lastEArmed = eArmed; touchEBtn.classList.toggle('armed', eArmed); }
  const etxt = enemy.empowerCd > 0 ? Math.ceil(enemy.empowerCd) + '' : (enemy.empowered ? '✦' : 'E');
  if (etxt !== lastEText){ lastEText = etxt; touchEBtn.textContent = etxt; }

  if (enemy.hunterType === 'pale' || enemy.hunterType === 'eclipse' || enemy.hunterType === 'arachne'){
    const fCool = enemy.driftCd > 0;
    if (fCool !== lastFCool){ lastFCool = fCool; touchFBtn.classList.toggle('cool', fCool); }
    const ftxt = enemy.driftCd > 0 ? Math.ceil(enemy.driftCd) + '' : 'F';
    if (ftxt !== lastFText){ lastFText = ftxt; touchFBtn.textContent = ftxt; }
  }

  if (player.charType === 'wu'){
    const kCool = player.blindCd > 0;
    if (kCool !== lastKCool){ lastKCool = kCool; touchKBtn.classList.toggle('cool', kCool); }
    const ktxt = player.blindCd > 0 ? Math.ceil(player.blindCd) + '' : ']';
    if (ktxt !== lastKText){ lastKText = ktxt; touchKBtn.textContent = ktxt; }
    touchKBtn.classList.remove('shield');
    lastKShield = false;
  } else if (player.charType === 'jing'){
    const kCool = player.mirrorKCd > 0;
    const shieldActive = player.damageReductionTimer > 0;
    if (kCool !== lastKCool || shieldActive !== lastKShield){
      lastKCool = kCool; lastKShield = shieldActive;
      touchKBtn.classList.toggle('cool', kCool && !shieldActive);
      touchKBtn.classList.toggle('shield', shieldActive);
    }
    const ktxt = kCool ? Math.ceil(player.mirrorKCd) + '' : (shieldActive ? '✦' : ']');
    if (ktxt !== lastKText){ lastKText = ktxt; touchKBtn.textContent = ktxt; }
  }

  const txt = player.skillCd > 0 ? Math.ceil(player.skillCd)+'' : 'P';
  if (txt !== lastSkillText){
    lastSkillText = txt; skillBtn.textContent = txt;
    skillBtn.classList.toggle('cool', player.skillCd > 0);
  }
  const ltxt = player.charSkillCd > 0
    ? Math.ceil(player.charSkillCd)+''
    : (player.charType === 'su' ? (player.markerPlaced ? '↺' : '[') : '[');
  if (ltxt !== lastCharText){
    lastCharText = ltxt; charBtn.textContent = ltxt;
    charBtn.classList.toggle('cool', player.charSkillCd > 0);
  }
  const active =
    (player.charType === 'yin' && player.phaseThrough > 0) ||
    (player.charType === 'zhi' && player.weaveActive > 0) ||
    (player.charType === 'su' && player.inertiaBuff > 0) ||
    (player.charType === 'xuan' && player.vortexActive > 0) ||
    (player.charType === 'wu' && player.fogTimer > 0) ||
    (player.charType === 'jing' && player.counterWindow > 0) ||
    (player.charType === 'lan' && player.tideTimer > 0) ||
    (player.charType === 'shuo' && lightAnchor !== null);
  if (active !== lastCharActive){ lastCharActive = active; charBtn.classList.toggle('active', active); }

  let bState;
  if (shadow.disabled) bState = 'idle';
  else if (shadow.active) bState = 'active';
  else if (enemy.huntProgress >= 1) bState = 'ready';
  else bState = 'idle';
  if (bState !== lastShadowState){
    lastShadowState = bState;
    shadowBtn.classList.toggle('ready', bState === 'ready');
    shadowBtn.classList.toggle('cool', bState === 'idle');
  }
  shadowBtn.textContent = shadow.active ? '↻' : (shadow.disabled ? '×' : 'B');
}

