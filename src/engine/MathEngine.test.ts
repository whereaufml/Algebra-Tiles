import test from 'node:test';
import assert from 'node:assert/strict';
import {
  areExpressionsEquivalent,
  canCombineLikeTerms,
  canFormZeroPair,
  clearCancelledZeroPairs,
  computeTileClusters,
  countTileStatuses,
  createTile,
  createTilesFromSpec,
  eliminateSpecificZeroPair,
  eliminateZeroPairs,
  findNextAvailableTilePosition,
  findZeroPairs,
  formatExpression,
  formatRawExpression,
  getTileDimsForLayout,
  groupTilesByTerm,
  isTileActive,
  summarizeTiles,
} from './MathEngine';
import {
  applyTileToEquationSide,
  checkEquationSolved,
  clearEquationCancelledTiles,
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
  resolveZeroPairInspection,
  separateZeroPair,
  snapTilesIntoGroup,
  stackZeroPair,
  ungroupTiles,
} from './SnapStackEngine';
import { calculateLevelFromXp, calculateMissionStars, evaluateUnlockedBadges } from './GameSystem';
import { createDefaultProgress } from '../storage/ProgressStorage';
import {
  MAX_WORKSPACE_HISTORY_STEPS,
  WORKSPACE_STORAGE_KEY,
  WORKSPACE_STORAGE_VERSION,
  clearWorkspaceSession,
  loadWorkspaceSession,
  pushBoundedHistory,
  saveWorkspaceSession,
  StorageLike,
} from '../storage/WorkspaceStorage';
import {
  areSymbolicInputsEquivalent,
  buildDistributiveMultiplication,
  buildDivisionSteps,
  divideExpressionByScalar,
  evaluateSubstitution,
  parseAlgebraExpression,
} from './OperationEngine';

// (existing tests remain unchanged above)


