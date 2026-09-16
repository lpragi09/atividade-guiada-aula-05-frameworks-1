// src/components/AddressDisplay.jsx
import React from "react";
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
  CircularProgress,
} from "@mui/material";
import {
  Save,
  Close,
  Phone,
  ContentCopy,
  Map as MapIcon,
  NearMe,
  Directions,
  Star,
  Tag,
  Schedule,
  Share,
  Paid,
  PhotoCamera,
} from "@mui/icons-material";
import {
  formatAddress,
  formatCep,
  googleMapsUrl,
  distanceKm,
  formatDistance,
  formatDuration,
  formatBRL,
  colorForUf,
} from "../utils/geo";
import { ROUTE_PROFILES } from "../api/osrm";
import { summarizeTolls } from "../api/overpass";

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

const AddressDisplay = ({
  address,
  coordinates,
  isFavoriteView,
  onSave,
  onClose,
  onNotify,
  userLocation,
  route,
  routing,
  onRoute,
  hazards,
}) => {
  const accent = colorForUf(address.uf);
  const tollSummary = summarizeTolls(hazards?.tolls);

  // Distancia em linha reta, mostrada enquanto nao existe rota calculada.
  const straightLine = userLocation && coordinates ? distanceKm(userLocation, coordinates) : null;

  // Compartilha pelo menu nativo do celular; no desktop copia o link do Google Maps.
  const handleShare = async () => {
    const text = formatAddress(address);
    const url = googleMapsUrl(coordinates, address);
    try {
      if (navigator.share) {
        await navigator.share({ title: address.apelido || address.logradouro || "Endereço", text, url });
      } else {
        await navigator.clipboard.writeText(`${text}
${url}`);
        onNotify?.("Endereço e link copiados para compartilhar.", "success");
      }
    } catch (err) {
      if (err?.name !== "AbortError") onNotify?.("Não foi possível compartilhar.", "error");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatAddress(address));
      onNotify?.("Endereço copiado.", "success");
    } catch {
      onNotify?.("Não foi possível copiar.", "error");
    }
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
              {route ? (
                <>
                  <Chip
                    icon={<Directions />}
                    label={`${formatDistance(route.distance / 1000)} · ${ROUTE_PROFILES[route.profile]?.label}`}
                    size="small"
                    color="success"
                  />
                  <Chip
                    icon={<Schedule />}
                    label={formatDuration(route.duration)}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                  {tollSummary.count > 0 && (
                    <Chip
                      icon={<Paid />}
                      size="small"
                      color="warning"
                      label={
                        tollSummary.knownCount > 0
                          ? `${tollSummary.missingCount > 0 ? "≥ " : ""}${formatBRL(tollSummary.total)} de pedágio`
                          : `${tollSummary.count} ${tollSummary.count === 1 ? "pedágio" : "pedágios"}`
                      }
                    />
                  )}
                  {hazards?.cameras?.length > 0 && (
                    <Chip
                      icon={<PhotoCamera />}
                      size="small"
                      color="error"
                      variant="outlined"
                      label={`${hazards.cameras.length} ${hazards.cameras.length === 1 ? "radar" : "radares"}`}
                    />
                  )}
                </>
              ) : (
                straightLine !== null && (
                  <Chip
                    icon={<NearMe />}
                    label={`${formatDistance(straightLine)} em linha reta`}
                    size="small"
                    variant="outlined"
                    color="success"
                  />
                )
              )}
            </Stack>

            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Copiar endereço">
                <IconButton size="small" onClick={handleCopy} aria-label="Copiar endereço">
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Ver no Google Maps">
                <IconButton
                  size="small"
                  component="a"
                  href={googleMapsUrl(coordinates, address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ver no Google Maps"
                >
                  <MapIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Compartilhar">
                <IconButton size="small" onClick={handleShare} aria-label="Compartilhar endereço">
                  <Share fontSize="small" />
                </IconButton>
              </Tooltip>
              {coordinates && (
                <Tooltip title={route ? "Recalcular rota" : "Rota até aqui a partir da minha localização"}>
                  <span>
                    <Button
                      size="small"
                      variant={route ? "outlined" : "contained"}
                      color="success"
                      onClick={() => onRoute?.()}
                      disabled={routing}
                      startIcon={
                        routing ? <CircularProgress size={14} color="inherit" /> : <Directions />
                      }
                      sx={{ ml: 0.5, py: 0.5, px: 1.5 }}
                    >
                      {routing ? "Calculando" : route ? "Recalcular" : "Rota até aqui"}
                    </Button>
                  </span>
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
