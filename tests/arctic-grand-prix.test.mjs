import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARCTIC_GRAND_PRIX,FROZEN_GAUNTLET,CIRCUITS,getCircuit,
  BROKEN_PASSAGE,ICEBOUND_RAPIDS,GLASS_ICE,CROSSWIND_RIDGE
} from '../src/circuit.mjs';
import {
  createRace,previewMove,takeTurn,score,
  accelerationAllowed,windZoneAt,windVectorAt,glassIceZoneAt,
  boostZoneAt,boostVectorAt,movingObstaclePosition,movingObstaclePeriod,
  movingObstaclePathClearance,movingObstacleApproach,SKIMMER_HAZARD_HALF_WIDTH,
  onTrack,segmentOnTrack
} from '../src/engine.mjs';
import {biomeForCircuit,BIOMES} from '../src/biomes.mjs';
import {findLegalLap} from '../scripts/solve-lap.mjs';
import {recordKeyForCircuit} from '../src/race-records.mjs';
import {
  GRAND_PRIX_LAP_ONE,GRAND_PRIX_LAP_TWO,ARCTIC_GRAND_PRIX_CLEAR_RACE
} from '../scripts/arctic-grand-prix-qa-route.mjs';
import {MIN_RECOMMENDED_CLEARANCE,visualSkimmerPathClearance,visibleSkimmerClearance} from '../scripts/track-clearance.mjs';

const c=ARCTIC_GRAND_PRIX,p=(x,y)=>({x,y});

test('the final 12th circuit is a visually distinct two-lap Expert Eclipse Summit cup',()=>{
  assert.equal(CIRCUITS.length,12);
  assert.strictEqual(CIRCUITS[11],c);
  assert.strictEqual(getCircuit('arctic-grand-prix'),c);
  assert.equal(c.name,'Arctic Grand Prix');
  assert.equal(c.level,'EXPERT 1');
  assert.equal(c.targetLaps,2);
  assert.equal(c.crashPenalty,3);
  assert.equal(c.start.x,9);
  assert.deepEqual(c.start,p(9,21));
  assert.equal(c.finish.a.x,11);
  assert.equal(c.finish.b.x,11);
  assert.equal(c.checkpoints.length,3);
  assert.strictEqual(biomeForCircuit(c),BIOMES.expert);
  assert.equal(BIOMES.expert.name,'Eclipse Summit');
  assert.equal(c.featuredGrandPrix.phaseContinuesBetweenLaps,true);
  assert.notDeepEqual(c.outer,FROZEN_GAUNTLET.outer);
  assert.notDeepEqual(c.inner,FROZEN_GAUNTLET.inner);
  assert.ok(c.outer.length>=20&&c.inner.length>=15);
  assert.ok(Math.max(...c.outer.map(p=>p.y))<=25.3);
  assert.notDeepEqual(c.movingObstacles,FROZEN_GAUNTLET.movingObstacles);
});

test('three distinct sentinels move on real legal ice in an exact public six-phase cycle',()=>{
  assert.equal(c.movingObstacles.length,3);
  assert.equal(movingObstaclePeriod(c),6);
  assert.deepEqual(c.movingObstacles.map(x=>x.id),[
    'eclipse-north-slab','eclipse-return-slab','eclipse-east-sentinel'
  ]);
  const east=c.movingObstacles[2];
  assert.equal(east.radius,.42);
  assert.deepEqual(east.positions.map(p=>p.x),Array(6).fill(29.7));
  assert.deepEqual(east.positions.map(p=>p.y),[11.2,12,12.8,13.6,12.8,12]);
  for(const slab of c.movingObstacles){
    for(let turn=0;turn<18;turn++){
      const a=movingObstaclePosition(slab,turn),b=movingObstaclePosition(slab,turn+1);
      assert.deepEqual(a,movingObstaclePosition(slab,turn+6));
      assert.equal(onTrack(a,c),true,slab.id+' must lie in road');
      assert.equal(segmentOnTrack(a,b,c),true,slab.id+' may not sweep a snowbank');
      assert.ok(Math.hypot(b.x-a.x,b.y-a.y)<=1.2+1e-8);
      assert.ok(visibleSkimmerClearance(a,c)>=slab.radius+.15,
        slab.id+' visual radius cannot overlap bank');
    }
  }
});