test('T-01: Adding +x and -x zero pair marks tiles as cancelled (faded) and updates active expression', () => {
  const tiles = [
    createTile('x', 1),
    createTile('x', -1),
    createTile('1', 1),
  ];
  assert.equal(formatExpression(tiles, true), '1');

  const result = eliminateZeroPairs(tiles);
  assert.equal(result.removedCount, 1);
  assert.equal(result.activeTiles.length, 1);
  assert.equal(result.remainingTiles.length, 3);
  assert.deepEqual(countTileStatuses(result.remainingTiles), { activeCount: 1, cancelledCount: 2 });
  assert.equal(formatExpression(result.remainingTiles, true), '1');

  const onlyZeroPair = [createTile('x', 1), createTile('x', -1)];
  const cancelled = eliminateZeroPairs(onlyZeroPair);
  assert.equal(cancelled.removedCount, 1);
  assert.equal(cancelled.activeTiles.length, 0);
  assert.equal(cancelled.remainingTiles.length, 2);
  assert.deepEqual(countTileStatuses(cancelled.remainingTiles), { activeCount: 0, cancelledCount: 2 });
  assert.equal(formatExpression(cancelled.remainingTiles, true), '0');

  const cleaned = clearCancelledZeroPairs(cancelled.remainingTiles);
  assert.equal(cleaned.clearedCount, 2);
  assert.equal(cleaned.remainingTiles.length, 0);
  assert.equal(formatExpression(cleaned.remainingTiles, true), '0');
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

test('T-04: Trying to combine 2x and 3 as like terms is rejected with a clear explanation', () => {
  const tiles = createTilesFromSpec([
    { type: 'x', sign: 1, count: 2 },
    { type: '1', sign: 1, count: 3 },
  ]);
  const combined = canCombineLikeTerms(tiles);
  assert.equal(combined.valid, false);
  assert.match(combined.reason, /unlike terms|Cannot combine/i);
  assert.equal(formatExpression(tiles, true), '2x + 3');
});

test('T-05: Solving x + 3 = 5 by adding -3 to both sides yields x = 2 evenly', () => {
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
  assert.match(step1Single.message, /added −1 to both sides/);

  const step1 = applyTileToEquationSide(initial, 'both', '1', -1, 3);
  assert.equal(step1.isBalanced, true);
  assert.match(step1.message, /added −3 to both sides/);

  const step2 = eliminateEquationZeroPairs(step1.nextState);
  assert.equal(step2.isBalanced, true);
  assert.equal(formatEquation(step2.nextState.leftTiles, step2.nextState.rightTiles, true), 'x = 2');

  const solved = checkEquationSolved(step2.nextState, 2);
  assert.equal(solved.solved, true);
});

test('T-06: Operating on only one side of an equation triggers a balance warning', () => {
  const initial = createInitialEquationState(
    [
      { type: 'x', sign: 1, count: 1 },
      { type: '1', sign: 1, count: 3 },
    ],
    [{ type: '1', sign: 1, count: 5 }]
  );

  const unbalanced = applyTileToEquationSide(initial, 'left', '1', -1, 3);
  assert.equal(unbalanced.isBalanced, false);
  assert.match(unbalanced.message, /Balance Warning|without the same operation/i);

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
  assert.equal(validPair.activeTiles.length, 0);
  assert.equal(validPair.remainingTiles.length, 2);
  assert.ok(validPair.remainingTiles.every((t) => t.status === 'cancelled'));
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

  // Eliminate stacked zero pair -> transitions both tiles to cancelled (samar) without dropping active result
  const eliminated = eliminateZeroPairStack(stacked.tiles, stacks[0].zeroPairId);
  assert.equal(eliminated.removedCount, 1);
  assert.equal(eliminated.activeTiles.length, 0);
  assert.equal(eliminated.tiles.length, 2);
  assert.ok(eliminated.tiles.every((t) => t.status === 'cancelled'));
  assert.equal(computeZeroPairStacks(eliminated.tiles).length, 0);
  assert.equal(formatExpression(eliminated.tiles, true), '0');
});

test('OperationEngine: parseAlgebraExpression & areSymbolicInputsEquivalent mendukung CTL & Exit Tickets', () => {
  assert.deepEqual(parseAlgebraExpression('x + 2'), { x2: 0, x: 1, constant: 2 });
  assert.deepEqual(parseAlgebraExpression('x + 2 + 1'), { x2: 0, x: 1, constant: 3 });
  assert.deepEqual(parseAlgebraExpression('2(x + 3)'), { x2: 0, x: 2, constant: 6 });
  assert.deepEqual(parseAlgebraExpression('3(x + 2)'), { x2: 0, x: 3, constant: 6 });
  assert.deepEqual(parseAlgebraExpression('2(x + 4)'), { x2: 0, x: 2, constant: 8 });
  assert.deepEqual(parseAlgebraExpression('4 + x'), { x2: 0, x: 1, constant: 4 });
  assert.deepEqual(parseAlgebraExpression('x² − 2x + 1'), { x2: 1, x: -2, constant: 1 });

  // Exit Ticket 1: x + 2
  assert.equal(areSymbolicInputsEquivalent('x + 2', { x2: 0, x: 1, constant: 2 }).valid, true);
  // Exit Ticket 2: x + 4 equivalent to 4 + x
  assert.equal(areSymbolicInputsEquivalent('x + 4', { x2: 0, x: 1, constant: 4 }).valid, true);
  // Exit Ticket 3: 2(x + 4) -> 2x + 8
  assert.equal(areSymbolicInputsEquivalent('2x + 8', { x2: 0, x: 2, constant: 8 }).valid, true);
  assert.equal(areSymbolicInputsEquivalent('2x + 4', { x2: 0, x: 2, constant: 8 }).valid, false);
});

test('OperationEngine: Uji substitusi x = 4 pada 2(x + 3) = 2x + 6 dan pembagian bukan nol', () => {
  const factored = parseAlgebraExpression('2(x + 3)');
  const expanded = parseAlgebraExpression('2x + 6');
  assert.ok(factored && expanded);
  assert.equal(evaluateSubstitution(factored, 4), 14);
  assert.equal(evaluateSubstitution(expanded, 4), 14);

  const divValid = divideExpressionByScalar({ x2: 0, x: 6, constant: 9 }, 3);
  assert.equal(divValid.valid, true);
  assert.equal(divValid.canUseTiles, true);
  assert.deepEqual(divValid.quotient, { x2: 0, x: 2, constant: 3 });

  const divSingle = divideExpressionByScalar({ x2: 0, x: 6, constant: 0 }, 3);
  assert.equal(divSingle.valid, true);
  assert.equal(divSingle.canUseTiles, true);
  assert.deepEqual(divSingle.quotient, { x2: 0, x: 2, constant: 0 });

  const divZero = divideExpressionByScalar({ x2: 0, x: 6, constant: 9 }, 0);
  assert.equal(divZero.valid, false);
  assert.equal(divZero.canUseTiles, false);
  assert.match(divZero.reason, /zero|undefined/i);
});

test('PDF 2 Suku Sejenis & Berbeda: 3x + 2x = 5x, 2 + 4 = 6, 2x + 3, dan 2x + 3x²', () => {
  const linearAdd = createTilesFromSpec([{ type: 'x', sign: 1, count: 5 }]);
  assert.equal(canCombineLikeTerms(linearAdd).valid, true);
  assert.equal(formatExpression(linearAdd, true), '5x');

  const constAdd = createTilesFromSpec([{ type: '1', sign: 1, count: 6 }]);
  assert.equal(canCombineLikeTerms(constAdd).valid, true);
  assert.equal(formatExpression(constAdd, true), '6');

  const mixedLinearConst = createTilesFromSpec([
    { type: 'x', sign: 1, count: 2 },
    { type: '1', sign: 1, count: 3 },
  ]);
  assert.equal(canCombineLikeTerms(mixedLinearConst).valid, false);
  assert.equal(formatExpression(mixedLinearConst, true), '2x + 3');

  const mixedQuadLinear = createTilesFromSpec([
    { type: 'x2', sign: 1, count: 3 },
    { type: 'x', sign: 1, count: 2 },
  ]);
  assert.equal(canCombineLikeTerms(mixedQuadLinear).valid, false);
  assert.equal(formatExpression(mixedQuadLinear, true), '3x² + 2x');
});

test('PDF 2 Zero Pairs: 5x − 3x = 2x dan 3x − 3x = 0 menjaga ubin samar namun tidak dihitung simbolik', () => {
  const fiveMinusThree = createTilesFromSpec([
    { type: 'x', sign: 1, count: 5 },
    { type: 'x', sign: -1, count: 3 },
  ]);
  const res1 = eliminateZeroPairs(fiveMinusThree);
  assert.equal(res1.removedCount, 3);
  assert.equal(formatExpression(res1.remainingTiles, true), '2x');
  assert.deepEqual(countTileStatuses(res1.remainingTiles), { activeCount: 2, cancelledCount: 6 });

  const threeMinusThree = createTilesFromSpec([
    { type: 'x', sign: 1, count: 3 },
    { type: 'x', sign: -1, count: 3 },
  ]);
  const res2 = eliminateZeroPairs(threeMinusThree);
  assert.equal(res2.removedCount, 3);
  assert.equal(formatExpression(res2.remainingTiles, true), '0');
  assert.deepEqual(countTileStatuses(res2.remainingTiles), { activeCount: 0, cancelledCount: 6 });
  assert.deepEqual(summarizeTiles(res2.remainingTiles), {
    x2: 0,
    x: 0,
    constant: 0,
    y2: 0,
    xy: 0,
    y: 0,
    posX2: 0,
    negX2: 0,
    posX: 0,
    negX: 0,
    posOne: 0,
    negOne: 0,
    posY2: 0,
    negY2: 0,
    posXY: 0,
    negXY: 0,
    posY: 0,
    negY: 0,
  });

  // Cancelled tiles must be ignored by drop detection, grouping, and mission validation
  const activeNew = createTile('x', 1, { x: 28, y: 28 });
  assert.equal(
    detectDropTarget(
      [...res2.remainingTiles, activeNew],
      [activeNew.id],
      'x',
      1,
      { x: 28, y: 28, width: 76, height: 44 },
      true
    ),
    null
  );
  assert.equal(
    areExpressionsEquivalent(res2.remainingTiles, { x2: 0, x: 0, constant: 0 }, true).valid,
    true
  );

  // Bersihkan pasangan nol removes cancelled visual history without altering result
  const cleared = clearCancelledZeroPairs(res2.remainingTiles);
  assert.equal(cleared.clearedCount, 6);
  assert.equal(cleared.remainingTiles.length, 0);
  assert.equal(formatExpression(cleared.remainingTiles, true), '0');
});

test('PDF 2 Perkalian Distributif & Pembagian Pecahan Simbolik tanpa Ubin Palsu', () => {
  const m1 = buildDistributiveMultiplication(2, 1, 3);
  assert.equal(m1.intermediateNotation, '2 × x + 2 × 3');
  assert.equal(m1.finalExpression, '2x + 6');
  assert.deepEqual(m1.result, { x2: 0, x: 2, constant: 6 });

  const m2 = buildDistributiveMultiplication(3, 1, 2);
  assert.equal(m2.intermediateNotation, '3 × x + 3 × 2');
  assert.equal(m2.finalExpression, '3x + 6');
  assert.deepEqual(m2.result, { x2: 0, x: 3, constant: 6 });

  const mNeg = buildDistributiveMultiplication(-2, 1, 3);
  assert.equal(mNeg.isNegativeMultiplier, true);
  assert.equal(mNeg.finalExpression, '−2x − 6');
  assert.deepEqual(mNeg.result, { x2: 0, x: -2, constant: -6 });

  // Whole-tile division
  const dWhole1 = buildDivisionSteps(6, 0, 3);
  assert.equal(dWhole1.valid, true);
  assert.equal(dWhole1.canUseTiles, true);
  assert.equal(dWhole1.symbolicResult, '2x');
  assert.match(dWhole1.stepNotation || '', /\(6 ÷ 3\)x/);

  const dWhole2 = buildDivisionSteps(6, 9, 3);
  assert.equal(dWhole2.valid, true);
  assert.equal(dWhole2.canUseTiles, true);
  assert.equal(dWhole2.symbolicResult, '2x + 3');
  assert.match(dWhole2.stepNotation || '', /6x ÷ 3 \+ 9 ÷ 3 = 2x \+ 3/);

  // Non-whole division: exact symbolic fraction without fake tiles
  const dFrac1 = buildDivisionSteps(6, 9, 2);
  assert.equal(dFrac1.valid, true);
  assert.equal(dFrac1.canUseTiles, false);
  assert.equal(dFrac1.symbolicResult, '3x + 9/2');

  const dFrac2 = buildDivisionSteps(5, 0, 2);
  assert.equal(dFrac2.valid, true);
  assert.equal(dFrac2.canUseTiles, false);
  assert.equal(dFrac2.symbolicResult, '(5/2)x');

  // Equation zero-pair cancelled history + clear
  const eq = createInitialEquationState(
    [
      { type: 'x', sign: 1, count: 1 },
      { type: '1', sign: 1, count: 3 },
    ],
    [{ type: '1', sign: 1, count: 5 }]
  );
  const eqMinus3 = applyTileToEquationSide(eq, 'both', '1', -1, 3);
  const eqCancelled = eliminateEquationZeroPairs(eqMinus3.nextState);
  assert.equal(eqCancelled.isBalanced, true);
  assert.equal(
    formatEquation(eqCancelled.nextState.leftTiles, eqCancelled.nextState.rightTiles, true),
    'x = 2'
  );
  assert.equal(checkEquationSolved(eqCancelled.nextState, 2).solved, true);
  const eqCleared = clearEquationCancelledTiles(eqCancelled.nextState);
  assert.equal(
    formatEquation(eqCleared.nextState.leftTiles, eqCleared.nextState.rightTiles, true),
    'x = 2'
  );
});

function createMemoryStorage(): StorageLike & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };
}

