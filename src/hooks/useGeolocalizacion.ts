import { useState, useEffect, useRef } from "react";

export interface Coordenadas {
  lat: number;
  lng: number;
  precision?: number;
}

interface UseGeolocalizacionProps {
  enabled: boolean;
  intervaloMs?: number;
  onUbicacion?: (coords: Coordenadas) => void;
  onError?: (error: GeolocationPositionError) => void;
}

export function useGeolocalizacion({
  enabled,
  intervaloMs = 60000, // 60 segundos por defecto
  onUbicacion,
  onError,
}: UseGeolocalizacionProps) {
  const [ubicacionActual, setUbicacionActual] = useState<Coordenadas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<number | null>(null);

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      const errorMsg = "Geolocalización no soportada por este navegador";
      setError(errorMsg);
      return;
    }

    setCargando(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordenadas = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          precision: position.coords.accuracy,
        };
        setUbicacionActual(coords);
        setError(null);
        setCargando(false);
        onUbicacion?.(coords);
      },
      (err) => {
        setError(err.message);
        setCargando(false);
        onError?.(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (!enabled) {
      // Limpiar tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    // Obtener ubicación inicial
    obtenerUbicacion();

    // Configurar tracking periódico
    intervalIdRef.current = window.setInterval(() => {
      obtenerUbicacion();
    }, intervaloMs);

    return () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [enabled, intervaloMs]);

  return {
    ubicacionActual,
    error,
    cargando,
    obtenerUbicacion,
  };
}
