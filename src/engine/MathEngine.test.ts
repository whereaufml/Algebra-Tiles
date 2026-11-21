import test from 'node:test';
import assert from 'node:assert/strict';
import {
  areExpressionsEquivalent,
  canCombineLikeTerms,
  computeTileClusters,
  createTile,
  createTilesFromSpec,
  eliminateSpecificZeroPair,
  eliminateZeroPairs,
  formatExpression,
} from './MathEngine';
import {
  applyTileToEquationSide,
  checkEquationSolved,
  createInitialEquationState,
  eliminateEquationZeroPairs,
  formatEquation,
} from './EquationSolver';
import {
  addLikeTileToGroup,
  computeTileGroups,
  computeZeroPairStacks,
  detectDropTarget,
  eliminateZeroPairStack,
  moveGroupByDelta,
  separateZeroPair,
  snapTilesIntoGroup,
  stackZeroPair,
  ungroupTiles,
} from './SnapStackEngine';
import { calculateLevelFromXp, calculateMissionStars, evaluateUnlockedBadges } from './GameSystem';
import { createDefaultProgress } from '../storage/ProgressStorage';

test('T-01: Menambahkan +x dan -x lalu membentuk zero pair meniadakan pasangan dan memperbarui ekspresi', () => {
  const tiles = [
    createTile('x', 1),
    createTile('x', -1),
    createTile('1', 1),
  ];
  assert.equal(formatExpression(tiles, true), '1');

  const result = eliminateZeroPairs(tiles);
  assert.equal(result.removedCount, 1);
  assert.equal(result.remainingTiles.length, 1);
  assert.equal(formatExpression(result.remainingTiles, true), '1');

  const onlyZeroPair = [createTile('x', 1), createTile('x', -1)];
  const cleared = eliminateZeroPairs(onlyZeroPair);
  assert.equal(cleared.removedCount, 1);
  assert.equal(cleared.remainingTiles.length, 0);
  assert.equal(formatExpression(cleared.remainingTiles, true), '0');
});

test('T-02: Menggabungkan 2x dan 3x menghasilkan 5x', () => {
  const tiles = createTilesFromSpec([{ type: 'x', sign: 1, count: 5 }]);
  const combined = canCombineLikeTerms(tiles);
  assert.equal(combined.valid, true);
  assert.equal(combined.resultExpression, '5x');
  assert.equal(formatExpression(tiles, true), '5x');
});

test('T-03: Menggabungkan 2 dan 4 menghasilkan 6', () => {
  const tiles = createTilesFromSpec([{ type: '1', sign: 1, count: 6 }]);
  const combined = canCombineLikeTerms(tiles);
  assert.equal(combined.valid, true);
  assert.equal(combined.resultExpression, '6');
  assert.equal(formatExpression(tiles, true), '6');
});

test('T-04: Mencoba menggabungkan 2x dan 3 ditolak sebagai suku sejenis dengan alasan jelas', () => {
  const tiles = createTilesFromSpec([
    { type: 'x', sign: 1, count: 2 },
    { type: '1', sign: 1, count: 3 },
  ]);
  const combined = canCombineLikeTerms(tiles);
  assert.equal(combined.valid, false);
  assert.match(combined.reason, /berbeda|tidak dapat digabung/i);
  assert.equal(formatExpression(tiles, true), '2x + 3');
});

test('T-05: Membentuk x + 3 = 5 dan mengurangi 3 pada kedua sisi menghasilkan x = 2 secara setara', () => {
  const initial = createInitialEquationState(
    [
      { type: 'x', sign: 1, count: 1 },
      { type: '1', sign: 1, count: 3 },
    ],
    [{ type: '1', sign: 1, count: 5 }]
  );
  assert.equal(formatEquation(initial.leftTiles, initial.rightTiles, true), 'x + 3 = 5');

  const step1Single = applyTileToEquationSide(initial, 'both', '1', -1, 1);
  assert.equal(step1Single.isBalanced, true);
  assert.match(step1Single.message, /menambahkan −1 pada kedua sisi/);

  const step1 = applyTileToEquationSide(initial, 'both', '1', -1, 3);
  assert.equal(step1.isBalanced, true);
  assert.match(step1.message, /menambahkan −3 pada kedua sisi/);

  const step2 = eliminateEquationZeroPairs(step1.nextState);
  assert.equal(step2.isBalanced, true);
  assert.equal(formatEquation(step2.nextState.leftTiles, step2.nextState.rightTiles, true), 'x = 2');

  const solved = checkEquationSolved(step2.nextState, 2);
  assert.equal(solved.solved, true);
});