test('WorkspaceStorage: Batas riwayat Undo/Redo 30 langkah & cabang baru memotong redo lama', () => {
  let stack: number[][] = [[]];
  let idx = 0;
  for (let step = 1; step <= 40; step += 1) {
    const res = pushBoundedHistory(stack, idx, [step], MAX_WORKSPACE_HISTORY_STEPS);
    stack = res.stack;
    idx = res.index;
  }
  assert.equal(stack.length, 30);
  assert.equal(idx, 29);
  assert.deepEqual(stack[0], [11]);
  assert.deepEqual(stack[29], [40]);

  // Undo 2 steps then push a new branch
  idx = 27; // value [38]
  const branched = pushBoundedHistory(stack, idx, [999], MAX_WORKSPACE_HISTORY_STEPS);
  assert.equal(branched.index, 28);
  assert.equal(branched.stack.length, 29);
  assert.deepEqual(branched.stack[28], [999]);
});

test('WorkspaceStorage: Simpan & pulihkan posisi ubin, grup, status samar, Papan Persamaan, serta Undo/Redo', () => {
  const mem = createMemoryStorage();
  const t1 = createTile('x', 1, { x: 48, y: 60 }, 'grp-x');
  const t2 = createTile('x', 1, { x: 132, y: 60 }, 'grp-x');
  const tNeg = createTile('x', -1, { x: 240, y: 60 });

  const step0: typeof t1[] = [];
  const step1 = [t1, t2, tNeg];
  const zeroRes = eliminateSpecificZeroPair(step1, t2.id, tNeg.id);
  const step2 = zeroRes.remainingTiles;

  const eq0 = createInitialEquationState(
    [
      { type: 'x', sign: 1, count: 1 },
      { type: '1', sign: 1, count: 3 },
    ],
    [{ type: '1', sign: 1, count: 5 }]
  );
  const eq1 = applyTileToEquationSide(eq0, 'both', '1', -1, 3).nextState;

  const saved = saveWorkspaceSession(
    {
      mode: 'explore',
      activeMissionId: null,
      presetIdx: 0,
      exploreHistory: [step0, step1, step2],
      exploreHistoryIdx: 2,
      equationHistory: [eq0, eq1],
      equationHistoryIdx: 1,
    },
    mem
  );
  assert.equal(saved.ok, true);
  assert.equal(saved.session.version, WORKSPACE_STORAGE_VERSION);
  assert.equal(saved.session.symbolicExpression, 'x');

  // Simulate reload into fresh memory via loadWorkspaceSession
  const loaded = loadWorkspaceSession(mem);
  assert.equal(loaded.status, 'ok');
  assert.equal(loaded.hasRecoverableWork, true);
  assert.ok(loaded.session);
  assert.equal(loaded.session.exploreHistory.length, 3);
  assert.equal(loaded.session.exploreHistoryIdx, 2);

  // Active vs cancelled (samar) preserved + group preserved + positions preserved
  const currentTiles = loaded.session.exploreHistory[loaded.session.exploreHistoryIdx];
  assert.deepEqual(countTileStatuses(currentTiles), { activeCount: 1, cancelledCount: 2 });
  assert.equal(formatExpression(currentTiles, true), 'x');
  assert.equal(currentTiles[0].groupId, 'grp-x');
  assert.deepEqual(currentTiles[0].position, { x: 48, y: 60 });

  // Simulate Undo after reload (step2 -> step1) restores cancelled tiles back to active
  const afterUndoTiles = loaded.session.exploreHistory[loaded.session.exploreHistoryIdx - 1];
  assert.deepEqual(countTileStatuses(afterUndoTiles), { activeCount: 3, cancelledCount: 0 });
  assert.equal(formatExpression(afterUndoTiles, true), 'x');

  // Equation board history also preserved
  assert.equal(loaded.session.equationHistory.length, 2);
  assert.equal(loaded.session.equationHistoryIdx, 1);

  // Resetting workspace does NOT erase separate progress storage key
  mem.setItem('algebra_quest_progress_v1', JSON.stringify({ xp: 250, nickname: 'Bima' }));
  clearWorkspaceSession(mem);
  assert.equal(loadWorkspaceSession(mem).status, 'empty');
  assert.equal(JSON.parse(mem.getItem('algebra_quest_progress_v1')!).xp, 250);
});

