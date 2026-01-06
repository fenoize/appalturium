/**
 * Utilidades para formatear y validar RUT chileno
 */

// Limpia el RUT de cualquier caracter no válido
export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

// Formatea el RUT en formato XX.XXX.XXX-X
export function formatRut(rut: string): string {
  const clean = cleanRut(rut);
  
  if (clean.length < 2) return clean;
  
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  // Formatear con puntos
  let formatted = '';
  let count = 0;
  
  for (let i = body.length - 1; i >= 0; i--) {
    formatted = body[i] + formatted;
    count++;
    if (count === 3 && i > 0) {
      formatted = '.' + formatted;
      count = 0;
    }
  }
  
  return `${formatted}-${dv}`;
}

// Valida el dígito verificador del RUT
export function validateRut(rut: string): boolean {
  const clean = cleanRut(rut);
  
  if (clean.length < 2) return false;
  
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const calculatedDv = remainder === 0 ? '0' : remainder === 1 ? 'K' : String(11 - remainder);
  
  return dv === calculatedDv;
}

// Obtiene solo los números del RUT (sin DV) para comparación
export function getRutBody(rut: string): string {
  return cleanRut(rut).slice(0, -1);
}
