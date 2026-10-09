/* Cached atmosphere, specimen sprites, map materials and explicit ability telegraphs. */
const sceneCache=new Map(), trailPalette=new Map(), mineralCache=new Map();
function atmosphere(id,menu=false){
 const key=id+menu;if(sceneCache.has(key))return sceneCache.get(key);
 const c=document.createElement('canvas');c.width=1600;c.height=1000;const g=c.getContext('2d'),rand=PupilArt.rng(id.length*128+132);
 const col=id==='buildings'?'178,139,97':id==='night'?'106,104,179':'52,131,141';
 const bg=g.createLinearGradient(0,0,1400,1000);bg.addColorStop(0,'#09121f');bg.addColorStop(.45,id==='buildings'?'#1a1726':'#112b35');bg.addColorStop(1,'#030911');g.fillStyle=bg;g.fillRect(0,0,1600,1000);
 PupilArt.orb(g,1150,320,650,col,.3);PupilArt.orb(g,340,130,550,'65,94,162',.18);
 for(let i=0;i<180;i++){const x=rand()*1800-100,y=rand()*1000,r=50+rand()*200;g.save();g.translate(x,y);g.scale(2.2,.35);PupilArt.orb(g,0,0,r,col,.025+rand()*.025);g.restore();}
 // Aurora ribbons built once, then reused as a textured layer.
 for(let i=0;i<18;i++){g.beginPath();g.moveTo(400+i*25,-100);g.bezierCurveTo(720+i*17,200,520+i*22,510,1600,650+i*8);g.strokeStyle=`rgba(${col},${.012+i*.001})`;g.lineWidth=12+i*2;g.stroke();}
 for(let i=0;i<420;i++){const x=rand()*1600,y=rand()*1000,a=.15+rand()*.45;g.fillStyle=`rgba(193,224,219,${a})`;g.fillRect(x,y,rand()<.02?2:1,rand()<.02?2:1);}
 // Distant broken celestial ring.
 g.save();g.translate(1150,230);g.rotate(-.32);for(let i=0;i<3;i++){g.beginPath();g.ellipse(0,0,440+i*18,180+i*10,0,.22,Math.PI*1.8);g.strokeStyle=`rgba(144,187,183,${.075-i*.018})`;g.lineWidth=1.1;g.stroke();}g.restore();
 if(menu){
  for(let layer=0;layer<3;layer++){g.beginPath();g.moveTo(0,1000);for(let x=0;x<=1600;x+=25){const y=790+layer*75+Math.sin(x*.012+layer)*28+Math.cos(x*.035)*14;g.lineTo(x,y);}g.lineTo(1600,1000);g.closePath();g.fillStyle=['#101e2a','#0a1620','#050e16'][layer];g.fill();}
  for(let i=0;i<24;i++){const x=rand()*1600,y=820+rand()*150;g.strokeStyle='#152c34';g.lineWidth=1+rand()*3;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+30,y-25,x-30,y-60,x+rand()*45-20,y-100-rand()*100);g.stroke();}
 }
 sceneCache.set(key,c);return c;
}
function drawMenu(){ctx.drawImage(atmosphere('void',true),0,0,W,H);for(let i=0;i<22;i++){const x=(i*73.4+Math.sin(time*.07+i)*22)%W,y=(i*51.7-time*2)%H;ctx.fillStyle=`rgba(173,231,209,${.12+.1*Math.sin(time+i)})`;ctx.fillRect(x,y,1.2,1.2);}animateInterface();}
function drawBackgroundScreenSpace(){ctx.drawImage(atmosphere(currentMapDef.id),0,0,W,H);ctx.save();ctx.globalAlpha=.15;const x=((cam.cx*.035)%100),y=((cam.cy*.035)%60);ctx.translate(-x,-y);ctx.strokeStyle='rgba(127,164,174,.12)';ctx.lineWidth=.6;for(let i=0;i<W+100;i+=110){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,H+60);ctx.stroke();}for(let i=0;i<H+60;i+=110){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(W+100,i);ctx.stroke();}ctx.restore();};
function statusRing(ent,r,col,progress=1,dashed=false){ctx.save();ctx.strokeStyle=`rgba(${col},.8)`;ctx.lineWidth=1.5;if(dashed){ctx.setLineDash([5,8]);ctx.lineDashOffset=-time*18;}ctx.beginPath();ctx.arc(ent.x,ent.y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(progress,0,1));ctx.stroke();ctx.restore();}
function drawPlayerWorld(){
 const r=PLAYER_R, col=CHARACTERS[player.charType].rim;ctx.save();
 if(player.phaseThrough>0)ctx.globalAlpha=.65;PupilFluid.draw(ctx,player.charType,player.x,player.y,r,time,'char',player.blob,player.vx,player.vy,false);ctx.restore();
 if(player.tideTimer>0)statusRing(player,48,col,player.tideTimer/2,true);
 if(player.phaseThrough>0)statusRing(player,44,col,1,true);
 if(player.weaveActive>0)statusRing(player,50,col,player.weaveActive/5.5,true);
 if(player.counterWindow>0)statusRing(player,52,'255,233,200');
 if(player.damageReductionTimer>0)statusRing(player,48,'140,235,240',player.damageReductionTimer/5);
 if(player.skillBoost>.05)statusRing(player,43+10*Math.sin(time*3),col,player.skillBoost/SKILL_BOOST);
 if(player.skillLock>0)statusRing(player,52,'255,90,120',1,true);
 if(player.stunTimer>0)statusRing(player,55,'230,215,153',1,true);
 drawPlayerSmokeAttachment();
};
function drawEnemyWorld(){
 const h=HUNTERS[enemy.hunterType];ctx.save();ctx.globalAlpha=enemy.dying?Math.max(0,1-enemy.deathTimer/2.4):1;
 PupilFluid.draw(ctx,enemy.hunterType,enemy.x,enemy.y,ENEMY_SIZE,time,'hunter',enemy.blob,enemy.vx,enemy.vy,false);
 if(enemy.hitFlash>.1){ctx.fillStyle=`rgba(249,238,206,${enemy.hitFlash*.22})`;ctx.beginPath();ctx.arc(enemy.x,enemy.y,28,0,Math.PI*2);ctx.fill();}
 if(enemy.empowered)statusRing(enemy,80,'237,193,111',1,true);
 if(enemy.driftTimer>0)statusRing(enemy,68,'155,244,229',1,true);
 if(enemy.stunTimer>0)statusRing(enemy,75,'244,210,125',1,true);
 if(enemy.hunterType==='smoke')for(let i=0;i<HUNTERS.smoke.skill.maxCharges;i++){const a=-Math.PI/2+i*Math.PI*2/HUNTERS.smoke.skill.maxCharges;ctx.beginPath();ctx.arc(enemy.x+Math.cos(a)*65,enemy.y+Math.sin(a)*65,3,0,Math.PI*2);ctx.fillStyle=i<enemy.smokeCharges?'#e4cdef':'#3f354d';ctx.fill();}
 ctx.restore();
};
// Original snail body is deliberately left untouched.
const originalObstacleDraw=drawObstaclesWorld;
function stoneMaterial(ob){
 const key=ob.seed+currentMapDef.id;if(mineralCache.has(key))return mineralCache.get(key);
 const c=document.createElement('canvas');c.width=c.height=192;const g=c.getContext('2d'),rand=PupilArt.rng(Math.floor(ob.seed*999));g.translate(96,96);g.beginPath();for(let j=0;j<=18;j++){const a=j/18*Math.PI*2,wob=1+Math.sin(a*4+ob.seed)*.06+Math.cos(a*7-ob.seed*.7)*.035+Math.sin(a*11+ob.seed*1.3)*.02,x=Math.cos(a)*85*wob,y=Math.sin(a)*85*wob;j?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.clip();
 for(let i=0;i<150;i++){const x=rand()*180-90,y=rand()*180-90,r=rand()*4+.4;g.beginPath();g.ellipse(x,y,r,r*.6,rand()*6.28,0,6.28);g.fillStyle=rand()<.5?'rgba(3,8,15,.48)':'rgba(165,193,201,.10)';g.fill();g.strokeStyle='rgba(132,184,195,.10)';g.lineWidth=.7;g.stroke();}
 for(let i=0;i<12;i++){const a=rand()*6.28;g.beginPath();g.moveTo(Math.cos(a)*90,Math.sin(a)*90);let x=Math.cos(a)*60,y=Math.sin(a)*60;for(let j=0;j<5;j++){x+=rand()*22-11;y+=rand()*22-11;g.lineTo(x,y);}g.strokeStyle='rgba(0,5,12,.5)';g.lineWidth=1.8;g.stroke();g.strokeStyle=`rgba(${currentMapDef.theme.accent},.15)`;g.lineWidth=.45;g.stroke();}
 for(let k=0;k<3;k++){g.beginPath();g.ellipse(-8,-10,24+k*18,16+k*17,.4,Math.PI*.8,Math.PI*1.8);g.strokeStyle='rgba(152,182,185,.11)';g.lineWidth=.75;g.stroke();}
 mineralCache.set(key,c);return c;
}
drawObstaclesWorld=function(){originalObstacleDraw();for(const ob of obstacles){if(ob.type!=='rock'||ob.x+ob.r<view.l||ob.x-ob.r>view.r||ob.y+ob.r<view.t||ob.y-ob.r>view.b)continue;ctx.save();ctx.drawImage(stoneMaterial(ob),ob.x-ob.r*96/85,ob.y-ob.r*96/85,ob.r*192/85,ob.r*192/85);
 const source=Math.hypot(player.x-ob.x,player.y-ob.y)<Math.hypot(enemy.x-ob.x,enemy.y-ob.y)?player:enemy,col=source===player?CHARACTERS[player.charType].rim:HUNTERS[enemy.hunterType].rim,angle=Math.atan2(source.y-ob.y,source.x-ob.x),strength=currentMapDef.night?Math.max(0,1-Math.hypot(source.x-ob.x,source.y-ob.y)/420):.24;
 if(strength>0){ctx.beginPath();ctx.arc(ob.x,ob.y,ob.r*.96,angle-.75,angle+.75);ctx.strokeStyle=`rgba(${col},${strength*.6})`;ctx.lineWidth=1.4;ctx.stroke();}ctx.restore();}};
const materialStart=startGame;startGame=function(){materialStart();mineralCache.clear();};
function drawExpansionWorld(){
 if(lightAnchor){ctx.save();ctx.globalAlpha=Math.min(1,lightAnchor.life);const {x,y}=lightAnchor;const col=CHARACTERS.shuo.rim;PupilArt.orb(ctx,x,y,180,col,.08);statusRing(lightAnchor,180,col,1,true);ctx.fillStyle='#ffe4b6';ctx.translate(x,y);ctx.rotate(time*.3);ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(8,0);ctx.lineTo(0,17);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();ctx.restore();}
 for(const e of echoes){const warn=e.age<.75,r=warn?60:(e.age-.75)*400;ctx.save();PupilArt.orb(ctx,e.x,e.y,r||1,HUNTERS.sonar.rim,warn?.09:.02);statusRing(e,Math.max(1,r),HUNTERS.sonar.rim,warn?e.age/.75:1,warn);if(warn){ctx.fillStyle='#b2d8f2';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText('声环蓄力',e.x,e.y-78);}ctx.restore();}
 for(const g of gardens){ctx.save();const warn=g.age<.85,col=HUNTERS.briar.rim;PupilArt.orb(ctx,g.x,g.y,95,col,warn?.035:.16);statusRing(g,95,col,1,warn);ctx.translate(g.x,g.y);ctx.strokeStyle=`rgba(${col},${warn?.25:.7})`;ctx.lineWidth=2;
 for(let i=0;i<7;i++){ctx.save();ctx.rotate(i*Math.PI*2/7);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(24,-25,0,-(warn?22:65));ctx.lineTo(-6,-45);ctx.stroke();ctx.restore();}ctx.restore();}
}
function drawUI(){updateHUD();};
function drawPauseScreen(){};function drawDeathScreen(){};function drawWinScreen(){};function drawIntroScreen(){};
function drawCharPreview(rect,id){PupilArt.draw(ctx,id,rect.x+rect.w/2,rect.y+rect.h/2,Math.min(rect.w,rect.h)*.33,time);}
function drawHunterPreview(rect,id){PupilArt.draw(ctx,id,rect.x+rect.w/2,rect.y+rect.h/2,Math.min(rect.w,rect.h)*.33,time,'hunter');}

// Follow the controlled specimen in solo play; hold Tab to inspect the whole pursuit.
const originalCamera=updateCam;
updateCam=function(dt){
 if(gameState==='menu'||(!practiceMode&&enemyMode==='manual')||keys.tab){originalCamera(dt);return;}
 const ent=practiceMode?enemy:player,k=1-Math.exp(-4*dt),zoom=clamp(Math.min(W/1200,H/900),.28,1.1);
 cam.cx+=(ent.x-cam.cx)*k;cam.cy+=(ent.y-cam.cy)*k;cam.zoom+=(zoom-cam.zoom)*k;
 view.w=W/cam.zoom;view.h=H/cam.zoom;view.l=cam.cx-view.w/2;view.r=cam.cx+view.w/2;view.t=cam.cy-view.h/2;view.b=cam.cy+view.h/2;
};
const originalOffscreen=drawOffscreenSnailArrows;
drawOffscreenSnailArrows=function(){originalOffscreen();const other=practiceMode?player:enemy;if(other===enemy&&enemy.dying)return;const sx=(other.x-cam.cx)*cam.zoom+W/2,sy=(other.y-cam.cy)*cam.zoom+H/2;
 if(sx<30||sx>W-30||sy<30||sy>H-30){const dx=sx-W/2,dy=sy-H/2,angle=Math.atan2(dy,dx),k=Math.min((W/2-32)/Math.abs(dx),(H/2-62)/Math.abs(dy)),x=W/2+dx*k,y=H/2+dy*k,col=practiceMode?CHARACTERS[player.charType].rim:HUNTERS[enemy.hunterType].rim;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-4,-6);ctx.lineTo(-4,6);ctx.closePath();ctx.fillStyle=`rgb(${col})`;ctx.fill();ctx.rotate(-angle);ctx.font='10px PupilSans, sans-serif';ctx.textAlign=x>W-100?'right':x<100?'left':'center';ctx.fillText(practiceMode?'行者':HUNTERS[enemy.hunterType].name,x>W-100?-12:x<100?12:0,-14);ctx.restore();}
 drawMiniMap();
};
function drawMiniMap(){if(W<620)return;const size=116,x=W-size-24,y=H-size-84,s=size/WORLD;ctx.save();ctx.fillStyle='rgba(8,21,30,.82)';ctx.fillRect(x,y,size,size);ctx.strokeStyle='rgba(172,209,207,.23)';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,size-1,size-1);ctx.translate(x,y);
 ctx.fillStyle='rgba(132,160,170,.22)';for(const o of obstacles){ctx.beginPath();ctx.arc(o.x*s,o.y*s,Math.max(1,o.r*s),0,Math.PI*2);ctx.fill();}
 for(const n of snails){if(currentMapDef.night&&n.connectProgress<.1&&Math.hypot(n.x-player.x,n.y-player.y)>currentMapDef.lightPlayer&&!n.shrine)continue;ctx.fillStyle=n.connectProgress>=.999?'#e9d99a':'#a8a178';ctx.beginPath();ctx.arc(n.x*s,n.y*s,1.4,0,Math.PI*2);ctx.fill();}
 for(const [e,col] of [[player,CHARACTERS[player.charType].rim],[enemy,HUNTERS[enemy.hunterType].rim]]){ctx.fillStyle=`rgb(${col})`;ctx.beginPath();ctx.arc(e.x*s,e.y*s,2.6,0,Math.PI*2);ctx.fill();}
 ctx.strokeStyle='rgba(157,227,208,.32)';ctx.strokeRect(Math.max(0,view.l*s),Math.max(0,view.t*s),Math.min(size,view.w*s),Math.min(size,view.h*s));ctx.fillStyle='#849ca8';ctx.font='8px monospace';ctx.fillText('TAB / OVERVIEW',0,size+15);ctx.restore();}