test('WorkspaceStorage: Menangani data rusak atau versi tidak valid secara aman', () => {
  const mem = createMemoryStorage();
  mem.setItem(WORKSPACE_STORAGE_KEY, '{broken-json');
  const badJson = loadWorkspaceSession(mem);
  assert.equal(badJson.status, 'corrupted');
  assert.equal(badJson.session, null);

  mem.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify({ version: 999, mode: 'explore' }));
  const badVersion = loadWorkspaceSession(mem);
  assert.equal(badVersion.status, 'corrupted');
  assert.equal(badVersion.session, null);
});

test('Distributive misconception feedback 2(x + 3) -> 2x + 3 and Operation Lab badges', () => {
  const wrongDist = areSymbolicInputsEquivalent('2x + 3', { x2: 0, x: 2, constant: 6 });
  assert.equal(wrongDist.valid, false);
  assert.match(wrongDist.feedback, /distributive|every term/i);

  const prog = createDefaultProgress();
  prog.completedOpLabIds = ['oplab-mul-1', 'oplab-div-1'];
  const badges = evaluateUnlockedBadges(prog);
  assert.ok(badges.includes('badge-distributive-builder'));
  assert.ok(badges.includes('badge-division-detective'));
});

test('Prompt 1 Simulation 3: 2x² + 2x + 5 + (−x²) keeps −x² active, non-overlapping, ungrouped after split, and cancels to x² + 2x + 5', () => {
  // Start with 9 active tiles: 2x² + 2x + 5
  const initial = createTilesFromSpec([
    { type: 'x2', sign: 1, count: 2 },
    { type: 'x', sign: 1, count: 2 },
    { type: '1', sign: 1, count: 5 },
  ], 16, 34, 3);
  assert.equal(initial.length, 9);
  assert.equal(formatExpression(initial, true), '2x² + 2x + 5');

  // Add 10th tile (-x²) on both narrow mobile board (340px) and desktop board (600px)
  const mobilePos = findNextAvailableTilePosition(initial, 'x2', 340);
  assert.ok(mobilePos.x >= 12 && mobilePos.x + 78 <= 340 - 12);
  assert.ok(mobilePos.y >= 34);

  const desktopPos = findNextAvailableTilePosition(initial, 'x2', 600);
  const negX2 = createTile('x2', -1, desktopPos);
  const withNegX2 = [...initial, negX2];

  // Not auto-cancelled: 10 active, 0 cancelled, raw expression reflects 2x² - x² + 2x + 5
  assert.deepEqual(countTileStatuses(withNegX2), { activeCount: 10, cancelledCount: 0 });
  assert.equal(formatRawExpression(withNegX2), '2x² − x² + 2x + 5');
  assert.equal(findZeroPairs(withNegX2).length, 1);

  // Grouping like terms keeps single -x² independent (groupId === null) and never flips its sign
  const grouped = groupTilesByTerm(withNegX2, 600);
  const negAfterGroup = grouped.find((t) => t.id === negX2.id)!;
  assert.equal(negAfterGroup.sign, -1);
  assert.equal(negAfterGroup.type, 'x2');
  assert.equal(negAfterGroup.status, 'active');
  assert.equal(negAfterGroup.groupId, null);

  // Splitting +x² group keeps -x² intact
  const x2PosGroupId = grouped.find((t) => t.type === 'x2' && t.sign === 1)?.groupId;
  assert.ok(x2PosGroupId);
  const split = ungroupTiles(grouped, x2PosGroupId, 600, 500);
  const negAfterSplit = split.tiles.find((t) => t.id === negX2.id)!;
  assert.equal(negAfterSplit.sign, -1);
  assert.equal(negAfterSplit.type, 'x2');
  assert.equal(negAfterSplit.status, 'active');

  // Match Zero Pairs cancels 1 +x² and 1 -x² -> 8 active, 2 cancelled -> x² + 2x + 5
  const matched = eliminateZeroPairs(split.tiles);
  assert.equal(matched.removedCount, 1);
  assert.deepEqual(countTileStatuses(matched.remainingTiles), { activeCount: 8, cancelledCount: 2 });
  assert.equal(formatExpression(matched.remainingTiles, true), 'x² + 2x + 5');
});

test('Prompt 1 Guard & Persistence: +x never cancels −x², and negative x² tiles round-trip in WorkspaceStorage', () => {
  const posX = createTile('x', 1, { x: 20, y: 40 });
  const negX2 = createTile('x2', -1, { x: 120, y: 40 });
  assert.equal(canFormZeroPair(posX, negX2), false);
  assert.equal(findZeroPairs([posX, negX2]).length, 0);
  assert.equal(eliminateZeroPairs([posX, negX2]).removedCount, 0);

  const mem = createMemoryStorage();
  const posX2 = createTile('x2', 1, { x: 20, y: 40 });
  const step0 = [posX2, negX2];
  const step1 = eliminateZeroPairs(step0).remainingTiles;

  saveWorkspaceSession(
    {
      mode: 'explore',
      activeMissionId: null,
      presetIdx: 0,
      exploreHistory: [step0, step1],
      exploreHistoryIdx: 1,
      equationHistory: [createInitialEquationState([{ type: 'x', sign: 1, count: 1 }], [{ type: '1', sign: 1, count: 2 }])],
      equationHistoryIdx: 0,
    },
    mem
  );

  const restored = loadWorkspaceSession(mem);
  assert.equal(restored.status, 'ok');
  assert.ok(restored.session);
  const cancelled = restored.session.exploreHistory[1];
  const restoredNeg = cancelled.find((t) => t.id === negX2.id)!;
  assert.equal(restoredNeg.type, 'x2');
  assert.equal(restoredNeg.sign, -1);
  assert.equal(restoredNeg.status, 'cancelled');
  assert.deepEqual(restoredNeg.position, { x: 120, y: 40 });

  // Undo step 1 -> 0 restores active negative -x²
  const activeStep = restored.session.exploreHistory[0];
  const restoredActiveNeg = activeStep.find((t) => t.id === negX2.id)!;
  assert.equal(restoredActiveNeg.status, 'active');
  assert.equal(restoredActiveNeg.sign, -1);
});

