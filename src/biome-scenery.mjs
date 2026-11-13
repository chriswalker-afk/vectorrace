/**
 * Decorative, deterministic biome artwork.
 *
 * These details are drawn only on the LAND layer (clipped by physics polygons)
 * and never form collidable objects. No labels, effects or decorative rocks
 * may be mistaken for a new hazard on a legal ice road.
 *
 * All four worlds share the same coherent camera and 960x700 art-space.
 */
const TAU = Math.PI * 2;

function closed(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i=1;i<points.length;i++) ctx.lineTo(points[i][0],points[i][1]);
  ctx.closePath();
}

function softGlow(ctx,x,y,radius,color) {
  const g=ctx.createRadialGradient(x,y,2,x,y,radius);
  g.addColorStop(0,color);
  g.addColorStop(1,'#00000000');
  ctx.fillStyle=g;
  ctx.beginPath();ctx.arc(x,y,radius,0,TAU);ctx.fill();
}

function drawCrystal(ctx,x,y,size,biome,index=0) {
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(index % 2 ? -.22 : .14);
  softGlow(ctx,0,2,size*.95,'#5beff12c');
  ctx.fillStyle='#080f3b8a';
  ctx.beginPath();ctx.ellipse(4,size*.22,size*.54,size*.20,.3,0,TAU);ctx.fill();
  const outline=[
    [0,-size*.72],[size*.26,-size*.26],[size*.28,size*.33],
    [0,size*.46],[-size*.28,size*.26],[-size*.25,-size*.27]
  ];
  closed(ctx,outline);
  const g=ctx.createLinearGradient(-size*.3,-size*.65,size*.4,size*.3);
  g.addColorStop(0,'#ddf9ff');g.addColorStop(.38,'#9ac8ff');
  g.addColorStop(.73,'#7259c6');g.addColorStop(1,'#354c9f');
  ctx.fillStyle=g;ctx.fill();
  ctx.strokeStyle='#f6edffcc';ctx.lineWidth=1.5;ctx.stroke();
  closed(ctx,[[0,-size*.72],[0,size*.46],[-size*.28,size*.26],[-size*.25,-size*.27]]);
  ctx.fillStyle='#f2f3ff50';ctx.fill();
  ctx.strokeStyle='#dfffffa6';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,-size*.72);ctx.lineTo(0,size*.46);
  ctx.moveTo(-size*.25,-size*.27);ctx.lineTo(size*.26,-size*.26);
  ctx.stroke();
  if(size>45){
    ctx.fillStyle='#5ce5ff';
    ctx.beginPath();ctx.arc(-size*.42,size*.08,2.5,0,TAU);ctx.fill();
  }
  ctx.restore();
}

function drawBasalt(ctx,x,y,size,biome,index=0) {
  ctx.save();
  ctx.translate(x,y);ctx.rotate(index*.31);
  softGlow(ctx,0,size*.18,size*.83,'#ff7a3f31');
  const footprint=[
    [-size*.46,-size*.12],[-size*.21,-size*.4],[size*.21,-size*.42],
    [size*.44,-size*.11],[size*.37,size*.28],[0,size*.47],[-size*.37,size*.25]
  ];
  closed(ctx,footprint);
  ctx.fillStyle='#130d1cc9';ctx.fill();
  ctx.strokeStyle='#bb6952a9';ctx.lineWidth=2.3;ctx.stroke();
  const top=footprint.map(([a,b])=>[a*.75,b*.56-size*.14]);
  closed(ctx,top);
  const grad=ctx.createLinearGradient(-size*.3,-size*.45,size*.4,size*.35);
  grad.addColorStop(0,'#77818c');grad.addColorStop(.5,'#353541');grad.addColorStop(1,'#111b29');
  ctx.fillStyle=grad;ctx.fill();
  ctx.strokeStyle='#c2b0b0b0';ctx.lineWidth=1.2;ctx.stroke();
  ctx.strokeStyle='#ffac67';ctx.shadowColor='#ff602c';ctx.shadowBlur=7;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-size*.25,size*.03);ctx.lineTo(-size*.07,-size*.07);
  ctx.lineTo(size*.13,size*.12);ctx.lineTo(size*.3,size*.05);ctx.stroke();
  ctx.restore();
}

