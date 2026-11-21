import { EquationState, Tile, TileSign, TileType } from '../types/algebra';
import {
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
    lastActionNote: `Persamaan awal: ${formatExpression(leftTiles, true)} = ${formatExpression(
      rightTiles,
      true
    )}. Terapkan operasi yang sama pada kedua sisi untuk menjaga kesetaraan.`,
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
        ? 'Sisi Kiri'
        : 'Sisi Kanan'
      : 'salah satu sisi';

  return {
    isBalanced: false,
    reason: `Peringatan Kesetaraan: ${changedSide} berubah tanpa operasi yang sama di sisi lainnya! Kedua sisi persamaan harus selalu diperlakukan setara agar solusi tetap benar.`,
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
      ? `Operasi setara: menambahkan ${termStr} pada kedua sisi. Persamaan tetap seimbang (${formatEquation(
          nextLeft,
          nextRight,
          true
        )}).`
      : balanceCheck.reason || 'Persamaan tidak seimbang.';
  } else {
    message = balanceCheck.isBalanced
      ? `Kedua sisi kembali seimbang: ${formatEquation(nextLeft, nextRight, true)}.`
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
      ? `Berhasil meniadakan ${totalRemoved} zero pair! Persamaan menjadi ${formatEquation(
          leftRes.remainingTiles,
          rightRes.remainingTiles,
          true
        )}.`
      : 'Tidak ada zero pair yang perlu disederhanakan pada kedua sisi persamaan.';

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
        'Persamaan belum setara! Pastikan setiap operasi diterapkan pada sisi kiri dan sisi kanan secara seimbang.',
    };
  }

  const leftPairs = findZeroPairs(state.leftTiles);
  const rightPairs = findZeroPairs(state.rightTiles);
  if (leftPairs.length > 0 || rightPairs.length > 0) {
    return {
      solved: false,
      message:
        'Kedua sisi sudah seimbang! Sekarang klik "Sederhanakan Zero Pair" untuk meniadakan pasangan nol sehingga variabel x berdiri sendiri.',
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
        message: `Hasil saat ini x = ${right.constant}, periksa kembali keseimbangan operasi.`,
      };
    }
    return {
      solved: true,
      message: `Hebat! Persamaan terselesaikan secara setara hingga diperoleh x = ${right.constant}.`,
    };
  }

  if (rightIsSingleX && leftIsConstant) {
    if (expectedValue !== undefined && left.constant !== expectedValue) {
      return {
        solved: false,
        message: `Hasil saat ini ${left.constant} = x, periksa kembali keseimbangan operasi.`,
      };
    }
    return {
      solved: true,
      message: `Hebat! Persamaan terselesaikan secara setara hingga diperoleh x = ${left.constant}.`,
    };
  }

  return {
    solved: false,
    message: `Persamaan saat ini masih ${formatEquation(
      state.leftTiles,
      state.rightTiles,
      true
    )}. Isolasikan tepat satu ubin +x di satu sisi dan konstanta di sisi lainnya.`,
  };
}
