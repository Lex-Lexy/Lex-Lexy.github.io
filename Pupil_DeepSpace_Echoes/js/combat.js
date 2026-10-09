/* ============================== J. Combat =============================== */
function updateAttack(dt){
  attackIntensity = 0;
  if (enemy.dying || gameState !== 'playing'){ prevInAttackRange = false; return; }
  if (enemy.stunTimer > 0){ prevInAttackRange = false; return; }
  const dx = enemy.x - player.x, dy = enemy.y - player.y;
  const d = Math.hypot(dx, dy);
  // 与 enemyDamageToPlayer 完全一致：追猎者自身 atkRange × 全局范围倍率 × 难度偏差
  const h = HUNTERS[enemy.hunterType];
  const range = h.atkRange * enemyRangeMul * getBiasFactor();
  const inRange = d <= range;
  const justEntered = inRange && !prevInAttackRange;
  prevInAttackRange = inRange;
  if (!inRange || range <= 0) return;
  attackIntensity = 0.25 + (1 - d/range)*0.75;

  if (justEntered && player.counterWindow > 0 && player.charType === 'jing'){
    enemy.stunTimer = 2.2;
    enemy.vx = 0; enemy.vy = 0;
    player.counterWindow = 0;
    explosionFlashes.push({ x: player.x, y: player.y, time: 0, maxTime: 0.6, color:'255,220,180', radius: 200, ring: true });
    explosionFlashes.push({ x: enemy.x, y: enemy.y, time: 0, maxTime: 0.6, color:'255,180,220', radius: 150, ring: true });
  }

  const baseMul = 1.0;
  const smokeBonus = 1; // 烟层增伤属于追猎者对行者的攻击
  const dps = DMG_K/(d+25) * baseMul * smokeBonus;
  enemy.hp -= dps*dt;
  enemy.hitFlash = Math.min(1, enemy.hitFlash + dt*6);
  if (enemy.hp <= 0){ enemy.hp = 0; enemy.dying = true; enemy.deathTimer = 0; }
}
function enemyDamageToPlayer(dt){
  if (gameState !== 'playing' || enemy.dying) return;
  if (enemy.stunTimer > 0) return;
  const d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
  const h = HUNTERS[enemy.hunterType];
  const atkRange = h.atkRange * enemyRangeMul * getBiasFactor();
  if (d > atkRange || atkRange <= 0) return;
  const scale = 1.15 - 0.30*Math.min(1, d/atkRange);
  const smokeBonus = 1 + player.smokeStacks * SMOKE_DMG_BOOST;
  const dmg = ENEMY_ATK_BASE * scale * h.baseDmgMul * smokeBonus * enemyDmgMul * getBiasFactor() * dt * (1 - player.damageReduction);
  player.hp -= dmg;
  if (enemy.huntProgress < 1) enemy.huntProgress = Math.min(1, enemy.huntProgress + dmg * 0.008);
}
function checkPlayerDeath(){
  if (gameState !== 'playing') return;
  if (player.hp <= 0){
    player.hp = 0; gameState = 'dead'; deathTimer = 0;
    setPanelVisible(false);
    document.getElementById('pauseBtn').classList.add('hidden');
  }
}
function checkWin(){
  if(gameState!=='playing')return;
  let connected = 0;
  for (const s of snails) if (s.connectProgress >= 0.999 && s.hypnotized <= 0.5) connected++;
  if (connected >= WIN_COUNT){
    gameState = 'win'; winTimer = 0;
    setPanelVisible(false);
    document.getElementById('pauseBtn').classList.add('hidden');
  }
}
function updateFlashes(dt){
  for (let i=explosionFlashes.length-1; i>=0; i--){
    explosionFlashes[i].time += dt;
    if (explosionFlashes[i].time > explosionFlashes[i].maxTime) explosionFlashes.splice(i,1);
  }
}

