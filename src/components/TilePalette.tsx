import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { TileSign, TileType } from '../types/algebra';
import { TileVisual, getTileLabel } from './Tile';

export interface PaletteTileSpec {
  type: TileType;
  sign: TileSign;
  family: 'x' | 'y';
  name: string;
  description: string;
}

export const PALETTE_TILES: PaletteTileSpec[] = [
  { type: 'x2', sign: 1, family: 'x', name: '+x² Tile', description: 'Positive 5×5 square' },
  { type: 'x2', sign: -1, family: 'x', name: '−x² Tile', description: 'Negative 5×5 square' },
  { type: 'x', sign: 1, family: 'x', name: '+x Tile', description: 'Positive 5×2 bar' },
  { type: 'x', sign: -1, family: 'x', name: '−x Tile', description: 'Negative 5×2 bar' },
  { type: '1', sign: 1, family: 'x', name: '+1 Unit Tile', description: 'Positive 2×2 unit' },
  { type: '1', sign: -1, family: 'x', name: '−1 Unit Tile', description: 'Negative 2×2 unit' },
  { type: 'y', sign: 1, family: 'y', name: '+y Tile', description: 'Positive 7×2 bar' },
  { type: 'y', sign: -1, family: 'y', name: '−y Tile', description: 'Negative 7×2 bar' },
  { type: 'xy', sign: 1, family: 'y', name: '+xy Tile', description: 'Positive 5×7 rectangle' },
  { type: 'xy', sign: -1, family: 'y', name: '−xy Tile', description: 'Negative 5×7 rectangle' },
  { type: 'y2', sign: 1, family: 'y', name: '+y² Tile', description: 'Positive 7×7 square' },
  { type: 'y2', sign: -1, family: 'y', name: '−y² Tile', description: 'Negative 7×7 square' },
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
  variant?: 'sidebar' | 'drawer';
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  defaultFamilyTab?: 'all' | 'x' | 'y';
}

