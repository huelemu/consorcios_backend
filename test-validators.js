/**
 * Script de prueba para validar las funciones de validación
 * Ejecutar con: node test-validators.js
 */

import { validarCBU, validarCUIT, formatearCBU, formatearCUIT } from './src/utils/validators.js';

console.log('🧪 PRUEBAS DE VALIDACIÓN\n');

// ==========================================
// PRUEBAS DE CBU
// ==========================================
console.log('📋 Validación de CBU:');
console.log('--------------------');

const cbuTests = [
  { value: '0170001540000001234567', expected: true, description: 'CBU válido de 22 dígitos' },
  { value: '0170 0015 4000 0001 2345 67', expected: true, description: 'CBU válido con espacios' },
  { value: '017000154000000123456', expected: false, description: 'CBU con 21 dígitos (inválido)' },
  { value: '01700015400000012345678', expected: false, description: 'CBU con 23 dígitos (inválido)' },
  { value: '0170001540000001234ABC', expected: false, description: 'CBU con letras (inválido)' },
  { value: '', expected: false, description: 'CBU vacío' },
  { value: null, expected: false, description: 'CBU null' },
];

cbuTests.forEach(test => {
  const result = validarCBU(test.value);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} ${test.description}: "${test.value}" => ${result}`);
});

console.log('\n📋 Formateo de CBU:');
console.log('------------------');
console.log(`CBU sin formato: 0170001540000001234567`);
console.log(`CBU formateado: ${formatearCBU('0170001540000001234567')}`);

// ==========================================
// PRUEBAS DE CUIT
// ==========================================
console.log('\n\n📋 Validación de CUIT:');
console.log('---------------------');

const cuitTests = [
  { value: '20-12345678-9', expected: true, description: 'CUIT válido con guiones' },
  { value: '20123456789', expected: true, description: 'CUIT válido sin guiones' },
  { value: '27 12345678 9', expected: false, description: 'CUIT con espacios (inválido)' },
  { value: '20-1234567-9', expected: false, description: 'CUIT con formato incorrecto' },
  { value: '201234567890', expected: false, description: 'CUIT con 12 dígitos (inválido)' },
  { value: 'AB-12345678-9', expected: false, description: 'CUIT con letras (inválido)' },
  { value: '', expected: false, description: 'CUIT vacío' },
  { value: null, expected: false, description: 'CUIT null' },
];

cuitTests.forEach(test => {
  const result = validarCUIT(test.value);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} ${test.description}: "${test.value}" => ${result}`);
});

console.log('\n📋 Formateo de CUIT:');
console.log('-------------------');
console.log(`CUIT sin formato: 20123456789`);
console.log(`CUIT formateado: ${formatearCUIT('20123456789')}`);

// ==========================================
// RESUMEN
// ==========================================
console.log('\n\n✅ Todas las pruebas completadas!');
console.log('\n💡 Estas validaciones ahora están integradas en:');
console.log('   - src/controllers/proveedoresController.js (agregarCuentaBancaria)');
console.log('   - src/controllers/proveedoresController.js (updateCuentaBancaria)');
