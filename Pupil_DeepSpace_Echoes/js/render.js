/* ============================== M. Rendering ============================ */

function drawBoundsWorld(){
  const theme = currentMapDef.theme;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(${theme.accent},0.32)`;
  ctx.lineWidth = 3/cam.zoom;
  ctx.shadowBlur = 30; ctx.shadowColor = `rgba(${theme.accent},0.75)`;
  ctx.strokeRect(0, 0, WORLD, WORLD);
  ctx.restore();
}

function drawStoneBody(ob, fogActive, tint, glowCol, edgeLight){
  const N = 18;
  ctx.beginPath();
  for (let j=0; j<=N; j++){
    const a = j/N*Math.PI*2;
    const wob = 1 + Math.sin(a*4+ob.seed)*0.06 + Math.cos(a*7-ob.seed*0.7)*0.035 + Math.sin(a*11+ob.seed*1.3)*0.02;
    const rr = ob.r*wob;
    const px = ob.x + Math.cos(a)*rr, py = ob.y + Math.sin(a)*rr;
    if (j===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const rg = ctx.createRadialGradient(ob.x-ob.r*0.32, ob.y-ob.r*0.38, ob.r*0.05, ob.x, ob.y, ob.r*1.05);
  rg.addColorStop(0.00, tint[0]);
  rg.addColorStop(0.45, tint[1]);
  rg.addColorStop(0.85, tint[2]);
  rg.addColorStop(1.00, '#000');
  ctx.globalAlpha = fogActive ? 0.4 : 1;
  ctx.fillStyle = rg; ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  if (edgeLight > 0){
    ctx.strokeStyle = glowCol;
    ctx.lineWidth = 1.4 + edgeLight * 2.2;
    ctx.shadowBlur = 8 + edgeLight * 18;
    ctx.shadowColor = glowCol;
  } else {
    ctx.strokeStyle = glowCol;
    ctx.lineWidth = 1.6;
    ctx.shadowBlur = 0;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/* 长板：一体化胶囊 */
function drawPlankGroup(ob, fogActive, edgeLight){
  const cx = ob.plankCX, cy = ob.plankCY;
  const a = ob.plankAngle;
  const hx = Math.cos(a) * ob.plankHalfLen;
  const hy = Math.sin(a) * ob.plankHalfLen;
  const x1 = cx - hx, y1 = cy - hy;
  const x2 = cx + hx, y2 = cy + hy;
  const w = ob.plankWidth * 2;
  const theme = currentMapDef.theme;

  ctx.save();
  ctx.globalAlpha = fogActive ? 0.5 : 1;
  ctx.lineCap = 'round';

  // 外层边缘光晕
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(${theme.accent},${0.35 + edgeLight*0.55})`;
  ctx.lineWidth = w + 6;
  ctx.shadowBlur = 8 + edgeLight * 18;
  ctx.shadowColor = `rgba(${theme.accent},0.9)`;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.shadowBlur = 0;

  // 主体（深石）
  ctx.globalCompositeOperation = 'source-over';
  const gradPerp = ctx.createLinearGradient(
    cx + Math.cos(a + Math.PI/2) * ob.plankWidth,
    cy + Math.sin(a + Math.PI/2) * ob.plankWidth,
    cx - Math.cos(a + Math.PI/2) * ob.plankWidth,
    cy - Math.sin(a + Math.PI/2) * ob.plankWidth
  );
  gradPerp.addColorStop(0, '#0a1020');
  gradPerp.addColorStop(0.35, '#3a4a5e');
  gradPerp.addColorStop(0.65, '#2a3648');
  gradPerp.addColorStop(1, '#0a1020');
  ctx.strokeStyle = gradPerp;
  ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

  // 内层高光
  ctx.strokeStyle = 'rgba(180,200,230,0.18)';
  ctx.lineWidth = w * 0.35;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

  // 石纹（横向细线）
  ctx.strokeStyle = `rgba(${theme.accent},0.35)`;
  ctx.lineWidth = 1.2;
  const nx = Math.cos(a + Math.PI/2), ny = Math.sin(a + Math.PI/2);
  for (let k = -1; k <= 1; k++){
    if (k === 0) continue;
    const off = k * ob.plankWidth * 0.5;
    ctx.beginPath();
    ctx.moveTo(x1 + nx*off, y1 + ny*off);
    ctx.lineTo(x2 + nx*off, y2 + ny*off);
    ctx.stroke();
  }

  // 边缘描边
  ctx.strokeStyle = `rgba(${theme.accent},0.55)`;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

  ctx.restore();
}

