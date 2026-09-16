// src/utils/geo.js

// Mantem so os digitos e aplica a mascara 00000-000 enquanto o usuario digita.
export const formatCep = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

export const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

// Monta o endereco em uma linha, ignorando os campos vazios.
export const formatAddress = (address) => {
  if (!address) return "";
  const parts = [
    address.logradouro,
    address.bairro,
    address.localidade && address.uf
      ? `${address.localidade} - ${address.uf}`
      : address.localidade || address.uf,
    address.cep ? `CEP ${formatCep(address.cep)}` : null,
  ];
  return parts.filter(Boolean).join(", ");
};

// Distancia em km entre dois pontos (formula de Haversine).
export const distanceKm = (a, b) => {
  if (!a || !b) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const formatDistance = (km) => {
  if (km === null || km === undefined) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toLocaleString("pt-BR", { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
};

export const formatBRL = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Duracao em segundos -> "1 h 05 min" / "12 min".
export const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return "";
  const totalMin = Math.max(1, Math.round(seconds / 60));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, "0")} min`;
};

// Link de rota no Google Maps a partir da posicao do usuario.
export const googleMapsRouteUrl = (from, to) =>
  `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}`;

export const googleMapsUrl = (coordinates, address) => {
  if (coordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(address))}`;
};

// Cor estavel por UF, usada nos avatares e nos marcadores dos favoritos.
const UF_COLORS = [
  "#3b5bdb", "#d6336c", "#0ca678", "#f59f00", "#7048e8",
  "#1098ad", "#e8590c", "#5c940d", "#c2255c", "#1971c2",
];
export const colorForUf = (uf = "") => {
  let hash = 0;
  for (const ch of uf) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  return UF_COLORS[hash % UF_COLORS.length];
};
