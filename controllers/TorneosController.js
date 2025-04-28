const Torneo = require('../models/Torneo.js');
const Usuarios = require('../models/Usuarios');
const Inscripciones = require('../models/Inscripciones');
const Enfrentamientos = require('../models/Enfrentamientos');
const { validationResult } = require('express-validator');

// Crear torneo
exports.crearTorneo = async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  try {
    const torneo = new Torneo(req.body);
    await torneo.save();

    res.status(201).json({ mensaje: 'Torneo creado correctamente', torneo });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Hubo un error al crear el torneo', error });
  }
};

// Obtener torneo por ID
exports.obtenerTorneo = async (req, res) => {
  try {
    const torneo = await Torneo.findByPk(req.params.torneoId);

    if (!torneo) {
      return res.status(404).json({ mensaje: 'Torneo no encontrado' });
    }
    // Calculo de rondas recomendadas con la cantidad de participantes actuales
    const participantes = torneo.participantes || 0;
    const rondasRecomendadas = participantes < 2 ? 0 : Math.ceil(Math.log2(participantes));

    res.json({ torneo,rondasRecomendadas });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Error al obtener el torneo' });
  }
};

// Actualizar torneo
exports.actualizarTorneo = async (req, res) => {
  try {
    const torneo = await Torneo.findByPk(req.params.id);

    if (!torneo) {
      return res.status(404).json({ mensaje: 'Torneo no encontrado' });
    }

    // Obtener los campos que se desean actualizar
    const { nombre, fecha_inicio, fecha_fin, estado, descripcion, participantes, cerrarInscripciones } = req.body;

    // Actualizar los valores del torneo
    torneo.nombre = nombre || torneo.nombre;
    torneo.fecha_inicio = fecha_inicio || torneo.fecha_inicio;
    torneo.fecha_fin = fecha_fin || torneo.fecha_fin;
    torneo.estado = estado || torneo.estado;
    torneo.descripcion = descripcion || torneo.descripcion;
    torneo.participantes = participantes || torneo.participantes;

    // Si se recibe la opción de cerrar inscripciones, actualizar el estado
    if (cerrarInscripciones !== undefined) {
      torneo.inscripcionesCerradas = cerrarInscripciones;
    }

    // Guardar los cambios en la base de datos
    await torneo.save();

    res.json({ mensaje: 'Torneo actualizado correctamente', torneo });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Error al actualizar el torneo' });
  }
};


// Eliminar torneo
exports.eliminarTorneo = async (req, res) => {
  try {
    const torneo = await Torneo.findByPk(req.params.id);

    if (!torneo) {
      return res.status(404).json({ mensaje: 'Torneo no encontrado' });
    }

    await torneo.destroy();
    res.json({ mensaje: 'Torneo eliminado correctamente' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Error al eliminar el torneo' });
  }
};

// Listar torneos TODO hecho / falta testing
exports.listarTorneos = async (req, res) => {
  try {
    const torneos = await Torneo.findAll({
      order: [['fecha_inicio', 'ASC']]
    });

    res.json({ torneos });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Error al listar los torneos' });
  }
};


// Inscribirse a un torneo
exports.inscribirseATorneo = async (req, res) => {
  try {
    const torneoId = req.params.id;
    const usuarioId = req.usuario.id;

    // Verificar si el torneo existe y está activo o en progreso
    const torneo = await Torneo.findByPk(torneoId);
    if (!torneo) {
      return res.status(404).json({ mensaje: 'Torneo no encontrado' });
    }
    if (!['activo'].includes(torneo.estado)) {
      return res.status(400).json({ mensaje: 'Las inscripciones estan cerradas' });
    }

    // Verificar si ya está inscrito
    const yaInscripto = await Inscripciones.findOne({ where: { usuarioId, torneoId } });
    if (yaInscripto) {
      return res.status(400).json({ mensaje: 'Ya estás inscripto en este torneo' });
    }

    // Registrar inscripción
    await Inscripciones.create({ usuarioId, torneoId });

    // Actualizar contador de participantes
    torneo.participantes += 1;
    await torneo.save();

    res.json({ mensaje: 'Inscripción exitosa al torneo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Hubo un error al inscribirse al torneo' });
  }
};

//Listar participantes del torneo
exports.listarParticipantes = async (req, res) => {
  try {
    const torneo = await Torneo.findByPk(req.params.id, {
      include: [{
        model: Usuarios,
        through: { attributes: [] },
        attributes: ['id', 'nombre', 'email'],
        as: 'Usuarios'  // Asegúrate de usar el alias correcto
      }]
    });

    if (!torneo) {
      return res.status(404).json({ mensaje: 'Torneo no encontrado' });
    }

    res.json({ participantes: torneo.Usuarios }); // 'Usuarios' es el alias, asegúrate de usarlo aquí también
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los participantes del torneo' });
  }
};

//Mostrar ranking final
exports.obtenerRanking = async (req, res) => {
  const { torneoId } = req.params;

  try {
    const inscripciones = await Inscripciones.findAll({
      where: { torneoId },
      include: [{ model: Usuarios, as: 'usuario', attributes: ['id', 'nombre'] }]
    });

    const enfrentamientos = await Enfrentamientos.findAll({
      where: { torneoId, finalizado: true }
    });

    const ranking = inscripciones.map(inscripcion => {
      const usuarioId = inscripcion.usuarioId;
      const nombre = inscripcion.usuario.nombre;

      let victorias = 0;
      let empates = 0;
      let derrotas = 0;
      let byes = 0;

      enfrentamientos.forEach(enf => {
        const esBye = enf.jugador2Id === null;

        if (esBye && enf.jugador1Id === usuarioId) {
          byes++;
        } else if (enf.ganadorId === usuarioId) {
          victorias++;
        } else if ((enf.jugador1Id === usuarioId || enf.jugador2Id === usuarioId) && enf.ganadorId === null) {
          empates++;
        } else if ((enf.jugador1Id === usuarioId || enf.jugador2Id === usuarioId) && enf.ganadorId !== usuarioId) {
          derrotas++;
        }
      });

      const total = victorias + empates + derrotas + byes;
      const puntaje = (victorias * 3) + (empates * 1) + (byes * 1);
      const porcentajeVictorias = total > 0 ? (victorias / total * 100).toFixed(2) : '0.00';

      return {
        jugadorId: usuarioId,
        nombre,
        victorias,
        empates,
        derrotas,
        byes,
        total,
        puntaje,
        porcentajeVictorias
      };
    });

    // Ordenar por puntaje descendente. En caso de empate, menos derrotas primero
    ranking.sort((a, b) =>
      b.puntaje - a.puntaje ||
      a.derrotas - b.derrotas
    );

    res.json(ranking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener el ranking' });
  }
};