/* 危墙：一体化内质网 */
function drawWallGroup(ob, fogActive, edgeLight){
  const cx = ob.wallCenterX, cy = ob.wallCenterY;
  const baseAngle = ob.wallBaseAngle;
  const arcSpan = ob.wallArcSpan;
  const layers = [148, 110, 74, 42];
  const startA = baseAngle - arcSpan/2;
  const endA = baseAngle + arcSpan/2;
  const theme = currentMapDef.theme;

  ctx.save();
  ctx.globalAlpha = fogActive ? 0.5 : 1;
  ctx.lineCap = 'round';

  // 外层光晕
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(160,120,90,${0.3 + edgeLight*0.6})`;
  ctx.lineWidth = 42;
  ctx.shadowBlur = 8 + edgeLight * 16;
  ctx.shadowColor = 'rgba(160,120,90,0.9)';
  for (let li = 0; li < layers.length; li++){
    ctx.beginPath(); ctx.arc(cx, cy, layers[li], startA, endA); ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // 每一层画粗弧
  ctx.globalCompositeOperation = 'source-over';
  const tints = ['#3a3430','#302a26','#282420','#22201c'];
  for (let li = 0; li < layers.length; li++){
    const R = layers[li];
    // 主体
    ctx.strokeStyle = tints[li];
    ctx.lineWidth = 32;
    ctx.beginPath(); ctx.arc(cx, cy, R, startA, endA); ctx.stroke();
    // 内高光
    ctx.strokeStyle = 'rgba(200,180,160,0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, R - 11, startA, endA); ctx.stroke();
    // 上沿
    ctx.strokeStyle = 'rgba(255,220,180,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R + 12, startA, endA); ctx.stroke();
  }

  // 层间径向勾连（画成纤维状细线）
  for (let li = 0; li < layers.length - 1; li++){
    const r1 = layers[li], r2 = layers[li+1];
    const midR = (r1 + r2) / 2;
    const connectors = 3 + (li % 2);
    for (let c = 0; c < connectors; c++){
      const t = (c + 0.5) / connectors;
      const a = baseAngle + (t - 0.5) * arcSpan * 0.85;
      const x1 = cx + Math.cos(a) * r1;
      const y1 = cy + Math.sin(a) * r1;
      const x2 = cx + Math.cos(a) * r2;
      const y2 = cy + Math.sin(a) * r2;
      // 主体
      ctx.strokeStyle = '#2a2420';
      ctx.lineWidth = 18;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      // 中线高光
      ctx.strokeStyle = 'rgba(180,160,140,0.22)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
  }

  ctx.restore();
}

function drawObstaclesWorld(){
  const theme = currentMapDef.theme;
  const fogActive = (player.fogTimer > 0 || player.blindTimer > 0);
  const isNight = !!currentMapDef.night;
  const drawnGroups = new Set();

  for (const ob of obstacles){
    const pad = ob.r + 90;
    if (ob.x < view.l-pad || ob.x > view.r+pad || ob.y < view.t-pad || ob.y > view.b+pad) continue;

    let edgeLight = 0;
    if (isNight){
      const dP = Math.hypot(player.x-ob.x, player.y-ob.y);
      const dE = Math.hypot(enemy.x-ob.x, enemy.y-ob.y);
      const range = 340;
      const lp = Math.max(0, 1 - dP/range);
      const le = Math.max(0, 1 - dE/range) * 0.6;
      edgeLight = Math.max(lp, le);
    }

    if (ob.type === 'plank'){
      if (ob.plankKey !== undefined){
        if (drawnGroups.has('P'+ob.plankKey)) continue;
        drawnGroups.add('P'+ob.plankKey);
      }
      drawPlankGroup(ob, fogActive, edgeLight);
      continue;
    }
    if (ob.type === 'wall'){
      if (ob.wallKey !== undefined){
        if (drawnGroups.has('W'+ob.wallKey)) continue;
        drawnGroups.add('W'+ob.wallKey);
      }
      drawWallGroup(ob, fogActive, edgeLight);
      continue;
    }
    if (ob.type === 'shrine'){
      drawStoneBody(ob, fogActive, ['#4a4248','#2a242c','#0c0810'], 'rgba(255,220,150,0.6)', edgeLight);
      continue;
    }
    if (ob.type === 'altar'){
      drawStoneBody(ob, fogActive, ['#6a5a3a','#3a2e1c','#0a0604'], 'rgba(255,220,120,0.9)', edgeLight);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const amp = isNight ? 1 : 0.7;
      const pu = 0.5 + 0.5*Math.sin(time*2.2);
      ctx.strokeStyle = `rgba(255,220,120,${(0.4 + pu*0.5) * amp})`;
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 22; ctx.shadowColor = 'rgba(255,220,120,0.95)';
      ctx.beginPath(); ctx.arc(ob.x, ob.y, ob.r*0.7, 0, Math.PI*2); ctx.stroke();
      if (isNight){
        const gg = ctx.createRadialGradient(ob.x, ob.y, 0, ob.x, ob.y, ob.r * 3);
        gg.addColorStop(0, `rgba(255,240,180,${0.35 + pu*0.20})`);
        gg.addColorStop(0.5, `rgba(255,220,120,${0.12 + pu*0.08})`);
        gg.addColorStop(1, 'rgba(255,200,80,0)');
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(ob.x, ob.y, ob.r*3, 0, Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
      continue;
    }

    if (ob.type === 'rock'){
      const N = 20;
      ctx.beginPath();
      for (let j=0; j<=N; j++){
        const a = j/N*Math.PI*2;
        const wob = 1 + Math.sin(a*4+ob.seed)*0.055 + Math.cos(a*7-ob.seed*0.7)*0.032 + Math.sin(a*11+ob.seed*1.3)*0.018;
        const rr = ob.r*wob;
        const px = ob.x + Math.cos(a)*rr, py = ob.y + Math.sin(a)*rr;
        if (j===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      const rg = ctx.createRadialGradient(ob.x-ob.r*0.32, ob.y-ob.r*0.38, ob.r*0.05, ob.x, ob.y, ob.r*1.05);
      rg.addColorStop(0.00, theme.obstacle[0]);
      rg.addColorStop(0.45, theme.obstacle[1]);
      rg.addColorStop(0.85, theme.obstacle[2]);
      rg.addColorStop(1.00, '#000');
      ctx.globalAlpha = fogActive ? 0.3 : 1;
      ctx.fillStyle = rg; ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      if (edgeLight > 0){
        ctx.strokeStyle = `rgba(${theme.accent},${0.4 + edgeLight*0.6})`;
        ctx.lineWidth = 1.6 + edgeLight*2;
        ctx.shadowBlur = 6 + edgeLight*18;
        ctx.shadowColor = `rgba(${theme.accent},0.9)`;
      } else {
        ctx.strokeStyle = theme.obstacle[3];
        ctx.lineWidth = 1.6;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    } else {
      ctx.globalCompositeOperation = 'lighter';
      const mg = ctx.createRadialGradient(ob.x, ob.y, ob.r*0.25, ob.x, ob.y, ob.r);
      mg.addColorStop(0.00, `rgba(${theme.accent},0.015)`);
      mg.addColorStop(0.72, `rgba(${theme.accent},0.10)`);
      mg.addColorStop(0.93, `rgba(${theme.accent},0.26)`);
      mg.addColorStop(1.00, `rgba(${theme.accent},0)`);
      ctx.globalAlpha = fogActive ? 0.25 : 1;
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(ob.x, ob.y, ob.r, 0, Math.PI*2); ctx.fill();
      ctx.beginPath();
      ctx.arc(ob.x, ob.y, ob.r * 0.94, 0, Math.PI*2);
      const col = `rgba(${theme.accent},0.5)`;
      setSoftDash(col, [4, 8], -time*18, 1.4/Math.max(0.4, cam.zoom), 10);
      ctx.stroke();
      clearSoftDash();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}
function drawExplosionFlashes(){
  for (const f of explosionFlashes){
    const t = f.time / f.maxTime;
    const a = 1 - t;
    const r = f.radius * (0.3 + t * 0.7);
    ctx.globalCompositeOperation = 'lighter';
    if (f.ring){
      ctx.strokeStyle = `rgba(${f.color},${a*0.9})`;
      ctx.lineWidth = 6 * (1 - t*0.7);
      ctx.shadowBlur = 30;
      ctx.shadowColor = `rgba(${f.color},0.9)`;
      ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${a*0.7})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(f.x, f.y, r * 0.85, 0, Math.PI * 2); ctx.stroke();
    }
    const cg = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r * 0.6);
    cg.addColorStop(0, `rgba(255,255,255,${a*0.9})`);
    cg.addColorStop(0.4, `rgba(${f.color},${a*0.6})`);
    cg.addColorStop(1, `rgba(${f.color},0)`);
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(f.x, f.y, r * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }
}
function drawSnail(s){
  const p = s.connectProgress, hyp = s.hypnotized;
  const isNight = !!currentMapDef.night;
  const nightDim = isNight && p <= 0.01 && !s.hypnotized && !s.shrine && !s.floating;

  let r, g, b;
  if (hyp > 0.01){
    const hr = 60 + hyp*40, hg = 8 + hyp*8, hb = 20 + hyp*20;
    r = Math.round((150 + p*105)*(1-hyp) + hr*hyp);
    g = Math.round((110 + p*140)*(1-hyp) + hg*hyp);
    b = Math.round((18 + p*80)*(1-hyp) + hb*hyp);
  } else {
    r = Math.round(150 + p*105); g = Math.round(110 + p*140); b = Math.round(18 + p*80);
  }
  ctx.save(); ctx.translate(s.x, s.y);
  const attached = s.attached && s.attachOb;
  if (attached && hyp < 0.5){
    ctx.rotate(s.attachAngle); ctx.scale(0.82, 1.18); ctx.rotate(-s.attachAngle);
  }
  ctx.globalCompositeOperation = 'lighter';
  if (!nightDim){
    const lightK = isNight ? Math.min(1, Math.max(0.15, p)) : (0.16 + p*0.22 + hyp*0.15);
    const glowR = SNAIL_RADIUS*(2.4 + p*0.9);
    const gg = ctx.createRadialGradient(0,0,0,0,0,glowR);
    gg.addColorStop(0, `rgba(${r},${g},${b},${lightK})`);
    gg.addColorStop(1, `rgba(${r},${Math.max(0,g-40)},0,0)`);
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0,0,glowR,0,Math.PI*2); ctx.fill();
  }
  if (isNight && s.shrine){
    const pulse = 0.7 + 0.3 * Math.sin(time * 2.2);
    const g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, 110);
    g2.addColorStop(0, `rgba(255,240,180,${0.7 * pulse})`);
    g2.addColorStop(0.5, `rgba(255,220,120,${0.3 * pulse})`);
    g2.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.arc(0, 0, 110, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  const N = 48; const pts = [];
  for (let i=0; i<=N; i++){
    const a = i/N*Math.PI*2;
    const wob = 1 + Math.sin(a*3 + s.phase + time*0.55)*0.075
                  + Math.cos(a*5 + s.phase*0.7 + time*0.35)*0.05
                  + Math.sin(a*8 - time*0.8 + s.bob)*0.03;
    const rr = SNAIL_RADIUS*wob;
    pts.push([Math.cos(a)*rr, Math.sin(a)*rr]);
  }
  ctx.beginPath();
  for (let i=0; i<pts.length; i++){
    if (i===0) ctx.moveTo(pts[i][0], pts[i][1]); else ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  const bg = ctx.createRadialGradient(-SNAIL_RADIUS*0.28, -SNAIL_RADIUS*0.40, SNAIL_RADIUS*0.1, 0, 0, SNAIL_RADIUS*1.1);
  bg.addColorStop(0.00, `rgba(${Math.min(255,r+50)},${Math.min(255,g+50)},${Math.min(255,b+50)},1)`);
  bg.addColorStop(0.40, `rgba(${r},${g},${b},1)`);
  bg.addColorStop(0.78, `rgba(${Math.max(40,r-60)},${Math.max(20,g-60)},${b},1)`);
  bg.addColorStop(1.00, `rgba(${Math.max(20,r-100)},${Math.max(10,g-80)},${b},1)`);
  ctx.fillStyle = bg; ctx.fill();
  for (const h of s.holes){
    const pulse = 1 + Math.sin(time*1.1 + h.phase)*0.14;
    const hr = h.r*pulse;
    const hg2 = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, hr);
    hg2.addColorStop(0.00, `rgba(20,10,4,${0.85 - p*0.20 + hyp*0.1})`);
    hg2.addColorStop(0.55, `rgba(60,40,10,${0.40 - p*0.12})`);
    hg2.addColorStop(1.00, `rgba(100,80,26,0)`);
    ctx.fillStyle = hg2; ctx.beginPath(); ctx.arc(h.x, h.y, hr, 0, Math.PI*2); ctx.fill();
  }
  if (!nightDim){
    ctx.globalCompositeOperation = 'lighter';
    for (let i=0; i<8; i++){
      const seed = i*43.7;
      const a = seed + time*0.10;
      const rr = SNAIL_RADIUS*(0.42 + 0.40*Math.sin(seed*1.3));
      const bx = Math.cos(a)*rr, by = Math.sin(a)*rr;
      const bs = 2.6 + Math.sin(time*1.4+seed)*1.3;
      const gr = ctx.createRadialGradient(bx, by, 0, bx, by, bs*2);
      gr.addColorStop(0, `rgba(${Math.min(255,r+50)},${Math.min(255,g+40)},${b+40},${0.42+p*0.30})`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(bx, by, bs*2, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.beginPath();
  for (let i=0; i<pts.length; i++){
    if (i===0) ctx.moveTo(pts[i][0], pts[i][1]); else ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  ctx.strokeStyle = `rgba(${r},${g},${b},${0.45+p*0.42})`;
  ctx.lineWidth = 1.5 + p*0.8; ctx.stroke();
  if (p > 0.01){
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(${r},${g},60,${0.25+p*0.65})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, SNAIL_RADIUS*1.45, -Math.PI/2, -Math.PI/2 + p*Math.PI*2);
    ctx.shadowBlur = 10;
    ctx.shadowColor = `rgba(${r},${g},60,0.7)`;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  if (p >= 0.999 && hyp < 0.5){
    const pu = 0.5 + 0.5*Math.sin(time*5);
    ctx.strokeStyle = `rgba(255,245,140,${0.4+pu*0.5})`;
    ctx.lineWidth = 2.6;
    ctx.shadowBlur = 14;
    ctx.shadowColor = 'rgba(255,245,140,0.9)';
    ctx.beginPath(); ctx.arc(0, 0, SNAIL_RADIUS*(1.58+pu*0.18), 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  if (attached && hyp < 0.5){
    ctx.globalCompositeOperation = 'lighter';
    const padGrad = ctx.createRadialGradient(0, SNAIL_RADIUS*0.7, 0, 0, SNAIL_RADIUS*0.7, SNAIL_RADIUS*0.75);
    padGrad.addColorStop(0, `rgba(${r},${g},${Math.max(0,b-10)},0.55)`);
    padGrad.addColorStop(1, `rgba(${r},${g},${Math.max(0,b-10)},0)`);
    ctx.fillStyle = padGrad;
    ctx.beginPath();
    ctx.ellipse(0, SNAIL_RADIUS*0.72, SNAIL_RADIUS*0.62, SNAIL_RADIUS*0.22, 0, 0, Math.PI*2);
    ctx.fill();
  }
  if (s.inVortex){
    ctx.globalCompositeOperation = 'lighter';
    const col = `rgba(200,140,255,${0.5 + 0.4*Math.sin(time*4)})`;
    setSoftDash(col, [5, 8], -time*40, 2, 12);
    ctx.beginPath(); ctx.arc(0, 0, SNAIL_RADIUS*1.65, 0, Math.PI*2); ctx.stroke();
    clearSoftDash();
  }
  if (hyp > 0.15){
    ctx.globalCompositeOperation = 'lighter';
    const a = hyp * (0.5 + 0.5*Math.sin(time*2.6));
    const col = `rgba(180,20,60,${a*0.8})`;
    setSoftDash(col, [5, 8], -time*20, 2, 12);
    ctx.beginPath(); ctx.arc(0, 0, SNAIL_RADIUS*1.75, 0, Math.PI*2); ctx.stroke();
    clearSoftDash();
  }
  if (s.shrine && hyp < 0.5){
    ctx.globalCompositeOperation = 'lighter';
    const pu = 0.5 + 0.5*Math.sin(time*2.6);
    ctx.strokeStyle = `rgba(255,230,150,${0.5 + pu*0.4})`;
    ctx.lineWidth = 2.2;
    ctx.shadowBlur = 20; ctx.shadowColor = 'rgba(255,230,150,0.9)';
    ctx.beginPath(); ctx.arc(0, 0, SNAIL_RADIUS*2.0, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([6, 8]);
    ctx.lineDashOffset = -time*30;
    ctx.beginPath(); ctx.arc(0, 0, SNAIL_RADIUS*2.6, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
  }
  if (s.floating && hyp < 0.5){
    ctx.globalCompositeOperation = 'lighter';
    const pu = 0.5 + 0.5*Math.sin(time*2.2);
    ctx.strokeStyle = `rgba(160,200,255,${0.5 + pu*0.4})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 9]);
    ctx.lineDashOffset = time*22;
    ctx.beginPath(); ctx.arc(0, 0, SNAIL_RADIUS*2.2, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}
