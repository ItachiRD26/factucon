// Validación local de formato (sin red) de RNC/Cédula dominicanos — capa
// rápida antes de consultar /api/validate-rnc contra el padrón de la DGII.
// Portado de soraya-tours-ecf/lib/masks.ts (ya probado en producción).

// RNC jurídico — 9 dígitos, módulo 11.
export function validarRNC(value: string): boolean {
  const d = value.replace(/\D/g, '');
  if (d.length !== 9) return false;
  const pesos = [7, 9, 8, 6, 5, 4, 3, 2] as const;
  let suma = 0;
  for (let i = 0; i < 8; i++) {
    suma += Number(d.charAt(i)) * pesos[i];
  }
  const mod = suma % 11;
  const verificador = mod === 0 ? 0 : mod === 1 ? 1 : 11 - mod;
  return verificador === Number(d.charAt(8));
}

// Cédula (persona física) — 11 dígitos, módulo 10.
export function validarCedula(value: string): boolean {
  const d = value.replace(/\D/g, '');
  if (d.length !== 11) return false;
  const pesos = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2] as const;
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    let prod = Number(d.charAt(i)) * pesos[i];
    if (prod >= 10) prod -= 9;
    suma += prod;
  }
  const verificador = (10 - (suma % 10)) % 10;
  return verificador === Number(d.charAt(10));
}

// Acepta cualquiera de los dos formatos (RNC jurídico de 9 o cédula de 11).
export function validarRNCOCedula(value: string): boolean {
  const d = value.replace(/\D/g, '');
  return d.length === 9 ? validarRNC(d) : d.length === 11 ? validarCedula(d) : false;
}
