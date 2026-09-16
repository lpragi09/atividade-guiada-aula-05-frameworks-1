// src/api/overpass.js
import axios from "axios";
import L from "leaflet";

// Overpass e a API de consulta do OpenStreetMap. Uso ela para achar pracas de
// pedagio (barrier=toll_booth / highway=toll_gantry) e radares (highway=speed_camera)
// a ate ~40 m da linha da rota.
// Os servidores publicos limitam requisicoes por IP (HTTP 429). Se um recusar,
// tenta o proximo espelho.
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const AROUND_METERS = 40;
const MAX_POINTS = 300;

const RETRY_STATUSES = new Set([429, 502, 503, 504]);

const postQuery = async (query) => {
  let lastError;
  for (const url of ENDPOINTS) {
    try {
      return await axios.post(url, `data=${encodeURIComponent(query)}`, {
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        timeout: 30000,
      });
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      if (status && !RETRY_STATUSES.has(status)) throw err;
    }
  }
  throw lastError;
};

// Evita repetir a mesma consulta (ex.: trocar de carro para bike e voltar).
const cache = new Map();

// A rota pode ter milhares de pontos; o Overpass aceita bem algumas centenas.
// Simplifica com o algoritmo do proprio Leaflet e, se ainda for muito, amostra.
const simplifyRoute = (coordinates) => {
  const points = coordinates.map(([lat, lng]) => ({ x: lng, y: lat }));
  let simplified = L.LineUtil.simplify(points, 0.0004);
  if (simplified.length > MAX_POINTS) {
    const step = Math.ceil(simplified.length / MAX_POINTS);
    simplified = simplified.filter((_, i) => i % step === 0 || i === simplified.length - 1);
  }
  return simplified.map((p) => `${p.y.toFixed(5)},${p.x.toFixed(5)}`).join(",");
};

// Tags de valor no OSM aparecem de varios jeitos: "R$ 8,90", "8.90 BRL", "BRL 8.9",
// "14.30BRL/motorcar;0.00BRL/motorcycle;14.30BRL/hgv/axle" (por tipo de veiculo).
// Prefere a entrada de carro (motorcar); senao usa a primeira.
export const parseCharge = (tags = {}) => {
  const raw = tags.charge || tags["charge:motorcar"] || tags["charge:car"] || tags.fee_amount;
  if (!raw) return null;
  const parts = String(raw).split(";").map((p) => p.trim());
  const first = parts.find((p) => /motorcar|car/i.test(p)) || parts[0];
  const match = first.match(/(\d+(?:[.,]\d{1,2})?)/);
  if (!match) return null;
  const value = parseFloat(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
};

const centerOf = (el) => (el.type === "node" ? { lat: el.lat, lng: el.lon } : { lat: el.center?.lat, lng: el.center?.lon });

// Devolve { tolls: [...], cameras: [...] } com posicao, nome e valor/velocidade.
export const getRouteHazards = async (coordinates) => {
  const line = simplifyRoute(coordinates);
  const query = `
    [out:json][timeout:25];
    (
      node["barrier"="toll_booth"](around:${AROUND_METERS},${line});
      way["barrier"="toll_booth"](around:${AROUND_METERS},${line});
      node["highway"="toll_gantry"](around:${AROUND_METERS},${line});
      node["highway"="speed_camera"](around:${AROUND_METERS},${line});
    );
    out center tags;
  `;

  if (cache.has(line)) return cache.get(line);
  const response = await postQuery(query);

  const tolls = [];
  const cameras = [];
  const seen = new Set();

  for (const el of response.data?.elements || []) {
    const pos = centerOf(el);
    if (pos.lat === undefined) continue;
    // Pracas com varias cabines viram varios nos quase no mesmo lugar: agrupa por ~100 m.
    const key = `${el.tags?.highway === "speed_camera" ? "c" : "t"}:${pos.lat.toFixed(3)},${pos.lng.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const tags = el.tags || {};
    if (tags.highway === "speed_camera") {
      cameras.push({
        id: el.id,
        ...pos,
        maxspeed: tags.maxspeed ? parseInt(tags.maxspeed, 10) || null : null,
        name: tags.name || null,
      });
    } else {
      tolls.push({
        id: el.id,
        ...pos,
        name: tags.name || tags.operator || "Pedágio",
        operator: tags.operator || null,
        charge: parseCharge(tags),
        chargeRaw: tags.charge || null,
      });
    }
  }

  const result = { tolls, cameras };
  cache.set(line, result);
  return result;
};

// Resumo dos pedagios: total conhecido e quantos nao tem valor cadastrado.
export const summarizeTolls = (tolls = []) => {
  const known = tolls.filter((t) => t.charge !== null);
  return {
    count: tolls.length,
    total: known.reduce((sum, t) => sum + t.charge, 0),
    knownCount: known.length,
    missingCount: tolls.length - known.length,
  };
};
