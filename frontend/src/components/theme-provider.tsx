"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = "dark" }: { children: ReactNode; defaultTheme?: Theme }) {
    const [theme, setThemeState] = useState<Theme>(defaultTheme);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(newTheme);
        localStorage.setItem("theme", newTheme);
    };

    useEffect(() => {
        const stored = localStorage.getItem("theme") as Theme | null;
        const initialTheme = stored || defaultTheme;
        setThemeState(initialTheme);
        document.documentElement.classList.add(initialTheme);
    }, [defaultTheme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
