import { ExpressionSummary, Tile, TileSign, TileType } from '../types/algebra';

let tileCounter = 0;

export function createTileId(prefix = 'tile'): string {
  tileCounter += 1;
  return `${prefix}-${Date.now()}-${tileCounter}`;
}

export function createTile(
  type: TileType,
  sign: TileSign,
  position = { x: 24, y: 24 },
  groupId: string | null = null
): Tile {
  return {
    id: createTileId(type),
    type,
    sign,
    position,
    groupId,
  };
}

export function createTilesFromSpec(
  specs: Array<{ type: TileType; sign: TileSign; count: number }>,
  startX = 28,
  startY = 28,
  maxColumns = 6
): Tile[] {
  const result: Tile[] = [];
  const cols = Math.max(1, maxColumns);
  let col = 0;
  let row = 0;
  for (const spec of specs) {
    for (let i = 0; i < spec.count; i += 1) {
      const x = startX + (col % cols) * 86;
      const y = startY + row * 94;
      result.push(createTile(spec.type, spec.sign, { x, y }));
      col += 1;
      if (col % cols === 0) {
        row += 1;
      }
    }
  }
  return result;
}

export function summarizeTiles(tiles: Tile[]): ExpressionSummary {
  let posX2 = 0;
  let negX2 = 0;
  let posX = 0;
  let negX = 0;
  let posOne = 0;
  let negOne = 0;

  for (const tile of tiles) {
    if (tile.type === 'x2') {
      if (tile.sign === 1) posX2 += 1;
      else negX2 += 1;
    } else if (tile.type === 'x') {
      if (tile.sign === 1) posX += 1;
      else negX += 1;
    } else {
      if (tile.sign === 1) posOne += 1;
      else negOne += 1;
    }
  }

  return {
    x2: posX2 - negX2,
    x: posX - negX,
    constant: posOne - negOne,
    posX2,
    negX2,
    posX,
    negX,
    posOne,
    negOne,
  };
}

export function formatSummaryToExpression(summary: Pick<ExpressionSummary, 'x2' | 'x' | 'constant'>): string {
  const parts: string[] = [];

  const appendTerm = (coeff: number, symbol: string) => {
    if (coeff === 0) return;
    const abs = Math.abs(coeff);
    const isFirst = parts.length === 0;
    const signStr = coeff > 0 ? (isFirst ? '' : ' + ') : isFirst ? '−' : ' − ';

    if (symbol === '') {
      parts.push(`${signStr}${abs}`);
    } else {
      parts.push(`${signStr}${abs === 1 ? '' : abs}${symbol}`);
    }
  };

  appendTerm(summary.x2, 'x²');
  appendTerm(summary.x, 'x');
  appendTerm(summary.constant, '');

  return parts.length === 0 ? '0' : parts.join('');
}

export function formatRawExpression(tiles: Tile[]): string {
  if (tiles.length === 0) return '0';
  const summary = summarizeTiles(tiles);
  const chunks: string[] = [];

  const pushChunk = (count: number, sign: '+' | '−', label: string) => {
    if (count <= 0) return;
    const isFirst = chunks.length === 0;
    const termText = label === '1' ? `${count}` : `${count === 1 ? '' : count}${label}`;
    if (isFirst) {
      chunks.push(sign === '+' ? termText : `−${termText}`);
    } else {
      chunks.push(sign === '+' ? `+ ${termText}` : `− ${termText}`);
    }
  };

  pushChunk(summary.posX2, '+', 'x²');
  pushChunk(summary.negX2, '−', 'x²');
  pushChunk(summary.posX, '+', 'x');
  pushChunk(summary.negX, '−', 'x');
  pushChunk(summary.posOne, '+', '1');
  pushChunk(summary.negOne, '−', '1');

  return chunks.join(' ');
}

