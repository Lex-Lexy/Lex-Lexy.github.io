/* New abilities: bounded control, visible warnings, no stacking damage. */
const echoes=[], gardens=[];
let lightAnchor=null, matchElapsed=0;
const originalStartGame=startGame;
startGame=function(){
 for(const k in keys)keys[k]=false;onUp();
 originalStartGame(); echoes.length=0;gardens.length=0;lightAnchor=null;matchElapsed=0;
 player.tideTimer=0;player.gardenSlow=0;player.smokeDecayTimer=0;enemy.knockbackTimer=0;
 if(window.Soundscape)Soundscape.start();
};
const originalCharSkill=useCharSkill;
useCharSkill=function(){
 if(gameState==='playing'&&player.charType==='wu'&&player.fogTimer>0){player.fogTimer=0;return;}
 if(gameState!=='playing'||player.charSkillCd>0||player.skillLock>0||player.stunTimer>0)return;
 if(player.charType==='lan'){
  player.charSkillCd=CHARACTERS.lan.skill.cd;player.tideTimer=2;
  frostSlow=0;playerFrostTimer=0;player.smokeStacks=0;player.smokeSlow=0;
  const dx=enemy.x-player.x,dy=enemy.y-player.y,d=Math.hypot(dx,dy);
  if(d<260&&!enemy.dying){enemy.vx+=(dx/(d||1))*440;enemy.vy+=(dy/(d||1))*440;enemy.knockbackTimer=.35;}
  explosionFlashes.push({x:player.x,y:player.y,time:0,maxTime:.65,color:CHARACTERS.lan.rim,radius:260,ring:true});
 }else if(player.charType==='shuo'){
  let dx=practiceMode?aiInput.dx:playerInput.dx,dy=practiceMode?aiInput.dy:playerInput.dy;
  if(!dx&&!dy){const sp=Math.hypot(player.vx,player.vy);if(sp>5){dx=player.vx/sp;dy=player.vy/sp;}else{const d=Math.hypot(player.x-enemy.x,player.y-enemy.y)||1;dx=(player.x-enemy.x)/d;dy=(player.y-enemy.y)/d;}}
  const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
  const ox=player.x,oy=player.y;
  // Sample the dash path: never teleports through walls or world bounds.
  for(let i=1;i<=30;i++){const x=ox+dx*i*5,y=oy+dy*i*5;if(x<80||y<80||x>WORLD-80||y>WORLD-80||obstacles.some(o=>o.type!=='membrane'&&Math.hypot(x-o.x,y-o.y)<o.r+PLAYER_HIT_R))break;player.x=x;player.y=y;addTrail(x,y,.8,0,0,true,true);}
  lightAnchor={x:ox,y:oy,life:3};player.charSkillCd=CHARACTERS.shuo.skill.cd;
  resetBlobPositions(player,PLAYER_R);
  explosionFlashes.push({x:ox,y:oy,time:0,maxTime:.5,color:CHARACTERS.shuo.rim,radius:180,ring:true});
 }else originalCharSkill();
 if(window.Soundscape)Soundscape.chime();
};
const originalHunterSkill=tryHunterSkill;
tryHunterSkill=function(){
 if(enemy.dying||enemy.skillTimer>0||enemy.stunTimer>0||gameState!=='playing')return;
 if(enemy.hunterType==='sonar'){
  echoes.push({x:enemy.x,y:enemy.y,age:0,hit:false,boost:enemy.empowered});
  enemy.empowered=false;enemy.skillTimer=HUNTERS.sonar.skill.cd;
 }else if(enemy.hunterType==='briar'){
  const lead=.35,x=clamp(player.x+player.vx*lead,120,WORLD-120),y=clamp(player.y+player.vy*lead,120,WORLD-120);
  const angle=Math.atan2(player.vy,player.vx)||Math.atan2(player.y-enemy.y,player.x-enemy.x);
  for(let i=-1;i<=1;i++)gardens.push({x:clamp(x+Math.cos(angle+Math.PI/2)*i*170,100,WORLD-100),y:clamp(y+Math.sin(angle+Math.PI/2)*i*170,100,WORLD-100),age:0,boost:enemy.empowered});
  enemy.empowered=false;enemy.skillTimer=HUNTERS.briar.skill.cd;
 }else originalHunterSkill();
};
const originalPlayerUpdate=updatePlayer;
updatePlayer=function(dt){
 matchElapsed+=dt;
 if(player.smokeStacks>0&&player.smokeSlow<=0){player.smokeDecayTimer=(player.smokeDecayTimer||0)+dt;if(player.smokeDecayTimer>=4){player.smokeStacks--;player.smokeDecayTimer=0;}}else player.smokeDecayTimer=0;
 player.tideTimer=Math.max(0,(player.tideTimer||0)-dt);player.gardenSlow=0;
 if(lightAnchor){lightAnchor.life-=dt;if(lightAnchor.life<=0)lightAnchor=null;else{
  // The anchor supplements normal connection only nearby, never completes remotely.
  const targets=snails.filter(s=>s.hypnotized<=.5&&s.connectProgress<.999&&Math.hypot(s.x-lightAnchor.x,s.y-lightAnchor.y)<180&&Math.hypot(s.x-player.x,s.y-player.y)<SNAIL_CONNECT_RANGE).sort((a,b)=>Math.hypot(a.x-lightAnchor.x,a.y-lightAnchor.y)-Math.hypot(b.x-lightAnchor.x,b.y-lightAnchor.y)).slice(0,2);
  for(const s of targets)s.connectProgress=Math.min(1,s.connectProgress+.075*dt);
 }}
 for(let i=echoes.length-1;i>=0;i--){const e=echoes[i];e.age+=dt;const r=Math.max(0,(e.age-.75)*400),d=Math.hypot(player.x-e.x,player.y-e.y);
  const gap=d-r,crossed=e.prevGap!==undefined&&gap*e.prevGap<0;
  if(e.age>=.75&&!e.hit&&(Math.abs(gap)<24||crossed)){e.hit=true;player.hp-=(e.boost?11:8)*enemyDmgMul*(1-player.damageReduction);playerFrostTimer=Math.max(playerFrostTimer,.9);}
  e.prevGap=gap;
  if(e.age>1.8)echoes.splice(i,1);
 }
 let gardenDamage=0;
 for(let i=gardens.length-1;i>=0;i--){const g=gardens[i];g.age+=dt;if(g.age>4.85){gardens.splice(i,1);continue;}if(g.age>=.85&&Math.hypot(player.x-g.x,player.y-g.y)<95){gardenDamage=Math.max(gardenDamage,g.boost?10:8);player.gardenSlow=.18;}}
 if(gardenDamage)player.hp-=gardenDamage*dt*enemyDmgMul*(1-player.damageReduction);
 originalPlayerUpdate(dt);
};
const originalAISkills=aiTrySkills;
aiTrySkills=function(dt){originalAISkills(dt);if(player.charSkillCd<=0&&player.skillLock<=0){const d=Math.hypot(enemy.x-player.x,enemy.y-player.y);if(player.charType==='lan'&&(d<250||player.smokeStacks>=3||playerFrostTimer>0))useCharSkill();if(player.charType==='shuo'&&d<320)useCharSkill();}};
const originalEnemyUpdate=updateEnemy;
updateEnemy=function(dt){if(enemy.knockbackTimer>0){enemy.knockbackTimer=Math.max(0,enemy.knockbackTimer-dt);enemyInput.mag=0;}originalEnemyUpdate(dt);};
const originalRespawn=respawnEnemy;
respawnEnemy=function(){originalRespawn();enemy.knockbackTimer=0;echoes.length=0;gardens.length=0;};
// Direct JSON import supports double-click play when browsers isolate file storage.
function applyImportedConfig(config){if(!config||typeof config!=='object'||Array.isArray(config))throw new Error('无效配置');const clean=sanitizeBalance(config);localStorage.setItem('pupil_cheat_data',JSON.stringify(clean));location.reload();}
function sanitizeBalance(source){
 const clean=JSON.parse(JSON.stringify(DEFAULT_BALANCE));
 const limits={speedMul:[.1,5],skillCd:[0,60],atkRange:[0,800],maxSlow:[0,1],baseDmgMul:[0,5],moveSpd:[10,200],extraCd:[0,60],charge:[.1,10],maxCharges:[1,10],enemySpeedMul:[0,5],enemyDmgMul:[0,5],enemyRangeMul:[0,5],trailResistMul:[0,5],difficultyBias:[-1,1]};
 for(const group of ['characters','hunters','global']){
  if(!source?.[group]||typeof source[group]!=='object')continue;
  const patch=(out,src)=>{for(const key of Object.keys(out)){const n=src?.[key];if(Number.isFinite(n)){const [lo,hi]=limits[key];out[key]=clamp(n,lo,hi);if(key==='maxCharges')out[key]=Math.round(out[key]);}}};
  if(group==='global')patch(clean.global,source.global);else for(const id of Object.keys(clean[group]))patch(clean[group][id],source[group][id]);
 }
 return clean;
}