function drawObelisk(ctx,x,y,size,biome,index=0) {
  ctx.save();
  ctx.translate(x,y);ctx.rotate(index%2?.18:-.12);
  softGlow(ctx,0,0,size*.9,'#f0d78a22');
  ctx.fillStyle='#020817b8';
  ctx.beginPath();ctx.ellipse(4,size*.2,size*.43,size*.22,.3,0,TAU);ctx.fill();
  closed(ctx,[[-size*.29,size*.24],[-size*.24,-size*.4],[0,-size*.72],
    [size*.24,-size*.4],[size*.29,size*.24],[0,size*.48]]);
  ctx.fillStyle='#080b20';ctx.fill();
  ctx.strokeStyle='#e5cf92';ctx.lineWidth=1.4;ctx.stroke();
  closed(ctx,[[0,-size*.72],[size*.24,-size*.4],[size*.29,size*.24],[0,size*.48]]);
  ctx.fillStyle='#243455';ctx.fill();
  ctx.strokeStyle='#f6e4af';ctx.lineWidth=.9;ctx.stroke();
  ctx.strokeStyle='#ddc084';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(-size*.12,-size*.16);ctx.lineTo(size*.12,-size*.16);
  ctx.moveTo(-size*.09,size*.05);ctx.lineTo(size*.09,size*.05);
  ctx.moveTo(0,-size*.33);ctx.lineTo(0,size*.2);ctx.stroke();
  ctx.restore();
}

function drawConstellation(ctx, cx,cy,r,biome) {
  ctx.save();ctx.translate(cx,cy);
  ctx.strokeStyle='#ffe5a46a';ctx.lineWidth=1.5;
  for(const scale of [1,.73]){
    ctx.beginPath();ctx.arc(0,0,r*scale,0,TAU);ctx.stroke();
  }
  for(let k=0;k<8;k++){
    const a=k*TAU/8;
    const x=Math.cos(a)*r,y=Math.sin(a)*r;
    ctx.fillStyle='#ffe9a9';
    ctx.beginPath();ctx.arc(x,y,k%2?2:3,0,TAU);ctx.fill();
    if(k%2===0){
      ctx.beginPath();ctx.moveTo(x,y-8);ctx.lineTo(x,y+8);
      ctx.moveTo(x-8,y);ctx.lineTo(x+8,y);ctx.stroke();
    }
  }
  ctx.beginPath();ctx.moveTo(-r*.55,0);ctx.lineTo(0,-r*.55);
  ctx.lineTo(r*.55,0);ctx.lineTo(0,r*.55);ctx.closePath();ctx.stroke();
  ctx.restore();
}

/** Atmospheric colour, light shafts and sky features behind the road. */
export function paintBiomeAtmosphere(ctx,width,height,biome) {
  if(biome.id==='beginner') return;
  ctx.save();
  if(biome.id==='intermediate') {
    // Wide curving ribbons of northern light, not straight road markings.
    ctx.globalCompositeOperation='screen';
    for(let n=0;n<4;n++){
      const y=25+n*46;
      const grad=ctx.createLinearGradient(20,y,900,y+120);
      grad.addColorStop(0,'#5cffc500');
      grad.addColorStop(.25,n%2?'#8efad021':'#71ecff28');
      grad.addColorStop(.67,'#ab8dff5e');
      grad.addColorStop(1,'#bc8cff00');
      ctx.strokeStyle=grad;
      ctx.lineWidth=26+n*4;
      ctx.beginPath();ctx.moveTo(-80,y+65);
      ctx.bezierCurveTo(260,y-110,560,y+70,1035,y-65);
      ctx.stroke();
    }
  }else if(biome.id==='advanced') {
    // Ember light leaks and distant lava, outside the road corridor.
    softGlow(ctx,width*.73,height*.2,360,'#f36b413d');
    softGlow(ctx,width*.15,height*.77,290,'#ff5b302e');
    ctx.strokeStyle='#fa633e5c';ctx.lineWidth=4;
    for(let k=0;k<8;k++){
      const xx=(k*113+35)%width, yy=(k*117+71)%height;
      ctx.beginPath();ctx.moveTo(xx-60,yy+36);ctx.lineTo(xx-5,yy+8);
      ctx.lineTo(xx+19,yy+25);ctx.lineTo(xx+57,yy-30);ctx.stroke();
      ctx.strokeStyle=k%2?'#e9603d66':'#ffb56a5b';
    }
  }else if(biome.id==='expert') {
    // The eclipse disc and its gold corona are world-level navigation cues.
    const x=width*.85,y=height*.14;
    softGlow(ctx,x,y,170,'#f0da9162');
    ctx.shadowColor='#f9dc94';ctx.shadowBlur=16;
    ctx.strokeStyle='#ffe7ac';ctx.lineWidth=6;
    ctx.beginPath();ctx.arc(x,y,48,0,TAU);ctx.stroke();
    ctx.shadowBlur=0;ctx.fillStyle='#030b1a';
    ctx.beginPath();ctx.arc(x+5,y-4,47,0,TAU);ctx.fill();
    ctx.strokeStyle='#f7d9959a';ctx.lineWidth=1.2;
    for(let ring=0;ring<3;ring++){
      ctx.beginPath();ctx.arc(x,y,65+ring*17,0,TAU);ctx.stroke();
    }
  }
  // A deterministic starfield is present in all three nighttime worlds.
  if(biome.id==='intermediate'||biome.id==='expert') {
    for(let i=0;i<72;i++){
      const x=(i*181+i*i*37)%width,y=(i*67+i*i*13)%height;
      const size=i%7===0?2.2:1.15;
      ctx.fillStyle=i%4?'#e4edff99':'#ffe6accc';
      ctx.beginPath();ctx.arc(x,y,size,0,TAU);ctx.fill();
    }
  }
  ctx.restore();
}

