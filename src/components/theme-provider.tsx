"use client";

import React, { createContext, useContext, ReactNode } from 'react';

// Crear un contexto para el tema
const ThemeContext = createContext({});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Aquí puedes definir la lógica del tema, como el estado del tema oscuro o claro
  const theme = {
    mode: 'light', // Cambiar a 'dark' para tema oscuro
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);