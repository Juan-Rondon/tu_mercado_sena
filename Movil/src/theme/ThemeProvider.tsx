import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { appColors, ThemeMode } from "./colors";

type ThemeContextType = {
  themeMode: ThemeMode;
  resolvedTheme: "light" | "dark";
  isDark: boolean;
  colors: typeof appColors.light;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const THEME_STORAGE_KEY = "app_theme_mode";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (saved === "light" || saved === "dark") {
          setThemeModeState(saved);
        } else {
          setThemeModeState("light");
        }
      } catch (error) {
        console.log("Error cargando tema:", error);
        setThemeModeState("light");
      } finally {
        setIsReady(true);
      }
    };

    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.log("Error guardando tema:", error);
    }
  };

  const resolvedTheme: "light" | "dark" = useMemo(() => {
    return themeMode === "dark" ? "dark" : "light";
  }, [themeMode]);

  const isDark = resolvedTheme === "dark";
  const colors = isDark ? appColors.dark : appColors.light;

  const value = useMemo(
    () => ({
      themeMode,
      resolvedTheme,
      isDark,
      colors,
      setThemeMode,
    }),
    [themeMode, resolvedTheme, isDark, colors]
  );

  if (!isReady) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme debe usarse dentro de ThemeProvider");
  }

  return context;
}