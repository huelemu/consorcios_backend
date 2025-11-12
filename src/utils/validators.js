/**
 * Validaciones para datos de proveedores
 */

/**
 * Valida que un CBU tenga el formato correcto (22 dígitos)
 * @param {string} cbu - El CBU a validar
 * @returns {boolean} - true si es válido, false si no
 */
export function validarCBU(cbu) {
  if (!cbu) return false;

  // Eliminar espacios en blanco
  const cbuLimpio = cbu.replace(/\s/g, '');

  // Validar que tenga exactamente 22 dígitos
  const regex = /^\d{22}$/;
  return regex.test(cbuLimpio);
}

/**
 * Valida que un CUIT tenga el formato correcto
 * Acepta formatos: XX-XXXXXXXX-X o XXXXXXXXXXX (11 dígitos)
 * @param {string} cuit - El CUIT a validar
 * @returns {boolean} - true si es válido, false si no
 */
export function validarCUIT(cuit) {
  if (!cuit) return false;

  // Eliminar espacios en blanco
  const cuitLimpio = cuit.replace(/\s/g, '');

  // Validar formato con o sin guiones
  const regexConGuiones = /^\d{2}-\d{8}-\d{1}$/;
  const regexSinGuiones = /^\d{11}$/;

  return regexConGuiones.test(cuitLimpio) || regexSinGuiones.test(cuitLimpio);
}

/**
 * Valida que un email tenga formato correcto
 * @param {string} email - El email a validar
 * @returns {boolean} - true si es válido, false si no
 */
export function validarEmail(email) {
  if (!email) return false;

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Formatea un CBU agregando espacios cada 4 dígitos para mejor legibilidad
 * @param {string} cbu - El CBU a formatear
 * @returns {string} - CBU formateado
 */
export function formatearCBU(cbu) {
  if (!cbu) return '';

  const cbuLimpio = cbu.replace(/\s/g, '');
  return cbuLimpio.match(/.{1,4}/g)?.join(' ') || cbuLimpio;
}

/**
 * Formatea un CUIT agregando guiones si no los tiene
 * @param {string} cuit - El CUIT a formatear
 * @returns {string} - CUIT formateado (XX-XXXXXXXX-X)
 */
export function formatearCUIT(cuit) {
  if (!cuit) return '';

  const cuitLimpio = cuit.replace(/[-\s]/g, '');

  if (cuitLimpio.length !== 11) return cuit;

  return `${cuitLimpio.slice(0, 2)}-${cuitLimpio.slice(2, 10)}-${cuitLimpio.slice(10)}`;
}
