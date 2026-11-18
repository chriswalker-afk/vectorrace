// Public V18 smoke test probe: legacy QA remains attached to race-v17.html.
if(new URLSearchParams(location.search).get('qa')==='1'){
  window.addEventListener('load',()=>{
    setTimeout(()=>{
      const errors=[];
      const params=new URLSearchParams(location.search);
      const multi=params.get('mode')==='pass-play';
      const required=['course','commit','homeLink','mapPicker','finishChooseTrack','finishPanel',
        'reset','help','showGrid','playerStrip','handoffPanel','beginTurn','matchResults'];
      for(const id of required)if(!document.getElementById(id))errors.push('Missing '+id);
      if(document.getElementById('mapMenu'))errors.push('Duplicated in-game track selector');
      if(!document.getElementById('mapPicker')?.getAttribute('href')?.includes('select-track.html'))
        errors.push('Change Track must return to selector');
      if(!document.getElementById('homeLink')?.getAttribute('href')?.includes('index.html'))
        errors.push('Home must return to title screen');
      if(multi){
        const n=Number(params.get('players')||2);
        if(document.querySelectorAll('.player-chip').length!==n)errors.push('Wrong player count');
        if(document.getElementById('playerStrip')?.hidden)errors.push('Missing standings');
        if(!document.getElementById('ghostToggle')?.hidden)errors.push('Solo ghost should be hidden');
      }else if(!document.getElementById('playerStrip')?.hidden){
        errors.push('Solo mode displays multiplayer standings');
      }
      document.documentElement.dataset.qa=errors.length?'fail':'pass';
      window.__snowshiftV18QA={pass:!errors.length,errors};
    },200);
  });
}
