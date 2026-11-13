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
      for(const id of ['currentVelocity','selectedAcceleration','nextVelocity']) {
        const box=document.getElementById(id);
        const matrix=box?.querySelector('.column-vector');
        const x=matrix?.querySelector('[data-component="x"]');
        const y=matrix?.querySelector('[data-component="y"]');
        if(!matrix||!x||!y) {
          errors.push('Column vector missing or out of order: '+id);continue;
        }
        const rect=matrix.getBoundingClientRect();
        const r1=x.getBoundingClientRect(),r2=y.getBoundingClientRect();
        if(r1.top>=r2.top || r1.bottom>r2.top+1)
          errors.push('Column vector entries not vertically stacked: '+id);
        if(rect.left < -1 || rect.right > width+1 || rect.top < -1 || rect.bottom > height+1)
          errors.push('Column vector outside viewport: '+id);
        if(!box.getAttribute('aria-label')?.includes('column vector'))
          errors.push('Accessible vector description missing: '+id);
      }

      if(!document.getElementById('recordBadge'))errors.push('Missing personal best marker');
      const ghostButton=document.getElementById('ghostToggle');
      if(!ghostButton)errors.push('Missing ghost button');
      if(ghostButton && !ghostButton.hidden)
        errors.push('Ghost must stay hidden without a recorded personal best');
      if(!document.getElementById('eventToast')?.hidden)
        errors.push('Event celebration should be hidden before first move');
      if(!/CLEAR|STOP|FAST/.test(document.getElementById('nextMoveLabel')?.textContent||''))
        errors.push('Guided cornering coach did not provide a braking forecast');
      if(pad.length===9 && [...pad].some(b=>b.getBoundingClientRect().width < 25 ||
        b.getBoundingClientRect().height < 24))errors.push('Acceleration target too small');
      const board=document.querySelector('.game-board')?.getBoundingClientRect();
      if(board && (board.width < 150 || board.height < 95))errors.push('Race board unreadably small');

      // Modes must apply immediately and never change the engine scoreboard.
      const originalScore=document.getElementById('score').textContent;
      document.querySelector('[data-mode="expert"]').click();
      if(document.getElementById('nextVelocity').dataset.hidden!=='true' ||
         [...document.querySelectorAll('#nextVelocity [data-component]')].some(el=>el.textContent!=='?'))
        errors.push('Expert mode exposed next-velocity components');
      if(!/No prediction/.test(document.getElementById('nextMoveLabel').textContent))
        errors.push('Expert mode exposed predictive cornering advice');
      document.querySelector('[data-mode="standard"]').click();
      if(document.getElementById('nextVelocity').dataset.hidden!=='false' ||
         [...document.querySelectorAll('#nextVelocity [data-component]')].some(el=>el.textContent==='?'))
        errors.push('Standard mode hid next-velocity components');
      document.querySelector('[data-mode="guided"]').click();
      if(document.getElementById('score').textContent!==originalScore)
        errors.push('Mode changed score');
      // Interactive tutorial must also remain wholly visible on the same screen.
      document.getElementById('help').click();
      const coach=document.getElementById('tutorial');
      if(coach.hidden) errors.push('How-to-play coach did not open');
      function checkCoachFit(step) {
        const rect=coach.getBoundingClientRect();
        if(rect.left < -1 || rect.right > width+1 ||
           rect.top < -1 || rect.bottom > height+1)
          errors.push('Tutorial overlay leaves viewport at step '+step);
        for(const selector of ['#tourTitle','#tourText','#tourNext','#tourSkip']){
          const item=document.querySelector(selector).getBoundingClientRect();
          if(item.bottom > rect.bottom+1 || item.top < rect.top-1)
            errors.push('Tutorial '+selector+' is clipped at step '+step);
        }
      }
      checkCoachFit(1);
      document.getElementById('tourNext').click();
      if(document.getElementById('tourIndex').textContent!=='2 / 4')
        errors.push('Tutorial did not advance to step 2');
      checkCoachFit(2);
      const east=document.querySelector('#accelerationPad [data-x="1"][data-y="0"]');
      east.click();
      if(document.getElementById('tourIndex').textContent!=='3 / 4')
        errors.push('Tutorial did not react to choosing an acceleration');
      checkCoachFit(3);
      document.getElementById('commit').click();
      if(document.getElementById('moves').textContent!=='01')
        errors.push('Committing first glide did not advance race');
      if(document.getElementById('tourIndex').textContent!=='4 / 4')
        errors.push('Tutorial did not react to glide');
      checkCoachFit(4);
      document.getElementById('tourNext').click();
      if(!coach.hidden) errors.push('Tutorial did not close after final step');

      // A completed race must also offer a visible, unscrollable restart button.
      const finish=document.getElementById('finishPanel');
      finish.hidden=false;
      const finishCard=finish.querySelector('.finish-card');
      const finishRect=finishCard.getBoundingClientRect();
      const restartRect=document.getElementById('raceAgain').getBoundingClientRect();
      if(finishRect.top < -1 || finishRect.bottom > height+1 ||
         restartRect.top < finishRect.top-1 || restartRect.bottom > finishRect.bottom+1)
        errors.push('Finish card or Race Again leaves the viewport');
      if(finishCard.scrollHeight > finishCard.clientHeight+1)
        errors.push('Finish card requires internal scrolling');
      finish.hidden=true;

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