export function formatExpression(tiles: Tile[], simplified = true): string {
  if (tiles.length === 0) return '0';
  if (!simplified) {
    return formatRawExpression(tiles);
  }
  const summary = summarizeTiles(tiles);
  return formatSummaryToExpression(summary);
}

export function canFormZeroPair(a: Tile, b: Tile): boolean {
  return a.id !== b.id && a.type === b.type && a.sign === -b.sign;
}

export function findZeroPairs(tiles: Tile[]): Array<[Tile, Tile]> {
  const pairs: Array<[Tile, Tile]> = [];
  const usedIds = new Set<string>();
  const types: TileType[] = ['x2', 'x', '1'];

  for (const type of types) {
    const positives = tiles.filter((t) => t.type === type && t.sign === 1 && !usedIds.has(t.id));
    const negatives = tiles.filter((t) => t.type === type && t.sign === -1 && !usedIds.has(t.id));
    const pairCount = Math.min(positives.length, negatives.length);
    for (let i = 0; i < pairCount; i += 1) {
      usedIds.add(positives[i].id);
      usedIds.add(negatives[i].id);
      pairs.push([positives[i], negatives[i]]);
    }
  }

  return pairs;
}

export interface ZeroPairEliminationResult {
  remainingTiles: Tile[];
  removedPairs: Array<[Tile, Tile]>;
  removedCount: number;
  explanation: string;
}

export function eliminateZeroPairs(tiles: Tile[]): ZeroPairEliminationResult {
  const pairs = findZeroPairs(tiles);
  if (pairs.length === 0) {
    return {
      remainingTiles: tiles,
      removedPairs: [],
      removedCount: 0,
      explanation:
        'Belum ada zero pair yang dapat dibentuk. Zero pair membutuhkan dua ubin dengan jenis suku yang sama tetapi tanda berlawanan (misalnya +x dan −x, atau +1 dan −1).',
    };
  }

  const removedIds = new Set<string>();
  for (const [a, b] of pairs) {
    removedIds.add(a.id);
    removedIds.add(b.id);
  }

  const remainingTiles = tiles.filter((t) => !removedIds.has(t.id));
  const pairLabels = pairs.map(([a]) => {
    const term = a.type === 'x2' ? 'x²' : a.type;
    return `+${term} + (−${term}) = 0`;
  });

  return {
    remainingTiles,
    removedPairs: pairs,
    removedCount: pairs.length,
    explanation: `Tepat! ${pairs.length} pasangan nol (zero pair) saling meniadakan: ${Array.from(
      new Set(pairLabels)
    ).join(', ')}. Ekspresi tersisa menjadi ${formatExpression(remainingTiles, true)}.`,
  };
}

export function eliminateSpecificZeroPair(
  tiles: Tile[],
  tileAId: string,
  tileBId: string
): ZeroPairEliminationResult {
  const tileA = tiles.find((t) => t.id === tileAId);
  const tileB = tiles.find((t) => t.id === tileBId);

  if (!tileA || !tileB || !canFormZeroPair(tileA, tileB)) {
    return {
      remainingTiles: tiles,
      removedPairs: [],
      removedCount: 0,
      explanation:
        'Kedua ubin tersebut belum membentuk zero pair. Zero pair hanya berlaku untuk ubin berjenis sama dengan tanda berlawanan (+ dan −).',
    };
  }

  const remainingTiles = tiles.filter((t) => t.id !== tileAId && t.id !== tileBId);
  const term = tileA.type === 'x2' ? 'x²' : tileA.type;

  return {
    remainingTiles,
    removedPairs: [[tileA, tileB]],
    removedCount: 1,
    explanation: `Tepat! Pasangan nol +${term} dan −${term} saling meniadakan (= 0). Ekspresi tersisa: ${formatExpression(
      remainingTiles,
      true
    )}.`,
  };
}

export interface TileClusterBadge {
  id: string;
  label: string;
  x: number;
  y: number;
  type: TileType;
  sign: TileSign;
  count: number;
}