test('eastern sentinel is an actual phase-sensitive moving obstacle, not just decoration',()=>{
  const base={...createRace(c),position:p(29,14),velocity:p(-1,-2)};
  const accel=p(-1,0);
  const safe=previewMove({...base,moves:1},accel,c);
  const hit=previewMove({...base,moves:3},accel,c);
  assert.deepEqual(safe.to,p(27,12));
  assert.equal(safe.valid,true);
  assert.equal(hit.valid,false);
  assert.equal(hit.reason,'moving-obstacle');
  assert.equal(hit.movingObstacle,'eclipse-east-sentinel');
  assert.ok(movingObstaclePathClearance(safe.from,safe.to,c,1)>.5);
  assert.ok(movingObstaclePathClearance(hit.from,hit.to,c,3)<0);
  const crash=takeTurn({...base,moves:3,laps:1,checkpoint:0},accel,c);
  assert.equal(crash.moves,4);
  assert.equal(crash.crashes,1);
  assert.equal(crash.laps,1,'A crash must not reset the final lap');
  assert.equal(crash.velocity.x,0);
  assert.equal(crash.velocity.y,0);
  assert.equal(score(crash,c),7);
});

test('old rules genuinely combine on Expert: 5-axis glass+wind then boosted rock and homeward glass',()=>{
  const glass=c.glassZones[0],wind=c.windZones[0];
  assert.deepEqual(glass.polygon,wind.polygon);
  for(const at of [p(15,21),p(18,22),p(20,23)]){
    assert.strictEqual(glassIceZoneAt(at,c),glass);
    assert.strictEqual(windZoneAt(at,c),wind);
    assert.deepEqual(windVectorAt(at,c),p(0,-1));
  }
  const s={...createRace(c),position:p(15,21),velocity:p(3,1),moves:4};
  assert.equal(accelerationAllowed(s,p(1,-1),c),false);
  assert.equal(previewMove(s,p(1,-1),c).zoneBlocked,true);
  assert.deepEqual(previewMove(s,p(0,1),c).velocity,p(3,1));
  assert.deepEqual(boostVectorAt(p(22,10),c),p(-2,0));
  assert.equal(glassIceZoneAt(p(18,10),c).id,'eclipse-return-glass');
  assert.equal(c.boostZones.length,1);
  for(const zone of [...c.glassZones,...c.windZones,...c.boostZones])
    for(const corner of zone.polygon)
      assert.equal(onTrack(corner,c),true,'Zone outside the painted lane: '+zone.id);
});

