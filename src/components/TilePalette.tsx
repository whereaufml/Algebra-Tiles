import React from 'react';
import { Plus } from 'lucide-react';
import { TileSign, TileType } from '../types/algebra';
import { TileVisual, getTileLabel } from './Tile';

export interface PaletteTileSpec {
  type: TileType;
  sign: TileSign;
  name: string;
  description: string;
}

export const PALETTE_TILES: PaletteTileSpec[] = [
  { type: 'x2', sign: 1, name: 'Ubin +x²', description: 'Persegi besar positif' },
  { type: 'x2', sign: -1, name: 'Ubin −x²', description: 'Persegi besar negatif' },
  { type: 'x', sign: 1, name: 'Ubin +x', description: 'Persegi panjang positif' },
  { type: 'x', sign: -1, name: 'Ubin −x', description: 'Persegi panjang negatif' },
  { type: '1', sign: 1, name: 'Unit +1', description: 'Konstanta positif' },
  { type: '1', sign: -1, name: 'Unit −1', description: 'Konstanta negatif' },
];

export interface ActivePaletteDrag {
  type: TileType;
  sign: TileSign;
  clientX: number;
  clientY: number;
  isTouch: boolean;
}

interface TilePaletteProps {
  selectedSpec: { type: TileType; sign: TileSign } | null;
  onSelectSpec: (spec: { type: TileType; sign: TileSign } | null) => void;
  onQuickAdd: (type: TileType, sign: TileSign) => void;
  onPaletteDragStart?: (drag: ActivePaletteDrag) => void;
  onPaletteDragMove?: (drag: ActivePaletteDrag) => void;
  onPaletteDragEnd?: (drag: ActivePaletteDrag | null) => void;
}

export const TilePalette: React.FC<TilePaletteProps> = ({
  selectedSpec,
  onSelectSpec,
  onQuickAdd,
  onPaletteDragStart,
  onPaletteDragMove,
  onPaletteDragEnd,
}) => {
  const dragSessionRef = React.useRef<{
    active: boolean;
    moved: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    type: TileType;
    sign: TileSign;
    isTouch: boolean;
  } | null>(null);

  const handleTilePointerDown = (
    e: React.PointerEvent,
    type: TileType,
    sign: TileSign
  ) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const isTouch = e.pointerType === 'touch';
    dragSessionRef.current = {
      active: true,
      moved: false,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      type,
      sign,
      isTouch,
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleCancel);
    };

    const handleMove = (moveEvt: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session || !session.active) return;
      if (session.pointerId !== null && moveEvt.pointerId !== session.pointerId) return;

      const dist = Math.hypot(moveEvt.clientX - session.startX, moveEvt.clientY - session.startY);
      if (!session.moved && dist <= 8) return;

      const payload: ActivePaletteDrag = {
        type: session.type,
        sign: session.sign,
        clientX: moveEvt.clientX,
        clientY: moveEvt.clientY,
        isTouch: session.isTouch,
      };

      if (!session.moved) {
        session.moved = true;
        onPaletteDragStart?.(payload);
      } else {
        onPaletteDragMove?.(payload);
      }
    };

    const handleUp = (upEvt: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session || !session.active) return;
      const wasMoved = session.moved;
      dragSessionRef.current = null;
      cleanup();

      if (wasMoved) {
        onPaletteDragEnd?.({
          type: session.type,
          sign: session.sign,
          clientX: upEvt.clientX,
          clientY: upEvt.clientY,
          isTouch: session.isTouch,
        });
      } else {
        const currentlySelected =
          selectedSpec?.type === session.type && selectedSpec?.sign === session.sign;
        onSelectSpec(
          currentlySelected ? null : { type: session.type, sign: session.sign }
        );
      }
    };

    const handleCancel = () => {
      const session = dragSessionRef.current;
      dragSessionRef.current = null;
      cleanup();
      if (session?.moved) {
        onPaletteDragEnd?.(null);
      }
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleCancel);
  };

  return (
    <aside
      aria-label="Panel Ubin Aljabar"
      className="rounded-2xl border border-[#E5E0F3] bg-white p-2.5 sm:p-3.5 shadow-xs"
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-xs sm:text-sm font-bold text-[#39286F]">Panel Ubin</h3>
        <p className="text-[11px] text-slate-600">
          Geser ke papan atau tekan +
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 lg:grid-cols-2 lg:gap-2.5">
        {PALETTE_TILES.map((item) => {
          const isSelected =
            selectedSpec?.type === item.type && selectedSpec?.sign === item.sign;
          const label = getTileLabel(item.type, item.sign);
          return (
            <div
              key={`${item.type}-${item.sign}`}
              className={`flex flex-col items-center justify-between rounded-xl border p-1.5 lg:p-2 transition-colors ${
                isSelected
                  ? 'border-[#5943A8] bg-[#F7F5FC]'
                  : 'border-[#E5E0F3] bg-[#FCFBFF] hover:border-[#C5B9E8]'
              }`}
            >
              <div className="flex min-h-[48px] lg:min-h-[64px] w-full items-center justify-center">
                <TileVisual
                  type={item.type}
                  sign={item.sign}
                  compact
                  touchActionNone
                  selected={isSelected}
                  onPointerDown={(e) => handleTilePointerDown(e, item.type, item.sign)}
                  onClick={(e) => {
                    if (e.detail === 0) {
                      onSelectSpec(isSelected ? null : { type: item.type, sign: item.sign });
                    }
                  }}
                  className="cursor-grab active:cursor-grabbing"
                  ariaLabel={`Pilih atau geser ${item.name} (${label})`}
                />
              </div>

              <div className="mt-1 flex w-full items-center justify-between gap-1">
                <span className="font-math text-[11px] font-bold text-slate-700 truncate">
                  {label}
                </span>
                <button
                  type="button"
                  onClick={() => onQuickAdd(item.type, item.sign)}
                  aria-label={`Tambah cepat ${item.name}`}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5943A8] text-white transition-colors hover:bg-[#39286F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39286F]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedSpec && (
        <div className="mt-2 rounded-xl border border-[#5943A8]/30 bg-[#F7F5FC] p-2 text-xs text-[#39286F]">
          Mode Ketuk aktif: <strong>{getTileLabel(selectedSpec.type, selectedSpec.sign)}</strong>.
          Ketuk area kosong di Workspace untuk menaruh ubin.
        </div>
      )}
    </aside>
  );
};
