import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { setupSwagger } from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import dashboardRoutes from './routes/dashboard.js';

// ⚠️ IMPORTANTE: Importar TODO el models/index.js ANTES de las rutas
import { 
  sequelize, 
  Consorcio, 
  Unidad, 
  Usuario, 
  Persona,
  Proveedor,
  ConsorcioProveedor,
  Ticket,
  TicketComentario,
  TicketHistorial,
  TicketAdjunto
} from './models/index.js';

// Rutas (DESPUÉS de los modelos)
import authRoutes from './routes/auth.js';
import consorciosRoutes from './routes/consorcios.js';
import unidadesRoutes from './routes/unidades.js';
import ticketsRoutes from './routes/tickets.js';
import proveedoresRoutes from './routes/proveedores.js';
import expensasRoutes from './routes/expensas.js';
import personasRoutes from './routes/personas.js';
import usuariosRoutes from './routes/usuarios.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// ================================
// Conexión Sequelize
// ================================
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión Sequelize establecida');
    
    // ⚠️ VERIFICAR QUE LAS RELACIONES EXISTAN
    console.log('\n🔍 Verificando relaciones de Ticket...');
    console.log('   - Consorcio:', Ticket.associations.consorcio ? '✅' : '❌ FALTA');
    console.log('   - Unidad:', Ticket.associations.unidad ? '✅' : '❌ FALTA');
    console.log('   - Creador:', Ticket.associations.creador ? '✅' : '❌ FALTA');
    console.log('   - Asignado:', Ticket.associations.asignado ? '✅' : '❌ FALTA');
    console.log('   - Comentarios:', Ticket.associations.comentarios ? '✅' : '❌ FALTA');
    console.log('   - Historial:', Ticket.associations.historial ? '✅' : '❌ FALTA');
    console.log('   - Adjuntos:', Ticket.associations.adjuntos ? '✅' : '❌ FALTA');
    
    console.log('\n📋 Todas las asociaciones de Ticket:');
    console.log(Object.keys(Ticket.associations));
    
  } catch (err) {
    console.error('❌ Error en conexión Sequelize:', err.message);
  }
})();

// ================================
// Swagger
// ================================
setupSwagger(app);

// ================================
// Rutas
// ================================
app.use('/auth', authRoutes);
app.use('/personas', personasRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/consorcios', consorciosRoutes);
app.use('/unidades', unidadesRoutes);
app.use('/tickets', ticketsRoutes);
app.use('/proveedores', proveedoresRoutes);
app.use('/expensas', expensasRoutes);
app.use('/dashboard', dashboardRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));