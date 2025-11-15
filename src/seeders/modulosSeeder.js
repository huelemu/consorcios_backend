import { sequelize, Modulo, Rol, RolModulo } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seeder para poblar módulos del sistema y sus permisos por rol
 */

// Definir los módulos del sistema
const modulos = [
  {
    nombre: 'Dashboard',
    clave: 'dashboard',
    descripcion: 'Panel de control con estadísticas y resumen',
    icono: 'dashboard',
    ruta: '/dashboard',
    orden: 1,
    activo: true,
    requiere_consorcio: false
  },
  {
    nombre: 'Consorcios',
    clave: 'consorcios',
    descripcion: 'Gestión de consorcios',
    icono: 'building',
    ruta: '/consorcios',
    orden: 2,
    activo: true,
    requiere_consorcio: false
  },
  {
    nombre: 'Unidades',
    clave: 'unidades',
    descripcion: 'Gestión de unidades funcionales',
    icono: 'apartment',
    ruta: '/unidades',
    orden: 3,
    activo: true,
    requiere_consorcio: true
  },
  {
    nombre: 'Personas',
    clave: 'personas',
    descripcion: 'Gestión de personas (propietarios, inquilinos)',
    icono: 'people',
    ruta: '/personas',
    orden: 4,
    activo: true,
    requiere_consorcio: false
  },
  {
    nombre: 'Usuarios',
    clave: 'usuarios',
    descripcion: 'Gestión de usuarios del sistema',
    icono: 'person',
    ruta: '/usuarios',
    orden: 5,
    activo: true,
    requiere_consorcio: false
  },
  {
    nombre: 'Proveedores',
    clave: 'proveedores',
    descripcion: 'Gestión de proveedores',
    icono: 'store',
    ruta: '/proveedores',
    orden: 6,
    activo: true,
    requiere_consorcio: false
  },
  {
    nombre: 'Expensas',
    clave: 'expensas',
    descripcion: 'Gestión de expensas',
    icono: 'receipt',
    ruta: '/expensas',
    orden: 7,
    activo: true,
    requiere_consorcio: true
  },
  {
    nombre: 'Tickets',
    clave: 'tickets',
    descripcion: 'Sistema de tickets y solicitudes',
    icono: 'support',
    ruta: '/tickets',
    orden: 8,
    activo: true,
    requiere_consorcio: false
  }
];

/**
 * Matriz de permisos por rol
 * Estructura: { rol: 'nombre_rol', permisos: { clave_modulo: { ver, crear, editar, eliminar } } }
 */
