/* Decision difficulty changes reaction, prediction and tactics; never body physics. */
const AI_LEVELS=[
 {name:'初学',reaction:.8,lead:0,error:95,tactics:.20,skills:.9},
 {name:'入门',reaction:.5,lead:.18,error:60,tactics:.38,skills:.65},
 {name:'标准',reaction:.3,lead:.38,error:32,tactics:.62,skills:.4},
 {name:'进阶',reaction:.18,lead:.62,error:15,tactics:.83,skills:.24},
 {name:'大师',reaction:.10,lead:.85,error:5,tactics:1,skills:.15}
];
let playerAILevel=2,hunterAILevel=2,watchMode=false;
try{const p=JSON.parse(localStorage.getItem('pupil_ai')||'{}');if(Number.isInteger(p.player))playerAILevel=clamp(p.player,0,4);if(Number.isInteger(p.hunter))hunterAILevel=clamp(p.hunter,0,4);}catch(_){}
function saveAI(){try{localStorage.setItem('pupil_ai',JSON.stringify({player:playerAILevel,hunter:hunterAILevel}));}catch(_){}}
const aiBrains={player:{},hunter:{}},NAV_STEP=80,NAV_N=Math.ceil(WORLD/NAV_STEP),navGrids={};
function resetAI(){for(const key of ['player','hunter'])aiBrains[key]={think:0,skillThink:0,path:[],target:null,lastSeen:null,decisions:0,pUses:0,skillUses:0};navGrids.player=null;navGrids.hunter=null;}
const startWithAI=startGame;
startGame=function(){if(practiceMode)watchMode=false;startWithAI();resetAI();};
function aiPasses(ob,side){return side==='player'&&(ob.type==='membrane'||player.phaseThrough>0);}
function routeClear(ax,ay,bx,by,side,pad=12){
 const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy,hard=side==='player'?PLAYER_HIT_R:ENEMY_HIT_R;
 for(const o of obstacles){if(aiPasses(o,side))continue;const t=clamp(((o.x-ax)*dx+(o.y-ay)*dy)/(l2||1),0,1);if(Math.hypot(ax+dx*t-o.x,ay+dy*t-o.y)<o.r+hard+pad)return false;}return true;
}
function navigationGrid(side){if(navGrids[side])return navGrids[side];const grid=new Uint8Array(NAV_N*NAV_N),hard=side==='player'?PLAYER_HIT_R:ENEMY_HIT_R;for(let y=0;y<NAV_N;y++)for(let x=0;x<NAV_N;x++){const px=(x+.5)*NAV_STEP,py=(y+.5)*NAV_STEP;grid[y*NAV_N+x]=(px<100||py<100||px>WORLD-100||py>WORLD-100||obstacles.some(o=>!(side==='player'&&o.type==='membrane')&&Math.hypot(px-o.x,py-o.y)<o.r+hard+18))?1:0;}return navGrids[side]=grid;}
function findRoute(ent,tx,ty,side){
 if(routeClear(ent.x,ent.y,tx,ty,side))return [{x:tx,y:ty}];
 const grid=navigationGrid(side),index=(x,y)=>clamp(Math.floor(y/NAV_STEP),0,NAV_N-1)*NAV_N+clamp(Math.floor(x/NAV_STEP),0,NAV_N-1),start=index(ent.x,ent.y);let goal=index(tx,ty);
 if(grid[goal]){let best=Infinity;for(let j=0;j<grid.length;j++){if(grid[j])continue;const x=(j%NAV_N+.5)*NAV_STEP,y=(Math.floor(j/NAV_N)+.5)*NAV_STEP,d=Math.hypot(x-tx,y-ty);if(d<best){best=d;goal=j;}}}
 const scores=new Float32Array(grid.length).fill(Infinity),parents=new Int32Array(grid.length).fill(-1),closed=new Uint8Array(grid.length),open=[start],heuristic=j=>Math.hypot(j%NAV_N-goal%NAV_N,Math.floor(j/NAV_N)-Math.floor(goal/NAV_N));scores[start]=0;let count=0,found=false;
 while(open.length&&count++<2200){let oi=0,best=Infinity;for(let i=0;i<open.length;i++){const f=scores[open[i]]+heuristic(open[i]);if(f<best){best=f;oi=i;}}const at=open.splice(oi,1)[0];if(at===goal){found=true;break;}closed[at]=1;const ax=at%NAV_N,ay=Math.floor(at/NAV_N);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const x=ax+dx,y=ay+dy;if(x<0||y<0||x>=NAV_N||y>=NAV_N)continue;const ni=y*NAV_N+x;if(grid[ni]||closed[ni]||(dx&&dy&&(grid[ay*NAV_N+x]||grid[y*NAV_N+ax])))continue;const s=scores[at]+(dx&&dy?1.414:1);if(s<scores[ni]){scores[ni]=s;parents[ni]=at;if(!open.includes(ni))open.push(ni);}}}
 if(!found)return [{x:clamp(ent.x+(ent.x-tx)*.4,170,WORLD-170),y:clamp(ent.y+(ent.y-ty)*.4,170,WORLD-170)}];
 const route=[];for(let at=goal;at!==start&&at>=0;at=parents[at])route.push({x:(at%NAV_N+.5)*NAV_STEP,y:(Math.floor(at/NAV_N)+.5)*NAV_STEP});route.reverse();if(!route.length)return [{x:(goal%NAV_N+.5)*NAV_STEP,y:(Math.floor(goal/NAV_N)+.5)*NAV_STEP}];if(routeClear(route.at(-1).x,route.at(-1).y,tx,ty,side))route.push({x:tx,y:ty});return route;
}
function steerAI(ent,goal,side,out,profile){
 const b=aiBrains[side];if(!b.target||Math.hypot(b.target.x-goal.x,b.target.y-goal.y)>110||!b.path.length){b.path=findRoute(ent,goal.x,goal.y,side);b.target={...goal};}
 while(b.path.length>1&&Math.hypot(ent.x-b.path[0].x,ent.y-b.path[0].y)<65)b.path.shift();
 // Skip corners only when the whole swept segment is clear.
 for(let i=b.path.length-1;i>0;i--)if(routeClear(ent.x,ent.y,b.path[i].x,b.path[i].y,side,16)){b.path.splice(0,i);break;}
 const next=b.path[0]||goal,dx=next.x-ent.x,dy=next.y-ent.y,d=Math.hypot(dx,dy),speed=side==='hunter'?ENEMY_MAX:BASE_MAX*1.2;
 if(d<45&&side==='player'&&(enemy.dying||Math.hypot(enemy.x-ent.x,enemy.y-ent.y)>HUNTERS[enemy.hunterType].atkRange*enemyRangeMul*getBiasFactor()+350)){out.dx=out.dy=out.mag=0;return;}
 let sx=dx/(d||1)*speed-ent.vx*(side==='hunter'?.9:.45),sy=dy/(d||1)*speed-ent.vy*(side==='hunter'?.9:.45);
 // Local avoidance handles small stones between grid centers without touching collision rules.
 for(const o of obstacles){if(aiPasses(o,side))continue;const ox=ent.x-o.x,oy=ent.y-o.y,dist=Math.hypot(ox,oy),safe=o.r+(side==='hunter'?38:25);if(dist<safe+45&&dist>0){const f=clamp((safe+45-dist)/45,0,1)*speed*1.3;sx+=ox/dist*f;sy+=oy/dist*f;}}
 if(side==='hunter'&&profile.tactics>.5&&enemy.driftTimer<=0){for(let i=0;i<trails.length;i+=6){const p=trails[i],dist=Math.hypot(p.x-ent.x,p.y-ent.y);if(dist<100&&dist>5&&!p.isPurple&&p.i>.5){const f=(1-dist/100)*speed*.2*profile.tactics;sx+=(ent.x-p.x)/dist*f;sy+=(ent.y-p.y)/dist*f;}}}
 const l=Math.hypot(sx,sy)||1;out.dx=sx/l;out.dy=sy/l;out.mag=1;
}
function choosePlayerGoal(profile){
 const b=aiBrains.player,danger=Math.hypot(enemy.x-player.x,enemy.y-player.y),range=HUNTERS[enemy.hunterType].atkRange*enemyRangeMul*getBiasFactor(),threat=!enemy.dying&&danger<range+280+profile.tactics*180;
 let best=null,score=-Infinity;for(const s of snails){if(s.connectProgress>=.999||s.hypnotized>.5)continue;const dist=Math.hypot(s.x-player.x,s.y-player.y);if(currentMapDef.night&&dist>currentMapDef.lightPlayer+180&&s!==b.snail&&!s.shrine)continue;const ed=Math.hypot(s.x-enemy.x,s.y-enemy.y),cluster=snails.filter(n=>n!==s&&n.connectProgress<.999&&n.hypnotized<=.5&&Math.hypot(n.x-s.x,n.y-s.y)<300).length,value=-dist+s.connectProgress*850+cluster*75-(ed<420&&!enemy.dying?(420-ed)*profile.tactics*3:0);if(value>score){score=value;best=s;}}
 b.snail=best;
 if(threat){let goal=null,v=-Infinity;for(let i=0;i<48;i++){const a=(i%24)*Math.PI/12,step=i<24?180:320,x=clamp(player.x+Math.cos(a)*step,155,WORLD-155),y=clamp(player.y+Math.sin(a)*step,155,WORLD-155),ed=Math.hypot(x-enemy.x,y-enemy.y),td=best?Math.hypot(x-best.x,y-best.y):0,clear=routeClear(player.x,player.y,x,y,'player',18),urgent=danger<range+80,value=Math.min(ed,range+340)*(urgent?1.5:1)-td*(urgent?.45:.9+(best?.connectProgress||0)*.7)+(clear?180:-320)-Math.max(0,180-Math.min(x,y,WORLD-x,WORLD-y))*2; if(value>v){v=value;goal={x,y};}}return goal;}
 if(best){const dx=best.x-enemy.x,dy=best.y-enemy.y,a=Math.atan2(dy,dx);let goal=null,value=-Infinity;for(let i=0;i<12;i++){const angle=a+i*Math.PI/6,x=clamp(best.x+Math.cos(angle)*75,150,WORLD-150),y=clamp(best.y+Math.sin(angle)*75,150,WORLD-150);if(obstacles.some(o=>!aiPasses(o,'player')&&Math.hypot(x-o.x,y-o.y)<o.r+PLAYER_HIT_R+24))continue;const v=Math.hypot(x-enemy.x,y-enemy.y)-Math.hypot(x-player.x,y-player.y)*.7;if(v>value){value=v;goal={x,y};}}return goal||{x:best.x,y:best.y};}
 return {x:clamp(player.x+Math.cos(matchElapsed*.13)*420,180,WORLD-180),y:clamp(player.y+Math.sin(matchElapsed*.13)*420,180,WORLD-180)};
}
updatePlayerAI=function(dt){
 const b=aiBrains.player,profile=AI_LEVELS[playerAILevel];b.think-=dt;b.skillThink-=dt;
 if(!b.goal||b.think<=0){b.goal=choosePlayerGoal(profile);b.think=profile.reaction;b.decisions++;}
 steerAI(player,b.goal,'player',aiInput,profile);
 if(b.skillThink<=0){if(watchMode)Object.assign(playerInput,aiInput);aiTrySkills(dt);b.skillThink=profile.skills;}
};
aiTrySkills=function(){
 const b=aiBrains.player,p=AI_LEVELS[playerAILevel],d=Math.hypot(enemy.x-player.x,enemy.y-player.y),range=HUNTERS[enemy.hunterType].atkRange*enemyRangeMul*getBiasFactor(),closing=((enemy.vx-player.vx)*(player.x-enemy.x)+(enemy.vy-player.vy)*(player.y-enemy.y))/(d||1),escaping=aiInput.dx*(player.x-enemy.x)+aiInput.dy*(player.y-enemy.y)>0;
 // P proactively lays a wake and creates spacing, before contact damage starts.
 if(!enemy.dying&&player.skillCd<=0&&player.skillLock<=0&&escaping&&d<range+230+p.tactics*250&&(closing>10||d<range+220)){useSkill();b.pUses++;}
 if(player.charSkillCd>0||player.skillLock>0)return;
 let use=false;const near=snails.filter(s=>s.hypnotized<=.5&&s.connectProgress<.999&&Math.hypot(s.x-player.x,s.y-player.y)<300);
 switch(player.charType){case 'su':use=player.markerPlaced?d<420&&Math.hypot(player.markerX-enemy.x,player.markerY-enemy.y)>d+150:d>650;break;case 'yin':use=d<450&&obstacles.some(o=>Math.hypot(o.x-player.x,o.y-player.y)<o.r+120);break;case 'zhi':use=near.length>=1&&(d>350||player.hp<70);break;case 'xuan':use=near.length>=2;break;case 'wu':use=d<450;break;case 'jing':use=d<range+60&&closing>30;break;case 'lan':use=d<250||player.smokeStacks>=3||playerFrostTimer>0;break;case 'shuo':use=d<450&&escaping;break;}
 if(use){useCharSkill();b.skillUses++;}if(player.charType==='jing'&&d<range+150&&player.mirrorKCd<=0)useKMirror();if(player.charType==='wu'&&d<250)useKBlind();
};
function updateHunterAI(dt){
 const b=aiBrains.hunter,p=AI_LEVELS[hunterAILevel];b.think-=dt;b.skillThink-=dt;
 if(b.think<=0||!b.goal){const d=Math.hypot(player.x-enemy.x,player.y-enemy.y),visibility=(player.fogTimer>0||player.blindTimer>0)?250:currentMapDef.night?currentMapDef.lightEnemy:1700;
  if(d<visibility){b.lastSeen={x:player.x,y:player.y,vx:player.vx,vy:player.vy,t:matchElapsed};}
  const seen=b.lastSeen;
  if(seen&&matchElapsed-seen.t<5){const lead=Math.min(p.lead,d/(ENEMY_MAX||1)*.42),err=p.error;b.goal={x:clamp(seen.x+seen.vx*lead+Math.sin(matchElapsed*.9)*err,140,WORLD-140),y:clamp(seen.y+seen.vy*lead+Math.cos(matchElapsed*.8)*err,140,WORLD-140)};}
  else {const angle=matchElapsed*.12;b.goal={x:WORLD/2+Math.cos(angle)*850,y:WORLD/2+Math.sin(angle)*850};}
  b.think=p.reaction;b.decisions++;
 }
 steerAI(enemy,b.goal,'hunter',enemyInput,p);
 if(b.skillThink<=0){hunterAISkills();b.skillThink=p.skills;}
}
function hunterAISkills(){
 const b=aiBrains.hunter,p=AI_LEVELS[hunterAILevel],d=Math.hypot(player.x-enemy.x,player.y-enemy.y),h=enemy.hunterType;
 if(enemy.dying||enemy.stunTimer>0||!b.lastSeen||matchElapsed-b.lastSeen.t>1.2)return;
 const aligned=routeClear(enemy.x,enemy.y,player.x,player.y,'hunter',6);
 if(p.tactics>.6&&enemy.empowerCd<=0&&d<500&&enemy.skillTimer<.6)useEmpowerSkill();
 if(enemy.skillTimer<=0){let use=(h==='eclipse'&&d>220&&d<650&&aligned)||(h==='crimson'&&d>140&&d<550&&aligned)||(h==='pale'&&d<310)||(h==='smoke'&&d<650&&aligned&&enemy.smokeCharges>0)||(h==='arachne'&&d<800&&spiderlings.length<MAX_SPIDERLINGS)||(h==='sonar'&&d<540)||(h==='briar'&&d<630);if(use){tryHunterSkill();if(h==='smoke')enemy.skillTimer=2.1+(1-p.tactics)*1.4;b.skillUses++;}}
 if(p.tactics>.45&&enemy.slowFactor>.25&&d>190&&aligned&&['eclipse','pale'].includes(h))useDriftSkill();
 if(p.tactics>.6&&h==='arachne'&&spiderlings.some(s=>Math.hypot(s.x-player.x,s.y-player.y)>500))useArachnePull();
 if(p.tactics>.8&&enemy.huntProgress>=1&&!shadow.active)useShadowSkill();
}
const baseDistribute=distributeInput;
distributeInput=function(dt){baseDistribute(dt);if(!practiceMode&&enemyMode==='auto')updateHunterAI(dt);if(watchMode&&!practiceMode){updatePlayerAI(dt);Object.assign(playerInput,aiInput);}};
// Automated smoke shots aim at an intercept; manual shots retain their original rule.
const smokeShotOriginal=useSmokeSkill;
useSmokeSkill=function(){
 const count=smokeProjectiles.length;smokeShotOriginal();
 if(practiceMode||enemyMode!=='auto'||smokeProjectiles.length===count)return;
 const dx=player.x-enemy.x,dy=player.y-enemy.y,vx=player.vx,vy=player.vy,a=vx*vx+vy*vy-SMOKE_PROJ_SPEED*SMOKE_PROJ_SPEED,b=2*(dx*vx+dy*vy),c=dx*dx+dy*dy,disc=b*b-4*a*c;let intercept=0;
 if(Math.abs(a)<.001){if(Math.abs(b)>.001)intercept=Math.max(0,-c/b);}else if(disc>=0){const s=Math.sqrt(disc),roots=[(-b-s)/(2*a),(-b+s)/(2*a)].filter(t=>t>0);if(roots.length)intercept=Math.min(...roots);}
 const profile=AI_LEVELS[hunterAILevel],lead=clamp(intercept,0,1.1)*profile.lead/.85,tx=dx+vx*lead,ty=dy+vy*lead,len=Math.hypot(tx,ty)||1,shot=smokeProjectiles.at(-1);shot.vx=tx/len*SMOKE_PROJ_SPEED;shot.vy=ty/len*SMOKE_PROJ_SPEED;
};
resetAI();
