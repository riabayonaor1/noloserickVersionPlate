"use client";

import React, { createContext, useContext, ReactNode } from 'react';

// Crear un contexto para el tema
const ThemeContext = createContext({});

interface ThemeProviderProps {
  children: ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  attribute = "data-theme",
  defaultTheme = "light",
  enableSystem = false,
  disableTransitionOnChange = false
}) => {
  // Aquí puedes definir la lógica del tema, como el estado del tema oscuro o claro
  const theme = {
    mode: defaultTheme, // Usar el tema por defecto
    attribute,
    enableSystem,
    disableTransitionOnChange
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);