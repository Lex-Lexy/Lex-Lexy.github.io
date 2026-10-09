/* ============================== F. Input ================================ */
function inRect(x,y,r){ return x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h; }
function startBtnBounds(){ const w=210, h=50; return { x:W/2-w/2, y:H-58, w, h }; }
function mainMenuBtnBounds(i){
  const w = 230, h = 40, gap = 8;
  const totalH = 4*h + 3*gap;
  const startY = H/2 - totalH/2 + 20;
  return { x:W/2-w/2, y:startY + i*(h+gap), w, h, idx:i };
}
function difficultySliderBounds(){
  const w = 230, h = 20;
  return { x: W/2-w/2, y: mainMenuBtnBounds(3).y + 60, w, h };
}
function backBtnBounds(){ return { x:20, y:20, w:70, h:36 }; }
function pauseBtnBounds(){ return { x:W-58, y:14, w:44, h:44 }; }
function pauseResumeBtnBounds(){ const w=180, h=44; return { x:W/2-w/2, y:H/2, w, h }; }
function pauseQuitBtnBounds(){ const w=180, h=44; return { x:W/2-w/2, y:H/2+58, w, h }; }

/* 调整界面布局 */
function adjustCharCardBounds(i){
  const n = 6;
  const cw = Math.min(54, (W - 40) / n - 4);
  const ch = 64;
  const gap = 4;
  const totalW = n*cw + (n-1)*gap;
  const sx = (W - totalW) / 2;
  const sy = 60;
  return { x: sx + i*(cw+gap), y: sy, w: cw, h: ch };
}
function adjustCharInfoBounds(){
  const w = Math.min(320, W - 40), h = 96;
  return { x: (W - w)/2, y: 60 + 64 + 8, w, h };
}
function adjustMapCardBounds(i){
  const size = Math.min(84, (W - 60) / 3 - 12);
  const gap = 16;
  const totalW = 3*size + 2*gap;
  const sx = (W - totalW)/2;
  const sy = H * 0.47;
  return { x: sx + i*(size+gap), y: sy, w: size, h: size };
}
function adjustHunterInfoBounds(){
  const w = Math.min(320, W - 40), h = 96;
  return { x: (W - w)/2, y: H*0.47 + 100, w, h };
}
function adjustHunterCardBounds(i){
  const n = 5;
  const cw = Math.min(56, (W - 40) / n - 4);
  const ch = 64;
  const gap = 4;
  const totalW = n*cw + (n-1)*gap;
  const sx = (W - totalW) / 2;
  const sy = H*0.47 + 100 + 96 + 8;
  return { x: sx + i*(cw+gap), y: sy, w: cw, h: ch };
}

function onDown(e){
  if (e.cancelable) e.preventDefault();
  if (gameState === 'menu'){
    if (menuScreen === 'main'){
      for (let i=0; i<4; i++){
        if (inRect(e.clientX, e.clientY, mainMenuBtnBounds(i))){
          if (i === 0){ practiceMode = false; startGame(); }
          else if (i === 1){ practiceMode = true; startGame(); }
          else if (i === 2){ menuScreen = 'adjust'; }
          else if (i === 3){ showTouchButtons = !showTouchButtons; savePrefs(); syncTouchToggleBtns(); }
          return;
        }
      }
      const sb = difficultySliderBounds();
      if (inRect(e.clientX, e.clientY, sb)){
        const t = clamp((e.clientX - sb.x) / sb.w, 0, 1);
        difficultyBias = t * 2 - 1;
        savePrefs();
        return;
      }
      if (inRect(e.clientX, e.clientY, startBtnBounds())){ practiceMode = false; startGame(); }
    } else if (menuScreen === 'adjust'){
      if (inRect(e.clientX, e.clientY, backBtnBounds())){ menuScreen = 'main'; return; }
      // 角色
      for (let i=0; i<6; i++){
        if (inRect(e.clientX, e.clientY, adjustCharCardBounds(i))){
          selectedChar = ['su','yin','zhi','xuan','wu','jing'][i];
          return;
        }
      }
      // 地图
      for (let i=0; i<3; i++){
        if (inRect(e.clientX, e.clientY, adjustMapCardBounds(i))){
          selectedMapId = ['void','night','buildings'][i];
          return;
        }
      }
      // 追猎者
      for (let i=0; i<5; i++){
        if (inRect(e.clientX, e.clientY, adjustHunterCardBounds(i))){
          selectedHunter = ['eclipse','crimson','pale','smoke','arachne'][i];
          return;
        }
      }
    }
    return;
  }
  if (gameState === 'intro') return;
  if (gameState === 'paused'){
    if (inRect(e.clientX, e.clientY, pauseResumeBtnBounds())) gameState = 'playing';
    else if (inRect(e.clientX, e.clientY, pauseQuitBtnBounds())){
      gameState = 'menu'; menuScreen='main'; setPanelVisible(false);
      document.getElementById('pauseBtn').classList.add('hidden');
    }
    return;
  }
  if (gameState === 'dead' || gameState === 'win'){
    const t = gameState === 'dead' ? deathTimer : winTimer;
    if (t > 0.8){ gameState='menu'; menuScreen='main'; setPanelVisible(false); document.getElementById('pauseBtn').classList.add('hidden'); }
    return;
  }
  if (inRect(e.clientX, e.clientY, pauseBtnBounds())){ gameState = 'paused'; return; }
  joystick.active = true; joystick.id = e.pointerId;
  joystick.baseX = e.clientX; joystick.baseY = e.clientY;
  joystick.knobX = e.clientX; joystick.knobY = e.clientY;
  try { canvas.setPointerCapture(e.pointerId); } catch(_){}
}
function onMove(e){
  if (gameState === 'intro') return;
  if (!joystick.active || e.pointerId !== joystick.id) return;
  joystick.knobX = e.clientX; joystick.knobY = e.clientY;
}
function onUp(e){
  if (!joystick.active) return;
  if (e && e.pointerId !== joystick.id) return;
  joystick.active = false; joystick.id = null;
}
canvas.addEventListener('pointerdown', onDown, { passive:false });
canvas.addEventListener('pointermove', onMove, { passive:false });
canvas.addEventListener('pointerup', onUp);
canvas.addEventListener('pointercancel', onUp);
window.addEventListener('blur', ()=>{ onUp(); for(const k in keys) keys[k]=false; if(gameState==='playing') gameState='paused'; });