test('Prompt 2 Y-Family Math: 2x + 3y − x + 2y = x + 5y, 3xy − xy = 2xy, y − y = 0', () => {
  // 2x + 3y - x + 2y -> x + 5y
  const expr1 = createTilesFromSpec([
    { type: 'x', sign: 1, count: 2 },
    { type: 'y', sign: 1, count: 3 },
    { type: 'x', sign: -1, count: 1 },
    { type: 'y', sign: 1, count: 2 },
  ]);
  assert.equal(formatRawExpression(expr1), '2x − x + 5y');
  assert.equal(formatExpression(expr1, true), 'x + 5y');
  const zp1 = eliminateZeroPairs(expr1);
  assert.equal(zp1.removedCount, 1);
  assert.equal(formatExpression(zp1.remainingTiles, true), 'x + 5y');
  assert.deepEqual(countTileStatuses(zp1.remainingTiles), { activeCount: 6, cancelledCount: 2 });

  // 3xy - xy -> 2xy
  const expr2 = createTilesFromSpec([
    { type: 'xy', sign: 1, count: 3 },
    { type: 'xy', sign: -1, count: 1 },
  ]);
  assert.equal(formatExpression(expr2, true), '2xy');
  const zp2 = eliminateZeroPairs(expr2);
  assert.equal(zp2.removedCount, 1);
  assert.equal(formatExpression(zp2.remainingTiles, true), '2xy');

  // y - y -> 0
  const expr3 = createTilesFromSpec([
    { type: 'y', sign: 1, count: 1 },
    { type: 'y', sign: -1, count: 1 },
  ]);
  const zp3 = eliminateZeroPairs(expr3);
  assert.equal(zp3.removedCount, 1);
  assert.equal(formatExpression(zp3.remainingTiles, true), '0');
  assert.deepEqual(countTileStatuses(zp3.remainingTiles), { activeCount: 0, cancelledCount: 2 });
});

test('Prompt 2 Guardrails: Unlike terms (x + y, x + xy, x² + y²) cannot combine and cross-family signs never cancel', () => {
  const posX = createTile('x', 1, { x: 20, y: 30 });
  const posY = createTile('y', 1, { x: 140, y: 30 });
  const negY = createTile('y', -1, { x: 20, y: 120 });
  const posXY = createTile('xy', 1, { x: 140, y: 120 });
  const negX = createTile('x', -1, { x: 260, y: 120 });
  const posX2 = createTile('x2', 1, { x: 20, y: 260 });
  const posY2 = createTile('y2', 1, { x: 140, y: 260 });

  assert.equal(canCombineLikeTerms([posX, posY]).valid, false);
  assert.equal(canCombineLikeTerms([posX, posXY]).valid, false);
  assert.equal(canCombineLikeTerms([posX2, posY2]).valid, false);

  assert.equal(canFormZeroPair(posX, negY), false);
  assert.equal(canFormZeroPair(posXY, negX), false);
  assert.equal(findZeroPairs([posX, negY, posXY]).length, 0);

  // Drop target mismatch for +x dropped onto +y
  const hit = detectDropTarget(
    [posY],
    [posX.id],
    'x',
    1,
    { x: 138, y: 28, width: 90, height: 36 },
    true
  );
  assert.equal(hit?.kind, 'mismatch');
});

test('Prompt 2 Snap & Stack + Persistence: Y-family grouping/stacking and legacy v1 session compatibility', () => {
  const y1 = createTile('y', 1, { x: 24, y: 36 });
  const y2 = createTile('y', 1, { x: 160, y: 36 });
  const snapped = snapTilesIntoGroup([y1, y2], [y2.id], y1.id, 600, 400);
  assert.equal(snapped.count, 2);
  assert.equal(snapped.label, '2y');

  const y2Pos = createTile('y2', 1, { x: 40, y: 120 });
  const y2Neg = createTile('y2', -1, { x: 52, y: 128 });
  const stacked = stackZeroPair([y2Pos, y2Neg], y2Pos.id, y2Neg.id, 600, 400);
  assert.equal(stacked.valid, true);
  assert.equal(formatExpression(stacked.tiles, true), '0');

  const mem = createMemoryStorage();
  const xyPos = createTile('xy', 1, { x: 48, y: 48 }, 'grp-xy');
  const yNeg = createTile('y', -1, { x: 168, y: 48 });
  saveWorkspaceSession(
    {
      mode: 'explore',
      activeMissionId: null,
      presetIdx: 0,
      exploreHistory: [[xyPos, yNeg]],
      exploreHistoryIdx: 0,
      equationHistory: [createInitialEquationState([{ type: 'x', sign: 1, count: 1 }], [{ type: '1', sign: 1, count: 2 }])],
      equationHistoryIdx: 0,
    },
    mem
  );

  const reloaded = loadWorkspaceSession(mem);
  assert.equal(reloaded.status, 'ok');
  assert.equal(reloaded.session?.symbolicExpression, 'xy − y');
  assert.equal(reloaded.session?.exploreHistory[0][0].type, 'xy');
  assert.equal(reloaded.session?.exploreHistory[0][1].type, 'y');

  // Backward compatibility: legacy v1 payload with only x-family summary & tiles
  mem.setItem(
    WORKSPACE_STORAGE_KEY,
    JSON.stringify({
      version: WORKSPACE_STORAGE_VERSION,
      savedAt: '2026-11-20T00:00:00.000Z',
      mode: 'explore',
      activeMissionId: null,
      presetIdx: 0,
      symbolicExpression: '2x + 1',
      equationExpression: 'x + 3 = 5',
      exploreHistory: [
        [
          { id: 'legacy-1', type: 'x', sign: 1, status: 'active', position: { x: 24, y: 36 }, groupId: null },
        ],
      ],
      exploreHistoryIdx: 0,
      equationHistory: [
        {
          leftTiles: [{ id: 'eq-l1', type: 'x', sign: 1, status: 'active', position: { x: 0, y: 0 }, groupId: null }],
          rightTiles: [{ id: 'eq-r1', type: '1', sign: 1, status: 'active', position: { x: 0, y: 0 }, groupId: null }],
          initialLeft: { x2: 0, x: 1, constant: 0, posX2: 0, negX2: 0, posX: 1, negX: 0, posOne: 0, negOne: 0 },
          initialRight: { x2: 0, x: 0, constant: 1, posX2: 0, negX2: 0, posX: 0, negX: 0, posOne: 1, negOne: 0 },
          isBalanced: true,
          lastActionNote: 'Legacy state',
        },
      ],
      equationHistoryIdx: 0,
    })
  );
  const legacyLoaded = loadWorkspaceSession(mem);
  assert.equal(legacyLoaded.status, 'ok');
  assert.equal(legacyLoaded.session?.equationHistory[0].initialLeft.y2, 0);
  assert.equal(legacyLoaded.session?.equationHistory[0].initialLeft.xy, 0);
  assert.equal(legacyLoaded.session?.equationHistory[0].initialLeft.y, 0);
});

