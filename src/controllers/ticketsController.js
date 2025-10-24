import db from '../config/db.js';

export const getTickets = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.id, t.descripcion, t.prioridad, t.estado, 
             c.nombre AS consorcio, u.username AS creado_por
      FROM tickets t
      LEFT JOIN consorcios c ON c.id = t.consorcio_id
      LEFT JOIN usuarios u ON u.id = t.creado_por
      ORDER BY t.id DESC;
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Ticket no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