/**
 * Finds groups of >= 2 tiles with the same type & sign that share a groupId
 * or sit closely together, so the workspace can display helpful group totals (e.g. "2x", "3", "−2x").
 */
export function computeTileClusters(tiles: Tile[]): TileClusterBadge[] {
  const byGroup = new Map<string, Tile[]>();

  for (const tile of tiles) {
    if (!tile.groupId) continue;
    const list = byGroup.get(tile.groupId) || [];
    list.push(tile);
    byGroup.set(tile.groupId, list);
  }

  const badges: TileClusterBadge[] = [];
  for (const [groupId, members] of byGroup.entries()) {
    if (members.length < 2) continue;
    const first = members[0];
    const allSame = members.every((m) => m.type === first.type && m.sign === first.sign);
    if (!allSame) continue;

    const minX = Math.min(...members.map((m) => m.position.x));
    const minY = Math.min(...members.map((m) => m.position.y));
    const net = first.sign * members.length;
    const label = formatSummaryToExpression({
      x2: first.type === 'x2' ? net : 0,
      x: first.type === 'x' ? net : 0,
      constant: first.type === '1' ? net : 0,
    });

    badges.push({
      id: groupId,
      label,
      x: minX,
      y: Math.max(4, minY - 22),
      type: first.type,
      sign: first.sign,
      count: members.length,
    });
  }

  return badges;
}

export interface LikeTermValidationResult {
  valid: boolean;
  termType?: TileType;
  resultExpression?: string;
  reason: string;
}

export function getTermLabel(type: TileType): string {
  if (type === 'x2') return 'x² (suku kuadrat)';
  if (type === 'x') return 'x (suku linear)';
  return '1 (konstanta)';
}

export function canCombineLikeTerms(tiles: Tile[]): LikeTermValidationResult {
  if (tiles.length === 0) {
    return {
      valid: false,
      reason: 'Pilih atau taruh minimal dua ubin terlebih dahulu untuk digabungkan.',
    };
  }

  const distinctTypes = Array.from(new Set(tiles.map((t) => t.type)));
  if (distinctTypes.length > 1) {
    const typeNames = distinctTypes.map(getTermLabel).join(' dan ');
    return {
      valid: false,
      reason: `Tidak dapat digabung sebagai suku sejenis! ${typeNames} mewakili suku yang berbeda. Hanya ubin dengan jenis suku yang sama yang boleh digabungkan.`,
    };
  }

  const onlyType = distinctTypes[0];
  const summary = summarizeTiles(tiles);
  const net =
    onlyType === 'x2' ? summary.x2 : onlyType === 'x' ? summary.x : summary.constant;
  const resultExpr = formatSummaryToExpression({
    x2: onlyType === 'x2' ? net : 0,
    x: onlyType === 'x' ? net : 0,
    constant: onlyType === '1' ? net : 0,
  });

  return {
    valid: true,
    termType: onlyType,
    resultExpression: resultExpr,
    reason: `Benar! Semua ubin yang dipilih merupakan suku sejenis (${getTermLabel(
      onlyType
    )}), sehingga hasilnya adalah ${resultExpr}.`,
  };
}

export function groupTilesByTerm(tiles: Tile[], workspaceWidth = 620): Tile[] {
  const order: Array<{ type: TileType; sign: TileSign }> = [
    { type: 'x2', sign: 1 },
    { type: 'x2', sign: -1 },
    { type: 'x', sign: 1 },
    { type: 'x', sign: -1 },
    { type: '1', sign: 1 },
    { type: '1', sign: -1 },
  ];

  const grouped: Tile[] = [];
  let cursorX = 24;
  let cursorY = 34;
  const rowHeight = 104;

  for (const bucket of order) {
    const matching = tiles.filter((t) => t.type === bucket.type && t.sign === bucket.sign);
    if (matching.length === 0) continue;

    if (cursorX > 24 && cursorX + matching.length * 76 > workspaceWidth) {
      cursorX = 24;
      cursorY += rowHeight;
    }

    for (const tile of matching) {
      const stepX = tile.type === 'x2' ? 88 : tile.type === 'x' ? 78 : 54;
      if (cursorX + stepX > workspaceWidth) {
        cursorX = 24;
        cursorY += rowHeight;
      }
      grouped.push({
        ...tile,
        groupId: `${bucket.type}-${bucket.sign}`,
        zeroPairId: null,
        position: { x: cursorX, y: cursorY },
      });
      cursorX += stepX;
    }
    cursorX += 20;
  }

  return grouped;
}

