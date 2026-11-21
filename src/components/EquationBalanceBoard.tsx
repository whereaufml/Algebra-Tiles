import React from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw, Scale, Wand2 } from 'lucide-react';
import { EquationState, TileSign, TileType } from '../types/algebra';
import {
  applyTileToEquationSide,
  checkEquationSolved,
  eliminateEquationZeroPairs,
  formatEquation,
} from '../engine/EquationSolver';
import { findZeroPairs, formatExpression } from '../engine/MathEngine';
import { TileVisual } from './Tile';

interface EquationBalanceBoardProps {
  equationState: EquationState;
  onChangeEquation: (next: EquationState) => void;
  onResetEquation: () => void;
  expectedSolution?: number;
  onSolved?: () => void;
  onZeroPairsCleared?: (count: number) => void;
}

const PRESET_EQUATIONS: Array<{
  label: string;
  left: Array<{ type: TileType; sign: TileSign; count: number }>;
  right: Array<{ type: TileType; sign: TileSign; count: number }>;
  solution: number;
}> = [
  {
    label: 'x + 3 = 5',
    left: [
      { type: 'x', sign: 1, count: 1 },
      { type: '1', sign: 1, count: 3 },
    ],
    right: [{ type: '1', sign: 1, count: 5 }],
    solution: 2,
  },
  {
    label: 'x − 2 = 4',
    left: [
      { type: 'x', sign: 1, count: 1 },
      { type: '1', sign: -1, count: 2 },
    ],
    right: [{ type: '1', sign: 1, count: 4 }],
    solution: 6,
  },
  {
    label: 'x + 1 = −2',
    left: [
      { type: 'x', sign: 1, count: 1 },
      { type: '1', sign: 1, count: 1 },
    ],
    right: [{ type: '1', sign: -1, count: 2 }],
    solution: -3,
  },
];

export { PRESET_EQUATIONS };

