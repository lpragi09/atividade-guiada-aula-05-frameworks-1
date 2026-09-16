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
  Navigation,
  Paid,
  PhotoCamera,
  Verified,
  WarningAmber,
} from "@mui/icons-material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  colorForUf,
  formatCep,
  formatDistance,
  formatDuration,
  googleMapsRouteUrl,
  formatBRL,
} from "../utils/geo";
import { summarizeTolls } from "../api/overpass";

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

// Icones de pedagio e radar (paths do Material Icons "attach_money" e "photo_camera").
const MONEY_PATH =
  "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z";
const CAMERA_PATH =
  "M12 12m-3.2 0a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0-6.4 0M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z";

const badgeIcon = (kind) =>
  L.divIcon({
    className: "geo-marker-wrap",
    html: `<span class="geo-badge is-${kind}"><svg viewBox="0 0 24 24"><path d="${
      kind === "toll" ? MONEY_PATH : CAMERA_PATH
    }"/></svg></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
const tollIcon = badgeIcon("toll");
const cameraIcon = badgeIcon("camera");

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
  showLocationPrompt,
  locationDenied,
  onDismissLocationPrompt,
  route,
  routing,
  onChangeProfile,
  onClearRoute,
  hazards,
  hazardsLoading,
}) => {
  const tiles = TILES[mode] || TILES.light;
  const isDark = mode === "dark";
  const tollSummary = summarizeTolls(hazards?.tolls);

  const favoriteMarkers = useMemo(
    () =>
      favorites.filter(
        (fav) => fav.coordinates && !(address && fav.cep === address.cep),
      ),
    [favorites, address],
  );

  const hasActive = Boolean(coordinates);
  const isEmpty = !hasActive && favoriteMarkers.length === 0 && !userLocation && !showLocationPrompt;

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

        {/* Pedagios e radares encontrados ao longo da rota */}
        {route &&
          hazards?.tolls?.map((toll) => (
            <Marker key={`toll-${toll.id}`} position={[toll.lat, toll.lng]} icon={tollIcon} zIndexOffset={800}>
              <Popup>
                <strong>{toll.name}</strong>
                {toll.operator && toll.operator !== toll.name && (
                  <>
                    <br />
                    {toll.operator}
                  </>
                )}
                <br />
                {toll.charge !== null ? `Carro: ${formatBRL(toll.charge)}` : "Valor não cadastrado no OSM"}
              </Popup>
            </Marker>
          ))}
        {route &&
          hazards?.cameras?.map((cam) => (
            <Marker key={`cam-${cam.id}`} position={[cam.lat, cam.lng]} icon={cameraIcon} zIndexOffset={800}>
              <Popup>
                <strong>Radar</strong>
                {cam.maxspeed && (
                  <>
                    <br />
                    Limite: {cam.maxspeed} km/h
                  </>
                )}
              </Popup>
            </Marker>
          ))}

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

          {route && (
            <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.75, width: "100%", order: 3 }}>
              {hazardsLoading ? (
                <>
                  <CircularProgress size={14} />
                  <Typography variant="caption" color="text.secondary">
                    Verificando pedágios e radares no trajeto…
                  </Typography>
                </>
              ) : hazards?.error ? (
                <Chip
                  icon={<WarningAmber />}
                  size="small"
                  variant="outlined"
                  label="Não foi possível verificar pedágios e radares"
                />
              ) : hazards ? (
                <>
                  {tollSummary.count > 0 ? (
                    <Tooltip
                      title={
                        tollSummary.missingCount > 0
                          ? `${tollSummary.missingCount} ${tollSummary.missingCount === 1 ? "pedágio sem valor cadastrado" : "pedágios sem valor cadastrado"} no OpenStreetMap`
                          : "Valores para carro de passeio, conforme o OpenStreetMap"
                      }
                    >
                      <Chip
                        icon={<Paid />}
                        size="small"
                        color="warning"
                        label={`${tollSummary.count} ${tollSummary.count === 1 ? "pedágio" : "pedágios"}${
                          tollSummary.knownCount > 0
                            ? ` · ${tollSummary.missingCount > 0 ? "a partir de " : ""}${formatBRL(tollSummary.total)}`
                            : " · valor não informado"
                        }`}
                      />
                    </Tooltip>
                  ) : (
                    <Chip icon={<Verified />} size="small" variant="outlined" label="Sem pedágios" />
                  )}
                  {hazards.cameras.length > 0 ? (
                    <Chip
                      icon={<PhotoCamera />}
                      size="small"
                      color="error"
                      label={`${hazards.cameras.length} ${hazards.cameras.length === 1 ? "radar" : "radares"}`}
                    />
                  ) : (
                    <Chip icon={<Verified />} size="small" variant="outlined" label="Sem radares" />
                  )}
                </>
              ) : null}
            </Stack>
          )}

          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {route && userLocation && coordinates && (
              <Tooltip title="Navegar com o Google Maps">
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  component="a"
                  href={googleMapsRouteUrl(userLocation, coordinates)}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<Navigation fontSize="small" />}
                  sx={{ py: 0.5, px: 1.25 }}
                >
                  Navegar
                </Button>
              </Tooltip>
            )}
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

      {/* Convite para ativar a localizacao */}
      {showLocationPrompt && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1001,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            px: 2,
          }}
        >
          <Paper
            sx={{
              pointerEvents: "auto",
              p: 2.5,
              maxWidth: 340,
              textAlign: "center",
              boxShadow: 8,
              borderRadius: 3,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                mx: "auto",
                mb: 1.5,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "success.main",
                bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(74,222,128,0.12)" : "rgba(47,158,68,0.1)"),
              }}
            >
              <MyLocation />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {locationDenied ? "Localização bloqueada" : "Mostrar você no mapa?"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              {locationDenied
                ? "O navegador está bloqueando a localização deste site. Clique no ícone de cadeado ao lado do endereço, permita a localização e tente de novo."
                : "Com a localização ativa, você aparece no mapa desde o início e dá para traçar a rota até qualquer endereço. Sua posição fica só no seu navegador."}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
              <Button variant="text" color="inherit" onClick={onDismissLocationPrompt}>
                Agora não
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={onLocate}
                disabled={locating}
                startIcon={locating ? <CircularProgress size={16} color="inherit" /> : <MyLocation />}
              >
                {locating ? "Localizando" : locationDenied ? "Tentar de novo" : "Ativar localização"}
              </Button>
            </Stack>
          </Paper>
        </Box>
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
