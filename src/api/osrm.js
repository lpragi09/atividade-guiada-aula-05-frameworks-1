// src/api/osrm.js
import axios from "axios";

// Servidores publicos do OSRM mantidos pela FOSSGIS (OpenStreetMap). Nao precisa
// de chave e, ao contrario do demo oficial, tem um servidor por meio de transporte.
const osrmApi = axios.create({
  baseURL: "https://routing.openstreetmap.de",
});

export const ROUTE_PROFILES = {
  driving: { label: "Carro", osrm: "routed-car" },
  cycling: { label: "Bike", osrm: "routed-bike" },
  walking: { label: "A pé", osrm: "routed-foot" },
};

// Calcula a rota entre dois pontos { lat, lng } e devolve os pontos do trajeto
// ja no formato [lat, lng] que o Leaflet usa, mais distancia (m) e duracao (s).
export const getRoute = async (from, to, profile = "driving") => {
  const server = ROUTE_PROFILES[profile]?.osrm || ROUTE_PROFILES.driving.osrm;
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;

  const response = await osrmApi.get(`/${server}/route/v1/driving/${coords}`, {
    params: { overview: "full", geometries: "geojson", steps: false },
  });

  const route = response.data?.routes?.[0];
  if (!route) {
    throw new Error("Não foi possível calcular uma rota até esse endereço.");
  }

  return {
    profile,
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distance: route.distance,
    duration: route.duration,
  };
};
