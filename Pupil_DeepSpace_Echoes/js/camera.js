/* ============================== K. Camera =============================== */
function updateCam(dt){
  if (gameState === 'menu'){ cam.cx = WORLD/2; cam.cy = WORLD/2; cam.zoom += (0.2-cam.zoom)*Math.min(1,dt*3); return; }
  const midX = (player.x + enemy.x)/2, midY = (player.y + enemy.y)/2;
  const dx = Math.abs(player.x - enemy.x), dy = Math.abs(player.y - enemy.y);
  const needW = Math.max(900, dx + 560), needH = Math.max(900, dy + 560);
  let targetZoom = Math.min(W/needW, H/needH);
  targetZoom = clamp(targetZoom, 0.10, 1.35);
  const k = 1 - Math.exp(-4.5*dt);
  cam.cx += (midX - cam.cx)*k; cam.cy += (midY - cam.cy)*k;
  cam.zoom += (targetZoom - cam.zoom)*k;
  const vw = W/cam.zoom, vh = H/cam.zoom;
  view.w = vw; view.h = vh;
  view.l = cam.cx - vw/2; view.r = cam.cx + vw/2;
  view.t = cam.cy - vh/2; view.b = cam.cy + vh/2;
}

