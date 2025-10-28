import { sequelize } from '../config/db.js'; 
import { Consorcio } from './consorcio.js';
import { Unidad } from './unidad.js';
import { Persona } from './persona.js';
import { Usuario } from './usuario.js';
import { Proveedor } from './proveedor.js';
import { Ticket } from './ticket.js';
import { ConsorcioProveedor } from './consorciosProveedor.js';

// ================================
// ASOCIACIONES ENTRE MODELOS
// ================================

// ✅ Consorcio ↔ Usuario (responsable opcional)
Consorcio.belongsTo(Usuario, { as: 'responsable', foreignKey: 'responsable_id' });

// ✅ Consorcio ↔ Unidad (1:N)
Consorcio.hasMany(Unidad, { foreignKey: 'consorcio_id', as: 'unidades' });
Unidad.belongsTo(Consorcio, { foreignKey: 'consorcio_id', as: 'consorcio' });

// ✅ Persona ↔ Usuario (1:1)
Usuario.belongsTo(Persona, { foreignKey: 'persona_id', as: 'persona' });
Persona.hasOne(Usuario, { foreignKey: 'persona_id', as: 'usuario' });

// ✅ Unidad ↔ Persona (N:M) con tabla intermedia
Unidad.belongsToMany(Persona, {
  through: 'personas_unidades_funcionales',
  as: 'personas',
  foreignKey: 'unidad_id',
  otherKey: 'persona_id'
});
Persona.belongsToMany(Unidad, {
  through: 'personas_unidades_funcionales',
  as: 'unidades',
  foreignKey: 'persona_id',
  otherKey: 'unidad_id'
});

// ✅ Unidad ↔ Ticket (1:N)
Unidad.hasMany(Ticket, { foreignKey: 'unidad_id', as: 'tickets' });
Ticket.belongsTo(Unidad, { foreignKey: 'unidad_id', as: 'unidad' });

// ✅ Consorcio ↔ Ticket (1:N)
Consorcio.hasMany(Ticket, { foreignKey: 'consorcio_id', as: 'tickets' });
Ticket.belongsTo(Consorcio, { foreignKey: 'consorcio_id', as: 'consorcio' });

// ✅ Usuario ↔ Ticket (1:N) creados y asignados
Usuario.hasMany(Ticket, { foreignKey: 'creado_por', as: 'tickets_creados' });
Ticket.belongsTo(Usuario, { foreignKey: 'creado_por', as: 'creador' });

Usuario.hasMany(Ticket, { foreignKey: 'asignado_a', as: 'tickets_asignados' });
Ticket.belongsTo(Usuario, { foreignKey: 'asignado_a', as: 'asignado' });

// ✅ Proveedor ↔ Persona (1:1)
Proveedor.belongsTo(Persona, { foreignKey: 'persona_id', as: 'persona' });

// ✅ ConsorcioProveedor ↔ Consorcio y Proveedor
ConsorcioProveedor.belongsTo(Consorcio, { foreignKey: 'consorcio_id', as: 'consorcio' });
ConsorcioProveedor.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });

// ✅ Proveedor ↔ ConsorcioProveedor (1:N)
Proveedor.hasMany(ConsorcioProveedor, { foreignKey: 'proveedor_id', as: 'consorcios_rel' });

// ✅ Consorcio ↔ ConsorcioProveedor (1:N)
Consorcio.hasMany(ConsorcioProveedor, { foreignKey: 'consorcio_id', as: 'proveedores_rel' });

// ================================
// EXPORTS
// ================================
export {
  sequelize,
  Consorcio,
  Unidad,
  Persona,
  Usuario,
  Ticket,
  Proveedor,
  ConsorcioProveedor
};
