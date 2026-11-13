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
        '.checkpoint-list','.board-scores','.game-board','.race-panel',
        '#mapPicker','#mapName','#mapLevel'
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
      if(modeButtons.length!==4)errors.push('Expected four assistance modes');
      if([...modeButtons].map(b=>b.dataset.mode).join(',')!=='guided,standard,expert,master')
        errors.push('Mode buttons are not ordered Guided → Standard → Expert → Master');
      for(const button of modeButtons){
        const rect=button.getBoundingClientRect();
        if(rect.left < -1 || rect.right > width+1 || rect.top < -1 || rect.bottom > height+1 ||
           rect.width < 30 || rect.height < 24)
          errors.push('Mode button clipped or too small: '+button.dataset.mode);
      }
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
      document.querySelector('[data-mode="master"]').click();
      if(document.getElementById('accelerationPad').dataset.notation!=='columns')
        errors.push('Master did not switch to column-vector controls');
      if(document.querySelector('[data-mode="master"]').getAttribute('aria-pressed')!=='true')
        errors.push('Master button not selected');
      if(document.getElementById('nextVelocity').dataset.hidden!=='true' ||
         [...document.querySelectorAll('#nextVelocity [data-component]')].some(el=>el.textContent!=='?'))
        errors.push('Master leaked the next-velocity prediction');
      if(!/No prediction/.test(document.getElementById('nextMoveLabel').textContent))
        errors.push('Master leaked a predictive hint');
      for(const button of pad) {
        const matrix=button.querySelector('.column-vector');
        const x=matrix?.querySelector('[data-component="x"]');
        const y=matrix?.querySelector('[data-component="y"]');
        if(!matrix || !x || !y) {
          errors.push('Missing Master matrix for acceleration '+button.dataset.x+','+button.dataset.y);
          continue;
        }
        if(x.textContent!==button.dataset.x || y.textContent!==button.dataset.y)
          errors.push('Incorrect Master vector component order');
        const rect=matrix.getBoundingClientRect();
        const key=button.getBoundingClientRect();
        const top=x.getBoundingClientRect(),bottom=y.getBoundingClientRect();
        if(top.top>=bottom.top || top.bottom>bottom.top+1)
          errors.push('Master vector entries overlap or reversed');
        if(rect.left<key.left-1 || rect.right>key.right+1 ||
           rect.top<key.top-1 || rect.bottom>key.bottom+1)
          errors.push('Master matrix clipped by acceleration button');
        if(!button.getAttribute('aria-label')?.includes('top x-component'))
          errors.push('Missing Master accessibility label');
      }
      const downLeft=document.querySelector('#accelerationPad [data-x="-1"][data-y="-1"]');
      downLeft.click();
      if(downLeft.getAttribute('aria-pressed')!=='true' ||
         document.querySelector('#selectedAcceleration [data-component="x"]').textContent!=='-1' ||
         document.querySelector('#selectedAcceleration [data-component="y"]').textContent!=='-1')
        errors.push('Selecting a Master column vector did not change the acceleration');
      // Master guidance must describe the mathematical notation in its tutorial.
      document.getElementById('help').click();
      document.getElementById('tourNext').click();
      if(!/column vector/.test(document.getElementById('tourText').textContent))
        errors.push('Master tutorial does not explain column vector selection');
      document.getElementById('closeTutorial').click();
      document.querySelector('[data-mode="expert"]').click();
      if(document.getElementById('accelerationPad').dataset.notation!=='arrows' ||
         [...pad].some(button=>button.querySelector('.column-vector')))
        errors.push('Switching back from Master did not restore arrow controls');
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


      // Map selection must remain on the same screen; both preview cards and
      // buttons must fit without scroll, even on a 320 px portrait phone.
      const initialCircuit = new URLSearchParams(location.search).get('track') === 'aurora-split'
        ? 'aurora-split' : 'northern-loop';
      const otherCircuit = initialCircuit === 'aurora-split' ? 'northern-loop' : 'aurora-split';
      function checkMapMenuFit() {
        const menu=document.getElementById('mapMenu');
        if(menu.hidden) errors.push('Map chooser did not open');
        const rect=menu.getBoundingClientRect();
        if(rect.left < -1 || rect.top < -1 || rect.right > width+1 ||
           rect.bottom > height+1) errors.push('Circuit chooser outside viewport');
        for (const option of menu.querySelectorAll('button')) {
          const box=option.getBoundingClientRect();
          if(box.left < rect.left-1 || box.right > rect.right+1 ||
             box.top < rect.top-1 || box.bottom > rect.bottom+1 ||
             box.height < 34)
            errors.push('Circuit choice clipped or too small: '+option.dataset.circuit);
        }
      }
      document.getElementById('mapPicker').click();
      checkMapMenuFit();
      const alt=document.querySelector('[data-circuit="'+otherCircuit+'"]');
      alt.click();
      if(!document.getElementById('mapMenu').hidden ||
         document.getElementById('mapPicker').getAttribute('aria-expanded')!=='false')
        errors.push('Circuit chooser remained open after selection');
      if(document.getElementById('moves').textContent!=='00' ||
         document.getElementById('score').textContent!=='00')
        errors.push('Switching circuits did not reset the race');
      if(document.querySelector('[data-circuit="'+otherCircuit+'"]').getAttribute('aria-current')!=='true')
        errors.push('Circuit active state not updated');
      if(new URL(location.href).searchParams.get('track')!==otherCircuit)
        errors.push('New circuit was not deep-linked in URL');
      document.getElementById('mapPicker').click();
      checkMapMenuFit();
      document.querySelector('[data-circuit="'+initialCircuit+'"]').click();
      if(document.querySelector('[data-circuit="'+initialCircuit+'"]').getAttribute('aria-current')!=='true')
        errors.push('Switching back did not restore first circuit');
      if(document.documentElement.scrollHeight > height+1 ||
         document.documentElement.scrollWidth > width+1)
        errors.push('Map switch unexpectedly introduced page scrolling');

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
