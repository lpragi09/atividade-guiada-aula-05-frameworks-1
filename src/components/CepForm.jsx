// src/components/CepForm.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  TextField,
  Button,
  Box,
  Chip,
  Stack,
  Typography,
  InputAdornment,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Search, History, Close, Place } from "@mui/icons-material";
import { formatCep, onlyDigits } from "../utils/geo";

const CepForm = ({ onSearch, loading, recent = [], onClearRecent }) => {
  const [cep, setCep] = useState("");
  const inputRef = useRef(null);

  const digits = onlyDigits(cep);
  const isValid = digits.length === 8;

  // Atalho de teclado: "/" foca o campo de CEP de qualquer lugar da pagina.
  useEffect(() => {
    const handleKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) onSearch(digits);
  };

  const handleRecent = (value) => {
    setCep(formatCep(value));
    onSearch(onlyDigits(value));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "stretch" }}>
        <TextField
          inputRef={inputRef}
          label="Digite o CEP"
          placeholder="00000-000"
          fullWidth
          value={cep}
          onChange={(e) => setCep(formatCep(e.target.value))}
          slotProps={{
            htmlInput: { inputMode: "numeric", maxLength: 9, "aria-label": "CEP" },
            input: {
            startAdornment: (
              <InputAdornment position="start">
                <Place color={isValid ? "primary" : "disabled"} />
              </InputAdornment>
            ),
            endAdornment: cep ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  edge="end"
                  aria-label="Limpar CEP"
                  onClick={() => {
                    setCep("");
                    inputRef.current?.focus();
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : (
              <InputAdornment position="end">
                <Typography
                  variant="caption"
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    border: 1,
                    borderColor: "divider",
                    color: "text.secondary",
                    fontFamily: "monospace",
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  /
                </Typography>
              </InputAdornment>
            ),
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !isValid}
          sx={{ minWidth: 130, flexShrink: 0 }}
          startIcon={
            loading ? <CircularProgress size={18} color="inherit" /> : <Search />
          }
        >
          {loading ? "Buscando" : "Buscar"}
        </Button>
      </Box>

      {recent.length > 0 && (
        <Stack
          direction="row"
          sx={{ mt: 1.5, alignItems: "center", flexWrap: "wrap", gap: 1 }}
        >
          <Tooltip title="Buscas recentes">
            <History fontSize="small" sx={{ color: "text.secondary" }} />
          </Tooltip>
          {recent.map((item) => (
            <Chip
              key={item}
              label={formatCep(item)}
              size="small"
              variant="outlined"
              onClick={() => handleRecent(item)}
              disabled={loading}
            />
          ))}
          <Chip
            label="limpar"
            size="small"
            variant="outlined"
            onClick={onClearRecent}
            sx={{ color: "text.secondary", borderStyle: "dashed" }}
          />
        </Stack>
      )}
    </Box>
  );
};

export default CepForm;