test('T-06: Melakukan operasi hanya pada satu sisi persamaan menghasilkan peringatan kesetaraan', () => {
  const initial = createInitialEquationState(
    [
      { type: 'x', sign: 1, count: 1 },
      { type: '1', sign: 1, count: 3 },
    ],
    [{ type: '1', sign: 1, count: 5 }]
  );

  const unbalanced = applyTileToEquationSide(initial, 'left', '1', -1, 3);
  assert.equal(unbalanced.isBalanced, false);
  assert.match(unbalanced.message, /Kesetaraan|tanpa operasi yang sama/i);

  const solved = checkEquationSolved(unbalanced.nextState, 2);
  assert.equal(solved.solved, false);
});

test('Evaluasi ekspresi dan syarat zero pair bersih bekerja akurat', () => {
  const withPair = createTilesFromSpec([
    { type: 'x', sign: 1, count: 3 },
    { type: 'x', sign: -1, count: 1 },
    { type: '1', sign: 1, count: 2 },
  ]);
  const checkLoose = areExpressionsEquivalent(withPair, { x2: 0, x: 2, constant: 2 }, false);
  assert.equal(checkLoose.valid, true);

  const checkStrict = areExpressionsEquivalent(withPair, { x2: 0, x: 2, constant: 2 }, true);
  assert.equal(checkStrict.valid, false);
  assert.match(checkStrict.reason, /zero pair/i);
});

test('GameSystem menghitung level, bintang, dan badge dengan benar', () => {
  assert.equal(calculateLevelFromXp(0).level, 1);
  assert.equal(calculateLevelFromXp(250).level, 2);
  assert.equal(calculateMissionStars(1, 0), 3);
  assert.equal(calculateMissionStars(3, 1), 2);
  assert.equal(calculateMissionStars(5, 2), 1);

  const progress = createDefaultProgress();
  progress.stats.zeroPairsCleared = 3;
  progress.completedMissions['misi-dasar-1'] = {
    missionId: 'misi-dasar-1',
    stars: 3,
    attempts: 1,
    hintsUsed: 0,
    completedAt: new Date().toISOString(),
  };
  const badges = evaluateUnlockedBadges(progress);
  assert.ok(badges.includes('badge-algebra-builder'));
  assert.ok(badges.includes('badge-zero-pair-master'));
});

test('eliminateSpecificZeroPair dan computeTileClusters bekerja akurat', () => {
  const xPos = createTile('x', 1, { x: 20, y: 20 }, 'grp-x');
  const xPos2 = createTile('x', 1, { x: 100, y: 20 }, 'grp-x');
  const xNeg = createTile('x', -1, { x: 200, y: 20 });
  const onePos = createTile('1', 1, { x: 20, y: 120 });

  const clusters = computeTileClusters([xPos, xPos2, xNeg]);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].label, '2x');

  const invalidPair = eliminateSpecificZeroPair([xPos, onePos], xPos.id, onePos.id);
  assert.equal(invalidPair.removedCount, 0);

  const validPair = eliminateSpecificZeroPair([xPos, xNeg], xPos.id, xNeg.id);
  assert.equal(validPair.removedCount, 1);
  assert.equal(validPair.remainingTiles.length, 0);
});