let aiStuckTimer = 0, aiUnstuckTime = 0, aiUnstuckX = 0, aiUnstuckY = 0;
function updatePlayerAI(dt){
  aiTrySkills(dt);
  if (aiUnstuckTime > 0){
    aiUnstuckTime -= dt;
    aiInput.dx = aiUnstuckX; aiInput.dy = aiUnstuckY; aiInput.mag = 1;
    return;
  }
  let targetX = null, targetY = null, bestScore = -Infinity;
  for (const s of snails){
    if (s.connectProgress >= 0.999 || s.hypnotized > 0.5) continue;
    const d = Math.hypot(s.x - player.x, s.y - player.y);
    const score = -d + s.connectProgress * 400;
    if (score > bestScore){ bestScore = score; targetX = s.x; targetY = s.y; }
  }
  if (targetX === null){ targetX = WORLD/2; targetY = WORLD/2; }
  let dirX = 0, dirY = 0;
  const eDist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
  if (eDist < 380){
    const ex = player.x - enemy.x, ey = player.y - enemy.y;
    const el = Math.hypot(ex, ey) || 1;
    const tx = targetX - player.x, ty = targetY - player.y;
    const tl = Math.hypot(tx, ty) || 1;
    dirX = (ex/el)*0.65 + (tx/tl)*0.35;
    dirY = (ey/el)*0.65 + (ty/tl)*0.35;
  } else {
    const tx = targetX - player.x, ty = targetY - player.y;
    const tl = Math.hypot(tx, ty) || 1;
    if (tl > 30){ dirX = tx/tl; dirY = ty/tl; }
  }
  for (const ob of obstacles){
    const dx = player.x - ob.x, dy = player.y - ob.y;
    const d = Math.hypot(dx, dy);
    const influence = ob.r + 100;
    if (d < influence && d > 0.001){
      const force = (influence - d) / influence;
      dirX += (dx/d) * force * 2.0;
      dirY += (dy/d) * force * 2.0;
    }
  }
  const M = 260;
  if (player.x < M) dirX += (M - player.x) / M * 5;
  if (player.x > WORLD - M) dirX -= (player.x - (WORLD - M)) / M * 5;
  if (player.y < M) dirY += (M - player.y) / M * 5;
  if (player.y > WORLD - M) dirY -= (player.y - (WORLD - M)) / M * 5;
  const l = Math.hypot(dirX, dirY);
  if (l > 0.05){ aiInput.dx = dirX/l; aiInput.dy = dirY/l; aiInput.mag = Math.min(1, l); }
  else { aiInput.dx = 0; aiInput.dy = 0; aiInput.mag = 0; }
  const spNow = Math.hypot(player.vx, player.vy);
  if (spNow < 40){
    aiStuckTimer += dt;
    if (aiStuckTimer > 0.9){
      const a = Math.random() * Math.PI * 2;
      aiUnstuckX = Math.cos(a); aiUnstuckY = Math.sin(a);
      aiUnstuckTime = 0.7; aiStuckTimer = 0;
    }
  } else aiStuckTimer = Math.max(0, aiStuckTimer - dt * 2);
}
function aiTrySkills(dt){
  const eDist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
  if (eDist < 260 && player.skillCd <= 0 && player.skillLock <= 0) useSkill();
  if (player.charSkillCd > 0 || player.skillLock > 0) return;
  const char = player.charType;
  if (char === 'su'){
    if (player.markerPlaced && eDist < 320) useCharSkill();
    else if (!player.markerPlaced && eDist > 500) useCharSkill();
  } else if (char === 'yin'){ if (eDist < 300) useCharSkill(); }
  else if (char === 'zhi'){
    let n = 0;
    for (const s of snails) if (Math.hypot(s.x-player.x, s.y-player.y) < SNAIL_CONNECT_RANGE && s.connectProgress < 0.999 && s.hypnotized < 0.5) n++;
    if (n >= 2) useCharSkill();
  } else if (char === 'xuan'){
    let n = 0;
    for (const s of snails) if (Math.hypot(s.x-player.x, s.y-player.y) < VORTEX_RADIUS && s.connectProgress < 0.999 && s.hypnotized < 0.5) n++;
    if (n >= 3) useCharSkill();
  } else if (char === 'wu'){
    if (eDist < 350) useCharSkill();
    if (eDist < 200) useKBlind();
  } else if (char === 'jing'){ if (eDist < 200) useCharSkill(); }
}

