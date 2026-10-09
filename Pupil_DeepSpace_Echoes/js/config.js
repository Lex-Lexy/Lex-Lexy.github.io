/* ======================= A. Polyfills & Utilities ======================= */
if (!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
    if (typeof r === 'number') r = {tl:r,tr:r,br:r,bl:r};
    this.beginPath();
    this.moveTo(x+r.tl, y); this.lineTo(x+w-r.tr, y);
    this.quadraticCurveTo(x+w, y, x+w, y+r.tr);
    this.lineTo(x+w, y+h-r.br); this.quadraticCurveTo(x+w, y+h, x+w-r.br, y+h);
    this.lineTo(x+r.bl, y+h); this.quadraticCurveTo(x, y+h, x, y+h-r.bl);
    this.lineTo(x, y+r.tl); this.quadraticCurveTo(x, y, x+r.tl, y);
    this.closePath(); return this;
  };
}
const clamp = (v,a,b) => v < a ? a : v > b ? b : v;

/* ============================ B. Constants ============================== */
const WORLD = 3000;
const TRAIL_LIFE = 6.0, TRAIL_DECAY = 1/TRAIL_LIFE, TRAIL_MAX_I = 2.6, TRAIL_STEP = 6, MERGE_R2 = 18*18, ALPHA_K = 0.20;
const ACCEL = 2400, FRICTION = 1.5, BRAKE = 12, BASE_MAX = 265;
const BOOST_MAX = 1.5, BOOST_R = 44, BOOST_R2 = BOOST_R*BOOST_R, BOOST_FRESH = 0.5;
const PLAYER_R = 24, PLAYER_HIT_R = 7, PLAYER_MAX_HP = 100;
const ENEMY_ACCEL = 1400, ENEMY_FRIC = 0.28, ENEMY_MAX = 580;
const ENEMY_R = 60, ENEMY_R2 = ENEMY_R*ENEMY_R, ENEMY_SIZE = 42, ENEMY_HIT_R = 14;
const ENEMY_HP = 280, ENEMY_ATK_BASE = 44, ATTACK_RANGE = 210, DMG_K = 3500;
const SKILL_CD = 6.5, SKILL_BOOST = 0.9, SKILL_BOOST_T = 2.8;
const SNAIL_RADIUS = 26, SNAIL_COLLIDE_R = 18;
const SNAIL_CONNECT_RANGE = 240, SNAIL_CONNECT_RATE = 0.22;
const SNAIL_HEAL_MAX = 42, SNAIL_INERTIA_MAX = 4.5;
const SNAIL_SLOW_RANGE = 260, SNAIL_SLOW_MAX = 0.42;
const SNAIL_COUNT = 14, SNAIL_SPEED = 35;
const SNAIL_ATTACH_RANGE = 110, SNAIL_ATTACH_RATE = 1.6, SNAIL_DETACH_RATE = 0.12;
const SNAIL_HYPNOTIZE_MUL = 0.34, WIN_COUNT = 3;
const SNAIL_DECAY_RATE = 0.015;
const SNAIL_WALL_SLOW = 0.15;
const SHRINE_CONNECT_MUL = 1.15;
const SOUL_LIGHT_RATE = 0.25, SOUL_LIGHT_MAX = 0.5;
const SHADOW_RADIUS = PLAYER_R*8, SHADOW_PULL_CD = 4.5, SHADOW_ACCEL = 2400;
const SHADOW_FRIC = 4.5, SHADOW_MAX_SPEED = 800, SHADOW_PENDING_DELAY = 0.22;
const SHADOW_MAX_CAPTURES = 6;
const SMOKE_PROJ_R = 20, SMOKE_PROJ_SPEED = 620;
const SMOKE_CHARGE_TIME = 2.0, SMOKE_CHARGE_MAX = 3;
const SMOKE_MAX_STACK = 10;
const SMOKE_SLOW = 0.12;
const SMOKE_SKILL_LOCK = 3.0, SMOKE_DMG_BOOST = 0.20;
const VORTEX_DURATION = 5.0, VORTEX_RADIUS = 400, VORTEX_PULL = 420;
const DRIFT_DURATION = 0.55, DRIFT_IMPULSE = 580;
const BLOB_VERTS = 32, BLOB_SPRING = 120, BLOB_DAMP = 8;
const BLOB_PUSH = 0.35, BLOB_MAX_OFF = 1.35, BLOB_MEMBRANE_WOBBLE = 0.045;
const COUNTER_BASE_WINDOW = 0.2, COUNTER_ENHANCED_WINDOW = 0.4;
let COUNTER_CD = 8.0;
const SHIELD_CD = 20.0, SHIELD_DURATION = 5.0, SHIELD_REDUCTION = 0.5;
const SPIDERLING_R = 12, SPIDERLING_HP = 40;
const SPIDERLING_SPEED = 300;
const SPIDERLING_ACCEL = 800;
const SPIDERLING_LIFE = 12, SPIDERLING_DMG = 18, SPIDERLING_HIT_CD = 1.0, MAX_SPIDERLINGS = 3;
const SPIDERLING_PULL_IMPULSE = 900;
const SPIDERLING_TRAIL_MUL = 0.5;
const ARACHNE_V_PULL_IMPULSE = 380;
const INTRO_DURATION = 2.0;

