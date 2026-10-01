import { createContext } from "react";

export const ThemeContext = createContext({
  theme: "system",
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

