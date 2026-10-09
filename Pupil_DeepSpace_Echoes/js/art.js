/* Procedural specimen illustrations. No external fonts, images, or network requests. */
const PupilArt=(()=>{
 const TAU=Math.PI*2, cache=new Map();
 function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;};}
 function path(c,pts,close=false){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));if(close)c.closePath();}
 function line(c,pts,col,w=1){path(c,pts);c.strokeStyle=col;c.lineWidth=w;c.stroke();}
 function orb(c,x,y,r,col,a=.3){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${col},${a})`);g.addColorStop(.45,`rgba(${col},${a*.28})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 function circle(c,x,y,r,col,w=1){c.beginPath();c.arc(x,y,r,0,TAU);c.strokeStyle=col;c.lineWidth=w;c.stroke();}
 function specimen(c,id,x,y,r,t=0,kind='char',detail=true){
  const m=(kind==='hunter'?HUNTERS:CHARACTERS)[id];if(!m)return;
  const col=m.rim, rand=rng([...id].reduce((a,b)=>a+b.charCodeAt(0),77)), hunter=kind==='hunter';
  c.save();c.translate(x,y);c.scale(r/100,r/100);c.lineCap='round';c.lineJoin='round';
  orb(c,0,0,170,col,.25);const wob=Math.sin(t*1.1)*2;
  // Thin orbital diagrams behind the organism.
  if(detail){circle(c,0,0,130,`rgba(${col},.16)`,.6);c.save();c.rotate(t*.03);c.setLineDash([2,9]);circle(c,0,0,144,`rgba(${col},.23)`,.8);c.restore();
   for(let i=0;i<4;i++){const a=i*TAU/4+.35;line(c,[[Math.cos(a)*126,Math.sin(a)*126],[Math.cos(a)*151,Math.sin(a)*151]],`rgba(${col},.45)`,.6);}}
  // Organic appendages / rigid hunter armour, individually designed silhouettes.
  if(hunter){
   const n=id==='arachne'?8:id==='briar'?9:id==='sonar'?6:7;
   for(let i=0;i<n;i++){
    if(id==='arachne'){const a=i*TAU/n;const bend= a+((i%2)?.35:-.35);line(c,[[Math.cos(a)*58,Math.sin(a)*58],[Math.cos(bend)*117,Math.sin(bend)*117],[Math.cos(a+.17)*153,Math.sin(a+.17)*153]],`rgba(${col},.8)`,2.2);circle(c,Math.cos(bend)*117,Math.sin(bend)*117,3,`rgba(${col},.7)`,1);continue;}
    const a=i*TAU/n-Math.PI/2, len=id==='arachne'?156:id==='briar'?138:124;
    c.save();c.rotate(a);c.beginPath();c.moveTo(-20,-54);c.bezierCurveTo(-39,-78,-31,-len,-7,-len-8);c.bezierCurveTo(-24,-104,8,-96,22,-60);c.closePath();
    const g=c.createLinearGradient(-20,-55,0,-len);g.addColorStop(0,m.bg1);g.addColorStop(.55,`rgba(${col},.36)`);g.addColorStop(1,`rgba(${col},.03)`);c.fillStyle=g;c.fill();c.strokeStyle=`rgba(${col},.75)`;c.lineWidth=1.2;c.stroke();
    line(c,[[0,-68],[-18,-95],[-7,-len-8]],`rgba(${col},.8)`,.8);c.restore();
   }
   if(id==='eclipse'){c.save();c.rotate(-.5);c.beginPath();c.ellipse(0,0,109,74,0,0,TAU);c.strokeStyle=`rgba(${col},.48)`;c.lineWidth=2;c.stroke();c.restore();}
   if(id==='sonar')for(let i=0;i<3;i++)circle(c,0,0,104+i*12,`rgba(${col},${.4-i*.1})`,1);
   if(id==='smoke')for(let i=0;i<18;i++){const a=rand()*TAU;orb(c,Math.cos(a)*85,Math.sin(a)*85,30+rand()*30,col,.2);}
  }else{
   const n={su:6,yin:10,zhi:8,xuan:7,wu:12,jing:6,lan:10,shuo:12}[id]||6;
   for(let i=0;i<n;i++){
    const a=i*TAU/n, phase=a+t*.6, start=60, len=id==='yin'?126:id==='lan'?134:105;
    c.save();c.rotate(a);c.beginPath();c.moveTo(-12,-start);
    c.bezierCurveTo(-18-Math.sin(phase)*8,-96,-27,-len,-3,-len-7);
    c.bezierCurveTo(8,-102,22+Math.sin(phase)*5,-86,16,-start);c.closePath();
    const g=c.createLinearGradient(0,-start,0,-len);g.addColorStop(0,`rgba(${col},.4)`);g.addColorStop(1,`rgba(${col},.05)`);c.fillStyle=g;c.fill();c.strokeStyle=`rgba(${col},.55)`;c.lineWidth=.8;c.stroke();
    line(c,[[1,-65],[-6,-90],[-3,-len-7]],`rgba(${col},.64)`,.7);c.restore();
   }
   if(id==='su'||id==='xuan'){c.save();c.rotate(id==='su'?-.48:t*.12);for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,0,112-i*8,50+i*20,.4*i,0,TAU);c.strokeStyle=`rgba(${col},.32)`;c.lineWidth=.8;c.stroke();}c.restore();}
   if(id==='jing'||id==='shuo')for(let i=0;i<6;i++){c.save();c.rotate(i*TAU/6+.2);path(c,[[0,-92],[-8,-108],[0,-129],[8,-108]],true);c.fillStyle=`rgba(${col},.2)`;c.fill();c.strokeStyle=`rgba(${col},.8)`;c.stroke();c.restore();}
   if(id==='wu')for(let i=0;i<10;i++){const a=rand()*TAU;orb(c,Math.cos(a)*75,Math.sin(a)*75,38,col,.12);}
  }
  // A layered, pearlescent membrane.
  const pts=[];for(let i=0;i<=72;i++){const a=i/72*TAU;const rr=79+Math.sin(a*(hunter?6:3)+wob*.08)*4+Math.cos(a*5+.7)*2;pts.push([Math.cos(a)*rr,Math.sin(a)*rr]);}
  path(c,pts,true);const body=c.createRadialGradient(-24,-32,2,0,8,100);body.addColorStop(0,`rgba(${col},.62)`);body.addColorStop(.4,m.bg1);body.addColorStop(.84,m.bg2);body.addColorStop(1,`rgba(${col},.45)`);c.fillStyle=body;c.fill();c.strokeStyle=`rgba(${col},.9)`;c.lineWidth=1.4;c.stroke();
  c.save();path(c,pts,true);c.clip();
  // Lace-like cellular networks.
  for(let k=0;k<(detail?24:10);k++){
   const a=k*TAU/24, rad=42+rand()*30;c.beginPath();c.moveTo(Math.cos(a)*28,Math.sin(a)*28);c.bezierCurveTo(Math.cos(a+.14)*rad,Math.sin(a+.14)*rad,Math.cos(a-.14)*80,Math.sin(a-.14)*80,Math.cos(a+.2)*92,Math.sin(a+.2)*92);c.strokeStyle=`rgba(${col},${.16+rand()*.28})`;c.lineWidth=.55;c.stroke();
  }
  for(let i=0;i<(detail?80:15);i++){const a=rand()*TAU, rr=Math.sqrt(rand())*78;c.fillStyle=`rgba(${col},${rand()*.45})`;c.beginPath();c.arc(Math.cos(a)*rr,Math.sin(a)*rr,.4+rand()*1.5,0,TAU);c.fill();}
  orb(c,-24,-24,50,col,.26);
  // Complex iris, radial filaments, inner gold ring, a living slit pupil.
  const ir= hunter?37:39;const iris=c.createRadialGradient(0,0,8,0,0,ir);iris.addColorStop(0,'#0b131e');iris.addColorStop(.45,`rgba(${col},.9)`);iris.addColorStop(.7,`rgba(${col},.45)`);iris.addColorStop(1,'#081421');c.fillStyle=iris;c.beginPath();c.arc(0,0,ir,0,TAU);c.fill();
  for(let i=0;i<(detail?150:40);i++){const a=i*TAU/(detail?150:40);const inner=13+rand()*6, outer=ir-1+rand()*4;line(c,[[Math.cos(a)*inner,Math.sin(a)*inner],[Math.cos(a+.015)*outer,Math.sin(a+.015)*outer]],i%3?`rgba(${col},.64)`:'rgba(247,216,153,.45)',.4+rand()*.4);}
  circle(c,0,0,ir,'rgba(212,247,240,.6)',.7);circle(c,0,0,19,'rgba(232,216,166,.8)',.8);
  c.beginPath();c.ellipse(Math.sin(t*.3)*2,0,hunter?8:13,27,0,0,TAU);c.fillStyle='#02070d';c.fill();
  c.beginPath();c.ellipse(-17,-22,9,4,-.5,0,TAU);c.fillStyle='rgba(235,255,252,.9)';c.fill();c.beginPath();c.arc(15,17,2.5,0,TAU);c.fillStyle='rgba(245,255,250,.75)';c.fill();c.restore();
  // Specimen marks / bioluminescent accents.
  for(let i=0;i<5;i++){const a=i*TAU/5+.4;c.save();c.translate(Math.cos(a)*67,Math.sin(a)*67);c.rotate(a);line(c,[[-3,-2],[4,0],[-3,2]],`rgba(${col},.85)`,1);c.restore();}
  c.restore();
 }
 function sprite(id,kind='char'){const key=kind+id;if(!cache.has(key)){const c=document.createElement('canvas');c.width=c.height=512;specimen(c.getContext('2d'),id,256,256,145,0,kind,true);cache.set(key,c);}return cache.get(key);}
 function draw(c,id,x,y,r,t=0,kind='char'){const s=sprite(id,kind);c.save();c.translate(x,y);const p=1+Math.sin(t*1.7)*.018;c.scale(p,1/p);c.drawImage(s,-r*1.765,-r*1.765,r*3.53,r*3.53);c.restore();}
 function map(c,id,w,h,t=0){
  c.clearRect(0,0,w,h);const colors=id==='buildings'?'206,163,110':id==='night'?'164,138,226':'81,181,186';c.fillStyle='#09121c';c.fillRect(0,0,w,h);orb(c,w*.6,h*.4,w*.7,colors,.22);const rand=rng(id.length*132);
  c.strokeStyle=`rgba(${colors},.12)`;c.lineWidth=1;for(let i=0;i<5;i++){c.beginPath();c.ellipse(w*.5,h*.65,w*(.15+i*.085),h*(.12+i*.065),-.25,0,TAU);c.stroke();}
  for(let i=0;i<60;i++){c.fillStyle=`rgba(${colors},${.1+rand()*.5})`;c.fillRect(rand()*w,rand()*h,1,1);}
  if(id==='buildings'){for(let i=0;i<8;i++){let x=w*(.2+i*.08),y=h*(.25+rand()*.4),hh=20+rand()*50;c.fillStyle='#1b232d';c.fillRect(x,y,12,hh);line(c,[[x,y],[x+12,y],[x+12,y+hh]],`rgba(${colors},.55)`,1);}}
  if(id==='night'){orb(c,w*.5,h*.5,40,'238,204,134',.6);circle(c,w*.5,h*.5,16,'rgba(238,204,134,.8)',1);}
  if(id==='void'){for(let i=0;i<6;i++){const x=w*(.16+rand()*.7),y=h*(.2+rand()*.6);circle(c,x,y,8+rand()*12,`rgba(${colors},.6)`,1);}}
 }
 return {specimen,draw,sprite,map,orb,rng};
})();
