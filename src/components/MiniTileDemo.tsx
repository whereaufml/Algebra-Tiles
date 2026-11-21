import React, { useRef, useState } from 'react';
import { ArrowRight, Layers, Plus, RotateCcw, Wand2 } from 'lucide-react';
import { Tile, TileSign, TileType } from '../types/algebra';
import {
  canFormZeroPair,
  computeTileClusters,
  createTile,
  createTilesFromSpec,
  eliminateSpecificZeroPair,
  eliminateZeroPairs,
  findZeroPairs,
  formatExpression,
  formatSummaryToExpression,
  getTermLabel,
  groupTilesByTerm,
} from '../engine/MathEngine';
import { WorkspaceTileItem, getTileDimensions, getTileLabel } from './Tile';
import { findOverlappingTile } from './Workspace';

interface MiniTileDemoProps {
  initialTiles: Array<{ type: TileType; sign: TileSign; count: number }>;
  allowNegative?: boolean;
  caption: string;
  highlightNote?: string;
  onTryInWorkshop?: () => void;
}

export const MiniTileDemo: React.FC<MiniTileDemoProps> = ({
  initialTiles,
  allowNegative = false,
  caption,
  highlightNote,
  onTryInWorkshop,
}) => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const getDefaultCols = () =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 5;

  const [tiles, setTiles] = useState<Tile[]>(() =>
    createTilesFromSpec(initialTiles, 18, 26, getDefaultCols())
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  // Sync if user switches lesson
  const specSignature = JSON.stringify(initialTiles);
  React.useEffect(() => {
    setTiles(createTilesFromSpec(initialTiles, 18, 26, getDefaultCols()));
    setSelectedIds([]);
    setStatusNote(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specSignature]);

  const clusters = computeTileClusters(tiles);
  const zeroPairs = findZeroPairs(tiles);
  const zeroPairIds = new Set(zeroPairs.flatMap(([a, b]) => [a.id, b.id]));
  const expr = formatExpression(tiles, true);

  const handleAddTile = (type: TileType, sign: TileSign) => {
    const boardW = boardRef.current?.clientWidth || 300;
    const cols = Math.max(3, Math.floor((boardW - 24) / 84));
    const idx = tiles.length;
    const x = 16 + (idx % cols) * 82;
    const y = 26 + Math.floor(idx / cols) * 90;
    const added = createTile(type, sign, { x, y });
    setTiles((prev) => [...prev, added]);
    setStatusNote(`Ubin ${getTileLabel(type, sign)} ditambahkan. Coba geser atau kelompokkan!`);
  };

  const handleGroup = () => {
    const width = boardRef.current?.clientWidth || 300;
    const grouped = groupTilesByTerm(tiles, Math.max(240, width - 16));
    setTiles(grouped);
    setStatusNote(`Ubin dikelompokkan berdasarkan jenis sukunya: ${formatExpression(grouped, true)}.`);
  };

  const handleZeroPair = () => {
    const res = eliminateZeroPairs(tiles);
    if (res.removedCount === 0) {
      setStatusNote(res.explanation);
      return;
    }
    setTiles(res.remainingTiles);
    setStatusNote(res.explanation);
  };

  const handleReset = () => {
    setTiles(createTilesFromSpec(initialTiles, 18, 26, getDefaultCols()));
    setSelectedIds([]);
    setStatusNote('Susunan awal demonstrasi dikembalikan.');
  };

  const handleDragMove = (id: string, x: number, y: number) => {
    setTiles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, position: { x, y } } : t))
    );
  };

  const handleDragEnd = (id: string, x: number, y: number, wasMoved: boolean) => {
    if (!wasMoved) return;
    setTiles((prev) => {
      const moving = prev.find((t) => t.id === id);
      if (!moving) return prev;
      const hit = findOverlappingTile(prev, id, x, y, moving.type);
      if (hit) {
        if (canFormZeroPair(moving, hit)) {
          const res = eliminateSpecificZeroPair(prev, moving.id, hit.id);
          setStatusNote(res.explanation);
          return res.remainingTiles;
        }
        if (hit.type === moving.type && hit.sign === moving.sign) {
          const groupId = hit.groupId || `demo-grp-${hit.type}-${hit.sign}-${Date.now()}`;
          const members = prev.filter((t) => t.id !== moving.id && (t.groupId === groupId || t.id === hit.id));
          const { width, height } = getTileDimensions(hit.type);
          const boardW = boardRef.current?.clientWidth || 460;
          const maxRight = Math.max(...members.map((m) => m.position.x));
          let snapX = maxRight + width + 8;
          let snapY = hit.position.y;
          if (snapX + width > boardW - 12) {
            snapX = hit.position.x;
            snapY = hit.position.y + height + 8;
          }
          const count = members.length + 1;
          const groupExpr = formatSummaryToExpression({
            x2: hit.type === 'x2' ? hit.sign * count : 0,
            x: hit.type === 'x' ? hit.sign * count : 0,
            constant: hit.type === '1' ? hit.sign * count : 0,
          });
          setStatusNote(`${count} ubin sejenis dikelompokkan menjadi ${groupExpr}.`);
          return prev.map((t) => {
            if (t.id === hit.id) return { ...t, groupId };
            if (t.id === moving.id) return { ...t, groupId, position: { x: snapX, y: snapY } };
            return t;
          });
        }
        setStatusNote(
          `Suku berbeda (${getTermLabel(moving.type)} dan ${getTermLabel(hit.type)}) tidak dapat digabungkan.`
        );
      }
      return prev.map((t) => (t.id === id ? { ...t, position: { x, y }, groupId: null } : t));
    });
  };

  const quickButtons: Array<{ type: TileType; sign: TileSign }> = allowNegative
    ? [
        { type: 'x2', sign: 1 },
        { type: 'x', sign: 1 },
        { type: 'x', sign: -1 },
        { type: '1', sign: 1 },
        { type: '1', sign: -1 },
      ]
    : [
        { type: 'x2', sign: 1 },
        { type: 'x', sign: 1 },
        { type: '1', sign: 1 },
      ];

  return (
    <div className="rounded-2xl border border-[#E5E0F3] bg-[#F7F5FC] p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-[#39286F]">{caption}</span>
          <p className="text-[11px] text-slate-600">
            Coba geser ubin langsung di papan mini ini, tambah ubin baru, atau kelompokkan.
          </p>
        </div>
        <span
          data-testid="academy-demo-expression"
          className="rounded-xl bg-white px-3 py-1.5 font-math text-base font-bold text-[#5943A8] border border-[#E5E0F3] tabular-nums"
        >
          {expr}
        </span>
      </div>

      {/* Controls */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {quickButtons.map((btn) => (
            <button
              key={`${btn.type}-${btn.sign}`}
              type="button"
              onClick={() => handleAddTile(btn.type, btn.sign)}
              className="inline-flex items-center gap-1 rounded-xl border border-[#E5E0F3] bg-white px-2.5 py-1.5 font-math text-xs font-bold text-[#39286F] hover:border-[#5943A8]"
            >
              <Plus className="h-3.5 w-3.5 text-[#5943A8]" />
              {getTileLabel(btn.type, btn.sign)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleGroup}
            disabled={tiles.length === 0}
            className="inline-flex items-center gap-1 rounded-xl bg-[#EEF4FC] px-2.5 py-1.5 text-xs font-semibold text-[#1E5494] hover:bg-[#DDEAF9] disabled:opacity-45"
          >
            <Layers className="h-3.5 w-3.5" />
            Kelompokkan Sejenis
          </button>

          {zeroPairs.length > 0 && (
            <button
              type="button"
              onClick={handleZeroPair}
              className="inline-flex items-center gap-1 rounded-xl bg-[#EF8748] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#D96A27]"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Pasangkan Zero Pair ({zeroPairs.length})
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-xl border border-[#E5E0F3] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Interactive Mini Board */}
      <div
        ref={boardRef}
        data-testid="academy-mini-board"
        onClick={() => setSelectedIds([])}
        style={{
          backgroundImage: 'radial-gradient(#D8D1EE 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
        className="relative min-h-[228px] w-full overflow-hidden rounded-xl border border-[#D6CEF0] bg-white"
      >
        {clusters.map((cluster) => (
          <div
            key={cluster.id}
            style={{ left: `${cluster.x}px`, top: `${cluster.y}px` }}
            className="pointer-events-none absolute z-20 rounded-md bg-[#39286F] px-1.5 py-0.5 font-math text-[11px] font-bold text-white shadow-xs"
          >
            {cluster.label}
          </div>
        ))}

        {tiles.length === 0 ? (
          <div className="flex h-[210px] items-center justify-center text-xs text-slate-400">
            Papan kosong (0). Tambah ubin atau tekan Reset.
          </div>
        ) : (
          tiles.map((tile) => (
            <WorkspaceTileItem
              key={tile.id}
              tile={tile}
              selected={selectedIds.includes(tile.id)}
              zeroPairHighlight={zeroPairIds.has(tile.id)}
              onSelect={(id) =>
                setSelectedIds((prev) =>
                  prev.includes(id) ? prev.filter((item) => item !== id) : [id]
                )
              }
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              containerRef={boardRef}
              snapToGrid
            />
          ))
        )}
      </div>

      {statusNote && (
        <p className="mt-2.5 text-xs font-medium text-[#39286F]">{statusNote}</p>
      )}
      {highlightNote && (
        <p className="mt-1.5 text-xs text-slate-600">{highlightNote}</p>
      )}

      {onTryInWorkshop && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onTryInWorkshop}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#27A89A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1E8E82]"
          >
            Coba di Algebra Workshop
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
