/**
 * Script de prueba para crear un proveedor
 * Ejecutar con: node test-create-proveedor.js
 */

import { Proveedor, ProveedorPersona, ProveedorCuentaBancaria } from './src/models/index.js';
import { sequelize } from './src/config/db.js';

async function testCreateProveedor() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    // Verificar que las tablas existan
    console.log('📊 Verificando tablas...');

    try {
      const [proveedores] = await sequelize.query('DESCRIBE proveedores');
      console.log('✅ Tabla proveedores existe');
      console.log('   Columnas:', proveedores.map(c => c.Field).join(', '));
    } catch (e) {
      console.log('❌ Tabla proveedores no existe o hay error:', e.message);
    }

    try {
      const [personas] = await sequelize.query('DESCRIBE proveedor_personas');
      console.log('✅ Tabla proveedor_personas existe');
      console.log('   Columnas:', personas.map(c => c.Field).join(', '));
    } catch (e) {
      console.log('❌ Tabla proveedor_personas no existe:', e.message);
    }

    try {
      const [cuentas] = await sequelize.query('DESCRIBE proveedor_cuentas_bancarias');
      console.log('✅ Tabla proveedor_cuentas_bancarias existe');
      console.log('   Columnas:', cuentas.map(c => c.Field).join(', '));
    } catch (e) {
      console.log('❌ Tabla proveedor_cuentas_bancarias no existe:', e.message);
    }

    console.log('\n🧪 Intentando crear un proveedor de prueba...');

    const proveedorData = {
      razon_social: 'Proveedor Test',
      tipo_entidad: 'fisica',
      cuit: '20-12345678-9',
      rubro: 'Servicios',
      email_general: 'test@test.com',
      telefono: '1234567890',
      activo: true
    };

    console.log('📝 Datos:', JSON.stringify(proveedorData, null, 2));

    const proveedor = await Proveedor.create(proveedorData);
    console.log('✅ Proveedor creado exitosamente!');
    console.log('   ID:', proveedor.id);

    // Intentar obtenerlo con relaciones
    console.log('\n🔍 Intentando obtener con relaciones...');
    const proveedorCompleto = await Proveedor.findByPk(proveedor.id, {
      include: [
        {
          model: ProveedorPersona,
          as: 'personas',
          required: false
        },
        {
          model: ProveedorCuentaBancaria,
          as: 'cuentas_bancarias',
          required: false
        }
      ]
    });

    console.log('✅ Proveedor obtenido con relaciones!');
    console.log(JSON.stringify(proveedorCompleto, null, 2));

    // Limpiar: eliminar el proveedor de prueba
    await proveedor.destroy();
    console.log('\n🗑️  Proveedor de prueba eliminado');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);

    if (error.original) {
      console.error('\nError SQL original:', error.original.message);
      console.error('SQL:', error.original.sql);
    }
  } finally {
    await sequelize.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

testCreateProveedor();
