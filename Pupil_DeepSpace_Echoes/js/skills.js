/* ============================== H. Skills =============================== */
function useDriftSkill(){
  if (enemy.hunterType !== 'pale' && enemy.hunterType !== 'eclipse') return;
  if (enemy.dying || gameState !== 'playing') return;
  if (enemy.driftCd > 0 || enemy.driftTimer > 0) return;
  const sp = Math.hypot(enemy.vx, enemy.vy);
  let ux, uy;
  if (sp > 12){ ux = enemy.vx / sp; uy = enemy.vy / sp; }
  else {
    const dx = player.x - enemy.x, dy = player.y - enemy.y;
    const d = Math.hypot(dx, dy) || 1;
    ux = dx / d; uy = dy / d;
  }
  enemy.driftTimer = DRIFT_DURATION;
  enemy.driftCd = enemy.hunterType === 'eclipse' ? HUNTERS.eclipse.extraSkill.cd : HUNTERS.pale.extraSkill.cd;
  enemy.vx += ux * DRIFT_IMPULSE;
  enemy.vy += uy * DRIFT_IMPULSE;
  enemy.slowFactor = 0;
  enemy.slowFromSnail = 0;
}
function useArachnePull(){
  if (enemy.hunterType !== 'arachne') return;
  if (enemy.dying || gameState !== 'playing') return;
  if (enemy.driftCd > 0) return;
  if (spiderlings.length === 0) return;
  enemy.driftCd = HUNTERS.arachne.extraSkill.cd;
  for (const sp of spiderlings){
    const dx = enemy.x - sp.x, dy = enemy.y - sp.y;
    const d = Math.hypot(dx, dy) || 1;
    sp.vx += (dx/d) * SPIDERLING_PULL_IMPULSE;
    sp.vy += (dy/d) * SPIDERLING_PULL_IMPULSE;
    sp.pulledTimer = 0.4;
  }
}
function useEmpowerSkill(){
  if (enemy.dying || gameState !== 'playing') return;
  if (enemy.empowerCd > 0) return;
  enemy.empowerCd = 20.0;
  enemy.empowered = true;
  if (enemy.hunterType === 'eclipse'){
    enemy.empowerTargetX = player.x;
    enemy.empowerTargetY = player.y;
    enemy.empowerTimer = 2.0;
  }
}
function useSmokeSkill(){
  if (enemy.smokeCharges <= 0) return;
  enemy.smokeCharges--;
  const dx = player.x - enemy.x, dy = player.y - enemy.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  smokeProjectiles.push({ x:enemy.x, y:enemy.y, vx:ux*SMOKE_PROJ_SPEED, vy:uy*SMOKE_PROJ_SPEED, r:SMOKE_PROJ_R, life:2.4, empowered:enemy.empowered });
  enemy.empowered = false;
}
function useSkill(){
  if (player.skillCd > 0 || player.skillLock > 0) return;
  player.skillCd = SKILL_CD;
  player.skillBoost = SKILL_BOOST;
  const sp = Math.hypot(player.vx, player.vy);
  let bx, by;
  if (sp > 15){ bx = -player.vx/sp; by = -player.vy/sp; }
  else { const a = Math.random()*Math.PI*2; bx = Math.cos(a); by = Math.sin(a); }
  const baseA = Math.atan2(by, bx);
  for (let i=0; i<68; i++){
    const spread = (Math.random()-0.5)*1.15;
    const a = baseA + spread;
    const dist_ = 6 + Math.random()*46;
    const px = player.x + Math.cos(a)*dist_;
    const py = player.y + Math.sin(a)*dist_;
    const spd = 55 + Math.random()*150;
    addTrail(px, py, 1.6+Math.random()*0.9, Math.cos(a)*spd, Math.sin(a)*spd, true, true);
  }
}
function useKBlind(){
  if (player.charType !== 'wu') return;
  if (player.blindCd > 0 || player.blindTimer > 0) return;
  player.blindTimer = 4.0;
  player.blindCd = 9.0;
  player.blindX = player.x;
  player.blindY = player.y;
}
function useKMirror(){
  if (player.charType !== 'jing') return;
  if (player.mirrorKCd > 0) return;
  player.mirrorKCd = SHIELD_CD;
  player.damageReduction = SHIELD_REDUCTION;
  player.damageReductionTimer = SHIELD_DURATION;
  player.nextCounterEnhanced = true;
}
function useCharSkill(){
  if (player.charSkillCd > 0 || player.skillLock > 0) return;
  const type = player.charType;
  if (type === 'su'){
    if (!player.markerPlaced){
      player.markerX = player.x; player.markerY = player.y;
      player.markerPlaced = true; player.charSkillCd = 0.6;
    } else {
      const dx = player.markerX - player.x, dy = player.markerY - player.y;
      const d = Math.hypot(dx, dy);
      player.x = player.markerX; player.y = player.markerY;
      player.vx = 0; player.vy = 0;
      constrainCenter(player, PLAYER_HIT_R, true);
      resetBlobPositions(player, PLAYER_R);
      player.squeeze = 0;
      player.inertiaBuff = 3.0;
      player.markerPlaced = false;
      player.charSkillCd = CHARACTERS.su.skill.cd + Math.min(18, d / 160);
    }
  } else if (type === 'yin'){
    player.phaseThrough = 2.4;
    player.charSkillCd = CHARACTERS.yin.skill.cd;
  } else if (type === 'zhi'){
    player.weaveActive = 5.5;
    player.charSkillCd = CHARACTERS.zhi.skill.cd;
  } else if (type === 'xuan'){
    player.vortexActive = VORTEX_DURATION;
    player.vortexX = player.x; player.vortexY = player.y;
    player.charSkillCd = CHARACTERS.xuan.skill.cd;
  } else if (type === 'wu'){
    if (player.fogTimer > 0){ player.fogTimer = 0; return; }
    player.fogTimer = 3.0;
    player.charSkillCd = CHARACTERS.wu.skill.cd;
  } else if (type === 'jing'){
    const win = player.nextCounterEnhanced ? COUNTER_ENHANCED_WINDOW : COUNTER_BASE_WINDOW;
    player.counterWindow = win;
    player.nextCounterEnhanced = false;
    player.charSkillCd = COUNTER_CD;
  }
}
function spawnShadowAt(x, y){
  shadow.active = true;
  shadow.x = x; shadow.y = y;
  shadow.vx = 0; shadow.vy = 0;
  shadow.r = SHADOW_RADIUS; shadow.visualR = 0;
  shadow.pullCd = 0; shadow.spawnFlash = 1;
}
function useShadowSkill(){
  if (enemy.dying) return;
  if (shadow.disabled) return;
  if (!shadow.active){
    if (enemy.huntProgress < 1) return;
    if (!shadowPending){ shadowPending = true; shadowPendingTime = time; return; }
    const dEtoP = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (dEtoP < SHADOW_RADIUS) { shadowPending = false; return; }
    enemy.huntProgress = 0;
    spawnShadowAt(enemy.x, enemy.y);
    shadowPending = false;
  } else {
    if (shadow.pullCd > 0) return;
    shadow.pullCd = SHADOW_PULL_CD;
    const dx = enemy.x - shadow.x, dy = enemy.y - shadow.y;
    const d = Math.hypot(dx, dy) || 1;
    // 催眠速度减慢：捕获越多，加速越弱
    const spdMul = Math.max(0.3, 1 - shadow.captures * 0.15);
    shadow.vx += (dx/d) * SHADOW_ACCEL * 1.6 * spdMul;
    shadow.vy += (dy/d) * SHADOW_ACCEL * 1.6 * spdMul;
    shadow.spawnFlash = 0.7;
  }
}
function updateShadowPending(){
  if (!shadowPending) return;
  if (shadow.disabled){ shadowPending = false; return; }
  if (time - shadowPendingTime < SHADOW_PENDING_DELAY) return;
  if (enemy.huntProgress >= 1 && !shadow.active){
    enemy.huntProgress = 0;
    let bestX = enemy.x, bestY = enemy.y, bestScore = -1;
    for (const s of snails){
      let score = 0;
      for (const o of snails){ const d = Math.hypot(s.x-o.x, s.y-o.y); if (d < 500) score += 1 - d/500; }
      if (score > bestScore){ bestScore = score; bestX = s.x; bestY = s.y; }
    }
    spawnShadowAt(bestX, bestY);
  }
  shadowPending = false;
}
function triggerSpread(srcX, srcY, radius, type){
  const affected = [];
  for (const p of trails){
    const d = Math.hypot(p.x - srcX, p.y - srcY);
    if (d < radius) affected.push(p);
  }
  if (affected.length === 0) return;
  const visited = new Set();
  const queue = [...affected];
  const spreadStep = 140;
  const newTrails = [];
  while (queue.length > 0){
    const p = queue.shift();
    if (visited.has(p)) continue;
    visited.add(p);
    let blocked = false;
    for (const q of trails){
      if (q === p) continue;
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < spreadStep){
        if (q.isPlayerSkill) { blocked = true; break; }
        if (!visited.has(q) && !queue.includes(q)) queue.push(q);
      }
    }
    if (blocked) continue;
    const numSparks = type === 'burn' ? 16 : 12;
    for (let i = 0; i < numSparks; i++){
      const a = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 140;
      const dist_ = 4 + Math.random() * 22;
      newTrails.push({
        x: p.x + Math.cos(a) * dist_, y: p.y + Math.sin(a) * dist_,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        i: 0.5 + Math.random() * 0.6, born: time,
        isSpark: true, sparkType: type, life: 1.0 + Math.random() * 1.2
      });
    }
  }
  for (const nt of newTrails){
    trails.push({
      x: nt.x, y: nt.y, i: nt.i, born: nt.born, vx: nt.vx, vy: nt.vy,
      isBurning: type === 'burn', isFrost: type === 'frost',
      isSpark: true, sparkType: type, sparkTimer: nt.life
    });
  }
  if (type === 'burn') for (const p of visited){ p.isBurning = true; p.burnTimer = 6.0; }
  else if (type === 'frost') for (const p of visited){ p.isFrost = true; p.frostTimer = 6.0; }
}
function detonateSmoke(x, y){
  const radius = 220;
  for (const p of trails){
    if (p.isPlayerSkill) continue;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < radius){ p.isBurning = true; p.burnTimer = 6.0; }
  }
  for (let i = 0; i < 80; i++){
    const a = Math.random() * Math.PI * 2;
    const spd = 120 + Math.random() * 260;
    const dist_ = Math.random() * 30;
    trails.push({
      x: x + Math.cos(a) * dist_, y: y + Math.sin(a) * dist_,
      i: 0.7, born: time,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      isBurning: true, isSpark: true,
      sparkType: 'burn', sparkTimer: 1.8
    });
  }
  explosionFlashes.push({ x, y, time: 0, maxTime: 0.9, color:'255,160,60', radius: 280, ring: false });
}
/* 蛛召唤：普通 V → 延长线；E 强化 → 三方向，移速 50% */
function summonSpiderlings(count){
  const empowered = enemy.empowered;
  if (empowered && count > 1){
    // E 强化：3 个方向，每个 50% 移速
    const baseAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
    for (let i = 0; i < count; i++){
      if (spiderlings.length >= MAX_SPIDERLINGS) break;
      const a = baseAngle + (i - 1) * (Math.PI * 2 / 3);
      const d = ENEMY_SIZE + 80;
      const sx = clamp(enemy.x + Math.cos(a) * d, 60, WORLD - 60);
      const sy = clamp(enemy.y + Math.sin(a) * d, 60, WORLD - 60);
      spiderlings.push({
        x: sx, y: sy, vx: 0, vy: 0,
        hp: SPIDERLING_HP, maxHp: SPIDERLING_HP, life: SPIDERLING_LIFE, hitCd: 0,
        pulledTimer: 0, speedMul: 0.5,
        phase: Math.random() * Math.PI * 2,
        legs: Array.from({length: 6}, (_, i) => ({ angle: i/6 * Math.PI*2 + Math.random()*0.3, len: 14 + Math.random()*4 }))
      });
    }
  } else {
    for (let i = 0; i < count; i++){
      if (spiderlings.length >= MAX_SPIDERLINGS) break;
      let sx = 2 * player.x - enemy.x + (Math.random() - 0.5) * 24;
      let sy = 2 * player.y - enemy.y + (Math.random() - 0.5) * 24;
      sx = clamp(sx, 60, WORLD - 60);
      sy = clamp(sy, 60, WORLD - 60);
      spiderlings.push({
        x: sx, y: sy, vx: 0, vy: 0,
        hp: SPIDERLING_HP, maxHp: SPIDERLING_HP, life: SPIDERLING_LIFE, hitCd: 0,
        pulledTimer: 0, speedMul: 1,
        phase: Math.random() * Math.PI * 2,
        legs: Array.from({length: 6}, (_, i) => ({ angle: i/6 * Math.PI*2 + Math.random()*0.3, len: 14 + Math.random()*4 }))
      });
    }
  }
}

