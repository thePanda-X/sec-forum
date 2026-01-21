/**
 * This file is entry point for React app, it sets up root
 * element and renders App component to DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./components/theme-provider";
import { App } from "./App";

function AppWithToaster() {
    const { theme } = useTheme();
    return (
        <>
            <App />
            <Toaster 
                theme={theme}
                richColors 
                closeButton
                position="bottom-right" 
                toastOptions={{
                    duration: 4000,
                    classNames: {
                        toast: 'group toast-with-progress',
                    },
                }}
            />
        </>
    );
}

const elem = document.getElementById("root");
const app = (
    <StrictMode>
        <BrowserRouter>
            <ThemeProvider defaultTheme="dark">
                <AuthProvider>
                    <AppWithToaster />
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>
);

if (import.meta.hot) {
    // With hot module reloading, `import.meta.hot.data` is persisted.
    const root = (import.meta.hot.data.root ??= createRoot(elem));
    root.render(app);
} else {
    // The hot module reloading API is not available in production.
    createRoot(elem).render(app);
}