test('Revision 1 Contextual Zero Pair Inspection: idle, hover, selection, non-pair, and cancelled rules', () => {
  const xPos1 = createTile('x', 1, { x: 40, y: 60 });
  const xNeg1 = createTile('x', -1, { x: 50, y: 70 });
  const x2Pos = createTile('x2', 1, { x: 220, y: 60 });
  const x2Neg = createTile('x2', -1, { x: 230, y: 70 });
  const unitPos = createTile('1', 1, { x: 400, y: 60 });

  const s1 = stackZeroPair([xPos1, xNeg1, x2Pos, x2Neg, unitPos], xPos1.id, xNeg1.id, 600, 400);
  assert.equal(s1.valid, true);
  const s2 = stackZeroPair(s1.tiles, x2Pos.id, x2Neg.id, 600, 400);
  assert.equal(s2.valid, true);
  const tiles = s2.tiles;

  // 1. Canvas idle -> no label, no contextual action
  assert.equal(resolveZeroPairInspection(tiles, [], null), null);

  // 2. Hover valid stack -> single Zero Pair (= 0) hover inspection
  const hovered1 = resolveZeroPairInspection(tiles, [], xPos1.id);
  assert.ok(hovered1);
  assert.equal(hovered1.mode, 'hover');
  assert.equal(hovered1.kind, 'zero-pair');
  assert.equal(hovered1.label, 'Zero Pair (= 0)');
  assert.equal(hovered1.zeroPairId, s1.zeroPairId);
  assert.deepEqual(new Set(hovered1.tileIds), new Set([xPos1.id, xNeg1.id]));

  // 3. Pointer leaves -> returns to null
  assert.equal(resolveZeroPairInspection(tiles, [], null), null);

  // 4. Hovering/selecting non-pair single tile -> null (no Zero Pair label)
  assert.equal(resolveZeroPairInspection(tiles, [], unitPos.id), null);
  assert.equal(resolveZeroPairInspection(tiles, [unitPos.id], null), null);

  // 5. Selecting stack 1 while hovering stack 2 -> only stack 1 stays active (never two labels)
  const selected1Hover2 = resolveZeroPairInspection(tiles, [xNeg1.id], x2Pos.id);
  assert.ok(selected1Hover2);
  assert.equal(selected1Hover2.mode, 'selected');
  assert.equal(selected1Hover2.zeroPairId, s1.zeroPairId);
  assert.equal(selected1Hover2.canMatch, true);
  assert.equal(selected1Hover2.canSeparate, true);

  // 6. Switching selection to stack 2 moves inspection cleanly
  const selected2 = resolveZeroPairInspection(tiles, [x2Pos.id], null);
  assert.ok(selected2);
  assert.equal(selected2.zeroPairId, s2.zeroPairId);

  // 7. Selecting two unstacked opposite-sign like-term tiles forms candidate zero pair
  const rawPosY = createTile('y', 1, { x: 40, y: 200 });
  const rawNegY = createTile('y', -1, { x: 180, y: 200 });
  const candidate = resolveZeroPairInspection(
    [...tiles, rawPosY, rawNegY],
    [rawPosY.id, rawNegY.id],
    null
  );
  assert.ok(candidate);
  assert.equal(candidate.kind, 'zero-pair');
  assert.equal(candidate.canMatch, true);
  assert.equal(candidate.canSeparate, false);

  // 8. Cancelled stack inspection -> 'Cancelled (= 0)' only when hovered or selected
  const cancelledRes = eliminateZeroPairStack(tiles, s1.zeroPairId!);
  assert.equal(resolveZeroPairInspection(cancelledRes.tiles, [], null), null);
  const cancelledSelected = resolveZeroPairInspection(cancelledRes.tiles, [xPos1.id], null);
  assert.ok(cancelledSelected);
  assert.equal(cancelledSelected.kind, 'cancelled');
  assert.equal(cancelledSelected.label, 'Cancelled (= 0)');
  assert.equal(cancelledSelected.canMatch, false);
  assert.equal(cancelledSelected.canSeparate, false);
});

function assertNoActiveOverlapsAndWithinBounds(
  tiles: ReturnType<typeof createTilesFromSpec>,
  boardWidth: number
) {
  const active = tiles.filter(isTileActive);
  for (let i = 0; i < active.length; i += 1) {
    const a = active[i];
    const da = getTileDimsForLayout(a.type);
    assert.ok(a.position.x >= 0, `Tile ${a.id} x=${a.position.x} must be >= 0`);
    assert.ok(
      a.position.x + da.width <= boardWidth,
      `Tile ${a.id} right=${a.position.x + da.width} exceeds boardWidth=${boardWidth}`
    );
    for (let j = i + 1; j < active.length; j += 1) {
      const b = active[j];
      const db = getTileDimsForLayout(b.type);
      const overlap =
        a.position.x < b.position.x + db.width &&
        a.position.x + da.width > b.position.x &&
        a.position.y < b.position.y + db.height &&
        a.position.y + da.height > b.position.y;
      assert.equal(overlap, false, `Active tiles ${a.id} and ${b.id} overlap unexpectedly`);
    }
  }
}

