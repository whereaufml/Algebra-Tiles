import React, { useMemo, useRef, useState } from 'react';
import {
  CheckSquare,
  Grid,
  Layers,
  Move,
  Plus,
  Redo2,
  RotateCcw,
  Scissors,
  Sparkles,
  Trash2,
  Undo2,
  Unlink,
  Wand2,
  X,
} from 'lucide-react';
import { Tile, TileSign, TileType } from '../types/algebra';
import {
  canCombineLikeTerms,
  eliminateZeroPairs,
  findZeroPairs,
  formatExpression,
  formatRawExpression,
  getTermLabel,
  groupTilesByTerm,
} from '../engine/MathEngine';
import {
  addLikeTileToGroup,
  computeTileGroups,
  computeZeroPairStacks,
  detectDropTarget,
  eliminateZeroPairStack,
  getTileSize,
  moveGroupByDelta,
  moveZeroPairByDelta,
  relocateGroupToPoint,
  separateZeroPair,
  snapTilesIntoGroup,
  stackZeroPair,
  ungroupTiles,
} from '../engine/SnapStackEngine';
import { WorkspaceTileItem, getTileDimensions, getTileLabel } from './Tile';
import { ActivePaletteDrag } from './TilePalette';

export function findOverlappingTile(
  tiles: Tile[],
  movingId: string | null,
  x: number,
  y: number,
  type: TileType
): Tile | null {
  const { width: w1, height: h1 } = getTileDimensions(type);
  const cx1 = x + w1 / 2;
  const cy1 = y + h1 / 2;

  let best: Tile | null = null;
  let bestDist = Infinity;

  for (const other of tiles) {
    if (other.id === movingId) continue;
    const { width: w2, height: h2 } = getTileDimensions(other.type);
    const pad = 10;
    const overlapX = x < other.position.x + w2 + pad && x + w1 + pad > other.position.x;
    const overlapY = y < other.position.y + h2 + pad && y + h1 + pad > other.position.y;

    if (overlapX && overlapY) {
      const cx2 = other.position.x + w2 / 2;
      const cy2 = other.position.y + h2 / 2;
      const d = Math.hypot(cx1 - cx2, cy1 - cy2);
      if (d < bestDist) {
        bestDist = d;
        best = other;
      }
    }
  }

  return best;
}

