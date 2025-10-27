import express from 'express';
import { 
  getProveedores, 
  getProveedorById, 
  getProveedoresStats 
} from '../controllers/proveedoresController.js';

const router = express.Router();

router.get('/', getProveedores);
router.get('/stats', getProveedoresStats);
router.get('/:id', getProveedorById);

export default router;
