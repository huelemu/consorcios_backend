import express from 'express';
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  getProveedoresStats,
  // Personas
  getPersonasVinculadas,
  vincularPersona,
  updatePersonaVinculada,
  desvincularPersona,
  marcarPersonaPrincipal,
  // Cuentas
  getCuentasBancarias,
  agregarCuentaBancaria,
  updateCuentaBancaria,
  deleteCuentaBancaria,
  marcarCuentaPredeterminada,
  toggleCuentaActiva
} from '../controllers/proveedoresController.js';

const router = express.Router();

// Rutas básicas CRUD
router.get('/', getProveedores);
router.post('/', createProveedor);
router.get('/stats', getProveedoresStats);
router.get('/:id', getProveedorById);
router.put('/:id', updateProveedor);
router.delete('/:id', deleteProveedor);

// Rutas de personas vinculadas
router.get('/:id/personas', getPersonasVinculadas);
router.post('/:id/personas', vincularPersona);
router.put('/:id/personas/:personaId', updatePersonaVinculada);
router.delete('/:id/personas/:personaId', desvincularPersona);
router.patch('/:id/personas/:personaId/principal', marcarPersonaPrincipal);

// Rutas de cuentas bancarias
router.get('/:id/cuentas', getCuentasBancarias);
router.post('/:id/cuentas', agregarCuentaBancaria);
router.put('/:id/cuentas/:cuentaId', updateCuentaBancaria);
router.delete('/:id/cuentas/:cuentaId', deleteCuentaBancaria);
router.patch('/:id/cuentas/:cuentaId/predeterminada', marcarCuentaPredeterminada);
router.patch('/:id/cuentas/:cuentaId/toggle-activa', toggleCuentaActiva);

export default router;