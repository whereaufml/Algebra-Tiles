import { EquationState, Tile, TileSign, TileType } from '../types/algebra';
import {
  clearCancelledZeroPairs,
  createTile,
  createTilesFromSpec,
  eliminateZeroPairs,
  findZeroPairs,
  formatExpression,
  summarizeTiles,
} from './MathEngine';

export function createInitialEquationState(
  leftSpec: Array<{ type: TileType; sign: TileSign; count: number }>,
  rightSpec: Array<{ type: TileType; sign: TileSign; count: number }>
): EquationState {
  const leftTiles = createTilesFromSpec(leftSpec, 20, 24);
  const rightTiles = createTilesFromSpec(rightSpec, 20, 24);

  return {
    leftTiles,
    rightTiles,
    initialLeft: summarizeTiles(leftTiles),
    initialRight: summarizeTiles(rightTiles),
    lastActionNote: `Initial equation: ${formatExpression(leftTiles, true)} = ${formatExpression(
      rightTiles,
      true
    )}. Apply the same operation to both sides to keep the equation balanced.`,
    isBalanced: true,
  };
}

export function formatEquation(leftTiles: Tile[], rightTiles: Tile[], simplified = true): string {
  return `${formatExpression(leftTiles, simplified)} = ${formatExpression(rightTiles, simplified)}`;
}

export interface EquationOperationFeedback {
  nextState: EquationState;
  isBalanced: boolean;
  message: string;
}

/**
 * Checks whether the current equation preserves mathematical equivalence
 * relative to the original equation (i.e. Left - Right === InitialLeft - InitialRight,
 * or both sides changed by the exact same algebraic delta).
 */
export function validateEquationEquality(
  leftTiles: Tile[],
  rightTiles: Tile[],
  initialLeft: { x2: number; x: number; constant: number },
  initialRight: { x2: number; x: number; constant: number }
): { isBalanced: boolean; reason?: string } {
  const left = summarizeTiles(leftTiles);
  const right = summarizeTiles(rightTiles);

  const deltaLeft = {
    x2: left.x2 - initialLeft.x2,
    x: left.x - initialLeft.x,
    constant: left.constant - initialLeft.constant,
  };
  const deltaRight = {
    x2: right.x2 - initialRight.x2,
    x: right.x - initialRight.x,
    constant: right.constant - initialRight.constant,
  };

  const diffX2 = deltaLeft.x2 - deltaRight.x2;
  const diffX = deltaLeft.x - deltaRight.x;
  const diffConst = deltaLeft.constant - deltaRight.constant;

  if (diffX2 === 0 && diffX === 0 && diffConst === 0) {
    return { isBalanced: true };
  }

  const changedSide =
    deltaLeft.x2 !== deltaRight.x2 ||
    deltaLeft.x !== deltaRight.x ||
    deltaLeft.constant !== deltaRight.constant
      ? Math.abs(deltaLeft.x2) + Math.abs(deltaLeft.x) + Math.abs(deltaLeft.constant) >
        Math.abs(deltaRight.x2) + Math.abs(deltaRight.x) + Math.abs(deltaRight.constant)
        ? 'Left Side'
        : 'Right Side'
      : 'one side';

  return {
    isBalanced: false,
    reason: `Balance Warning: The ${changedSide} changed without the same operation on the other side! Always apply identical operations to both sides to preserve equality.`,
  };
}

export function applyTileToEquationSide(
  state: EquationState,
  side: 'left' | 'right' | 'both',
  type: TileType,
  sign: TileSign,
  count = 1
): EquationOperationFeedback {
  const addTilesToSide = (existing: Tile[]): Tile[] => {
    const next = [...existing];
    for (let i = 0; i < count; i += 1) {
      const idx = next.length;
      next.push(
        createTile(type, sign, {
          x: 20 + (idx % 4) * 74,
          y: 24 + Math.floor(idx / 4) * 86,
        })
      );
    }
    return next;
  };

  const nextLeft = side === 'left' || side === 'both' ? addTilesToSide(state.leftTiles) : state.leftTiles;
  const nextRight =
    side === 'right' || side === 'both' ? addTilesToSide(state.rightTiles) : state.rightTiles;

  const balanceCheck = validateEquationEquality(
    nextLeft,
    nextRight,
    state.initialLeft,
    state.initialRight
  );

  const symbol = type === 'x2' ? 'x²' : type === '1' ? '' : 'x';
  const signStr = sign === 1 ? '+' : '−';
  const qtyStr = type === '1' ? String(count) : count === 1 ? '' : String(count);
  const termStr = `${signStr}${qtyStr}${symbol}`;

  let message = '';
  if (side === 'both') {
    message = balanceCheck.isBalanced
      ? `Balanced operation: added ${termStr} to both sides. The equation remains balanced (${formatEquation(
          nextLeft,
          nextRight,
          true
        )}).`
      : balanceCheck.reason || 'The equation is unbalanced.';
  } else {
    message = balanceCheck.isBalanced
      ? `Both sides are balanced again: ${formatEquation(nextLeft, nextRight, true)}.`
      : balanceCheck.reason!;
  }

  return {
    nextState: {
      ...state,
      leftTiles: nextLeft,
      rightTiles: nextRight,
      isBalanced: balanceCheck.isBalanced,
      imbalanceReason: balanceCheck.reason,
      lastActionNote: message,
    },
    isBalanced: balanceCheck.isBalanced,
    message,
  };
}