const permisosPorRol = {
  admin_global: {
    // Admin global tiene acceso completo a todos los módulos
    dashboard: { ver: true, crear: true, editar: true, eliminar: true },
    consorcios: { ver: true, crear: true, editar: true, eliminar: true },
    unidades: { ver: true, crear: true, editar: true, eliminar: true },
    personas: { ver: true, crear: true, editar: true, eliminar: true },
    usuarios: { ver: true, crear: true, editar: true, eliminar: true },
    proveedores: { ver: true, crear: true, editar: true, eliminar: true },
    expensas: { ver: true, crear: true, editar: true, eliminar: true },
    tickets: { ver: true, crear: true, editar: true, eliminar: true }
  },
  tenant_admin: {
    // Tenant admin tiene acceso a sus consorcios
    dashboard: { ver: true, crear: false, editar: false, eliminar: false },
    consorcios: { ver: true, crear: true, editar: true, eliminar: true },
    unidades: { ver: true, crear: true, editar: true, eliminar: true },
    personas: { ver: true, crear: true, editar: true, eliminar: true },
    usuarios: { ver: true, crear: true, editar: true, eliminar: false },
    proveedores: { ver: true, crear: true, editar: true, eliminar: true },
    expensas: { ver: true, crear: true, editar: true, eliminar: false },
    tickets: { ver: true, crear: true, editar: true, eliminar: false }
  },
  admin_consorcio: {
    // Admin de consorcio puede gestionar su consorcio
    dashboard: { ver: true, crear: false, editar: false, eliminar: false },
    consorcios: { ver: true, crear: false, editar: true, eliminar: false },
    unidades: { ver: true, crear: true, editar: true, eliminar: true },
    personas: { ver: true, crear: true, editar: true, eliminar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
    proveedores: { ver: true, crear: true, editar: true, eliminar: false },
    expensas: { ver: true, crear: true, editar: true, eliminar: false },
    tickets: { ver: true, crear: true, editar: true, eliminar: false }
  },
  admin_edificio: {
    // Admin de edificio solo lectura
    dashboard: { ver: true, crear: false, editar: false, eliminar: false },
    consorcios: { ver: true, crear: false, editar: false, eliminar: false },
    unidades: { ver: true, crear: false, editar: false, eliminar: false },
    personas: { ver: true, crear: false, editar: false, eliminar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
    proveedores: { ver: true, crear: false, editar: false, eliminar: false },
    expensas: { ver: true, crear: false, editar: false, eliminar: false },
    tickets: { ver: true, crear: true, editar: false, eliminar: false }
  },
  propietario: {
    // Propietario solo ve su información y puede crear tickets
    dashboard: { ver: true, crear: false, editar: false, eliminar: false },
    consorcios: { ver: true, crear: false, editar: false, eliminar: false },
    unidades: { ver: true, crear: false, editar: false, eliminar: false },
    personas: { ver: false, crear: false, editar: false, eliminar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
    proveedores: { ver: false, crear: false, editar: false, eliminar: false },
    expensas: { ver: true, crear: false, editar: false, eliminar: false },
    tickets: { ver: true, crear: true, editar: false, eliminar: false }
  },
  inquilino: {
    // Inquilino similar a propietario
    dashboard: { ver: true, crear: false, editar: false, eliminar: false },
    consorcios: { ver: true, crear: false, editar: false, eliminar: false },
    unidades: { ver: true, crear: false, editar: false, eliminar: false },
    personas: { ver: false, crear: false, editar: false, eliminar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
    proveedores: { ver: false, crear: false, editar: false, eliminar: false },
    expensas: { ver: true, crear: false, editar: false, eliminar: false },
    tickets: { ver: true, crear: true, editar: false, eliminar: false }
  },
  proveedor: {
    // Proveedor solo ve tickets asignados
    dashboard: { ver: false, crear: false, editar: false, eliminar: false },
    consorcios: { ver: false, crear: false, editar: false, eliminar: false },
    unidades: { ver: false, crear: false, editar: false, eliminar: false },
    personas: { ver: false, crear: false, editar: false, eliminar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
    proveedores: { ver: false, crear: false, editar: false, eliminar: false },
    expensas: { ver: false, crear: false, editar: false, eliminar: false },
    tickets: { ver: true, crear: false, editar: true, eliminar: false }
  },
  usuario_pendiente: {
    // Usuario pendiente no tiene acceso a nada
    dashboard: { ver: false, crear: false, editar: false, eliminar: false },
    consorcios: { ver: false, crear: false, editar: false, eliminar: false },
    unidades: { ver: false, crear: false, editar: false, eliminar: false },
    personas: { ver: false, crear: false, editar: false, eliminar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
    proveedores: { ver: false, crear: false, editar: false, eliminar: false },
    expensas: { ver: false, crear: false, editar: false, eliminar: false },
    tickets: { ver: false, crear: false, editar: false, eliminar: false }
  }
};

async function seedModulos() {
  try {
    console.log('🌱 Iniciando seeder de módulos...\n');

    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida\n');

    // 1. Crear o actualizar módulos
    console.log('📦 Creando/actualizando módulos...');
    for (const moduloData of modulos) {
      const [modulo, created] = await Modulo.findOrCreate({
        where: { clave: moduloData.clave },
        defaults: moduloData
      });

      if (!created) {
        await modulo.update(moduloData);
        console.log(`   ✏️  Actualizado: ${moduloData.nombre}`);
      } else {
        console.log(`   ✅ Creado: ${moduloData.nombre}`);
      }
    }
    console.log('');

    // 2. Obtener todos los roles
    console.log('🔑 Obteniendo roles...');
    const roles = await Rol.findAll();
    console.log(`   ✅ Encontrados ${roles.length} roles\n`);

    // 3. Asignar permisos a cada rol
    console.log('🔐 Asignando permisos a roles...');
    for (const rol of roles) {
      const permisosRol = permisosPorRol[rol.nombre];

      if (!permisosRol) {
        console.log(`   ⚠️  No hay permisos definidos para el rol: ${rol.nombre}`);
        continue;
      }

      console.log(`\n   📋 Procesando rol: ${rol.nombre}`);

      for (const [claveModulo, permisos] of Object.entries(permisosRol)) {
        const modulo = await Modulo.findOne({ where: { clave: claveModulo } });

        if (!modulo) {
          console.log(`      ❌ Módulo no encontrado: ${claveModulo}`);
          continue;
        }

        const [asignacion, created] = await RolModulo.findOrCreate({
          where: {
            rol_id: rol.id,
            modulo_id: modulo.id
          },
          defaults: {
            rol_id: rol.id,
            modulo_id: modulo.id,
            puede_ver: permisos.ver,
            puede_crear: permisos.crear,
            puede_editar: permisos.editar,
            puede_eliminar: permisos.eliminar
          }
        });

        if (!created) {
          await asignacion.update({
            puede_ver: permisos.ver,
            puede_crear: permisos.crear,
            puede_editar: permisos.editar,
            puede_eliminar: permisos.eliminar
          });
          console.log(`      ✏️  ${modulo.nombre}: V:${permisos.ver} C:${permisos.crear} E:${permisos.editar} D:${permisos.eliminar}`);
        } else {
          console.log(`      ✅ ${modulo.nombre}: V:${permisos.ver} C:${permisos.crear} E:${permisos.editar} D:${permisos.eliminar}`);
        }
      }
    }

    console.log('\n\n✅ Seeder completado exitosamente!');
    console.log(`   • ${modulos.length} módulos creados/actualizados`);
    console.log(`   • ${roles.length} roles configurados`);
    console.log('\n📊 Resumen de permisos:');
    console.log('   V = Puede Ver');
    console.log('   C = Puede Crear');
    console.log('   E = Puede Editar');
    console.log('   D = Puede Eliminar\n');

  } catch (error) {
    console.error('❌ Error ejecutando seeder:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Ejecutar seeder si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedModulos()
    .then(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export default seedModulos;
