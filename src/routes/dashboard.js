import express from 'express';
import { sequelize } from '../models/index.js';

const router = express.Router();

/**
 * =========================================
 * GET /dashboard/stats
 * =========================================
 * Obtiene estadísticas generales del sistema
 */
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM consorcios WHERE estado = 'activo') as totalConsorcios,
        (SELECT COUNT(*) FROM unidades_funcionales) as totalUnidades,
        (SELECT COUNT(*) FROM usuarios WHERE activo = TRUE) as totalUsuarios,
        (SELECT COUNT(*) FROM personas) as totalPersonas,
        (SELECT COUNT(*) FROM proveedores WHERE activo = TRUE) as totalProveedores,
        (SELECT COUNT(*) FROM tickets WHERE estado IN ('abierto', 'en_proceso')) as totalTicketsPendientes
    `);

    res.json(stats[0]);
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    res.status(500).json({ 
      error: 'Error obteniendo estadísticas',
      message: error.message 
    });
  }
});

/**
 * =========================================
 * GET /dashboard/tickets-pendientes
 * =========================================
 * Obtiene consorcios con tickets pendientes
 * ordenados por cantidad (mayor a menor)
 */
router.get('/tickets-pendientes', async (req, res) => {
  try {
    // Solo consorcios con tickets pendientes
    const [consorcios] = await sequelize.query(`
      SELECT 
        c.id,
        c.nombre,
        CONCAT(c.direccion, ', ', c.ciudad) as descripcion,
        COUNT(t.id) as ticketsPendientes,
        SUM(CASE WHEN t.estado = 'abierto' THEN 1 ELSE 0 END) as ticketsAbiertos,
        SUM(CASE WHEN t.estado = 'en_proceso' THEN 1 ELSE 0 END) as ticketsEnProceso,
        COUNT(DISTINCT t.unidad_id) as unidadesAfectadas
      FROM consorcios c
      INNER JOIN tickets t ON t.consorcio_id = c.id
      WHERE t.estado IN ('abierto', 'en_proceso')
        AND c.estado = 'activo'
      GROUP BY c.id, c.nombre, c.direccion, c.ciudad
      HAVING COUNT(t.id) > 0
      ORDER BY ticketsPendientes DESC, c.nombre ASC
    `);

    res.json(consorcios);
  } catch (error) {
    console.error('Error obteniendo tickets pendientes del dashboard:', error);
    res.status(500).json({ 
      error: 'Error obteniendo tickets pendientes',
      message: error.message 
    });
  }
});

export default router;