export const TilePalette: React.FC<TilePaletteProps> = ({
  selectedSpec,
  onSelectSpec,
  onQuickAdd,
  onPaletteDragStart,
  onPaletteDragMove,
  onPaletteDragEnd,
  variant = 'sidebar',
  collapsed = false,
  onToggleCollapse,
  defaultFamilyTab,
}) => {
  const [familyTab, setFamilyTab] = React.useState<'all' | 'x' | 'y'>(
    defaultFamilyTab ?? (variant === 'drawer' ? 'x' : 'all')
  );

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

  if (variant === 'sidebar' && collapsed) {
    return (
      <aside
        aria-label="Algebra Tile Palette (Collapsed)"
        className="flex h-full flex-col items-center gap-2 rounded-2xl border border-[#E5E0F3] bg-white p-2 shadow-xs"
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Expand Tile Palette"
          title="Expand Tile Palette"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] text-[#39286F] hover:bg-[#EAE3F9]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="mt-2 [writing-mode:vertical-rl] rotate-180 text-[11px] font-bold tracking-wider text-[#5943A8]">
          TILE PALETTE
        </span>
      </aside>
    );
  }

  const xTiles = PALETTE_TILES.filter((t) => t.family === 'x');
  const yTiles = PALETTE_TILES.filter((t) => t.family === 'y');

  const renderTileGrid = (items: PaletteTileSpec[]) => (
    <div
      className={
        variant === 'drawer'
          ? 'grid grid-cols-3 gap-2 sm:grid-cols-6'
          : 'grid grid-cols-2 gap-2'
      }
    >
      {items.map((item) => {
        const isSelected =
          selectedSpec?.type === item.type && selectedSpec?.sign === item.sign;
        const label = getTileLabel(item.type, item.sign);
        return (
          <div
            key={`${item.type}-${item.sign}`}
            className={`flex flex-col items-center justify-between rounded-xl border p-1.5 transition-colors ${
              isSelected
                ? 'border-[#5943A8] bg-[#F7F5FC]'
                : 'border-[#E5E0F3] bg-[#FCFBFF] hover:border-[#C5B9E8]'
            }`}
          >
            <div
              className={`flex w-full items-center justify-center ${
                variant === 'drawer' ? 'min-h-[54px]' : 'min-h-[48px]'
              }`}
            >
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
                ariaLabel={`Select or drag ${item.name} (${label})`}
              />
            </div>

            <div className="mt-1 flex w-full items-center justify-between gap-1">
              <span className="truncate font-math text-[11px] font-bold text-slate-700">
                {label}
              </span>
              <button
                type="button"
                onClick={() => onQuickAdd(item.type, item.sign)}
                aria-label={`Quick add ${item.name}`}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5943A8] text-white transition-colors hover:bg-[#39286F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39286F]"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <aside
      aria-label="Algebra Tile Palette"
      className={
        variant === 'drawer'
          ? 'flex flex-col gap-3'
          : 'flex h-full flex-col rounded-2xl border border-[#E5E0F3] bg-white p-3 shadow-xs overflow-hidden'
      }
    >
      {variant === 'sidebar' && (
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F0ECF9]">
          <div>
            <h3 className="text-xs font-extrabold tracking-wide text-[#39286F] uppercase">
              Tile Palette
            </h3>
            <p className="text-[11px] text-slate-500">Drag onto canvas or tap +</p>
          </div>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse Tile Palette"
              title="Collapse Tile Palette"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E0F3] bg-[#F7F5FC] text-[#39286F] hover:bg-[#EAE3F9]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Family filter tabs */}
      <div
        role="tablist"
        aria-label="Tile family filter"
        className={`grid gap-1 rounded-xl border border-[#E5E0F3] bg-[#F7F5FC] p-1 ${
          variant === 'drawer' ? 'grid-cols-2' : 'mt-2 grid-cols-3'
        }`}
      >
        {(
          [
            ...(variant === 'sidebar' ? [{ id: 'all', label: 'All' }] : []),
            { id: 'x', label: 'X Family' },
            { id: 'y', label: 'Y Family' },
          ] as Array<{ id: 'all' | 'x' | 'y'; label: string }>
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={familyTab === tab.id}
            onClick={() => setFamilyTab(tab.id)}
            className={`rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors ${
              familyTab === tab.id
                ? 'bg-[#5943A8] text-white shadow-xs'
                : 'text-slate-700 hover:text-[#39286F]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Palette Body */}
      <div className="mt-2.5 flex-1 space-y-3.5 overflow-y-auto pr-0.5">
        {(familyTab === 'all' || familyTab === 'x') && (
          <section aria-label="X Family Tiles">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#077D66]">
                X Family
              </span>
              <span className="text-[10px] font-medium text-slate-500">x², x, 1</span>
            </div>
            {renderTileGrid(xTiles)}
          </section>
        )}

        {(familyTab === 'all' || familyTab === 'y') && (
          <section
            aria-label="Y Family Tiles"
            className="rounded-xl border border-[#6C4CF6]/20 bg-[#FAF8FF] p-2"
          >
            <div className="mb-1.5 flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B3CE0]">
                Y Family
              </span>
              <span className="rounded-md bg-[#EFEAFD] px-1.5 py-0.5 text-[10px] font-semibold text-[#4E31C9]">
                Explore y tiles
              </span>
            </div>
            <p className="mb-2 text-[10px] text-slate-600">
              Additional tile family (y, xy, y²) for multi-variable exploration.
            </p>
            {renderTileGrid(yTiles)}
          </section>
        )}
      </div>

      {selectedSpec && (
        <div className="mt-2 rounded-xl border border-[#5943A8]/30 bg-[#F7F5FC] p-2 text-xs text-[#39286F]">
          Tap Mode active: <strong>{getTileLabel(selectedSpec.type, selectedSpec.sign)}</strong>.
          Tap canvas to place tile.
        </div>
      )}
    </aside>
  );
};

