/* =========================== L. Sprite Textures ========================= */
function makeSprite(r,g,b){
  const S=64;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
  gr.addColorStop(0.00, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(0.22, `rgba(${r},${g},${b},0.55)`);
  gr.addColorStop(0.55, `rgba(${r},${g},${b},0.16)`);
  gr.addColorStop(1.00, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0,0,S,S);
  return c;
}
const SPR_TRAIL_DEEP = makeSprite(26,64,220);
const SPR_TRAIL_CORE = makeSprite(120,210,255);

function createCoreTexture(){
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const cx = S/2, cy = S/2;
  g.globalCompositeOperation = 'lighter';
  for (let arm=0; arm<5; arm++){
    const a0 = arm/5 * Math.PI*2;
    g.beginPath();
    for (let t=0; t<=1.001; t+=0.02){
      const a = a0 + t*3.9;
      const r = t*S*0.47;
      const x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r;
      if (t===0) g.moveTo(x,y); else g.lineTo(x,y);
    }
    g.strokeStyle = 'rgba(50,130,255,0.22)'; g.lineWidth = 7; g.stroke();
    g.strokeStyle = 'rgba(140,215,255,0.32)'; g.lineWidth = 2.4; g.stroke();
  }
  for (let i=0; i<240; i++){
    const a = Math.random()*Math.PI*2;
    const r = Math.pow(Math.random(),0.65) * S * 0.47;
    const x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r;
    const br = Math.random();
    g.fillStyle = `rgba(${110+br*110|0}, ${185+br*70|0}, 255, ${br*0.55})`;
    g.beginPath(); g.arc(x,y,0.5+Math.random()*1.9, 0, Math.PI*2); g.fill();
  }
  return c;
}
const CORE_TEX = createCoreTexture();

function createShadowTexture(){
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const cx = S/2, cy = S/2, R = S/2;
  let gr = g.createRadialGradient(cx, cy, R*0.55, cx, cy, R);
  gr.addColorStop(0.00, 'rgba(60,0,20,0.9)');
  gr.addColorStop(0.55, 'rgba(40,0,15,0.5)');
  gr.addColorStop(1.00, 'rgba(20,0,8,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI*2); g.fill();
  gr = g.createRadialGradient(cx, cy, R*0.35, cx, cy, R*0.65);
  gr.addColorStop(0.00, 'rgba(20,0,8,0.95)');
  gr.addColorStop(0.45, 'rgba(120,20,60,0.55)');
  gr.addColorStop(0.78, 'rgba(180,30,90,0.30)');
  gr.addColorStop(1.00, 'rgba(60,0,20,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R*0.72, 0, Math.PI*2); g.fill();
  gr = g.createRadialGradient(cx, cy, 0, cx, cy, R*0.45);
  gr.addColorStop(0.00, 'rgba(0,0,0,1)');
  gr.addColorStop(0.72, 'rgba(0,0,0,0.98)');
  gr.addColorStop(1.00, 'rgba(20,0,10,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R*0.48, 0, Math.PI*2); g.fill();
  return c;
}
const SHADOW_TEX = createShadowTexture();

const eye = { lookX:0, lookY:0, lookTX:0, lookTY:0, lookTimer:0 };
const bolts = [];
let boltTimer = 0;
function makeBolt(){
  const a0 = Math.random()*Math.PI*2;
  const dir = Math.random()<0.5 ? 1 : -1;
  const a1 = a0 + dir*(Math.PI*0.35 + Math.random()*Math.PI*0.55);
  const r0 = 0.06 + Math.random()*0.48;
  const r1 = 0.06 + Math.random()*0.48;
  const x0 = Math.cos(a0)*r0, y0 = Math.sin(a0)*r0;
  const x1 = Math.cos(a1)*r1, y1 = Math.sin(a1)*r1;
  const steps = 8 + Math.floor(Math.random()*8);
  const pts = [];
  const dx = x1-x0, dy = y1-y0;
  const len = Math.hypot(dx,dy) || 1;
  const px = -dy/len, py = dx/len;
  for (let i=0; i<=steps; i++){
    const t = i/steps;
    const off = (Math.random()-0.5)*0.42*Math.sin(t*Math.PI);
    pts.push([x0+dx*t+px*off, y0+dy*t+py*off]);
  }
  return { pts, life:0, maxLife:0.10+Math.random()*0.22, intensity:0.55+Math.random()*0.45 };
}
function updateBolts(dt){
  for (let i=bolts.length-1; i>=0; i--){
    bolts[i].life += dt;
    if (bolts[i].life > bolts[i].maxLife) bolts.splice(i,1);
  }
  boltTimer -= dt;
  if (boltTimer <= 0 && bolts.length < 3){
    boltTimer = 0.05 + Math.random()*0.18;
    bolts.push(makeBolt());
    if (Math.random() < 0.35) bolts.push(makeBolt());
  }
}
function updateEye(dt){
  eye.lookTimer -= dt;
  if (eye.lookTimer <= 0){
    eye.lookTimer = 0.7 + Math.random()*1.8;
    if (Math.random() < 0.62){
      const a = Math.random()*Math.PI*2, d = 0.12 + Math.random()*0.17;
      eye.lookTX = Math.cos(a)*d; eye.lookTY = Math.sin(a)*d;
    } else { eye.lookTX = 0; eye.lookTY = 0; }
  }
  const k = 1 - Math.exp(-5.5*dt);
  eye.lookX += (eye.lookTX - eye.lookX)*k;
  eye.lookY += (eye.lookTY - eye.lookY)*k;
  updateBolts(dt);
}

const STAR_WRAP = 2200, NEB_WRAP = 2400;
const stars = [];
for (let i=0; i<380; i++)
  stars.push({ x:Math.random()*STAR_WRAP, y:Math.random()*STAR_WRAP, r:Math.random()*1.5+0.3, a:Math.random()*0.45+0.12, p:Math.random()*Math.PI*2 });
const nebulas = [];
for (let i=0; i<5; i++)
  nebulas.push({ x:Math.random()*NEB_WRAP, y:Math.random()*NEB_WRAP, r:480+Math.random()*580, col:'95,70,200', a:0.05+Math.random()*0.05 });

function makeSnailData(x, y, extra){
  const holes = [];
  for (let i=0; i<7; i++){
    const a = Math.random()*Math.PI*2, r = Math.random()*SNAIL_RADIUS*0.62;
    holes.push({ x:Math.cos(a)*r, y:Math.sin(a)*r, r:2.4+Math.random()*4.8, phase:Math.random()*Math.PI*2 });
  }
  return Object.assign({
    x, y, vx:0, vy:0,
    phase:Math.random()*Math.PI*2, bob:Math.random()*Math.PI*2,
    wanderAngle:Math.random()*Math.PI*2, wanderTimer:Math.random()*5,
    connectProgress:0, boostActive:0, holes,
    attached:false, attachOb:null, attachAngle:0, attachTimer:0,
    attachDir:Math.random()<0.5?1:-1, hypnotized:0, inVortex:false,
    shrine: false,
    immovable: false,
    wallHomeX: undefined, wallHomeY: undefined, wallRadius: 0,
    floating: false
  }, extra || {});
}
function generateSnails(refX, refY, eS){
  snails.length = 0;
  for (const sp of buildingSnailSpots){
    snails.push(makeSnailData(sp.x, sp.y, {
      shrine: !!sp.shrine,
      immovable: !!sp.immovable,
      wallHomeX: sp.wallHomeX,
      wallHomeY: sp.wallHomeY,
      wallRadius: sp.wallRadius || 0,
      attached: false
    }));
  }
  const nearCount = 1 + Math.floor(Math.random() * 2);
  let placedNear = 0, tries = 0;
  while (placedNear < nearCount && tries < 800){
    tries++;
    const a = Math.random()*Math.PI*2, d = 380 + Math.random()*300;
    const x = refX + Math.cos(a)*d, y = refY + Math.sin(a)*d;
    if (x < 220 || x > WORLD-220 || y < 220 || y > WORLD-220) continue;
    if (Math.hypot(x-eS.x, y-eS.y) < 520) continue;
    let ok = true;
    for (const o of obstacles) if (Math.hypot(x-o.x, y-o.y) < o.r + SNAIL_RADIUS + 28){ ok=false; break; }
    if (!ok) continue;
    for (const s of snails) if (Math.hypot(x-s.x, y-s.y) < 300){ ok=false; break; }
    if (!ok) continue;
    snails.push(makeSnailData(x, y)); placedNear++;
  }
  tries = 0;
  while (snails.length < SNAIL_COUNT && tries < 24000){
    tries++;
    const x = 260 + Math.random()*(WORLD-520), y = 260 + Math.random()*(WORLD-520);
    if (Math.hypot(x-refX, y-refY) < 300) continue;
    if (Math.hypot(x-eS.x, y-eS.y) < 400) continue;
    let ok = true;
    for (const o of obstacles) if (Math.hypot(x-o.x, y-o.y) < o.r + SNAIL_RADIUS + 28){ ok=false; break; }
    if (!ok) continue;
    for (const s of snails) if (Math.hypot(x-s.x, y-s.y) < 320){ ok=false; break; }
    if (!ok) continue;
    snails.push(makeSnailData(x, y));
  }
  for (const s of snails){
    if (s.shrine || s.immovable || s.floating) continue;
    if (s.wallHomeX !== undefined) continue;
    let bestOb = null, bestD = 1e9;
    for (const ob of obstacles){
      if (ob.type === 'membrane') continue;
      const d = Math.hypot(s.x-ob.x, s.y-ob.y) - ob.r;
      if (d < bestD){ bestD = d; bestOb = ob; }
    }
    if (bestOb && bestD < SNAIL_ATTACH_RANGE*1.5 && Math.random() < 0.78){
      s.attached = true; s.attachOb = bestOb;
      s.attachAngle = Math.atan2(s.y - bestOb.y, s.x - bestOb.x);
      s.attachTimer = 12 + Math.random()*18;
    }
  }
  if (currentMapDef && currentMapDef.night){
    const fx = 400 + Math.random()*(WORLD-800);
    const fy = 400 + Math.random()*(WORLD-800);
    snails.push(makeSnailData(fx, fy, { floating: true }));
  }
}

/* ============================ Start Game ================================ */
function startGame(){
  initMapData();
  const side = Math.floor(Math.random() * 4);
  const M = 180;
  let px, py, ex, ey;
  if (side === 0){ px = M + Math.random()*(WORLD-2*M); py = M; ex = WORLD - px; ey = WORLD - M; }
  else if (side === 2){ px = M + Math.random()*(WORLD-2*M); py = WORLD - M; ex = WORLD - px; ey = M; }
  else if (side === 1){ px = WORLD - M; py = M + Math.random()*(WORLD-2*M); ex = M; ey = WORLD - py; }
  else { px = M; py = M + Math.random()*(WORLD-2*M); ex = WORLD - M; ey = WORLD - py; }

  Object.assign(player, {
    x:px, y:py, vx:0, vy:0, boost:0, skillBoost:0, skillCd:0,
    snailBoost:0, hp:PLAYER_MAX_HP, charType:selectedChar, charSkillCd:0,
    inertiaBuff:0, phaseThrough:0, weaveActive:0,
    markerPlaced:false, markerX:0, markerY:0, yinTrailTimer:0,
    driftTimer:0, driftCd:0, smokeStacks:0, smokeSlow:0, skillLock:0,
    vortexActive:0, vortexX:0, vortexY:0, stunTimer:0,
    fogTimer:0, blindTimer:0, blindCd:0, blindX:0, blindY:0,
    counterWindow:0, mirrorKCd:0, damageReduction:0, damageReductionTimer:0,
    nextCounterEnhanced:false, squeeze:0
  });
  resetBlob(player, PLAYER_R);

  Object.assign(enemy, {
    x:ex, y:ey, vx:0, vy:0, hp:ENEMY_HP, maxHp:ENEMY_HP,
    slowFactor:0, slowFromSnail:0, hitFlash:0, dying:false, deathTimer:0,
    hunterType:selectedHunter, skillTimer:HUNTERS[selectedHunter].skill.cd,
    dashActive:0, driftTimer:0, driftCd:0,
    empowerCd:0, empowered:false, empowerTimer:0, eclipseInvulnTimer:0,
    huntProgress:0, smokeCharges:HUNTERS.smoke.skill.maxCharges, smokeChargeTimer:0,
    stunTimer:0, squeeze:0
  });
  resetBlob(enemy, ENEMY_SIZE);

  Object.assign(shadow, { active:false, disabled:false, captures:0, vx:0, vy:0, visualR:0, pullCd:0, spawnFlash:0 });
  Object.assign(soulLight, { active:false, x:0, y:0, targetSnail:null, phase:0 });
  shadowPending = false;
  smokeProjectiles.length = 0;
  spiderlings.length = 0;
  explosionFlashes.length = 0;
  trails.length = 0;
  lastSpawn.x = player.x; lastSpawn.y = player.y;
  wakeTimer = 0; idleSpawnTimer = 0; attackIntensity = 0;
  playerSnailInertia = 0; playerSnailHeal = 0;
  frostSlow = 0; playerShadowSlow = 0;
  playerBurnTimer = 0; playerFrostTimer = 0;
  aiStuckTimer = 0; aiUnstuckTime = 0;
  prevVKey = false; prevBKey = false; prevInAttackRange = false;

  generateSnails(player.x, player.y, { x: enemy.x, y: enemy.y });

  cam.cx = (player.x + enemy.x)/2;
  cam.cy = (player.y + enemy.y)/2;
  cam.zoom = 0.25;
  deathTimer = 0; winTimer = 0; hintAlpha = 1;
  introTimer = 0;
  gameState = 'intro';

  panel.classList.add('collapsed');
  panelToggle.classList.remove('hidden');
  setPanelVisible(true);
  document.getElementById('pauseBtn').classList.remove('hidden');
}

function addTrail(x, y, amount, vx, vy, noMerge, isPlayerSkill, isPurple){
  if (!noMerge){
    let best = null, bestD = MERGE_R2;
    for (const p of trails){
      const dx = p.x-x, dy = p.y-y;
      const d2 = dx*dx + dy*dy;
      if (d2 < bestD){ bestD = d2; best = p; }
    }
    if (best){ best.i = Math.min(TRAIL_MAX_I, best.i + amount*0.55); return; }
  }
  trails.push({ x, y, i:amount, born:time, vx:vx||0, vy:vy||0, isPlayerSkill: !!isPlayerSkill, isBurning:false, isFrost:false, isPurple: !!isPurple });
  if (trails.length > 2600) trails.splice(0, 240);
}
function spawnTrails(dt){
  const sp = Math.hypot(player.vx, player.vy);
  if (sp < 20){
    idleSpawnTimer += dt;
    const INTERVAL = 0.12;
    let guard = 0;
    while (idleSpawnTimer > INTERVAL && guard++ < 4){
      idleSpawnTimer -= INTERVAL;
      const a = Math.random()*Math.PI*2, rad = Math.random()*12;
      addTrail(player.x+Math.cos(a)*rad, player.y+Math.sin(a)*rad, 0.45);
    }
    lastSpawn.x = player.x; lastSpawn.y = player.y;
    return;
  }
  idleSpawnTimer = 0;
  let dx = player.x - lastSpawn.x, dy = player.y - lastSpawn.y;
  let d = Math.hypot(dx, dy);
  let guard = 0;
  while (d >= TRAIL_STEP && guard++ < 80){
    const t = TRAIL_STEP/d;
    lastSpawn.x += dx*t; lastSpawn.y += dy*t;
    addTrail(lastSpawn.x, lastSpawn.y, 0.55);
    dx = player.x - lastSpawn.x; dy = player.y - lastSpawn.y;
    d = Math.hypot(dx, dy);
  }
}
function spawnYinTrails(dt){
  if (player.charType !== 'yin') return;
  const sp = Math.hypot(player.vx, player.vy);
  if (sp < 40) return;
  player.yinTrailTimer -= dt;
  if (player.yinTrailTimer > 0) return;
  player.yinTrailTimer = 0.035;
  const ux = player.vx/sp, uy = player.vy/sp;
  const baseA = Math.atan2(-uy, -ux);
  for (let i = 0; i < 3; i++){
    const spread = (Math.random() - 0.5)*0.85;
    const a = baseA + spread;
    const d = 8 + Math.random()*34;
    const spd = 70 + Math.random()*130;
    addTrail(player.x + Math.cos(a)*d, player.y + Math.sin(a)*d,
             1.1+Math.random()*0.7, Math.cos(a)*spd, Math.sin(a)*spd, true);
  }
}
function decayTrails(dt){
  let w = 0;
  for (const p of trails){
    p.i -= TRAIL_DECAY*dt;
    if (p.vx || p.vy){
      p.x += p.vx*dt; p.y += p.vy*dt;
      const damp = Math.exp(-1.15*dt);
      p.vx *= damp; p.vy *= damp;
      if (Math.abs(p.vx) < 1) p.vx = 0;
      if (Math.abs(p.vy) < 1) p.vy = 0;
    }
    if (p.isBurning){ p.burnTimer -= dt; if (p.burnTimer <= 0) p.isBurning = false; }
    if (p.isFrost){ p.frostTimer -= dt; if (p.frostTimer <= 0) p.isFrost = false; }
    if (p.isPurple){ p.purpleTimer -= dt; if (p.purpleTimer <= 0) p.isPurple = false; }
    if (p.isSpark){ p.sparkTimer -= dt; if (p.sparkTimer <= 0) p.i = 0; }
    if (p.i > 0.002) trails[w++] = p;
  }
  trails.length = w;
}

