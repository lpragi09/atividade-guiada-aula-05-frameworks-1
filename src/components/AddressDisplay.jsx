// src/components/AddressDisplay.jsx
import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Box,
  Slide,
  Chip,
} from "@mui/material";
import { Save, Close, Phone } from "@mui/icons-material";

const AddressDisplay = ({ address, isFavoriteView, onSave, onClose }) => {
  return (
    <Slide direction="down" in={true} mountOnEnter unmountOnExit>
      <Card
        sx={{
          mt: 4,
          mb: 2,
          backgroundColor: "#f9f9f9",
          border: "1px solid #e0e0e0",
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" color="primary.dark">
              {isFavoriteView ? address.apelido : "Endereço Encontrado"}
            </Typography>
            {isFavoriteView ? (
              <Button
                variant="outlined"
                startIcon={<Close />}
                onClick={onClose}
                color="secondary"
              >
                Fechar
              </Button>
            ) : (
              <Button variant="contained" startIcon={<Save />} onClick={onSave}>
                Salvar Favorito
              </Button>
            )}
          </Box>

          {/* Na versao atual do MUI o Grid usa a prop `size` no lugar de `item xs sm` */}
          <Grid container spacing={2}>
            <Grid size={12}>
              <Typography>
                <strong>Logradouro:</strong> {address.logradouro || "N/A"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <Typography>
                <strong>Cidade:</strong> {address.localidade}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography>
                <strong>UF:</strong> {address.uf}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <Typography>
                <strong>Bairro:</strong> {address.bairro}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              {address.ddd && (
                <Chip
                  icon={<Phone />}
                  label={`DDD: ${address.ddd}`}
                  variant="outlined"
                  color="primary"
                  size="small"
                />
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Slide>
  );
};

export default AddressDisplay;