test('50-turn, two-lap no-crash race completes six gates and uses all mechanics on BOTH laps',()=>{
  assert.equal(GRAND_PRIX_LAP_ONE.length,28);
  assert.equal(GRAND_PRIX_LAP_TWO.length,22);
  assert.equal(ARCTIC_GRAND_PRIX_CLEAR_RACE.length,50);
  let state=createRace(c),minBank=Infinity,minHazard=Infinity;
  const perLap=[{glass:0,wind:0,boost:0,paired:0,gates:0},{glass:0,wind:0,boost:0,paired:0,gates:0}];
  const events=[];
  for(const [i,a] of ARCTIC_GRAND_PRIX_CLEAR_RACE.entries()){
    const from=state;
    const m=previewMove(state,a,c);
    assert.equal(m.valid,true,'Unsafe move '+(i+1)+': '+m.reason);
    const bank=visualSkimmerPathClearance(m.from,m.to,c);
    const rock=movingObstaclePathClearance(m.from,m.to,c,state.moves);
    minBank=Math.min(minBank,bank);
    minHazard=Math.min(minHazard,rock);
    assert.ok(bank>=MIN_RECOMMENDED_CLEARANCE-.000001,
      'Vehicle scrapes cliff on move '+(i+1)+': '+bank);
    assert.ok(rock>=.35,'Vehicle grazes moving sentinel on '+(i+1)+': '+rock);
    const stage=perLap[state.laps];
    if(m.windZone)stage.wind++;
    if(m.boostZone)stage.boost++;
    if(glassIceZoneAt(state.position,c))stage.glass++;
    if(m.windZone&&glassIceZoneAt(state.position,c))stage.paired++;
    state=takeTurn(state,a,c);
    assert.equal(state.crashes,0);
    assert.equal(state.moves,i+1);
    assert.equal(state.laps,(i<27?0:i<49?1:2));
    if(state.lastEvent.endsWith('cleared')){stage.gates++;events.push(state.lastEvent);}
    if(i===27){
      assert.equal(state.lastEvent,'Lap 1');
      assert.equal(state.finished,false);
      assert.deepEqual(state.position,p(12,22));
      assert.deepEqual(state.velocity,p(1,0),'Momentum MUST persist into lap two');
      assert.equal(state.checkpoint,0,'Gate order resets, not car state');
      assert.equal(state.moves,28,'Rock clock persists with accumulated turns');
    }
    if(i===49)assert.equal(state.lastEvent,'Finish line crossed!');
    assert.ok(state.position.x===Math.round(state.position.x));
    assert.ok(state.position.y===Math.round(state.position.y));
  }
  assert.equal(minBank>=1.42,true,'Minimum whole-bank clearance meets vehicle-width standard');
  assert.ok(minHazard>=.45,'Three swept hazards must retain a safety buffer');
  assert.deepEqual(perLap,[
    {glass:4,wind:2,boost:1,paired:2,gates:3},
    {glass:4,wind:3,boost:1,paired:3,gates:3}
  ]);
  assert.deepEqual(events,[
    'Eclipse East Gate cleared','Eclipse Return Gate cleared','Eclipse West Gate cleared',
    'Eclipse East Gate cleared','Eclipse Return Gate cleared','Eclipse West Gate cleared'
  ]);
  assert.equal(state.finished,true);
  assert.equal(state.laps,2);
  assert.equal(score(state,c),50);
});

test('the independent phase-aware BFS can solve another second lap without restarting',()=>{
  let halfway=createRace(c);
  for(const a of GRAND_PRIX_LAP_ONE)halfway=takeTurn(halfway,a,c);
  assert.equal(halfway.laps,1);
  const route=findLegalLap(c,halfway);
  assert.ok(route.length>=18&&route.length<=36);
  let state=halfway;
  for(const [i,a] of route.entries()){
    const m=previewMove(state,a,c);
    assert.equal(m.valid,true,'Independent final lap invalid at '+(i+1));
    state=takeTurn(state,a,c);
    assert.equal(state.crashes,0);
  }
  assert.equal(state.finished,true);
  assert.equal(state.laps,2);
  assert.equal(state.moves,28+route.length);
});

test('all previous eleven circuits preserve physics and independent personal-best keys',()=>{
  const ids=new Set(CIRCUITS.map(x=>x.id));
  assert.equal(ids.size,12);
  assert.equal(new Set(CIRCUITS.map(x=>recordKeyForCircuit(x.id))).size,12);
  for(const old of CIRCUITS.slice(0,11)){
    assert.strictEqual(getCircuit(old.id),old);
    assert.equal(old.targetLaps,1);
    assert.notEqual(old.level,'EXPERT 1');
    assert.notEqual(old.id,c.id);
    assert.deepEqual(previewMove(createRace(old),p(1,0),old).velocity,p(1,0));
    assert.equal(takeTurn(createRace(old),p(1,0),old).moves,1);
  }
  assert.equal(FROZEN_GAUNTLET.movingObstacles.length,2);
  assert.equal(BROKEN_PASSAGE.movingObstacles.length,2);
  assert.equal(ICEBOUND_RAPIDS.movingObstacles,undefined);
  assert.equal(GLASS_ICE.windZones,undefined);
  assert.equal(CROSSWIND_RIDGE.glassZones,undefined);
});