export function explainWorkspace(tiles: Tile[]): string {
  if (tiles.length === 0) {
    return 'Workspace masih kosong (bernilai 0). Pilih ubin dari panel untuk membangun ekspresi aljabar.';
  }

  const summary = summarizeTiles(tiles);
  const raw = formatRawExpression(tiles);
  const simplified = formatExpression(tiles, true);
  const pairs = findZeroPairs(tiles);

  const details: string[] = [];
  if (summary.posX2 + summary.negX2 > 0) {
    details.push(`Suku x²: ${summary.posX2} positif, ${summary.negX2} negatif (total ${summary.x2}x²)`);
  }
  if (summary.posX + summary.negX > 0) {
    details.push(`Suku x: ${summary.posX} positif, ${summary.negX} negatif (total ${summary.x}x)`);
  }
  if (summary.posOne + summary.negOne > 0) {
    details.push(`Konstanta: ${summary.posOne} positif (+1), ${summary.negOne} negatif (−1) (total ${summary.constant})`);
  }

  let pairNote = '';
  if (pairs.length > 0) {
    pairNote = ` Ditemukan ${pairs.length} zero pair yang dapat saling meniadakan.`;
  }

  if (raw !== simplified) {
    return `Susunan ubin saat ini merepresentasikan ${raw}. Setelah menggabungkan suku sejenis dan zero pair, bentuk sederhananya adalah ${simplified}. (${details.join('; ')}.${pairNote})`;
  }

  return `Susunan ubin merepresentasikan ${simplified}. (${details.join('; ')}.${pairNote})`;
}

export function explainSubtractionAsOpposite(
  termType: TileType,
  count: number
): string {
  const symbol = termType === 'x2' ? 'x²' : termType;
  const qty = count === 1 && termType !== '1' ? symbol : `${count}${termType === '1' ? '' : symbol}`;
  return `Pengurangan ${qty} sama dengan menambahkan lawannya, yaitu ${count} ubin −${symbol}.`;
}

export function areExpressionsEquivalent(
  tiles: Tile[],
  target: { x2: number; x: number; constant: number },
  requireNoZeroPairs = false
): { valid: boolean; reason: string } {
  const summary = summarizeTiles(tiles);
  const zeroPairs = findZeroPairs(tiles);

  const algebraMatches =
    summary.x2 === target.x2 &&
    summary.x === target.x &&
    summary.constant === target.constant;

  if (!algebraMatches) {
    return {
      valid: false,
      reason: `Ekspresi saat ini masih ${formatSummaryToExpression(
        summary
      )}, sedangkan targetnya adalah ${formatSummaryToExpression(target)}. Periksa kembali jumlah ubin tiap suku dan tandanya.`,
    };
  }

  if (requireNoZeroPairs && zeroPairs.length > 0) {
    return {
      valid: false,
      reason: `Nilai ekspresi sudah setara (${formatSummaryToExpression(
        target
      )}), tetapi masih ada ${zeroPairs.length} zero pair yang belum disederhanakan. Klik "Pasangkan Zero Pair" untuk menyederhanakannya.`,
    };
  }

  return {
    valid: true,
    reason: `Tepat! Susunan ubin membentuk ${formatSummaryToExpression(target)} secara akurat.`,
  };
}
