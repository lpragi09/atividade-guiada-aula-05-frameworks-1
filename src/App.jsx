// src/App.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled, { ThemeProvider as StyledThemeProvider } from "styled-components";
import {
  Container,
  Typography,
  Alert,
  ThemeProvider as MuiThemeProvider,
  CssBaseline,
  Box,
  Grid,
  Paper,
  Snackbar,
  Button,
  Skeleton,
  Stack,
  Link,
} from "@mui/material";

import { getTheme } from "./theme";
import GlobalStyles from "./GlobalStyles";
import useLocalStorage from "./hooks/useLocalStorage";
import useGeolocation from "./hooks/useGeolocation";
import { getAddressByCep } from "./api/viaCep";
import { getCoordinatesByAddress } from "./api/opencage";
import { getRoute } from "./api/osrm";
import { getRouteHazards } from "./api/overpass";
import Header from "./components/Header";
import CepForm from "./components/CepForm";
import AddressDisplay from "./components/AddressDisplay";
import MapView from "./components/MapView";
import FavoritesList from "./components/FavoritesList";

const AppWrapper = styled.div`
  min-height: 100vh;
  padding: 2.5rem 0 3rem;

  @media (max-width: 600px) {
    padding: 1.5rem 0 2rem;
  }
`;

// Painel "de vidro": fundo semitransparente com blur por cima dos blobs do fundo.
const Panel = styled(Paper)`
  padding: 1.75rem;
  border-radius: ${({ theme }) => theme.shape.borderRadius * 1.5}px;
  background: ${({ theme }) =>
    theme.palette.mode === "dark" ? "rgba(18, 26, 51, 0.78)" : "rgba(255, 255, 255, 0.78)"};
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 20px 60px
    ${({ theme }) => (theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.45)" : "rgba(17, 24, 39, 0.08)")};

  @media (max-width: 600px) {
    padding: 1.25rem;
  }
`;

// A coluna do mapa acompanha a rolagem no desktop. Os 160px descontam o header,
// para o mapa inteiro (com o painel da rota) caber na tela sem rolar.
const StickyColumn = styled.div`
  position: sticky;
  top: 1.5rem;
  height: calc(100vh - 160px);
  min-height: 420px;

  @media (max-width: 900px) {
    position: static;
    height: 460px;
  }
`;

const MAX_RECENT = 5;

const prefersDark = () =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";

