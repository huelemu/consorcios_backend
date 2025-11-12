import { Proveedor, Persona, ConsorcioProveedor, Consorcio } from '../models/index.js';
import { ProveedorPersona, ProveedorCuentaBancaria } from '../models/index.js';
import { sequelize } from '../models/index.js';


// ========================================
// Personas Vinculadas
// ========================================

export const getPersonasVinculadas = async (req, res) => {
  try {
    const { id } = req.params;
    const personas = await ProveedorPersona.findAll({
      where: { proveedor_id: id },
      include: [{ model: Persona, as: 'persona' }],
      order: [['es_principal', 'DESC'], ['desde', 'DESC']]
    });
    res.json(personas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const vincularPersona = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body, proveedor_id: id };

    // Si se marca como principal, desmarcar las demás
    if (data.es_principal) {
      await ProveedorPersona.update(
        { es_principal: false },
        { where: { proveedor_id: id } }
      );
    }

    const persona = await ProveedorPersona.create(data);
    const personaCompleta = await ProveedorPersona.findByPk(persona.id, {
      include: [{ model: Persona, as: 'persona' }]
    });

    res.status(201).json(personaCompleta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePersonaVinculada = async (req, res) => {
  try {
    const { id, personaId } = req.params;
    const persona = await ProveedorPersona.findOne({
      where: { id: personaId, proveedor_id: id }
    });

    if (!persona) {
      return res.status(404).json({ message: 'Vinculación no encontrada' });
    }

    // Si se marca como principal, desmarcar las demás
    if (req.body.es_principal) {
      await ProveedorPersona.update(
        { es_principal: false },
        { where: { proveedor_id: id, id: { [Op.ne]: personaId } } }
      );
    }

    await persona.update(req.body);
    const personaCompleta = await ProveedorPersona.findByPk(personaId, {
      include: [{ model: Persona, as: 'persona' }]
    });

    res.json(personaCompleta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const desvincularPersona = async (req, res) => {
  try {
    const { id, personaId } = req.params;
    const deleted = await ProveedorPersona.destroy({
      where: { id: personaId, proveedor_id: id }
    });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Vinculación no encontrada' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const marcarPersonaPrincipal = async (req, res) => {
  try {
    const { id, personaId } = req.params;

    // Desmarcar todas las personas del proveedor
    await ProveedorPersona.update(
      { es_principal: false },
      { where: { proveedor_id: id } }
    );

    // Marcar la seleccionada
    const [updated] = await ProveedorPersona.update(
      { es_principal: true },
      { where: { id: personaId, proveedor_id: id } }
    );

    if (updated === 0) {
      return res.status(404).json({ message: 'Vinculación no encontrada' });
    }

    const personaCompleta = await ProveedorPersona.findByPk(personaId, {
      include: [{ model: Persona, as: 'persona' }]
    });

    res.json(personaCompleta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// Cuentas Bancarias
// ========================================

export const getCuentasBancarias = async (req, res) => {
  try {
    const { id } = req.params;
    const cuentas = await ProveedorCuentaBancaria.findAll({
      where: { proveedor_id: id },
      order: [['predeterminada', 'DESC'], ['created_at', 'DESC']]
    });
    res.json(cuentas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const agregarCuentaBancaria = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body, proveedor_id: id };

    // Si se marca como predeterminada, desmarcar las demás
    if (data.predeterminada) {
      await ProveedorCuentaBancaria.update(
        { predeterminada: false },
        { where: { proveedor_id: id } }
      );
    }

    const cuenta = await ProveedorCuentaBancaria.create(data);
    res.status(201).json(cuenta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCuentaBancaria = async (req, res) => {
  try {
    const { id, cuentaId } = req.params;
    const cuenta = await ProveedorCuentaBancaria.findOne({
      where: { id: cuentaId, proveedor_id: id }
    });

    if (!cuenta) {
      return res.status(404).json({ message: 'Cuenta no encontrada' });
    }

    // Si se marca como predeterminada, desmarcar las demás
    if (req.body.predeterminada) {
      await ProveedorCuentaBancaria.update(
        { predeterminada: false },
        { where: { proveedor_id: id, id: { [Op.ne]: cuentaId } } }
      );
    }

    await cuenta.update(req.body);
    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCuentaBancaria = async (req, res) => {
  try {
    const { id, cuentaId } = req.params;
    const deleted = await ProveedorCuentaBancaria.destroy({
      where: { id: cuentaId, proveedor_id: id }
    });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Cuenta no encontrada' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const marcarCuentaPredeterminada = async (req, res) => {
  try {
    const { id, cuentaId } = req.params;

    // Desmarcar todas las cuentas del proveedor
    await ProveedorCuentaBancaria.update(
      { predeterminada: false },
      { where: { proveedor_id: id } }
    );

    // Marcar la seleccionada
    const [updated] = await ProveedorCuentaBancaria.update(
      { predeterminada: true },
      { where: { id: cuentaId, proveedor_id: id } }
    );

    if (updated === 0) {
      return res.status(404).json({ message: 'Cuenta no encontrada' });
    }

    const cuenta = await ProveedorCuentaBancaria.findByPk(cuentaId);
    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleCuentaActiva = async (req, res) => {
  try {
    const { id, cuentaId } = req.params;
    const cuenta = await ProveedorCuentaBancaria.findOne({
      where: { id: cuentaId, proveedor_id: id }
    });

    if (!cuenta) {
      return res.status(404).json({ message: 'Cuenta no encontrada' });
    }

    await cuenta.update({ activa: !cuenta.activa });
    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
        { model: ConsorcioProveedor, as: 'consorcios_rel' },
        {
          model: ProveedorPersona,
          as: 'personas',
          include: [{ model: Persona, as: 'persona' }]
        },
        { model: ProveedorCuentaBancaria, as: 'cuentas_bancarias' }
      ]
    });

    if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado' });
    res.json(proveedor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};