/* ========================= I. Entity Updates ============================ */
function concentrationAtPlayer(){
  let sum = 0;
  for (const p of trails){
    const dx = p.x - player.x, dy = p.y - player.y;
    const d2 = dx*dx + dy*dy;
    if (d2 < BOOST_R2){
      if (time - p.born < BOOST_FRESH) continue;
      const d = Math.sqrt(d2);
      const conc = Math.min(1, p.i/1.5);
      sum += conc * (1 - d/BOOST_R);
    }
  }
  return Math.min(1, sum/2.2);
}

function updateSoulLight(dt){
  if (!soulLight.active) return;
  soulLight.phase += dt * 2.2;
  if (soulLight.targetSnail){
    const s = soulLight.targetSnail;
    if (!s || s.connectProgress >= SOUL_LIGHT_MAX || s.hypnotized > 0.5){
      soulLight.targetSnail = null;
      if (s && s.connectProgress >= SOUL_LIGHT_MAX){
        soulLight.active = false;
        return;
      }
    }
  }
  if (soulLight.targetSnail){
    const s = soulLight.targetSnail;
    const dx = s.x - soulLight.x, dy = s.y - soulLight.y;
    const d = Math.hypot(dx, dy);
    const k = 1 - Math.exp(-9 * dt);
    soulLight.x += dx * k;
    soulLight.y += dy * k;
    if (d < 60){
      s.connectProgress = Math.min(SOUL_LIGHT_MAX, s.connectProgress + SOUL_LIGHT_RATE * dt);
    }
  } else {
    let best = null, bestD = 380;
    for (const s of snails){
      if (s.hypnotized > 0.5) continue;
      if (s.connectProgress <= 0.02 || s.connectProgress >= SOUL_LIGHT_MAX) continue;
      const d = Math.hypot(s.x - player.x, s.y - player.y);
      if (d < bestD){ bestD = d; best = s; }
    }
    if (best){ soulLight.targetSnail = best; }
    else {
      const orbitR = 52;
      const tx = player.x + Math.cos(soulLight.phase) * orbitR;
      const ty = player.y + Math.sin(soulLight.phase * 0.85) * orbitR;
      const k = 1 - Math.exp(-6 * dt);
      soulLight.x += (tx - soulLight.x) * k;
      soulLight.y += (ty - soulLight.y) * k;
    }
  }
}
function spawnSoulLight(x, y){
  soulLight.active = true;
  soulLight.x = x; soulLight.y = y;
  soulLight.targetSnail = null;
  soulLight.phase = 0;
}