test('Revision 2 Examples A-D: Stack-Aware Zero-Pair Cancellation, detachment, new remainder groupId, and non-overlap', () => {
  // Example A: +2x² + (−2x²) = 0 (across two groups, all 4 units cancelled)
  const exAPos = [
    createTile('x2', 1, { x: 24, y: 48 }, 'grp-a-pos'),
    createTile('x2', 1, { x: 120, y: 48 }, 'grp-a-pos'),
  ];
  const exANeg = [
    createTile('x2', -1, { x: 24, y: 170 }, 'grp-a-neg'),
    createTile('x2', -1, { x: 120, y: 170 }, 'grp-a-neg'),
  ];
  const resA = eliminateZeroPairs([...exAPos, ...exANeg], { boardWidth: 540, boardHeight: 360 });
  assert.equal(resA.removedCount, 2);
  assert.deepEqual(countTileStatuses(resA.remainingTiles), { activeCount: 0, cancelledCount: 4 });
  assert.equal(formatExpression(resA.remainingTiles, true), '0');
  assert.ok(resA.remainingTiles.every((t) => t.status === 'cancelled' && t.groupId === null));

  // Example B: +3x + (−2x) = +x (2 pairs cancelled, 1 +x active & detached standalone)
  const exBPos = [
    createTile('x', 1, { x: 24, y: 48 }, 'grp-b-pos'),
    createTile('x', 1, { x: 120, y: 48 }, 'grp-b-pos'),
    createTile('x', 1, { x: 216, y: 48 }, 'grp-b-pos'),
  ];
  const exBNeg = [
    createTile('x', -1, { x: 24, y: 120 }, 'grp-b-neg'),
    createTile('x', -1, { x: 120, y: 120 }, 'grp-b-neg'),
  ];
  const resB = eliminateZeroPairs([...exBPos, ...exBNeg], { boardWidth: 540, boardHeight: 360 });
  assert.equal(resB.removedCount, 2);
  assert.deepEqual(countTileStatuses(resB.remainingTiles), { activeCount: 1, cancelledCount: 4 });
  assert.equal(formatExpression(resB.remainingTiles, true), 'x');
  const remB = resB.remainingTiles.filter(isTileActive);
  assert.equal(remB.length, 1);
  assert.equal(remB[0].groupId, null);
  assert.equal(remB[0].zeroPairId, null);
  assert.equal(remB[0].sign, 1);
  assertNoActiveOverlapsAndWithinBounds(resB.remainingTiles, 540);

  // Example C: +2 + (−3) = −1 (2 pairs cancelled, 1 −1 active & detached standalone)
  const exCPos = [
    createTile('1', 1, { x: 24, y: 48 }, 'grp-c-pos'),
    createTile('1', 1, { x: 70, y: 48 }, 'grp-c-pos'),
  ];
  const exCNeg = [
    createTile('1', -1, { x: 24, y: 110 }, 'grp-c-neg'),
    createTile('1', -1, { x: 70, y: 110 }, 'grp-c-neg'),
    createTile('1', -1, { x: 116, y: 110 }, 'grp-c-neg'),
  ];
  const resC = eliminateZeroPairs([...exCPos, ...exCNeg], { boardWidth: 540, boardHeight: 360 });
  assert.equal(resC.removedCount, 2);
  assert.deepEqual(countTileStatuses(resC.remainingTiles), { activeCount: 1, cancelledCount: 4 });
  assert.equal(formatExpression(resC.remainingTiles, true), '−1');
  const remC = resC.remainingTiles.filter(isTileActive);
  assert.equal(remC.length, 1);
  assert.equal(remC[0].sign, -1);
  assert.equal(remC[0].groupId, null);
  assertNoActiveOverlapsAndWithinBounds(resC.remainingTiles, 540);

  // Example D: +5x + (−2x) = +3x (2 pairs cancelled, 3 +x form a NEW active stack with new groupId)
  const exDPos = [0, 1, 2, 3, 4].map((idx) =>
    createTile('x', 1, { x: 24 + (idx % 3) * 96, y: 48 + Math.floor(idx / 3) * 44 }, 'grp-d-pos')
  );
  const exDNeg = [
    createTile('x', -1, { x: 24, y: 160 }, 'grp-d-neg'),
    createTile('x', -1, { x: 120, y: 160 }, 'grp-d-neg'),
  ];
  // Also test on narrow mobile boardWidth (350px) to guarantee zero overflow/overlap
  const resD = eliminateZeroPairs([...exDPos, ...exDNeg], { boardWidth: 350, boardHeight: 420 });
  assert.equal(resD.removedCount, 2);
  assert.deepEqual(countTileStatuses(resD.remainingTiles), { activeCount: 3, cancelledCount: 4 });
  assert.equal(formatExpression(resD.remainingTiles, true), '3x');
  const remD = resD.remainingTiles.filter(isTileActive);
  assert.equal(remD.length, 3);
  const newGroupId = remD[0].groupId;
  assert.ok(newGroupId, 'Multiple unmatched remainders must form a new active group');
  assert.notEqual(newGroupId, 'grp-d-pos', 'Remainder group must receive a new groupId');
  assert.ok(remD.every((t) => t.groupId === newGroupId && t.zeroPairId === null));
  assert.equal(computeTileGroups(resD.remainingTiles).length, 1);
  assert.equal(computeTileGroups(resD.remainingTiles)[0].label, '3x');
  assertNoActiveOverlapsAndWithinBounds(resD.remainingTiles, 350);
  // Remainder group must not sit on top of cancelled tiles
  const cancelledD = resD.remainingTiles.filter((t) => !isTileActive(t));
  for (const r of remD) {
    const dr = getTileDimsForLayout(r.type);
    for (const c of cancelledD) {
      const dc = getTileDimsForLayout(c.type);
      const overlapsCancelled =
        r.position.x < c.position.x + dc.width &&
        r.position.x + dr.width > c.position.x &&
        r.position.y < c.position.y + dc.height &&
        r.position.y + dr.height > c.position.y;
      assert.equal(overlapsCancelled, false, 'Active remainder tile must detach cleanly from cancelled tiles');
    }
  }
});

