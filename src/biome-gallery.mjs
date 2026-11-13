import { NORTHERN_LOOP } from './circuit.mjs';
import { createSnowshiftArtwork } from './race-art-v10.mjs';
import { BIOMES, TIERS } from './biomes.mjs';

const WIDTH=960, HEIGHT=700, SCALE=25, OFFSET_X=80, OFFSET_Y=650;
const world=p=>({x:OFFSET_X+p.x*SCALE,y:OFFSET_Y-p.y*SCALE});
const art=createSnowshiftArtwork(()=>drawGallery());

function drawGallery(){
  for(const tier of TIERS){
    const canvas=document.getElementById('preview-'+tier);
    const ctx=canvas?.getContext('2d');
    if(!ctx)continue;
    // Same exact polygon in all four panels; the ID and tier label only
    // choose artwork. These are visual previews, not selectable race tracks.
    const preview={
      ...NORTHERN_LOOP,
      id:'visual-preview-'+tier,
      level:tier.toUpperCase()+' 1',
      name:BIOMES[tier].name
    };
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    art.paintScene(ctx,WIDTH,HEIGHT,world,preview);
  }
}
drawGallery();