function updatePlayer(dt){
  if (player.charSkillCd > 0) player.charSkillCd -= dt;
  if (player.inertiaBuff > 0 && (player.inertiaBuff -= dt) < 0) player.inertiaBuff = 0;
  if (player.phaseThrough > 0 && (player.phaseThrough -= dt) < 0) player.phaseThrough = 0;
  if (player.weaveActive > 0 && (player.weaveActive -= dt) < 0) player.weaveActive = 0;
  if (player.smokeSlow > 0 && (player.smokeSlow -= dt) < 0) player.smokeSlow = 0;
  if (player.skillLock > 0 && (player.skillLock -= dt) < 0) player.skillLock = 0;
  if (player.vortexActive > 0 && (player.vortexActive -= dt) < 0) player.vortexActive = 0;
  if (player.stunTimer > 0 && (player.stunTimer -= dt) < 0) player.stunTimer = 0;
  if (player.fogTimer > 0 && (player.fogTimer -= dt) < 0) player.fogTimer = 0;
  if (player.blindTimer > 0 && (player.blindTimer -= dt) < 0) player.blindTimer = 0;
  if (player.blindCd > 0) player.blindCd -= dt;
  if (player.mirrorKCd > 0) player.mirrorKCd -= dt;
  if (player.damageReductionTimer > 0){
    player.damageReductionTimer -= dt;
    if (player.damageReductionTimer <= 0){ player.damageReduction = 0; player.damageReductionTimer = 0; }
  }
  if (player.counterWindow > 0) player.counterWindow -= dt;

  const conc = concentrationAtPlayer();
  if (conc > 0.02) wakeTimer += dt;
  else { wakeTimer -= dt*2.5; if (wakeTimer < 0) wakeTimer = 0; }
  const timeFactor = 1 - Math.exp(-wakeTimer*2.2);
  player.boost += (conc*timeFactor - player.boost)*Math.min(1, dt*8);
  if (player.skillBoost > 0){ player.skillBoost -= dt*(SKILL_BOOST/SKILL_BOOST_T); if (player.skillBoost < 0) player.skillBoost = 0; }
  if (player.skillCd > 0) player.skillCd -= dt;

  const weaveOn = player.weaveActive > 0;
  const weaveBoost = weaveOn ? 1.3 : 1.0;
  const weaveHealMul = weaveOn ? 2.0 : 1.0;
  const weaveInertiaMul = weaveOn ? 1.7 : 1.0;
  let snailBoostRaw = 0, snailInertia = 0, snailHeal = 0;
  for (const s of snails){
    if (s.connectProgress <= 0.001 || s.boostActive <= 0.001) continue;
    const w = s.connectProgress * s.boostActive;
    snailBoostRaw += w; snailInertia += w; snailHeal += w;
  }
  snailBoostRaw = Math.min(1, snailBoostRaw) * 0.20 * weaveBoost;
  player.snailBoost += (snailBoostRaw - player.snailBoost)*Math.min(1, dt*5);
  playerSnailInertia = Math.min(SNAIL_INERTIA_MAX*1.8, snailInertia*SNAIL_INERTIA_MAX/2.5*weaveInertiaMul);
  playerSnailHeal = snailHeal*SNAIL_HEAL_MAX/2.5*weaveHealMul;
  if (playerSnailHeal > 0) player.hp = Math.min(player.maxHp, player.hp + playerSnailHeal*dt);
  if (frostSlow > 0 && (frostSlow -= dt) < 0) frostSlow = 0;
  if (playerBurnTimer > 0){ playerBurnTimer -= dt; player.hp -= 12 * dt * enemyDmgMul * (1-player.damageReduction); }
  if (playerFrostTimer > 0) playerFrostTimer -= dt;

  if (shadow.active && shadow.visualR > 1){
    const d = Math.hypot(player.x - shadow.x, player.y - shadow.y);
    if (d < shadow.visualR) playerShadowSlow = Math.min(0.85, playerShadowSlow + dt*3);
    else playerShadowSlow = Math.max(0, playerShadowSlow - dt*2);
  } else playerShadowSlow = Math.max(0, playerShadowSlow - dt*2);

  const char = CHARACTERS[player.charType] || CHARACTERS.su;
  const totalBoost = Math.min(1.9, player.boost + player.skillBoost + player.snailBoost);
  let maxSpd = BASE_MAX*(1 + totalBoost*BOOST_MAX) * char.speedMul;
  let accel = ACCEL*(1 + totalBoost*0.65) * char.speedMul;
  if(player.tideTimer>0){maxSpd*=1.18;accel*=1.18;}
  if(player.gardenSlow>0){maxSpd*=1-player.gardenSlow;accel*=.85;}
  const driftOn = player.driftTimer > 0;
  const stunned = player.stunTimer > 0;
  if (!driftOn && !stunned){
    if (player.phaseThrough > 0){ maxSpd *= 1.40; accel *= 1.35; }
    if (frostSlow > 0){ maxSpd *= 0.45; accel *= 0.7; }
    if (playerFrostTimer > 0){ maxSpd *= 0.55; accel *= 0.8; }
    if (playerShadowSlow > 0){ maxSpd *= (1 - playerShadowSlow*0.7); accel *= (1 - playerShadowSlow*0.5); }
    if (player.smokeSlow > 0){
      const mul = Math.max(0.15, 1 - SMOKE_SLOW * player.smokeStacks);
      maxSpd *= mul;
      accel *= Math.max(0.2, 1 - SMOKE_SLOW * player.smokeStacks * 0.7);
    }
    const dAmt = player.squeeze;
    if (dAmt > 0.02){ maxSpd *= (1 - dAmt*0.94); accel *= (1 - dAmt*0.82); }
  } else if (driftOn){
    if (player.phaseThrough > 0){ maxSpd *= 1.40; accel *= 1.35; }
  }
  if (isOnPlank(player.x, player.y)){
    maxSpd *= 1.35;
    accel *= 1.3;
  }
  if (stunned){ maxSpd *= 0.15; accel *= 0.15; }

  const px = practiceMode ? aiInput.dx : playerInput.dx;
  const py = practiceMode ? aiInput.dy : playerInput.dy;
  const pmag = practiceMode ? aiInput.mag : playerInput.mag;
  if (pmag > 0 && !stunned){
    player.vx += px*pmag*accel*dt;
    player.vy += py*pmag*accel*dt;
  }
  const inertiaBoost = player.inertiaBuff > 0 ? 3.5*(player.inertiaBuff/3.0) : 0;
  const deformFriction = driftOn ? 0 : player.squeeze * 5.5;
  const driftFriction = driftOn ? -3.0 : 0;
  const frictionTotal = FRICTION + playerSnailInertia + deformFriction + inertiaBoost + driftFriction;
  const damp = Math.exp(-frictionTotal*dt);
  player.vx *= damp; player.vy *= damp;
  const spNow = Math.hypot(player.vx, player.vy);
  if (pmag === 0 && spNow < 160 && !driftOn && !stunned){
    const brake = Math.exp(-BRAKE*dt);
    player.vx *= brake; player.vy *= brake;
  }
  const sp = Math.hypot(player.vx, player.vy);
  if (sp > maxSpd){ const k = maxSpd/sp; player.vx *= k; player.vy *= k; }
  if (sp < 2 && pmag === 0 && !driftOn){ player.vx = 0; player.vy = 0; }

  player.x += player.vx*dt; player.y += player.vy*dt;
  constrainCenter(player, PLAYER_HIT_R, true);
  resolveSnailCollision(player, PLAYER_HIT_R);
  updateBlobPhysics(player, PLAYER_R, true, dt);
  const newSq = computeSqueeze(player, PLAYER_R);
  player.squeeze += (newSq - player.squeeze) * Math.min(1, dt*12);

  const M = 80;
  if (player.x < M){ player.x = M; player.vx = Math.abs(player.vx)*0.35; }
  if (player.x > WORLD-M){ player.x = WORLD-M; player.vx = -Math.abs(player.vx)*0.35; }
  if (player.y < M){ player.y = M; player.vy = Math.abs(player.vy)*0.35; }
  if (player.y > WORLD-M){ player.y = WORLD-M; player.vy = -Math.abs(player.vy)*0.35; }
}

