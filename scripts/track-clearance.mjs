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
