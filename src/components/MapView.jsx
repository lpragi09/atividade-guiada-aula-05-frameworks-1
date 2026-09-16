// src/components/MapView.jsx
import React, { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  ZoomControl,
  useMap,
} from "react-leaflet";
import {
  Paper,
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from "@mui/material";
import {
  Explore,
  Layers,
  MyLocation,
  DirectionsCar,
  DirectionsBike,
  DirectionsWalk,
  Close,
  Schedule,
  Directions,
} from "@mui/icons-material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { colorForUf, formatCep, formatDistance, formatDuration } from "../utils/geo";

// Centro do Brasil: e o que aparece enquanto nenhum endereco foi buscado.
const BRAZIL_CENTER = [-14.235, -51.925];
const BRAZIL_ZOOM = 4;
const STREET_ZOOM = 17;
const USER_ZOOM = 15;

// Os tiles do OpenStreetMap nao precisam de chave. No modo escuro o mesmo tile
// recebe um filtro CSS (classe "tiles-dark" no GlobalStyles) que inverte as cores.
const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILES = {
  light: { url: OSM_URL, className: "", label: "OpenStreetMap" },
  dark: { url: OSM_URL, className: "tiles-dark", label: "OpenStreetMap · noturno" },
};

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · rotas por <a href="https://project-osrm.org">OSRM</a>';

const PROFILE_ICONS = {
  driving: <DirectionsCar fontSize="small" />,
  cycling: <DirectionsBike fontSize="small" />,
  walking: <DirectionsWalk fontSize="small" />,
};

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

const userIcon = L.divIcon({
  className: "geo-marker-wrap",
  html: '<span class="geo-user"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
});

// Decide para onde a camera vai: rota inteira > ponto ativo > usuario > Brasil.
const CameraController = ({ target, route, userLocation, focusUser }) => {
  const map = useMap();
  const lat = target?.lat;
  const lng = target?.lng;
  const routeKey = route ? `${route.profile}-${route.coordinates.length}-${route.distance}` : "";
  const userLat = userLocation?.lat;
  const userLng = userLocation?.lng;
  const routeCoords = route?.coordinates;

  useEffect(() => {
    if (routeCoords) {
      map.flyToBounds(L.latLngBounds(routeCoords), {
        padding: [60, 60],
        duration: 1.2,
        maxZoom: 16,
      });
      return;
    }
    if (lat !== undefined && lng !== undefined) {
      map.flyTo([lat, lng], STREET_ZOOM, { duration: 1.2 });
      return;
    }
    if (focusUser && userLat !== undefined && userLng !== undefined) {
      map.flyTo([userLat, userLng], USER_ZOOM, { duration: 1.2 });
      return;
    }
    map.flyTo(BRAZIL_CENTER, BRAZIL_ZOOM, { duration: 1 });
  }, [map, lat, lng, routeKey, routeCoords, userLat, userLng, focusUser]);

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

const MapView = ({
  coordinates,
  address,
  favorites = [],
  onSelectFavorite,
  mode = "light",
  userLocation,
  locating,
  focusUser,
  onLocate,
  route,
  routing,
  onChangeProfile,
  onClearRoute,
}) => {
  const tiles = TILES[mode] || TILES.light;
  const isDark = mode === "dark";

  const favoriteMarkers = useMemo(
    () =>
      favorites.filter(
        (fav) => fav.coordinates && !(address && fav.cep === address.cep),
      ),
    [favorites, address],
  );

  const hasActive = Boolean(coordinates);
  const isEmpty = !hasActive && favoriteMarkers.length === 0 && !userLocation;

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
        <CameraController
          target={coordinates}
          route={route}
          userLocation={userLocation}
          focusUser={focusUser}
        />
        <ResizeHandler />

        {/* Rota: uma linha mais grossa por baixo faz o papel de contorno */}
        {route && (
          <>
            <Polyline
              positions={route.coordinates}
              pathOptions={{ color: isDark ? "#0b1020" : "#ffffff", weight: 9, opacity: 0.8 }}
            />
            <Polyline
              positions={route.coordinates}
              pathOptions={{ color: "#2f9e44", weight: 5, opacity: 0.95, lineJoin: "round" }}
            />
          </>
        )}

        {/* Posicao do usuario + raio de precisao */}
        {userLocation && (
          <>
            {userLocation.accuracy > 30 && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={userLocation.accuracy}
                pathOptions={{ color: "#2f9e44", weight: 1, fillOpacity: 0.08 }}
              />
            )}
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} zIndexOffset={900}>
              <Popup>
                <strong>Você está aqui</strong>
                <br />
                {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                {userLocation.accuracy && (
                  <>
                    <br />
                    precisão ≈ {Math.round(userLocation.accuracy)} m
                  </>
                )}
              </Popup>
            </Marker>
          </>
        )}

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

      {/* Botao "minha localizacao" */}
      <Tooltip title={userLocation ? "Centralizar em mim" : "Mostrar minha localização"}>
        <IconButton
          onClick={onLocate}
          disabled={locating}
          aria-label="Minha localização"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 1000,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            color: userLocation ? "success.main" : "text.primary",
            "&:hover": { bgcolor: "background.paper" },
          }}
        >
          {locating ? <CircularProgress size={20} /> : <MyLocation />}
        </IconButton>
      </Tooltip>

      {/* Painel da rota */}
      {(route || routing) && (
        <Paper
          sx={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 28,
            zIndex: 1000,
            p: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
            mx: "auto",
            maxWidth: 560,
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
            {routing ? (
              <>
                <CircularProgress size={18} />
                <Typography variant="body2">Calculando rota…</Typography>
              </>
            ) : (
              <>
                <Chip
                  icon={<Directions />}
                  color="success"
                  size="small"
                  label={formatDistance(route.distance / 1000)}
                />
                <Chip
                  icon={<Schedule />}
                  size="small"
                  variant="outlined"
                  label={formatDuration(route.duration)}
                />
              </>
            )}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={route?.profile || "driving"}
              onChange={(_, value) => value && onChangeProfile?.(value)}
              disabled={routing}
            >
              {Object.entries(PROFILE_ICONS).map(([key, icon]) => (
                <ToggleButton key={key} value={key} aria-label={key} sx={{ px: 1.25 }}>
                  {icon}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Tooltip title="Limpar rota">
              <IconButton size="small" onClick={onClearRoute} aria-label="Limpar rota">
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Paper>
      )}

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
      {hasActive && !route && !routing && (
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