function tryHunterSkill(){
  if (enemy.skillTimer > 0 || enemy.dying) return;
  const h = HUNTERS[enemy.hunterType];
  if (!h) return;
  const dx = player.x - enemy.x, dy = player.y - enemy.y;
  const d = Math.hypot(dx, dy) || 1;
  if (enemy.hunterType === 'eclipse'){
    if (enemy.empowered && enemy.empowerTimer > 0){
      enemy.x = enemy.empowerTargetX; enemy.y = enemy.empowerTargetY;
      enemy.empowerTimer = 0;
      const radius = PLAYER_R * 5;
      for (const p of trails){
        const pd = Math.hypot(p.x - player.x, p.y - player.y);
        if (pd < radius){
          p.isPurple = true; p.purpleTimer = 6.0;
          p.vx = (p.x - player.x) * 2.5;
          p.vy = (p.y - player.y) * 2.5;
        }
      }
      for (let i = 0; i < 450; i++){
        const a = Math.random() * Math.PI * 2;
        const dist_ = Math.random() * radius;
        addTrail(player.x + Math.cos(a)*dist_, player.y + Math.sin(a)*dist_,
                 0.25 + Math.random()*0.25, Math.cos(a)*200, Math.sin(a)*200, true, false, true);
      }
      enemy.vx += (player.x - enemy.x) * 0.5;
      enemy.vy += (player.y - enemy.y) * 0.5;
      enemy.eclipseInvulnTimer = 2.0;
    } else {
      enemy.x += (dx/d)*180; enemy.y += (dy/d)*180;
    }
    enemy.empowered = false;
  }
  else if (enemy.hunterType === 'crimson'){
    enemy.dashActive = enemy.empowered ? 1.4 : 0.7;
    if (enemy.empowered) triggerSpread(enemy.x, enemy.y, 200, 'burn');
    enemy.empowered = false;
  }
  else if (enemy.hunterType === 'pale'){
    if (d < 340) frostSlow = 2.0;
    if (enemy.empowered) triggerSpread(enemy.x, enemy.y, 200, 'frost');
    enemy.empowered = false;
  }
  else if (enemy.hunterType === 'smoke') useSmokeSkill();
  else if (enemy.hunterType === 'arachne'){
    const count = enemy.empowered ? MAX_SPIDERLINGS : 1;
    summonSpiderlings(count);
    enemy.empowered = false;
  }
  if (h.skill.cd > 0) enemy.skillTimer = h.skill.cd;
}
function updateHunterSkill(dt){
  if (enemy.dying) return;
  if (enemy.stunTimer > 0) return;
  const h = HUNTERS[enemy.hunterType];
  if (!h) return;
  if (enemy.dashActive > 0) enemy.dashActive -= dt*1.4;
  if (enemy.empowerCd > 0) enemy.empowerCd -= dt;
  if (enemy.eclipseInvulnTimer > 0) enemy.eclipseInvulnTimer -= dt;

  // 蛛：V 冷却期间按 V 轻拉召唤物
  if (enemy.hunterType === 'arachne' && spiderlings.length > 0 && enemy.skillTimer > 0){
    const vEdge2 = keys['v'] && !prevVKey;
    if (vEdge2){
      for (const sp of spiderlings){
        const dx = enemy.x - sp.x, dy = enemy.y - sp.y;
        const d = Math.hypot(dx, dy) || 1;
        sp.vx += (dx/d) * ARACHNE_V_PULL_IMPULSE;
        sp.vy += (dy/d) * ARACHNE_V_PULL_IMPULSE;
        sp.pulledTimer = 0.3;
      }
    }
  }

  if (enemy.empowerTimer > 0){
    enemy.empowerTimer -= dt;
    if (enemy.empowerTimer <= 0 && enemy.empowered){
      enemy.x = enemy.empowerTargetX; enemy.y = enemy.empowerTargetY;
      enemy.empowered = false;
      const radius = PLAYER_R * 5;
      for (const p of trails){
        const pd = Math.hypot(p.x - player.x, p.y - player.y);
        if (pd < radius){
          p.isPurple = true; p.purpleTimer = 6.0;
          p.vx = (p.x - player.x) * 2.5;
          p.vy = (p.y - player.y) * 2.5;
        }
      }
      for (let i = 0; i < 450; i++){
        const a = Math.random() * Math.PI * 2;
        const dist_ = Math.random() * radius;
        addTrail(player.x + Math.cos(a)*dist_, player.y + Math.sin(a)*dist_,
                 0.25 + Math.random()*0.25, Math.cos(a)*200, Math.sin(a)*200, true, false, true);
      }
      enemy.eclipseInvulnTimer = 2.0;
    }
  }
  if (enemy.hunterType === 'smoke'){
    if (enemy.smokeCharges < HUNTERS.smoke.skill.maxCharges){
      enemy.smokeChargeTimer += dt;
      if (enemy.smokeChargeTimer >= HUNTERS.smoke.skill.charge){
        enemy.smokeChargeTimer -= HUNTERS.smoke.skill.charge;
        enemy.smokeCharges = Math.min(HUNTERS.smoke.skill.maxCharges, enemy.smokeCharges + 1);
      }
    }
  }
  let cdMult = 1;
  if (shadow.active && shadow.visualR > 1){
    const d = Math.hypot(enemy.x - shadow.x, enemy.y - shadow.y);
    if (d < shadow.visualR) cdMult = 3.5;
  }
  enemy.skillTimer -= dt * cdMult;
  if (enemy.hunterType === 'smoke'){
    const vEdge = keys['v'] && !prevVKey;
    const autoFire=false;
    if ((vEdge || autoFire) && enemy.smokeCharges > 0 && !enemy.dying){useSmokeSkill();if(autoFire)enemy.skillTimer=2.4;}
  } else if (!practiceMode && enemyMode === 'manual'){
    if (keys['v'] && enemy.skillTimer <= 0) tryHunterSkill();
  } else if (practiceMode){
    if (keys['v'] && enemy.skillTimer <= 0) tryHunterSkill();
  }
}
function respawnEnemy(){
  let nx=0, ny=0, ok=false, tries=0;
  while (!ok && tries++ < 80){
    const a = Math.random()*Math.PI*2;
    const d = 900 + Math.random()*600;
    nx = Math.max(160, Math.min(WORLD-160, player.x + Math.cos(a)*d));
    ny = Math.max(160, Math.min(WORLD-160, player.y + Math.sin(a)*d));
    ok = true;
    for (const ob of obstacles) if (Math.hypot(nx-ob.x, ny-ob.y) < ob.r + ENEMY_SIZE + 40){ ok=false; break; }
  }
  enemy.x = nx; enemy.y = ny; enemy.vx = 0; enemy.vy = 0;
  enemy.hp = ENEMY_HP; enemy.maxHp = ENEMY_HP;
  enemy.slowFactor = 0; enemy.slowFromSnail = 0;
  enemy.hitFlash = 0; enemy.dying = false; enemy.deathTimer = 0;
  enemy.skillTimer = HUNTERS[enemy.hunterType].skill.cd;
  enemy.dashActive = 0;
  enemy.driftTimer = 0; enemy.driftCd = 0;
  enemy.empowerCd = 0; enemy.empowered = false; enemy.empowerTimer = 0;
  enemy.eclipseInvulnTimer = 0;
  enemy.huntProgress = 0;
  enemy.smokeCharges = HUNTERS.smoke.skill.maxCharges; enemy.smokeChargeTimer = 0;
  enemy.stunTimer = 0;
  resetBlob(enemy, ENEMY_SIZE);
}
function updateEnemy(dt){
  if (enemy.hitFlash > 0) enemy.hitFlash -= dt*3;
  if (enemy.dying){ enemy.deathTimer += dt; if (enemy.deathTimer > 2.4) respawnEnemy(); return; }
  if (enemy.stunTimer > 0) enemy.stunTimer -= dt;
  if (enemy.driftTimer > 0) enemy.driftTimer -= dt;
  if (enemy.driftCd > 0) enemy.driftCd -= dt;
  const driftOn = enemy.driftTimer > 0;
  updateHunterSkill(dt);

  let trailSum = 0;
  for (const p of trails){
    const dx = p.x - enemy.x, dy = p.y - enemy.y;
    const d2 = dx*dx + dy*dy;
    if (d2 < ENEMY_R2){
      if (time - p.born < 0.35) continue;
      const d = Math.sqrt(d2);
      trailSum += Math.min(1, p.i/1.2)*(1 - d/ENEMY_R);
    }
  }
  const enemySpdNow = Math.hypot(enemy.vx, enemy.vy);
  const speedRatio = Math.min(1.5, enemySpdNow / ENEMY_MAX);
  const speedFactor = 0.6 + speedRatio * 1.4;
  const conc = Math.min(1, trailSum/1.2) * speedFactor;
  const maxSlow = HUNTERS[enemy.hunterType].maxSlow;
  let targetSlow = driftOn ? 0 : Math.min(0.95, conc * maxSlow * trailResistMul * getBiasFactor());
  if (enemy.hunterType === 'eclipse' && enemy.eclipseInvulnTimer > 0) targetSlow = 0;
  enemy.slowFactor += (targetSlow - enemy.slowFactor)*Math.min(1, dt*3.5);
  if (enemy.huntProgress < 1 && enemy.slowFactor > 0.1)
    enemy.huntProgress = Math.min(1, enemy.huntProgress + enemy.slowFactor * 0.10 * dt);

  let snailSlow = 0;
  for (const s of snails){
    if (s.connectProgress < 0.28) continue;
    const d = Math.hypot(enemy.x - s.x, enemy.y - s.y);
    if (d > SNAIL_SLOW_RANGE) continue;
    const w = s.connectProgress * (1 - d/SNAIL_SLOW_RANGE);
    if (w > snailSlow) snailSlow = w;
  }
  enemy.slowFromSnail += (snailSlow*SNAIL_SLOW_MAX - enemy.slowFromSnail)*Math.min(1, dt*3);

  const totalSlow = driftOn ? 0 : Math.min(0.95, enemy.slowFactor + enemy.slowFromSnail);
  let accel = ENEMY_ACCEL*(1 - totalSlow*0.75) * getBiasFactor();
  let speedMul = 1;
  if (enemy.hunterType === 'crimson' && enemy.dashActive > 0){ speedMul = 2.6; accel *= 1.6; }
  if (driftOn) accel *= 1.35;
  if (isOnPlank(enemy.x, enemy.y)){
    speedMul *= 1.35;
    accel *= 1.3;
  }
  const dAmt = enemy.squeeze;
  const stunned = enemy.stunTimer > 0;
  if (enemyInput.mag > 0 && !stunned){
    enemy.vx += enemyInput.dx * enemyInput.mag * accel * dt;
    enemy.vy += enemyInput.dy * enemyInput.mag * accel * dt;
  }
  const trailFriction = enemy.slowFactor * 2.8;
  const deformFriction = driftOn ? 0 : dAmt * 3.2;
  const damp = Math.exp(-(ENEMY_FRIC + deformFriction + trailFriction)*dt);
  enemy.vx *= damp; enemy.vy *= damp;
  let maxSpd = ENEMY_MAX*(HUNTERS[enemy.hunterType].moveSpd/100)*enemySpeedMul*(1-totalSlow)*speedMul * getBiasFactor();
  if (dAmt > 0.02) maxSpd *= (1 - dAmt*0.78);
  if(enemy.knockbackTimer>0)maxSpd=Math.max(maxSpd,500);
  if (stunned) maxSpd *= 0.15;
  const sp = Math.hypot(enemy.vx, enemy.vy);
  if (sp > maxSpd){ const k = maxSpd/sp; enemy.vx *= k; enemy.vy *= k; }
  if (stunned){ enemy.vx = 0; enemy.vy = 0; }
  enemy.x += enemy.vx*dt; enemy.y += enemy.vy*dt;

  constrainCenter(enemy, ENEMY_HIT_R, false);
  resolveSnailCollision(enemy, ENEMY_HIT_R);
  updateBlobPhysics(enemy, ENEMY_SIZE, false, dt);
  const newSq = computeSqueeze(enemy, ENEMY_SIZE);
  enemy.squeeze += (newSq - enemy.squeeze) * Math.min(1, dt*12);

  const M = 80;
  if (enemy.x < M){ enemy.x = M; enemy.vx = Math.abs(enemy.vx)*0.4; }
  if (enemy.x > WORLD-M){ enemy.x = WORLD-M; enemy.vx = -Math.abs(enemy.vx)*0.4; }
  if (enemy.y < M){ enemy.y = M; enemy.vy = Math.abs(enemy.vy)*0.4; }
  if (enemy.y > WORLD-M){ enemy.y = WORLD-M; enemy.vy = -Math.abs(enemy.vy)*0.4; }

  updateSpiderlings(dt);
}

