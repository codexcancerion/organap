"use client";

// RightPanelContext — derived from Voxsels for 3-pane layout management.
import * as React from "react";
import { usePathname } from "next/navigation";

export type PanelWidthPreset = "small" | "medium" | "wide";

export const PANEL_WIDTHS: Record<PanelWidthPreset, number> = {
  small: 300,
  medium: 380,
  wide: 480,
};

export const MIN_PANEL_WIDTH = 280;
export const MAX_PANEL_WIDTH = 560;
export const COLLAPSE_THRESHOLD = 260;
export const SNAP_THRESHOLD = 20;

export function getNearestPreset(w: number): PanelWidthPreset {
  const diffSmall = Math.abs(w - PANEL_WIDTHS.small);
  const diffMedium = Math.abs(w - PANEL_WIDTHS.medium);
  const diffWide = Math.abs(w - PANEL_WIDTHS.wide);

  if (diffSmall <= diffMedium && diffSmall <= diffWide) return "small";
  if (diffMedium <= diffSmall && diffMedium <= diffWide) return "medium";

  return "wide";
}

type RightPanelRender = () => React.ReactNode;

type RightPanelEntry = {
  fn: RightPanelRender;
  pathname: string | null;
};

export type RightPanelLayoutContextValue = {
  width: number;
  setWidth: (width: number | ((prev: number) => number)) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toggleCollapse: () => void;
  expandPanel: () => void;
  collapsePanel: () => void;
  preset: PanelWidthPreset;
  setPreset: (preset: PanelWidthPreset) => void;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
};

export type RightPanelContextValue = {
  render: RightPanelRender | null;
  setRender: (fn: RightPanelRender | null) => void;
} & RightPanelLayoutContextValue;

const RenderContext = React.createContext<RightPanelRender | null>(null);
const SetRenderContext = React.createContext<(fn: RightPanelRender | null) => void>(() => {});

const defaultLayoutValue: RightPanelLayoutContextValue = {
  width: PANEL_WIDTHS.small,
  setWidth: () => {},
  isCollapsed: false,
  setIsCollapsed: () => {},
  toggleCollapse: () => {},
  expandPanel: () => {},
  collapsePanel: () => {},
  preset: "small",
  setPreset: () => {},
  isDragging: false,
  setIsDragging: () => {},
};

const LayoutContext = React.createContext<RightPanelLayoutContextValue>(defaultLayoutValue);

export function RightPanelProvider({
  children,
  defaultWidth = PANEL_WIDTHS.small,
  defaultCollapsed = false,
}: {
  children: React.ReactNode;
  defaultWidth?: number;
  defaultCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const [entry, setEntry] = React.useState<RightPanelEntry | null>(null);

  const [width, setWidthState] = React.useState<number>(defaultWidth);
  const [isCollapsed, setIsCollapsedState] = React.useState<boolean>(defaultCollapsed);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);

  // SSR hydration from localStorage
  React.useEffect(() => {
    try {
      const storedWidth = localStorage.getItem("organap-right-panel-width");
      const storedCollapsed = localStorage.getItem("organap-right-panel-collapsed");

      if (storedWidth) {
        const parsed = Number(storedWidth);

        if (!isNaN(parsed) && parsed >= MIN_PANEL_WIDTH && parsed <= MAX_PANEL_WIDTH) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setWidthState(parsed);
        }
      }
      if (storedCollapsed !== null) {
         
        setIsCollapsedState(storedCollapsed === "true");
      }
    } catch {
      // localStorage may fail in restricted environments
    }
  }, []);

  const setWidth = React.useCallback((val: number | ((prev: number) => number)) => {
    setWidthState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;

      try {
        localStorage.setItem("organap-right-panel-width", String(next));
      } catch {}

      return next;
    });
  }, []);

  const setIsCollapsed = React.useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsedState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;

      try {
        localStorage.setItem("organap-right-panel-collapsed", String(next));
      } catch {}

      return next;
    });
  }, []);

  const expandPanel = React.useCallback(() => {
    setIsCollapsed(false);
  }, [setIsCollapsed]);

  const collapsePanel = React.useCallback(() => {
    setIsCollapsed(true);
  }, [setIsCollapsed]);

  const toggleCollapse = React.useCallback(() => {
    setIsCollapsedState((prev) => {
      const next = !prev;

      try {
        localStorage.setItem("organap-right-panel-collapsed", String(next));
      } catch {}

      return next;
    });
  }, []);

  const setPreset = React.useCallback((p: PanelWidthPreset) => {
    const targetWidth = PANEL_WIDTHS[p];

    setWidthState(targetWidth);
    setIsCollapsedState(false);
    try {
      localStorage.setItem("organap-right-panel-width", String(targetWidth));
      localStorage.setItem("organap-right-panel-collapsed", "false");
    } catch {}
  }, []);

  const preset = React.useMemo(() => {
    return getNearestPreset(width);
  }, [width]);

  const setRender = React.useCallback(
    (fn: RightPanelRender | null) => {
      if (!fn) {
        setEntry(null);
      } else {
        setEntry({
          fn,
          pathname,
        });
      }
    },
    [pathname],
  );

  const activeRender = React.useMemo(() => {
    if (!entry) return null;
    if (entry.pathname !== null && pathname !== null && entry.pathname !== pathname) {
      return null;
    }

    return entry.fn;
  }, [entry, pathname]);

  const layoutValue = React.useMemo<RightPanelLayoutContextValue>(
    () => ({
      width,
      setWidth,
      isCollapsed,
      setIsCollapsed,
      toggleCollapse,
      expandPanel,
      collapsePanel,
      preset,
      setPreset,
      isDragging,
      setIsDragging,
    }),
    [
      width,
      setWidth,
      isCollapsed,
      setIsCollapsed,
      toggleCollapse,
      expandPanel,
      collapsePanel,
      preset,
      setPreset,
      isDragging,
      setIsDragging,
    ],
  );

  return (
    <SetRenderContext.Provider value={setRender}>
      <RenderContext.Provider value={activeRender}>
        <LayoutContext.Provider value={layoutValue}>
          {children}
        </LayoutContext.Provider>
      </RenderContext.Provider>
    </SetRenderContext.Provider>
  );
}

export function useRightPanelRender(): RightPanelRender | null {
  return React.useContext(RenderContext);
}

export function useSetRightPanel(): (fn: RightPanelRender | null) => void {
  return React.useContext(SetRenderContext);
}

export function useRightPanelLayout(): RightPanelLayoutContextValue {
  return React.useContext(LayoutContext);
}

export function useRightPanel(): RightPanelContextValue {
  const render = React.useContext(RenderContext);
  const setRender = React.useContext(SetRenderContext);
  const layout = React.useContext(LayoutContext);

  return { render, setRender, ...layout };
}
