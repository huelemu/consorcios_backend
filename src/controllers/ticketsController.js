import { sequelize } from '../config/db.js';

export const getTickets = async (req, res) => {
  try {
    const [rows] = await sequelize.query(`
      SELECT 
        t.id, 
        t.descripcion, 
        t.prioridad, 
        t.estado, 
        c.nombre AS consorcio, 
        u.username AS creado_por
      FROM tickets t
      LEFT JOIN consorcios c ON c.id = t.consorcio_id
      LEFT JOIN usuarios u ON u.id = t.creado_por
      ORDER BY t.id DESC;
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      'SELECT * FROM tickets WHERE id = ?',
      { replacements: [req.params.id] } // 👈 uso correcto de parámetros en Sequelize
    );

    if (rows.length === 0)
      return res.status(404).json({ message: 'Ticket no encontrado' });

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener ticket por ID:', error);
    res.status(500).json({ error: error.message });
  }
};