function updateSpiderlings(dt){
  for (let i = spiderlings.length - 1; i >= 0; i--){
    const sp = spiderlings[i];
    sp.life -= dt;
    sp.hitCd -= dt;
    if (sp.pulledTimer > 0) sp.pulledTimer -= dt;
    if (sp.life <= 0){ spiderlings.splice(i, 1); continue; }
    const dx = player.x - sp.x, dy = player.y - sp.y;
    const d = Math.hypot(dx, dy) || 1;
    sp.vx += (dx/d) * SPIDERLING_ACCEL * dt;
    sp.vy += (dy/d) * SPIDERLING_ACCEL * dt;
    let trailHit = 0;
    for (const p of trails){
      if (p.isPlayerSkill) continue;
      const td = Math.hypot(p.x - sp.x, p.y - sp.y);
      if (td < 50) trailHit += Math.min(1, p.i/1.2) * (1 - td/50);
    }
    if (trailHit > 0){
      const slow = Math.min(0.85, trailHit * 0.7);
      sp.vx *= Math.exp(-slow * dt * 4);
      sp.vy *= Math.exp(-slow * dt * 4);
      sp.hp -= trailHit * 22 * SPIDERLING_TRAIL_MUL * dt;
    }
    if (sp.hp <= 0){
      explosionFlashes.push({ x: sp.x, y: sp.y, time: 0, maxTime: 0.4, color:'180,255,120', radius: 80, ring: false });
      spiderlings.splice(i, 1); continue;
    }
    const damp = Math.exp(-2.0 * dt);
    sp.vx *= damp; sp.vy *= damp;
    const spMul = sp.speedMul || 1;
    const speedCap = (sp.pulledTimer > 0) ? SPIDERLING_SPEED * 2.2 * spMul : SPIDERLING_SPEED * spMul;
    const spd = Math.hypot(sp.vx, sp.vy);
    if (spd > speedCap){ const k = speedCap / spd; sp.vx *= k; sp.vy *= k; }
    sp.x += sp.vx * dt; sp.y += sp.vy * dt;
    const M = 60;
    if (sp.x < M){ sp.x = M; sp.vx = Math.abs(sp.vx)*0.5; }
    if (sp.x > WORLD-M){ sp.x = WORLD-M; sp.vx = -Math.abs(sp.vx)*0.5; }
    if (sp.y < M){ sp.y = M; sp.vy = Math.abs(sp.vy)*0.5; }
    if (sp.y > WORLD-M){ sp.y = WORLD-M; sp.vy = -Math.abs(sp.vy)*0.5; }
    const pd = Math.hypot(player.x - sp.x, player.y - sp.y);
    if (pd < PLAYER_R + SPIDERLING_R && sp.hitCd <= 0){
      sp.hitCd = SPIDERLING_HIT_CD;
      player.hp -= SPIDERLING_DMG * enemyDmgMul * (1-player.damageReduction);
      player.stunTimer = Math.max(player.stunTimer, 0.3);
      player.smokeSlow = Math.max(player.smokeSlow, 0.8);
      explosionFlashes.push({ x: sp.x, y: sp.y, time: 0, maxTime: 0.35, color:'200,255,140', radius: 90, ring: false });
      spiderlings.splice(i, 1);
    }
  }
}

