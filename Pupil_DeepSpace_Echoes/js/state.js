/* ========================== D. Global State ============================= */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.floor(W*DPR); canvas.height = Math.floor(H*DPR);
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
resize();
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', ()=>setTimeout(resize,200));

const blurSrc = document.createElement('canvas'), blurSrcCtx = blurSrc.getContext('2d');
const blurTmp = document.createElement('canvas'), blurTmpCtx = blurTmp.getContext('2d');
function ensureBlurCanvas(){
  const w = Math.floor(W), h = Math.floor(H);
  if (blurSrc.width !== w || blurSrc.height !== h){
    blurSrc.width = w; blurSrc.height = h;
    blurTmp.width = w; blurTmp.height = h;
  }
}
const darkCanvas = document.createElement('canvas'), darkCtx = darkCanvas.getContext('2d');
function ensureDarkCanvas(){
  const w = Math.floor(W*DPR), h = Math.floor(H*DPR);
  if (darkCanvas.width !== w || darkCanvas.height !== h){
    darkCanvas.width = w; darkCanvas.height = h;
  }
}

let showTouchButtons = false;
let difficultyBias = 0;
(function loadPrefs(){
  try {
    const v = localStorage.getItem('pupil_touchbtn');
    if (v !== null) showTouchButtons = v === '1';
    const d = localStorage.getItem('pupil_difficulty');
    if (d !== null) difficultyBias = parseFloat(d);
  } catch(_){}
})();
function savePrefs(){
  try {
    localStorage.setItem('pupil_touchbtn', showTouchButtons ? '1' : '0');
    localStorage.setItem('pupil_difficulty', difficultyBias.toString());
  } catch(_){}
}
const getBiasFactor = () => 1.0 + difficultyBias * 0.4;

/* ============================================================
 * 瞳 · 作弊数据加载
 * 由外部 cheat.html 写入 localStorage['pupil_cheat_data']
 * 启动时读取并覆盖 CHARACTERS / HUNTERS / 全局倍率
 * ============================================================ */


/* 同一浏览器下，作弊器改了数据 → 游戏页面自动刷新应用 */
window.addEventListener('storage', e=>{
  if (e.key === 'pupil_cheat_data') location.reload();
});

let gameState = 'menu';
let menuScreen = 'main';
let practiceMode = false;
let deathTimer = 0, winTimer = 0, time = 0, hintAlpha = 1;
let enemySpeedMul = 1.0, enemyDmgMul = 1.0, enemyRangeMul = 1.0, trailResistMul = 1.0;
let enemyMode = 'auto';
let selectedHunter = 'eclipse';
let selectedChar = 'su';
let selectedMapId = 'void';
let currentMapDef = MAP_DEFS.void;
let prevVKey = false, prevBKey = false;
let shadowPending = false, shadowPendingTime = 0;
let introTimer = 0;

const player = {
  x:0, y:0, vx:0, vy:0, boost:0, skillBoost:0, skillCd:0,
  snailBoost:0, hp:PLAYER_MAX_HP, maxHp:PLAYER_MAX_HP,
  blob:null, squeeze:0,
  charType:'su', charSkillCd:0, inertiaBuff:0, phaseThrough:0, weaveActive:0,
  markerX:0, markerY:0, markerPlaced:false, yinTrailTimer:0,
  driftTimer:0, driftCd:0, smokeStacks:0, smokeSlow:0, skillLock:0,
  vortexActive:0, vortexX:0, vortexY:0, stunTimer:0,
  fogTimer:0, blindTimer:0, blindCd:0, blindX:0, blindY:0,
  counterWindow:0, mirrorKCd:0, damageReduction:0, damageReductionTimer:0, nextCounterEnhanced:false
};
const enemy = {
  x:0, y:0, vx:0, vy:0, slowFactor:0, slowFromSnail:0,
  hp:ENEMY_HP, maxHp:ENEMY_HP, hitFlash:0, dying:false, deathTimer:0,
  hunterType:'eclipse', skillTimer:5.0,
  dashActive:0, driftTimer:0, driftCd:0,
  blob:null, squeeze:0, huntProgress:0,
  smokeCharges:SMOKE_CHARGE_MAX, smokeChargeTimer:0,
  stunTimer:0,
  empowerCd:0, empowered:false, empowerTargetX:0, empowerTargetY:0, empowerTimer:0,
  eclipseInvulnTimer:0
};
const shadow = { active:false, disabled:false, captures:0, x:0, y:0, vx:0, vy:0, r:SHADOW_RADIUS, visualR:0, pullCd:0, spawnFlash:0 };
const soulLight = { active:false, x:0, y:0, targetSnail:null, phase:0 };

