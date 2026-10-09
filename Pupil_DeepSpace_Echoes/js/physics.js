/* ========================= E. Blob Physics ============================== */
function setSoftDash(color, dashArr, dashOff, lineWidth, blur){
  ctx.setLineDash(dashArr);
  ctx.lineDashOffset = dashOff;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.shadowBlur = blur || (lineWidth * 6);
  ctx.shadowColor = color;
}
function clearSoftDash(){ ctx.setLineDash([]); ctx.shadowBlur = 0; }

function makeBlob(radius){
  const pts = [];
  for (let i=0; i<BLOB_VERTS; i++){
    const a = i/BLOB_VERTS * Math.PI*2;
    pts.push({ angle:a, x:Math.cos(a)*radius, y:Math.sin(a)*radius, vx:0, vy:0 });
  }
  return pts;
}
function resetBlob(ent, radius){ ent.blob = makeBlob(radius); ent.squeeze = 0; }
function resetBlobPositions(ent, radius){
  if (!ent.blob) return;
  for (const p of ent.blob){
    p.x = Math.cos(p.angle)*radius; p.y = Math.sin(p.angle)*radius;
    p.vx = 0; p.vy = 0;
  }
}
function updateBlobPhysics(ent, radius, canPassMembrane, dt){
  if (!ent.blob) return;
  const k = BLOB_SPRING, damp = BLOB_DAMP, push = BLOB_PUSH;
  const maxOff = radius * BLOB_MAX_OFF;
  const R2limit = radius + 60;
  const phasing = (ent === player) && player.phaseThrough > 0;
  for (let i=0; i<BLOB_VERTS; i++){
    const p = ent.blob[i];
    const wob = Math.sin(p.angle*3 + time*1.4)*BLOB_MEMBRANE_WOBBLE +
                Math.cos(p.angle*5 - time*1.9)*BLOB_MEMBRANE_WOBBLE*0.6;
    const restR = radius*(1+wob);
    const restX = Math.cos(p.angle)*restR;
    const restY = Math.sin(p.angle)*restR;
    const wx = ent.x + p.x, wy = ent.y + p.y;
    let ax = (restX - p.x)*k - p.vx*damp;
    let ay = (restY - p.y)*k - p.vy*damp;
    if (!phasing){
      for (let j=0; j<obstacles.length; j++){
        const ob = obstacles[j];
        if (canPassMembrane && ob.type === 'membrane') continue;
        const ddx = wx-ob.x, ddy = wy-ob.y;
        if (Math.abs(ddx) > R2limit || Math.abs(ddy) > R2limit) continue;
        const d = Math.hypot(ddx, ddy);
        if (d < ob.r && d > 0.001){
          const overlap = ob.r - d;
          const nx = ddx/d, ny = ddy/d;
          p.x += nx*overlap*push; p.y += ny*overlap*push;
          const vn = p.vx*nx + p.vy*ny;
          if (vn < 0){ p.vx -= vn*nx*0.6; p.vy -= vn*ny*0.6; }
        }
      }
    }
    p.vx += ax*dt; p.vy += ay*dt;
    p.x += p.vx*dt; p.y += p.vy*dt;
    const lo = Math.hypot(p.x, p.y);
    if (lo > maxOff){ const s = maxOff/lo; p.x *= s; p.y *= s; }
  }
}
function computeSqueeze(ent, radius){
  if (!ent.blob) return 0;
  let total = 0;
  for (let i=0; i<BLOB_VERTS; i++){
    const p = ent.blob[i];
    const rx = Math.cos(p.angle)*radius, ry = Math.sin(p.angle)*radius;
    total += Math.hypot(p.x-rx, p.y-ry);
  }
  return Math.min(1, total / (BLOB_VERTS*radius*0.35));
}
function constrainCenter(ent, hardR, canPassMembrane){
  if (ent === player && player.phaseThrough > 0) return;
  for (let i=0; i<obstacles.length; i++){
    const ob = obstacles[i];
    if (canPassMembrane && ob.type === 'membrane') continue;
    const dx = ent.x-ob.x, dy = ent.y-ob.y;
    const d = Math.hypot(dx, dy);
    const minD = ob.r + hardR;
    if (d < minD && d > 0.001){
      const nx = dx/d, ny = dy/d;
      ent.x = ob.x + nx*minD; ent.y = ob.y + ny*minD;
      const vn = ent.vx*nx + ent.vy*ny;
      if (vn < 0){ ent.vx -= vn*nx*0.7; ent.vy -= vn*ny*0.7; }
    }
  }
}
function resolveSnailCollision(ent, hardR){
  for (let i=0; i<snails.length; i++){
    const s = snails[i];
    if (s.hypnotized > 0.5) continue;
    const dx = ent.x - s.x, dy = ent.y - s.y;
    const d = Math.hypot(dx, dy);
    const minD = SNAIL_COLLIDE_R + hardR;
    if (d < minD && d > 0.001){
      const nx = dx/d, ny = dy/d;
      const overlap = minD - d;
      ent.x += nx*overlap; ent.y += ny*overlap;
      const vn = ent.vx*nx + ent.vy*ny;
      if (vn < 0){ ent.vx -= vn*nx*0.45; ent.vy -= vn*ny*0.45; }
    }
  }
}