function updateSmokeProjectiles(dt){
  for (let i = smokeProjectiles.length - 1; i >= 0; i--){
    const p = smokeProjectiles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.life -= dt;
    const d = Math.hypot(p.x - player.x, p.y - player.y);
    if (d < p.r + PLAYER_R * 0.6){
      player.smokeStacks = Math.min(SMOKE_MAX_STACK, player.smokeStacks + 1);
      player.smokeSlow = Math.max(player.smokeSlow, 1.4);
      if (player.smokeStacks >= 3) player.skillLock = SMOKE_SKILL_LOCK;
      if (p.empowered) detonateSmoke(p.x, p.y);
      smokeProjectiles.splice(i, 1); continue;
    }
    if (p.life <= 0){
      if (p.empowered) detonateSmoke(p.x, p.y);
      smokeProjectiles.splice(i, 1); continue;
    }
    if (p.empowered){
      let hitObs = false;
      for (const ob of obstacles){
        if (ob.type === 'membrane') continue;
        if (Math.hypot(p.x - ob.x, p.y - ob.y) < ob.r + p.r){ hitObs = true; break; }
      }
      if (hitObs){ detonateSmoke(p.x, p.y); smokeProjectiles.splice(i, 1); continue; }
    } else {
      // 普通弹：撞障碍 50% 触发爆炸，对周围目标造成 1s 电弧伤害
      let hitObs = false;
      for (const ob of obstacles){
        if (ob.type === 'membrane') continue;
        if (Math.hypot(p.x - ob.x, p.y - ob.y) < ob.r + p.r){ hitObs = true; break; }
      }
      if (hitObs){
        if (Math.random() < 0.5){
          const dp = Math.hypot(player.x - p.x, player.y - p.y);
          if (dp < 320){
            const arcDmg = 24 * (1-dp/320) * enemyDmgMul * (1-player.damageReduction); // 有上限的爆炸伤害，避免随机秒杀
            player.hp -= arcDmg;
            player.stunTimer = Math.max(player.stunTimer, 0.12);
          }
          explosionFlashes.push({ x: p.x, y: p.y, time: 0, maxTime: 0.55, color:'200,140,255', radius: 240, ring: true });
        }
        smokeProjectiles.splice(i, 1); continue;
      }
    }
  }
}

