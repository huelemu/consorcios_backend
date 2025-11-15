import { Consorcio, Usuario, Unidad, Persona, Ticket } from '../models/index.js';
import { Op } from 'sequelize';
import {sequelize} from '../config/db.js';
import xlsx from 'xlsx';
import fs from 'fs';


/**
 * =========================================
 * GET /api/consorcios
 * =========================================
 * Lista consorcios con filtros, búsqueda y paginación
 */
export const getConsorcios = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      estado = '',
      ciudad = '',
      provincia = '',
      responsable_id = '',
      codigo_ext = '',
      tiene_tickets_pendientes = '',
      con_tickets_pendientes = '', // Mantener compatibilidad con nombre anterior
      sortBy = 'nombre',
      sortOrder = 'asc'
    } = req.query;

    // Construir filtros dinámicos
    const whereClause = {};

    // Aplicar filtro de permisos de usuario (viene del middleware)
    if (req.consorcioFilter) {
      Object.assign(whereClause, req.consorcioFilter);
    }

    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { direccion: { [Op.like]: `%${search}%` } },
        { cuit: { [Op.like]: `%${search}%` } }
      ];
    }

    if (estado) {
      whereClause.estado = estado;
    }

    if (ciudad) {
      whereClause.ciudad = { [Op.like]: `%${ciudad}%` };
    }

    if (provincia) {
      whereClause.provincia = { [Op.like]: `%${provincia}%` };
    }

    if (responsable_id) {
      whereClause.responsable_id = responsable_id;
    }

    if (codigo_ext) {
      whereClause.codigo_ext = { [Op.like]: `%${codigo_ext}%` };
    }

    // Filtro especial: solo consorcios con tickets pendientes
    // Soporta tanto 'tiene_tickets_pendientes' (frontend) como 'con_tickets_pendientes' (legacy)
    const filtroTicketsPendientes = tiene_tickets_pendientes || con_tickets_pendientes;
    let includeTicketsFilter = null;
    if (filtroTicketsPendientes === 'true' || filtroTicketsPendientes === '1') {
      includeTicketsFilter = {
        model: Ticket,
        as: 'tickets',
        where: {
          estado: { [Op.in]: ['abierto', 'en_proceso', 'pendiente'] }
        },
        attributes: [],
        required: true // INNER JOIN - solo consorcios con tickets pendientes
      };
    }

    // Calcular offset para paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Construir includes dinámicamente
    const includes = [
      {
        model: Usuario,
        as: 'responsable',
        attributes: ['id', 'username', 'email', 'rol_global'],
        include: [
          {
            model: Persona,
            as: 'persona',
            attributes: ['nombre', 'apellido', 'documento', 'telefono']
          }
        ]
      },
      {
        model: Unidad,
        as: 'unidades',
        attributes: ['id', 'codigo', 'estado'],
        separate: true // Para evitar duplicados en el count
      }
    ];

    // Agregar filtro de tickets pendientes si se solicitó
    if (includeTicketsFilter) {
      includes.push(includeTicketsFilter);
    }

    // Obtener consorcios con paginación
    const { count, rows: consorcios } = await Consorcio.findAndCountAll({
      where: whereClause,
      include: includes,
      limit: parseInt(limit),
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      distinct: true, // Para que el count sea correcto
      subQuery: false // Evita problemas con límites cuando se usan JOINs
    });

    // Calcular datos adicionales para cada consorcio
    const consorciosConStats = await Promise.all(
      consorcios.map(async (consorcio) => {
        const consorcioData = consorcio.toJSON();
        
        // Contar unidades por estado
        const unidadesStats = await Unidad.count({
          where: { consorcio_id: consorcio.id },
          group: ['estado']
        });

        // Contar tickets pendientes
        const ticketsPendientes = await Ticket.count({
          where: {
            consorcio_id: consorcio.id,
            estado: { [Op.in]: ['abierto', 'en_proceso', 'pendiente'] }
          }
        });

        return {
          ...consorcioData,
          stats: {
            totalUnidades: consorcio.unidades?.length || 0,
            unidadesOcupadas: consorcioData.unidades?.filter(u => u.estado === 'ocupado').length || 0,
            ticketsPendientes: ticketsPendientes || 0
          }
        };
      })
    );

    // Respuesta con metadatos de paginación
    res.json({
      data: consorciosConStats,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error en getConsorcios:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * =========================================
 * GET /api/consorcios/:id
 * =========================================
 * Obtiene un consorcio por ID con todos sus datos relacionados
 */
export const getConsorcioById = async (req, res) => {
  try {
    const { id } = req.params;

    const consorcio = await Consorcio.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'responsable',
          attributes: ['id', 'username', 'email', 'rol_global', 'activo'],
          include: [
            {
              model: Persona,
              as: 'persona',
              attributes: ['nombre', 'apellido', 'documento', 'telefono', 'email']
            }
          ]
        },
        {
          model: Unidad,
          as: 'unidades',
          attributes: [
            'id', 'codigo', 'piso', 'superficie', 
            'porcentaje_participacion', 'estado'
          ]
        }
      ]
    });

    if (!consorcio) {
      return res.status(404).json({ 
        message: 'Consorcio no encontrado',
        code: 'CONSORCIO_NOT_FOUND' 
      });
    }

    // Agregar estadísticas
    const stats = {
      totalUnidades: consorcio.unidades?.length || 0,
      unidadesOcupadas: consorcio.unidades?.filter(u => u.estado === 'ocupado').length || 0,
      unidadesVacantes: consorcio.unidades?.filter(u => u.estado === 'vacante').length || 0,
      superficieTotal: consorcio.unidades?.reduce((sum, u) => sum + (parseFloat(u.superficie) || 0), 0) || 0
    };

    res.json({
      ...consorcio.toJSON(),
      stats
    });

  } catch (error) {
    console.error('Error en getConsorcioById:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * =========================================
 * POST /api/consorcios
 * =========================================
 * Crea un nuevo consorcio
 */
export const createConsorcio = async (req, res) => {
  try {
    const {
      tenant_id,
      codigo_ext,
      nombre,
      direccion,
      ciudad,
      provincia,
      pais,
      cuit,
      telefono_contacto,
      email_contacto,
      responsable_id
    } = req.body;

    // Validaciones básicas
    if (!nombre) {
      return res.status(400).json({ 
        message: 'El nombre del consorcio es obligatorio',
        code: 'VALIDATION_ERROR'
      });
    }

    // Validar que el responsable existe y tiene el rol correcto
    if (responsable_id) {
      const responsable = await Usuario.findByPk(responsable_id);
      if (!responsable) {
        return res.status(400).json({ 
          message: 'El usuario responsable no existe',
          code: 'INVALID_RESPONSABLE'
        });
      }
      if (!['admin_global', 'tenant_admin', 'admin_consorcio'].includes(responsable.rol_global)) {
        return res.status(400).json({ 
          message: 'El usuario no tiene permisos para ser responsable de un consorcio',
          code: 'INVALID_ROLE'
        });
      }
    }

    // Crear consorcio
    const nuevoConsorcio = await Consorcio.create({
      tenant_id,
      nombre,
      direccion,
      codigo_ext,
      ciudad,
      provincia,
      pais: pais || 'Argentina',
      cuit,
      telefono_contacto,
      email_contacto,
      responsable_id,
      estado: 'activo'
    });

    // Obtener el consorcio completo con relaciones
    const consorcioCompleto = await Consorcio.findByPk(nuevoConsorcio.id, {
      include: [
        {
          model: Usuario,
          as: 'responsable',
          attributes: ['id', 'username', 'email'],
          include: [
            {
              model: Persona,
              as: 'persona',
              attributes: ['nombre', 'apellido']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      message: 'Consorcio creado correctamente',
      data: consorcioCompleto
    });

  } catch (error) {
    console.error('Error en createConsorcio:', error);
    
    // Errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Error de validación',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({ error: error.message });
  }
};

/**
 * =========================================
 * PUT /api/consorcios/:id
 * =========================================
 * Actualiza un consorcio existente
 */
export const updateConsorcio = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const consorcio = await Consorcio.findByPk(id);

    if (!consorcio) {
      return res.status(404).json({ 
        message: 'Consorcio no encontrado',
        code: 'CONSORCIO_NOT_FOUND'
      });
    }

    // Validar responsable si se está actualizando
    if (updateData.responsable_id) {
      const responsable = await Usuario.findByPk(updateData.responsable_id);
      if (!responsable) {
        return res.status(400).json({ 
          message: 'El usuario responsable no existe',
          code: 'INVALID_RESPONSABLE'
        });
      }
      if (!['admin_global', 'tenant_admin', 'admin_consorcio'].includes(responsable.rol_global)) {
        return res.status(400).json({ 
          message: 'El usuario no tiene permisos para ser responsable',
          code: 'INVALID_ROLE'
        });
      }
    }

    // Actualizar
    await consorcio.update(updateData);

    // Obtener consorcio actualizado con relaciones
    const consorcioActualizado = await Consorcio.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'responsable',
          attributes: ['id', 'username', 'email'],
          include: [
            {
              model: Persona,
              as: 'persona',
              attributes: ['nombre', 'apellido']
            }
          ]
        }
      ]
    });

    res.json({
      message: 'Consorcio actualizado correctamente',
      data: consorcioActualizado
    });

  } catch (error) {
    console.error('Error en updateConsorcio:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Error de validación',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({ error: error.message });
  }
};

/**
 * =========================================
 * DELETE /api/consorcios/:id
 * =========================================
 * Elimina (soft delete) un consorcio cambiando su estado a inactivo
 */
export const deleteConsorcio = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard = false } = req.query; // ?hard=true para eliminación física

    const consorcio = await Consorcio.findByPk(id);

    if (!consorcio) {
      return res.status(404).json({ 
        message: 'Consorcio no encontrado',
        code: 'CONSORCIO_NOT_FOUND'
      });
    }

    // Verificar si tiene unidades asociadas
    const unidadesCount = await Unidad.count({
      where: { consorcio_id: id }
    });

    if (unidadesCount > 0 && hard === 'true') {
      return res.status(400).json({ 
        message: `No se puede eliminar el consorcio porque tiene ${unidadesCount} unidades asociadas`,
        code: 'HAS_DEPENDENCIES'
      });
    }

    if (hard === 'true') {
      // Eliminación física (solo si no tiene dependencias)
      await consorcio.destroy();
      res.json({ 
        message: 'Consorcio eliminado permanentemente',
        deleted: true
      });
    } else {
      // Soft delete: cambiar estado a inactivo
      await consorcio.update({ estado: 'inactivo' });
      res.json({ 
        message: 'Consorcio desactivado correctamente',
        data: consorcio
      });
    }

  } catch (error) {
    console.error('Error en deleteConsorcio:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * =========================================
 * GET /api/consorcios/stats/general
 * =========================================
 * Obtiene estadísticas generales de consorcios
 */
export const getConsorciosStats = async (req, res) => {
  try {
    const stats = await Consorcio.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN estado = 'activo' THEN 1 END")), 'activos'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN estado = 'inactivo' THEN 1 END")), 'inactivos']
      ],
      raw: true
    });

    // Stats por ciudad
    const porCiudad = await Consorcio.findAll({
      attributes: [
        'ciudad',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      where: {
        ciudad: { [Op.not]: null }
      },
      group: ['ciudad'],
      order: [[sequelize.literal('cantidad'), 'DESC']],
      limit: 10,
      raw: true
    });

    // Stats por provincia
    const porProvincia = await Consorcio.findAll({
      attributes: [
        'provincia',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      where: {
        provincia: { [Op.not]: null }
      },
      group: ['provincia'],
      order: [[sequelize.literal('cantidad'), 'DESC']],
      raw: true
    });

    // Total de unidades
    const totalUnidades = await Unidad.count();

    res.json({
      consorcios: stats[0],
      totalUnidades,
      porCiudad,
      porProvincia
    });

  } catch (error) {
    console.error('Error en getConsorciosStats:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * =========================================
 * PATCH /api/consorcios/:id/activar
 * =========================================
 * Activa un consorcio
 */
export const activarConsorcio = async (req, res) => {
  try {
    const { id } = req.params;
    const consorcio = await Consorcio.findByPk(id);

    if (!consorcio) {
      return res.status(404).json({ 
        message: 'Consorcio no encontrado',
        code: 'CONSORCIO_NOT_FOUND'
      });
    }

    await consorcio.update({ estado: 'activo' });

    res.json({
      message: 'Consorcio activado correctamente',
      data: consorcio
    });

  } catch (error) {
    console.error('Error en activarConsorcio:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * =========================================
 * POST /api/consorcios/upload-excel
 * =========================================
 * Carga masiva de consorcios desde un archivo Excel
 * Permite que una misma columna del Excel se asigne a múltiples campos del modelo
 */
export const uploadConsorciosExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ningún archivo' });
    }

    // Leer el archivo Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    // Leer mapping del frontend (si existe)
    const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;

    const consorciosParaInsertar = [];

    for (const fila of data) {
      const consorcio = {};

      if (mapping && Object.keys(mapping).length > 0) {
        // mapping: { "Nombre": ["nombre", "direccion"], "Ciudad": ["ciudad"] }
        for (const [colExcel, camposBD] of Object.entries(mapping)) {
          const valor = fila[colExcel];
          if (valor !== undefined && valor !== null) {
            for (const campo of camposBD) {
              consorcio[campo] = valor;
            }
          }
        }
      } else {
        // Fallback: mapeo estándar por nombres conocidos
        const mapeoPorDefecto = {
          codigo_ext: 'codigo',
          Nombre: 'nombre',
          Direccion: 'direccion',
          Ciudad: 'ciudad',
          Provincia: 'provincia',
          Pais: 'pais',
          CUIT: 'cuit',
          Telefono: 'telefono_contacto',
          Email: 'email_contacto',
          'Responsable ID': 'responsable_id',
          'Tenant ID': 'tenant_id'
        };

        for (const [columnaExcel, campoBD] of Object.entries(mapeoPorDefecto)) {
          if (fila[columnaExcel] !== undefined && fila[columnaExcel] !== null) {
            consorcio[campoBD] = fila[columnaExcel];
          }
        }
      }

      // Validaciones mínimas
      if (!consorcio.nombre) {
        console.warn('Fila sin nombre de consorcio, se omite:', fila);
        continue;
      }

      // Defaults
      consorcio.estado = 'activo';
      if (!consorcio.pais) consorcio.pais = 'Argentina';

      consorciosParaInsertar.push(consorcio);
    }

    if (!consorciosParaInsertar.length) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: 'No se detectaron consorcios válidos para importar'
      });
    }

    // Inserción masiva
    const nuevosConsorcios = await Consorcio.bulkCreate(consorciosParaInsertar);

    // Borrar archivo temporal
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: `${nuevosConsorcios.length} consorcios creados correctamente`,
      data: nuevosConsorcios
    });
  } catch (error) {
    console.error('Error al importar consorcios:', error);

    // Intentar borrar el archivo temporal si existe
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: 'Error al procesar el archivo Excel',
      error: error.message
    });
  }
};

/**
 * =========================================
 * PATCH /api/consorcios/:id/desactivar
 * =========================================
 * Desactiva un consorcio
 */
export const desactivarConsorcio = async (req, res) => {
  try {
    const { id } = req.params;
    const consorcio = await Consorcio.findByPk(id);

    if (!consorcio) {
      return res.status(404).json({ 
        message: 'Consorcio no encontrado',
        code: 'CONSORCIO_NOT_FOUND'
      });
    }

    await consorcio.update({ estado: 'inactivo' });

    res.json({
      message: 'Consorcio desactivado correctamente',
      data: consorcio
    });

  } catch (error) {
    console.error('Error en desactivarConsorcio:', error);
    res.status(500).json({ error: error.message });
  }
  
};