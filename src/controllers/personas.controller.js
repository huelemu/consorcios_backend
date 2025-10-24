import { Persona } from '../models/persona.js';

export const getPersonas = async (req, res) => {
  try {
    const personas = await Persona.findAll();
    res.json(personas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPersonaById = async (req, res) => {
  try {
    const persona = await Persona.findByPk(req.params.id);
    if (!persona) return res.status(404).json({ message: 'Persona no encontrada' });
    res.json(persona);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPersona = async (req, res) => {
  try {
    const persona = await Persona.create(req.body);
    res.status(201).json(persona);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePersona = async (req, res) => {
  try {
    const persona = await Persona.findByPk(req.params.id);
    if (!persona) return res.status(404).json({ message: 'Persona no encontrada' });
    await persona.update(req.body);
    res.json(persona);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePersona = async (req, res) => {
  try {
    const persona = await Persona.findByPk(req.params.id);
    if (!persona) return res.status(404).json({ message: 'Persona no encontrada' });
    await persona.destroy();
    res.json({ message: 'Persona eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