function updateShadow(dt){
  if (!shadow.active) return;
  if (shadow.pullCd > 0) shadow.pullCd -= dt;
  if (shadow.spawnFlash > 0) shadow.spawnFlash -= dt*1.8;
  shadow.vx *= Math.exp(-SHADOW_FRIC * dt);
  shadow.vy *= Math.exp(-SHADOW_FRIC * dt);
  // 催眠速度减慢：捕获越多，最大速度越低
  const spdMul = Math.max(0.3, 1 - shadow.captures * 0.15);
  const maxSpd = SHADOW_MAX_SPEED * spdMul;
  const sv = Math.hypot(shadow.vx, shadow.vy);
  if (sv > maxSpd){ const k = maxSpd/sv; shadow.vx *= k; shadow.vy *= k; }
  shadow.x += shadow.vx * dt; shadow.y += shadow.vy * dt;
  shadow.x = clamp(shadow.x, 0, WORLD);
  shadow.y = clamp(shadow.y, 0, WORLD);
  // 每次催眠后变小
  const sizeMul = Math.max(0.35, 1 - shadow.captures * 0.11);
  const targetR = SHADOW_RADIUS * sizeMul;
  shadow.r = targetR;
  shadow.visualR += (targetR - shadow.visualR) * Math.min(1, dt*2);
  // 吸引力变弱
  const attractMul = Math.max(0.3, 1 - shadow.captures * 0.15);
  for (const s of snails){
    const dx = shadow.x - s.x, dy = shadow.y - s.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) continue;
    const attraction = (200 / (1 + d * 0.015)) * attractMul;
    const pull = Math.max(30, attraction) * dt;
    s.x += (dx/d) * pull; s.y += (dy/d) * pull;
    if (d < shadow.visualR * 1.05){
      if (s.hypnotized < 0.5){
        // 祭坛蜗：连接完成后不能被催眠
        if (s.shrine && s.connectProgress >= 0.999) continue;
        s.hypnotized = 1.0;
        s.connectProgress = 0;
        s.vx = 0; s.vy = 0;
        s.attached = false; s.attachOb = null;
        shadow.captures++;
        if (shadow.captures >= SHADOW_MAX_CAPTURES){
          shadow.active = false;
          shadow.disabled = true;
          explosionFlashes.push({ x: shadow.x, y: shadow.y, time: 0, maxTime: 1.2, color:'255,40,120', radius: 300, ring: true });
        }
      }
    }
  }
}

