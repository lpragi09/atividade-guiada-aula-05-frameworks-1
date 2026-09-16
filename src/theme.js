// src/theme.js
import { createTheme, alpha } from "@mui/material/styles";

// Paletas separadas para o modo claro e escuro. O restante do tema (tipografia,
// bordas, overrides dos componentes) e compartilhado entre os dois.
const palettes = {
  light: {
    mode: "light",
    primary: { main: "#3b5bdb", light: "#5c7cfa", dark: "#2f44ad" },
    secondary: { main: "#d6336c", light: "#f06595", dark: "#a61e4d" },
    success: { main: "#2f9e44" },
    background: { default: "#f3f5fb", paper: "#ffffff" },
    text: { primary: "#111827", secondary: "#5b6478" },
    divider: "rgba(17, 24, 39, 0.08)",
  },
  dark: {
    mode: "dark",
    primary: { main: "#7c9cff", light: "#a5b8ff", dark: "#5a78e6" },
    secondary: { main: "#f472b6", light: "#f9a8d4", dark: "#db2777" },
    success: { main: "#4ade80" },
    background: { default: "#0b1020", paper: "#121a33" },
    text: { primary: "#e6e9f5", secondary: "#9aa3bd" },
    divider: "rgba(230, 233, 245, 0.08)",
  },
};

export const getTheme = (mode = "light") => {
  const palette = palettes[mode] || palettes.light;
  const isDark = mode === "dark";

  return createTheme({
    palette,
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700 },
      h2: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700 },
      h3: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700 },
      h4: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700, letterSpacing: "-0.02em" },
      h5: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 600, letterSpacing: "-0.01em" },
      h6: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            transition: "background-color 0.3s ease, color 0.3s ease",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: "none",
            padding: "10px 20px",
            borderRadius: 12,
          },
          containedPrimary: {
            backgroundImage: `linear-gradient(135deg, ${palette.primary.main}, ${palette.primary.dark})`,
            boxShadow: `0 8px 20px ${alpha(palette.primary.main, 0.35)}`,
            "&:hover": {
              boxShadow: `0 10px 26px ${alpha(palette.primary.main, 0.45)}`,
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${palette.divider}`,
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: "outlined" },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: isDark ? alpha("#ffffff", 0.03) : alpha("#ffffff", 0.7),
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { fontSize: 12, borderRadius: 8 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
    },
  });
};

export default getTheme("light");
