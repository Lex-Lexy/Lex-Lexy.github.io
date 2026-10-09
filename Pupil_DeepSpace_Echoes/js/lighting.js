/* Per-light occlusion: another light can fill a shadow. Circular stone colliders unchanged. */
const lightLayer=document.createElement('canvas'),lightLayerCtx=lightLayer.getContext('2d');
function nightSources(){
 const out=[{x:player.x,y:player.y,r:currentMapDef.lightPlayer||315,strength:1,col:CHARACTERS[player.charType].rim},{x:enemy.x,y:enemy.y,r:currentMapDef.lightEnemy||660,strength:enemy.dying?.3:.88,col:HUNTERS[enemy.hunterType].rim}];
 if(soulLight.active)out.push({x:soulLight.x,y:soulLight.y,r:180,strength:.7,col:'255,224,149'});
 if(lightAnchor)out.push({...lightAnchor,r:210,strength:.65,col:CHARACTERS.shuo.rim});
 for(const s of snails){if(!s.shrine&&s.connectProgress<.15&&!s.floating)continue;if(s.x<view.l-280||s.x>view.r+280||s.y<view.t-280||s.y>view.b+280)continue;out.push({x:s.x,y:s.y,r:s.shrine?260:s.floating?125:65+s.connectProgress*135,strength:s.shrine?.78:s.floating?.4:.3+s.connectProgress*.35,col:'238,211,139'});}
 return out.slice(0,12);
}
function shadowPolygon(g,s,o,expand=0){
 const dx=o.x-s.x,dy=o.y-s.y,d=Math.hypot(dx,dy);if(d<=o.r+1)return;
 const a=Math.atan2(dy,dx),half=Math.asin(Math.min(.999,(o.r+expand)/d)),near=Math.sqrt(Math.max(0,d*d-o.r*o.r)),far=s.r*1.7;
 g.beginPath();g.moveTo(s.x+Math.cos(a-half)*near,s.y+Math.sin(a-half)*near);g.lineTo(s.x+Math.cos(a-half)*far,s.y+Math.sin(a-half)*far);g.lineTo(s.x+Math.cos(a+half)*far,s.y+Math.sin(a+half)*far);g.lineTo(s.x+Math.cos(a+half)*near,s.y+Math.sin(a+half)*near);g.closePath();g.fill();
}
drawNightDarkness=function(){
 if(!currentMapDef.night)return;
 const q=Math.min(1,1000/W),w=Math.ceil(W*q),h=Math.ceil(H*q);if(darkCanvas.width!==w||darkCanvas.height!==h){darkCanvas.width=lightLayer.width=w;darkCanvas.height=lightLayer.height=h;}
 darkCtx.setTransform(1,0,0,1,0,0);darkCtx.globalCompositeOperation='source-over';darkCtx.fillStyle='rgba(2,5,12,.965)';darkCtx.fillRect(0,0,w,h);
 for(const source of nightSources()){
  const g=lightLayerCtx;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);g.save();g.scale(q,q);g.translate(W/2,H/2);g.scale(cam.zoom,cam.zoom);g.translate(-cam.cx,-cam.cy);
  const grad=g.createRadialGradient(source.x,source.y,source.r*.03,source.x,source.y,source.r);grad.addColorStop(0,`rgba(255,255,255,${source.strength})`);grad.addColorStop(.28,`rgba(255,255,255,${source.strength*.88})`);grad.addColorStop(.55,`rgba(255,255,255,${source.strength*.48})`);grad.addColorStop(.82,`rgba(255,255,255,${source.strength*.12})`);grad.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grad;g.beginPath();g.arc(source.x,source.y,source.r,0,Math.PI*2);g.fill();
  g.globalCompositeOperation='destination-out';for(const o of obstacles){if(o.type==='membrane'||Math.hypot(o.x-source.x,o.y-source.y)>source.r+o.r)continue;g.fillStyle='rgba(0,0,0,.16)';shadowPolygon(g,source,o,10);g.fillStyle='rgba(0,0,0,.3)';shadowPolygon(g,source,o,5);g.fillStyle='rgba(0,0,0,.99)';shadowPolygon(g,source,o,0);}
  g.restore();g.globalCompositeOperation='source-over';darkCtx.globalCompositeOperation='destination-out';darkCtx.drawImage(lightLayer,0,0);
  g.save();g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-in';g.fillStyle=`rgb(${source.col})`;g.fillRect(0,0,w,h);g.restore();ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.045;ctx.drawImage(lightLayer,0,0,W,H);ctx.restore();
 }
 ctx.save();ctx.globalCompositeOperation='source-over';ctx.drawImage(darkCanvas,0,0,W,H);ctx.restore();
};
