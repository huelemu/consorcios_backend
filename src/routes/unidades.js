import { Router } from 'express';
import { Unidad } from '../models/index.js'; // ⭐ AGREGAR ESTA LÍNEA
import {
  getUnidades,
  getUnidadById,
  createUnidad,
  updateUnidad,
  deleteUnidad,
  getUnidadesStats
} from '../controllers/unidadesController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas específicas primero (antes de /:id)
router.get('/stats', getUnidadesStats);

// Rutas generales
router.get('/', getUnidades);
router.get('/:id', getUnidadById);
router.post('/', createUnidad);
router.put('/:id', updateUnidad);
router.delete('/:id', deleteUnidad);

router.post('/bulk-create', authenticateToken, async (req, res) => {
  const { consorcio_id, cantidad, prefijo, tipo, estado } = req.body;

  if (!consorcio_id || !cantidad) {
    return res.status(400).json({ message: 'consorcio_id y cantidad requeridos' });
  }

  try {
    const unidades = [];
    for (let i = 1; i <= cantidad; i++) {
      unidades.push({
        consorcio_id,
        codigo: `${prefijo}-${i.toString().padStart(3, '0')}`,
        piso: '0',
        superficie: 0,
        porcentaje_participacion: 0,
        estado: estado || 'vacante' // ⭐ CAMBIAR aquí
      });
    }

    await Unidad.bulkCreate(unidades);
    res.json({ success: true, creadas: cantidad });
  } catch (error) {
    console.error('Error bulk create:', error);
    res.status(500).json({ message: 'Error creando unidades', error: error.message });
  }
});

router.get('/consorcio/:consorcioId', async (req, res) => {
  try {
    const unidades = await Unidad.findAll({
      where: { consorcio_id: req.params.consorcioId }
    });
    res.json(unidades);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
});
export default router;