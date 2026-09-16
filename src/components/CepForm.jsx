// src/components/CepForm.jsx
import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";
import { Search } from "@mui/icons-material";

const CepForm = ({ onSearch, loading }) => {
  const [cep, setCep] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedCep = cep.replace(/\D/g, "");
    if (cleanedCep.length === 8) onSearch(cleanedCep);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ mt: 4, display: "flex", gap: 2 }}
    >
      <TextField
        label="Digite o CEP"
        variant="outlined"
        fullWidth
        value={cep}
        onChange={(e) => setCep(e.target.value)}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={loading || cep.replace(/\D/g, "").length !== 8}
        startIcon={<Search />}
      >
        {loading ? "Buscando..." : "Buscar"}
      </Button>
    </Box>
  );
};

export default CepForm;
