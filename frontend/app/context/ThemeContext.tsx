"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEME_STORAGE_KEY = "app_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Apply theme to HTML and document.body
  const applyThemeToDOM = (targetTheme: Theme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-theme", targetTheme);
    if (targetTheme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
      document.body.classList.remove("dark");
      document.body.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
      document.body.classList.remove("light");
      document.body.classList.add("dark");
    }
  };

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      const initialTheme: Theme = savedTheme === "light" ? "light" : "dark";
      setThemeState(initialTheme);
      applyThemeToDOM(initialTheme);
    } catch {
      applyThemeToDOM("dark");
    } finally {
      setMounted(true);
    }

    // Listen to storage events for multi-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && (e.newValue === "dark" || e.newValue === "light")) {
        setThemeState(e.newValue);
        applyThemeToDOM(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.error("Failed to save theme in localStorage:", e);
    }
    applyThemeToDOM(newTheme);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === "dark",
        isLight: theme === "light",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return safe fallback if used outside provider
    return {
      theme: "dark" as Theme,
      setTheme: () => {},
      toggleTheme: () => {},
      isDark: true,
      isLight: false,
    };
  }
  return context;
}
