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
import authRoutes from './routes/auth.js';  // ✅ AGREGAR ESTA LÍNEA

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
app.use('/personas', personasRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/consorcios', consorciosRoutes);
app.use('/unidades', unidadesRoutes);
app.use('/tickets', ticketsRoutes);
app.use('/proveedores', proveedoresRoutes);
app.use('/expensas', expensasRoutes);
app.use('/auth', authRoutes);  // ✅ AGREGAR ESTA LÍNEA

app.use(errorHandler);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));