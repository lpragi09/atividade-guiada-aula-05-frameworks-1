// src/hooks/useGeolocation.js
import { useCallback, useEffect, useState } from "react";

const OPTIONS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 };

// Guarda a posicao do usuario. Se a permissao ja foi concedida antes, busca a
// posicao sozinho ao abrir a pagina (sem mostrar prompt), para o usuario ja
// aparecer no mapa. Caso contrario, so pede quando `locate()` for chamado.
export default function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);

  const locate = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          const err = new Error("Seu navegador não suporta geolocalização.");
          setError(err.message);
          reject(err);
          return;
        }
        setLocating(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const next = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            };
            setPosition(next);
            setLocating(false);
            resolve(next);
          },
          (geoError) => {
            const message =
              geoError.code === geoError.PERMISSION_DENIED
                ? "Permissão de localização negada. Libere no ícone de cadeado do navegador."
                : "Não foi possível obter sua localização.";
            setError(message);
            setLocating(false);
            reject(new Error(message));
          },
          OPTIONS,
        );
      }),
    [],
  );

  useEffect(() => {
    if (!navigator.permissions?.query) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (!cancelled && status.state === "granted") locate().catch(() => {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [locate]);

  return { position, locating, error, locate };
}