interface WorkspaceProps {
  tiles: Tile[];
  boardRef?: React.RefObject<HTMLDivElement | null>;
  activePaletteDrag?: ActivePaletteDrag | null;
  onChangeTiles: (nextTiles: Tile[], recordHistory?: boolean) => void;
  onCommitPreDragState?: (preDragTiles: Tile[], finalTiles: Tile[]) => void;
  selectedPaletteTile: { type: TileType; sign: TileSign } | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZeroPairsCleared?: (count: number) => void;
  onLikeTermsCombined?: () => void;
  onMisconceptionGuided?: () => void;
  onFeedback?: (feedback: { tone: 'success' | 'info' | 'warning'; text: string }) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  tiles,
  boardRef: externalBoardRef,
  activePaletteDrag = null,
  onChangeTiles,
  onCommitPreDragState,
  selectedPaletteTile,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZeroPairsCleared,
  onLikeTermsCombined,
  onMisconceptionGuided,
  onFeedback,
}) => {
  const internalBoardRef = useRef<HTMLDivElement | null>(null);
  const boardRef = externalBoardRef || internalBoardRef;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [movingGroupId, setMovingGroupId] = useState<string | null>(null);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [hoverTarget, setHoverTarget] = useState<{
    targetId: string;
    kind: 'zeropair' | 'group' | 'mismatch';
  } | null>(null);

  const preDragTilesRef = useRef<Tile[] | null>(null);
  const groupHandleDragRef = useRef<{
    active: boolean;
    moved: boolean;
    groupId: string;
    pointerId: number | null;
    startX: number;
    startY: number;
    lastDx: number;
    lastDy: number;
  } | null>(null);

  const getBoardSize = () => ({
    width: boardRef.current?.clientWidth || 540,
    height: boardRef.current?.clientHeight || 320,
  });

  const groups = useMemo(() => computeTileGroups(tiles), [tiles]);
  const zeroPairStacks = useMemo(() => computeZeroPairStacks(tiles), [tiles]);
  const zeroPairs = findZeroPairs(tiles);
  const zeroPairTileIds = new Set<string>(zeroPairs.flatMap(([a, b]) => [a.id, b.id]));
  const stackRoleByTileId = useMemo(() => {
    const map = new Map<string, 'back' | 'front'>();
    for (const s of zeroPairStacks) {
      map.set(s.positiveTile.id, 'back');
      map.set(s.negativeTile.id, 'front');
    }
    return map;
  }, [zeroPairStacks]);

  const activeGroup = groups.find((g) => g.groupId === activeGroupId) || null;
  const rawExpr = formatRawExpression(tiles);
  const simplifiedExpr = formatExpression(tiles, true);

  // Palette drag hover preview using Snap & Stack proximity rules
  const paletteHover = useMemo(() => {
    if (!activePaletteDrag || !boardRef.current) {
      return { overBoard: false, target: null as typeof hoverTarget };
    }
    const rect = boardRef.current.getBoundingClientRect();
    const liftY = activePaletteDrag.isTouch ? 28 : 0;
    const pointerX = activePaletteDrag.clientX;
    const pointerY = activePaletteDrag.clientY - liftY;
    const overBoard =
      pointerX >= rect.left &&
      pointerX <= rect.right &&
      pointerY >= rect.top &&
      pointerY <= rect.bottom;

    if (!overBoard) return { overBoard: false, target: null };

    const { width, height } = getTileDimensions(activePaletteDrag.type);
    const localX = pointerX - rect.left - width / 2;
    const localY = pointerY - rect.top - height / 2;
    const hit = detectDropTarget(
      tiles,
      [],
      activePaletteDrag.type,
      activePaletteDrag.sign,
      { x: localX, y: localY, width, height },
      true
    );
    if (!hit) return { overBoard: true, target: null };
    return {
      overBoard: true,
      target: { targetId: hit.targetTile.id, kind: hit.kind } as const,
    };
  }, [activePaletteDrag, boardRef, tiles]);

  const effectiveHover = hoverTarget || paletteHover.target;

  const commitChange = (baseTiles: Tile[] | null, nextTiles: Tile[]) => {
    if (baseTiles && onCommitPreDragState) {
      onCommitPreDragState(baseTiles, nextTiles);
    } else {
      onChangeTiles(nextTiles, true);
    }
  };

  const handleBoardClick = (e: React.MouseEvent) => {
    if (movingGroupId && boardRef.current) {
      const targetGroup = groups.find((g) => g.groupId === movingGroupId);
      if (targetGroup) {
        const rect = boardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { width, height } = getBoardSize();
        const nextTiles = relocateGroupToPoint(tiles, movingGroupId, x, y, width, height);
        onChangeTiles(nextTiles, true);
        setMovingGroupId(null);
        onFeedback?.({
          tone: 'info',
          text: `Kelompok ${targetGroup.label} (${targetGroup.count} ubin) dipindahkan.`,
        });
        return;
      }
      setMovingGroupId(null);
    }

    if (!selectedPaletteTile || !boardRef.current) {
      setSelectedIds([]);
      setActiveGroupId(null);
      setConfirmDeleteGroupId(null);
      return;
    }

    const rect = boardRef.current.getBoundingClientRect();
    const { width, height } = getTileDimensions(selectedPaletteTile.type);
    let x = e.clientX - rect.left - width / 2;
    let y = e.clientY - rect.top - height / 2;
    x = Math.max(8, Math.min(Math.max(8, rect.width - width - 8), x));
    y = Math.max(32, Math.min(Math.max(32, rect.height - height - 8), y));
    if (snapToGrid) {
      x = Math.round(x / 12) * 12;
      y = Math.round(y / 12) * 12;
    }
    const nextTile: Tile = {
      id: `tile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: selectedPaletteTile.type,
      sign: selectedPaletteTile.sign,
      position: { x, y },
      groupId: null,
      zeroPairId: null,
    };
    onChangeTiles([...tiles, nextTile], true);
  };

  const handleSelectTile = (id: string, multi: boolean) => {
    const tapped = tiles.find((t) => t.id === id);
    if (!tapped) return;

    const useMulti = multi || multiSelectMode;
    if (useMulti) {
      setActiveGroupId(null);
      setMovingGroupId(null);
      setConfirmDeleteGroupId(null);
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
      return;
    }

    // If tapped tile belongs to a group (>= 2 members), open its Group Menu
    if (tapped.groupId) {
      const grp = groups.find((g) => g.groupId === tapped.groupId);
      if (grp) {
        setSelectedIds([]);
        setConfirmDeleteGroupId(null);
        setMovingGroupId(null);
        setActiveGroupId(grp.groupId);
        return;
      }
    }

    setActiveGroupId(null);
    setConfirmDeleteGroupId(null);
    setSelectedIds((prev) => (prev.includes(id) && prev.length === 1 ? [] : [id]));
  };

  // Shared drag handler for individual tile, group, or stacked zero pair
  const handleDragStart = () => {
    if (!preDragTilesRef.current) {
      preDragTilesRef.current = tiles;
    }
    setMovingGroupId(null);
    setConfirmDeleteGroupId(null);
  };

  const applyLiveDelta = (baseTiles: Tile[], movingId: string, dx: number, dy: number) => {
    const movingTile = baseTiles.find((t) => t.id === movingId);
    if (!movingTile) return { nextTiles: baseTiles, movingIds: [] as string[], box: null };

    const { width: boardW, height: boardH } = getBoardSize();

    // 1. Stacked Zero Pair moves together
    if (movingTile.zeroPairId) {
      const nextTiles = moveZeroPairByDelta(
        baseTiles,
        movingTile.zeroPairId,
        dx,
        dy,
        boardW,
        boardH
      );
      return { nextTiles, movingIds: [movingId], box: null };
    }

    // 2. Group (>=2) moves together preserving relative positions
    const groupMembers = movingTile.groupId
      ? baseTiles.filter((t) => t.groupId === movingTile.groupId)
      : [];
    if (movingTile.groupId && groupMembers.length >= 2) {
      const nextTiles = moveGroupByDelta(baseTiles, movingTile.groupId, dx, dy, boardW, boardH);
      const movedMembers = nextTiles.filter((t) => t.groupId === movingTile.groupId);
      const minX = Math.min(...movedMembers.map((m) => m.position.x));
      const minY = Math.min(...movedMembers.map((m) => m.position.y));
      const maxX = Math.max(
        ...movedMembers.map((m) => m.position.x + getTileSize(m.type).width)
      );
      const maxY = Math.max(
        ...movedMembers.map((m) => m.position.y + getTileSize(m.type).height)
      );
      return {
        nextTiles,
        movingIds: movedMembers.map((m) => m.id),
        box: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      };
    }

    // 3. Single free tile
    const { width: w, height: h } = getTileSize(movingTile.type);
    let nextX = Math.max(8, Math.min(Math.max(8, boardW - w - 8), movingTile.position.x + dx));
    let nextY = Math.max(20, Math.min(Math.max(20, boardH - h - 8), movingTile.position.y + dy));
    if (snapToGrid) {
      nextX = Math.round(nextX / 12) * 12;
      nextY = Math.round(nextY / 12) * 12;
    }
    const nextTiles = baseTiles.map((t) =>
      t.id === movingId ? { ...t, position: { x: nextX, y: nextY } } : t
    );
    return {
      nextTiles,
      movingIds: [movingId],
      box: { x: nextX, y: nextY, width: w, height: h },
    };
  };

  const handleDragDelta = (id: string, dx: number, dy: number) => {
    const baseTiles = preDragTilesRef.current || tiles;
    const movingTile = baseTiles.find((t) => t.id === id);
    if (!movingTile) return;

    const { nextTiles, movingIds, box } = applyLiveDelta(baseTiles, id, dx, dy);
    if (box) {
      const hit = detectDropTarget(
        baseTiles,
        movingIds,
        movingTile.type,
        movingTile.sign,
        box,
        movingIds.length === 1
      );
      setHoverTarget(hit ? { targetId: hit.targetTile.id, kind: hit.kind } : null);
    } else {
      setHoverTarget(null);
    }

    onChangeTiles(nextTiles, false);
  };

  const handleDragDeltaEnd = (id: string, dx: number, dy: number, wasMoved: boolean) => {
    setHoverTarget(null);
    const snapshotBefore = preDragTilesRef.current;
    preDragTilesRef.current = null;
    if (!wasMoved) return;

    const baseTiles = snapshotBefore || tiles;
    const movingTile = baseTiles.find((t) => t.id === id);
    if (!movingTile) return;

    const { width: boardW, height: boardH } = getBoardSize();
    const { nextTiles: movedTiles, movingIds, box } = applyLiveDelta(baseTiles, id, dx, dy);

    if (box) {
      const hit = detectDropTarget(
        baseTiles,
        movingIds,
        movingTile.type,
        movingTile.sign,
        box,
        movingIds.length === 1
      );

      if (hit) {
        if (hit.kind === 'zeropair' && movingIds.length === 1) {
          const stacked = stackZeroPair(movedTiles, movingTile.id, hit.targetTile.id, boardW, boardH);
          if (stacked.valid) {
            setSelectedIds([]);
            setActiveGroupId(null);
            commitChange(snapshotBefore, stacked.tiles);
            onFeedback?.({ tone: 'info', text: stacked.explanation });
            return;
          }
        }

        if (hit.kind === 'group') {
          const snapped = snapTilesIntoGroup(
            movedTiles,
            movingIds,
            hit.targetTile.id,
            boardW,
            boardH
          );
          if (snapped.count > 0) {
            setSelectedIds([]);
            setActiveGroupId(snapped.groupId);
            commitChange(snapshotBefore, snapped.tiles);
            onLikeTermsCombined?.();
            onFeedback?.({
              tone: 'success',
              text: `${snapped.count} ubin sejenis menempel membentuk kelompok ${snapped.label}.`,
            });
            return;
          }
        }

        if (hit.kind === 'mismatch') {
          const targetSize = getTileSize(hit.targetTile.type);
          const safeX =
            hit.targetTile.position.x + targetSize.width + 18 + box.width < boardW
              ? hit.targetTile.position.x + targetSize.width + 18
              : Math.max(8, hit.targetTile.position.x - box.width - 18);
          const sepTiles =
            movingIds.length > 1 && movingTile.groupId
              ? relocateGroupToPoint(
                  baseTiles,
                  movingTile.groupId,
                  safeX + box.width / 2,
                  box.y + box.height / 2,
                  boardW,
                  boardH
                )
              : baseTiles.map((t) =>
                  t.id === movingTile.id
                    ? { ...t, groupId: null, position: { x: safeX, y: box.y } }
                    : t
                );

          commitChange(snapshotBefore, sepTiles);
          onMisconceptionGuided?.();
          onFeedback?.({
            tone: 'warning',
            text: `Suku berbeda tidak dapat dikelompokkan! ${getTermLabel(
              movingTile.type
            )} dan ${getTermLabel(hit.targetTile.type)} memiliki jenis suku berbeda.`,
          });
          return;
        }
      }
    }

    commitChange(snapshotBefore, movedTiles);
    if (movingIds.length >= 2 && movingTile.groupId) {
      const grp = groups.find((g) => g.groupId === movingTile.groupId);
      if (grp) {
        onFeedback?.({
          tone: 'info',
          text: `Kelompok ${grp.label} (${grp.count} ubin) dipindahkan bersama.`,
        });
      }
    }
  };

  // Dragging or tapping the group header badge itself
  const handleGroupBadgePointerDown = (e: React.PointerEvent, groupId: string, anchorTileId: string) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.stopPropagation();

    const touch = e.pointerType === 'touch';
    groupHandleDragRef.current = {
      active: true,
      moved: false,
      groupId,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastDx: 0,
      lastDy: 0,
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };

    const onMove = (moveEvt: PointerEvent) => {
      const s = groupHandleDragRef.current;
      if (!s || !s.active) return;
      if (s.pointerId !== null && moveEvt.pointerId !== s.pointerId) return;

      const dist = Math.hypot(moveEvt.clientX - s.startX, moveEvt.clientY - s.startY);
      if (!s.moved && dist <= 6) return;

      if (!s.moved) {
        s.moved = true;
        handleDragStart();
      }

      const liftY = touch ? 12 : 0;
      const dx = moveEvt.clientX - s.startX;
      const dy = moveEvt.clientY - s.startY - liftY;
      s.lastDx = dx;
      s.lastDy = dy;
      handleDragDelta(anchorTileId, dx, dy);
    };

    const onUp = () => {
      const s = groupHandleDragRef.current;
      groupHandleDragRef.current = null;
      cleanup();
      if (!s) return;

      if (s.moved) {
        handleDragDeltaEnd(anchorTileId, s.lastDx, s.lastDy, true);
      } else {
        setSelectedIds([]);
        setConfirmDeleteGroupId(null);
        setMovingGroupId(null);
        setActiveGroupId(groupId);
      }
    };

    const onCancel = () => {
      const s = groupHandleDragRef.current;
      groupHandleDragRef.current = null;
      cleanup();
      if (s?.moved) {
        handleDragDeltaEnd(anchorTileId, 0, 0, false);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  };

  // Group Menu Actions
  const handleUngroup = (groupId: string) => {
    const grp = groups.find((g) => g.groupId === groupId);
    const { width, height } = getBoardSize();
    const res = ungroupTiles(tiles, groupId, width, height);
    setActiveGroupId(null);
    setMovingGroupId(null);
    setConfirmDeleteGroupId(null);
    onChangeTiles(res.tiles, true);
    onFeedback?.({
      tone: 'info',
      text: grp
        ? `Kelompok ${grp.label} dipecah kembali menjadi ${res.count} ubin ${getTileLabel(
            grp.type,
            grp.sign
          )} terpisah.`
        : 'Kelompok dipecah menjadi ubin individual.',
    });
  };

  const handleAddLikeTileToGroup = (groupId: string) => {
    const { width, height } = getBoardSize();
    const res = addLikeTileToGroup(tiles, groupId, width, height);
    onChangeTiles(res.tiles, true);
    onLikeTermsCombined?.();
    onFeedback?.({
      tone: 'success',
      text: `1 ubin sejenis ditambahkan. Kelompok sekarang berisi ${res.count} ubin (${res.label}).`,
    });
  };

  const handleConfirmDeleteGroup = (groupId: string) => {
    const grp = groups.find((g) => g.groupId === groupId);
    const remaining = tiles.filter((t) => t.groupId !== groupId);
    setActiveGroupId(null);
    setMovingGroupId(null);
    setConfirmDeleteGroupId(null);
    onChangeTiles(remaining, true);
    onFeedback?.({
      tone: 'info',
      text: grp
        ? `Kelompok ${grp.label} (${grp.count} ubin) dihapus dari workspace.`
        : 'Kelompok dihapus.',
    });
  };

  // Zero Pair Stack Actions
  const handleEliminateStack = (zeroPairId: string) => {
    const res = eliminateZeroPairStack(tiles, zeroPairId);
    if (res.removedCount > 0) {
      onChangeTiles(res.tiles, true);
      onZeroPairsCleared?.(1);
      onFeedback?.({ tone: 'success', text: res.explanation });
    }
  };

  const handleSeparateStack = (zeroPairId: string) => {
    const { width, height } = getBoardSize();
    const res = separateZeroPair(tiles, zeroPairId, width, height);
    onChangeTiles(res.tiles, true);
    onFeedback?.({ tone: 'info', text: res.explanation });
  };

  // Toolbar Actions
  const handleGroupLikeTerms = () => {
    if (selectedIds.length >= 2) {
      const chosen = tiles.filter((t) => selectedIds.includes(t.id));
      const validation = canCombineLikeTerms(chosen);
      if (!validation.valid) {
        onMisconceptionGuided?.();
        onFeedback?.({ tone: 'warning', text: validation.reason });
        return;
      }
      const sameSign = chosen.every((t) => t.sign === chosen[0].sign);
      if (!sameSign) {
        if (chosen.length === 2) {
          const { width, height } = getBoardSize();
          const stacked = stackZeroPair(tiles, chosen[0].id, chosen[1].id, width, height);
          if (stacked.valid) {
            setSelectedIds([]);
            onChangeTiles(stacked.tiles, true);
            onFeedback?.({ tone: 'info', text: stacked.explanation });
            return;
          }
        }
        onFeedback?.({
          tone: 'info',
          text: 'Ubin terpilih memiliki tanda berlawanan (+ dan −). Gunakan tombol "Pasangkan Nol" untuk menyederhanakan zero pair.',
        });
        return;
      }

      const { width, height } = getBoardSize();
      let next = tiles;
      const anchor = chosen[0];
      const others = chosen.slice(1).map((c) => c.id);
      const snapped = snapTilesIntoGroup(next, others, anchor.id, width, height);
      next = snapped.tiles;
      setSelectedIds([]);
      setActiveGroupId(snapped.groupId);
      onChangeTiles(next, true);
      onLikeTermsCombined?.();
      onFeedback?.({
        tone: 'success',
        text: `${chosen.length} ubin dikelompokkan menjadi ${snapped.label}.`,
      });
      return;
    }

    const { width } = getBoardSize();
    const grouped = groupTilesByTerm(tiles, Math.max(240, width - 16));
    setActiveGroupId(null);
    onChangeTiles(grouped, true);
    onLikeTermsCombined?.();
    onFeedback?.({
      tone: 'success',
      text:
        tiles.length === 0
          ? 'Workspace masih kosong.'
          : `Ubin dikelompokkan berdasarkan jenis sukunya (${simplifiedExpr}). Suku berbeda jenis tetap terpisah.`,
    });
  };

  const handleCombineSelectedOrAll = () => {
    const targetTiles =
      selectedIds.length > 0 ? tiles.filter((t) => selectedIds.includes(t.id)) : tiles;
    const result = canCombineLikeTerms(targetTiles);
    if (!result.valid) {
      onMisconceptionGuided?.();
      onFeedback?.({ tone: 'warning', text: result.reason });
      return;
    }
    const { width } = getBoardSize();
    const grouped = groupTilesByTerm(tiles, Math.max(240, width - 16));
    setSelectedIds([]);
    onChangeTiles(grouped, true);
    onLikeTermsCombined?.();
    onFeedback?.({ tone: 'success', text: result.reason });
  };

  const handleZeroPairs = () => {
    // Eliminate stacked zero pairs first + any unstacked zero pairs
    const res = eliminateZeroPairs(tiles);
    if (res.removedCount === 0) {
      onFeedback?.({ tone: 'warning', text: res.explanation });
      return;
    }
    setSelectedIds([]);
    setActiveGroupId(null);
    onChangeTiles(res.remainingTiles, true);
    onZeroPairsCleared?.(res.removedCount);
    onFeedback?.({ tone: 'success', text: res.explanation });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    onChangeTiles(
      tiles.filter((t) => !selectedIds.includes(t.id)),
      true
    );
    setSelectedIds([]);
    onFeedback?.({
      tone: 'info',
      text: `${selectedIds.length} ubin terpilih dihapus dari papan.`,
    });
  };

  const handleResetConfirm = () => {
    setSelectedIds([]);
    setActiveGroupId(null);
    setMovingGroupId(null);
    setConfirmDeleteGroupId(null);
    onChangeTiles([], true);
    setConfirmResetOpen(false);
    onFeedback?.({ tone: 'info', text: 'Workspace telah dikosongkan.' });
  };

  const boardSize = getBoardSize();

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar (order-4 on mobile so Panel Ubin -> Board -> Context/Symbolic fit cleanly; order-1 on desktop) */}
      <div className="order-4 lg:order-1 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E5E0F3] bg-white px-3.5 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGroupLikeTerms}
            disabled={tiles.length === 0}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#EEF4FC] px-3 py-2 text-xs font-semibold text-[#1E5494] transition-colors hover:bg-[#DDEAF9] disabled:opacity-45 whitespace-nowrap"
          >
            <Layers className="h-3.5 w-3.5" />
            Kelompokkan{selectedIds.length >= 2 ? ` (${selectedIds.length})` : ' Suku Sejenis'}
          </button>

          <button
            type="button"
            onClick={handleCombineSelectedOrAll}
            disabled={tiles.length === 0}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#EAF7F5] px-3 py-2 text-xs font-semibold text-[#156B62] transition-colors hover:bg-[#D5EFEA] disabled:opacity-45 whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Gabungkan Suku{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
          </button>

          <button
            type="button"
            onClick={handleZeroPairs}
            disabled={tiles.length < 2}
            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-45 whitespace-nowrap ${
              zeroPairs.length > 0
                ? 'bg-[#EF8748] text-white hover:bg-[#D96A27]'
                : 'bg-[#FFF3EB] text-[#A84E17] hover:bg-[#FFE4D1]'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            Pasangkan Nol{zeroPairs.length > 0 ? ` (${zeroPairs.length})` : ''}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMultiSelectMode((v) => !v)}
            aria-pressed={multiSelectMode}
            className={`inline-flex min-h-[38px] items-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              multiSelectMode
                ? 'border-[#5943A8] bg-[#5943A8] text-white'
                : 'border-[#E5E0F3] bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Pilih Banyak
          </button>

          <button
            type="button"
            onClick={() => setSnapToGrid((v) => !v)}
            aria-pressed={snapToGrid}
            className={`inline-flex min-h-[38px] items-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              snapToGrid
                ? 'border-[#5943A8] bg-[#F7F5FC] text-[#39286F]'
                : 'border-[#E5E0F3] bg-white text-slate-600'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            Grid
          </button>

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[#E5E0F3] bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[#E5E0F3] bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
          >
            <Redo2 className="h-3.5 w-3.5" />
            Redo
          </button>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[#C94438]/30 bg-[#FFF2F0] px-2.5 py-2 text-xs font-semibold text-[#9B2F25] hover:bg-[#FFE3DF] whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus ({selectedIds.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (tiles.length === 0) return;
              setConfirmResetOpen(true);
            }}
            disabled={tiles.length === 0}
            className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[#E5E0F3] bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Reset confirmation */}
      {confirmResetOpen && (
        <div
          role="alertdialog"
          aria-label="Konfirmasi reset workspace"
          className="order-4 lg:order-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EF8748] bg-[#FFF8F3] px-4 py-3 text-sm text-[#39286F]"
        >
          <span>Kosongkan semua ubin di workspace saat ini?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmResetOpen(false)}
              className="rounded-lg border border-[#E5E0F3] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleResetConfirm}
              className="rounded-lg bg-[#C94438] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#9B2F25]"
            >
              Ya, Reset Papan
            </button>
          </div>
        </div>
      )}

      {/* Main Manipulation Stage */}
      <div
        ref={boardRef}
        data-testid="algebra-workspace-board"
        onClick={handleBoardClick}
        style={{
          backgroundImage: snapToGrid
            ? 'radial-gradient(#D8D1EE 1px, transparent 1px)'
            : 'none',
          backgroundSize: '16px 16px',
          touchAction: activePaletteDrag || movingGroupId ? 'none' : 'pan-y',
        }}
        className={`order-1 lg:order-2 relative min-h-[268px] sm:min-h-[340px] w-full overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
          paletteHover.overBoard
            ? 'border-[#27A89A] bg-[#F5FCFA]'
            : movingGroupId
            ? 'border-[#5943A8] bg-[#FAF8FF]'
            : 'border-[#D6CEF0] bg-white hover:border-[#B6A7E3]'
        }`}
      >
        {tiles.length === 0 && (
          <div className="pointer-events-none flex h-[268px] sm:h-[340px] flex-col items-center justify-center px-6 text-center">
            <p className="text-sm font-semibold text-[#39286F]">
              Papan Manipulasi Algebra Tiles
            </p>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              Seret ubin dari Panel Ubin ke sini. Dekatkan ubin sejenis untuk menempel (Snap), atau tumpuk + dan − untuk Zero Pair (Stack).
            </p>
          </div>
        )}

        {/* Moving-group prompt banner */}
        {movingGroupId && (
          <div className="pointer-events-none absolute inset-x-3 top-2 z-30 flex justify-center">
            <span className="rounded-full bg-[#39286F] px-3 py-1 text-[11px] font-semibold text-white shadow-xs">
              Ketuk posisi tujuan di papan atau geser kelompok langsung
            </span>
          </div>
        )}

        {/* Group containers + interactive count/value badges */}
        {groups.map((grp) => {
          const isSelected = grp.groupId === activeGroupId;
          const anchorId = grp.memberIds[0];
          return (
            <React.Fragment key={grp.groupId}>
              <div
                data-group-frame={grp.groupId}
                style={{
                  left: `${grp.x - 5}px`,
                  top: `${grp.y - 5}px`,
                  width: `${grp.width + 10}px`,
                  height: `${grp.height + 10}px`,
                }}
                className={`pointer-events-none absolute z-[5] rounded-xl border-2 border-dashed transition-colors ${
                  isSelected
                    ? 'border-[#5943A8] bg-[#5943A8]/6'
                    : 'border-[#5943A8]/40 bg-[#F7F5FC]/45'
                }`}
              />
              <button
                type="button"
                data-group-badge={grp.groupId}
                onPointerDown={(e) => handleGroupBadgePointerDown(e, grp.groupId, anchorId)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.detail === 0) {
                    setActiveGroupId((prev) => (prev === grp.groupId ? null : grp.groupId));
                  }
                }}
                style={{
                  left: `${Math.max(8, grp.x - 2)}px`,
                  top: `${Math.max(4, grp.y - 28)}px`,
                  touchAction: 'none',
                }}
                className={`absolute z-20 inline-flex cursor-grab active:cursor-grabbing items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold shadow-xs transition-colors ${
                  isSelected
                    ? 'bg-[#39286F] text-white ring-2 ring-[#5943A8]/40'
                    : 'bg-[#5943A8] text-white hover:bg-[#39286F]'
                }`}
                aria-label={`Kelompok ${grp.label} (${grp.count} ubin). Ketuk untuk menu atau geser untuk memindahkan`}
              >
                <span className="font-math">{grp.label}</span>
                <span className="opacity-85">· {grp.count} ubin</span>
              </button>
            </React.Fragment>
          );
        })}

        {/* Zero Pair Stack frames & inline actions (Pasangkan Nol / Pisahkan) */}
        {zeroPairStacks.map((stack) => {
          const pillLeft = Math.max(8, Math.min(Math.max(8, boardSize.width - 210), stack.x - 4));
          const pillTop = Math.min(
            Math.max(34, boardSize.height - 42),
            stack.y + stack.height + 6
          );
          return (
            <React.Fragment key={stack.zeroPairId}>
              <div
                data-zero-pair-stack={stack.zeroPairId}
                style={{
                  left: `${stack.x - 5}px`,
                  top: `${stack.y - 5}px`,
                  width: `${stack.width + 10}px`,
                  height: `${stack.height + 10}px`,
                }}
                className="pointer-events-none absolute z-[8] rounded-xl border-2 border-dashed border-[#EF8748] bg-[#FFF8F2]/60"
              />
              <div
                style={{
                  left: `${Math.max(8, stack.x - 2)}px`,
                  top: `${Math.max(4, stack.y - 26)}px`,
                }}
                className="pointer-events-none absolute z-20 rounded-md bg-[#EF8748] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs"
              >
                Zero Pair (= 0)
              </div>
              <div
                data-zero-pair-actions={stack.zeroPairId}
                onClick={(e) => e.stopPropagation()}
                style={{ left: `${pillLeft}px`, top: `${pillTop}px` }}
                className="absolute z-30 flex items-center gap-1.5 rounded-xl border border-[#EF8748]/50 bg-white/95 p-1 shadow-md backdrop-blur-xs"
              >
                <button
                  type="button"
                  onClick={() => handleEliminateStack(stack.zeroPairId)}
                  className="inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-[#EF8748] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#D96A27]"
                >
                  <Wand2 className="h-3 w-3" />
                  Pasangkan Nol
                </button>
                <button
                  type="button"
                  onClick={() => handleSeparateStack(stack.zeroPairId)}
                  className="inline-flex min-h-[30px] items-center gap-1 rounded-lg border border-[#E5E0F3] bg-[#F7F5FC] px-2.5 py-1 text-[11px] font-semibold text-[#39286F] hover:bg-[#EAE3F9]"
                >
                  <Scissors className="h-3 w-3" />
                  Pisahkan
                </button>
              </div>
            </React.Fragment>
          );
        })}

        {/* Individual Tile Objects */}
        {tiles.map((tile) => (
          <WorkspaceTileItem
            key={tile.id}
            tile={tile}
            selected={selectedIds.includes(tile.id)}
            zeroPairHighlight={zeroPairTileIds.has(tile.id) && !tile.zeroPairId}
            stackRole={stackRoleByTileId.get(tile.id) || null}
            dropHighlight={
              effectiveHover?.targetId === tile.id ? effectiveHover.kind : null
            }
            onSelect={handleSelectTile}
            onDragStart={handleDragStart}
            onDragDelta={handleDragDelta}
            onDragDeltaEnd={handleDragDeltaEnd}
            containerRef={boardRef}
            snapToGrid={snapToGrid}
          />
        ))}
      </div>

      {/* Contextual Group Menu (order-2 on mobile so right beneath board, never clipped on 390px!) */}
      {activeGroup && (
        <div
          role="menu"
          data-testid="group-action-menu"
          aria-label={`Menu Kelompok ${activeGroup.label}`}
          className="order-2 lg:order-3 rounded-2xl border-2 border-[#5943A8]/35 bg-[#F7F5FC] px-4 py-3 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-[#5943A8] px-2 py-0.5 font-math text-xs font-bold text-white">
                {activeGroup.label}
              </span>
              <span className="text-xs font-bold text-[#39286F]">
                Kelompok Terpilih ({activeGroup.count} ubin {getTileLabel(activeGroup.type, activeGroup.sign)})
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveGroupId(null);
                setMovingGroupId(null);
                setConfirmDeleteGroupId(null);
              }}
              aria-label="Tutup menu kelompok"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-[#39286F]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {confirmDeleteGroupId === activeGroup.groupId ? (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#C94438]/30 bg-[#FFF2F0] px-3 py-2 text-xs text-[#8F241B]">
              <span>
                Hapus semua {activeGroup.count} ubin pada kelompok {activeGroup.label}?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteGroupId(null)}
                  className="rounded-lg border border-[#E5E0F3] bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteGroup(activeGroup.groupId)}
                  className="rounded-lg bg-[#C94438] px-3 py-1.5 font-bold text-white hover:bg-[#9B2F25]"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => handleUngroup(activeGroup.groupId)}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-white px-3 py-2 text-xs font-semibold text-[#39286F] hover:border-[#5943A8]"
              >
                <Unlink className="h-3.5 w-3.5 text-[#5943A8]" />
                Pecah Kelompok
              </button>

              <button
                type="button"
                onClick={() =>
                  setMovingGroupId((prev) =>
                    prev === activeGroup.groupId ? null : activeGroup.groupId
                  )
                }
                aria-pressed={movingGroupId === activeGroup.groupId}
                className={`inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  movingGroupId === activeGroup.groupId
                    ? 'border-[#5943A8] bg-[#5943A8] text-white'
                    : 'border-[#E5E0F3] bg-white text-[#39286F] hover:border-[#5943A8]'
                }`}
              >
                <Move className="h-3.5 w-3.5" />
                Pindahkan Kelompok
              </button>

              <button
                type="button"
                onClick={() => handleAddLikeTileToGroup(activeGroup.groupId)}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-white px-3 py-2 text-xs font-semibold text-[#156B62] hover:border-[#27A89A]"
              >
                <Plus className="h-3.5 w-3.5 text-[#27A89A]" />
                Tambahkan Ubin Sejenis
              </button>

              <button
                type="button"
                onClick={() => setConfirmDeleteGroupId(activeGroup.groupId)}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-[#C94438]/30 bg-[#FFF2F0] px-3 py-2 text-xs font-semibold text-[#9B2F25] hover:bg-[#FFE3DF]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus Kelompok
              </button>
            </div>
          )}
        </div>
      )}

      {/* Live Symbolic Representation Panel */}
      <div className="order-3 lg:order-4 flex flex-col justify-between gap-2.5 rounded-2xl border border-[#E5E0F3] bg-gradient-to-r from-[#F4F0FC] to-white px-4 py-3 sm:px-5 sm:py-3.5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#5943A8]">
            HASIL REPRESENTASI SIMBOLIK
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <span
              data-testid="symbolic-expression"
              className="font-math text-2xl font-bold text-[#39286F] tabular-nums"
            >
              {simplifiedExpr}
            </span>
            {rawExpr !== simplifiedExpr && (
              <span className="font-math text-sm text-slate-600 tabular-nums">
                (susunan saat ini: {rawExpr})
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span>Total ubin: {tiles.length}</span>
          <span aria-hidden="true">·</span>
          <span>Zero pair: {zeroPairs.length}</span>
          {groups.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#5943A8]">
                {groups.length} kelompok
              </span>
            </>
          )}
          {selectedIds.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#39286F]">
                {selectedIds.length} terpilih
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
