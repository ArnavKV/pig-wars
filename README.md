# Pig Wars

Pig Wars is a recovered browser tower defense game built collaboratively with HTML, CSS, and vanilla JavaScript. Defend the cake from pigs using two robots and a movable magical pearl. The restoration keeps the original artwork, four randomized routes, terrain choices, tower upgrades, coin rewards, and increasing enemy difficulty.

## Run locally

There is no build step, package installation, or backend. You need a desktop browser and, for the recommended setup, Python 3.

1. Clone or download this repository and open a terminal in its folder.
2. Start a local static server:

   ```sh
   python3 -m http.server 8000 --bind 127.0.0.1
   ```

3. Open [http://127.0.0.1:8000](http://127.0.0.1:8000) and select **To Game**, or read **Instructions → Keybinds** first.
4. Keep the terminal running while playing. Press `Ctrl+C` in that terminal to stop the server.

If port 8000 is occupied, choose another port and use the matching URL. Opening `index.html` directly may also work, but local file storage behavior varies between browsers. Use the server for consistent score storage between pages.

## How to play

Pigs travel from the bottom-right corner to the cake at the top-left. Use coins to place and upgrade defenses. The coin balance also serves as your final score; spending coins reduces it. The game starts with 5 coins and a 120-second countdown, then enters an infinity-marked boss phase with stronger enemies. A pig reaching the cake ends the game. The original win condition is surviving until the enemy movement interval reaches zero.

There is no separate clickable shop: purchases, upgrades, and sales use the keyboard. Turrets must be placed off the path next to the appropriate robot. Crystals go on empty path tiles; portals and crystal spreaders go off the path.

| Key | Action / coin cost |
| --- | --- |
| W / S | Move the left robot up / down |
| Left / Right arrows | Move the top robot |
| I / J / K / L | Move the pearl up / left / down / right |
| D | Place/upgrade snowball turret: 3 → 4 → 5 → 6 |
| F | Place/upgrade rock turret: 4 → 5 → 6 |
| R | Convert a **base** snowball turret to fire, then upgrade: 12 → 15 → 18 |
| Alt (either side) | Place/upgrade sonic shooter: 3 → 4 → 8 |
| Shift (either side) | Place anvil dropper: 5 |
| P | Place crystal spreader at the pearl: 20 |
| U | Place crystal at the pearl: 3 |
| O | Place portal at the pearl: 1 each, maximum two |
| E | Fire horizontal and sonic towers immediately: 5 |
| Q | Sell towers beside both robots, using the original refund amounts |

Repeat a tower's placement key to upgrade it. Upgrades retain the original multiple-hit behavior. Horizontal and sonic towers fire automatically about every 2.9 seconds; anvils drop about every 5.9 seconds, and spreaders place adjacent path crystals about every 15 seconds. A portal needs a partner to redirect a shot; shots can teleport once per firing pass. Rocks and the final sonic upgrade can damage armored enemies and stone obstacles. **Surrender** ends the run and opens the loss screen.

Final score and high score are stored in the browser's `localStorage` under `score` and `highscore`. They are specific to the browser/profile and origin (host and port); clearing site data removes them.

## Verification

Run the dependency-free logic regression suite with Node.js 18 or newer:

```sh
node --test tests/game.test.cjs
```

The suite covers all four routes, keyboard purchases and upgrades, selling, all enemy damage stages in both firing directions, projectile armor rules, paired/unpaired portals, anvil collisions, pearl actions, score persistence, boss/win/loss transitions, local asset/navigation references, and accelerated timer runs. It simulates DOM elements, storage, and timers; it does **not** verify browser rendering or real keyboard delivery.

During restoration, all 110 image files were inventoried, all referenced image paths were found, and the local server returned the gameplay page successfully. Visual rendering and browser interaction still require the following manual check; automated browser access was unavailable in the restoration environment.

### Browser smoke test

1. Open the home page. Check its artwork and buttons. Visit Instructions, Keybinds, Back to Instructions, and Return, then start a game.
2. Use a wide desktop window (roughly 1400 × 850 or larger). Confirm terrain, cake, robots, pearl, and spawning pigs appear. Keep the browser console open to watch for JavaScript errors.
3. Press D at the starting left-robot position. The balance should fall from 5 to 2. Watch snowballs fire automatically and pigs change appearance when hit. Use W/S and the arrow keys to check robot movement without page scrolling.
4. As coins permit, check rock/fire upgrades, sonic upgrades, anvil drops, Q sales, and E's 5-coin charge. Confirm insufficient funds prevent purchases.
5. Move the pearl with I/J/K/L. Check crystals on the path, a pair of off-path portals, and a spreader beside a path. Verify crystal consumption and redirected projectiles.
6. Surrender and check the loss score. Return home and confirm the high score. Start another run and let a pig reach the cake. Repeat games to sample different layouts.
7. For a longer playtest, survive the countdown and verify the boss phase. The regression suite checks the win transition directly; a complete real-time winning run has not been verified.

## Restoration fixes

Small fixes in `script.js` correct anvil affordability, sonic upgrades skipping a tier, sales removing other towers' firing entries, sonic hits targeting the wrong cell, invalid/unpaired portal destinations and portal loops, anvil soldier/crate collisions and bottom-row hits, dead/projectile entries becoming phantom pigs, overlapping spawns, floating-point timer checks, and a win condition that could be skipped when speed crossed zero. Arrow/modifier keys now prevent browser default actions. Minor HTML cleanup removes extra closing tags, corrects the initial countdown, and documents the manual firing cost and paired portals. No artwork was replaced and no framework was introduced.

## Known limitations

- The original board uses three overlapping 12 × 8 tables with 96-pixel tiles and fixed-position status controls. Small windows need scrolling; there are no mobile/touch controls or responsive layout.
- Gameplay uses legacy keyboard codes for arrows/modifiers. Browser/OS shortcuts may intercept Alt or Shift; both sides are accepted even though the in-game keybind page names the right-side keys.
- There is no pause, saved run, audio system, or separate shop screen. Background-tab timer throttling may slow gameplay.
- Final scores require available browser storage. Storage-disabled environments are not supported by the original score scripts.
- Q sells robot-adjacent towers only. Portals, crystals, and spreaders have no sale action. Fire conversion works only on the base snowball turret.
- Difficulty, refunds, countdown-based speed progression, and the unusual survival win condition retain the original balance. Long-run balance and cross-browser visual behavior need further playtesting.
- The source contains unused sprite variables and a legacy tutorial branch, but no `tutorial.html` page. The available help pages are Instructions and Keybinds.

## Project files

- `index.html` / `index.js`: home menu and high score.
- `instruction.html`, `keybinds.html`: gameplay help and controls.
- `main.html` / `script.js`: layered game board, input, enemies, defenses, and timer.
- `win.html`, `lose.html`, `score.js`: results and saved score display.
- `style.css`: original styling and fixed board layout.
- `images/`: 110 PNG, GIF, and JPEG assets, including unused alternatives.
- `tests/game.test.cjs`: dependency-free logic regression tests.

## Contributions and asset credits

Developed collaboratively; individual contributor credits are still being documented. The original comments in `script.js` attribute sprites/textures to Minecraft (Mojang/Microsoft), Angry Birds, and Clash Royale (Supercell), with references to [Nova Skin](https://minecraft.novaskin.me/resourcepacks#default/assets/minecraft/models/block), [The Spriters Resource](https://www.spriters-resource.com/mobile/angrybirds/sheet/66438/), and the [Clash Royale Wiki](https://clashroyale.fandom.com/wiki/Royal_Hogs).

These are recovered attribution references, not a verified asset-by-asset license record. No project license file is included. Confirm collaborator permission and asset redistribution rights before publishing or distributing the game.
