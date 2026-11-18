/**
 * Snowshift public V19 car skins. Pure cosmetic data and rendering only:
 * nothing in this module changes velocity, collision geometry or scoring.
 */
export const CAR_STYLES=Object.freeze([
  Object.freeze({id:'skimmer',name:'SKIMMER',description:'Classic ice racer'}),
  Object.freeze({id:'arrow',name:'ARROW',description:'A narrow, pointed racer'}),
  Object.freeze({id:'rally',name:'RALLY',description:'A wide, rugged build'}),
  Object.freeze({id:'glider',name:'GLIDER',description:'Swept wings and twin pods'})
]);
export const BODY_COLORS=Object.freeze([
  '#ff7557','#75dfff','#d4fc77','#e5abfa','#ffd166',
  '#f5fbff','#f7518a','#59e2b5','#8098ff'
]);
export const TRIM_COLORS=Object.freeze([
  '#f5fbff','#122a43','#ffd166','#e5abfa','#d4fc77','#75dfff'
]);
export const SOLO_CAR_KEY='snowshift:garage:solo:v1';
export const DEFAULT_CARS=Object.freeze([
  Object.freeze({style:'skimmer',body:'#ff7557',trim:'#f5fbff'}),
  Object.freeze({style:'arrow',body:'#75dfff',trim:'#122a43'}),
  Object.freeze({style:'rally',body:'#d4fc77',trim:'#122a43'}),
  Object.freeze({style:'glider',body:'#e5abfa',trim:'#f5fbff'})
]);

const HEX=/^#[0-9a-f]{6}$/i;
const SEGMENT=/^([a-z]+)-([0-9a-f]{6})-([0-9a-f]{6})$/;
function boundedCount(count){
  const n=Number(count);
  return Number.isInteger(n)&&n>=1&&n<=4?n:1;
}
export function normalizeCar(car,index=0){
  const fallback=DEFAULT_CARS[(Number.isInteger(index)&&index>=0?index:0)%4];
  const value=car&&typeof car==='object'?car:{};
  return {
    style:CAR_STYLES.some(c=>c.id===value.style)?value.style:fallback.style,
    body:typeof value.body==='string'&&HEX.test(value.body)?value.body.toLowerCase():fallback.body,
    trim:typeof value.trim==='string'&&HEX.test(value.trim)?value.trim.toLowerCase():fallback.trim
  };
}
export function defaultCars(count=1){
  return Array.from({length:boundedCount(count)},(_,i)=>normalizeCar(null,i));
}
export function encodeCars(cars,count=1){
  return Array.from({length:boundedCount(count)},(_,i)=>{
    const car=normalizeCar(Array.isArray(cars)?cars[i]:null,i);
    return [car.style,car.body.slice(1),car.trim.slice(1)].join('-');
  }).join('~');
}
export function decodeCars(raw,count=1){
  const length=boundedCount(count);
  if(typeof raw!=='string'||raw.length>160)return defaultCars(length);
  const segments=raw.split('~');
  return Array.from({length},(_,i)=>{
    const m=SEGMENT.exec(segments[i]??'');
    return m?normalizeCar({style:m[1],body:'#'+m[2],trim:'#'+m[3]},i):normalizeCar(null,i);
  });
}
export function loadSoloCar(storage){
  try{
    const raw=storage?.getItem(SOLO_CAR_KEY);
    if(typeof raw!=='string'||raw.length>200)return normalizeCar(null);
    return normalizeCar(JSON.parse(raw));
  }catch{return normalizeCar(null)}
}
export function saveSoloCar(storage,car){
  try{
    if(!storage)return false;
    storage.setItem(SOLO_CAR_KEY,JSON.stringify(normalizeCar(car)));
    return true;
  }catch{return false}
}
export function styleName(car){
  const normalized=normalizeCar(car);
  return CAR_STYLES.find(c=>c.id===normalized.style).name;
}

function polygon(ctx,points){
  ctx.beginPath();
  ctx.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
  ctx.closePath();
}
function shape(ctx,points,color,stroke='#071c2b',width=2){
  polygon(ctx,points);
  ctx.fillStyle=color;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}
}
function ellipse(ctx,x,y,rx,ry,color){
  ctx.fillStyle=color;ctx.beginPath();
  ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}

/**
 * Draws the visible vehicle about the same physics centre used for the
 * original 72x40 skimmer. The appearance never changes its collision shape.
 */
