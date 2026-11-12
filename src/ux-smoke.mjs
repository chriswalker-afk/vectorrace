/**
 * Runs only when the URL contains ?qa=1. GitHub Actions uses the resulting
 * html[data-qa] attribute to verify that primary controls are within viewport.
 * No network calls, dependencies, scrolling hacks, or hidden browser actions.
 */
if (new URLSearchParams(location.search).get('qa') === '1') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const errors=[];
      const width=window.innerWidth,height=window.innerHeight;
      const required=[
        '#course','#commit','#help','#reset','#showGrid',
        '#modeOptions','#accelerationPad','#nextMoveLabel',
        '#currentVelocity','#selectedAcceleration','#nextVelocity',
        '.checkpoint-list','.board-scores','.game-board','.race-panel'
      ];
      for (const selector of required) {
        const element=document.querySelector(selector);
        if (!element) {errors.push('Missing: '+selector);continue;}
        const rect=element.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) {
          errors.push('Zero-size: '+selector);continue;
        }
        if (rect.left < -1 || rect.top < -1 || rect.right > width+1 || rect.bottom > height+1) {
          errors.push('Outside viewport: '+selector+' '+JSON.stringify(
            [Math.round(rect.left),Math.round(rect.top),Math.round(rect.right),Math.round(rect.bottom)]
          ));
        }
      }
      if(document.documentElement.scrollWidth > width+1 ||
         document.documentElement.scrollHeight > height+1) {
        errors.push('Document requires scrolling');
      }
      const pad=document.querySelectorAll('#accelerationPad button');
      if(pad.length!==9)errors.push('Expected nine acceleration buttons, got '+pad.length);
      const modeButtons=document.querySelectorAll('[data-mode]');
      if(modeButtons.length!==3)errors.push('Expected three assistance modes');
      if(pad.length===9 && [...pad].some(b=>b.getBoundingClientRect().width < 25 ||
        b.getBoundingClientRect().height < 24))errors.push('Acceleration target too small');
      const board=document.querySelector('.game-board')?.getBoundingClientRect();
      if(board && (board.width < 150 || board.height < 95))errors.push('Race board unreadably small');

      // Modes must apply immediately and never change the engine scoreboard.
      const originalScore=document.getElementById('score').textContent;
      document.querySelector('[data-mode="expert"]').click();
      if(document.getElementById('nextVelocity').textContent!=='( ?, ? )')
        errors.push('Expert mode exposed prediction');
      document.querySelector('[data-mode="standard"]').click();
      if(document.getElementById('nextVelocity').textContent==='( ?, ? )')
        errors.push('Standard mode hid prediction');
      document.querySelector('[data-mode="guided"]').click();
      if(document.getElementById('score').textContent!==originalScore)
        errors.push('Mode changed score');
      // Selecting acceleration and moving must work via real UI controls.
      const east=document.querySelector('#accelerationPad [data-x="1"][data-y="0"]');
      east.click();
      document.getElementById('commit').click();
      if(document.getElementById('moves').textContent!=='01')
        errors.push('Committing first glide did not advance race');

      const pass=errors.length===0;
      document.documentElement.dataset.qa=pass?'PASS':'FAIL';
      const report=document.createElement('pre');
      report.id='qa-report';
      report.hidden=true;
      report.textContent=JSON.stringify({pass,width,height,errors});
      document.body.appendChild(report);
    },600);
  });
}
