import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { TileVisual } from './Tile';

export const AreaModelPreview: React.FC = () => {
  const [a, setA] = useState(2); // (x + a)
  const [b, setB] = useState(1); // (x + b)

  const xCoeff = a + b;
  const constant = a * b;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E0F3] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#5943A8]">
            MODUL LANJUTAN · MODEL LUAS (AREA MODEL)
          </p>
          <h3 className="mt-0.5 text-lg font-bold text-[#39286F]">
            Perkalian & Pemfaktoran Bentuk Aljabar Positif
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Ubah faktor di sisi kiri dan atas untuk melihat bagaimana luas persegi panjang membentuk ekspresi kuadrat.
          </p>
        </div>

        <div className="rounded-xl bg-[#F7F5FC] px-4 py-2.5 text-right border border-[#E5E0F3]">
          <p className="text-[11px] font-semibold text-[#5943A8]">HASIL PERKALIAN</p>
          <p className="font-math text-lg font-bold text-[#39286F] tabular-nums">
            (x + {a})(x + {b}) = x² + {xCoeff}x + {constant}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-4 rounded-xl bg-[#F7F5FC] p-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#39286F]">
          <span>Konstanta Faktor Pertama (x + {a}): {a}</span>
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
          <span>Konstanta Faktor Kedua (x + {b}): {b}</span>
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

      {/* Visual Area Grid */}
      <div className="overflow-x-auto py-2">
        <div className="inline-grid grid-cols-[auto_1fr] gap-3">
          <div />
          <div className="flex items-center gap-2 px-1">
            <div className="w-[78px] text-center font-math text-sm font-bold text-[#2B72C4]">
              x
            </div>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: b }).map((_, idx) => (
                <span
                  key={idx}
                  className="w-[44px] text-center font-math text-sm font-bold text-[#1E8E82]"
                >
                  +1
                </span>
              ))}
            </div>
          </div>

          {/* Left Factor Labels */}
          <div className="flex flex-col gap-2 py-1">
            <div className="flex h-[78px] items-center justify-end pr-2 font-math text-sm font-bold text-[#2B72C4]">
              x
            </div>
            {Array.from({ length: a }).map((_, idx) => (
              <div
                key={idx}
                className="flex h-[44px] items-center justify-end pr-2 font-math text-sm font-bold text-[#1E8E82]"
              >
                +1
              </div>
            ))}
          </div>

          {/* Tile Area Grid */}
          <div className="flex flex-col gap-2 rounded-2xl border border-[#D6CEF0] bg-[#FCFBFF] p-3">
            {/* Row 1: x^2 and b horizontal x tiles */}
            <div className="flex items-center gap-2">
              <TileVisual type="x2" sign={1} />
              <div className="flex items-center gap-1.5">
                {Array.from({ length: b }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex h-[78px] w-[44px] items-center justify-center rounded-lg border-2 border-[#1E5494] bg-[#2B72C4] font-math text-sm font-bold text-white"
                  >
                    +x
                  </div>
                ))}
              </div>
            </div>

            {/* Next a rows: x tile and b unit tiles */}
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

      {/* Pedagogical Constraint Note per Spec 4.3 */}
      <div className="flex items-start gap-2.5 rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] p-3 text-xs text-slate-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#5943A8]" />
        <p>
          <strong>Catatan Matematis:</strong> Model luas di atas digunakan untuk suku positif. Ubin negatif adalah representasi aljabar bertanda (bukan luas fisik positif), sehingga perkalian bertanda negatif dijelaskan melalui aturan distribusi tanda dan zero pairs.
        </p>
      </div>
    </div>
  );
};