export function drawCar(ctx,point,heading=0,speed=0,car=null,scale=1){
  const design=normalizeCar(car);
  ctx.save();
  ctx.translate(point.x,point.y);
  ctx.rotate(heading);
  ctx.scale(scale,scale);
  if(speed>0){
    const intensity=Math.min(.8,Math.max(0,speed)*.12);
    ctx.save();ctx.globalAlpha=intensity;
    ellipse(ctx,-29,0,27,9,'#73dfff');
    ellipse(ctx,-35,0,15,5,'#dcfcff');
    ctx.restore();
  }
  // All styles occupy the same visual 70 by 38 world-pixel envelope.
  ellipse(ctx,0,3,31,15,'#06132175');
  if(design.style==='glider'){
    shape(ctx,[[-23,-6],[-16,-18],[0,-17],[13,-7]],design.trim);
    shape(ctx,[[-23,6],[-16,18],[0,17],[13,7]],design.trim);
    shape(ctx,[[-24,-15],[-30,-18],[-23,-4]],design.body);
    shape(ctx,[[-24,15],[-30,18],[-23,4]],design.body);
  }else if(design.style==='rally'){
    ctx.fillStyle='#081725';
    for(const x of [-21,12]){
      for(const y of [-17,12])ctx.fillRect(x,y,10,6);
    }
    shape(ctx,[[-26,-13],[-30,-15],[-25,-7],[-25,7],[-30,15],[-26,13]],design.trim);
  }else if(design.style==='arrow'){
    shape(ctx,[[-29,-16],[-14,-11],[2,-9],[-12,-18]],design.trim);
    shape(ctx,[[-29,16],[-14,11],[2,9],[-12,18]],design.trim);
  }else{
    shape(ctx,[[-28,-17],[-19,-7],[-5,-7],[-15,-17]],design.trim);
    shape(ctx,[[-28,17],[-19,7],[-5,7],[-15,17]],design.trim);
  }
  const silhouettes={
    skimmer:[[34,0],[15,-9],[-12,-11],[-23,-15],[-26,-8],[-21,0],[-26,8],[-23,15],[-12,11],[15,9]],
    arrow:[[35,0],[7,-7],[-15,-10],[-27,-5],[-24,0],[-27,5],[-15,10],[7,7]],
    rally:[[27,-8],[19,-13],[-20,-13],[-27,-8],[-27,8],[-20,13],[19,13],[27,8],[30,0]],
    glider:[[35,0],[12,-8],[-6,-8],[-18,-11],[-28,-5],[-21,0],[-28,5],[-18,11],[-6,8],[12,8]]
  };
  shape(ctx,silhouettes[design.style],design.body,'#061c2a',2.6);
  // Reflective top paint and accent stripe
  ctx.globalAlpha=.23;
  if(design.style==='rally'){
    shape(ctx,[[11,-11],[19,-10],[24,-6],[24,6],[19,10],[11,11]],'#ffffff',null);
  }else{
    shape(ctx,[[4,-6],[23,-2],[28,0],[23,2],[4,6]],'#ffffff',null);
  }
  ctx.globalAlpha=1;
  const stripe=design.style==='rally'
    ? [[-20,-3],[18,-3],[21,0],[18,3],[-20,3]]
    : [[-20,-2],[14,-2],[24,0],[14,2],[-20,2]];
  shape(ctx,stripe,design.trim,null);
  if(design.style==='rally'){
    shape(ctx,[[2,-9],[13,-9],[16,0],[13,9],[2,9],[-3,0]],'#102b42b8','#f5fbff',1.4);
    shape(ctx,[[-16,-9],[-7,-9],[-7,9],[-16,9]],'#183c55','#f5fbff',.8);
    ctx.strokeStyle=design.trim;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-21,-10);ctx.lineTo(-21,10);ctx.stroke();
  }else{
    shape(ctx,[[-12,-7],[3,-6],[13,0],[3,6],[-12,7],[-17,0]],'#15394e','#d7f7fa',1.3);
    ellipse(ctx,1,-2,7,2,'#88dbf4a8');
  }
  // Two headlamps and rear reflectors maintain a readable nose direction.
  ellipse(ctx,24,-5,2.7,2.1,'#f7ffea');
  ellipse(ctx,24,5,2.7,2.1,'#f7ffea');
  ellipse(ctx,-22,-7,1.8,2,'#fa8074');
  ellipse(ctx,-22,7,1.8,2,'#fa8074');
  ctx.restore();
}

/* Previews use precisely the same renderer as the race canvas. */
export function paintCarPreview(canvas,car){
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  const gradient=ctx.createLinearGradient(0,0,w,h);
  gradient.addColorStop(0,'#17435b');gradient.addColorStop(1,'#0a263a');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#7bb4c948';ctx.lineWidth=1;
  ctx.setLineDash([6,7]);
  ctx.beginPath();ctx.moveTo(6,h*.68);ctx.lineTo(w-6,h*.68);ctx.stroke();
  ctx.setLineDash([]);
  const size=Math.min(w/90,h/55);
  drawCar(ctx,{x:w/2,y:h/2},0,0,car,size);
}