function drawSnailsWorld(){
  for (const s of snails){
    const pad = SNAIL_RADIUS*4;
    if (s.x < view.l-pad || s.x > view.r+pad || s.y < view.t-pad || s.y > view.b+pad) continue;
    drawSnail(s);
  }
}
function drawSoulLight(){
  if (!soulLight.active) return;
  const x = soulLight.x, y = soulLight.y;
  if (x < view.l-120 || x > view.r+120 || y < view.t-120 || y > view.b+120) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pu = 0.7 + 0.3*Math.sin(time*4);
  const R = 26 * pu;
  const g = ctx.createRadialGradient(x, y, 0, x, y, R*4);
  g.addColorStop(0, 'rgba(255,250,220,1)');
  g.addColorStop(0.3, 'rgba(255,230,150,0.7)');
  g.addColorStop(0.7, 'rgba(255,200,90,0.2)');
  g.addColorStop(1, 'rgba(255,180,60,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, R*4, 0, Math.PI*2); ctx.fill();
  const orbitA = time*2.6;
  for (let i=0; i<4; i++){
    const t = i/4;
    const a = orbitA - t*1.4;
    const rr = 12 + t*22;
    const sx = x + Math.cos(a)*rr, sy = y + Math.sin(a)*rr;
    ctx.fillStyle = `rgba(255,235,160,${(1-t)*0.6})`;
    ctx.beginPath(); ctx.arc(sx, sy, 3 - t*2, 0, Math.PI*2); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,220,0.95)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI*2); ctx.stroke();
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}
function drawTrailsWorld(){
  const char=CHARACTERS[player.charType];
  if(!trailPalette.has(player.charType)){const [r,g,b]=char.rim.split(',').map(Number);trailPalette.set(player.charType,[makeSprite(r*.4,g*.4,b*.5),makeSprite(r,g,b)]);}
  const [deep,core]=trailPalette.get(player.charType);
  ctx.globalCompositeOperation = 'lighter';
  const pad = 90;
  for (const p of trails){
    if (p.x < view.l-pad || p.x > view.r+pad || p.y < view.t-pad || p.y > view.b+pad) continue;
    const ii = Math.min(1.5, p.i);
    const t = Math.min(1, ii/1.5);
    let a = Math.min(1, ii)*ALPHA_K;
    let size = 40*(0.72 + t*0.55);
    if (p.isSpark){ size *= 0.35; a *= 1.6; }
    let drawDeep = true, drawCore = true;
    if (p.isPurple){
      const ps = size * 0.22;
      ctx.globalAlpha = a*(1 - t*0.55);
      ctx.fillStyle = `rgba(190,120,255,0.9)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, ps*0.55, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = a*t*1.2;
      ctx.fillStyle = `rgba(230,200,255,0.95)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, ps*0.28, 0, Math.PI*2); ctx.fill();
      drawDeep = false; drawCore = false;
    } else if (p.isBurning){
      ctx.globalAlpha = a*(1 - t*0.55);
      ctx.fillStyle = `rgba(255,140,40,0.95)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, size*0.65, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = a*t*1.2;
      ctx.fillStyle = `rgba(255,240,120,1.0)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, size*0.4, 0, Math.PI*2); ctx.fill();
      drawDeep = false; drawCore = false;
    } else if (p.isFrost){
      ctx.globalAlpha = a*(1 - t*0.55);
      ctx.fillStyle = `rgba(100,210,255,0.95)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, size*0.65, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = a*t*1.2;
      ctx.fillStyle = `rgba(220,250,255,1.0)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, size*0.4, 0, Math.PI*2); ctx.fill();
      drawDeep = false; drawCore = false;
    }
    if (drawDeep){
      ctx.globalAlpha = a*(1 - t*0.55);
      ctx.drawImage(deep, p.x-size*0.5, p.y-size*0.5, size, size);
    }
    if (drawCore && t > 0.05){
      ctx.globalAlpha = a*t*1.20;
      ctx.drawImage(core, p.x-size*0.5, p.y-size*0.5, size, size);
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
function drawMarkerWorld(){
  if (player.charType !== 'su' || !player.markerPlaced) return;
  const x = player.markerX, y = player.markerY;
  if (x < view.l-100 || x > view.r+100 || y < view.t-100 || y > view.b+100) return;
  ctx.save(); ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';
  const pu = 0.5 + 0.5*Math.sin(time*2.5);
  const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, 70);
  gg.addColorStop(0, `rgba(80,140,255,${0.35 + pu*0.15})`);
  gg.addColorStop(0.6, `rgba(60,100,220,${0.15})`);
  gg.addColorStop(1, 'rgba(40,80,180,0)');
  ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2);
  const col1 = `rgba(140,190,255,${0.5 + pu*0.3})`;
  ctx.strokeStyle = col1; ctx.lineWidth = 2;
  ctx.shadowBlur = 12; ctx.shadowColor = col1;
  ctx.stroke(); ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI*2);
  const col2 = `rgba(100,160,255,${0.35 + pu*0.25})`;
  setSoftDash(col2, [6, 8], -time*22, 1.5, 14);
  ctx.stroke(); clearSoftDash();
  ctx.strokeStyle = `rgba(200,230,255,${0.7 + pu*0.3})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.moveTo(0, -8); ctx.lineTo(0, 8);
  ctx.stroke();
  ctx.restore(); ctx.globalCompositeOperation = 'source-over';
}
function drawVortexWorld(){
  if (player.charType !== 'xuan' || player.vortexActive <= 0) return;
  const x = player.vortexX, y = player.vortexY;
  if (x < view.l-500 || x > view.r+500 || y < view.t-500 || y > view.b+500) return;
  ctx.save(); ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';
  const alpha = Math.min(1, player.vortexActive / 1.5);
  ctx.globalAlpha = alpha * 0.35;
  const g1 = ctx.createRadialGradient(0, 0, VORTEX_RADIUS*0.6, 0, 0, VORTEX_RADIUS);
  g1.addColorStop(0, 'rgba(160,100,255,0)');
  g1.addColorStop(0.85, 'rgba(160,100,255,0.20)');
  g1.addColorStop(1, 'rgba(200,140,255,0)');
  ctx.fillStyle = g1;
  ctx.beginPath(); ctx.arc(0, 0, VORTEX_RADIUS, 0, Math.PI*2); ctx.fill();
  for (let layer=0; layer<3; layer++){
    const spd = 1.2 + layer*0.4;
    const rr = VORTEX_RADIUS * (0.55 - layer*0.10);
    ctx.save(); ctx.rotate(time * spd);
    ctx.globalAlpha = alpha * (0.4 - layer*0.08);
    ctx.beginPath();
    for (let i=0; i<=40; i++){
      const a = i/40 * Math.PI * 2;
      const wob = 1 + Math.sin(a*3 + time*2)*0.15;
      const rr2 = rr * wob;
      const px = Math.cos(a)*rr2, py = Math.sin(a)*rr2;
      if (i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    const g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
    g2.addColorStop(0, 'rgba(255,200,255,0.6)');
    g2.addColorStop(0.5, 'rgba(190,120,255,0.35)');
    g2.addColorStop(1, 'rgba(120,60,220,0)');
    ctx.fillStyle = g2; ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = alpha * 0.8;
  const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
  cg.addColorStop(0, 'rgba(255,240,255,0.9)');
  cg.addColorStop(1, 'rgba(180,100,255,0)');
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}
function drawSmokeProjectilesWorld(){
  for (const p of smokeProjectiles){
    if (p.x < view.l-60 || p.x > view.r+60 || p.y < view.t-60 || p.y > view.b+60) continue;
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * 2.4);
    g.addColorStop(0, 'rgba(50, 40, 70, 0.65)');
    g.addColorStop(0.5, 'rgba(30, 20, 50, 0.35)');
    g.addColorStop(1, 'rgba(10, 5, 20, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, p.r * 2.4, 0, Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    const g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
    g2.addColorStop(0, 'rgba(80, 70, 100, 0.95)');
    g2.addColorStop(0.6, 'rgba(40, 30, 60, 0.85)');
    g2.addColorStop(1, 'rgba(15, 10, 30, 0.3)');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(10, 5, 20, 0.9)';
    ctx.beginPath(); ctx.arc(0, 0, p.r * 0.45, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
}
function drawPlayerSmokeAttachment(){
  if (player.smokeStacks <= 0 && player.smokeSlow <= 0) return;
  const R = PLAYER_R;
  ctx.save(); ctx.translate(player.x, player.y);
  ctx.globalCompositeOperation = 'source-over';
  const stack = player.smokeStacks;
  for (let i=0; i<Math.min(stack, 10); i++){
    const angle = (i / 10) * Math.PI * 2 + time * 0.8;
    const dist_ = R * 1.5;
    const px = Math.cos(angle) * dist_, py = Math.sin(angle) * dist_;
    const g = ctx.createRadialGradient(px, py, 0, px, py, R * 0.85);
    g.addColorStop(0, 'rgba(60, 45, 80, 0.85)');
    g.addColorStop(1, 'rgba(10, 5, 20, 0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, R * 0.85, 0, Math.PI*2); ctx.fill();
  }
  const g = ctx.createRadialGradient(0, 0, R * 0.8, 0, 0, R * 1.9);
  g.addColorStop(0, 'rgba(25, 18, 40, 0.4)');
  g.addColorStop(1, 'rgba(10, 5, 20, 0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 1.9, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}
function drawShadowWorld(){
  if (!shadow.active || shadow.visualR < 1) return;
  ctx.save(); ctx.globalCompositeOperation = 'source-over';
  const R = shadow.visualR;
  const pulse = 1 + Math.sin(time*1.6)*0.03;
  const Rr = R * pulse;
  ctx.globalAlpha = 0.55;
  ctx.drawImage(SHADOW_TEX, shadow.x - Rr*2.4, shadow.y - Rr*2.4, Rr*4.8, Rr*4.8);
  ctx.globalAlpha = 0.95;
  ctx.drawImage(SHADOW_TEX, shadow.x - Rr, shadow.y - Rr, Rr*2, Rr*2);
  ctx.globalCompositeOperation = 'lighter';
  for (let layer=0; layer<3; layer++){
    const a = 0.15 + layer*0.06;
    const speed = 0.20 + layer*0.14;
    const dirSign = layer % 2 === 0 ? 1 : -1;
    const rr = R * (0.48 - layer*0.10);
    ctx.save(); ctx.translate(shadow.x, shadow.y); ctx.rotate(time * speed * dirSign);
    ctx.globalAlpha = a;
    ctx.beginPath();
    for (let i=0; i<=36; i++){
      const ang = i/36 * Math.PI*2;
      const wob = 1 + Math.sin(ang*3 + time*1.3 + layer*2.1)*0.22 + Math.cos(ang*5 - time*1.7)*0.10;
      const px = Math.cos(ang)*rr*wob, py = Math.sin(ang)*rr*wob;
      if (i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
    g.addColorStop(0, 'rgba(255,40,90,0.55)');
    g.addColorStop(0.5, 'rgba(180,20,60,0.30)');
    g.addColorStop(1, 'rgba(60,0,20,0)');
    ctx.fillStyle = g; ctx.fill(); ctx.restore();
  }
  ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.arc(shadow.x, shadow.y, Rr*0.72, 0, Math.PI*2);
  const col = `rgba(255,60,120,${0.5 + 0.3*Math.sin(time*3)})`;
  ctx.strokeStyle = col; ctx.lineWidth = 2.5;
  ctx.shadowBlur = 16; ctx.shadowColor = col;
  ctx.stroke(); ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
  const coreG = ctx.createRadialGradient(shadow.x, shadow.y, 0, shadow.x, shadow.y, Rr*0.42);
  coreG.addColorStop(0, 'rgba(0,0,0,1)');
  coreG.addColorStop(0.7, 'rgba(0,0,0,0.95)');
  coreG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = coreG;
  ctx.beginPath(); ctx.arc(shadow.x, shadow.y, Rr*0.45, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}
function drawOffscreenSnailArrows(){
  const cx = W/2, cy = H/2;
  const maxR = Math.min(W, H) * 0.42;
  const offscreen = [];
  for (const s of snails){
    const sx = (s.x - cam.cx) * cam.zoom + cx;
    const sy = (s.y - cam.cy) * cam.zoom + cy;
    const onScreen = (sx >= 0 && sx <= W && sy >= 0 && sy <= H);
    const isNightShrine = currentMapDef.night && s.shrine;
    if (onScreen && !isNightShrine) continue;
    offscreen.push({ s, sx, sy, d: Math.hypot(s.x - player.x, s.y - player.y) });
  }
  offscreen.sort((a, b) => a.d - b.d);
  const show = offscreen.slice(0, 4);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  try { ctx.filter = 'blur(1.8px)'; } catch(_){}
  for (const o of show){
    const s = o.s;
    const dx = o.sx - cx, dy = o.sy - cy;
    const a = Math.atan2(dy, dx);
    const ix = cx + Math.cos(a) * maxR, iy = cy + Math.sin(a) * maxR;
    const sizeMul = s.shrine ? 0.75 : 0.5;
    const prog = s.connectProgress;
    let alpha = 0.22 + prog * 0.28;
    let colStr = '255, 220, 180';
    if (s.shrine){ alpha = 0.85; colStr = '255, 220, 120'; }
    else if (s.floating){ colStr = '160, 200, 255'; }
    ctx.save(); ctx.translate(ix, iy); ctx.rotate(a);
    ctx.fillStyle = `rgba(${colStr}, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(6 * sizeMul, 0);
    ctx.lineTo(-4 * sizeMul, -4 * sizeMul);
    ctx.lineTo(-4 * sizeMul, 4 * sizeMul);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  try { ctx.filter = 'none'; } catch(_){}
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}
function drawArcBetween(x1, y1, x2, y2, colPrefix, strength, spread, minA){
  const ddx = x2-x1, ddy = y2-y1;
  const len = Math.hypot(ddx, ddy) || 1;
  const px = -ddy/len, py = ddx/len;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let arc=0; arc<2; arc++){
    const segs = 14;
    ctx.beginPath();
    for (let i=0; i<=segs; i++){
      const t = i/segs;
      const shape = Math.sin(t*Math.PI);
      const wave = Math.sin(t*12 + time*9 + arc*3.7)*spread*shape;
      const jitter = (Math.random()-0.5)*6*shape;
      const off = wave + jitter;
      const sx = x1 + ddx*t + px*off, sy = y1 + ddy*t + py*off;
      if (i===0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = `${colPrefix} ${Math.max(minA, 0.28*strength)})`;
    ctx.lineWidth = 7 - arc*1.6; ctx.stroke();
    ctx.strokeStyle = `${colPrefix} ${Math.max(minA*1.8, 0.68*strength)})`;
    ctx.lineWidth = 2.6 - arc*0.6; ctx.stroke();
    ctx.strokeStyle = `rgba(240,255,245,${Math.min(0.92, 0.6 + strength*0.4)})`;
    ctx.lineWidth = 1.0; ctx.stroke();
  }
  const flash = 8 + 6*Math.sin(time*11);
  for (const pos of [[x1,y1],[x2,y2]]){
    const fx = pos[0], fy = pos[1];
    const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, flash);
    fg.addColorStop(0, `rgba(230,255,240,${0.72*strength})`);
    fg.addColorStop(0.5, `${colPrefix} ${0.32*strength})`);
    fg.addColorStop(1, `${colPrefix} 0)`);
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(fx, fy, flash, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
function drawSnailGreenArcsWorld(){
  for (const s of snails){
    if (s.boostActive < 0.05 || s.connectProgress < 0.02) continue;
    if (s.hypnotized > 0.4) continue;
    const strength = s.boostActive * s.connectProgress;
    if (strength < 0.02) continue;
    drawArcBetween(player.x, player.y, s.x, s.y, 'rgba(90,255,130,', strength, 14, 0.30);
  }
}
function drawSnailBlackArcsWorld(){
  for (const s of snails){
    if (s.connectProgress < 0.28) continue;
    const dx = enemy.x - s.x, dy = enemy.y - s.y;
    const d = Math.hypot(dx, dy);
    if (d > SNAIL_SLOW_RANGE) continue;
    const strength = s.connectProgress*(1 - d/SNAIL_SLOW_RANGE);
    if (strength < 0.05) continue;
    const x1 = s.x, y1 = s.y, x2 = enemy.x, y2 = enemy.y;
    const ddx = x2-x1, ddy = y2-y1;
    const len = Math.hypot(ddx, ddy) || 1;
    const px = -ddy/len, py = ddx/len;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let arc=0; arc<2; arc++){
      const segs = 14;
      ctx.beginPath();
      for (let i=0; i<=segs; i++){
        const t = i/segs;
        const shape = Math.sin(t*Math.PI);
        const wave = Math.sin(t*14 + time*11 + arc*5.3)*16*shape;
        const jitter = (Math.random()-0.5)*8*shape;
        const off = wave + jitter;
        const sx = x1 + ddx*t + px*off, sy = y1 + ddy*t + py*off;
        if (i===0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = `rgba(130,60,220,${0.32*strength})`;
      ctx.lineWidth = 8 - arc*2; ctx.stroke();
      ctx.strokeStyle = `rgba(60,20,120,${0.55*strength})`;
      ctx.lineWidth = 4 - arc*0.8; ctx.stroke();
    }
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
}
function buildBlobPath(blob, cx, cy, scale){
  const N = blob.length;
  if (!N) return;
  const last = blob[N-1], first = blob[0];
  const sxLast = last.x*scale, syLast = last.y*scale;
  const sxFirst = first.x*scale, syFirst = first.y*scale;
  ctx.beginPath();
  ctx.moveTo(cx + (sxLast+sxFirst)*0.5, cy + (syLast+syFirst)*0.5);
  for (let i=0; i<N; i++){
    const cur = blob[i], next = blob[(i+1) % N];
    const cxp = cx + cur.x*scale, cyp = cy + cur.y*scale;
    const mx = cx + (cur.x+next.x)*0.5*scale, my = cy + (cur.y+next.y)*0.5*scale;
    ctx.quadraticCurveTo(cxp, cyp, mx, my);
  }
  ctx.closePath();
}


function drawSpiderlingsWorld(){
  for (const sp of spiderlings){
    if (sp.x < view.l-80 || sp.x > view.r+80 || sp.y < view.t-80 || sp.y > view.b+80) continue;
    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(Math.atan2(sp.vy, sp.vx));
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, SPIDERLING_R*3);
    g.addColorStop(0, 'rgba(180,255,120,0.55)');
    g.addColorStop(1, 'rgba(60,160,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, SPIDERLING_R*3, 0, Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(140,220,80,0.85)';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    for (const leg of sp.legs){
      const wob = Math.sin(time * 12 + leg.angle) * 2;
      const ex = Math.cos(leg.angle) * leg.len + wob;
      const ey = Math.sin(leg.angle) * leg.len + wob;
      const mx = Math.cos(leg.angle) * leg.len * 0.6;
      const my = Math.sin(leg.angle) * leg.len * 0.6 - 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(mx, my - 3, ex, ey);
      ctx.stroke();
    }
    const bg = ctx.createRadialGradient(-2, -2, 0, 0, 0, SPIDERLING_R);
    bg.addColorStop(0, 'rgba(200,255,140,0.95)');
    bg.addColorStop(0.6, 'rgba(80,180,60,0.9)');
    bg.addColorStop(1, 'rgba(20,60,10,0.85)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(0, 0, SPIDERLING_R, 0, Math.PI*2); ctx.fill();
    const hpR = Math.max(0, sp.hp / sp.maxHp);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, SPIDERLING_R*1.5, -Math.PI/2, -Math.PI/2 + hpR*Math.PI*2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,180,0.95)';
    ctx.beginPath(); ctx.arc(3, -3, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-1, -4, 1.2, 0, Math.PI*2); ctx.fill();
    if (sp.pulledTimer > 0){
      ctx.globalCompositeOperation = 'lighter';
      const col = `rgba(180,255,200,${0.7 * (sp.pulledTimer/0.4)})`;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 12; ctx.shadowColor = col;
      ctx.beginPath(); ctx.arc(0, 0, SPIDERLING_R*1.9, 0, Math.PI*2); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    if (sp.speedMul && sp.speedMul < 1){
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(200,180,255,0.5)`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(0, 0, SPIDERLING_R*2.1, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
}
function drawAttackArcsWorld(){
  if (attackIntensity < 0.01) return;
  const x1 = player.x, y1 = player.y, x2 = enemy.x, y2 = enemy.y;
  const dx = x2-x1, dy = y2-y1;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy/len, py = dx/len;
  const I = attackIntensity;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let a=0; a<3; a++){
    const segments = 16;
    const startT = a*0.04, endT = 1 - a*0.04;
    ctx.beginPath();
    for (let i=0; i<=segments; i++){
      const t = startT + (endT-startT)*(i/segments);
      const shape = Math.sin(t*Math.PI);
      const noise = Math.sin(t*18 + time*32 + a*7.1)*20*shape;
      const jitter = (Math.random()-0.5)*10*shape;
      const off = noise + jitter;
      const sx = x1 + dx*t + px*off, sy = y1 + dy*t + py*off;
      if (i===0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = `rgba(120,190,255,${(0.30-a*0.06)*I})`;
    ctx.lineWidth = 8 - a*1.8; ctx.stroke();
    ctx.strokeStyle = `rgba(180,230,255,${(0.75-a*0.15)*I})`;
    ctx.lineWidth = 3.2 - a*0.7; ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${(0.95-a*0.20)*I})`;
    ctx.lineWidth = 1.2; ctx.stroke();
  }
  const flashSize = 14 + I*20 + Math.random()*8;
  const fg = ctx.createRadialGradient(x1, y1, 0, x1, y1, flashSize);
  fg.addColorStop(0, `rgba(230,245,255,${0.75*I})`);
  fg.addColorStop(0.5, `rgba(120,200,255,${0.30*I})`);
  fg.addColorStop(1, 'rgba(60,140,255,0)');
  ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x1, y1, flashSize, 0, Math.PI*2); ctx.fill();
  const hitSize = 10 + I*16 + Math.random()*6;
  const hg = ctx.createRadialGradient(x2, y2, 0, x2, y2, hitSize);
  hg.addColorStop(0, `rgba(255,255,255,${0.65*I})`);
  hg.addColorStop(0.5, `rgba(255,180,120,${0.30*I})`);
  hg.addColorStop(1, 'rgba(255,80,30,0)');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(x2, y2, hitSize, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}

function drawNightDarkness(){
  if (!currentMapDef || !currentMapDef.night) return;
  ensureDarkCanvas();
  darkCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
  darkCtx.globalCompositeOperation = 'source-over';
  darkCtx.fillStyle = 'rgba(0, 0, 4, 0.985)';
  darkCtx.fillRect(0, 0, W, H);

  darkCtx.globalCompositeOperation = 'destination-out';
  const pr = (currentMapDef.lightPlayer || 210) * cam.zoom;
  const er = (currentMapDef.lightEnemy || 440) * cam.zoom;
  const px = (player.x - cam.cx) * cam.zoom + W/2;
  const py = (player.y - cam.cy) * cam.zoom + H/2;
  const ex = (enemy.x - cam.cx) * cam.zoom + W/2;
  const ey = (enemy.y - cam.cy) * cam.zoom + H/2;

  const gE = darkCtx.createRadialGradient(ex, ey, er*0.15, ex, ey, er);
  gE.addColorStop(0.00, 'rgba(0,0,0,1)');
  gE.addColorStop(0.55, 'rgba(0,0,0,0.92)');
  gE.addColorStop(0.85, 'rgba(0,0,0,0.35)');
  gE.addColorStop(1.00, 'rgba(0,0,0,0)');
  darkCtx.fillStyle = gE;
  darkCtx.beginPath(); darkCtx.arc(ex, ey, er, 0, Math.PI*2); darkCtx.fill();

  const gP = darkCtx.createRadialGradient(px, py, pr*0.15, px, py, pr);
  gP.addColorStop(0.00, 'rgba(0,0,0,1)');
  gP.addColorStop(0.55, 'rgba(0,0,0,0.92)');
  gP.addColorStop(0.85, 'rgba(0,0,0,0.30)');
  gP.addColorStop(1.00, 'rgba(0,0,0,0)');
  darkCtx.fillStyle = gP;
  darkCtx.beginPath(); darkCtx.arc(px, py, pr, 0, Math.PI*2); darkCtx.fill();

  if (soulLight.active){
    const sx = (soulLight.x - cam.cx) * cam.zoom + W/2;
    const sy = (soulLight.y - cam.cy) * cam.zoom + H/2;
    const sr = 180 * cam.zoom;
    const gS = darkCtx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    gS.addColorStop(0, 'rgba(0,0,0,1)');
    gS.addColorStop(0.6, 'rgba(0,0,0,0.6)');
    gS.addColorStop(1, 'rgba(0,0,0,0)');
    darkCtx.fillStyle = gS;
    darkCtx.beginPath(); darkCtx.arc(sx, sy, sr, 0, Math.PI*2); darkCtx.fill();
  }

  for (const s of snails){
    const p = s.connectProgress;
    if (p <= 0.01 && s.hypnotized < 0.3 && !s.shrine && !s.floating) continue;
    const sx = (s.x - cam.cx) * cam.zoom + W/2;
    const sy = (s.y - cam.cy) * cam.zoom + H/2;
    let sr = (60 + p*140) * cam.zoom;
    let strength = 0.25 + p*0.7;
    if (s.shrine){ sr = 260 * cam.zoom; strength = 0.95; }
    else if (s.floating){ sr = 140 * cam.zoom; strength = 0.6; }
    const gS = darkCtx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    gS.addColorStop(0, `rgba(0,0,0,${strength})`);
    gS.addColorStop(0.5, `rgba(0,0,0,${strength*0.5})`);
    gS.addColorStop(1, 'rgba(0,0,0,0)');
    darkCtx.fillStyle = gS;
    darkCtx.beginPath(); darkCtx.arc(sx, sy, sr, 0, Math.PI*2); darkCtx.fill();
  }

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(darkCanvas, 0, 0);
  ctx.restore();
}

function drawVignette(){
  const g = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.30, W/2, H/2, Math.max(W,H)*0.80);
  g.addColorStop(0, 'rgba(4,2,10,0)');
  g.addColorStop(1, 'rgba(4,2,10,0.90)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function drawJoystick(){
  ctx.globalCompositeOperation = 'source-over';
  if (joystick.active){
    const bx = joystick.baseX, by = joystick.baseY;
    const MAXR = 66;
    ctx.fillStyle = 'rgba(60,100,200,0.10)';
    ctx.beginPath(); ctx.arc(bx, by, MAXR, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(100,160,255,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bx, by, MAXR, 0, Math.PI*2); ctx.stroke();
    const ix = joystick.knobX - bx, iy = joystick.knobY - by;
    const d = Math.hypot(ix, iy);
    let kx = joystick.knobX, ky = joystick.knobY;
    if (d > MAXR){ kx = bx + ix/d*MAXR; ky = by + iy/d*MAXR; }
    const kg = ctx.createRadialGradient(kx, ky, 0, kx, ky, 30);
    kg.addColorStop(0, 'rgba(190,235,255,0.9)');
    kg.addColorStop(0.5, 'rgba(90,160,250,0.6)');
    kg.addColorStop(1, 'rgba(40,90,190,0)');
    ctx.fillStyle = kg;
    ctx.beginPath(); ctx.arc(kx, ky, 30, 0, Math.PI*2); ctx.fill();
  }
}
function drawFogOverlay(){
  if (player.fogTimer <= 0 && player.blindTimer <= 0) return;
  ensureBlurCanvas();
  blurSrcCtx.setTransform(1,0,0,1,0,0);
  blurSrcCtx.clearRect(0, 0, blurSrc.width, blurSrc.height);
  blurSrcCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, blurSrc.width, blurSrc.height);
  const cx = W/2, cy = H/2;
  const theme = currentMapDef.theme;
  if (player.fogTimer > 0){
    const a = Math.min(1, player.fogTimer / 1.5);
    blurTmpCtx.setTransform(1,0,0,1,0,0);
    blurTmpCtx.clearRect(0, 0, blurTmp.width, blurTmp.height);
    blurTmpCtx.filter = 'blur(100px)';
    blurTmpCtx.drawImage(blurSrc, 0, 0);
    blurTmpCtx.filter = 'none';
    blurTmpCtx.globalCompositeOperation = 'destination-in';
    const mg = blurTmpCtx.createRadialGradient(cx, cy, 30, cx, cy, Math.max(W, H) * 0.85);
    mg.addColorStop(0.00, 'rgba(0,0,0,0)');
    mg.addColorStop(0.10, 'rgba(0,0,0,0.05)');
    mg.addColorStop(0.25, 'rgba(0,0,0,0.35)');
    mg.addColorStop(0.50, 'rgba(0,0,0,0.85)');
    mg.addColorStop(0.75, 'rgba(0,0,0,0.98)');
    mg.addColorStop(1.00, 'rgba(0,0,0,1)');
    blurTmpCtx.fillStyle = mg;
    blurTmpCtx.fillRect(0, 0, blurTmp.width, blurTmp.height);
    blurTmpCtx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.globalAlpha = a;
    ctx.drawImage(blurTmp, 0, 0, W, H);
    ctx.restore();
  }
  if (player.blindTimer > 0){
    const a = Math.min(1, player.blindTimer / 2.0);
    const bx = (player.blindX - cam.cx) * cam.zoom + cx;
    const by = (player.blindY - cam.cy) * cam.zoom + cy;
    blurTmpCtx.setTransform(1,0,0,1,0,0);
    blurTmpCtx.clearRect(0, 0, blurTmp.width, blurTmp.height);
    blurTmpCtx.filter = 'blur(120px)';
    blurTmpCtx.drawImage(blurSrc, 0, 0);
    blurTmpCtx.filter = 'none';
    blurTmpCtx.globalCompositeOperation = 'destination-in';
    const mg = blurTmpCtx.createRadialGradient(bx, by, 0, bx, by, 450);
    mg.addColorStop(0.00, 'rgba(0,0,0,1)');
    mg.addColorStop(0.35, 'rgba(0,0,0,0.98)');
    mg.addColorStop(0.65, 'rgba(0,0,0,0.65)');
    mg.addColorStop(1.00, 'rgba(0,0,0,0)');
    blurTmpCtx.fillStyle = mg;
    blurTmpCtx.fillRect(0, 0, blurTmp.width, blurTmp.height);
    blurTmpCtx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.globalAlpha = a;
    ctx.drawImage(blurTmp, 0, 0, W, H);
    ctx.restore();
  }
}




