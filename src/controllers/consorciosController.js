import { Consorcio, Usuario, Unidad } from '../models/index.js';

/**
 * GET /api/consorcios
 * Lista todos los consorcios con su responsable
 */
export const getConsorcios = async (req, res) => {
  try {
    const consorcios = await Consorcio.findAll({
      include: [
        {
          model: Usuario,
          as: 'responsable',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['id', 'DESC']]
    });
    res.json(consorcios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/consorcios/:id
 * Obtiene un consorcio con sus unidades y responsable
 */
export const getConsorcioById = async (req, res) => {
  try {
    const { id } = req.params;
    const consorcio = await Consorcio.findByPk(id, {
      include: [
        { model: Usuario, as: 'responsable', attributes: ['id', 'username', 'email'] },
        { model: Unidad, as: 'unidades', attributes: ['id', 'codigo', 'piso', 'estado'] }
      ]
    });

    if (!consorcio) {
      return res.status(404).json({ message: 'Consorcio no encontrado' });
    }

    res.json(consorcio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/consorcios
 * Crea un nuevo consorcio
 */
export const createConsorcio = async (req, res) => {
  try {
    const { nombre, direccion, ciudad, provincia, pais, cuit, telefono_contacto, email_contacto, responsable_id } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: 'El nombre del consorcio es obligatorio' });
    }

    const nuevoConsorcio = await Consorcio.create({
      nombre,
      direccion,
      ciudad,
      provincia,
      pais,
      cuit,
      telefono_contacto,
      email_contacto,
      responsable_id,
      estado: 'activo'
    });

    res.status(201).json({
      message: 'Consorcio creado correctamente',
      data: nuevoConsorcio
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/consorcios/:id
 * Actualiza los datos de un consorcio existente
 */
export const updateConsorcio = async (req, res) => {
  try {
    const { id } = req.params;
    const consorcio = await Consorcio.findByPk(id);

    if (!consorcio) {
      return res.status(404).json({ message: 'Consorcio no encontrado' });
    }

    await consorcio.update(req.body);
    res.json({ message: 'Consorcio actualizado correctamente', data: consorcio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/consorcios/:id
 * Elimina un consorcio
 */
export const deleteConsorcio = async (req, res) => {
  try {
    const { id } = req.params;
    const consorcio = await Consorcio.findByPk(id);

    if (!consorcio) {
      return res.status(404).json({ message: 'Consorcio no encontrado' });
    }

    await consorcio.destroy();
    res.json({ message: 'Consorcio eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
