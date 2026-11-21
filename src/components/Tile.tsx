import React from 'react';
import { Tile as TileModel, TileSign, TileType } from '../types/algebra';

interface TileVisualProps {
  type: TileType;
  sign: TileSign;
  selected?: boolean;
  zeroPairHighlight?: boolean;
  groupHighlight?: boolean;
  stackRole?: 'back' | 'front' | null;
  compact?: boolean;
  touchActionNone?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export function getTileLabel(type: TileType, sign: TileSign): string {
  const s = sign === 1 ? '+' : '−';
  const term = type === 'x2' ? 'x²' : type;
  return `${s}${term}`;
}

export function getTileDimensions(type: TileType, compact = false): { width: number; height: number } {
  if (compact) {
    if (type === 'x2') return { width: 52, height: 52 };
    if (type === 'x') return { width: 62, height: 34 };
    return { width: 40, height: 40 };
  }
  if (type === 'x2') return { width: 78, height: 78 };
  if (type === 'x') return { width: 76, height: 44 };
  return { width: 46, height: 46 };
}

export function getTileColors(type: TileType, sign: TileSign): {
  fill: string;
  stroke: string;
  badgeText: string;
} {
  if (sign === 1) {
    if (type === '1') {
      return {
        fill: '#1E8E82',
        stroke: '#156B62',
        badgeText: '#FFFFFF',
      };
    }
    return {
      fill: '#2B72C4',
      stroke: '#1E5494',
      badgeText: '#FFFFFF',
    };
  }
  if (type === '1') {
    return {
      fill: '#C94438',
      stroke: '#9B2F25',
      badgeText: '#FFFFFF',
    };
  }
  return {
    fill: '#D96A27',
    stroke: '#A84E17',
    badgeText: '#FFFFFF',
  };
}

export const TileVisual: React.FC<TileVisualProps> = ({
  type,
  sign,
  selected = false,
  zeroPairHighlight = false,
  groupHighlight = false,
  stackRole = null,
  compact = false,
  touchActionNone = false,
  onClick,
  onPointerDown,
  className = '',
  style,
  ariaLabel,
}) => {
  const { width, height } = getTileDimensions(type, compact);
  const { fill, stroke, badgeText } = getTileColors(type, sign);
  const label = getTileLabel(type, sign);
  const rx = 8;
  const isBackStack = stackRole === 'back';

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      aria-label={ariaLabel || `Ubin ${label}`}
      aria-pressed={selected}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        touchAction: touchActionNone ? 'none' : undefined,
        ...style,
      }}
      className={`group relative inline-flex items-center justify-center select-none rounded-lg transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39286F] ${
        selected ? 'ring-3 ring-[#39286F] ring-offset-2 scale-[1.03]' : 'hover:scale-[1.02]'
      } ${zeroPairHighlight ? 'ring-3 ring-[#F4C95D] ring-offset-1' : ''} ${
        groupHighlight ? 'ring-3 ring-[#27A89A] ring-offset-2' : ''
      } ${stackRole === 'front' ? 'ring-2 ring-white shadow-md' : ''} ${className}`}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block drop-shadow-xs pointer-events-none"
        aria-hidden="true"
      >
        <rect
          x={1.5}
          y={1.5}
          width={width - 3}
          height={height - 3}
          rx={rx}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
        />
        <rect
          x={4}
          y={4}
          width={width - 8}
          height={Math.max(6, Math.round(height * 0.18))}
          rx={4}
          fill="rgba(255,255,255,0.16)"
        />
        <text
          x={isBackStack ? 8 : width / 2}
          y={isBackStack ? 16 : height / 2 + (compact ? 4 : 5)}
          textAnchor={isBackStack ? 'start' : 'middle'}
          fill={badgeText}
          fontFamily="'IBM Plex Mono', monospace"
          fontWeight="700"
          fontSize={
            isBackStack
              ? 12
              : compact
              ? type === '1'
                ? 12
                : 13
              : type === 'x2'
              ? 18
              : 15
          }
        >
          {label}
        </text>
      </svg>
    </button>
  );
};

