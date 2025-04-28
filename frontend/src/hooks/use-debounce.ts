import { useState, useEffect } from 'react'

/**
 * Hook para debouncear un valor.
 * @param value El valor a debouncear.
 * @param delay El tiempo de espera en milisegundos.
 * @returns El valor debounceado.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // Estado para guardar el valor debounceado
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Actualizar el valor debounceado después del delay especificado
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Limpiar el timeout si el valor cambia (esto cancela el debounce anterior)
    // o si el componente se desmonta
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay]) // Solo re-ejecutar si el valor o el delay cambian

  return debouncedValue
} 