function updateSnails(dt){
  const weaveOn = player.weaveActive > 0;
  const connectRange = SNAIL_CONNECT_RANGE * (weaveOn ? 2.5 : 1);
  const vortexOn = player.vortexActive > 0;

  for (const s of snails){
    s.inVortex = false;

    if (s.floating){
      s.phase += dt * 0.3;
      s.wanderTimer -= dt;
      if (s.wanderTimer <= 0){
        s.wanderTimer = 4 + Math.random()*5;
        s.wanderAngle += (Math.random()-0.5)*Math.PI*1.2;
      }
      const spd = SNAIL_SPEED * 0.65;
      s.vx += (Math.cos(s.wanderAngle)*spd - s.vx)*Math.min(1, dt*0.4);
      s.vy += (Math.sin(s.wanderAngle)*spd - s.vy)*Math.min(1, dt*0.4);
      s.x += s.vx*dt; s.y += s.vy*dt;
      const M = 200;
      if (s.x < M){ s.x = M; s.wanderAngle = Math.PI - s.wanderAngle; }
      if (s.x > WORLD-M){ s.x = WORLD-M; s.wanderAngle = Math.PI - s.wanderAngle; }
      if (s.y < M){ s.y = M; s.wanderAngle = -s.wanderAngle; }
      if (s.y > WORLD-M){ s.y = WORLD-M; s.wanderAngle = -s.wanderAngle; }
      const d = Math.hypot(player.x - s.x, player.y - s.y);
      if (d < connectRange){
        const rate = (1 - d/connectRange)*SNAIL_CONNECT_RATE*(weaveOn ? 1.3 : 1);
        s.connectProgress = Math.min(1, s.connectProgress + rate*dt);
      }
      const target = Math.max(0, 1 - d/connectRange);
      s.boostActive += (target - s.boostActive)*Math.min(1, dt*4);
      if (s.boostActive < 0.001) s.boostActive = 0;
      continue;
    }

    if (s.immovable){
      const d = Math.hypot(player.x - s.x, player.y - s.y);
      if (d < connectRange){
        const rate = (1 - d/connectRange) * SNAIL_CONNECT_RATE * (weaveOn ? 1.3 : 1) * SHRINE_CONNECT_MUL;
        s.connectProgress = Math.min(1, s.connectProgress + rate * dt);
      } else if (s.connectProgress > 0 && s.connectProgress < 0.999){
        s.connectProgress = Math.max(0, s.connectProgress - SNAIL_DECAY_RATE * dt);
      }
      const target = Math.max(0, 1 - d/connectRange);
      s.boostActive += (target - s.boostActive)*Math.min(1, dt*4);
      if (s.boostActive < 0.001) s.boostActive = 0;
      if (s.shrine && !soulLight.active && s.connectProgress >= 0.999){
        spawnSoulLight(s.x, s.y);
        explosionFlashes.push({ x: s.x, y: s.y, time: 0, maxTime: 1.0, color:'255,240,180', radius: 200, ring: true });
      }
      continue;
    }

    if (vortexOn && s.hypnotized <= 0.5){
      const vdx = player.vortexX - s.x, vdy = player.vortexY - s.y;
      const vd = Math.hypot(vdx, vdy);
      if (vd < VORTEX_RADIUS && vd > 0.001){
        s.inVortex = true;
        const pull = VORTEX_PULL * dt;
        s.x += (vdx/vd) * pull; s.y += (vdy/vd) * pull;
        s.attached = false; s.attachOb = null;
      }
    }

    if (s.hypnotized > 0.5){
      s.phase += dt * 0.4; s.bob += dt * 0.6;
      const d = Math.hypot(player.x - s.x, player.y - s.y);
      if (d < connectRange){
        const rate = (1 - d/connectRange)*SNAIL_CONNECT_RATE*(weaveOn ? 1.3 : 1)*SNAIL_HYPNOTIZE_MUL;
        s.connectProgress = Math.min(1, s.connectProgress + rate*dt);
      }
      const target = Math.max(0, 1 - d/connectRange);
      s.boostActive += (target - s.boostActive)*Math.min(1, dt*4);
      if (s.boostActive < 0.001) s.boostActive = 0;
      continue;
    }

    const inWall = (s.wallHomeX !== undefined);
    if (inWall){
      const dToHome = Math.hypot(s.x - s.wallHomeX, s.y - s.wallHomeY);
      if (dToHome > s.wallRadius){
        const dx = s.wallHomeX - s.x, dy = s.wallHomeY - s.y;
        s.vx += (dx/(dToHome||1)) * 100 * dt;
        s.vy += (dy/(dToHome||1)) * 100 * dt;
      }
    }

    if (!s.attached && !s.inVortex){
      s.wanderTimer -= dt;
      if (s.wanderTimer <= 0){ s.wanderTimer = 3 + Math.random()*5; s.wanderAngle += (Math.random()-0.5)*Math.PI*1.2; }
      const spdMul = inWall ? SNAIL_WALL_SLOW : 1.0;
      const tvx = Math.cos(s.wanderAngle)*SNAIL_SPEED*spdMul;
      const tvy = Math.sin(s.wanderAngle)*SNAIL_SPEED*spdMul;
      s.vx += (tvx - s.vx)*Math.min(1, dt*0.5);
      s.vy += (tvy - s.vy)*Math.min(1, dt*0.5);
      s.x += s.vx*dt; s.y += s.vy*dt;
      let nearRock = null, nearD = 1e9;
      for (const ob of obstacles){
        if (ob.type === 'membrane') continue;
        if (inWall && ob.type === 'wall') continue;
        const d = Math.hypot(s.x - ob.x, s.y - ob.y) - ob.r;
        if (d < SNAIL_ATTACH_RANGE && d < nearD){ nearD = d; nearRock = ob; }
      }
      if (nearRock && Math.random() < dt * SNAIL_ATTACH_RATE * (1 - nearD/SNAIL_ATTACH_RANGE)){
        s.attached = true; s.attachOb = nearRock;
        s.attachAngle = Math.atan2(s.y - nearRock.y, s.x - nearRock.x);
        s.attachTimer = 12 + Math.random()*18;
        s.attachDir = Math.random() < 0.5 ? 1 : -1;
      }
    } else if (s.attached && !s.inVortex){
      const ob = s.attachOb;
      if (!ob){ s.attached = false; continue; }
      s.attachTimer -= dt;
      const attachSpeed = (ob.type === 'wall') ? 0.12 : 0.45;
      s.attachAngle += s.attachDir * attachSpeed * dt;
      const targetR = ob.r + SNAIL_RADIUS*0.30;
      const tx = ob.x + Math.cos(s.attachAngle)*targetR;
      const ty = ob.y + Math.sin(s.attachAngle)*targetR;
      const followK = 1 - Math.exp(-6*dt);
      s.x += (tx - s.x)*followK; s.y += (ty - s.y)*followK;
      s.vx *= 0.5; s.vy *= 0.5;
      if (s.attachTimer <= 0 || Math.random() < dt*SNAIL_DETACH_RATE){
        s.attached = false; s.attachOb = null;
        s.wanderAngle = s.attachAngle + s.attachDir*Math.PI/2 + (Math.random()-0.5)*0.6;
        s.wanderTimer = 2 + Math.random()*4;
      }
    }
    for (const ob of obstacles){
      if (ob.type === 'membrane') continue;
      const d = Math.hypot(s.x - ob.x, s.y - ob.y);
      const minD = ob.r + SNAIL_RADIUS*0.5;
      if (d < minD && d > 0.001){
        const nx = (s.x-ob.x)/d, ny = (s.y-ob.y)/d;
        s.x = ob.x + nx*minD; s.y = ob.y + ny*minD;
      }
    }
    const M = 120;
    if (s.x < M){ s.x = M; s.wanderAngle = Math.PI - s.wanderAngle; }
    if (s.x > WORLD-M){ s.x = WORLD-M; s.wanderAngle = Math.PI - s.wanderAngle; }
    if (s.y < M){ s.y = M; s.wanderAngle = -s.wanderAngle; }
    if (s.y > WORLD-M){ s.y = WORLD-M; s.wanderAngle = -s.wanderAngle; }

    const d = Math.hypot(player.x - s.x, player.y - s.y);
    if (d < connectRange){
      const vortexMul = s.inVortex ? 2.0 : 1.0;
      const rate = (1 - d/connectRange)*SNAIL_CONNECT_RATE*(weaveOn ? 1.3 : 1)*vortexMul;
      s.connectProgress = Math.min(1, s.connectProgress + rate*dt);
    } else if (s.connectProgress > 0 && s.connectProgress < 0.999){
      s.connectProgress = Math.max(0, s.connectProgress - SNAIL_DECAY_RATE * dt);
    }
    const target = Math.max(0, 1 - d/connectRange);
    s.boostActive += (target - s.boostActive)*Math.min(1, dt*4);
    if (s.boostActive < 0.001) s.boostActive = 0;

    if (s.shrine && !soulLight.active && s.connectProgress >= 0.999){
      spawnSoulLight(s.x, s.y);
      explosionFlashes.push({ x: s.x, y: s.y, time: 0, maxTime: 1.0, color:'255,240,180', radius: 200, ring: true });
    }
  }
}