test('Revision 2 Y-Family, Guardrails, Idempotence, Drop Detection, Undo/Redo & Persistence', () => {
  // Y-family grouped stacks: +3y + (−2y) = +y and +2xy + (−2xy) = 0
  const yPos = [0, 1, 2].map((i) => createTile('y', 1, { x: 20, y: 40 + i * 98 }, 'grp-ypos'));
  const yNeg = [0, 1].map((i) => createTile('y', -1, { x: 80, y: 40 + i * 98 }, 'grp-yneg'));
  const resY = eliminateZeroPairs([...yPos, ...yNeg], { boardWidth: 360, boardHeight: 400 });
  assert.equal(resY.removedCount, 2);
  assert.equal(formatExpression(resY.remainingTiles, true), 'y');
  assert.equal(resY.remainingTiles.filter(isTileActive)[0].groupId, null);
  assertNoActiveOverlapsAndWithinBounds(resY.remainingTiles, 360);

  const xyPos = [
    createTile('xy', 1, { x: 20, y: 40 }, 'grp-xypos'),
    createTile('xy', 1, { x: 120, y: 40 }, 'grp-xypos'),
  ];
  const xyNeg = [
    createTile('xy', -1, { x: 20, y: 140 }, 'grp-xyneg'),
    createTile('xy', -1, { x: 120, y: 140 }, 'grp-xyneg'),
  ];
  const resXY = eliminateZeroPairs([...xyPos, ...xyNeg], { boardWidth: 540, boardHeight: 360 });
  assert.equal(resXY.removedCount, 2);
  assert.equal(formatExpression(resXY.remainingTiles, true), '0');

  // Guardrails: unlike terms & same-sign stacks never cancel
  const unlikeTiles = [
    createTile('x', 1, { x: 20, y: 40 }, 'g1'),
    createTile('x2', -1, { x: 140, y: 40 }, 'g2'),
    createTile('y', -1, { x: 260, y: 40 }, 'g3'),
    createTile('xy', 1, { x: 20, y: 150 }, 'g4'),
    createTile('y2', -1, { x: 140, y: 150 }, 'g5'),
  ];
  assert.equal(eliminateZeroPairs(unlikeTiles).removedCount, 0);

  const sameSignStack = [
    createTile('x', 1, { x: 20, y: 40 }, 'same-pos'),
    createTile('x', 1, { x: 116, y: 40 }, 'same-pos'),
    createTile('1', -1, { x: 20, y: 120 }, 'same-neg'),
    createTile('1', -1, { x: 68, y: 120 }, 'same-neg'),
    createTile('1', -1, { x: 116, y: 120 }, 'same-neg'),
  ];
  assert.equal(eliminateZeroPairs(sameSignStack).removedCount, 0);

  // Repeated Match Zero Pairs never cancels an already cancelled tile twice
  const dPos = [0, 1, 2, 3, 4].map((idx) =>
    createTile('x', 1, { x: 24 + idx * 96, y: 48 }, 'grp-repeat-pos')
  );
  const dNeg = [
    createTile('x', -1, { x: 24, y: 120 }, 'grp-repeat-neg'),
    createTile('x', -1, { x: 120, y: 120 }, 'grp-repeat-neg'),
  ];
  const initialTiles = [...dPos, ...dNeg];
  const firstMatch = eliminateZeroPairs(initialTiles, { boardWidth: 540, boardHeight: 360 });
  assert.equal(firstMatch.removedCount, 2);
  const secondMatch = eliminateZeroPairs(firstMatch.remainingTiles, { boardWidth: 540, boardHeight: 360 });
  assert.equal(secondMatch.removedCount, 0);
  assert.deepEqual(countTileStatuses(secondMatch.remainingTiles), { activeCount: 3, cancelledCount: 4 });

  // Group-onto-opposite-group drop detection triggers 'zeropair'
  const dropHit = detectDropTarget(
    initialTiles,
    dNeg.map((t) => t.id),
    'x',
    -1,
    { x: 24, y: 48, width: 186, height: 36 },
    false
  );
  assert.equal(dropHit?.kind, 'zeropair');

  // Multi-tile selection inspection shows zero pair summary & allows Match Zero Pairs
  const multiInspect = resolveZeroPairInspection(
    initialTiles,
    [dPos[0].id, dPos[1].id, dPos[2].id, dNeg[0].id, dNeg[1].id],
    null
  );
  assert.ok(multiInspect);
  assert.equal(multiInspect.canMatch, true);
  assert.equal(multiInspect.label, 'Zero Pair (= 0)');

  // Undo -> Redo -> Persistence round-trip preserves exact pre-op groups/IDs/positions and post-op remainder group
  let stack = [initialTiles];
  let idx = 0;
  const pushed = pushBoundedHistory(stack, idx, firstMatch.remainingTiles);
  stack = pushed.stack;
  idx = pushed.index;

  const mem = createMemoryStorage();
  saveWorkspaceSession(
    {
      mode: 'explore',
      activeMissionId: null,
      presetIdx: 0,
      exploreHistory: stack,
      exploreHistoryIdx: idx,
      equationHistory: [
        createInitialEquationState([{ type: 'x', sign: 1, count: 1 }], [{ type: '1', sign: 1, count: 2 }]),
      ],
      equationHistoryIdx: 0,
    },
    mem
  );

  const reloaded = loadWorkspaceSession(mem);
  assert.equal(reloaded.status, 'ok');
  assert.ok(reloaded.session);
  // Post-match state preserved after reload
  const postReloadTiles = reloaded.session.exploreHistory[reloaded.session.exploreHistoryIdx];
  assert.equal(formatExpression(postReloadTiles, true), '3x');
  assert.deepEqual(countTileStatuses(postReloadTiles), { activeCount: 3, cancelledCount: 4 });

  // Undo restores exact original groups, IDs, and positions
  const undoTiles = reloaded.session.exploreHistory[reloaded.session.exploreHistoryIdx - 1];
  assert.deepEqual(countTileStatuses(undoTiles), { activeCount: 7, cancelledCount: 0 });
  assert.equal(
    undoTiles.filter((t) => t.groupId === 'grp-repeat-pos').length,
    5,
    'Undo must restore original +5x group'
  );
  assert.equal(
    undoTiles.filter((t) => t.groupId === 'grp-repeat-neg').length,
    2,
    'Undo must restore original −2x group'
  );
  assert.deepEqual(undoTiles[0].position, { x: 24, y: 48 });

  // Redo returns to cancelled + detached +3x group
  const redoTiles = reloaded.session.exploreHistory[reloaded.session.exploreHistoryIdx];
  assert.equal(formatExpression(redoTiles, true), '3x');
  assert.equal(computeTileGroups(redoTiles).length, 1);
});







