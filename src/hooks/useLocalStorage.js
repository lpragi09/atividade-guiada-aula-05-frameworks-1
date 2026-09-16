// src/hooks/useLocalStorage.js
import { useEffect, useState } from "react";

// Mesma ideia de um useState, mas o valor tambem fica salvo no localStorage.
// O initialValue pode ser uma funcao, igual ao useState.
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved);
    } catch (error) {
      console.error(`Falha ao ler "${key}" do localStorage`, error);
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Falha ao salvar "${key}" no localStorage`, error);
    }
  }, [key, value]);

  return [value, setValue];
}
