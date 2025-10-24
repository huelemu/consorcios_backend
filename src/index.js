import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { setupSwagger } from './config/swagger.js';
import { sequelize } from './models/index.js';
import { errorHandler } from './middleware/errorHandler.js';

// Rutas
import consorciosRoutes from './routes/consorcios.js';
import unidadesRoutes from './routes/unidades.js';
import ticketsRoutes from './routes/tickets.js';
import proveedoresRoutes from './routes/proveedores.js';
import expensasRoutes from './routes/expensas.js';
import personasRoutes from './routes/personas.js';
import usuariosRoutes from './routes/usuarios.js';
import authRoutes from './routes/auth.js';

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
console.log('🔧 Registrando rutas...');

app.use('/personas', personasRoutes);
console.log('  ✅ /personas');

app.use('/usuarios', usuariosRoutes);
console.log('  ✅ /usuarios');

app.use('/consorcios', consorciosRoutes);
console.log('  ✅ /consorcios');

app.use('/unidades', unidadesRoutes);
console.log('  ✅ /unidades');

app.use('/tickets', ticketsRoutes);
console.log('  ✅ /tickets');

app.use('/proveedores', proveedoresRoutes);
console.log('  ✅ /proveedores');

app.use('/expensas', expensasRoutes);
console.log('  ✅ /expensas');

app.use('/auth', authRoutes);
console.log('  ✅ /auth');

console.log('');

// ================================
// Middleware de errores
// ================================
app.use(errorHandler);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📘 Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`🧪 Test auth: curl http://localhost:${PORT}/auth/verificar-token/test`);
});