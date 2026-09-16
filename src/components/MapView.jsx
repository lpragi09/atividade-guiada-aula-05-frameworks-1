// src/components/MapView.jsx
import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import { Paper, Box, Typography, Button, Stack, Chip } from "@mui/material";
import { Explore, Layers } from "@mui/icons-material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { colorForUf, formatCep } from "../utils/geo";

// Centro do Brasil: e o que aparece enquanto nenhum endereco foi buscado.
const BRAZIL_CENTER = [-14.235, -51.925];
const BRAZIL_ZOOM = 4;
const STREET_ZOOM = 17;

// Os tiles do OpenStreetMap nao precisam de chave. No modo escuro o mesmo tile
// recebe um filtro CSS (classe "tiles-dark" no GlobalStyles) que inverte as cores.
const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILES = {
  light: { url: OSM_URL, className: "", label: "OpenStreetMap" },
  dark: { url: OSM_URL, className: "tiles-dark", label: "OpenStreetMap · noturno" },
};

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Marcador em HTML/CSS (divIcon) no lugar da imagem padrao do Leaflet. Assim
// da para colorir por UF e animar o ativo — e resolve o problema do icone que
// nao carrega com o Vite.
const makeIcon = (color, variant = "default") =>
  L.divIcon({
    className: "geo-marker-wrap",
    html: `<span class="geo-marker ${variant === "active" ? "is-active" : ""} ${
      variant === "muted" ? "is-muted" : ""
    }" style="--c:${color}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -26],
  });

// Anima o mapa ate o ponto ativo em vez de recriar o MapContainer a cada busca.
const FlyTo = ({ target, zoom }) => {
  const map = useMap();
  const lat = target?.lat;
  const lng = target?.lng;
  useEffect(() => {
    if (lat !== undefined && lng !== undefined) {
      map.flyTo([lat, lng], zoom, { duration: 1.2 });
    } else {
      map.flyTo(BRAZIL_CENTER, BRAZIL_ZOOM, { duration: 1 });
    }
  }, [map, lat, lng, zoom]);
  return null;
};

// Corrige o tamanho do mapa quando o container muda (troca de coluna no responsivo).
const ResizeHandler = () => {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
};

const MapView = ({ coordinates, address, favorites = [], onSelectFavorite, mode = "light" }) => {
  const tiles = TILES[mode] || TILES.light;

  const favoriteMarkers = useMemo(
    () =>
      favorites.filter(
        (fav) => fav.coordinates && !(address && fav.cep === address.cep),
      ),
    [favorites, address],
  );

  const hasActive = Boolean(coordinates);
  const isEmpty = !hasActive && favoriteMarkers.length === 0;

  return (
    <Paper
      sx={{
        position: "relative",
        height: "100%",
        minHeight: 420,
        overflow: "hidden",
        borderRadius: 4,
      }}
    >
      <MapContainer
        center={BRAZIL_CENTER}
        zoom={BRAZIL_ZOOM}
        scrollWheelZoom
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        {/* key forca a troca do TileLayer quando o tema muda */}
        <TileLayer key={mode} url={tiles.url} className={tiles.className} attribution={ATTRIBUTION} />
        <ZoomControl position="bottomleft" />
        <FlyTo target={coordinates} zoom={STREET_ZOOM} />
        <ResizeHandler />

        {favoriteMarkers.map((fav) => (
          <Marker
            key={fav.id}
            position={[fav.coordinates.lat, fav.coordinates.lng]}
            icon={makeIcon(colorForUf(fav.uf), hasActive ? "muted" : "default")}
            eventHandlers={{ click: () => onSelectFavorite?.(fav) }}
          >
            <Popup>
              <strong>{fav.apelido}</strong>
              <br />
              {fav.logradouro && <>{fav.logradouro}<br /></>}
              {fav.localidade}/{fav.uf} · CEP {formatCep(fav.cep)}
            </Popup>
          </Marker>
        ))}

        {hasActive && (
          <Marker
            position={[coordinates.lat, coordinates.lng]}
            icon={makeIcon(colorForUf(address?.uf), "active")}
            zIndexOffset={1000}
          >
            <Popup>
              <strong>{address?.apelido || address?.logradouro || "Endereço"}</strong>
              <br />
              {address?.bairro && <>{address.bairro}<br /></>}
              {address?.localidade}/{address?.uf}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legenda flutuante */}
      <Box
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 1000,
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Chip
          icon={<Layers />}
          label={tiles.label}
          size="small"
          sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider" }}
        />
        {favoriteMarkers.length > 0 && (
          <Chip
            label={`${favoriteMarkers.length} ${
              favoriteMarkers.length === 1 ? "favorito no mapa" : "favoritos no mapa"
            }`}
            size="small"
            sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider" }}
          />
        )}
      </Box>

      {/* Estado vazio por cima do mapa do Brasil */}
      {isEmpty && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <Stack
            spacing={1}
            sx={{
              alignItems: "center",
              px: 3,
              py: 2.5,
              borderRadius: 3,
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              boxShadow: 6,
              textAlign: "center",
              maxWidth: 300,
            }}
          >
            <Explore color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              O mapa está esperando
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Busque um CEP para ver o endereço aqui. Seus favoritos também aparecem
              no mapa.
            </Typography>
          </Stack>
        </Box>
      )}

      {/* Botao para voltar a visao geral */}
      {hasActive && (
        <Button
          size="small"
          variant="contained"
          startIcon={<Explore />}
          onClick={() => onSelectFavorite?.(null)}
          sx={{ position: "absolute", right: 12, bottom: 28, zIndex: 1000 }}
        >
          Visão geral
        </Button>
      )}
    </Paper>
  );
};

export default MapView;
