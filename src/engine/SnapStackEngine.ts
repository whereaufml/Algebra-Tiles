import { Tile, TileSign, TileType } from '../types/algebra';
import {
  canFormZeroPair,
  createTile,
  formatExpression,
  formatSingleTermSummary,
  getTermLabel,
  getTermSymbol,
  getTileDimsForLayout,
  isTileActive,
} from './MathEngine';

export interface TileDimensions {
  width: number;
  height: number;
}

export function getTileSize(type: TileType): TileDimensions {
  return getTileDimsForLayout(type);
}

export interface TileGroupView {
  groupId: string;
  type: TileType;
  sign: TileSign;
  count: number;
  label: string;
  memberIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ZeroPairStackView {
  zeroPairId: string;
  type: TileType;
  positiveTile: Tile;
  negativeTile: Tile;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ProximityInteraction =
  | { kind: 'group'; targetTile: Tile }
  | { kind: 'zeropair'; targetTile: Tile }
  | { kind: 'mismatch'; targetTile: Tile }
  | null;

function boxesIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  pad = 0
): boolean {
  return (
    a.x < b.x + b.width + pad &&
    a.x + a.width + pad > b.x &&
    a.y < b.y + b.height + pad &&
    a.y + a.height + pad > b.y
  );
}

/**
 * Evaluates spatial proximity / overlap when dragging a tile or group:
 * 1. Overlap (`pad = 2`) with opposite-sign same-type tile/group -> 'zeropair'
 * 2. Proximity (`pad = 20`) with same-sign same-type tile/group -> 'group' (magnetic snap)
 * 3. Overlap (`pad = 2`) with different-type tile -> 'mismatch'
 */
export function detectDropTarget(
  tiles: Tile[],
  movingIds: string[],
  movingType: TileType,
  movingSign: TileSign,
  box: { x: number; y: number; width: number; height: number },
  isSingleMovingTile = true
): ProximityInteraction {
  const movingSet = new Set(movingIds);
  const candidates = tiles.filter(
    (t) => isTileActive(t) && !movingSet.has(t.id) && !t.zeroPairId
  );

  const boxCx = box.x + box.width / 2;
  const boxCy = box.y + box.height / 2;

  const sorted = [...candidates].sort((a, b) => {
    const da = getTileSize(a.type);
    const db = getTileSize(b.type);
    const distA = Math.hypot(boxCx - (a.position.x + da.width / 2), boxCy - (a.position.y + da.height / 2));
    const distB = Math.hypot(boxCx - (b.position.x + db.width / 2), boxCy - (b.position.y + db.height / 2));
    return distA - distB;
  });

  // 1. Check direct overlap first (zero pair or mismatch takes precedence when directly stacked)
  for (const other of sorted) {
    const size = getTileSize(other.type);
    const otherBox = { x: other.position.x, y: other.position.y, ...size };
    if (boxesIntersect(box, otherBox, 2)) {
      if (
        other.type === movingType &&
        other.sign === -movingSign &&
        (isSingleMovingTile || movingIds.length > 0)
      ) {
        return { kind: 'zeropair', targetTile: other };
      }
      if (other.type === movingType && other.sign === movingSign) {
        return { kind: 'group', targetTile: other };
      }
      if (other.type !== movingType) {
        return { kind: 'mismatch', targetTile: other };
      }
    }
  }

  // 2. Check magnetic snap proximity (20px) for same-type & same-sign tiles/groups
  for (const other of sorted) {
    if (other.type !== movingType || other.sign !== movingSign) continue;
    const size = getTileSize(other.type);
    const otherBox = { x: other.position.x, y: other.position.y, ...size };
    if (boxesIntersect(box, otherBox, 20)) {
      return { kind: 'group', targetTile: other };
    }
  }

  return null;
}

export function computeTileGroups(tiles: Tile[]): TileGroupView[] {
  const buckets = new Map<string, Tile[]>();
  for (const tile of tiles) {
    if (!isTileActive(tile) || !tile.groupId || tile.zeroPairId) continue;
    const list = buckets.get(tile.groupId) || [];
    list.push(tile);
    buckets.set(tile.groupId, list);
  }

  const groups: TileGroupView[] = [];
  for (const [groupId, members] of buckets.entries()) {
    if (members.length < 2) continue;
    const first = members[0];
    if (!members.every((m) => m.type === first.type && m.sign === first.sign)) continue;

    const minX = Math.min(...members.map((m) => m.position.x));
    const minY = Math.min(...members.map((m) => m.position.y));
    const maxX = Math.max(...members.map((m) => m.position.x + getTileSize(m.type).width));
    const maxY = Math.max(...members.map((m) => m.position.y + getTileSize(m.type).height));

    const net = first.sign * members.length;
    const label = formatSingleTermSummary(first.type, net);

    groups.push({
      groupId,
      type: first.type,
      sign: first.sign,
      count: members.length,
      label,
      memberIds: members.map((m) => m.id),
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    });
  }

  return groups;
}

export function computeZeroPairStacks(tiles: Tile[]): ZeroPairStackView[] {
  const buckets = new Map<string, Tile[]>();
  for (const tile of tiles) {
    if (!isTileActive(tile) || !tile.zeroPairId) continue;
    const list = buckets.get(tile.zeroPairId) || [];
    list.push(tile);
    buckets.set(tile.zeroPairId, list);
  }

  const stacks: ZeroPairStackView[] = [];
  for (const [zeroPairId, pair] of buckets.entries()) {
    if (pair.length !== 2) continue;
    const pos = pair.find((t) => t.sign === 1);
    const neg = pair.find((t) => t.sign === -1);
    if (!pos || !neg || pos.type !== neg.type) continue;

    const minX = Math.min(pos.position.x, neg.position.x);
    const minY = Math.min(pos.position.y, neg.position.y);
    const size = getTileSize(pos.type);
    const maxX = Math.max(pos.position.x, neg.position.x) + size.width;
    const maxY = Math.max(pos.position.y, neg.position.y) + size.height;
    const term = getTermSymbol(pos.type);

    stacks.push({
      zeroPairId,
      type: pos.type,
      positiveTile: pos,
      negativeTile: neg,
      label: `+${term} + (−${term}) = 0`,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    });
  }

  return stacks;
}

export function layoutSnappedGroup(
  tiles: Tile[],
  groupId: string,
  anchorX: number,
  anchorY: number,
  boardWidth = 540,
  boardHeight = 340
): Tile[] {
  const members = tiles.filter((t) => isTileActive(t) && t.groupId === groupId);
  if (members.length === 0) return tiles;

  const { width, height } = getTileSize(members[0].type);
  const gapX = 6;
  const gapY = 8;
  const maxPerRow = Math.max(1, Math.floor((boardWidth - 28) / (width + gapX)));
  const cols = Math.min(members.length, maxPerRow);
  const rows = Math.ceil(members.length / cols);
  const totalW = cols * width + (cols - 1) * gapX;
  const totalH = rows * height + (rows - 1) * gapY;

  const nonMembers = tiles.filter((t) => isTileActive(t) && t.groupId !== groupId);
  const overlapsNonMember = (sx: number, sy: number) =>
    nonMembers.some((other) => {
      const os = getTileSize(other.type);
      return boxesIntersect(
        { x: sx, y: sy, width: totalW, height: totalH },
        { x: other.position.x, y: other.position.y, width: os.width, height: os.height },
        4
      );
    });

  let startX = Math.max(12, Math.min(Math.max(12, boardWidth - totalW - 12), anchorX));
  let startY = Math.max(34, Math.min(Math.max(34, boardHeight - totalH - 12), anchorY));

  if (overlapsNonMember(startX, startY)) {
    const candidates: Array<{ x: number; y: number }> = [
      { x: startX, y: Math.min(boardHeight - totalH - 12, startY + height + 18) },
      { x: Math.max(12, startX - width - 12), y: startY },
      { x: Math.min(boardWidth - totalW - 12, startX + width + 18), y: startY },
      { x: 16, y: Math.min(boardHeight - totalH - 12, startY + height + 24) },
    ];
    for (const c of candidates) {
      if (
        c.x >= 12 &&
        c.y >= 34 &&
        c.x + totalW <= boardWidth - 12 &&
        c.y + totalH <= boardHeight - 12 &&
        !overlapsNonMember(c.x, c.y)
      ) {
        startX = c.x;
        startY = c.y;
        break;
      }
    }
  }

  const posById = new Map<string, { x: number; y: number }>();
  members.forEach((m, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    posById.set(m.id, {
      x: Math.round(startX + col * (width + gapX)),
      y: Math.round(startY + row * (height + gapY)),
    });
  });

  return tiles.map((t) => {
    const pos = posById.get(t.id);
    return pos ? { ...t, position: pos } : t;
  });
}

export function snapTilesIntoGroup(
  tiles: Tile[],
  sourceTileIds: string[],
  targetTileId: string,
  boardWidth = 540,
  boardHeight = 340
): { tiles: Tile[]; groupId: string; count: number; label: string } {
  const target = tiles.find((t) => t.id === targetTileId && isTileActive(t));
  const sourceFirst = tiles.find((t) => sourceTileIds.includes(t.id) && isTileActive(t));
  if (!target || !sourceFirst || target.type !== sourceFirst.type || target.sign !== sourceFirst.sign) {
    return {
      tiles,
      groupId: target?.groupId || '',
      count: 0,
      label: '',
    };
  }

  const groupId = target.groupId || `grp-${target.type}-${target.sign}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  const sourceSet = new Set(sourceTileIds);
  const targetGroupSet = new Set(
    target.groupId
      ? tiles.filter((t) => t.groupId === target.groupId).map((t) => t.id)
      : [target.id]
  );

  // Also include any existing group members of source tiles if dragging a whole group
  const sourceGroupIds = new Set(
    tiles.filter((t) => sourceSet.has(t.id) && t.groupId).map((t) => t.groupId as string)
  );
  for (const t of tiles) {
    if (t.groupId && sourceGroupIds.has(t.groupId)) {
      sourceSet.add(t.id);
    }
  }

  const mergedIds = new Set<string>([...targetGroupSet, ...sourceSet]);
  const updated = tiles.map((t) =>
    mergedIds.has(t.id) ? { ...t, groupId, zeroPairId: null } : t
  );

  const anchorMembers = updated.filter((t) => targetGroupSet.has(t.id));
  const anchorX = Math.min(...anchorMembers.map((m) => m.position.x));
  const anchorY = Math.min(...anchorMembers.map((m) => m.position.y));

  const laidOut = layoutSnappedGroup(updated, groupId, anchorX, anchorY, boardWidth, boardHeight);
  const net = target.sign * mergedIds.size;
  const label = formatSingleTermSummary(target.type, net);

  return {
    tiles: laidOut,
    groupId,
    count: mergedIds.size,
    label,
  };
}

export function addLikeTileToGroup(
  tiles: Tile[],
  groupId: string,
  boardWidth = 540,
  boardHeight = 340
): { tiles: Tile[]; count: number; label: string } {
  const members = tiles.filter((t) => t.groupId === groupId);
  if (members.length === 0) return { tiles, count: 0, label: '' };

  const sample = members[0];
  const newTile = createTile(sample.type, sample.sign, { ...sample.position }, groupId);
  const anchorX = Math.min(...members.map((m) => m.position.x));
  const anchorY = Math.min(...members.map((m) => m.position.y));
  const next = layoutSnappedGroup([...tiles, newTile], groupId, anchorX, anchorY, boardWidth, boardHeight);

  const count = members.length + 1;
  const net = sample.sign * count;
  const label = formatSingleTermSummary(sample.type, net);

  return { tiles: next, count, label };
}

export function ungroupTiles(
  tiles: Tile[],
  groupId: string,
  boardWidth = 540,
  boardHeight = 340
): { tiles: Tile[]; count: number } {
  const members = tiles.filter((t) => t.groupId === groupId);
  if (members.length === 0) return { tiles, count: 0 };

  const { width, height } = getTileSize(members[0].type);
  const gapX = 16;
  const gapY = 16;
  const minX = Math.min(...members.map((m) => m.position.x));
  const minY = Math.min(...members.map((m) => m.position.y));

  const maxCols = Math.max(2, Math.floor((boardWidth - 20) / (width + gapX)));
  const cols = Math.min(members.length, maxCols);
  const rows = Math.ceil(members.length / cols);
  const totalW = cols * width + (cols - 1) * gapX;
  const totalH = rows * height + (rows - 1) * gapY;

  const startX = Math.max(12, Math.min(Math.max(12, boardWidth - totalW - 12), minX));
  const startY = Math.max(16, Math.min(Math.max(16, boardHeight - totalH - 12), minY));

  const posById = new Map<string, { x: number; y: number }>();
  members.forEach((m, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    posById.set(m.id, {
      x: Math.round(startX + col * (width + gapX)),
      y: Math.round(startY + row * (height + gapY)),
    });
  });

  const next = tiles.map((t) => {
    const pos = posById.get(t.id);
    if (!pos) return t;
    return { ...t, groupId: null, position: pos };
  });

  return { tiles: next, count: members.length };
}

export function moveGroupByDelta(
  tiles: Tile[],
  groupId: string,
  rawDx: number,
  rawDy: number,
  boardWidth = 540,
  boardHeight = 340
): Tile[] {
  const members = tiles.filter((t) => t.groupId === groupId);
  if (members.length === 0) return tiles;

  const minX = Math.min(...members.map((m) => m.position.x));
  const minY = Math.min(...members.map((m) => m.position.y));
  const maxX = Math.max(...members.map((m) => m.position.x + getTileSize(m.type).width));
  const maxY = Math.max(...members.map((m) => m.position.y + getTileSize(m.type).height));

  const minAllowedDx = 10 - minX;
  const maxAllowedDx = Math.max(minAllowedDx, boardWidth - 10 - maxX);
  const minAllowedDy = 32 - minY;
  const maxAllowedDy = Math.max(minAllowedDy, boardHeight - 10 - maxY);

  const dx = Math.max(minAllowedDx, Math.min(maxAllowedDx, rawDx));
  const dy = Math.max(minAllowedDy, Math.min(maxAllowedDy, rawDy));

  return tiles.map((t) =>
    t.groupId === groupId
      ? { ...t, position: { x: Math.round(t.position.x + dx), y: Math.round(t.position.y + dy) } }
      : t
  );
}

export function relocateGroupToPoint(
  tiles: Tile[],
  groupId: string,
  targetX: number,
  targetY: number,
  boardWidth = 540,
  boardHeight = 340
): Tile[] {
  const members = tiles.filter((t) => t.groupId === groupId);
  if (members.length === 0) return tiles;

  const minX = Math.min(...members.map((m) => m.position.x));
  const minY = Math.min(...members.map((m) => m.position.y));
  const maxX = Math.max(...members.map((m) => m.position.x + getTileSize(m.type).width));
  const maxY = Math.max(...members.map((m) => m.position.y + getTileSize(m.type).height));
  const groupW = maxX - minX;
  const groupH = maxY - minY;

  const desiredX = targetX - groupW / 2;
  const desiredY = targetY - groupH / 2;
  return moveGroupByDelta(tiles, groupId, desiredX - minX, desiredY - minY, boardWidth, boardHeight);
}

export function stackZeroPair(
  tiles: Tile[],
  movingId: string,
  targetId: string,
  boardWidth = 540,
  boardHeight = 340
): { valid: boolean; tiles: Tile[]; zeroPairId?: string; explanation: string } {
  const a = tiles.find((t) => t.id === movingId);
  const b = tiles.find((t) => t.id === targetId);
  if (!a || !b || !canFormZeroPair(a, b)) {
    return {
      valid: false,
      tiles,
      explanation: a && b && a.type !== b.type
        ? `Cannot stack ${getTermLabel(a.type)} with ${getTermLabel(b.type)} as a Zero Pair because they are unlike terms.`
        : 'A zero pair requires two like tiles with opposite signs (+ and −).',
    };
  }

  const posTile = a.sign === 1 ? a : b;
  const negTile = a.sign === -1 ? a : b;
  const size = getTileSize(b.type);
  const offsetX = 20;
  const offsetY = 22;

  const baseX = Math.max(14, Math.min(Math.max(14, boardWidth - size.width - offsetX - 14), b.position.x));
  const baseY = Math.max(34, Math.min(Math.max(34, boardHeight - size.height - offsetY - 14), b.position.y));
  const zeroPairId = `zp-${b.type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

  // If either tile belonged to a group, check if any orphan single tile remains in that group and ungroup it
  const affectedGroupIds = new Set(
    [a.groupId, b.groupId].filter((g): g is string => Boolean(g))
  );

  let next = tiles.map((t) => {
    if (t.id === posTile.id) {
      return { ...t, groupId: null, zeroPairId, position: { x: baseX, y: baseY } };
    }
    if (t.id === negTile.id) {
      return { ...t, groupId: null, zeroPairId, position: { x: baseX + offsetX, y: baseY + offsetY } };
    }
    return t;
  });

  // Clean up any 1-member leftover groups and cleanly re-layout multi-member remainders
  for (const gid of affectedGroupIds) {
    const remaining = next.filter((t) => isTileActive(t) && t.groupId === gid);
    if (remaining.length === 1) {
      next = next.map((t) => (t.groupId === gid ? { ...t, groupId: null } : t));
    } else if (remaining.length >= 2) {
      const anchorX = Math.min(...remaining.map((m) => m.position.x));
      const anchorY = Math.min(...remaining.map((m) => m.position.y));
      next = layoutSnappedGroup(next, gid, anchorX, anchorY, boardWidth, boardHeight);
    }
  }

  const term = getTermSymbol(b.type);
  return {
    valid: true,
    tiles: next,
    zeroPairId,
    explanation: `Tiles +${term} and −${term} are stacked as a Zero Pair! Click "Match Zero Pairs" to cancel (= 0) or "Separate" to unstack.`,
  };
}

export function moveZeroPairByDelta(
  tiles: Tile[],
  zeroPairId: string,
  rawDx: number,
  rawDy: number,
  boardWidth = 540,
  boardHeight = 340
): Tile[] {
  const members = tiles.filter((t) => t.zeroPairId === zeroPairId);
  if (members.length === 0) return tiles;

  const minX = Math.min(...members.map((m) => m.position.x));
  const minY = Math.min(...members.map((m) => m.position.y));
  const maxX = Math.max(...members.map((m) => m.position.x + getTileSize(m.type).width));
  const maxY = Math.max(...members.map((m) => m.position.y + getTileSize(m.type).height));

  const minAllowedDx = 10 - minX;
  const maxAllowedDx = Math.max(minAllowedDx, boardWidth - 10 - maxX);
  const minAllowedDy = 32 - minY;
  const maxAllowedDy = Math.max(minAllowedDy, boardHeight - 10 - maxY);

  const dx = Math.max(minAllowedDx, Math.min(maxAllowedDx, rawDx));
  const dy = Math.max(minAllowedDy, Math.min(maxAllowedDy, rawDy));

  return tiles.map((t) =>
    t.zeroPairId === zeroPairId
      ? { ...t, position: { x: Math.round(t.position.x + dx), y: Math.round(t.position.y + dy) } }
      : t
  );
}

export function separateZeroPair(
  tiles: Tile[],
  zeroPairId: string,
  boardWidth = 540,
  boardHeight = 340
): { tiles: Tile[]; explanation: string } {
  const members = tiles.filter((t) => t.zeroPairId === zeroPairId);
  if (members.length === 0) {
    return { tiles, explanation: 'Zero pair not found.' };
  }
  const pos = members.find((t) => t.sign === 1) || members[0];
  const neg = members.find((t) => t.id !== pos.id) || members[1];
  const { width, height } = getTileSize(pos.type);
  const gap = 18;

  const startX = Math.max(12, Math.min(Math.max(12, boardWidth - width * 2 - gap - 12), pos.position.x));
  const startY = Math.max(16, Math.min(Math.max(16, boardHeight - height - 12), pos.position.y));

  const next = tiles.map((t) => {
    if (t.id === pos.id) {
      return { ...t, zeroPairId: null, position: { x: startX, y: startY } };
    }
    if (neg && t.id === neg.id) {
      return { ...t, zeroPairId: null, position: { x: startX + width + gap, y: startY } };
    }
    return t;
  });

  const term = getTermSymbol(pos.type);
  return {
    tiles: next,
    explanation: `Unstacked +${term} and −${term} back into two separate tiles.`,
  };
}

export function eliminateZeroPairStack(
  tiles: Tile[],
  zeroPairId: string
): { tiles: Tile[]; activeTiles: Tile[]; removedCount: number; explanation: string } {
  const members = tiles.filter((t) => isTileActive(t) && t.zeroPairId === zeroPairId);
  if (members.length === 0) {
    return {
      tiles,
      activeTiles: tiles.filter(isTileActive),
      removedCount: 0,
      explanation: 'Active zero pair not found.',
    };
  }
  const term = getTermSymbol(members[0].type);
  const next: Tile[] = tiles.map((t) =>
    isTileActive(t) && t.zeroPairId === zeroPairId
      ? { ...t, status: 'cancelled' as const, groupId: null }
      : t
  );
  const activeTiles = next.filter(isTileActive);

  return {
    tiles: next,
    activeTiles,
    removedCount: 1,
    explanation: `Nice! Zero pair +${term} and −${term} cancelled out (= 0). Both tiles are now faded and no longer counted; remaining active expression: ${formatExpression(
      next,
      true
    )}.`,
  };
}

export interface ZeroPairInspectionResult {
  mode: 'selected' | 'hover';
  kind: 'zero-pair' | 'cancelled';
  label: 'Zero Pair (= 0)' | 'Cancelled (= 0)';
  termLabel: string;
  zeroPairId: string | null;
  tileIds: string[];
  stack: ZeroPairStackView | null;
  canMatch: boolean;
  canSeparate: boolean;
  box: { x: number; y: number; width: number; height: number };
}

function computeTileGroupBox(groupTiles: Tile[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const minX = Math.min(...groupTiles.map((t) => t.position.x));
  const minY = Math.min(...groupTiles.map((t) => t.position.y));
  const maxX = Math.max(
    ...groupTiles.map((t) => t.position.x + getTileSize(t.type).width)
  );
  const maxY = Math.max(
    ...groupTiles.map((t) => t.position.y + getTileSize(t.type).height)
  );
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Resolves at most ONE contextual Zero Pair / Cancelled inspection target for the canvas.
 * - Returns null when idle (no selection, no hover) or when a non-pair active tile is inspected.
 * - Selected valid pair takes precedence over hover so multiple labels never appear simultaneously.
 */
export function resolveZeroPairInspection(
  tiles: Tile[],
  selectedIds: string[],
  hoveredTileId: string | null,
  zeroPairStacksInput?: ZeroPairStackView[]
): ZeroPairInspectionResult | null {
  const stacks = zeroPairStacksInput ?? computeZeroPairStacks(tiles);

  const inspectSingleTileId = (
    tileId: string,
    mode: 'selected' | 'hover'
  ): ZeroPairInspectionResult | null => {
    const tile = tiles.find((t) => t.id === tileId);
    if (!tile) return null;

    if (!isTileActive(tile)) {
      const pairTiles = tile.zeroPairId
        ? tiles.filter((t) => !isTileActive(t) && t.zeroPairId === tile.zeroPairId)
        : [tile];
      const members = pairTiles.length > 0 ? pairTiles : [tile];
      const term = getTermSymbol(tile.type);
      return {
        mode,
        kind: 'cancelled',
        label: 'Cancelled (= 0)',
        termLabel:
          members.length >= 2
            ? `+${term} + (−${term}) = 0 (cancelled)`
            : `${tile.sign === 1 ? '+' : '−'}${term} (cancelled)`,
        zeroPairId: tile.zeroPairId || null,
        tileIds: members.map((m) => m.id),
        stack: null,
        canMatch: false,
        canSeparate: false,
        box: computeTileGroupBox(members),
      };
    }

    if (tile.zeroPairId) {
      const stack = stacks.find((s) => s.zeroPairId === tile.zeroPairId);
      if (!stack) return null;
      return {
        mode,
        kind: 'zero-pair',
        label: 'Zero Pair (= 0)',
        termLabel: stack.label,
        zeroPairId: stack.zeroPairId,
        tileIds: [stack.positiveTile.id, stack.negativeTile.id],
        stack,
        canMatch: true,
        canSeparate: true,
        box: { x: stack.x, y: stack.y, width: stack.width, height: stack.height },
      };
    }

    return null;
  };

  // 1. Check active selection first
  if (selectedIds.length === 1) {
    const selectedHit = inspectSingleTileId(selectedIds[0], 'selected');
    if (selectedHit) return selectedHit;
  } else if (selectedIds.length >= 2) {
    const selectedTiles = selectedIds
      .map((sid) => tiles.find((t) => t.id === sid))
      .filter((t): t is Tile => Boolean(t));

    if (selectedTiles.length >= 2) {
      const allActive = selectedTiles.every((t) => isTileActive(t));
      const first = selectedTiles[0];
      const sameType = selectedTiles.every((t) => t.type === first.type);
      const posCount = selectedTiles.filter((t) => t.sign === 1).length;
      const negCount = selectedTiles.filter((t) => t.sign === -1).length;

      if (allActive && sameType && posCount > 0 && negCount > 0) {
        if (
          selectedTiles.length === 2 &&
          first.zeroPairId &&
          first.zeroPairId === selectedTiles[1].zeroPairId
        ) {
          const stackHit = inspectSingleTileId(first.id, 'selected');
          if (stackHit) return stackHit;
        }
        const term = getTermSymbol(first.type);
        const matchedPairs = Math.min(posCount, negCount);
        const net = posCount - negCount;
        const remainderLabel =
          net === 0
            ? '0'
            : net === 1
            ? term
            : net === -1
            ? `−${term}`
            : net > 0
            ? `${net}${term}`
            : `−${Math.abs(net)}${term}`;
        const termLabel =
          selectedTiles.length === 2
            ? `+${term} + (−${term}) = 0`
            : `${matchedPairs} pair${matchedPairs > 1 ? 's' : ''} (= 0) → ${remainderLabel}`;

        return {
          mode: 'selected',
          kind: 'zero-pair',
          label: 'Zero Pair (= 0)',
          termLabel,
          zeroPairId: null,
          tileIds: selectedTiles.map((t) => t.id),
          stack: null,
          canMatch: true,
          canSeparate: false,
          box: computeTileGroupBox(selectedTiles),
        };
      }

      if (selectedTiles.length === 2 && selectedTiles.every((t) => !isTileActive(t))) {
        const hit = inspectSingleTileId(first.id, 'selected');
        if (hit) return hit;
      }
    }
  }

  // 2. Fall back to desktop mouse hover only when no zero-pair selection is active
  if (hoveredTileId) {
    return inspectSingleTileId(hoveredTileId, 'hover');
  }

  return null;
}

