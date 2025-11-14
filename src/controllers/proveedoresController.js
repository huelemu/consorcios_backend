import { Proveedor, Persona, ConsorcioProveedor, Consorcio } from '../models/index.js';
import { ProveedorPersona, ProveedorCuentaBancaria } from '../models/index.js';
import { sequelize } from '../models/index.js';
import { validarCBU, validarCUIT } from '../utils/validators.js';
import { Op } from 'sequelize';


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

    // ✅ VALIDACIÓN DE CBU
    if (data.cbu && !validarCBU(data.cbu)) {
      return res.status(400).json({
        message: 'El CBU debe tener exactamente 22 dígitos'
      });
    }

    // ✅ VALIDACIÓN DE CUIT
    if (data.cuit_titular && !validarCUIT(data.cuit_titular)) {
      return res.status(400).json({
        message: 'El CUIT debe tener el formato correcto (XX-XXXXXXXX-X o 11 dígitos)'
      });
    }

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

    // ✅ VALIDACIÓN DE CBU (si se está actualizando)
    if (req.body.cbu && !validarCBU(req.body.cbu)) {
      return res.status(400).json({
        message: 'El CBU debe tener exactamente 22 dígitos'
      });
    }

    // ✅ VALIDACIÓN DE CUIT (si se está actualizando)
    if (req.body.cuit_titular && !validarCUIT(req.body.cuit_titular)) {
      return res.status(400).json({
        message: 'El CUIT debe tener el formato correcto (XX-XXXXXXXX-X o 11 dígitos)'
      });
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

export const createProveedor = async (req, res) => {
  try {
    const data = req.body;

    // ✅ VALIDACIÓN DE CUIT (si viene)
    if (data.cuit && !validarCUIT(data.cuit)) {
      return res.status(400).json({
        message: 'El CUIT debe tener el formato correcto (XX-XXXXXXXX-X o 11 dígitos)'
      });
    }

    const proveedor = await Proveedor.create(data);

    // Devolver el proveedor creado con sus relaciones (opcionales)
    const proveedorCompleto = await Proveedor.findByPk(proveedor.id, {
      include: [
        { model: Persona, as: 'persona', required: false },
        { model: ProveedorPersona, as: 'personas', required: false },
        { model: ProveedorCuentaBancaria, as: 'cuentas_bancarias', required: false }
      ]
    });

    res.status(201).json(proveedorCompleto);
  } catch (error) {
    console.error('Error creating proveedor:', error);
    res.status(500).json({
      error: error.message,
      details: error.stack
    });
  }
};

export const updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    // ✅ VALIDACIÓN DE CUIT (si se está actualizando)
    if (req.body.cuit && !validarCUIT(req.body.cuit)) {
      return res.status(400).json({
        message: 'El CUIT debe tener el formato correcto (XX-XXXXXXXX-X o 11 dígitos)'
      });
    }

    await proveedor.update(req.body);

    // Devolver el proveedor actualizado con sus relaciones
    const proveedorCompleto = await Proveedor.findByPk(id, {
      include: [
        { model: Persona, as: 'persona' },
        { model: ProveedorPersona, as: 'personas' },
        { model: ProveedorCuentaBancaria, as: 'cuentas_bancarias' }
      ]
    });

    res.json(proveedorCompleto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    // Verificar si tiene relaciones activas
    const tienePersonas = await ProveedorPersona.count({ where: { proveedor_id: id } });
    const tieneCuentas = await ProveedorCuentaBancaria.count({ where: { proveedor_id: id } });
    const tieneConsorcios = await ConsorcioProveedor.count({ where: { proveedor_id: id } });

    if (tienePersonas > 0 || tieneCuentas > 0 || tieneConsorcios > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar el proveedor porque tiene relaciones activas',
        detalles: {
          personas: tienePersonas,
          cuentas: tieneCuentas,
          consorcios: tieneConsorcios
        }
      });
    }

    await proveedor.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};