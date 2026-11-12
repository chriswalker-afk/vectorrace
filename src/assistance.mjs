/** Assistance only: these policies never alter movement, scoring or collision physics. */
export const MODES = Object.freeze(['guided', 'standard', 'expert']);
export function modePolicy(mode) {
  switch (mode) {
    case 'guided':
      return Object.freeze({ allDestinations: true, selectedDestination: true,
        nextVelocity: true, warnings: true, coordinateGrid: true });
    case 'standard':
      return Object.freeze({ allDestinations: false, selectedDestination: true,
        nextVelocity: true, warnings: true, coordinateGrid: false });
    case 'expert':
      return Object.freeze({ allDestinations: false, selectedDestination: false,
        nextVelocity: false, warnings: false, coordinateGrid: false });
    default: throw new RangeError('Unknown assistance mode: ' + mode);
  }
}

export function moveExplanation(state, acceleration, mode, preview) {
  const policy = modePolicy(mode);
  if (state.finished) return { tone: 'complete', message: 'Lap complete — race again to improve your line.' };
  if (!policy.warnings) return { tone: 'neutral', message: 'No prediction. Commit when ready.' };
  if (!preview.valid) return { tone: 'danger', message: 'CRASH RISK · Your route crosses snow. Try braking.' };
  if (preview.velocity.x === 0 && preview.velocity.y === 0) {
    return { tone: 'safe', message: 'STOP · You will remain at your current point.' };
  }
  return {
    tone: 'safe',
    message: 'CLEAR · Land at (' + preview.to.x + ', ' + preview.to.y + ')'
  };
}