/* =========================== C. Data Tables ============================= */
const CHARACTERS = {
  su:   { id:'su',   name:'溯', sub:'RETRO',  rim:'120,180,255', bg1:'#0a1638', bg2:'#02030c', speedMul:1.15,
          skill:{ name:'回溯标记', key:'[', cd:5.0, effect:'放置标记，再按 [ 回到标记处' },
          stats:{ hp:'100', speed:'115%', cd:'5s+', extra:'惯性↓3s' } },
  yin:  { id:'yin',  name:'隐', sub:'VEIL',   rim:'180,255,200', bg1:'#0a2018', bg2:'#02060a', speedMul:1.0,
          skill:{ name:'穿行', key:'[', cd:8.0, effect:'无视地形 2.4s，移动中持续喷尾' },
          stats:{ hp:'100', speed:'100%', cd:'8s', extra:'穿行2.4s' } },
  zhi:  { id:'zhi',  name:'织', sub:'WEAVE',  rim:'255,220,120', bg1:'#2a1808', bg2:'#0c0500', speedMul:1.0,
          skill:{ name:'共鸣', key:'[', cd:9.0, effect:'连接范围 ×2.5，治疗 ×2，惯性↓' },
          stats:{ hp:'100', speed:'100%', cd:'9s', extra:'共鸣5.5s' } },
  xuan: { id:'xuan', name:'旋', sub:'VORTEX', rim:'190,150,255', bg1:'#180a28', bg2:'#040110', speedMul:1.0,
          skill:{ name:'旋涡', key:'[', cd:11.0, effect:'制造旋涡 5s，吸引半径 400 蜗牛，连接×2' },
          stats:{ hp:'100', speed:'100%', cd:'11s', extra:'旋涡5s' } },
  wu:   { id:'wu',   name:'雾', sub:'MIST',   rim:'200,220,240', bg1:'#1a1a2e', bg2:'#050510', speedMul:1.0,
          skill:{ name:'迷障', key:'[', cd:9.0, effect:'远处剧烈模糊 3s，可再按 [ 取消。] 键近身盲区 4s。' },
          stats:{ hp:'100', speed:'100%', cd:'9s', extra:'视野干扰' } },
  jing: { id:'jing', name:'镜', sub:'MIRROR', rim:'255,200,230', bg1:'#2a0a1c', bg2:'#0a0208', speedMul:1.0,
          skill:{ name:'反击', key:'[', cd:8.0, effect:'0.2s内被电弧击中则反击晕眩' },
          stats:{ hp:'100', speed:'100%', cd:'8s', extra:'反击/减伤' } }
};
const HUNTERS = {
  eclipse: { id:'eclipse', name:'蚀影', sub:'ECLIPSE', atkRange:150, maxSlow:0.88, baseDmgMul:1.0, moveSpd:100,
    rim:'220,140,255', bg1:'#1a0033', bg2:'#05000f',
    flow:[ {c1:'220,120,255',c2:'100,0,180'},{c1:'255,80,220',c2:'140,0,160'},
           {c1:'180,60,255',c2:'60,0,120'},{c1:'230,150,255',c2:'180,20,220'} ],
    skill:{ name:'瞬闪', key:'V', cd:5.0, effect:'闪现 180px 拉近距离' },
    extraSkill:{ name:'漂移', key:'F', cd:10.0, effect:'漂移小段，期间免疫尾流减速（CD×2）' } },
  crimson: { id:'crimson', name:'绯渊', sub:'CRIMSON', atkRange:230, maxSlow:0.88, baseDmgMul:1.15, moveSpd:105,
    rim:'255,180,80', bg1:'#3a0500', bg2:'#0c0100',
    flow:[ {c1:'255,220,120',c2:'220,60,20'},{c1:'255,180,60',c2:'180,20,10'},
           {c1:'255,140,40',c2:'140,0,0'},{c1:'255,240,180',c2:'255,100,30'} ],
    skill:{ name:'炽冲', key:'V', cd:3.5, effect:'短暂加速 2.6×，向前冲刺' } },
  pale: { id:'pale', name:'苍噬', sub:'PALE', atkRange:180, maxSlow:0.55, baseDmgMul:1.0, moveSpd:100,
    rim:'160,255,230', bg1:'#00201c', bg2:'#000a0a',
    flow:[ {c1:'180,255,230',c2:'0,180,160'},{c1:'120,240,220',c2:'0,120,140'},
           {c1:'200,255,255',c2:'40,200,200'},{c1:'140,255,200',c2:'0,160,120'} ],
    skill:{ name:'霜环', key:'V', cd:6.0, effect:'范围脉冲，命中角色减速 2s' },
    extraSkill:{ name:'漂移', key:'F', cd:5.0, effect:'漂移小段，期间免疫尾流减速' } },
  smoke: { id:'smoke', name:'烬烟', sub:'SMOKE', atkRange:180, maxSlow:0.88, baseDmgMul:0.40, moveSpd:95,
    rim:'90,80,110', bg1:'#111016', bg2:'#020203',
    flow:[ {c1:'60,55,75',c2:'20,15,30'},{c1:'90,80,110',c2:'40,30,60'},
           {c1:'120,110,140',c2:'50,40,80'},{c1:'70,60,90',c2:'10,5,20'} ],
    skill:{ name:'烟弹', key:'V', cd:0.0, charge:2.0, maxCharges:3, effect:'烟弹命中叠加 10 层，撞墙 50% 爆炸' } },
  arachne: { id:'arachne', name:'蛛', sub:'ARACHNE', atkRange:140, maxSlow:0.75, baseDmgMul:0.85, moveSpd:98,
    rim:'200,255,140', bg1:'#0a1a08', bg2:'#020502',
    flow:[ {c1:'180,255,120',c2:'60,160,40'},{c1:'140,220,90',c2:'40,120,30'},
           {c1:'220,255,180',c2:'100,200,60'},{c1:'160,255,140',c2:'80,180,40'} ],
    skill:{ name:'孵化', key:'V', cd:5.0, effect:'召唤幼蛛于延长线；E 强化后从三方向生成' },
    extraSkill:{ name:'归巢', key:'F', cd:6.0, effect:'把所有幼蛛朝蛛拉动一段距离' } }
};
const MAP_DEFS = {
  void: {
    id:'void', name:'深空秘境', sub:'VOID SANCTUM', desc:'纯净的虚空 · 没有虫洞与力场',
    night: false,
    theme: { bg0:'#0d1128', bg1:'#080a1c', bg2:'#020208',
             accent:'160,200,255', accentDim:'100,150,220',
             obstacle:['#1e2740','#131a2e','#0a0e1c','rgba(70,120,210,0.30)'] }
  },
  night: {
    id:'night', name:'永夜之地', sub:'ENDLESS NIGHT', desc:'黑暗笼罩 · 只有瞳与追猎者能照亮四周',
    night: true,
    lightPlayer: 315, lightEnemy: 660,
    theme: { bg0:'#0a0c18', bg1:'#05060e', bg2:'#010104',
             accent:'130,160,220', accentDim:'80,110,170',
             obstacle:['#14182a','#0c1020','#05070f','rgba(60,90,160,0.25)'] }
  },
  buildings: {
    id:'buildings', name:'遗迹之城', sub:'RUINS', desc:'长板 · 神坛 · 危墙 · 古老的三重构造',
    night: false,
    theme: { bg0:'#15102a', bg1:'#0c0818', bg2:'#030106',
             accent:'200,170,120', accentDim:'150,110,80',
             obstacle:['#3a2a44','#221630','#10081a','rgba(200,170,120,0.32)'] }
  }
};
const MAP_IDS = ['void','night','buildings'];