/** Draw within an existing outer-land/island clip, never on the race surface. */
export function paintBiomeLand(ctx,world,circuit,biome,region) {
  if(biome.id==='beginner') return;
  const outside=[
    [-.6,25,69],[3,25,56],[7,26,64],[11,25,45],[24,25,57],
    [28,25,74],[34,24,68],[35,18,69],[35,9,78],
    [31,0,65],[25,-1,77],[19,-1,56],[8,0,58],
    [1,1,65],[-2,9,72],[-1,17,64]
  ];
  // The centroid guarantees that worlds with differently shaped islands
  // still get a recognizable focal point when it lies on the island.
  const cx=circuit.inner.reduce((n,p)=>n+p.x,0)/circuit.inner.length;
  const cy=circuit.inner.reduce((n,p)=>n+p.y,0)/circuit.inner.length;
  const island=[
    [cx,cy,83],[cx+3,cy+1.2,51],[cx-3.5,cy-1.2,54],
    [cx+1,cy-2.7,48],[cx-1.6,cy+2.3,45],
    [10.9,12.5,59],[20.1,13,61],[23,16,47]
  ];
  const sites=region==='island'?island:outside;
  if(biome.id==='intermediate') {
    for(let i=0;i<sites.length;i++){
      const [x,y,size]=sites[i],p=world({x,y});
      drawCrystal(ctx,p.x,p.y,size,biome,i);
      if(i%3===0)drawCrystal(ctx,p.x+size*.28,p.y+size*.22,size*.55,biome,i+1);
    }
    if(region==='island'){
      const p=world({x:cx,y:cy});
      softGlow(ctx,p.x,p.y,76,'#59ffd552');
      ctx.strokeStyle='#79f5ff6d';ctx.lineWidth=3;
      for(const r of [33,52]){
        ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.stroke();
      }
    }
  }else if(biome.id==='advanced') {
    for(let i=0;i<sites.length;i++){
      const [x,y,size]=sites[i],p=world({x,y});
      drawBasalt(ctx,p.x,p.y,size,biome,i);
    }
    // A fissure network is purely land texture, masked by physics land clips.
    ctx.strokeStyle='#ff8d556b';ctx.shadowColor='#f44729';ctx.shadowBlur=9;
    ctx.lineWidth=3;ctx.lineCap='round';
    const offset=region==='island'?cx*25:0;
    for(let j=0;j<7;j++){
      const y=75+j*103,x=(j*117+50+offset)%930;
      ctx.beginPath();ctx.moveTo(x-30,y+35);
      ctx.lineTo(x,y+8);ctx.lineTo(x+24,y+19);
      ctx.lineTo(x+66,y-27);ctx.stroke();
    }
    ctx.shadowBlur=0;
  }else if(biome.id==='expert') {
    for(let i=0;i<sites.length;i++){
      const [x,y,size]=sites[i],p=world({x,y});
      drawObelisk(ctx,p.x,p.y,size,biome,i);
    }
    if(region==='island'){
      const p=world({x:cx,y:cy});
      drawConstellation(ctx,p.x,p.y,42,biome);
    }
  }
}

/** Themed lamp/marker; scenery only, never changes checkpoint geometry. */
export function paintBiomeBeacon(ctx,x,y,biome) {
  if(biome.id==='beginner') return;
  ctx.save();
  ctx.translate(x,y);
  softGlow(ctx,0,-12,25,biome.id==='advanced'?'#ff743766':'#f9d98d4d');
  ctx.fillStyle=biome.id==='intermediate'?'#594ea4':
    biome.id==='advanced'?'#3a2026':'#0b1227';
  ctx.strokeStyle=biome.accent;
  ctx.lineWidth=2.2;
  closed(ctx,[[-8,17],[-6,-12],[0,-27],[6,-12],[8,17]]);
  ctx.fill();ctx.stroke();
  ctx.fillStyle=biome.accent;
  ctx.beginPath();ctx.arc(0,-15,4,0,TAU);ctx.fill();
  ctx.restore();
}
