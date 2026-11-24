import React, { useMemo, useRef, useState } from 'react';
import {
  CheckSquare,
  Grid,
  Hand,
  Layers,
  Maximize2,
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
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Tile, TileSign, TileType } from '../types/algebra';
import {
  canCombineLikeTerms,
  clearCancelledZeroPairs,
  countTileStatuses,
  createTile,
  eliminateZeroPairs,
  findZeroPairs,
  formatExpression,
  formatRawExpression,
  getTermLabel,
  groupTilesByTerm,
  isTileActive,
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
  resolveZeroPairInspection,
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
  // Lab viewport & controlled state extensions
  labMode?: boolean;
  hideSymbolicPanel?: boolean;
  zoom?: number;
  panOffset?: { x: number; y: number };
  onZoomChange?: (nextZoom: number) => void;
  onPanChange?: (nextPan: { x: number; y: number }) => void;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  activeGroupId?: string | null;
  onActiveGroupIdChange?: (groupId: string | null) => void;
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
  labMode = false,
  hideSymbolicPanel = false,
  zoom: controlledZoom,
  panOffset: controlledPan,
  onZoomChange,
  onPanChange,
  selectedIds: controlledSelectedIds,
  onSelectedIdsChange,
  activeGroupId: controlledActiveGroupId,
  onActiveGroupIdChange,
}) => {
  const internalBoardRef = useRef<HTMLDivElement | null>(null);
  const boardRef = externalBoardRef || internalBoardRef;
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const [internalActiveGroupId, setInternalActiveGroupId] = useState<string | null>(null);
  const [internalZoom, setInternalZoom] = useState(1);
  const [internalPan, setInternalPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);

  const selectedIds = controlledSelectedIds ?? internalSelectedIds;
  const setSelectedIds = (updater: string[] | ((prev: string[]) => string[])) => {
    const next = typeof updater === 'function' ? updater(selectedIds) : updater;
    if (onSelectedIdsChange) {
      onSelectedIdsChange(next);
    } else {
      setInternalSelectedIds(next);
    }
  };

  const activeGroupId =
    controlledActiveGroupId !== undefined ? controlledActiveGroupId : internalActiveGroupId;
  const setActiveGroupId = (
    updater: string | null | ((prev: string | null) => string | null)
  ) => {
    const next = typeof updater === 'function' ? updater(activeGroupId) : updater;
    if (onActiveGroupIdChange) {
      onActiveGroupIdChange(next);
    } else {
      setInternalActiveGroupId(next);
    }
  };

  const zoom = controlledZoom ?? internalZoom;
  const setZoom = (nextZoom: number) => {
    const clamped = Math.max(0.65, Math.min(1.5, Math.round(nextZoom * 100) / 100));
    if (onZoomChange) {
      onZoomChange(clamped);
    } else {
      setInternalZoom(clamped);
    }
  };

  const panOffset = controlledPan ?? internalPan;
  const setPanOffset = (nextPan: { x: number; y: number }) => {
    if (onPanChange) {
      onPanChange(nextPan);
    } else {
      setInternalPan(nextPan);
    }
  };

  const [movingGroupId, setMovingGroupId] = useState<string | null>(null);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);
  const [isDraggingTile, setIsDraggingTile] = useState(false);
  const [hoverTarget, setHoverTarget] = useState<{
    targetId: string;
    kind: 'zeropair' | 'group' | 'mismatch';
  } | null>(null);

  const preDragTilesRef = useRef<Tile[] | null>(null);
  const panDragRef = useRef<{
    active: boolean;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

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

  const requiredBoardHeight = useMemo(() => {
    const baseHeight = labMode
      ? typeof window !== 'undefined' && window.innerWidth < 1024
        ? 270
        : 380
      : typeof window !== 'undefined' && window.innerWidth < 640
      ? 280
      : 340;
    const maxTileBottom = tiles.reduce((maxY, t) => {
      const { height } = getTileDimensions(t.type);
      return Math.max(maxY, t.position.y + height + 58);
    }, baseHeight);
    return Math.max(baseHeight, maxTileBottom);
  }, [tiles, labMode]);

  const getBoardSize = () => ({
    width: Math.max(320, (boardRef.current?.clientWidth || 540) / zoom),
    height: Math.max((boardRef.current?.clientHeight || 340) / zoom, requiredBoardHeight),
  });

  const { activeCount, cancelledCount } = countTileStatuses(tiles);
  const groups = useMemo(() => computeTileGroups(tiles), [tiles]);
  const zeroPairStacks = useMemo(() => computeZeroPairStacks(tiles), [tiles]);
  const zeroPairs = findZeroPairs(tiles);
  const stackRoleByTileId = useMemo(() => {
    const map = new Map<string, 'back' | 'front'>();
    for (const s of zeroPairStacks) {
      map.set(s.positiveTile.id, 'back');
      map.set(s.negativeTile.id, 'front');
    }
    return map;
  }, [zeroPairStacks]);

  const zeroPairInspection = useMemo(
    () =>
      resolveZeroPairInspection(
        tiles,
        selectedIds,
        isDraggingTile ? null : hoveredTileId,
        zeroPairStacks
      ),
    [tiles, selectedIds, isDraggingTile, hoveredTileId, zeroPairStacks]
  );
  const inspectedTileIds = useMemo(
    () => new Set(zeroPairInspection?.tileIds || []),
    [zeroPairInspection]
  );

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
    const localX = (pointerX - rect.left) / zoom - panOffset.x - width / 2;
    const localY = (pointerY - rect.top) / zoom - panOffset.y - height / 2;
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
  }, [activePaletteDrag, boardRef, tiles, zoom, panOffset]);

  const effectiveHover = hoverTarget || paletteHover.target;

  const commitChange = (baseTiles: Tile[] | null, nextTiles: Tile[]) => {
    if (baseTiles && onCommitPreDragState) {
      onCommitPreDragState(baseTiles, nextTiles);
    } else {
      onChangeTiles(nextTiles, true);
    }
  };

  const handleBoardPointerDown = (e: React.PointerEvent) => {
    const isMiddleClick = e.pointerType === 'mouse' && e.button === 1;
    if (!panMode && !isMiddleClick) return;
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;

    e.preventDefault();
    panDragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPanX: panOffset.x,
      startPanY: panOffset.y,
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onPanMove);
      window.removeEventListener('pointerup', onPanUp);
      window.removeEventListener('pointercancel', onPanUp);
    };

    const onPanMove = (moveEvt: PointerEvent) => {
      const s = panDragRef.current;
      if (!s || !s.active || moveEvt.pointerId !== s.pointerId) return;
      const dx = (moveEvt.clientX - s.startClientX) / zoom;
      const dy = (moveEvt.clientY - s.startClientY) / zoom;
      setPanOffset({
        x: Math.max(-420, Math.min(420, Math.round(s.startPanX + dx))),
        y: Math.max(-320, Math.min(320, Math.round(s.startPanY + dy))),
      });
    };

    const onPanUp = () => {
      panDragRef.current = null;
      cleanup();
    };

    window.addEventListener('pointermove', onPanMove, { passive: true });
    window.addEventListener('pointerup', onPanUp);
    window.addEventListener('pointercancel', onPanUp);
  };

  const handleBoardClick = (e: React.MouseEvent) => {
    if (panMode) return;

    if (movingGroupId && boardRef.current) {
      const targetGroup = groups.find((g) => g.groupId === movingGroupId);
      if (targetGroup) {
        const rect = boardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom - panOffset.x;
        const y = (e.clientY - rect.top) / zoom - panOffset.y;
        const { width, height } = getBoardSize();
        const nextTiles = relocateGroupToPoint(tiles, movingGroupId, x, y, width, height);
        onChangeTiles(nextTiles, true);
        setMovingGroupId(null);
        onFeedback?.({
          tone: 'info',
          text: `Moved group ${targetGroup.label} (${targetGroup.count} tiles).`,
        });
        return;
      }
      setMovingGroupId(null);
    }

    if (!selectedPaletteTile || !boardRef.current) {
      setSelectedIds([]);
      setActiveGroupId(null);
      setConfirmDeleteGroupId(null);
      setHoveredTileId(null);
      return;
    }

    const rect = boardRef.current.getBoundingClientRect();
    const { width: boardW, height: boardH } = getBoardSize();
    const { width, height } = getTileDimensions(selectedPaletteTile.type);
    let x = (e.clientX - rect.left) / zoom - panOffset.x - width / 2;
    let y = (e.clientY - rect.top) / zoom - panOffset.y - height / 2;
    x = Math.max(8, Math.min(Math.max(8, boardW - width - 8), x));
    y = Math.max(24, Math.min(Math.max(24, boardH - height - 8), y));
    if (snapToGrid) {
      x = Math.round(x / 12) * 12;
      y = Math.round(y / 12) * 12;
    }
    const nextTile = createTile(selectedPaletteTile.type, selectedPaletteTile.sign, { x, y });
    onChangeTiles([...tiles, nextTile], true);
  };

  const handleTileHoverChange = (id: string, hovering: boolean, pointerType: string) => {
    if (pointerType !== 'mouse' || isDraggingTile) return;
    if (hovering) {
      setHoveredTileId(id);
    } else {
      setHoveredTileId((prev) => (prev === id ? null : prev));
    }
  };

  const handleSelectTile = (id: string, multi: boolean) => {
    const tapped = tiles.find((t) => t.id === id);
    if (!tapped) return;

    // Allow inspecting cancelled tiles in single selection while keeping them non-draggable
    if (!isTileActive(tapped)) {
      setActiveGroupId(null);
      setMovingGroupId(null);
      setConfirmDeleteGroupId(null);
      setSelectedIds((prev) => (prev.includes(id) && prev.length === 1 ? [] : [id]));
      return;
    }

    const useMulti = multi || multiSelectMode;
    if (useMulti && !tapped.zeroPairId) {
      setActiveGroupId(null);
      setMovingGroupId(null);
      setConfirmDeleteGroupId(null);
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
      return;
    }

    if (tapped.zeroPairId) {
      setActiveGroupId(null);
      setMovingGroupId(null);
      setConfirmDeleteGroupId(null);
      setSelectedIds((prev) => (prev.includes(id) && prev.length === 1 ? [] : [id]));
      return;
    }

    if (tapped.groupId) {
      const grp = groups.find((g) => g.groupId === tapped.groupId);
      if (grp) {
        setSelectedIds([id]);
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
    setIsDraggingTile(true);
    setHoveredTileId(null);
    setMovingGroupId(null);
    setConfirmDeleteGroupId(null);
  };

  const applyLiveDelta = (baseTiles: Tile[], movingId: string, dx: number, dy: number) => {
    const movingTile = baseTiles.find((t) => t.id === movingId);
    if (!movingTile) return { nextTiles: baseTiles, movingIds: [] as string[], box: null };

    const { width: boardW, height: boardH } = getBoardSize();

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
    setIsDraggingTile(false);
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
        if (hit.kind === 'zeropair') {
          if (movingIds.length === 1 && !hit.targetTile.groupId) {
            const stacked = stackZeroPair(movedTiles, movingTile.id, hit.targetTile.id, boardW, boardH);
            if (stacked.valid) {
              setSelectedIds([]);
              setActiveGroupId(null);
              commitChange(snapshotBefore, stacked.tiles);
              onFeedback?.({ tone: 'info', text: stacked.explanation });
              return;
            }
          } else {
            const targetGroupIds = hit.targetTile.groupId
              ? movedTiles
                  .filter((t) => isTileActive(t) && t.groupId === hit.targetTile.groupId)
                  .map((t) => t.id)
              : [hit.targetTile.id];
            const targetTileIds = Array.from(new Set([...movingIds, ...targetGroupIds]));
            const res = eliminateZeroPairs(baseTiles, {
              boardWidth: boardW,
              boardHeight: boardH,
              targetTileIds,
            });
            if (res.removedCount > 0) {
              setSelectedIds([]);
              setActiveGroupId(null);
              setMovingGroupId(null);
              setHoveredTileId(null);
              commitChange(snapshotBefore, res.remainingTiles);
              onZeroPairsCleared?.(res.removedCount);
              onFeedback?.({ tone: 'success', text: res.explanation });
              return;
            }
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
              text: `${snapped.count} like tiles snapped together to form group ${snapped.label}.`,
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
            text: `Unlike terms cannot be grouped! ${getTermLabel(
              movingTile.type
            )} and ${getTermLabel(hit.targetTile.type)} are different term types.`,
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
          text: `Moved group ${grp.label} (${grp.count} tiles) together.`,
        });
      }
    }
  };

  const handleGroupBadgePointerDown = (
    e: React.PointerEvent,
    groupId: string,
    anchorTileId: string
  ) => {
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
      const dx = (moveEvt.clientX - s.startX) / zoom;
      const dy = (moveEvt.clientY - s.startY - liftY) / zoom;
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
        setSelectedIds([anchorTileId]);
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
        ? `Group ${grp.label} was ungrouped back into ${res.count} separate ${getTileLabel(
            grp.type,
            grp.sign
          )} tiles.`
        : 'Group separated into individual tiles.',
    });
  };

  const handleAddLikeTileToGroup = (groupId: string) => {
    const { width, height } = getBoardSize();
    const res = addLikeTileToGroup(tiles, groupId, width, height);
    onChangeTiles(res.tiles, true);
    onLikeTermsCombined?.();
    onFeedback?.({
      tone: 'success',
      text: `Added 1 like tile. Group now contains ${res.count} tiles (${res.label}).`,
    });
  };

  const handleConfirmDeleteGroup = (groupId: string) => {
    const grp = groups.find((g) => g.groupId === groupId);
    const remaining = tiles.filter((t) => t.groupId !== groupId);
    setActiveGroupId(null);
    setMovingGroupId(null);
    setConfirmDeleteGroupId(null);
    setSelectedIds([]);
    onChangeTiles(remaining, true);
    onFeedback?.({
      tone: 'info',
      text: grp
        ? `Removed group ${grp.label} (${grp.count} tiles) from workspace.`
        : 'Group removed.',
    });
  };

  // Zero Pair Stack Actions
  const handleEliminateStack = (zeroPairId: string) => {
    const res = eliminateZeroPairStack(tiles, zeroPairId);
    if (res.removedCount > 0) {
      setSelectedIds([]);
      setActiveGroupId(null);
      setHoveredTileId(null);
      onChangeTiles(res.tiles, true);
      onZeroPairsCleared?.(1);
      onFeedback?.({ tone: 'success', text: res.explanation });
    }
  };

  const handleEliminateSelectedZeroPairs = (tileIds: string[]) => {
    const { width, height } = getBoardSize();
    const res = eliminateZeroPairs(tiles, {
      boardWidth: width,
      boardHeight: height,
      targetTileIds: tileIds,
    });
    if (res.removedCount > 0) {
      setSelectedIds([]);
      setActiveGroupId(null);
      setMovingGroupId(null);
      setHoveredTileId(null);
      onChangeTiles(res.remainingTiles, true);
      onZeroPairsCleared?.(res.removedCount);
      onFeedback?.({ tone: 'success', text: res.explanation });
    }
  };

  const handleSeparateStack = (zeroPairId: string) => {
    const { width, height } = getBoardSize();
    const res = separateZeroPair(tiles, zeroPairId, width, height);
    setSelectedIds([]);
    setActiveGroupId(null);
    setHoveredTileId(null);
    onChangeTiles(res.tiles, true);
    onFeedback?.({ tone: 'info', text: res.explanation });
  };

  // Toolbar Actions
  const handleGroupLikeTerms = () => {
    if (selectedIds.length >= 2) {
      const chosen = tiles.filter((t) => selectedIds.includes(t.id) && isTileActive(t));
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
          text: 'Selected tiles have opposite signs (+ and −). Use "Match Zero Pairs" to simplify zero pairs.',
        });
        return;
      }

      const { width, height } = getBoardSize();
      const anchor = chosen[0];
      const others = chosen.slice(1).map((c) => c.id);
      const snapped = snapTilesIntoGroup(tiles, others, anchor.id, width, height);
      setSelectedIds([]);
      setActiveGroupId(snapped.groupId);
      onChangeTiles(snapped.tiles, true);
      onLikeTermsCombined?.();
      onFeedback?.({
        tone: 'success',
        text: `Grouped ${chosen.length} tiles into ${snapped.label}.`,
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
          ? 'Workspace is currently empty.'
          : `Tiles grouped by like terms (${simplifiedExpr}). Unlike terms stay separate.`,
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
    const { width, height } = getBoardSize();
    const res = eliminateZeroPairs(tiles, { boardWidth: width, boardHeight: height });
    if (res.removedCount === 0) {
      onFeedback?.({ tone: 'warning', text: res.explanation });
      return;
    }
    setSelectedIds([]);
    setActiveGroupId(null);
    setMovingGroupId(null);
    setHoveredTileId(null);
    onChangeTiles(res.remainingTiles, true);
    onZeroPairsCleared?.(res.removedCount);
    onFeedback?.({ tone: 'success', text: res.explanation });
  };

  const handleClearCancelled = () => {
    const res = clearCancelledZeroPairs(tiles);
    if (res.clearedCount === 0) return;
    setSelectedIds([]);
    setActiveGroupId(null);
    onChangeTiles(res.remainingTiles, true);
    onFeedback?.({ tone: 'info', text: res.explanation });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    onChangeTiles(
      tiles.filter((t) => !selectedIds.includes(t.id)),
      true
    );
    setSelectedIds([]);
    setActiveGroupId(null);
    onFeedback?.({
      tone: 'info',
      text: `Removed ${selectedIds.length} selected tile(s) from the board.`,
    });
  };

  const handleResetConfirm = () => {
    setSelectedIds([]);
    setActiveGroupId(null);
    setMovingGroupId(null);
    setConfirmDeleteGroupId(null);
    onChangeTiles([], true);
    setConfirmResetOpen(false);
    onFeedback?.({ tone: 'info', text: 'Workspace has been cleared.' });
  };

  const boardSize = getBoardSize();
  const isViewTransformed = zoom !== 1 || panOffset.x !== 0 || panOffset.y !== 0;

  return (
    <div className={labMode ? 'contents lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-2.5' : 'flex flex-col gap-3'}>
      {/* Main Manipulation Stage */}
      <div
        ref={boardRef}
        data-testid="algebra-workspace-board"
        onPointerDown={handleBoardPointerDown}
        onClick={handleBoardClick}
        style={{
          minHeight: `${labMode ? (typeof window !== 'undefined' && window.innerWidth < 1024 ? 270 : 340) : requiredBoardHeight}px`,
          backgroundImage: snapToGrid
            ? 'radial-gradient(#D8D1EE 1px, transparent 1px)'
            : 'none',
          backgroundSize: `${16 * zoom}px ${16 * zoom}px`,
          backgroundPosition: `${panOffset.x * zoom}px ${panOffset.y * zoom}px`,
          touchAction: activePaletteDrag || movingGroupId || panMode ? 'none' : 'pan-y',
        }}
        className={`order-1 lg:order-1 relative w-full overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
          labMode ? 'lg:flex-1 lg:min-h-0' : ''
        } ${
          panMode
            ? 'cursor-grab active:cursor-grabbing border-[#5943A8]/60 bg-[#FAF9FE]'
            : paletteHover.overBoard
            ? 'border-[#0CA789] bg-[#F2FCF9]'
            : movingGroupId
            ? 'border-[#5943A8] bg-[#FAF8FF]'
            : 'border-[#D6CEF0] bg-white hover:border-[#B6A7E3]'
        }`}
      >
        {/* Canvas Top-Right Viewport Controls (Zoom + Pan + Reset View) */}
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-2.5 top-2.5 z-35 flex items-center gap-1 rounded-xl border border-[#E5E0F3] bg-white/95 p-1 shadow-xs backdrop-blur-xs"
        >
          <button
            type="button"
            onClick={() => setZoom(zoom - 0.15)}
            disabled={zoom <= 0.65}
            aria-label="Zoom out canvas"
            title="Zoom out"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-[#F7F5FC] disabled:opacity-35"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            aria-label="Reset zoom to 100%"
            title="Reset zoom (100%)"
            className="rounded-lg px-1.5 py-1 font-mono text-[11px] font-bold text-[#39286F] hover:bg-[#F7F5FC] tabular-nums"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoom(zoom + 0.15)}
            disabled={zoom >= 1.5}
            aria-label="Zoom in canvas"
            title="Zoom in"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-[#F7F5FC] disabled:opacity-35"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-[#E5E0F3]" />
          <button
            type="button"
            onClick={() => setPanMode((v) => !v)}
            aria-pressed={panMode}
            aria-label="Toggle canvas pan mode"
            title="Pan canvas"
            className={`inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-colors ${
              panMode
                ? 'bg-[#5943A8] text-white'
                : 'text-slate-700 hover:bg-[#F7F5FC]'
            }`}
          >
            <Hand className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pan</span>
          </button>
          {isViewTransformed && (
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPanOffset({ x: 0, y: 0 });
                setPanMode(false);
              }}
              aria-label="Reset canvas view"
              title="Reset view"
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#F7F5FC] px-2 text-[11px] font-semibold text-[#5943A8] hover:bg-[#EAE3F9]"
            >
              <Maximize2 className="h-3 w-3" />
              <span className="hidden sm:inline">Reset View</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {tiles.length === 0 && (
          <div className="pointer-events-none flex h-[250px] sm:h-[330px] lg:h-full flex-col items-center justify-center px-6 text-center">
            <p className="text-sm font-bold text-[#39286F]">
              Algebra Tiles Manipulation Canvas
            </p>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              Drag x-family or y-family tiles here, or tap + to add. Bring like tiles together to snap into a group, or stack + and − to create a Zero Pair.
            </p>
          </div>
        )}

        {/* Moving-group / Pan prompt banner */}
        {(movingGroupId || panMode) && (
          <div className="pointer-events-none absolute inset-x-3 top-2.5 z-30 flex justify-center sm:justify-start">
            <span className="rounded-full bg-[#39286F] px-3 py-1 text-[11px] font-semibold text-white shadow-xs">
              {panMode
                ? 'Pan Mode active — drag canvas background to move view'
                : 'Tap target position on canvas or drag the group directly'}
            </span>
          </div>
        )}

        {/* Transformed Logical Stage */}
        <div
          ref={stageRef}
          data-testid="workspace-stage"
          style={{
            transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: '0 0',
            width: `${100 / zoom}%`,
            minHeight: `${requiredBoardHeight}px`,
            pointerEvents: panMode ? 'none' : 'auto',
          }}
          className="relative"
        >
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
                  aria-label={`Group ${grp.label} (${grp.count} tiles). Tap for menu or drag to move`}
                >
                  <span className="font-math">{grp.label}</span>
                  <span className="opacity-85">· {grp.count} tiles</span>
                </button>
              </React.Fragment>
            );
          })}

          {/* Contextual Zero Pair / Cancelled Inspection Overlay (at most ONE label, never persistent when idle) */}
          {zeroPairInspection && (() => {
            const box = zeroPairInspection.box;
            const isCancelledInspection = zeroPairInspection.kind === 'cancelled';
            const labelW = isCancelledInspection ? 114 : 110;
            const zoomBarWidth =
              boardSize.width < 640
                ? isViewTransformed
                  ? 186
                  : 152
                : isViewTransformed
                ? 268
                : 210;
            const wouldOverlapZoomControls =
              box.y - 26 < 46 && box.x + labelW > boardSize.width - zoomBarWidth - 10;
            const placeBelow = box.y < 30 || wouldOverlapZoomControls;
            const labelTop = placeBelow
              ? Math.min(Math.max(8, boardSize.height - 26), box.y + box.height + 6)
              : box.y - 26;
            const labelLeft = Math.max(
              8,
              Math.min(Math.max(8, boardSize.width - labelW - 8), box.x - 2)
            );

            return (
              <>
                <div
                  data-zero-pair-stack={zeroPairInspection.zeroPairId || 'inspected'}
                  style={{
                    left: `${box.x - 5}px`,
                    top: `${box.y - 5}px`,
                    width: `${box.width + 10}px`,
                    height: `${box.height + 10}px`,
                  }}
                  className={`pointer-events-none absolute z-[8] rounded-xl border-2 border-dashed transition-colors ${
                    isCancelledInspection
                      ? 'border-slate-400/80 bg-slate-100/45'
                      : 'border-[#EF8748] bg-[#FFF8F2]/60'
                  }`}
                />
                <div
                  data-testid={
                    isCancelledInspection
                      ? 'contextual-cancelled-label'
                      : 'contextual-zero-pair-label'
                  }
                  style={{
                    left: `${labelLeft}px`,
                    top: `${labelTop}px`,
                  }}
                  className={`pointer-events-none absolute z-25 rounded-md px-2 py-0.5 text-[10px] font-bold text-white shadow-xs whitespace-nowrap ${
                    isCancelledInspection ? 'bg-slate-700' : 'bg-[#EF8748]'
                  }`}
                >
                  {zeroPairInspection.label}
                </div>
              </>
            );
          })()}

          {/* Individual Tile Objects */}
          {tiles.map((tile) => (
            <WorkspaceTileItem
              key={tile.id}
              tile={tile}
              zoom={zoom}
              selected={selectedIds.includes(tile.id)}
              zeroPairHighlight={
                zeroPairInspection?.kind === 'zero-pair' && inspectedTileIds.has(tile.id)
              }
              stackRole={stackRoleByTileId.get(tile.id) || null}
              dropHighlight={
                effectiveHover?.targetId === tile.id ? effectiveHover.kind : null
              }
              onSelect={handleSelectTile}
              onHoverChange={handleTileHoverChange}
              onDragStart={handleDragStart}
              onDragDelta={handleDragDelta}
              onDragDeltaEnd={handleDragDeltaEnd}
              containerRef={stageRef}
              snapToGrid={snapToGrid}
            />
          ))}
        </div>
      </div>

      {/* Contextual Zero Pair Actions (shown ONLY when a valid zero pair is selected, positioned outside canvas so tiles are never covered) */}
      {zeroPairInspection?.mode === 'selected' && zeroPairInspection.kind === 'zero-pair' && (
        <div
          role="region"
          data-testid="zero-pair-action-menu"
          aria-label="Selected zero pair actions"
          className="order-2 lg:order-2 rounded-2xl border-2 border-[#EF8748]/45 bg-[#FFF8F3] px-3.5 py-2.5 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[#EF8748] px-2 py-0.5 text-xs font-bold text-white whitespace-nowrap">
                Zero Pair (= 0)
              </span>
              <span className="font-math text-xs font-bold text-[#8F3E10]">
                {zeroPairInspection.termLabel}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {zeroPairInspection.canMatch && (
                <button
                  type="button"
                  onClick={() => {
                    if (zeroPairInspection.zeroPairId) {
                      handleEliminateStack(zeroPairInspection.zeroPairId);
                    } else {
                      handleEliminateSelectedZeroPairs(zeroPairInspection.tileIds);
                    }
                  }}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#EF8748] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#D96A27] whitespace-nowrap"
                >
                  <Wand2 className="h-3.5 w-3.5 shrink-0" />
                  Match Zero Pairs
                </button>
              )}

              {zeroPairInspection.canSeparate && zeroPairInspection.zeroPairId && (
                <button
                  type="button"
                  onClick={() => handleSeparateStack(zeroPairInspection.zeroPairId!)}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-white px-3 py-1.5 text-xs font-semibold text-[#39286F] hover:bg-[#F7F5FC] whitespace-nowrap"
                >
                  <Scissors className="h-3.5 w-3.5 shrink-0" />
                  Separate
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedIds([]);
                  setHoveredTileId(null);
                }}
                aria-label="Close zero pair menu"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-[#39286F]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contextual Group Menu (appears right below canvas when a group is selected) */}
      {activeGroup && (
        <div
          role="menu"
          data-testid="group-action-menu"
          aria-label={`Group ${activeGroup.label} menu`}
          className="order-2 lg:order-2 rounded-2xl border-2 border-[#5943A8]/35 bg-[#F7F5FC] px-3.5 py-2.5 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-[#5943A8] px-2 py-0.5 font-math text-xs font-bold text-white">
                {activeGroup.label}
              </span>
              <span className="text-xs font-bold text-[#39286F]">
                Selected Group ({activeGroup.count} {getTileLabel(activeGroup.type, activeGroup.sign)} tiles)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveGroupId(null);
                setMovingGroupId(null);
                setConfirmDeleteGroupId(null);
              }}
              aria-label="Close group menu"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-[#39286F]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {confirmDeleteGroupId === activeGroup.groupId ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#C94438]/30 bg-[#FFF2F0] px-3 py-2 text-xs text-[#8F241B]">
              <span>
                Delete all {activeGroup.count} tiles in group {activeGroup.label}?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteGroupId(null)}
                  className="rounded-lg border border-[#E5E0F3] bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteGroup(activeGroup.groupId)}
                  className="rounded-lg bg-[#C94438] px-3 py-1.5 font-bold text-white hover:bg-[#9B2F25]"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => handleUngroup(activeGroup.groupId)}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-white px-3 py-2 text-xs font-semibold text-[#39286F] hover:border-[#5943A8]"
              >
                <Unlink className="h-3.5 w-3.5 text-[#5943A8]" />
                Ungroup
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
                Move Group
              </button>

              <button
                type="button"
                onClick={() => handleAddLikeTileToGroup(activeGroup.groupId)}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-[#E5E0F3] bg-white px-3 py-2 text-xs font-semibold text-[#077D66] hover:border-[#0CA789]"
              >
                <Plus className="h-3.5 w-3.5 text-[#0CA789]" />
                Add Like Tile
              </button>

              <button
                type="button"
                onClick={() => setConfirmDeleteGroupId(activeGroup.groupId)}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-[#C94438]/30 bg-[#FFF2F0] px-3 py-2 text-xs font-semibold text-[#9B2F25] hover:bg-[#FFE3DF]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Group
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action Toolbar (order-3 on mobile below Symbolic Strip, bottom bar of Center Canvas on desktop) */}
      <div className="order-3 lg:order-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E5E0F3] bg-white px-3 py-2.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleGroupLikeTerms}
            disabled={activeCount === 0}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#EEF4FC] px-3 py-2 text-xs font-semibold text-[#1D4ED8] transition-colors hover:bg-[#DDEAF9] disabled:opacity-45 whitespace-nowrap"
          >
            <Layers className="h-3.5 w-3.5" />
            {selectedIds.length >= 2 ? `Group (${selectedIds.length})` : 'Group Like Terms'}
          </button>

          <button
            type="button"
            onClick={handleCombineSelectedOrAll}
            disabled={activeCount === 0}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#EAF7F5] px-3 py-2 text-xs font-semibold text-[#077D66] transition-colors hover:bg-[#D5EFEA] disabled:opacity-45 whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Combine Terms{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
          </button>

          <button
            type="button"
            onClick={handleZeroPairs}
            disabled={activeCount < 2}
            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-45 whitespace-nowrap ${
              zeroPairs.length > 0
                ? 'bg-[#EF8748] text-white hover:bg-[#D96A27]'
                : 'bg-[#FFF3EB] text-[#A84E17] hover:bg-[#FFE4D1]'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            Match Zero Pairs{zeroPairs.length > 0 ? ` (${zeroPairs.length})` : ''}
          </button>

          <button
            type="button"
            onClick={handleClearCancelled}
            disabled={cancelledCount === 0}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#D6CEF0] bg-white px-3 py-2 text-xs font-semibold text-[#5943A8] transition-colors hover:bg-[#F7F5FC] disabled:opacity-40 whitespace-nowrap"
          >
            <Scissors className="h-3.5 w-3.5" />
            Clear Cancelled Tiles{cancelledCount > 0 ? ` (${cancelledCount})` : ''}
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
            Select Multiple
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

          {!labMode && (
            <>
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
            </>
          )}

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[#C94438]/30 bg-[#FFF2F0] px-2.5 py-2 text-xs font-semibold text-[#9B2F25] hover:bg-[#FFE3DF] whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete ({selectedIds.length})
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
          aria-label="Confirm workspace reset"
          className="order-3 lg:order-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EF8748] bg-[#FFF8F3] px-4 py-3 text-sm text-[#39286F]"
        >
          <span>Clear all tiles from the current workspace?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmResetOpen(false)}
              className="rounded-lg border border-[#E5E0F3] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetConfirm}
              className="rounded-lg bg-[#C94438] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#9B2F25]"
            >
              Yes, Reset Board
            </button>
          </div>
        </div>
      )}

      {/* Optional Built-in Symbolic Panel (hidden in Lab mode because Right Inspector Panel owns it) */}
      {!hideSymbolicPanel && (
        <div className="order-2 lg:order-5 flex flex-col gap-2 rounded-2xl border border-[#E5E0F3] bg-gradient-to-r from-[#F4F0FC] to-white px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#5943A8]">
                SYMBOLIC REPRESENTATION
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
                    (active tiles: {rawExpr})
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
              <span data-testid="active-tile-count" className="font-semibold text-[#39286F]">
                Active Tiles: {activeCount}
              </span>
              <span aria-hidden="true">·</span>
              <span data-testid="cancelled-tile-count" className="font-medium text-slate-500">
                Faded Tiles: {cancelledCount}
              </span>
              <span aria-hidden="true">·</span>
              <span>Zero pairs: {zeroPairs.length}</span>
              {groups.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-[#5943A8]">
                    {groups.length} groups
                  </span>
                </>
              )}
              {selectedIds.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-[#39286F]">
                    {selectedIds.length} selected
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EAE4F7] pt-2 text-[11px] text-slate-600">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-3.5 rounded-xs bg-[#2D6DF6]" aria-hidden="true" />
                <span className="inline-block h-2.5 w-3.5 rounded-xs bg-[#0CA789]" aria-hidden="true" />
                <span className="inline-block h-2.5 w-3.5 rounded-xs bg-[#F6C431]" aria-hidden="true" />
                <span className="inline-block h-2.5 w-3.5 rounded-xs bg-[#6C4CF6]" aria-hidden="true" />
                <span>Solid = active positive</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-4 rounded-xs border border-[#D64545] bg-[#D4F3EC]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, rgba(220,38,38,0.34) 0 2px, transparent 2px 5px)',
                  }}
                  aria-hidden="true"
                />
                <span>Pale + red stripes = active negative</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-4 rounded-xs border border-dashed border-slate-500/50 bg-[#0CA789]/15"
                  aria-hidden="true"
                />
                <span>Faded = cancelled zero pair (not counted)</span>
              </span>
            </div>
            {cancelledCount > 0 && (
              <span className="text-[11px] font-medium text-[#5943A8]">
                Use Undo to reactivate or Clear Cancelled Tiles to remove faded history.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
