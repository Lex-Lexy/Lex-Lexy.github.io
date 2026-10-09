/* ============================== P. Main Loop ============================ */
let last = performance.now();
function loop(now){
  requestAnimationFrame(loop);
  let dt = (now - last)/1000;
  last = now;
  if (dt > 0.05) dt = 0.05;
  if (dt < 0) dt = 0;
  time += dt;
  if (hintAlpha > 0) hintAlpha -= dt*0.10;

  if (gameState === 'intro'){
    introTimer += dt;
    if (introTimer >= INTRO_DURATION) gameState = 'playing';
  } else if (gameState === 'playing'){
    readInput();
    distributeInput(dt);
    updateShadowPending();
    updateEcology(dt);
    updateSnails(dt);
    updateSoulLight(dt);
    updateShadow(dt);
    updatePlayer(dt);
    updateEnemy(dt);
    updateFlashes(dt);
    updateSmokeProjectiles(dt);
    updateAttack(dt);
    enemyDamageToPlayer(dt);
    checkPlayerDeath();
    checkWin();
    spawnTrails(dt);
    spawnYinTrails(dt);
    decayTrails(dt);
  } else if (gameState === 'dead'){
    deathTimer += dt;
    updateSnails(dt);
    updateSoulLight(dt);
    updateFlashes(dt);
    decayTrails(dt*0.5);
  } else if (gameState === 'win'){
    winTimer += dt;
    updateSnails(dt);
    updateSoulLight(dt);
    updateFlashes(dt);
    decayTrails(dt*0.5);
  }

  if (gameState === 'playing'){
    const bEdge = keys['b'] && !prevBKey;
    if (bEdge) useShadowSkill();
  }
  prevVKey = keys['v'];
  prevBKey = keys['b'];

  updateCam(dt);
  updateEye(dt);

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#05060d';
  ctx.fillRect(0, 0, W, H);

  syncInterface();
  if (gameState === 'menu'){ drawMenu(); updateSkillBtn(); return; }

  drawBackgroundScreenSpace();

  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.cx, -cam.cy);

  drawBoundsWorld();
  drawObstaclesWorld();
  drawTrailsWorld();
  drawMarkerWorld();
  drawVortexWorld();
  drawExpansionWorld();
  drawEcologyWorld();
  drawSnailsWorld();
  drawSnailBlackArcsWorld();
  drawSnailGreenArcsWorld();
  drawSmokeProjectilesWorld();
  drawSpiderlingsWorld();
  drawSoulLight();
  drawEnemyWorld();
  drawPlayerWorld();
  drawAttackArcsWorld();
  drawShadowWorld();
  drawExplosionFlashes();

  ctx.restore();

  drawNightDarkness();
  drawVignette();
  drawFogOverlay();
  drawUI();
  drawOffscreenSnailArrows();
  drawJoystick();

  if (gameState === 'intro') drawIntroScreen();
  else if (gameState === 'paused') drawPauseScreen();
  else if (gameState === 'dead') drawDeathScreen();
  else if (gameState === 'win') drawWinScreen();

  animateResult();
  updateSkillBtn();
}
requestAnimationFrame(loop);
