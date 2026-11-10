"use client";

// RightPanel — 3rd pane in the OrGanap 3-pane layout, docked to the right edge.
import * as React from "react";
import {
  PanelRightClose,
  PanelRightOpen,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Chip } from "@heroui/react";
import clsx from "clsx";

import {
  useRightPanelRender,
  useRightPanelLayout,
  PANEL_WIDTHS,
  MIN_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
  COLLAPSE_THRESHOLD,
  SNAP_THRESHOLD,
  PanelWidthPreset,
} from "@/contexts/right_panel_context";
import { useAuth } from "@/contexts/auth_context";

function ResizerHandle({
  onPointerDown,
  onDoubleClick,
  width,
  isDragging,
  isCollapsed,
}: {
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
  width: number;
  isDragging: boolean;
  isCollapsed: boolean;
}) {
  return (
    <div
      aria-label="Resize right panel"
      aria-orientation="vertical"
      aria-valuemax={MAX_PANEL_WIDTH}
      aria-valuemin={MIN_PANEL_WIDTH}
      aria-valuenow={isCollapsed ? 0 : width}
      className="absolute -left-3 top-0 bottom-0 w-6 z-20 cursor-col-resize flex items-center justify-center select-none group touch-none focus-visible:outline-none"
      role="separator"
      tabIndex={0}
      title="Drag to resize (double-click to cycle presets)"
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
    >
      <div
        className={clsx(
          "w-1 rounded-full transition-all duration-150",
          isDragging
            ? "bg-accent h-16 w-1.5 shadow-sm"
            : "bg-border h-8 group-hover:bg-accent group-hover:h-12 group-focus-visible:bg-accent group-focus-visible:h-12",
        )}
      />
    </div>
  );
}

function DefaultRightPanelContent() {
  const { user } = useAuth();

  return (
    <div
      className="flex flex-col gap-4 p-4 overflow-y-auto flex-1 scrollbar-none no-scrollbar"
      data-scrollbar="none"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {/* Institution Calendar & Term Banner */}
      <div className="p-4 rounded-2xl bg-surface border border-border/40 shadow-xs flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Academic Term</span>
          <Chip className="text-[10px]" size="sm" variant="soft">Active</Chip>
        </div>
        <p className="text-sm font-semibold text-foreground">AY 2026–2027 • 1st Semester</p>
        <span className="text-xs text-muted flex items-center gap-1.5">
          <Clock className="text-accent" size={13} />
          Proposals require ≥ 7 days advance lead
        </span>
      </div>

      {/* Permissions / Group Status */}
      <div className="mt-auto pt-3 border-t border-border/30 flex flex-col gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted px-1">Active Privileges</span>
        <div className="flex flex-wrap gap-1.5">
          {user?.isSuperuser && (
            <Chip className="bg-danger/10 text-danger border border-danger/20 text-[10px]" size="sm" variant="soft">
              <ShieldCheck className="mr-1 inline" size={11} />
              Superuser
            </Chip>
          )}
          {user?.groups?.map((g) => (
            <Chip key={g} className="text-[10px]" size="sm" variant="soft">
              {g}
            </Chip>
          ))}
          {!user?.isSuperuser && !user?.groups?.length && (
            <Chip className="text-[10px]" size="sm" variant="soft">
              Standard Attendee
            </Chip>
          )}
        </div>
      </div>
    </div>
  );
}

export function RightPanel() {
  const render = useRightPanelRender();
  const {
    width,
    setWidth,
    isCollapsed,
    setIsCollapsed,
    toggleCollapse,
    preset,
    setPreset,
    isDragging,
    setIsDragging,
  } = useRightPanelLayout();

  const cleanupListenersRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    return () => {
      if (cleanupListenersRef.current) {
        cleanupListenersRef.current();
      }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {}

    const startX = e.clientX;
    const startWidth = isCollapsed ? PANEL_WIDTHS.small : width;

    if (isCollapsed) {
      setIsCollapsed(false);
    }
    setIsDragging(true);

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    let latestClampedWidth = startWidth;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const rawWidth = startWidth + deltaX;

      let snappedWidth = rawWidth;

      for (const presetKey of Object.keys(PANEL_WIDTHS) as PanelWidthPreset[]) {
        const targetW = PANEL_WIDTHS[presetKey];

        if (Math.abs(rawWidth - targetW) <= SNAP_THRESHOLD) {
          snappedWidth = targetW;
          break;
        }
      }

      const clamped = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, snappedWidth));

      latestClampedWidth = clamped;
      setWidth(clamped);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      cleanupListenersRef.current = null;

      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      setIsDragging(false);

      const totalDeltaX = startX - upEvent.clientX;
      const finalRawWidth = startWidth + totalDeltaX;

      if (finalRawWidth < COLLAPSE_THRESHOLD) {
        setIsCollapsed(true);

        return;
      }

      setWidth(latestClampedWidth);
    };

    cleanupListenersRef.current = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleDoubleClick = () => {
    if (preset === "small") setPreset("medium");
    else if (preset === "medium") setPreset("wide");
    else setPreset("small");
  };

  if (isCollapsed) {
    return (
      <aside
        aria-label="Right panel (collapsed)"
        className={clsx(
          "hidden md:flex flex-col shrink-0 sticky top-20 h-[calc(100vh-6rem)] w-12 bg-surface border border-border/40 rounded-3xl overflow-hidden relative shadow-xs transition-all duration-200",
        )}
      >
        <div className="flex flex-col items-center justify-between h-full">
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted rotate-90 whitespace-nowrap">
              Campus Hub
            </span>
          </div>
          <div className="p-2 sm:p-3 border-t border-border/30 w-full flex items-center justify-center bg-surface/50">
            <button
              aria-label="Expand panel"
              className="p-1.5 rounded-xl hover:bg-default/20 text-muted hover:text-foreground transition-colors cursor-pointer"
              title="Expand panel"
              type="button"
              onClick={toggleCollapse}
            >
              <PanelRightOpen size={17} />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Right panel"
      className={clsx(
        "hidden md:flex flex-col shrink-0 sticky top-20 h-[calc(100vh-6rem)] bg-surface border border-border/40 rounded-3xl overflow-hidden relative shadow-xs",
        !isDragging && "transition-[width] duration-200 ease-out",
      )}
      style={{ width }}
    >
      <ResizerHandle
        isCollapsed={false}
        isDragging={isDragging}
        width={width}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
      />

      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-border/30 h-[61px]">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Campus Hub
        </span>
      </div>

      {/* Panel Body */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {render ? render() : <DefaultRightPanelContent />}
      </div>

      {/* ── Footer with Collapse Button consistent with Sidebar ──── */}
      <div className="p-2 sm:p-3 border-t border-border/30 bg-surface/50 flex items-center justify-end">
        <button
          aria-label="Collapse right panel"
          className="p-1.5 rounded-xl hover:bg-default/20 text-muted hover:text-foreground transition-colors cursor-pointer"
          title="Collapse panel"
          type="button"
          onClick={toggleCollapse}
        >
          <PanelRightClose size={17} />
        </button>
      </div>
    </aside>
  );
}
