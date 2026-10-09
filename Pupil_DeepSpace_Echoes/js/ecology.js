/* Two deep-space biomes. Ecology is non-colliding and grants no combat buffs. */
Object.assign(MAP_DEFS,{
 tide:{id:'tide',name:'潮汐星庭',sub:'TIDAL GARDEN',desc:'月牙石庭 · 潮光蝠与蜗母在星流中飘游',night:false,
  detail:'蜿蜒的月牙石群与开阔水道。A1 潮光蝠、A2 蜗母构成观赏生态，不改变碰撞与战斗数值。',
  theme:{bg0:'#092027',bg1:'#061524',bg2:'#020711',accent:'108,218,207',accentDim:'76,155,164',obstacle:['#263b45','#142b37','#07151f','rgba(97,218,209,.3)']}},
 echo:{id:'echo',name:'回声漂原',sub:'ECHO DRIFT',desc:'空心环礁 · 环游鱼群与灯翼蛾沿光脉漂游',night:false,
  detail:'疏散的断环石礁与斜向漂流带。B1 环游鱼、B3 灯翼蛾构成观赏生态，不影响联结胜利条件。',
  theme:{bg0:'#101d31',bg1:'#081726',bg2:'#030814',accent:'135,201,223',accentDim:'94,144,184',obstacle:['#2d394e','#1b2b3b','#0a1723','rgba(124,205,235,.28)']}}
});
MAP_IDS.push('tide','echo');
const alienLife=[];
const baseMapData=initMapData;
initMapData=function(){
 baseMapData();alienLife.length=0;
 if(!['tide','echo'].includes(selectedMapId))return;
 obstacles.length=0;const rand=PupilArt.rng(Math.floor(Math.random()*1e8)),stone=(x,y,r)=>obstacles.push({x,y,r,type:'rock',seed:rand()*1000});
 const crescent=(x,y,r,a,span,n)=>{for(let i=0;i<n;i++){const t=a-span/2+span*i/(n-1);stone(x+Math.cos(t)*r,y+Math.sin(t)*r,28+rand()*16);}};
 if(selectedMapId==='tide'){
  crescent(880,740,205,.4,Math.PI*1.5,16);crescent(1500,1450,240,Math.PI+.3,Math.PI*1.45,18);crescent(2140,2250,190,-.5,Math.PI*1.48,15);
  alienLife.push({type:'manta',x:1250,y:620,r:92,phase:rand()*6},{type:'manta',x:2270,y:1370,r:67,phase:rand()*6},{type:'mother',x:750,y:1870,r:78,phase:rand()*6},{type:'mother',x:2080,y:680,r:65,phase:rand()*6});
 }else{
  crescent(1020,1120,215,.2,Math.PI*1.57,17);crescent(2060,1770,265,2.6,Math.PI*1.65,21);
  for(let i=0;i<13;i++)stone(520+i*155,2420-i*140,24+rand()*17);
  for(let i=0;i<4;i++)alienLife.push({type:'ringfish',x:600+i*580,y:800+(i%2)*1350,r:100+rand()*35,phase:rand()*6});
  alienLife.push({type:'moth',x:1480,y:520,r:60,phase:rand()*6},{type:'moth',x:2450,y:1130,r:50,phase:rand()*6},{type:'moth',x:620,y:1900,r:45,phase:rand()*6});
 }
 // Edge spawn lanes remain clear; decorative flora has no collider.
 for(let attempt=0;obstacles.length<82&&attempt<3000;attempt++){const x=370+rand()*(WORLD-740),y=370+rand()*(WORLD-740),r=24+rand()*32;if(obstacles.some(o=>Math.hypot(x-o.x,y-o.y)<r+o.r+65))continue;obstacles.push({x,y,r,type:rand()<.25?'membrane':'rock',seed:rand()*1000});}
 for(const a of alienLife){a.baseX=a.x;a.baseY=a.y;}
};
function updateEcology(dt){for(const a of alienLife){a.phase+=dt*(a.type==='mother'?.2:.45);a.x=a.baseX+Math.sin(a.phase)* (a.type==='mother'?5:90);a.y=a.baseY+Math.cos(a.phase*.7)*(a.type==='mother'?7:50);}}
function drawAlien(c,a,t){
 const {type,r}=a,col=type==='mother'?'239,215,148':type==='moth'?'146,216,242':'115,213,220';c.save();c.translate(a.x,a.y);c.rotate(Math.sin(a.phase)*.12);c.lineCap='round';PupilArt.orb(c,0,0,r*1.9,col,.10);
 if(type==='manta'){
  for(const side of [-1,1]){c.save();c.scale(side,1);const w=1+Math.sin(t*1.4+a.phase)*.12;c.beginPath();c.moveTo(0,-r*.3);c.bezierCurveTo(r*.4,-r*.25,r*w,-r*.95,r*1.22,-r*.5);c.bezierCurveTo(r*.87,r*.15,r*.5,r*.3,0,r*.17);const g=c.createLinearGradient(0,0,r,0);g.addColorStop(0,`rgba(${col},.45)`);g.addColorStop(1,`rgba(${col},.04)`);c.fillStyle=g;c.fill();c.strokeStyle=`rgba(${col},.55)`;c.lineWidth=1;c.stroke();for(let i=0;i<7;i++){c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(r*.4,-r*.15-i*r*.05,r*(.65+i*.065),-r*(.12+i*.07));c.strokeStyle=`rgba(${col},.16)`;c.lineWidth=.6;c.stroke();}c.restore();}
  c.beginPath();c.moveTo(0,-r*.5);c.quadraticCurveTo(-r*.2,0,0,r*.4);c.quadraticCurveTo(r*.15,0,0,-r*.5);c.fillStyle=`rgba(${col},.5)`;c.fill();c.beginPath();c.moveTo(0,r*.2);c.bezierCurveTo(r*.1,r*.7,-r*.2,r,Math.sin(t)*r*.18,r*1.35);c.strokeStyle=`rgba(${col},.6)`;c.lineWidth=1.5;c.stroke();
 }else if(type==='mother'){
  c.beginPath();c.ellipse(0,r*.45,r*.85,r*.2,0,0,Math.PI*2);c.fillStyle=`rgba(${col},.22)`;c.fill();const g=c.createRadialGradient(-r*.2,-r*.3,0,0,0,r);g.addColorStop(0,`rgba(${col},.35)`);g.addColorStop(.7,'rgba(97,117,110,.18)');g.addColorStop(1,`rgba(${col},.05)`);c.fillStyle=g;c.beginPath();c.arc(0,0,r*.73,0,Math.PI*2);c.fill();c.strokeStyle=`rgba(${col},.42)`;c.lineWidth=r*.014;c.stroke();c.beginPath();for(let i=0;i<120;i++){const ang=i*.145,rr=i/120*r*.65;i?c.lineTo(Math.cos(ang)*rr,Math.sin(ang)*rr):c.moveTo(0,0);}c.strokeStyle=`rgba(${col},.45)`;c.lineWidth=1;c.stroke();
  for(let i=0;i<5;i++){const ang=i*1.26+t*.13,x=Math.cos(ang)*r*1.12,y=Math.sin(ang)*r*.8;PupilArt.orb(c,x,y,9,col,.5);c.fillStyle=`rgba(${col},.8)`;c.beginPath();c.arc(x,y,2,0,Math.PI*2);c.fill();}
 }else if(type==='ringfish'){
  for(let i=0;i<7;i++){const ang=i*Math.PI*2/7+t*.17+a.phase,rr=r*(.9+Math.sin(t+i)*.05);c.save();c.translate(Math.cos(ang)*rr,Math.sin(ang)*rr*.58);c.rotate(ang+Math.PI/2);c.beginPath();c.moveTo(0,-19);c.bezierCurveTo(-7,0,-2,19,Math.sin(t*2+i)*7,34);c.bezierCurveTo(5,15,9,-2,0,-19);c.fillStyle=`rgba(${col},.24)`;c.fill();c.strokeStyle=`rgba(${col},.6)`;c.lineWidth=.8;c.stroke();c.restore();}
 }else if(type==='moth'){
  const wing=1+Math.sin(t*2.5+a.phase)*.16;for(const s of [-1,1]){c.save();c.scale(s,wing);c.beginPath();c.moveTo(0,-r*.24);c.bezierCurveTo(r*.55,-r*1.1,r*1.05,-r*.6,r*.5,r*.12);c.bezierCurveTo(r*.82,r*.75,r*.22,r*.78,0,r*.15);const g=c.createRadialGradient(0,0,0,r*.3,0,r);g.addColorStop(0,'rgba(255,226,163,.5)');g.addColorStop(.3,`rgba(${col},.32)`);g.addColorStop(1,`rgba(${col},.02)`);c.fillStyle=g;c.fill();c.strokeStyle=`rgba(${col},.55)`;c.lineWidth=1;c.stroke();for(let i=0;i<4;i++){c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(r*.35,-r*.3,r*(.35+i*.12),-r*(.2+i*.12));c.strokeStyle=`rgba(${col},.3)`;c.lineWidth=.6;c.stroke();}c.restore();}PupilArt.orb(c,0,0,r*.35,'255,210,125',.7);c.fillStyle='#fff0b7';c.beginPath();c.ellipse(0,0,r*.045,r*.2,0,0,Math.PI*2);c.fill();
 }
 c.restore();
}
function drawEcologyWorld(){
 if(!['tide','echo'].includes(currentMapDef.id))return;
 // Sparse bent luminous fronds cling to rocks, never form solid barriers.
 for(const ob of obstacles){if(ob.type!=='rock'||ob.x<view.l-100||ob.x>view.r+100||ob.y<view.t-100||ob.y>view.b+100)continue;ctx.save();ctx.translate(ob.x,ob.y);const rand=PupilArt.rng(Math.floor(ob.seed));for(let i=0;i<5;i++){const a=rand()*6.28,x=Math.cos(a)*ob.r*.8,y=Math.sin(a)*ob.r*.8,len=15+rand()*22;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.sin(time*.7+i)*9,y-len*.5,x+5,y-len);ctx.strokeStyle=`rgba(${currentMapDef.theme.accent},.24)`;ctx.lineWidth=.9;ctx.stroke();ctx.fillStyle='rgba(207,238,187,.6)';ctx.beginPath();ctx.arc(x+5,y-len,1.1,0,Math.PI*2);ctx.fill();}ctx.restore();}
 for(const a of alienLife){if(a.x<view.l-a.r*2||a.x>view.r+a.r*2||a.y<view.t-a.r*2||a.y>view.b+a.r*2)continue;drawAlien(ctx,a,time);}
}
const baseMapArt=PupilArt.map;
PupilArt.map=function(c,id,w,h,t=0){baseMapArt(c,id,w,h,t);if(!['tide','echo'].includes(id))return;c.save();const scale=Math.min(w/500,h/300);c.scale(scale,scale);const col=MAP_DEFS[id].theme.accent;c.strokeStyle=`rgba(${col},.5)`;c.lineWidth=15;for(let i=0;i<2;i++){c.beginPath();c.ellipse(140+i*190,150+i*25,62,48,-.4,0,Math.PI*1.55);c.stroke();}drawAlien(c,{type:id==='tide'?'manta':'moth',x:320,y:75,r:32,phase:.5},0);drawAlien(c,{type:id==='tide'?'mother':'ringfish',x:110,y:200,r:28,phase:.5},0);c.restore();};
