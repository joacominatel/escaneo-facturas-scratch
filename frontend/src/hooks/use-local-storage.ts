import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para sincronizar estado con localStorage.
 * @param key La clave bajo la cual guardar en localStorage.
 * @param initialValue El valor inicial a usar si no hay nada en localStorage o en SSR.
 * @returns Una tupla [storedValue, setValue] similar a useState.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Función para obtener el valor inicial desde localStorage (solo en cliente)
  const readValue = useCallback((): T => {
    // Prevenir build errors durante SSR
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      // Parsear el JSON guardado o devolver initialValue si no existe o es inválido
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  // Estado para guardar nuestro valor
  // Se inicializa con la función readValue para obtener el valor guardado si existe
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Wrapper para setValue que persiste en localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    // Prevenir build errors durante SSR
    if (typeof window === 'undefined') {
      console.warn(`Tried setting localStorage key “${key}” even though environment is not a client`);
    }

    try {
      // Permitir valor funcional como en useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Guardar estado
      setStoredValue(valueToStore);
      // Guardar en localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  // useEffect para actualizar el estado si localStorage cambia en otra pestaña/ventana
  // (Opcional, pero útil para consistencia)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window.localStorage) {
        try {
           setStoredValue(event.newValue ? JSON.parse(event.newValue) : initialValue);
        } catch (error) {
             console.warn(`Error parsing localStorage change for key “${key}”:`, error);
             setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]); // No incluir readValue aquí

  // useEffect para asegurar que el estado se inicializa correctamente en el cliente
  // después de la hidratación si readValue se ejecutó en SSR.
  useEffect(() => {
    setStoredValue(readValue());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Ejecutar solo una vez al montar en cliente


  return [storedValue, setValue];
} 