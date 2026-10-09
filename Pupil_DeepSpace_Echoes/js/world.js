/* ========================= G. Map Generation ============================ */
let buildingSnailSpots = [];

function initMapData(){
  obstacles.length = 0;
  buildingSnailSpots = [];
  currentMapDef = MAP_DEFS[selectedMapId] || MAP_DEFS.void;

  const count = (selectedMapId === 'buildings' || selectedMapId === 'night') ? 50 : 78;
  let tries = 0;
  const pS = { x:180, y:180 }, eS = { x:WORLD-180, y:WORLD-180 };
  while (obstacles.length < count && tries < 16000){
    tries++;
    const x = 180 + Math.random()*(WORLD-360);
    const y = 180 + Math.random()*(WORLD-360);
    const r = 22 + Math.random()*42;
    if (Math.hypot(x-pS.x, y-pS.y) < r+260) continue;
    if (Math.hypot(x-eS.x, y-eS.y) < r+260) continue;
    let ok = true;
    for (const o of obstacles) if (Math.hypot(x-o.x, y-o.y) < r + o.r + 20){ ok=false; break; }
    if (!ok) continue;
    let type = 'rock';
    if (Math.random() < 0.32) type = 'membrane';
    obstacles.push({ x, y, r, type, seed: Math.random()*1000 });
  }
  if (selectedMapId === 'buildings') generateBuildings();
  else if (selectedMapId === 'night') generateNightShrine();
}

function spotClear(x, y, r){
  if (x < 300 || x > WORLD-300 || y < 300 || y > WORLD-300) return false;
  for (const ob of obstacles){
    if (Math.hypot(x-ob.x, y-ob.y) < r + ob.r + 40) return false;
  }
  for (const b of buildingSnailSpots){
    if (Math.hypot(x-b.x, y-b.y) < r + 140) return false;
  }
  return true;
}
function findSpot(r){
  for (let i=0; i<300; i++){
    const x = 350 + Math.random()*(WORLD-700);
    const y = 350 + Math.random()*(WORLD-700);
    if (spotClear(x, y, r)) return { x, y };
  }
  return null;
}

