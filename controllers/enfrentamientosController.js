const Inscripciones = require('../models/Inscripciones');
const Enfrentamientos = require('../models/Enfrentamientos');
const Usuarios = require('../models/Usuarios');
const Torneo = require('../models/Torneo');

//Logica para el primer enfrentamiento
exports.generarPrimerEnfrentamiento = async (req, res) => {
  const { torneoId } = req.params;

  try {
    //Obtener todos los jugadores inscritos en el torneo
    const inscripciones = await Inscripciones.findAll({
      where: { torneoId },
      include: ['Usuario'] 
    });

    //Mezclar los jugadores aleatoriamente (usando Fisher-Yates)
    const jugadores = inscripciones.map(inscripcion => inscripcion.usuarioId);
    for (let i = jugadores.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [jugadores[i], jugadores[j]] = [jugadores[j], jugadores[i]]; // Intercambio
    }

    //Emparejar los jugadores
    const enfrentamientos = [];
    for (let i = 0; i < jugadores.length; i += 2) {
      //Si es impar, el último jugador no tiene oponente (puedes decidir qué hacer) TODO
      if (jugadores[i + 1]) {
        enfrentamientos.push({
          torneoId,
          jugador1Id: jugadores[i],
          jugador2Id: jugadores[i + 1],
          ronda: 1
        });
      }
    }

    //Crear los enfrentamientos en la base de datos
    await Enfrentamientos.bulkCreate(enfrentamientos);

    res.json({ mensaje: 'Primeros enfrentamientos generados' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Hubo un error al generar los enfrentamientos' });
  }
};


exports.registrarResultados = async (req, res) => {
  const torneoId = parseInt(req.params.torneoId);
  const resultados = req.body.resultados;

  if (!Array.isArray(resultados)) {
    return res.status(400).json({ mensaje: 'El cuerpo debe contener un array llamado "resultados"' });
  }

  const resultadosProcesados = [];

  try {
    for (const resultado of resultados) {
      const { enfrentamientoId, ganadorId, empate = false } = resultado;

      const enfrentamiento = await Enfrentamientos.findOne({ where: { id: enfrentamientoId, torneoId } });

      if (!enfrentamiento) {
        resultadosProcesados.push({ enfrentamientoId, estado: 'error', mensaje: 'Enfrentamiento no encontrado en este torneo' });
        continue;
      }

      if (enfrentamiento.finalizado) {
        resultadosProcesados.push({ enfrentamientoId, estado: 'error', mensaje: 'Ya finalizado' });
        continue;
      }

      enfrentamiento.ganadorId = empate ? null : ganadorId;
      enfrentamiento.finalizado = true;
      await enfrentamiento.save();

      resultadosProcesados.push({
        enfrentamientoId,
        estado: 'ok',
        mensaje: 'Resultado registrado',
        ganadorId: empate ? null : ganadorId
      });
    }

    res.json({ mensaje: 'Resultados procesados', resultados: resultadosProcesados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno al procesar resultados' });
  }
};


//generar siguiente ronda
exports.generarSiguienteRonda = async (req, res) => {
  const torneoId = parseInt(req.params.torneoId);

  try {
    //Obtener los enfrentamientos ya finalizados para este torneo
    const enfrentamientos = await Enfrentamientos.findAll({
      where: { torneoId, finalizado: true },
      include: ['jugador1', 'jugador2'] 
    });

    //Obtener las victorias de los jugadores
    const victorias = {};
    
    
    //Contabilizar las victorias
    for (const enfrentamiento of enfrentamientos) {
      if (enfrentamiento.ganadorId) {
        victorias[enfrentamiento.ganadorId] = (victorias[enfrentamiento.ganadorId] || 0) + 1;
      }
    }
    
    //Obtener los jugadores inscritos y ordenarlos por número de victorias
    const jugadores = await Inscripciones.findAll({
      where: { torneoId },
      include: [{ model: Usuarios, as: 'usuario' }]
    });
    
    jugadores.sort((a, b) => {
      const victoriasA = victorias[a.usuarioId] || 0;
      const victoriasB = victorias[b.usuarioId] || 0;
      return victoriasB - victoriasA; // Ordenar de mayor a menor victorias
    });

    // Obtener la última ronda jugada
    const ultimaRonda = await Enfrentamientos.max('ronda', { where: { torneoId } });
    const siguienteRonda = (ultimaRonda || 0) + 1;
    
    //Emparejar jugadores de acuerdo a las victorias
    const nuevosEnfrentamientos = [];
    for (let i = 0; i < jugadores.length; i += 2) {
      if (jugadores[i + 1]) {
        nuevosEnfrentamientos.push({
          torneoId,
          jugador1Id: jugadores[i].usuarioId,
          jugador2Id: jugadores[i + 1].usuarioId,
          ronda: siguienteRonda // Ronda 2 o siguiente ronda
        });
      }
    }
    
    //Crear los enfrentamientos en la base de datos para la siguiente ronda
    await Enfrentamientos.bulkCreate(nuevosEnfrentamientos);

    res.json({ mensaje: 'Siguiente ronda generada' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Hubo un error al generar la siguiente ronda' });
  }
};

// Listar enfrentamientos por ronda
// GET /admin/torneos/:id/enfrentamientos/:ronda
exports.listarEnfrentamientosPorRonda = async (req, res) => {
  const { torneoId, ronda } = req.params;

  try {
    // Obtener todos los enfrentamientos de la ronda solicitada
    const enfrentamientos = await Enfrentamientos.findAll({
      where: { torneoId, ronda },
      include: [
        {
          model: Usuarios,
          as: 'jugador1', // Relación con el primer jugador
          attributes: ['id', 'nombre']
        },
        {
          model: Usuarios,
          as: 'jugador2', // Relación con el segundo jugador
          attributes: ['id', 'nombre']
        }
      ],
      order: [['id', 'ASC']]
    });

    //Si todavia no hay enfrentamientos en la ronda
    if (enfrentamientos.length === 0) {
      return res.status(404).json({ mensaje: `No hay enfrentamientos para la ronda ${ronda}` });
    }

    res.json({
      ronda: Number(ronda), 
      enfrentamientos: enfrentamientos.map(enf => ({
        id: enf.id,
        jugador1: enf.jugador1 ? { id: enf.jugador1.id, nombre: enf.jugador1.nombre } : null,
        jugador2: enf.jugador2 ? { id: enf.jugador2.id, nombre: enf.jugador2.nombre } : null,
        ganadorId: enf.ganadorId,
        ronda: enf.ronda,
        finalizado: enf.finalizado
      }))
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Hubo un error al listar los enfrentamientos por ronda' });
  }
};


exports.listarEnfrentamientosAgrupados = async (req, res) => {
  const { torneoId } = req.params;

  try {
    const enfrentamientos = await Enfrentamientos.findAll({
      where: { torneoId },
      include: [
        { model: Usuarios, as: 'jugador1', attributes: ['id', 'nombre'] },
        { model: Usuarios, as: 'jugador2', attributes: ['id', 'nombre'] },
        { model: Usuarios, as: 'ganador', attributes: ['id', 'nombre'] }
      ],
      order: [['ronda', 'ASC'], ['id', 'ASC']]
    });

    // Agrupar por ronda
    const enfrentamientosPorRonda = {};

    enfrentamientos.forEach(enf => {
      const rondaKey = `Ronda ${enf.ronda}`;

      if (!enfrentamientosPorRonda[rondaKey]) {
        enfrentamientosPorRonda[rondaKey] = [];
      }

      enfrentamientosPorRonda[rondaKey].push({
        id: enf.id,
        jugador1: enf.jugador1 ? { id: enf.jugador1.id, nombre: enf.jugador1.nombre } : null,
        jugador2: enf.jugador2 ? { id: enf.jugador2.id, nombre: enf.jugador2.nombre } : null,
        ganador: enf.ganador ? { id: enf.ganador.id, nombre: enf.ganador.nombre } : null,
        ronda: enf.ronda,
        finalizado: enf.finalizado,
        estado: enf.finalizado ? 'finalizado' : 'pendiente'
      });
    });

    res.json(enfrentamientosPorRonda);
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Error al obtener enfrentamientos agrupados por ronda' });
  }
};






/// PARA MAÑANA 24/04 Testear todo lo que tenemos hasta ahora, si sale bien quizas se pueda inicial el front