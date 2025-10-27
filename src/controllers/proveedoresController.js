import { Proveedor, Persona, ConsorcioProveedor, Consorcio } from '../models/index.js';
import { sequelize } from '../models/index.js';

export const getProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll({
      include: [
        { model: Persona, as: 'persona', attributes: ['id', 'nombre', 'apellido', 'documento'] },
        { 
          model: ConsorcioProveedor,
          as: 'consorcios_rel',
          include: [{ model: Consorcio, as: 'consorcio', attributes: ['id', 'nombre'] }]
        }
      ],
      order: [['id', 'DESC']]
    });
    res.json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getProveedoresStats = async (req, res) => {
  try {
    const total = await ConsorcioProveedor.count();
    const activos = await ConsorcioProveedor.count({ where: { estado: 'activo' } });
    const inactivos = await ConsorcioProveedor.count({ where: { estado: 'inactivo' } });
    res.json({ total, activos, inactivos });
  } catch (error) {
    console.error('Error al obtener estadísticas de proveedores:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getProveedorById = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id, {
      include: [
        { model: Persona, as: 'persona' },
        { model: ConsorcioProveedor, as: 'consorcios_rel' }
      ]
    });

    if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado' });
    res.json(proveedor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};