/* 深空回响 · roster + shared balance defaults (game / laboratory) */
Object.assign(CHARACTERS, {
 lan:{id:'lan',name:'澜',sub:'TIDE',rim:'94,225,220',bg1:'#073c43',bg2:'#020f19',speedMul:1.0,
  skill:{name:'退潮',key:'[',cd:12,effect:'260 范围推退追猎者，清除霜冻与烟层；获得 2 秒流动加速。'},
  stats:{hp:'100',speed:'100%',cd:'12s',extra:'净化 / 推退'}},
 shuo:{id:'shuo',name:'烁',sub:'FLARE',rim:'255,171,114',bg1:'#4b251c',bg2:'#14080e',speedMul:1.04,
  skill:{name:'逐光',key:'[',cd:10,effect:'沿移动方向跃进 150，留下 3 秒光锚；锚附近至多两只蜗牛连接加快。'},
  stats:{hp:'100',speed:'104%',cd:'10s',extra:'跃进 / 光锚'}}
});
Object.assign(HUNTERS, {
 sonar:{id:'sonar',name:'鸣骸',sub:'RESONANT',atkRange:170,maxSlow:0.78,baseDmgMul:0.90,moveSpd:96,
  rim:'113,185,255',bg1:'#0b2b4f',bg2:'#020916',flow:[{c1:'130,200,255',c2:'20,70,160'}],
  skill:{name:'回声脉冲',key:'V',cd:9,effect:'蓄力 0.75 秒后释放扩张声环，命中造成 8 伤害和 0.9 秒霜冻。'}},
 briar:{id:'briar',name:'棘冠',sub:'THORN CROWN',atkRange:165,maxSlow:0.82,baseDmgMul:0.82,moveSpd:92,
  rim:'229,155,192',bg1:'#402034',bg2:'#0d060e',flow:[{c1:'245,150,200',c2:'120,35,80'}],
  skill:{name:'荆棘花园',key:'V',cd:10,effect:'预判移动方向播下三枚棘种；0.85 秒预警后持续 4 秒，可绕开。'}}
});
// 收敛原版极端强度，保留每位追猎者的优势与代价。
HUNTERS.smoke.rim='160,139,194';
HUNTERS.crimson.atkRange=205; HUNTERS.crimson.baseDmgMul=1.02; HUNTERS.crimson.skill.cd=5;
HUNTERS.pale.skill.cd=7; HUNTERS.eclipse.skill.cd=6;
CHARACTERS.jing.stats.extra='反击2.2s / 护盾';
const ROSTER_NOTES={
 su:{role:'时间游者',tag:'机动',story:'在时间留下的一道裂隙中，寻找回家的坐标。',tip:'提前在安全位置放置标记。回溯距离越远，冷却越长。',ratings:[5,2,3]},
 yin:{role:'林间幽灵',tag:'穿行',story:'没有边界能够困住一片自由的叶影。',tip:'借穿行越过地形；结束后仍需注意周围的追猎者。',ratings:[4,3,2]},
 zhi:{role:'共鸣编织者',tag:'联结',story:'她将孤独的星光，编织成一张温柔的网。',tip:'在蜗牛聚集处开启共鸣，扩大连接并增强治疗。',ratings:[2,5,4]},
 xuan:{role:'引力舞者',tag:'聚拢',story:'所有漂泊的微光，都会记得旋涡的方向。',tip:'旋涡会吸引附近蜗牛；选好位置再开启。',ratings:[3,5,2]},
 wu:{role:'迷雾行者',tag:'干扰',story:'看不清的地方，往往藏着另一条生路。',tip:'迷障影响远处视野；副技能在当前位置留下盲区。',ratings:[3,2,4]},
 jing:{role:'折光守望者',tag:'反制',story:'以碎裂的光为盾，直视深渊的凝望。',tip:'反击窗口很短。护盾后的下一次反击窗口翻倍。',ratings:[2,3,5]},
 lan:{role:'潮汐守护者',tag:'净化',story:'深空也有潮汐。她听见微光被海浪唤醒。',tip:'退潮只在近处推退。净化后用短暂加速重建距离。',ratings:[3,3,4],fresh:true},
 shuo:{role:'逐光旅人',tag:'跃迁',story:'在永夜中，留下不会立即熄灭的坐标。',tip:'跃进不能穿墙。光锚半径 180，至多增益两只蜗牛。',ratings:[4,4,2],fresh:true},
 eclipse:{role:'裂隙追猎者',tag:'瞬闪',story:'它吞噬光的边缘，从裂隙另一端归来。',tip:'攻击半径较短；用瞬闪缩短距离，用漂移脱离尾流。',ratings:[5,2,3]},
 crimson:{role:'熔火掠食者',tag:'冲刺',story:'它的心脏是一枚尚未冷却的红色恒星。',tip:'炽冲爆发很强，但急转弯困难。避免正面撞入尾流。',ratings:[4,4,2]},
 pale:{role:'霜海捕食者',tag:'减速',story:'霜环展开时，每一颗星都沉入寂静。',tip:'霜环需要近身；较低的尾流拖曳让它更适合持续追击。',ratings:[3,4,4]},
 smoke:{role:'灰烬潜伏者',tag:'叠层',story:'无声的灰烬，缓慢覆盖每一次呼吸。',tip:'基础攻击低，靠烟弹叠层。烟层可被澜的退潮清除。',ratings:[2,3,5]},
 arachne:{role:'巢穴女王',tag:'召唤',story:'丝线的另一端，是一场尚未结束的梦。',tip:'用幼蛛封路；归巢回收失散的幼蛛，强化后生成三只。',ratings:[3,3,5]},
 sonar:{role:'回声猎手',tag:'声环',story:'在没有声音的宇宙，听见你的每一次心跳。',tip:'声环有蓄力预警，只命中一次。利用移动方向让对手难以绕开。',ratings:[3,3,4],fresh:true},
 briar:{role:'荆棘园主',tag:'封路',story:'一朵长在黑暗里的花，等待途经的微光。',tip:'棘种固定且有预警。预判路径封路，区域伤害不叠加。',ratings:[2,3,5],fresh:true}
};
const DEFAULT_BALANCE={characters:{},hunters:{},global:{enemySpeedMul:1,enemyDmgMul:1,enemyRangeMul:1,trailResistMul:1,difficultyBias:0}};
for(const [id,c] of Object.entries(CHARACTERS)) DEFAULT_BALANCE.characters[id]={speedMul:c.speedMul,skillCd:c.skill.cd};
for(const [id,h] of Object.entries(HUNTERS)) {
 const d={atkRange:h.atkRange,maxSlow:h.maxSlow,baseDmgMul:h.baseDmgMul,skillCd:h.skill.cd,moveSpd:h.moveSpd};
 if(h.extraSkill)d.extraCd=h.extraSkill.cd;
 if(h.skill.charge!==undefined){d.charge=h.skill.charge;d.maxCharges=h.skill.maxCharges;}
 DEFAULT_BALANCE.hunters[id]=d;
}
