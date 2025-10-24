import db from '../config/db.js';

export const getExpensas = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.periodo, e.monto, e.pagado, uf.codigo AS unidad, c.nombre AS consorcio
      FROM expensas e
      LEFT JOIN unidades_funcionales uf ON uf.id = e.unidad_id
      LEFT JOIN consorcios c ON c.id = uf.consorcio_id
      ORDER BY e.id DESC;
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getExpensaById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM expensas WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Expensa no encontrada' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