export const EquationBalanceBoard: React.FC<EquationBalanceBoardProps> = ({
  equationState,
  onChangeEquation,
  onResetEquation,
  expectedSolution,
  onSolved,
  onZeroPairsCleared,
}) => {
  const [targetSide, setTargetSide] = React.useState<'both' | 'left' | 'right'>('both');
  const [checkMessage, setCheckMessage] = React.useState<{
    tone: 'success' | 'warning';
    text: string;
  } | null>(null);

  const leftZeroPairs = findZeroPairs(equationState.leftTiles);
  const rightZeroPairs = findZeroPairs(equationState.rightTiles);
  const totalPairs = leftZeroPairs.length + rightZeroPairs.length;

  const leftIds = new Set(leftZeroPairs.flatMap(([a, b]) => [a.id, b.id]));
  const rightIds = new Set(rightZeroPairs.flatMap(([a, b]) => [a.id, b.id]));

  const handleApplyTile = (type: TileType, sign: TileSign) => {
    const res = applyTileToEquationSide(equationState, targetSide, type, sign, 1);
    onChangeEquation(res.nextState);
    setCheckMessage(null);
  };

  const handleSimplifyZeroPairs = () => {
    const before = totalPairs;
    const res = eliminateEquationZeroPairs(equationState);
    onChangeEquation(res.nextState);
    if (before > 0) {
      onZeroPairsCleared?.(before);
    }
    setCheckMessage(null);
  };

  const handleCheckSolution = () => {
    const res = checkEquationSolved(equationState, expectedSolution);
    setCheckMessage({
      tone: res.solved ? 'success' : 'warning',
      text: res.message,
    });
    if (res.solved) {
      onSolved?.();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Operation Control Deck */}
      <div className="rounded-2xl border border-[#E5E0F3] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#39286F]">
              Operasi Papan Persamaan
            </h3>
            <p className="text-xs text-slate-600">
              Pilih target operasi (Sisi Kiri, Sisi Kanan, atau Kedua Sisi Setara), lalu tambahkan ubin.
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-[#F7F5FC] p-1 border border-[#E5E0F3]">
            {(
              [
                { id: 'both', label: 'Kedua Sisi (Setara)' },
                { id: 'left', label: 'Sisi Kiri Saja' },
                { id: 'right', label: 'Sisi Kanan Saja' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTargetSide(opt.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  targetSide === opt.id
                    ? 'bg-[#5943A8] text-white shadow-xs'
                    : 'text-slate-700 hover:text-[#39286F]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E0F3] pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { type: 'x', sign: 1, label: '+x' },
                { type: 'x', sign: -1, label: '−x' },
                { type: '1', sign: 1, label: '+1' },
                { type: '1', sign: -1, label: '−1' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => handleApplyTile(btn.type, btn.sign)}
                className={`rounded-xl px-3.5 py-2 font-math text-xs font-bold text-white transition-transform hover:scale-[1.03] ${
                  btn.sign === 1
                    ? btn.type === '1'
                      ? 'bg-[#1E8E82] hover:bg-[#156B62]'
                      : 'bg-[#2B72C4] hover:bg-[#1E5494]'
                    : btn.type === '1'
                    ? 'bg-[#C94438] hover:bg-[#9B2F25]'
                    : 'bg-[#D96A27] hover:bg-[#A84E17]'
                }`}
              >
                Tambah {btn.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSimplifyZeroPairs}
              disabled={totalPairs === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#EF8748] px-3 py-2 text-xs font-semibold text-white hover:bg-[#D96A27] disabled:opacity-40 whitespace-nowrap"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Sederhanakan Zero Pair ({totalPairs})
            </button>

            <button
              type="button"
              onClick={handleCheckSolution}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#27A89A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1E8E82] whitespace-nowrap"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Periksa Solusi
            </button>

            <button
              type="button"
              onClick={() => {
                setCheckMessage(null);
                onResetEquation();
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-[#E5E0F3] bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Ulangi
            </button>
          </div>
        </div>
      </div>

      {/* Balance Indicator Banner */}
      <div
        role="status"
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
          equationState.isBalanced
            ? 'border-[#27A89A]/40 bg-[#EAF7F5] text-[#155952]'
            : 'border-[#C94438]/50 bg-[#FFF2F0] text-[#8F241B]'
        }`}
      >
        {equationState.isBalanced ? (
          <Scale className="mt-0.5 h-5 w-5 shrink-0 text-[#1E8E82]" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#C94438]" />
        )}
        <div>
          <p className="font-semibold">
            {equationState.isBalanced
              ? 'Status Kesetaraan: Persamaan Seimbang'
              : 'Status Kesetaraan: Tidak Seimbang!'}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed">
            {equationState.lastActionNote}
          </p>
        </div>
      </div>

      {checkMessage && (
        <div
          role="status"
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            checkMessage.tone === 'success'
              ? 'border-[#27A89A] bg-[#E6F7F4] text-[#13534C]'
              : 'border-[#F4C95D] bg-[#FFFBEB] text-[#78530A]'
          }`}
        >
          {checkMessage.text}
        </div>
      )}

      {/* Two-Sided Equation Mat */}
      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
        {/* Left Side */}
        <div className="flex flex-col rounded-2xl border-2 border-[#D6CEF0] bg-white p-4">
          <div className="mb-3 flex items-center justify-between border-b border-[#F0ECF9] pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5943A8]">
              Sisi Kiri
            </span>
            <span className="font-math text-lg font-bold text-[#39286F] tabular-nums">
              {formatExpression(equationState.leftTiles, true)}
            </span>
          </div>
          <div className="flex min-h-[190px] flex-wrap content-start gap-2.5">
            {equationState.leftTiles.length === 0 ? (
              <span className="text-xs text-slate-400">Kosong (0)</span>
            ) : (
              equationState.leftTiles.map((tile) => (
                <div key={tile.id} className="animate-tile-pop">
                  <TileVisual
                    type={tile.type}
                    sign={tile.sign}
                    zeroPairHighlight={leftIds.has(tile.id)}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Equals Fulcrum */}
        <div className="flex flex-row items-center justify-center gap-2 py-2 md:flex-col">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 font-math text-2xl font-bold transition-transform ${
              equationState.isBalanced
                ? 'border-[#27A89A] bg-[#EAF7F5] text-[#156B62]'
                : 'border-[#C94438] bg-[#FFF2F0] text-[#9B2F25] rotate-12'
            }`}
          >
            =
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {equationState.isBalanced ? 'Setara' : 'Miring'}
          </span>
        </div>

        {/* Right Side */}
        <div className="flex flex-col rounded-2xl border-2 border-[#D6CEF0] bg-white p-4">
          <div className="mb-3 flex items-center justify-between border-b border-[#F0ECF9] pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5943A8]">
              Sisi Kanan
            </span>
            <span className="font-math text-lg font-bold text-[#39286F] tabular-nums">
              {formatExpression(equationState.rightTiles, true)}
            </span>
          </div>
          <div className="flex min-h-[190px] flex-wrap content-start gap-2.5">
            {equationState.rightTiles.length === 0 ? (
              <span className="text-xs text-slate-400">Kosong (0)</span>
            ) : (
              equationState.rightTiles.map((tile) => (
                <div key={tile.id} className="animate-tile-pop">
                  <TileVisual
                    type={tile.type}
                    sign={tile.sign}
                    zeroPairHighlight={rightIds.has(tile.id)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live Equation Readout */}
      <div className="rounded-2xl border border-[#E5E0F3] bg-[#F4F0FC] px-5 py-3 text-center">
        <span className="text-xs font-semibold text-[#5943A8]">
          PERSAMAAN SAAT INI:{' '}
        </span>
        <span
          data-testid="equation-expression"
          className="font-math text-xl font-bold text-[#39286F] tabular-nums"
        >
          {formatEquation(equationState.leftTiles, equationState.rightTiles, true)}
        </span>
      </div>
    </div>
  );
};
