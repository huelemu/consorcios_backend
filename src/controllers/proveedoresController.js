import db from '../config/db.js';

export const getProveedores = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, pr.razon_social, pr.rubro, cp.servicio, cp.estado
      FROM proveedores pr
      LEFT JOIN consorcios_proveedores cp ON cp.proveedor_id = pr.id
      LEFT JOIN consorcios c ON c.id = cp.consorcio_id
      LEFT JOIN personas p ON p.id = pr.persona_id
      ORDER BY pr.id DESC;
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProveedorById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM proveedores WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Proveedor no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
