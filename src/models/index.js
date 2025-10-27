import sequelize from '../config/db.js';
import Consorcio from './consorcio.js';
import Unidad from './unidad.js';
import Persona from './persona.js';
import Usuario from './usuario.js';
import { Ticket }  from './ticket.js';

// ================================
// Asociaciones (todas acá)
// ================================

// Consorcio ↔ Usuario (responsable opcional)
Consorcio.belongsTo(Usuario, { as: 'responsable', foreignKey: 'responsable_id' });

// Consorcio ↔ Unidad
Consorcio.hasMany(Unidad, { foreignKey: 'consorcio_id', as: 'unidades' });
Unidad.belongsTo(Consorcio, { foreignKey: 'consorcio_id', as: 'consorcio' });

// Persona ↔ Usuario (1:1)
Usuario.belongsTo(Persona, { foreignKey: 'persona_id', as: 'persona' });
Persona.hasOne(Usuario, { foreignKey: 'persona_id', as: 'usuario' });

// Unidad ⇄ Persona (N:M) con tabla pivote y alias usados por el controlador
Unidad.belongsToMany(Persona, {through: 'personas_unidades_funcionales',  as: 'personas', foreignKey: 'unidad_id', otherKey: 'persona_id'});
Persona.belongsToMany(Unidad, {through: 'personas_unidades_funcionales',  as: 'unidades', foreignKey: 'persona_id', otherKey: 'unidad_id'});

// ✅ Unidad ↔ Ticket (1:N)
Unidad.hasMany(Ticket, { foreignKey: 'unidad_id', as: 'tickets' });
Ticket.belongsTo(Unidad, { foreignKey: 'unidad_id', as: 'unidad' });

export {
  sequelize,
  Consorcio,
  Unidad,
  Persona,
  Usuario,
  Ticket,
};