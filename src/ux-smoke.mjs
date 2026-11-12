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
      // Interactive tutorial must also remain wholly visible on the same screen.
      document.getElementById('help').click();
      const coach=document.getElementById('tutorial');
      if(coach.hidden) errors.push('How-to-play coach did not open');
      const coachRect=coach.getBoundingClientRect();
      const coachNext=document.getElementById('tourNext').getBoundingClientRect();
      const coachText=document.getElementById('tourText').getBoundingClientRect();
      if(coachRect.left < -1 || coachRect.right > width+1 ||
         coachRect.top < -1 || coachRect.bottom > height+1)
        errors.push('Tutorial overlay leaves viewport');
      if(coachNext.bottom > coachRect.bottom+1 || coachNext.top < coachRect.top-1 ||
         coachText.bottom > coachRect.bottom+1)
        errors.push('Tutorial content or Next button clipped by overlay');
      document.getElementById('tourNext').click();
      if(document.getElementById('tourIndex').textContent!=='2 / 4')
        errors.push('Tutorial did not advance to step 2');
      const east=document.querySelector('#accelerationPad [data-x="1"][data-y="0"]');
      east.click();
      if(document.getElementById('tourIndex').textContent!=='3 / 4')
        errors.push('Tutorial did not react to choosing an acceleration');
      document.getElementById('commit').click();
      if(document.getElementById('moves').textContent!=='01')
        errors.push('Committing first glide did not advance race');
      if(document.getElementById('tourIndex').textContent!=='4 / 4')
        errors.push('Tutorial did not react to glide');
      document.getElementById('tourNext').click();
      if(!coach.hidden) errors.push('Tutorial did not close after final step');

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
