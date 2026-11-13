/**
 * Visual progression is independent from the game's acceleration/collision
 * rules. A track's level selects a visual region; a future track can opt into
 * Advanced or Expert simply by setting level: 'ADVANCED 1' or 'EXPERT'.
 * No visual theme injects wind, friction, boosts, or hidden obstacles.
 *
 * Contrast: skimmer coral / checkpoint green remain readable against all
 * racing surfaces. Navigation always includes text labels, never colour alone.
 */
const freeze = obj => Object.freeze(obj);
export const TIERS = freeze(['beginner', 'intermediate', 'advanced', 'expert']);
export const BIOMES = freeze({
  beginner: freeze({
    id: 'beginner', name: 'Snowbound Valley', shortName: 'SNOWBOUND',
    tagline: 'Bright alpine training grounds', scenery: 'alpine',
    accent: '#d4fc77', accentDark: '#678e36', pale: '#eff9fb',
    panel: '#143c51', panelDeep: '#092435', uiBg: '#081b2b',
    ground: freeze(['#e4f1f2','#c1dce6','#aacfd9','#91bcca']),
    groundTextureAlpha: .46, iceTextureAlpha: .46,
    road: freeze(['#205a75','#16435f','#24647e','#113b58']),
    roadBase: '#164b65', bankShadow: '#071d33b0',
    bankGlow: '#3c91aa8a', bankDark: '#2e6880a0',
    bankMid: '#93bccb', bankLight: '#edf9fb', bankEdge: '#ffffff',
    etch: '#d4f5f530', contour: '#f3ffff', detail: '#7fbed0'
  }),
  intermediate: freeze({
    id: 'intermediate', name: 'Aurora Vale', shortName: 'AURORA',
    tagline: 'Violet night skies and luminous ice crystals',
    scenery: 'aurora', accent: '#d4a6ff', accentDark: '#684da9',
    pale: '#e9faff', panel: '#302754', panelDeep: '#151932', uiBg: '#110f2c',
    ground: freeze(['#161643','#343174','#25235c','#0a1737']),
    groundTextureAlpha: .12, iceTextureAlpha: .23,
    road: freeze(['#246f92','#13546e','#316f9b','#163456']),
    roadBase: '#1e587a', bankShadow: '#10092bd9',
    bankGlow: '#976eea99', bankDark: '#6653b9d0',
    bankMid: '#bba0f5', bankLight: '#d3c9ff', bankEdge: '#f3e5ff',
    etch: '#82f1ff72', contour: '#c5afff', detail: '#89ffe7'
  }),
  advanced: freeze({
    id: 'advanced', name: 'Ember Rift', shortName: 'EMBER RIFT',
    tagline: 'Charcoal basalt, copper ice and glowing fissures',
    scenery: 'ember', accent: '#ffbb76', accentDark: '#99522e',
    pale: '#fff0de', panel: '#493037', panelDeep: '#241c27', uiBg: '#1c151d',
    ground: freeze(['#251b2b','#51353b','#342630','#160f1d']),
    groundTextureAlpha: .07, iceTextureAlpha: .17,
    road: freeze(['#3e6e71','#254c56','#365661','#18343d']),
    roadBase: '#29515a', bankShadow: '#1c0f1ad9',
    bankGlow: '#ff70367d', bankDark: '#8e493dc9',
    bankMid: '#c57f5f', bankLight: '#ffe4bd', bankEdge: '#fff0d9',
    etch: '#ffd07b66', contour: '#ffb48f', detail: '#ff773d'
  }),
  expert: freeze({
    id: 'expert', name: 'Eclipse Summit', shortName: 'ECLIPSE',
    tagline: 'Black-glass ice, gold beacons and silent monoliths',
    scenery: 'eclipse', accent: '#ffe29c', accentDark: '#8e763e',
    pale: '#fff5d6', panel: '#1f2742', panelDeep: '#0a1023', uiBg: '#060a15',
    ground: freeze(['#050919','#151c32','#0b1224','#020510']),
    groundTextureAlpha: .05, iceTextureAlpha: .16,
    road: freeze(['#1b2946','#0c1b35','#253753','#0c1125']),
    roadBase: '#14213a', bankShadow: '#000611ef',
    bankGlow: '#b28c4a8c', bankDark: '#585071cf',
    bankMid: '#a6a9bb', bankLight: '#f4e7ba', bankEdge: '#ffe5a4',
    etch: '#9cb9ed56', contour: '#aabce2', detail: '#fff0b0'
  })
});

export function tierFromLevel(level) {
  const tier = typeof level === 'string' ? level.trim().split(/\s+/)[0].toLowerCase() : '';
  return TIERS.includes(tier) ? tier : 'beginner';
}
export function biomeForLevel(level) {
  return BIOMES[tierFromLevel(level)];
}
export function biomeForCircuit(circuit) {
  return biomeForLevel(circuit?.level);
}
