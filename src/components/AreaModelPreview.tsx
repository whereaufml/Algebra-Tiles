import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { TileVisual } from './Tile';

export const AreaModelPreview: React.FC = () => {
  const [subMode, setSubMode] = useState<'distributive' | 'binomial'>('distributive');

  // Primary distributive model: k(x + a)
  const [k, setK] = useState(2);
  const [unitA, setUnitA] = useState(3);

  // Optional extension model: (x + a)(x + b)
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);

  const xCoeff = a + b;
  const constant = a * b;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0F3] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#5943A8]">
            VISUAL MULTIPLICATION MODEL · AREA &amp; TILE GROUPS
          </p>
          <h3 className="mt-0.5 text-lg font-bold text-[#39286F]">
            {subMode === 'distributive'
              ? 'Scalar × Expression in Parentheses: k(x + a)'
              : 'Extension: Multiplying Two Binomials (x + a)(x + b)'}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {subMode === 'distributive'
              ? 'Core focus: adjust the number of groups k and constant a to explore the distributive property k(x + a) = kx + ka.'
              : 'Optional extension to explore an area model with positive quadratic terms.'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="inline-flex rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] p-1">
            <button
              type="button"
              onClick={() => setSubMode('distributive')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                subMode === 'distributive'
                  ? 'bg-[#5943A8] text-white'
                  : 'text-slate-600 hover:text-[#39286F]'
              }`}
            >
              Core: k(x + a)
            </button>
            <button
              type="button"
              onClick={() => setSubMode('binomial')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                subMode === 'binomial'
                  ? 'bg-[#5943A8] text-white'
                  : 'text-slate-600 hover:text-[#39286F]'
              }`}
            >
              Extension: (x + a)(x + b)
            </button>
          </div>

          <div className="rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] px-4 py-2 text-right">
            <p className="text-[11px] font-semibold text-[#5943A8]">PRODUCT RESULT</p>
            <p className="font-math text-lg font-bold text-[#39286F] tabular-nums">
              {subMode === 'distributive'
                ? `${k}(x + ${unitA}) = ${k}x + ${k * unitA}`
                : `(x + ${a})(x + ${b}) = x² + ${xCoeff}x + ${constant}`}
            </p>
          </div>
        </div>
      </div>

      {subMode === 'distributive' ? (
        <>
          <div className="grid grid-cols-1 gap-4 rounded-xl bg-[#F7F5FC] p-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#39286F]">
              <span>Number of Groups (k): {k}</span>
              <input
                type="range"
                min={2}
                max={4}
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                className="accent-[#5943A8]"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#39286F]">
              <span>Constant Inside Parentheses (x + {unitA}): {unitA}</span>
              <input
                type="range"
                min={1}
                max={5}
                value={unitA}
                onChange={(e) => setUnitA(Number(e.target.value))}
                className="accent-[#5943A8]"
              />
            </label>
          </div>

          <div className="overflow-x-auto py-2">
            <div className="inline-grid grid-cols-[auto_1fr] gap-3">
              <div />
              <div className="flex items-center gap-2 px-1">
                <div className="w-[90px] text-center font-math text-sm font-bold text-[#077D66]">
                  x
                </div>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: unitA }).map((_, idx) => (
                    <span
                      key={idx}
                      className="w-[36px] text-center font-math text-sm font-bold text-[#B45309]"
                    >
                      +1
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 py-1">
                {Array.from({ length: k }).map((_, rowIdx) => (
                  <div
                    key={rowIdx}
                    className="flex h-[36px] items-center justify-end pr-2 font-math text-xs font-bold text-[#5943A8]"
                  >
                    Grp {rowIdx + 1}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-[#D6CEF0] bg-[#FCFBFF] p-3">
                {Array.from({ length: k }).map((_, rowIdx) => (
                  <div key={rowIdx} className="flex items-center gap-2">
                    <TileVisual type="x" sign={1} />
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: unitA }).map((__, colIdx) => (
                        <TileVisual key={colIdx} type="1" sign={1} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 rounded-xl bg-[#F7F5FC] p-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#39286F]">
              <span>First Factor Constant (x + {a}): {a}</span>
              <input
                type="range"
                min={1}
                max={4}
                value={a}
                onChange={(e) => setA(Number(e.target.value))}
                className="accent-[#5943A8]"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#39286F]">
              <span>Second Factor Constant (x + {b}): {b}</span>
              <input
                type="range"
                min={1}
                max={4}
                value={b}
                onChange={(e) => setB(Number(e.target.value))}
                className="accent-[#5943A8]"
              />
            </label>
          </div>

          <div className="overflow-x-auto py-2">
            <div className="inline-grid grid-cols-[auto_1fr] gap-3">
              <div />
              <div className="flex items-center gap-2 px-1">
                <div className="w-[90px] text-center font-math text-sm font-bold text-[#2D6DF6]">
                  x
                </div>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: b }).map((_, idx) => (
                    <span
                      key={idx}
                      className="w-[36px] text-center font-math text-sm font-bold text-[#B45309]"
                    >
                      +1
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 py-1">
                <div className="flex h-[90px] items-center justify-end pr-2 font-math text-sm font-bold text-[#2D6DF6]">
                  x
                </div>
                {Array.from({ length: a }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex h-[36px] items-center justify-end pr-2 font-math text-sm font-bold text-[#B45309]"
                  >
                    +1
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-[#D6CEF0] bg-[#FCFBFF] p-3">
                <div className="flex items-center gap-2">
                  <TileVisual type="x2" sign={1} />
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: b }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex h-[90px] w-[36px] items-center justify-center rounded-lg border-2 border-[#077D66] bg-[#0CA789] font-math text-sm font-bold text-white"
                      >
                        x
                      </div>
                    ))}
                  </div>
                </div>

                {Array.from({ length: a }).map((_, rowIdx) => (
                  <div key={rowIdx} className="flex items-center gap-2">
                    <TileVisual type="x" sign={1} />
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: b }).map((__, colIdx) => (
                        <TileVisual key={colIdx} type="1" sign={1} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex items-start gap-2.5 rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] p-3 text-xs text-slate-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#5943A8]" />
        <p>
          <strong>Math Note:</strong> Core multiplication focuses on <strong className="font-math">k(x + a) = kx + ka</strong> using repeated tile groups. The <span className="font-math">(x + a)(x + b)</span> extension tab applies to positive terms as an introduction to the area model.
        </p>
      </div>
    </div>
  );
};