/* 长板：一体化胶囊体（视觉上是一整条，不是小颗粒） */
function spawnPlank(){
  const segR = 32;
  const len = 5 + Math.floor(Math.random()*3);
  const spot = findSpot(segR * 2 + 100);
  if (!spot) return;
  const angle = Math.random() * Math.PI;
  const segGap = segR * 1.55;
  const halfLen = (len - 1) * segGap / 2;
  const dirX = Math.cos(angle), dirY = Math.sin(angle);
  for (let j = 0; j < len; j++){
    obstacles.push({
      x: spot.x + dirX*segGap*(j - (len-1)/2),
      y: spot.y + dirY*segGap*(j - (len-1)/2),
      r: segR,
      type: 'plank',
      // 一体化渲染参数
      plankCX: spot.x, plankCY: spot.y,
      plankAngle: angle,
      plankHalfLen: halfLen,
      plankWidth: segR,
      // 用同一组 key 保证整条长板只画一次
      plankKey: Math.floor(spot.x * 7 + spot.y * 13 + angle * 1000),
      seed: Math.random()*1000
    });
  }
}
function spawnShrine(opts){
  const R = 190;
  const spot = opts && opts.pos ? opts.pos : findSpot(R + 130);
  if (!spot) return;
  const pillarN = 14;
  for (let j = 0; j < pillarN; j++){
    if (j % 4 === 0) continue;
    const a = j/pillarN * Math.PI*2;
    obstacles.push({
      x: spot.x + Math.cos(a) * R,
      y: spot.y + Math.sin(a) * R,
      r: 28, type: 'shrine',
      shrineX: spot.x, shrineY: spot.y, shrineRadius: R,
      seed: Math.random()*1000
    });
  }
  // 神坛周边额外圆弧障碍（3 组）
  for (let arcIdx = 0; arcIdx < 3; arcIdx++){
    const arcR = R + 72 + arcIdx * 34;
    const arcCenterA = Math.random() * Math.PI * 2;
    const arcSpan = Math.PI * 0.62;
    const segN = 7;
    for (let j = 0; j < segN; j++){
      const t = segN === 1 ? 0.5 : j / (segN - 1);
      const a = arcCenterA + (t - 0.5) * arcSpan;
      obstacles.push({
        x: spot.x + Math.cos(a) * arcR,
        y: spot.y + Math.sin(a) * arcR,
        r: 22,
        type: 'shrine',
        shrineX: spot.x, shrineY: spot.y, shrineRadius: arcR,
        seed: Math.random()*1000
      });
    }
  }
  obstacles.push({
    x: spot.x, y: spot.y, r: 52,
    type: 'altar', seed: Math.random()*1000
  });
  buildingSnailSpots.push({
    x: spot.x, y: spot.y,
    shrine: true, immovable: true
  });
}
/* 危墙：内质网一体化（多层弧 + 径向勾连） */
function spawnWall(){
  const spot = findSpot(220);
  if (!spot) return;
  const baseAngle = Math.random() * Math.PI * 2;
  const layers = [148, 110, 74, 42];
  const arcSpan = Math.PI * 1.5;
  const stoneR = 18;
  const wallKey = Math.floor(spot.x * 7 + spot.y * 13);
  for (let li = 0; li < layers.length; li++){
    const R = layers[li];
    const segCount = li === 0 ? 10 : li === 1 ? 9 : li === 2 ? 8 : 7;
    for (let j = 0; j < segCount; j++){
      const t = segCount === 1 ? 0.5 : j / (segCount - 1);
      const a = baseAngle + (t - 0.5) * arcSpan;
      obstacles.push({
        x: spot.x + Math.cos(a) * R,
        y: spot.y + Math.sin(a) * R,
        r: stoneR,
        type: 'wall',
        wallCenterX: spot.x,
        wallCenterY: spot.y,
        wallBaseAngle: baseAngle,
        wallArcSpan: arcSpan,
        wallLayerR: R,
        wallKey: wallKey,
        seed: Math.random()*1000
      });
    }
  }
  // 层间勾连
  for (let li = 0; li < layers.length - 1; li++){
    const r1 = layers[li], r2 = layers[li+1];
    const midR = (r1 + r2) / 2;
    const connectors = 3 + (li % 2);
    for (let c = 0; c < connectors; c++){
      const t = (c + 0.5) / connectors;
      const a = baseAngle + (t - 0.5) * arcSpan * 0.85;
      obstacles.push({
        x: spot.x + Math.cos(a) * midR,
        y: spot.y + Math.sin(a) * midR,
        r: stoneR * 0.85,
        type: 'wall',
        wallCenterX: spot.x,
        wallCenterY: spot.y,
        wallBaseAngle: baseAngle,
        wallArcSpan: arcSpan,
        wallLayerR: midR,
        wallKey: wallKey,
        seed: Math.random()*1000
      });
    }
  }
  // 内部 1 只蜗
  const a0 = Math.random() * Math.PI * 2;
  const r0 = 10 + Math.random() * 12;
  buildingSnailSpots.push({
    x: spot.x + Math.cos(a0) * r0,
    y: spot.y + Math.sin(a0) * r0,
    shrine: false,
    wallHomeX: spot.x,
    wallHomeY: spot.y,
    wallRadius: 24
  });
}
function generateBuildings(){
  const arr = ['plank', 'shrine', 'wall'];
  for (let i = arr.length-1; i > 0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  arr.push(['plank','shrine','wall'][Math.floor(Math.random()*3)]);
  for (let i = arr.length-1; i > 0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  for (const kind of arr){
    if (kind === 'plank') spawnPlank();
    else if (kind === 'shrine') spawnShrine();
    else if (kind === 'wall') spawnWall();
  }
}
function generateNightShrine(){
  const pS = { x:180, y:180 }, eS = { x:WORLD-180, y:WORLD-180 };
  for (let i = 0; i < 200; i++){
    const x = 500 + Math.random()*(WORLD-1000);
    const y = 500 + Math.random()*(WORLD-1000);
    if (Math.hypot(x-pS.x, y-pS.y) < 600) continue;
    if (Math.hypot(x-eS.x, y-eS.y) < 600) continue;
    let ok = true;
    for (const ob of obstacles){
      if (Math.hypot(x-ob.x, y-ob.y) < ob.r + 300){ ok = false; break; }
    }
    if (!ok) continue;
    spawnShrine({ pos: { x, y } });
    return;
  }
}

function isOnPlank(x, y){
  for (const ob of obstacles){
    if (ob.type !== 'plank') continue;
    if (Math.hypot(x-ob.x, y-ob.y) < ob.r + 16) return true;
  }
  return false;
}

