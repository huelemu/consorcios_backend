/**
 * Script de prueba para los nuevos filtros de consorcios:
 * 1. Filtro por código externo (codigo_ext)
 * 2. Filtro de consorcios con tickets pendientes
 */

const BASE_URL = 'http://localhost:3000/api/consorcios';

async function testFiltros() {
  console.log('========================================');
  console.log('PRUEBAS DE FILTROS DE CONSORCIOS');
  console.log('========================================\n');

  try {
    // TEST 1: Obtener todos los consorcios (sin filtros)
    console.log('TEST 1: Listado completo de consorcios');
    console.log('GET /api/consorcios');
    const response1 = await fetch(`${BASE_URL}?page=1&limit=5`);
    const data1 = await response1.json();
    console.log(`✓ Total de consorcios: ${data1.pagination.total}`);
    console.log(`✓ Mostrando ${data1.data.length} consorcios\n`);

    // TEST 2: Filtro por código externo
    console.log('TEST 2: Filtro por código externo (codigo_ext)');
    const codigoExtTest = 'EXT001'; // Ajusta este valor según tus datos
    console.log(`GET /api/consorcios?codigo_ext=${codigoExtTest}`);
    const response2 = await fetch(`${BASE_URL}?codigo_ext=${codigoExtTest}`);
    const data2 = await response2.json();
    console.log(`✓ Consorcios encontrados con codigo_ext que contiene '${codigoExtTest}': ${data2.data.length}`);
    if (data2.data.length > 0) {
      data2.data.forEach(c => {
        console.log(`  - ${c.nombre} (codigo_ext: ${c.codigo_ext})`);
      });
    }
    console.log('');

    // TEST 3: Filtro por consorcios con tickets pendientes
    console.log('TEST 3: Filtro de consorcios con tickets pendientes');
    console.log('GET /api/consorcios?con_tickets_pendientes=true');
    const response3 = await fetch(`${BASE_URL}?con_tickets_pendientes=true`);
    const data3 = await response3.json();
    console.log(`✓ Consorcios con tickets pendientes: ${data3.data.length}`);
    if (data3.data.length > 0) {
      data3.data.forEach(c => {
        console.log(`  - ${c.nombre} (${c.stats.ticketsPendientes} tickets pendientes)`);
      });
    }
    console.log('');

    // TEST 4: Verificar estadísticas de tickets pendientes
    console.log('TEST 4: Verificar estadísticas de tickets pendientes en listado general');
    console.log('GET /api/consorcios?limit=5');
    const response4 = await fetch(`${BASE_URL}?limit=5`);
    const data4 = await response4.json();
    console.log('✓ Estadísticas de tickets pendientes:');
    data4.data.forEach(c => {
      console.log(`  - ${c.nombre}: ${c.stats?.ticketsPendientes || 0} tickets pendientes`);
    });
    console.log('');

    // TEST 5: Combinar filtros
    console.log('TEST 5: Combinar filtros (estado + con_tickets_pendientes)');
    console.log('GET /api/consorcios?estado=activo&con_tickets_pendientes=true');
    const response5 = await fetch(`${BASE_URL}?estado=activo&con_tickets_pendientes=true`);
    const data5 = await response5.json();
    console.log(`✓ Consorcios activos con tickets pendientes: ${data5.data.length}`);
    console.log('');

    console.log('========================================');
    console.log('✓ TODAS LAS PRUEBAS COMPLETADAS');
    console.log('========================================');

  } catch (error) {
    console.error('✗ Error durante las pruebas:', error.message);
    console.error('\nAsegúrate de que el servidor esté corriendo en http://localhost:3000');
  }
}

// Ejecutar las pruebas
testFiltros();