test('SNAP & STACK: Membentuk kelompok 3x, memindahkan, menggabungkan kelompok, menambahkan ubin, dan membongkar menjadi 3 ubin terpisah', () => {
  const t1 = createTile('x', 1, { x: 40, y: 50 });
  const t2 = createTile('x', 1, { x: 130, y: 50 });
  const t3 = createTile('x', 1, { x: 220, y: 50 });
  let tiles = [t1, t2, t3];

  // Snap t2 onto t1 -> 2x
  const snap1 = snapTilesIntoGroup(tiles, [t2.id], t1.id, 500, 340);
  assert.equal(snap1.count, 2);
  assert.equal(snap1.label, '2x');
  tiles = snap1.tiles;

  // Snap t3 onto t1 -> 3x
  const snap2 = snapTilesIntoGroup(tiles, [t3.id], t1.id, 500, 340);
  assert.equal(snap2.count, 3);
  assert.equal(snap2.label, '3x');
  tiles = snap2.tiles;

  // Verify individual tiles remain preserved in state
  assert.equal(tiles.length, 3);
  assert.equal(formatExpression(tiles, true), '3x');
  const groupsBeforeMove = computeTileGroups(tiles);
  assert.equal(groupsBeforeMove.length, 1);
  assert.equal(groupsBeforeMove[0].count, 3);
  assert.equal(groupsBeforeMove[0].label, '3x');

  // Move whole group preserving relative positions
  const relOffsetsBefore = tiles.map((t) => ({
    dx: t.position.x - tiles[0].position.x,
    dy: t.position.y - tiles[0].position.y,
  }));
  tiles = moveGroupByDelta(tiles, snap2.groupId, 24, 36, 500, 340);
  const relOffsetsAfter = tiles.map((t) => ({
    dx: t.position.x - tiles[0].position.x,
    dy: t.position.y - tiles[0].position.y,
  }));
  assert.deepEqual(relOffsetsAfter, relOffsetsBefore);

  // Add like tile to group -> 4x
  const added = addLikeTileToGroup(tiles, snap2.groupId, 500, 340);
  assert.equal(added.count, 4);
  assert.equal(added.label, '4x');
  assert.equal(formatExpression(added.tiles, true), '4x');

  // Ungroup back into individual movable tiles
  const ungrouped = ungroupTiles(tiles, snap2.groupId, 500, 340);
  assert.equal(ungrouped.count, 3);
  assert.equal(computeTileGroups(ungrouped.tiles).length, 0);
  assert.ok(ungrouped.tiles.every((t) => t.groupId === null));
  assert.equal(formatExpression(ungrouped.tiles, true), '3x');
});

test('SNAP & STACK: Menggabungkan dua kelompok sejenis (2x + 2x -> 4x) dan menolak suku berbeda (3x vs 2)', () => {
  const a1 = createTile('x', 1, { x: 20, y: 40 }, 'g1');
  const a2 = createTile('x', 1, { x: 102, y: 40 }, 'g1');
  const b1 = createTile('x', 1, { x: 20, y: 120 }, 'g2');
  const b2 = createTile('x', 1, { x: 102, y: 120 }, 'g2');
  const one1 = createTile('1', 1, { x: 300, y: 40 }, 'g-one');
  const one2 = createTile('1', 1, { x: 352, y: 40 }, 'g-one');
  const tiles = [a1, a2, b1, b2, one1, one2];

  // Merging two +x groups
  const merged = snapTilesIntoGroup(tiles, [a1.id], b1.id, 600, 360);
  assert.equal(merged.count, 4);
  assert.equal(merged.label, '4x');

  // Trying to snap +x onto +1 is blocked by detectDropTarget as 'mismatch'
  const hit = detectDropTarget(
    tiles,
    [a1.id, a2.id],
    'x',
    1,
    { x: 290, y: 36, width: 160, height: 44 },
    false
  );
  assert.equal(hit?.kind, 'mismatch');
});

test('SNAP & STACK: Stacking zero pair (+x dan -x), memisahkan kembali, dan meniadakan (= 0)', () => {
  const px = createTile('x', 1, { x: 60, y: 60 });
  const nx = createTile('x', -1, { x: 70, y: 65 });
  const stacked = stackZeroPair([px, nx], px.id, nx.id, 500, 340);
  assert.equal(stacked.valid, true);
  assert.equal(stacked.tiles.length, 2);
  assert.equal(formatExpression(stacked.tiles, true), '0');

  const stacks = computeZeroPairStacks(stacked.tiles);
  assert.equal(stacks.length, 1);
  assert.ok(stacks[0].negativeTile.position.x > stacks[0].positiveTile.position.x);
  assert.ok(stacks[0].negativeTile.position.y > stacks[0].positiveTile.position.y);

  // Separate back into 2 independent tiles
  const separated = separateZeroPair(stacked.tiles, stacks[0].zeroPairId, 500, 340);
  assert.equal(computeZeroPairStacks(separated.tiles).length, 0);
  assert.equal(separated.tiles.length, 2);
  assert.ok(separated.tiles.every((t) => !t.zeroPairId));

  // Eliminate stacked zero pair -> removes both tiles
  const eliminated = eliminateZeroPairStack(stacked.tiles, stacks[0].zeroPairId);
  assert.equal(eliminated.removedCount, 1);
  assert.equal(eliminated.tiles.length, 0);
  assert.equal(formatExpression(eliminated.tiles, true), '0');
});
