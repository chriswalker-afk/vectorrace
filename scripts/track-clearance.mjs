/**
 * Design-time track audit: approximate visible car clearance in straight lanes.
 * This is not the physics engine's collision shape (the engine tests a point);
 * it prevents map art from suggesting a skimmer cannot physically pass.
 *
 * Current skimmer art is 72x40 px at 25 px per world unit, thus half-width .8.
 */
export const SKIMMER_HALF_WIDTH = 40 / 25 / 2;
export const VISUAL_SAFETY_MARGIN = 0.2;
export const MIN_RECOMMENDED_CLEARANCE = SKIMMER_HALF_WIDTH + VISUAL_SAFETY_MARGIN;

function pointSegmentDistance(point, a, b) {
  const dx=b.x-a.x,dy=b.y-a.y;
  const len2=dx*dx+dy*dy;
  const t=len2>0?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/len2)):0;
  return Math.hypot(point.x-(a.x+t*dx),point.y-(a.y+t*dy));
}
export function distanceToPolygonEdges(point, polygon) {
  if(!Array.isArray(polygon)||polygon.length<3)throw new TypeError('Expected a closed polygon');
  let minimum=Infinity;
  for(let i=0;i<polygon.length;i++){
    minimum=Math.min(minimum,pointSegmentDistance(point,polygon[i],polygon[(i+1)%polygon.length]));
  }
  return minimum;
}
export function visibleSkimmerClearance(point, circuit) {
  return Math.min(
    distanceToPolygonEdges(point,circuit.outer),
    distanceToPolygonEdges(point,circuit.inner),
    ...(circuit.obstacles??[]).map(o=>distanceToPolygonEdges(point,o.polygon))
  );
}

/**
 * Minimum exact distance between a moving centreline SEGMENT and every edge.
 * Unlike endpoint-only clearance, this catches diagonal shortcuts that scrape
 * a snowbank halfway through a visually fast glide.
 */
function segmentPairDistance(a,b,c,d) {
  const cross=(u,v)=>u.x*v.y-u.y*v.x;
  const sub=(u,v)=>({x:u.x-v.x,y:u.y-v.y});
  const r=sub(b,a),s=sub(d,c),q=sub(c,a),denom=cross(r,s);
  if (Math.abs(denom)>1e-10) {
    const t=cross(q,s)/denom,u=cross(q,r)/denom;
    if(t>=0&&t<=1&&u>=0&&u<=1)return 0;
  } else if (Math.abs(cross(q,r))<1e-10) {
    // Collinear overlap is a zero-clearance contact.
    const length=r.x*r.x+r.y*r.y;
    const cProj=length?((c.x-a.x)*r.x+(c.y-a.y)*r.y)/length:0;
    const dProj=length?((d.x-a.x)*r.x+(d.y-a.y)*r.y)/length:0;
    if(Math.max(0,Math.min(cProj,dProj))<=Math.min(1,Math.max(cProj,dProj)))return 0;
  }
  return Math.min(
    pointSegmentDistance(a,c,d),pointSegmentDistance(b,c,d),
    pointSegmentDistance(c,a,b),pointSegmentDistance(d,a,b)
  );
}
export function segmentToPolygonClearance(from,to,polygon) {
  let closest=Infinity;
  for(let i=0;i<polygon.length;i++){
    closest=Math.min(closest,segmentPairDistance(from,to,polygon[i],polygon[(i+1)%polygon.length]));
  }
  return closest;
}
export function visualSkimmerPathClearance(from,to,circuit) {
  return Math.min(
    segmentToPolygonClearance(from,to,circuit.outer),
    segmentToPolygonClearance(from,to,circuit.inner),
    ...(circuit.obstacles??[]).map(o=>segmentToPolygonClearance(from,to,o.polygon))
  );
}
