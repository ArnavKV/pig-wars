// Dependency-free regression tests; DOM/storage/timers are simulated, not a browser.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
function game(map = .1) {
  const cells = Object.fromEntries(['main', 'second', 'third'].map(id => [id, Array.from({length: 96}, () => ({innerHTML: ''}))]));
  const labels = {};
  const stored = new Map();
  let keydown;
  const context = vm.createContext({
    console: {log() {}}, Math: Object.assign(Object.create(Math), {random: () => map}),
    window: {location: {pathname: '/main.html', href: 'main.html'}},
    document: {querySelectorAll: selector => cells[selector.split(' ')[0].slice(1)], getElementById: id => labels[id] ||= {}, addEventListener: (_, fn) => {keydown = fn;}},
    localStorage: {getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, String(value))},
    setTimeout() {},
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'script.js'), 'utf8'), context);
  return {run: code => vm.runInContext(code, context), key: (key, keyCode = 0, code = '') => keydown({key, keyCode, code, preventDefault() {}}), cells, labels, stored, context};
}
test('all maps render and pigs follow their route to the cake', () => {
  for (const map of [.1, .3, .6, .9]) {
    const g = game(map);
    assert.equal(g.cells.main.filter(c => c.innerHTML.includes('images/')).length, 96);
    g.run('summonPig()');
    for (let step = 0; step < 100 && g.context.window.location.href === 'main.html'; step++) g.run('movePigs()');
    assert.equal(g.context.window.location.href, 'lose.html');
    assert.equal(g.stored.get('score'), '5');
  }
});
test('anvil price, sonic single-step upgrades and selling preserve other towers', () => {
  const g = game();
  g.run('score = 3'); g.key('Shift', 16, 'ShiftRight');
  assert.equal(g.run('score'), 3); assert.equal(g.run('posArray1.length'), 0);
  g.run('score = 100'); g.key('Alt', 18, 'AltRight');
  assert.equal(g.run('state1[1][3] === s'), true);
  g.key('Alt', 18, 'AltRight'); assert.equal(g.run('state1[1][3] === cs'), true);
  assert.equal(g.run('score'), 93);
  g.key('Alt', 18, 'AltRight'); assert.equal(g.run('state1[1][3] === shrieker'), true);
  g.key('d'); g.key('s'); g.key('f'); g.key('w'); g.key('d'); g.key('r');
  // Convert only an unupgraded snow turret, as in the original rules.
  g.key('q'); assert.equal(g.run('posArray.every(row => row === 3)'), true);
  g.run('state1[1][4] = s; posArray2.push(4)'); g.key('q');
  assert.equal(g.run('posArray2.length === 1 && posArray2[0] === 4'), true);
  g.run('shoot(); shootBoom()');
});
test('snow, rock, fire and sonic projectiles damage enemies with original armor rules', () => {
  const g = game();
  for (const [tower, target, expected] of [['dropper','a','pig'], ['dropper','s1','s1'], ['dispenser1','s1','s2'], ['flamer1','puffPig','poof']]) {
    g.run(`state1 = Array.from({length:height}, () => Array(width).fill(E)); posArray = [2]; state1[2][1] = ${tower}; state1[2][3] = ${target}; shoot()`);
    assert.equal(g.run(`state1[2][3] === ${expected}`), true);
  }
  g.run('state1 = Array.from({length:height}, () => Array(width).fill(E)); posArray2 = [10]; state1[1][10] = s; state1[4][10] = r5; shootBoom()');
  assert.equal(g.run('state1[4][10] === poof'), true);
  g.run('state1[1][10] = shrieker; state1[4][10] = s1; shootBoom()');
  assert.equal(g.run('state1[4][10] === s2'), true);
});
test('unpaired and paired portals stay in bounds and cannot loop forever', () => {
  const g = game();
  g.run('state1 = Array.from({length:height}, () => Array(width).fill(E)); posArray = [2]; state1[2][1] = dropper; state1[2][3] = portal; portals = 1; xp1 = 3; yp1 = 2; shoot()');
  assert.equal(g.run('state1[2].length'), 12);
  g.run('portals = 2; xp2 = 5; yp2 = 4; state1[4][5] = portal; state1[4][7] = puffPig; shoot()');
  assert.equal(g.run('state1[4][7] === poof'), true);
  g.run('state1[2][3] = E; posArray2 = [3]; state1[1][3] = s; state1[3][3] = portal; yp1 = 3; xp1 = 3; xp2 = 9; yp2 = 2; state1[2][9] = portal; state1[5][9] = puffPig; shootBoom()');
  assert.equal(g.run('state1[5][9] === poof'), true);
});
test('anvils preserve soldier/crate transformations and hit the bottom row', () => {
  const g = game();
  g.run('state1[3][3] = s1; anvilArray = [[3,3,anvil]]; moveAnvils()');
  assert.equal(g.run('state1[3][3] === pig'), true);
  g.run('state1[3][3] = c1; anvilArray = [[3,3,anvil]]; moveAnvils()');
  assert.equal(g.run('state1[3][3] !== poof && state1[3][3] !== E'), true);
  g.run('state1[6][3] = anvil; state1[7][3] = s1; anvilArray = [[6,3,anvil]]; moveAnvils()');
  assert.equal(g.run('state1[7][3] === pig'), true);
  g.run('state1[7][3] = anvil; anvilArray = [[7,3,anvil]]; moveAnvils()');
  assert.equal(g.run('anvilArray.length'), 0);
});
test('pearl purchases, crystals and movement work', () => {
  const g = game(); g.run('score = 100');
  g.key('l'); g.key('u'); assert.equal(g.run('state1[0][1] === crystal'), true);
  g.key('l'); g.key('o'); g.key('l'); g.key('o'); g.key('l'); g.key('o');
  assert.equal(g.run('portals'), 2);
  g.key('k'); g.key('p'); assert.equal(g.run('state1[1][4] === star'), true);
  g.run('placeCrystals()');
  g.key('i'); g.key('j'); assert.equal(g.run('x2 === 3 && y2 === 0'), true);
  g.key('ArrowRight', 39, 'ArrowRight'); assert.equal(g.run('x1'), 4);
  g.key('ArrowLeft', 37, 'ArrowLeft'); assert.equal(g.run('x1'), 3);
});
test('dead pigs cannot lose or become phantom projectiles; spawn cells cannot double up', () => {
  const g = game();
  g.run('pigArray = [[0,0,puffPig,false]]; state1[0][0] = poof; movePigs()');
  assert.equal(g.context.window.location.href, 'main.html');
  g.run('pigArray = [[7,11,puffPig,false]]; state1[7][11] = fire1; movePigs()');
  assert.equal(g.run('pigArray.length'), 0);
  g.run('summonPig(); summonPig()'); assert.equal(g.run('pigArray.length'), 1);
});
test('timer enters boss phase, saves a win even when speed crosses zero, and surrender saves score', () => {
  const g = game(); g.run('secs = .1; timer()'); assert.equal(g.run('boss'), true);
  g.run('score = 42; moveInterval = -1; timer()');
  assert.equal(g.context.window.location.href, 'win.html'); assert.equal(g.stored.get('score'), '42');
  g.run('score = 45; back()'); assert.equal(g.context.window.location.href, 'lose.html'); assert.equal(g.stored.get('highscore'), '45');
});
test('local references exist, board layers have 96 cells, and score screens read storage', () => {
  for (const name of fs.readdirSync(root).filter(n => /\.(html|js|css)$/.test(n))) {
    const source = fs.readFileSync(path.join(root, name), 'utf8');
    for (const match of source.matchAll(/images\/[A-Za-z0-9_.-]+/g)) assert.ok(fs.existsSync(path.join(root, match[0])), `${name}: ${match[0]}`);
    for (const match of source.matchAll(/(?:src|href)=["']([^"']+)["']|window.location.href\s*=\s*['"]([^'"]+)['"]|url\(["']?([^"')]+)["']?\)/g)) {
      const reference = match[1] || match[2] || match[3];
      if (!reference.includes('://')) assert.ok(fs.existsSync(path.join(root, reference)), `${name}: ${reference}`);
    }
  }
  const html = fs.readFileSync(path.join(root, 'main.html'), 'utf8');
  assert.equal((html.match(/<td>/g) || []).length, 288);
  const g = game(); g.stored.set('score', '31'); g.stored.set('highscore', '50');
  for (const file of ['score.js', 'index.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), g.context);
  assert.equal(g.labels.score1.innerHTML, 'Score: 31🪙');
  assert.equal(g.labels.highscore.innerHTML, 'High Score: 50🪙');
});
test('every horizontal tower upgrade keeps its cost and firing strength', () => {
  for (const [keys, expected, cost, shots] of [
    [['d','d','d','d'], 'dropper4', 18, 4],
    [['f','f','f'], 'dispenser3', 15, 3],
    [['d','r','r','r'], 'flamer3', 48, 7],
  ]) {
    const g = game(); g.run('score = 100');
    for (const key of keys) g.key(key);
    assert.equal(g.run(`state1[2][1] === ${expected}`), true);
    assert.equal(g.run('score'), 100 - cost);
    assert.equal(g.run('posArray.length'), shots);
    g.run('state1[2][3] = c1; shoot()');
    assert.equal(g.run(`state1[2][3] === c${shots + 1}`), true);
    g.run('state1[2][3] = E');
    const before = g.run('score'); g.key('e');
    assert.equal(g.run('score'), before - 5);
  }
});
test('all enemy damage stages resolve in both firing directions', () => {
  const stages = [
    ['a','pig'], ['pig','poof'], ['puffPig','poof'],
    ['king','king0'], ['king0','king1'], ['king1','king2'], ['king2','poof'],
    ['r1','r2'], ['r2','r3'], ['r3','r4'], ['r4','r5'], ['r5','poof'],
    ['mustache1','mustache2'], ['mustache2','mustache3'], ['mustache3','poof'],
    ['s1','s2'], ['s2','s3'], ['s3','pig'], ['monster','poof'],
    ...Array.from({length: 9}, (_, i) => [`c${i+1}`, `c${i+2}`]),
    ['b1','b2'], ['b2','b3'], ['b3','b4'], ['b4','poof'],
  ];
  for (const direction of ['horizontal', 'vertical']) {
    const g = game();
    for (const [enemy, expected] of stages) {
      g.run('state1 = Array.from({length:height}, () => Array(width).fill(E))');
      if (direction === 'horizontal') g.run(`posArray = [2]; state1[2][1] = dispenser1; state1[2][3] = ${enemy}; shoot()`);
      else g.run(`posArray2 = [10]; state1[1][10] = shrieker; state1[3][10] = ${enemy}; shootBoom()`);
      assert.equal(g.run(`state1[${direction === 'horizontal' ? '2][3' : '3][10'}] === ${expected}`), true, `${direction}: ${enemy}`);
    }
  }
});
test('thousands of timer ticks on each map do not throw or create oversized boards', () => {
  for (const map of [.1, .3, .6, .9]) {
    const g = game(map);
    for (let i = 0; i < 5000; i++) {
      g.run('timer()');
      if (g.context.window.location.href !== 'main.html') {
        // Keep testing later phases after a loss without changing movement logic.
        g.run('pigArray = []; state1[0][0] = cake');
        g.context.window.location.href = 'main.html';
      }
    }
    assert.equal(g.run('state1.length === height && state1.every(row => row.length === width)'), true);
  }
});