export function eliminateEquationZeroPairs(state: EquationState): EquationOperationFeedback {
  const leftRes = eliminateZeroPairs(state.leftTiles);
  const rightRes = eliminateZeroPairs(state.rightTiles);

  const totalRemoved = leftRes.removedCount + rightRes.removedCount;
  const balanceCheck = validateEquationEquality(
    leftRes.remainingTiles,
    rightRes.remainingTiles,
    state.initialLeft,
    state.initialRight
  );

  const message =
    totalRemoved > 0
      ? `Cancelled ${totalRemoved} zero pair(s)! Faded zero-pair tiles are no longer counted, leaving the active equation ${formatEquation(
          leftRes.remainingTiles,
          rightRes.remainingTiles,
          true
        )}.`
      : 'There are no active zero pairs to simplify on either side of the equation.';

  return {
    nextState: {
      ...state,
      leftTiles: leftRes.remainingTiles,
      rightTiles: rightRes.remainingTiles,
      isBalanced: balanceCheck.isBalanced,
      imbalanceReason: balanceCheck.reason,
      lastActionNote: message,
    },
    isBalanced: balanceCheck.isBalanced,
    message,
  };
}

export function clearEquationCancelledTiles(state: EquationState): EquationOperationFeedback {
  const leftClear = clearCancelledZeroPairs(state.leftTiles);
  const rightClear = clearCancelledZeroPairs(state.rightTiles);
  const totalCleared = leftClear.clearedCount + rightClear.clearedCount;

  const message =
    totalCleared > 0
      ? `Cleared ${totalCleared} faded zero-pair tile(s). The active equation remains ${formatEquation(
          leftClear.remainingTiles,
          rightClear.remainingTiles,
          true
        )}.`
      : 'There are no faded tiles to clear on the equation balance board.';

  return {
    nextState: {
      ...state,
      leftTiles: leftClear.remainingTiles,
      rightTiles: rightClear.remainingTiles,
      lastActionNote: message,
    },
    isBalanced: state.isBalanced,
    message,
  };
}

export function checkEquationSolved(
  state: EquationState,
  expectedValue?: number
): { solved: boolean; message: string } {
  const balance = validateEquationEquality(
    state.leftTiles,
    state.rightTiles,
    state.initialLeft,
    state.initialRight
  );

  if (!balance.isBalanced) {
    return {
      solved: false,
      message:
        balance.reason ||
        'The equation is not balanced yet! Make sure every operation is applied equally to both the left and right sides.',
    };
  }

  const leftPairs = findZeroPairs(state.leftTiles);
  const rightPairs = findZeroPairs(state.rightTiles);
  if (leftPairs.length > 0 || rightPairs.length > 0) {
    return {
      solved: false,
      message:
        'Both sides are balanced! Now click "Match Zero Pairs" to cancel opposite tiles and isolate x.',
    };
  }

  const left = summarizeTiles(state.leftTiles);
  const right = summarizeTiles(state.rightTiles);

  const leftIsSingleX = left.x2 === 0 && left.x === 1 && left.constant === 0;
  const rightIsConstant = right.x2 === 0 && right.x === 0;

  const rightIsSingleX = right.x2 === 0 && right.x === 1 && right.constant === 0;
  const leftIsConstant = left.x2 === 0 && left.x === 0;

  if (leftIsSingleX && rightIsConstant) {
    if (expectedValue !== undefined && right.constant !== expectedValue) {
      return {
        solved: false,
        message: `Current result is x = ${right.constant}. Double-check your balanced operations.`,
      };
    }
    return {
      solved: true,
      message: `Great job! The equation is balanced and solved to give x = ${right.constant}.`,
    };
  }

  if (rightIsSingleX && leftIsConstant) {
    if (expectedValue !== undefined && left.constant !== expectedValue) {
      return {
        solved: false,
        message: `Current result is ${left.constant} = x. Double-check your balanced operations.`,
      };
    }
    return {
      solved: true,
      message: `Great job! The equation is balanced and solved to give x = ${left.constant}.`,
    };
  }

  return {
    solved: false,
    message: `Current equation is ${formatEquation(
      state.leftTiles,
      state.rightTiles,
      true
    )}. Isolate a single +x tile on one side and constants on the other side.`,
  };
}