interface DraggableWorkspaceTileProps {
  tile: TileModel;
  selected: boolean;
  zeroPairHighlight: boolean;
  dropHighlight?: 'zeropair' | 'group' | 'mismatch' | null;
  stackRole?: 'back' | 'front' | null;
  onSelect: (id: string, multi: boolean) => void;
  onDragStart?: (id: string) => void;
  onDragMove?: (id: string, x: number, y: number) => void;
  onDragEnd?: (id: string, x: number, y: number, wasMoved: boolean) => void;
  onDragDelta?: (id: string, dx: number, dy: number) => void;
  onDragDeltaEnd?: (id: string, dx: number, dy: number, wasMoved: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  snapToGrid: boolean;
}

export const WorkspaceTileItem: React.FC<DraggableWorkspaceTileProps> = ({
  tile,
  selected,
  zeroPairHighlight,
  dropHighlight = null,
  stackRole = null,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragDelta,
  onDragDeltaEnd,
  containerRef,
  snapToGrid,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isTouchDrag, setIsTouchDrag] = React.useState(false);

  const dragRef = React.useRef<{
    active: boolean;
    moved: boolean;
    pointerId: number | null;
    startClientX: number;
    startClientY: number;
    offsetX: number;
    offsetY: number;
    lastX: number;
    lastY: number;
    lastDx: number;
    lastDy: number;
  }>({
    active: false,
    moved: false,
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    offsetX: 0,
    offsetY: 0,
    lastX: tile.position.x,
    lastY: tile.position.y,
    lastDx: 0,
    lastDy: 0,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;

    e.stopPropagation();
    const targetEl = e.currentTarget as HTMLElement;
    try {
      targetEl.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unavailable in synthetic environments
    }

    const rect = container.getBoundingClientRect();
    const touch = e.pointerType === 'touch';
    setIsTouchDrag(touch);

    dragRef.current = {
      active: true,
      moved: false,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      offsetX: e.clientX - rect.left - tile.position.x,
      offsetY: e.clientY - rect.top - tile.position.y,
      lastX: tile.position.x,
      lastY: tile.position.y,
      lastDx: 0,
      lastDy: 0,
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };

    const computeCoords = (clientX: number, clientY: number) => {
      const cRect = containerRef.current?.getBoundingClientRect();
      if (!cRect) return { x: dragRef.current.lastX, y: dragRef.current.lastY };
      const { width, height } = getTileDimensions(tile.type);
      const liftY = touch ? 14 : 0;
      let nextX = clientX - cRect.left - dragRef.current.offsetX;
      let nextY = clientY - cRect.top - dragRef.current.offsetY - liftY;

      nextX = Math.max(8, Math.min(Math.max(8, cRect.width - width - 8), nextX));
      nextY = Math.max(8, Math.min(Math.max(8, cRect.height - height - 8), nextY));

      if (snapToGrid && !tile.groupId && !tile.zeroPairId) {
        nextX = Math.round(nextX / 12) * 12;
        nextY = Math.round(nextY / 12) * 12;
      }
      return { x: nextX, y: nextY };
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current.active) return;
      if (dragRef.current.pointerId !== null && moveEvent.pointerId !== dragRef.current.pointerId) {
        return;
      }

      const dist = Math.hypot(
        moveEvent.clientX - dragRef.current.startClientX,
        moveEvent.clientY - dragRef.current.startClientY
      );

      if (!dragRef.current.moved && dist <= 6) {
        return;
      }

      if (!dragRef.current.moved) {
        dragRef.current.moved = true;
        setIsDragging(true);
        onDragStart?.(tile.id);
      }

      const liftY = touch ? 14 : 0;
      const dx = moveEvent.clientX - dragRef.current.startClientX;
      const dy = moveEvent.clientY - dragRef.current.startClientY - liftY;
      dragRef.current.lastDx = dx;
      dragRef.current.lastDy = dy;

      if (onDragDelta) {
        onDragDelta(tile.id, dx, dy);
      } else {
        const { x, y } = computeCoords(moveEvent.clientX, moveEvent.clientY);
        dragRef.current.lastX = x;
        dragRef.current.lastY = y;
        onDragMove?.(tile.id, x, y);
      }
    };

    const finishDrag = (endEvent: PointerEvent, cancelled = false) => {
      if (!dragRef.current.active) return;
      const wasMoved = dragRef.current.moved;
      dragRef.current.active = false;
      setIsDragging(false);
      setIsTouchDrag(false);
      cleanup();

      try {
        targetEl.releasePointerCapture(endEvent.pointerId);
      } catch {
        // Ignore
      }

      if (wasMoved && !cancelled) {
        if (onDragDeltaEnd) {
          onDragDeltaEnd(tile.id, dragRef.current.lastDx, dragRef.current.lastDy, true);
        } else {
          onDragEnd?.(tile.id, dragRef.current.lastX, dragRef.current.lastY, true);
        }
      } else if (wasMoved && cancelled) {
        if (onDragDeltaEnd) {
          onDragDeltaEnd(tile.id, 0, 0, false);
        } else {
          onDragEnd?.(tile.id, tile.position.x, tile.position.y, false);
        }
      } else if (!cancelled) {
        onSelect(tile.id, endEvent.shiftKey || endEvent.metaKey || endEvent.ctrlKey);
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => finishDrag(upEvent, false);
    const handlePointerCancel = (cancelEvent: PointerEvent) => finishDrag(cancelEvent, true);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
  };

  return (
    <div
      data-tile-id={tile.id}
      data-group-id={tile.groupId || undefined}
      data-zero-pair-id={tile.zeroPairId || undefined}
      style={{
        position: 'absolute',
        left: `${tile.position.x}px`,
        top: `${tile.position.y}px`,
        touchAction: 'none',
        zIndex: isDragging ? 45 : stackRole === 'front' ? 16 : stackRole === 'back' ? 12 : 10,
      }}
      className={`select-none ${
        isDragging
          ? isTouchDrag
            ? 'scale-105 drop-shadow-lg'
            : 'scale-[1.03] drop-shadow-md'
          : ''
      }`}
    >
      <TileVisual
        type={tile.type}
        sign={tile.sign}
        selected={selected}
        stackRole={stackRole}
        touchActionNone
        zeroPairHighlight={zeroPairHighlight || dropHighlight === 'zeropair'}
        groupHighlight={dropHighlight === 'group'}
        onPointerDown={handlePointerDown}
        onClick={(e) => {
          e.stopPropagation();
          if (e.detail === 0) {
            onSelect(tile.id, e.shiftKey || e.metaKey || e.ctrlKey);
          }
        }}
        className={`cursor-grab active:cursor-grabbing ${
          dropHighlight === 'mismatch' ? 'ring-3 ring-[#C94438] ring-offset-2' : ''
        }`}
        ariaLabel={`Ubin ${getTileLabel(tile.type, tile.sign)} di papan`}
      />
    </div>
  );
};
