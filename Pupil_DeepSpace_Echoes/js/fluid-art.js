/* Living gel material. Render-only: never changes entity or collision vertices. */
const PupilFluid=(()=>{
 const TAU=Math.PI*2,irises=new Map();
 function outline(c,points){const n=points.length,a=points[n-1],b=points[0];c.beginPath();c.moveTo((a.x+b.x)/2,(a.y+b.y)/2);for(let i=0;i<n;i++){const p=points[i],q=points[(i+1)%n];c.quadraticCurveTo(p.x,p.y,(p.x+q.x)/2,(p.y+q.y)/2);}c.closePath();}
 function iris(id,kind){const key=kind+id;if(irises.has(key))return irises.get(key);const m=(kind==='hunter'?HUNTERS:CHARACTERS)[id],col=m.rim,c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),rand=PupilArt.rng([...key].reduce((s,v)=>s+v.charCodeAt(0),4));g.translate(128,128);
  const a=g.createRadialGradient(0,0,12,0,0,117);a.addColorStop(0,'#050b17');a.addColorStop(.28,`rgba(${col},.95)`);a.addColorStop(.63,`rgba(${col},.65)`);a.addColorStop(.9,'#081c2e');a.addColorStop(1,`rgba(${col},.2)`);g.fillStyle=a;g.beginPath();g.arc(0,0,117,0,TAU);g.fill();
  for(let i=0;i<230;i++){const t=i*TAU/230;g.beginPath();const r=33+rand()*12;g.moveTo(Math.cos(t)*r,Math.sin(t)*r);g.quadraticCurveTo(Math.cos(t+.07)*80,Math.sin(t+.07)*80,Math.cos(t)*113,Math.sin(t)*113);g.strokeStyle=i%5===0?'rgba(255,220,154,.65)':`rgba(${col},${.2+rand()*.65})`;g.lineWidth=.4+rand()*1.2;g.stroke();}
  g.strokeStyle='rgba(240,234,185,.6)';g.lineWidth=1.5;g.beginPath();g.arc(0,0,43,0,TAU);g.stroke();g.fillStyle='#010810';g.beginPath();g.ellipse(0,0,kind==='hunter'?21:47,58,0,0,TAU);g.fill();g.strokeStyle='rgba(222,255,252,.5)';g.beginPath();g.arc(0,0,115,0,TAU);g.stroke();irises.set(key,c);return c;
 }

 function drawSignature(c,id,r,t,col,pts){
  c.save();c.lineWidth=Math.max(.35,r*.007);c.strokeStyle=`rgba(${col},.25)`;
  if(['su','xuan','lan','sonar','eclipse'].includes(id)){const count=id==='sonar'?3:2;for(let i=0;i<count;i++){c.beginPath();c.ellipse(0,0,r*(.64+i*.12),r*(id==='lan'?.62:.4+i*.17),t*(id==='xuan'?.3:.08)+i*.7,0,TAU);c.stroke();}}
  if(['yin','zhi','pale','arachne','briar'].includes(id)){const n=id==='arachne'?8:id==='briar'?7:id==='yin'?4:6;for(let i=0;i<n;i++){const a=i*TAU/n+t*.04,p=pts[Math.floor(i*pts.length/n)];c.beginPath();c.moveTo(Math.cos(a)*r*.46,Math.sin(a)*r*.46);c.quadraticCurveTo(Math.cos(a+.15)*r*.7,Math.sin(a+.15)*r*.7,p.x*.9,p.y*.9);c.stroke();for(const side of [-1,1]){c.beginPath();c.moveTo(Math.cos(a)*r*.64,Math.sin(a)*r*.64);c.quadraticCurveTo(Math.cos(a+side*.15)*r*.77,Math.sin(a+side*.15)*r*.77,Math.cos(a+side*.23)*r*.84,Math.sin(a+side*.23)*r*.84);c.stroke();}}}
  if(['wu','smoke','crimson'].includes(id))for(let i=0;i<5;i++){const a=i*1.6+t*.2;PupilArt.orb(c,Math.cos(a)*r*.6,Math.sin(a)*r*.6,r*.45,col,id==='smoke'?.19:.1);}
  if(['jing','shuo'].includes(id)){c.rotate(Math.sin(t*.3)*.5);c.strokeStyle=`rgba(${col},.2)`;c.lineWidth=r*.05;c.beginPath();c.ellipse(0,0,r*.7,r*.55,-.45,-.3,Math.PI*1.1);c.stroke();}
  c.restore();
 }
 function draw(c,id,x,y,r,t=0,kind='char',blob=null,vx=0,vy=0,detail=true){
  const m=(kind==='hunter'?HUNTERS:CHARACTERS)[id];if(!m)return;const col=m.rim,seed=[...id].reduce((s,v)=>s+v.charCodeAt(0),0),speed=Math.min(1,Math.hypot(vx,vy)/550),angle=Math.atan2(vy,vx),pts=blob||Array.from({length:48},(_,i)=>{const a=i*TAU/48,lobes=({yin:4,zhi:5,xuan:3,wu:6,jing:2,lan:3,shuo:5,arachne:8,briar:7,sonar:3})[id]||3,rr=r*(1+.045*Math.sin(a*lobes+t*1.6+seed)+.024*Math.sin(a*7-t*2.1));return {x:Math.cos(a)*rr,y:Math.sin(a)*rr};});
  c.save();c.translate(x,y);c.lineCap='round';c.lineJoin='round';
  PupilArt.orb(c,0,0,r*2.15,col,.13);
  // Long translucent wakes sway independently, anchored to the actual membrane.
  if(!blob||speed>.12){c.save();c.rotate(blob?angle:Math.sin(t*.4)*.15-.3);for(let i=0;i<5;i++){const s=(i-2)*r*.27,start=-r*.72,wave=Math.sin(t*2+i+seed)*r*.16,len=r*(.65+speed*.9+i*.09);c.beginPath();c.moveTo(start,s);c.bezierCurveTo(start-len*.4,s+wave,start-len*.8,s-wave*.8,start-len,s+wave*.4);c.strokeStyle=`rgba(${col},${.09+i*.022})`;c.lineWidth=r*(.10-i*.013);c.stroke();c.strokeStyle=`rgba(${col},.3)`;c.lineWidth=Math.max(.35,r*.006);c.stroke();}c.restore();}
  outline(c,pts);const body=c.createRadialGradient(-r*.36,-r*.48,0,0,r*.1,r*1.2);body.addColorStop(0,`rgba(${col},.68)`);body.addColorStop(.26,`rgba(${col},.34)`);body.addColorStop(.58,`rgba(${col},.13)`);body.addColorStop(.84,`rgba(${col},.25)`);body.addColorStop(1,`rgba(${col},.64)`);c.fillStyle=body;c.fill();
  c.save();outline(c,pts);c.clip();
  const rim=c.createLinearGradient(-r,-r,r,r);rim.addColorStop(0,'rgba(233,255,254,.5)');rim.addColorStop(.35,`rgba(${col},.18)`);rim.addColorStop(.7,'rgba(9,30,47,.3)');rim.addColorStop(1,`rgba(${col},.42)`);outline(c,pts);c.strokeStyle=rim;c.lineWidth=r*.16;c.stroke();
  for(let k=0;k<7;k++){const a=k*2.1+t*.13,rad=r*.55;PupilArt.orb(c,Math.cos(a)*rad,Math.sin(a)*rad,r*.42,col,.07);}
  // Caustic ribbons, veins and moving grains are all clipped to the soft contour.
  for(let j=0;j<9;j++){const a=t*.26+j*.83+seed,s=Math.sin(a),k=Math.cos(a),p=pts[(j*5)%pts.length],q=pts[(j*5+19)%pts.length];c.beginPath();c.moveTo(p.x,p.y);c.bezierCurveTo(r*s*.8,r*k*.65,-r*k*.85,r*s*.9,q.x,q.y);c.strokeStyle=j%3===0?'rgba(251,220,157,.12)':`rgba(${col},${.07+.06*Math.sin(a*2)**2})`;c.lineWidth=r*(.035+.035*Math.sin(a)**2);c.stroke();c.strokeStyle=j%3===0?'rgba(255,238,193,.3)':`rgba(${col},.33)`;c.lineWidth=Math.max(.35,r*.008);c.stroke();}
  const n=detail?64:30;for(let i=0;i<n;i++){const a=i*2.39996+t*(.14+(i%5)*.045)+seed,rad=r*(.22+.72*((i*17%61)/61)),px=Math.cos(a)*rad+Math.sin(t*1.1+i)*r*.06,py=Math.sin(a)*rad*.91+Math.cos(t*.9+i)*r*.06,alpha=.2+.6*(.5+.5*Math.sin(t*2+i));c.fillStyle=i%7===0?`rgba(255,225,146,${alpha})`:`rgba(${col},${alpha})`;c.beginPath();c.arc(px,py,r*(i%7===0?.014:.008)+.18,0,TAU);c.fill();if(i%13===0){c.strokeStyle=`rgba(${col},.18)`;c.lineWidth=r*.006;c.beginPath();c.arc(px,py,r*.035,0,TAU);c.stroke();}}
  drawSignature(c,id,r,t,col,pts);
  // The iris drifts inside the gel instead of remaining welded to a sprite.
  let cx=0,cy=0;for(const p of pts){cx+=p.x;cy+=p.y;}cx=cx/pts.length*.24+Math.sin(t*.8+seed)*r*.025;cy=cy/pts.length*.24+Math.cos(t*.7+seed)*r*.025;cx+=Math.cos(angle)*speed*r*.07;cy+=Math.sin(angle)*speed*r*.07;
  const ir=r*(kind==='hunter'?.47:.43)*(1+.015*Math.sin(t*1.6));c.drawImage(iris(id,kind),cx-ir,cy-ir,ir*2,ir*2);PupilArt.orb(c,-r*.32,-r*.36,r*.48,col,.24);
  c.fillStyle='rgba(238,255,253,.78)';c.beginPath();c.ellipse(cx-ir*.35,cy-ir*.43,ir*.22,ir*.075,-.6,0,TAU);c.fill();
  c.save();c.translate(-r*.18,-r*.5);c.rotate(-.45+Math.sin(t*.5)*.12);const glint=c.createLinearGradient(-r*.5,0,r*.5,0);glint.addColorStop(0,'rgba(240,255,253,0)');glint.addColorStop(.45,'rgba(240,255,253,.62)');glint.addColorStop(1,'rgba(240,255,253,0)');c.fillStyle=glint;c.beginPath();c.ellipse(0,0,r*.45,r*.045,0,0,TAU);c.fill();c.restore();
  // Moving grazing highlights make compression and rebound clearly readable.
  for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length],a=i*TAU/pts.length,h=.06+.45*Math.max(0,Math.cos(a+2.1))+.16*Math.sin(a*3-t*1.8)**6;c.beginPath();c.moveTo(p.x*.96,p.y*.96);c.lineTo(q.x*.96,q.y*.96);c.strokeStyle=`rgba(229,255,252,${h})`;c.lineWidth=Math.max(.4,r*.012);c.stroke();}
  if(kind==='hunter'){const count=id==='arachne'?8:id==='briar'?7:4;for(let i=0;i<count;i++){const p=pts[Math.floor(i*pts.length/count)];c.beginPath();c.moveTo(p.x*.9,p.y*.9);c.quadraticCurveTo(p.x*.48+r*Math.sin(t+i)*.1,p.y*.55,p.x*.3,p.y*.3);c.strokeStyle=`rgba(${col},.5)`;c.lineWidth=r*.013;c.stroke();}}
  c.restore();outline(c,pts);c.strokeStyle=`rgba(${col},.83)`;c.lineWidth=Math.max(.6,r*.017);c.stroke();c.restore();
 }
 return {draw,outline,iris};
})();
// Game selection, result screen and laboratory share the same living material.
PupilArt.draw=(c,id,x,y,r,t=0,kind='char')=>PupilFluid.draw(c,id,x,y,r,t,kind,null,0,0,r>40);
