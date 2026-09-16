// src/GlobalStyles.js
import { createGlobalStyle, keyframes } from "styled-components";

const float = keyframes`
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(40px, -30px, 0) scale(1.08); }
  100% { transform: translate3d(0, 0, 0) scale(1); }
`;

const pulse = keyframes`
  from { transform: scale(0.5); opacity: 0.9; }
  to   { transform: scale(1.6); opacity: 0; }
`;

// Estilos que nao pertencem a nenhum componente: os "blobs" coloridos do fundo,
// a barra de rolagem e o marcador customizado do Leaflet (que e HTML puro,
// entao nao da para estilizar com sx).
const GlobalStyles = createGlobalStyle`
  :root {
    color-scheme: ${({ theme }) => theme.palette.mode};
  }

  body::before,
  body::after {
    content: "";
    position: fixed;
    z-index: -1;
    width: 60vmax;
    height: 60vmax;
    border-radius: 50%;
    filter: blur(90px);
    opacity: ${({ theme }) => (theme.palette.mode === "dark" ? 0.35 : 0.45)};
    pointer-events: none;
    animation: ${float} 18s ease-in-out infinite;
  }

  body::before {
    top: -25vmax;
    left: -20vmax;
    background: ${({ theme }) => theme.palette.primary.main};
  }

  body::after {
    right: -25vmax;
    bottom: -30vmax;
    background: ${({ theme }) => theme.palette.secondary.main};
    animation-delay: -9s;
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: ${({ theme }) => theme.palette.divider} transparent;
  }

  /* Marcador customizado do mapa (divIcon do Leaflet) */
  .geo-marker-wrap {
    background: transparent;
    border: none;
  }

  .geo-marker {
    --c: ${({ theme }) => theme.palette.primary.main};
    position: relative;
    display: block;
    width: 24px;
    height: 24px;
    border-radius: 50% 50% 50% 0;
    background: var(--c);
    border: 3px solid #fff;
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
    transform: rotate(-45deg);
    transform-origin: center;
    transition: transform 0.2s ease;
  }

  .geo-marker:hover {
    transform: rotate(-45deg) scale(1.15);
  }

  .geo-marker::before {
    content: "";
    position: absolute;
    inset: 5px;
    border-radius: 50%;
    background: #fff;
    opacity: 0.9;
  }

  .geo-marker.is-active::after {
    content: "";
    position: absolute;
    inset: -16px;
    border-radius: 50%;
    border: 3px solid var(--c);
    animation: ${pulse} 1.6s ease-out infinite;
  }

  .geo-marker.is-muted {
    opacity: 0.75;
    width: 18px;
    height: 18px;
  }

  /* Marcador da posicao do usuario: ponto azul com anel pulsante */
  .geo-user {
    position: relative;
    display: block;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #2f9e44;
    border: 3px solid #fff;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  }

  .geo-user::after {
    content: "";
    position: absolute;
    inset: -12px;
    border-radius: 50%;
    border: 3px solid #2f9e44;
    animation: ${pulse} 2s ease-out infinite;
  }

  /* Badges de pedagio e radar na rota */
  .geo-badge {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 8px;
    border: 2px solid #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    color: #fff;
  }

  .geo-badge svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }

  .geo-badge.is-toll {
    background: #f59f00;
  }

  .geo-badge.is-camera {
    background: #e03131;
    border-radius: 50%;
  }

  /* Modo escuro do mapa: inverte os tiles do OSM e corrige o tom */
  .tiles-dark {
    filter: invert(1) hue-rotate(200deg) brightness(0.9) contrast(0.9) saturate(0.5);
  }

  .leaflet-container {
    font-family: inherit;
    background: ${({ theme }) => theme.palette.background.default};
  }

  .leaflet-popup-content-wrapper,
  .leaflet-popup-tip {
    background: ${({ theme }) => theme.palette.background.paper};
    color: ${({ theme }) => theme.palette.text.primary};
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  }

  .leaflet-popup-content-wrapper {
    border-radius: 12px;
  }

  .leaflet-popup-content {
    margin: 12px 16px;
    font-size: 13px;
    line-height: 1.5;
  }

  .leaflet-control-zoom a,
  .leaflet-control-attribution {
    background: ${({ theme }) => theme.palette.background.paper} !important;
    color: ${({ theme }) => theme.palette.text.primary} !important;
    border-color: ${({ theme }) => theme.palette.divider} !important;
  }

  .leaflet-control-attribution a {
    color: ${({ theme }) => theme.palette.primary.main} !important;
  }
`;

export default GlobalStyles;
