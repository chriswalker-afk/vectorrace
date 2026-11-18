# Snowshift V18 — Navigation and local Pass & Play

## Navigation contract
- The **Home** button always navigates to \`index.html\` (mode selection), never a default track.
- The first home decision is **Single Player** or **Pass & Play**. Both lead to the same \`select-track.html\` route, with a game mode carried in the URL.
- The selector derives all **12 current circuits** and their four difficulty regions from the canonical \`CIRCUITS\` list. There are no duplicate in-game track-selection overlays.
- Selecting a track starts \`race.html?track=<id>&mode=single\` or \`race.html?track=<id>&mode=pass-play&players=2|3|4\`.
- In a race, **Change Track** returns to the selection page for the same mode and player count. **Home** returns to mode selection. **Reset** restarts the current event, not Track 1. **Race Again** stays on the same circuit.
- Invalid or missing track identifiers route to the selector; the old \`race-v17.html\` remains available solely as a regression snapshot.

## Pass & Play rules (local only)
- Two to four players, named Player 1 through Player 4, share a device. There is no account, online room or Cloudflare service.
- One **GLIDE** attempt per player, followed by a prominent **Pass the Device** overlay with **Start Player N's Turn**.
- Each player's position, velocity, checkpoints, ordered gates, laps, trail, turn count, crashes and deterministic moving-hazard phase are kept independently. Each uses identical physics and course geometry. Racers do not collide with each other.
- Finished players are skipped, and a sole remaining player can continue without passing to themselves.
- After all players finish, the game presents ranked results. **Score = attempted turns + 3 per crash**; lowest score wins, ties are supported.
- Solo PB/ghost data are isolated: Pass & Play neither displays the solo ghost nor writes to solo records.

## Test expectations
1. Mode selection → track selection → race for both modes.
2. Twelve cards, correct tiers and no menu duplication.
3. Player-count selection 2–4 and corresponding URL/state.
4. Round-robin move -> handoff -> next player; persistent independent scores.
5. Home / Change Track routes and reset semantics from every stage.
6. Mobile portrait and short landscape control visibility.
7. Retain the historical V17 gameplay browser suite without changing its physics.