function App() {
  const [mode, setMode] = useLocalStorage("geobusca:mode", prefersDark);
  const theme = useMemo(() => getTheme(mode), [mode]);

  const [address, setAddress] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFavoriteView, setIsFavoriteView] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [favorites, setFavorites] = useLocalStorage("favorites", []);
  const [recent, setRecent] = useLocalStorage("geobusca:recent", []);

  const [toast, setToast] = useState(null); // { message, severity, undo }

  // Localizacao do usuario e rota ate o endereco ativo.
  const { position: userLocation, locating, permission, locate } = useGeolocation();
  const [focusUser, setFocusUser] = useState(false);
  // Convite para ativar a localizacao, mostrado no mapa ate o usuario decidir.
  const [locationPromptDismissed, setLocationPromptDismissed] = useLocalStorage(
    "geobusca:locationPromptDismissed",
    false,
  );
  // Mostra tambem quando o navegador ja bloqueou, com a instrucao de como liberar.
  const showLocationPrompt = !userLocation && !locationPromptDismissed && permission !== "granted";
  const [route, setRoute] = useState(null);
  const [routing, setRouting] = useState(false);
  // Pedagios e radares ao longo da rota (consulta ao OpenStreetMap via Overpass).
  const [hazards, setHazards] = useState(null); // { tolls, cameras } | { error: true }
  const [hazardsLoading, setHazardsLoading] = useState(false);
  const [profile, setProfile] = useLocalStorage("geobusca:profile", "driving");

  const notify = useCallback((message, severity = "info", undo = null) => {
    setToast({ message, severity, undo, key: Date.now() });
  }, []);

  const citiesCount = useMemo(
    () => new Set(favorites.map((fav) => `${fav.localidade}/${fav.uf}`)).size,
    [favorites],
  );

  const handleCloseDisplay = () => {
    setAddress(null);
    setCoordinates(null);
    setIsFavoriteView(false);
    setSelectedId(null);
    setRoute(null);
    setHazards(null);
  };

  // Botao "minha localizacao" do mapa: pede a permissao (se ainda nao tem)
  // e centraliza o mapa no usuario.
  const handleLocate = async () => {
    try {
      await locate();
      setLocationPromptDismissed(true);
      if (!route) setFocusUser(true);
      if (!coordinates) notify("Você está no mapa.", "success");
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // Calcula a rota da posicao do usuario ate o endereco ativo.
  const handleRoute = async (nextProfile = profile, destination = coordinates) => {
    if (!destination) return;
    setRouting(true);
    try {
      const origin = userLocation || (await locate());
      const result = await getRoute(origin, destination, nextProfile);
      setRoute(result);
      setFocusUser(false);
      loadHazards(result);
    } catch (err) {
      setRoute(null);
      setHazards(null);
      notify(err.message || "Não foi possível calcular a rota.", "error");
    } finally {
      setRouting(false);
    }
  };

  // Roda depois da rota, sem travar a tela: se o Overpass falhar, so avisa no painel.
  const loadHazards = async (currentRoute) => {
    setHazards(null);
    setHazardsLoading(true);
    try {
      const result = await getRouteHazards(currentRoute.coordinates);
      setHazards(result);
    } catch (err) {
      console.error("Falha ao consultar pedágios e radares", err);
      setHazards({ error: true, tolls: [], cameras: [] });
    } finally {
      setHazardsLoading(false);
    }
  };

  const handleChangeProfile = (nextProfile) => {
    setProfile(nextProfile);
    handleRoute(nextProfile);
  };

  // No celular o mapa fica abaixo da lista, entao rola ate ele quando um ponto e exibido.
  useEffect(() => {
    if (coordinates && window.innerWidth < 900) {
      document.getElementById("mapa")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [coordinates]);

  // Esc fecha o card do endereco.
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && address) handleCloseDisplay();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [address]);

  const handleSearch = async (cep) => {
    setIsFavoriteView(false);
    setSelectedId(null);
    setLoading(true);
    setError("");
    setAddress(null);
    setCoordinates(null);
    setRoute(null);
    setHazards(null);
    setFocusUser(false);

    try {
      const addressData = await getAddressByCep(cep);
      setAddress(addressData);
      setRecent((prev) => [cep, ...prev.filter((item) => item !== cep)].slice(0, MAX_RECENT));

      const coords = await getCoordinatesByAddress(addressData);
      setCoordinates(coords);
    } catch (err) {
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFavorite = (currentAddress, currentCoordinates) => {
    const isAlreadyFavorite = favorites.some((fav) => fav.cep === currentAddress.cep);
    if (isAlreadyFavorite) {
      notify("Este endereço já está nos seus lugares.", "warning");
      return;
    }

    const newFavorite = {
      id: Date.now(),
      apelido: currentAddress.logradouro || currentAddress.localidade || "Novo lugar",
      ...currentAddress,
      coordinates: currentCoordinates,
    };
    setFavorites((prev) => [newFavorite, ...prev]);
    handleCloseDisplay();
    setError("");
    notify("Lugar salvo. Clique no lápis para dar um apelido.", "success");
  };

  const handleUpdateFavorite = (id, newApelido) => {
    setFavorites((prev) =>
      prev.map((fav) => (fav.id === id ? { ...fav, apelido: newApelido } : fav)),
    );
    if (selectedId === id && address) {
      setAddress((prev) => ({ ...prev, apelido: newApelido }));
    }
  };

  // Remove com opcao de desfazer no toast.
  const handleDeleteFavorite = (id) => {
    const index = favorites.findIndex((fav) => fav.id === id);
    if (index === -1) return;
    const removed = favorites[index];

    setFavorites((prev) => prev.filter((fav) => fav.id !== id));
    if (selectedId === id) handleCloseDisplay();

    notify(`"${removed.apelido}" removido.`, "info", () => {
      setFavorites((prev) => {
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, removed);
        return next;
      });
    });
  };

  const handleSelectFavorite = (favorite) => {
    if (!favorite) {
      handleCloseDisplay();
      return;
    }
    setError("");
    setAddress(favorite);
    setIsFavoriteView(true);
    setSelectedId(favorite.id);
    setCoordinates(favorite.coordinates || null);
    setRoute(null);
    setHazards(null);
    setFocusUser(false);
  };

  const toggleMode = () => setMode((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles />
        <AppWrapper>
          <Container maxWidth="xl">
            <Header
              mode={mode}
              onToggleMode={toggleMode}
              favoritesCount={favorites.length}
              citiesCount={citiesCount}
            />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 5, lg: 5 }}>
                <Panel>
                  <CepForm
                    onSearch={handleSearch}
                    loading={loading}
                    recent={recent}
                    onClearRecent={() => setRecent([])}
                  />

                  {loading && (
                    <Box sx={{ mt: 3 }}>
                      <Skeleton variant="rounded" height={28} width="40%" sx={{ mb: 1 }} />
                      <Skeleton variant="rounded" height={36} width="80%" sx={{ mb: 2 }} />
                      <Skeleton variant="rounded" height={72} />
                    </Box>
                  )}

                  {error && (
                    <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>
                      {error}
                    </Alert>
                  )}

                  {address && (
                    <AddressDisplay
                      address={address}
                      coordinates={coordinates}
                      isFavoriteView={isFavoriteView}
                      onSave={() => handleAddFavorite(address, coordinates)}
                      onClose={handleCloseDisplay}
                      onNotify={notify}
                      userLocation={userLocation}
                      route={route}
                      routing={routing}
                      onRoute={() => handleRoute()}
                      hazards={hazards}
                    />
                  )}

                  <FavoritesList
                    favorites={favorites}
                    selectedId={selectedId}
                    onUpdate={handleUpdateFavorite}
                    onDelete={handleDeleteFavorite}
                    onSelect={handleSelectFavorite}
                  />
                </Panel>
              </Grid>

              <Grid size={{ xs: 12, md: 7, lg: 7 }}>
                <StickyColumn id="mapa">
                  <MapView
                    coordinates={coordinates}
                    address={address}
                    favorites={favorites}
                    onSelectFavorite={handleSelectFavorite}
                    mode={mode}
                    userLocation={userLocation}
                    locating={locating}
                    focusUser={focusUser}
                    onLocate={handleLocate}
                    showLocationPrompt={showLocationPrompt}
                    locationDenied={permission === "denied"}
                    onDismissLocationPrompt={() => setLocationPromptDismissed(true)}
                    route={route}
                    routing={routing}
                    onChangeProfile={handleChangeProfile}
                    onClearRoute={() => {
                      setRoute(null);
                      setHazards(null);
                    }}
                    hazards={hazards}
                    hazardsLoading={hazardsLoading}
                  />
                </StickyColumn>
              </Grid>
            </Grid>

            <Stack
              component="footer"
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{
                mt: 4,
                color: "text.secondary",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="caption">
                Dados: <Link href="https://viacep.com.br" target="_blank" rel="noopener">ViaCEP</Link>
                {" · "}
                <Link href="https://opencagedata.com" target="_blank" rel="noopener">OpenCage</Link>
                {" · "}
                <Link href="https://www.openstreetmap.org" target="_blank" rel="noopener">OpenStreetMap</Link>
                {" · "}
                <Link href="https://project-osrm.org" target="_blank" rel="noopener">OSRM</Link>
              </Typography>
              <Typography variant="caption">
                Atalhos: <kbd>/</kbd> foca a busca · <kbd>Esc</kbd> fecha o endereço
              </Typography>
            </Stack>
          </Container>
        </AppWrapper>

        <Snackbar
          key={toast?.key}
          open={Boolean(toast)}
          autoHideDuration={toast?.undo ? 6000 : 3500}
          onClose={(_, reason) => reason !== "clickaway" && setToast(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          {toast && (
            <Alert
              severity={toast.severity}
              variant="filled"
              onClose={() => setToast(null)}
              action={
                toast.undo ? (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      toast.undo();
                      setToast(null);
                    }}
                  >
                    Desfazer
                  </Button>
                ) : undefined
              }
              sx={{ minWidth: 280 }}
            >
              {toast.message}
            </Alert>
          )}
        </Snackbar>
      </StyledThemeProvider>
    </MuiThemeProvider>
  );
}

export default App;