window.addEventListener('keydown', e=>{
  const k = e.key.toLowerCase();
  if (k==='tab' && gameState==='playing') e.preventDefault();
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k) && !e.target.matches('input,textarea')) e.preventDefault();
  if (e.target.matches('input,textarea,select')) return;
  keys[k] = true;
  if (k === 'escape' && (gameState === 'playing' || gameState === 'paused')){
    gameState = (gameState === 'playing') ? 'paused' : 'playing';
    return;
  }
  if (gameState !== 'playing') return;
  if (k === 'p' && !practiceMode) useSkill();
  if (k === '[' && !practiceMode) useCharSkill();
  if (k === ']' && !practiceMode){
    if (player.charType === 'wu') useKBlind();
    else if (player.charType === 'jing') useKMirror();
  }
  if (k === 'e') useEmpowerSkill();
  if (k === 'f'){
    if (enemy.hunterType === 'arachne') useArachnePull();
    else useDriftSkill();
  }
});
window.addEventListener('keyup', e=>{ keys[e.key.toLowerCase()] = false; });

function readInput(){
  let sdx=0, sdy=0, smag=0;
  if (joystick.active){
    const ix = joystick.knobX - joystick.baseX;
    const iy = joystick.knobY - joystick.baseY;
    const d = Math.hypot(ix, iy);
    const DEAD = 6, MAXR = 62;
    if (d > DEAD){ smag = Math.min(1, (d-DEAD)/(MAXR-DEAD)); sdx = ix/d; sdy = iy/d; }
  }
  stickInput.dx = sdx; stickInput.dy = sdy; stickInput.mag = smag;
  // WASD → 追猎者
  let kx=0, ky=0;
  if (keys['w']) ky -= 1;
  if (keys['s']) ky += 1;
  if (keys['a']) kx -= 1;
  if (keys['d']) kx += 1;
  if (kx || ky){ const l = Math.hypot(kx, ky); keyInput.dx = kx/l; keyInput.dy = ky/l; keyInput.mag = 1; }
  else { keyInput.dx = 0; keyInput.dy = 0; keyInput.mag = 0; }
  // 方向键 → 玩家
  let ax=0, ay=0;
  if (keys['arrowup']) ay -= 1;
  if (keys['arrowdown']) ay += 1;
  if (keys['arrowleft']) ax -= 1;
  if (keys['arrowright']) ax += 1;
  if (ax || ay){ const l = Math.hypot(ax, ay); arrowInput.dx = ax/l; arrowInput.dy = ay/l; arrowInput.mag = 1; }
  else { arrowInput.dx = 0; arrowInput.dy = 0; arrowInput.mag = 0; }
}
function distributeInput(dt){
  playerInput.dx = 0; playerInput.dy = 0; playerInput.mag = 0;
  enemyInput.dx = 0; enemyInput.dy = 0; enemyInput.mag = 0;
  if (practiceMode){
    if (stickInput.mag > 0.01){ enemyInput.dx = stickInput.dx; enemyInput.dy = stickInput.dy; enemyInput.mag = stickInput.mag; }
    else if (keyInput.mag > 0.01){ enemyInput.dx = keyInput.dx; enemyInput.dy = keyInput.dy; enemyInput.mag = keyInput.mag; }
    else if (arrowInput.mag > 0.01){ enemyInput.dx = arrowInput.dx; enemyInput.dy = arrowInput.dy; enemyInput.mag = arrowInput.mag; }
    updatePlayerAI(dt);
  } else {
    // 玩家：摇杆优先，其次方向键
    if (stickInput.mag > 0.01){ playerInput.dx = stickInput.dx; playerInput.dy = stickInput.dy; playerInput.mag = stickInput.mag; }
    else if (arrowInput.mag > 0.01){ playerInput.dx = arrowInput.dx; playerInput.dy = arrowInput.dy; playerInput.mag = arrowInput.mag; }
    // 追猎者：自动或 WASD
    if (enemyMode === 'auto'){
      const dx = player.x - enemy.x, dy = player.y - enemy.y;
      const d = Math.hypot(dx, dy) || 1;
      enemyInput.dx = dx/d; enemyInput.dy = dy/d; enemyInput.mag = 1;
    } else {
      if (keyInput.mag > 0.01){ enemyInput.dx = keyInput.dx; enemyInput.dy = keyInput.dy; enemyInput.mag = keyInput.mag; }
    }
  }
}

