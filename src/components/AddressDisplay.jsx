// src/components/AddressDisplay.jsx
import React, { useState } from "react";
import styled from "styled-components";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Box,
  Slide,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Divider,
} from "@mui/material";
import {
  Save,
  Close,
  Phone,
  ContentCopy,
  Map as MapIcon,
  NearMe,
  Star,
  Tag,
} from "@mui/icons-material";
import {
  formatAddress,
  formatCep,
  googleMapsUrl,
  distanceKm,
  formatDistance,
  colorForUf,
} from "../utils/geo";

const Accent = styled.div`
  position: absolute;
  inset: 0 auto 0 0;
  width: 6px;
  background: linear-gradient(
    180deg,
    ${({ $color }) => $color},
    ${({ theme }) => theme.palette.secondary.main}
  );
`;

const Field = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 500 }}>
      {value || "—"}
    </Typography>
  </Box>
);

const AddressDisplay = ({ address, coordinates, isFavoriteView, onSave, onClose, onNotify }) => {
  const [distance, setDistance] = useState(null);
  const [locating, setLocating] = useState(false);

  const accent = colorForUf(address.uf);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatAddress(address));
      onNotify?.("Endereço copiado.", "success");
    } catch {
      onNotify?.("Não foi possível copiar.", "error");
    }
  };

  // Usa a geolocalizacao do navegador para calcular a distancia ate o endereco.
  const handleDistance = () => {
    if (!coordinates) return;
    if (!navigator.geolocation) {
      onNotify?.("Seu navegador não suporta geolocalização.", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDistance(distanceKm(me, coordinates));
        setLocating(false);
      },
      () => {
        onNotify?.("Não foi possível obter sua localização.", "error");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  return (
    <Slide direction="down" in={true} mountOnEnter unmountOnExit>
      <Card sx={{ position: "relative", overflow: "hidden", mt: 3 }}>
        <Accent $color={accent} />
        <CardContent sx={{ pl: 3.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 2,
              mb: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                <Chip
                  size="small"
                  icon={isFavoriteView ? <Star /> : <Tag />}
                  label={isFavoriteView ? "Favorito" : `CEP ${formatCep(address.cep)}`}
                  color={isFavoriteView ? "secondary" : "primary"}
                  variant="outlined"
                />
                {isFavoriteView && (
                  <Typography variant="caption" color="text.secondary">
                    CEP {formatCep(address.cep)}
                  </Typography>
                )}
              </Stack>
              <Typography variant="h5" component="h2" noWrap title={address.logradouro}>
                {isFavoriteView ? address.apelido : address.logradouro || "Logradouro não informado"}
              </Typography>
              {isFavoriteView && address.logradouro && (
                <Typography variant="body2" color="text.secondary">
                  {address.logradouro}
                </Typography>
              )}
            </Box>

            {isFavoriteView ? (
              <Button
                variant="outlined"
                startIcon={<Close />}
                onClick={onClose}
                color="secondary"
                sx={{ flexShrink: 0 }}
              >
                Fechar
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={onSave}
                sx={{ flexShrink: 0 }}
              >
                Salvar
              </Button>
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field label="Bairro" value={address.bairro} />
            </Grid>
            <Grid size={{ xs: 8, sm: 4 }}>
              <Field label="Cidade" value={address.localidade} />
            </Grid>
            <Grid size={{ xs: 4, sm: 2 }}>
              <Field label="UF" value={address.uf} />
            </Grid>
            {address.complemento && (
              <Grid size={12}>
                <Field label="Complemento" value={address.complemento} />
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {address.ddd && (
                <Chip icon={<Phone />} label={`DDD ${address.ddd}`} size="small" variant="outlined" />
              )}
              {address.ibge && (
                <Chip label={`IBGE ${address.ibge}`} size="small" variant="outlined" />
              )}
              {coordinates && (
                <Chip
                  label={`${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: "monospace" }}
                />
              )}
              {distance !== null && (
                <Chip
                  icon={<NearMe />}
                  label={`${formatDistance(distance)} de você`}
                  size="small"
                  color="success"
                />
              )}
            </Stack>

            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Copiar endereço">
                <IconButton size="small" onClick={handleCopy} aria-label="Copiar endereço">
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Abrir no Google Maps">
                <IconButton
                  size="small"
                  component="a"
                  href={googleMapsUrl(coordinates, address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir no Google Maps"
                >
                  <MapIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {coordinates && (
                <Tooltip title="Distância até mim">
                  <IconButton
                    size="small"
                    onClick={handleDistance}
                    disabled={locating}
                    aria-label="Calcular distância até mim"
                  >
                    <NearMe fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Slide>
  );
};

export default AddressDisplay;