const cam = { cx:0, cy:0, zoom:1 };
const view = { l:0, r:0, t:0, b:0, w:0, h:0 };
const trails = [];
const lastSpawn = { x:0, y:0 };
let idleSpawnTimer = 0, wakeTimer = 0, attackIntensity = 0;
let playerSnailInertia = 0, playerSnailHeal = 0, frostSlow = 0, playerShadowSlow = 0;
let playerBurnTimer = 0, playerFrostTimer = 0;
const smokeProjectiles = [];
const spiderlings = [];
const explosionFlashes = [];
const stickInput  = { dx:0, dy:0, mag:0 };
const keyInput    = { dx:0, dy:0, mag:0 };   // WASD → 追猎者
const arrowInput  = { dx:0, dy:0, mag:0 };   // 方向键 → 玩家
const playerInput = { dx:0, dy:0, mag:0 };
const enemyInput  = { dx:0, dy:0, mag:0 };
const aiInput     = { dx:0, dy:0, mag:0 };
const keys = {};
const obstacles = [];
const snails = [];
const joystick = { active:false, id:null, baseX:0, baseY:0, knobX:0, knobY:0 };
let prevInAttackRange = false;


(function applyCheatData(){
  try {
    const raw = localStorage.getItem('pupil_cheat_data');
    if (!raw) return;
    const data = JSON.parse(raw);
    let count = 0;

    // ---- 角色 ----
    if (data.characters){
      for (const id in data.characters){
        const c = CHARACTERS[id], src = data.characters[id];
        if (!c || !src) continue;
        if (Number.isFinite(src.speedMul) && src.speedMul >= 0.1 && src.speedMul <= 5){ c.speedMul = src.speedMul; count++; }
        if (Number.isFinite(src.skillCd) && src.skillCd >= 0 && src.skillCd <= 60 && c.skill){ c.skill.cd = src.skillCd; count++; }
      }
      // 「镜」的技能 CD 走全局常量 COUNTER_CD
      if (data.characters.jing && typeof data.characters.jing.skillCd === 'number'){
        try { COUNTER_CD = data.characters.jing.skillCd; count++; } catch(_){}
      }
    }

    // ---- 追猎者 ----
    if (data.hunters){
      for (const id in data.hunters){
        const h = HUNTERS[id], src = data.hunters[id];
        if (!h || !src) continue;
        if (Number.isFinite(src.atkRange) && src.atkRange >= 0 && src.atkRange <= 800){ h.atkRange = src.atkRange; count++; }
        if (Number.isFinite(src.maxSlow) && src.maxSlow >= 0 && src.maxSlow <= 1){ h.maxSlow = src.maxSlow; count++; }
        if (Number.isFinite(src.baseDmgMul) && src.baseDmgMul >= 0 && src.baseDmgMul <= 5){ h.baseDmgMul = src.baseDmgMul; count++; }
        if (Number.isFinite(src.skillCd) && src.skillCd >= 0 && src.skillCd <= 60 && h.skill){ h.skill.cd = src.skillCd; count++; }
        if (Number.isFinite(src.extraCd) && src.extraCd >= 0 && src.extraCd <= 60 && h.extraSkill){ h.extraSkill.cd = src.extraCd; count++; }
        if (Number.isFinite(src.charge) && src.charge >= .1 && src.charge <= 10 && h.skill){ h.skill.charge = src.charge; count++; }
        if (Number.isFinite(src.maxCharges) && src.maxCharges >= 1 && src.maxCharges <= 10 && h.skill){ h.skill.maxCharges = Math.round(src.maxCharges); count++; }
        if (Number.isFinite(src.moveSpd) && src.moveSpd >= 10 && src.moveSpd <= 200){ h.moveSpd = src.moveSpd; count++; }
      }
    }

    // ---- 全局倍率 ----
    if (data.global){
      const g = data.global;
      if (Number.isFinite(g.enemySpeedMul) && g.enemySpeedMul >= 0 && g.enemySpeedMul <= 5){ enemySpeedMul = g.enemySpeedMul; count++; }
      if (Number.isFinite(g.enemyDmgMul) && g.enemyDmgMul >= 0 && g.enemyDmgMul <= 5){ enemyDmgMul = g.enemyDmgMul; count++; }
      if (Number.isFinite(g.enemyRangeMul) && g.enemyRangeMul >= 0 && g.enemyRangeMul <= 5){ enemyRangeMul = g.enemyRangeMul; count++; }
      if (Number.isFinite(g.trailResistMul) && g.trailResistMul >= 0 && g.trailResistMul <= 5){ trailResistMul = g.trailResistMul; count++; }
      if (Number.isFinite(g.difficultyBias) && g.difficultyBias >= -1 && g.difficultyBias <= 1){ difficultyBias = g.difficultyBias; count++; }
    }

    console.log('%c[瞳·作弊] 已加载 ' + count + ' 项覆盖', 'color:#6aa8ff');
  } catch(e){
    console.warn('[瞳·作弊] 加载失败', e);
  }
})();
