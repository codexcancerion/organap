"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import clsx from "clsx";
import { Sun, Moon } from "lucide-react";

export interface ThemeSwitchProps {
  className?: string;
}

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export const ThemeSwitch = ({ className }: ThemeSwitchProps) => {
  const { setTheme, resolvedTheme } = useTheme();
  const isMounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const isLight = resolvedTheme === "light";

  const handleToggle = () => {
    setTheme(isLight ? "dark" : "light");
  };

  if (!isMounted) return <div aria-hidden className="w-8 h-8" />;

  return (
    <button
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      className={clsx(
        "p-2 transition-colors hover:bg-default/20 rounded-xl cursor-pointer text-muted hover:text-foreground",
        "inline-flex items-center justify-center",
        className,
      )}
      onClick={handleToggle}
    >
      {isLight ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};
