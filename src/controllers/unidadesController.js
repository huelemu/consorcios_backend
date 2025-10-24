import Unidad  from '../models/unidad.js';
import Consorcio from '../models/consorcio.js';

export const getUnidades = async (req, res) => {
  try {
    const unidades = await Unidad.findAll({
      include: { model: Consorcio, as: 'consorcio' }
    });
    res.json(unidades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnidadById = async (req, res) => {
  try {
    const unidad = await Unidad.findByPk(req.params.id, {
      include: { model: Consorcio, as: 'consorcio' }
    });
    if (!unidad) return res.status(404).json({ message: 'Unidad no encontrada' });
    res.json(unidad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnidadesByConsorcio = async (req, res) => {
  try {
    const { consorcioId } = req.params;
    const unidades = await Unidad.findAll({
      where: { consorcio_id: consorcioId },
      include: { model: Consorcio, as: 'consorcio' }
    });
    res.json(unidades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUnidad = async (req, res) => {
  try {
    const { consorcio_id } = req.body;
    const consorcio = await Consorcio.findByPk(consorcio_id);
    if (!consorcio) return res.status(400).json({ message: 'Consorcio no válido' });

    const unidad = await Unidad.create(req.body);
    res.status(201).json(unidad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUnidad = async (req, res) => {
  try {
    const unidad = await Unidad.findByPk(req.params.id);
    if (!unidad) return res.status(404).json({ message: 'Unidad no encontrada' });
    await unidad.update(req.body);
    res.json(unidad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUnidad = async (req, res) => {
  try {
    const unidad = await Unidad.findByPk(req.params.id);
    if (!unidad) return res.status(404).json({ message: 'Unidad no encontrada' });
    await unidad.destroy();
    res.json({ message: 'Unidad eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
