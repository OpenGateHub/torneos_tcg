const Inscripciones = require('../models/Inscripciones');
const Enfrentamientos = require('../models/Enfrentamientos');
const Usuarios = require('../models/Usuarios');
const Torneo = require('../models/Torneo');

//Logica para el primer enfrentamiento
exports.generarPrimerEnfrentamiento = async (req, res) => {
  const { torneoId } = req.params;

  try {
    // Verificar que las inscripciones están cerradas
    const torneo = await Torneo.findByPk(torneoId);
    if (!torneo || !torneo.estado === 'activo') {
      return res.status(400).json({ mensaje: 'Las inscripciones deben estar cerradas para generar el primer enfrentamiento' });
    }

    // Obtener todos los jugadores inscritos en el torneo
    let inscripciones = await Inscripciones.findAll({
      where: { torneoId },
      include: ['usuario']
    });

    // Mezclar los jugadores aleatoriamente (Fisher-Yates)
    let jugadores = inscripciones.map(inscripcion => inscripcion.usuarioId);
    for (let i = jugadores.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [jugadores[i], jugadores[j]] = [jugadores[j], jugadores[i]];
    }

    const enfrentamientos = [];

    // Si la cantidad de jugadores es impar, elegir uno para bye
    if (jugadores.length % 2 !== 0) {
      const randomIndex = Math.floor(Math.random() * jugadores.length);
      const jugadorConBye = jugadores.splice(randomIndex, 1)[0]; // lo quitamos del array

      // Crear enfrentamiento de bye
      enfrentamientos.push({
        torneoId,
        jugador1Id: jugadorConBye,
        jugador2Id: null,
        ganadorId: null,
        ronda: 1,
        finalizado: true
      });
    }

    // Emparejar el resto de los jugadores de a pares
    for (let i = 0; i < jugadores.length; i += 2) {
      enfrentamientos.push({
        torneoId,
        jugador1Id: jugadores[i],
        jugador2Id: jugadores[i + 1],
        ronda: 1
      });
    }

    // Crear los enfrentamientos en la base de datos
    await Enfrentamientos.bulkCreate(enfrentamientos);

    res.json({ mensaje: 'Primeros enfrentamientos generados' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Hubo un error al generar los enfrentamientos' });
  }
};


//Registrar Resultados de los enfrentamientos
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

      // Buscar el enfrentamiento correspondiente al id y torneo
      const enfrentamiento = await Enfrentamientos.findOne({ where: { id: enfrentamientoId, torneoId } });

      if (!enfrentamiento) {
        resultadosProcesados.push({
          enfrentamientoId,
          estado: 'error',
          mensaje: 'Enfrentamiento no encontrado en este torneo'
        });
        continue;
      }

      // Si el enfrentamiento es de bye, ya está procesado
      if (enfrentamiento.jugador2Id === null) {
        resultadosProcesados.push({
          enfrentamientoId,
          estado: 'ok',
          mensaje: 'Enfrentamiento de bye, resultado ya asignado'
        });
        continue;
      }

      // Verificar si el enfrentamiento ya fue finalizado
      if (enfrentamiento.finalizado) {
        resultadosProcesados.push({
          enfrentamientoId,
          estado: 'error',
          mensaje: 'Ya finalizado'
        });
        continue;
      }

      // Registrar resultado: si hay empate, el ganador queda en null
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

//Registrar Resultado Individual de un enfrentamiento
exports.registrarResultadoIndividual = async (req, res) => {
  const torneoId = parseInt(req.params.torneoId);
  const enfrentamientoId = parseInt(req.params.enfrentamientoId);
  const { ganadorId, empate = false } = req.body;

  try {
    // Buscar el enfrentamiento correspondiente al id y torneo
    const enfrentamiento = await Enfrentamientos.findOne({ 
      where: { id: enfrentamientoId, torneoId } 
    });

    if (!enfrentamiento) {
      return res.status(404).json({ 
        mensaje: 'Enfrentamiento no encontrado en este torneo' 
      });
    }

    // Si el enfrentamiento es de bye, ya está procesado
    if (enfrentamiento.jugador2Id === null) {
      return res.json({ 
        mensaje: 'Enfrentamiento de bye ya procesado',
        enfrentamientoId,
        esBye: true
      });
    }

    // Registrar resultado: si hay empate, el ganador queda en null
    enfrentamiento.ganadorId = empate ? null : ganadorId;
    enfrentamiento.finalizado = true;
    await enfrentamiento.save();

    res.json({ 
      mensaje: 'Resultado guardado correctamente',
      enfrentamientoId,
      ganadorId: empate ? null : ganadorId,
      empate,
      finalizado: true
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno al guardar resultado' });
  }
};



//generar siguiente ronda
exports.generarSiguienteRonda = async (req, res) => {
  const torneoId = parseInt(req.params.torneoId);

  try {
    // 1. Obtener todos los enfrentamientos previos finalizados
    const enfrentamientos = await Enfrentamientos.findAll({
      where: { torneoId, finalizado: true },
      attributes: ['jugador1Id', 'jugador2Id', 'ganadorId'],
    });

    // 2. Construir un mapa de enfrentamientos previos y conteo de victorias
    const enfrentamientosPrevios = new Set();
    const victorias = {};
    const jugadoresConBye = {};

    for (const enf of enfrentamientos) {
      const j1 = enf.jugador1Id;
      const j2 = enf.jugador2Id;

      if (j1 && j2) {
        const key = [j1, j2].sort().join('-');
        enfrentamientosPrevios.add(key);
      }

      if (enf.ganadorId) {
        victorias[enf.ganadorId] = (victorias[enf.ganadorId] || 0) + 1;
      }

      // Registrar jugadores que ya tuvieron bye
      if (j1 && !j2) {
        jugadoresConBye[j1] = true;
      }
    }

    // 3. Obtener inscripciones ordenadas por victorias (ranking)
    const jugadores = await Inscripciones.findAll({
      where: { torneoId },
      include: [{ model: Usuarios, as: 'usuario' }]
    });

    jugadores.sort((a, b) => {
      const victoriasA = victorias[a.usuarioId] || 0;
      const victoriasB = victorias[b.usuarioId] || 0;
      return victoriasB - victoriasA;
    });

    const ultimaRonda = await Enfrentamientos.max('ronda', { where: { torneoId } });
    const siguienteRonda = (ultimaRonda || 0) + 1;

    const nuevosEnfrentamientos = [];
    let jugadoresRestantes = [...jugadores];

    // 4. Si hay cantidad impar, asignar bye al último jugador sin bye previo
    if (jugadoresRestantes.length % 2 !== 0) {
      // Buscar desde el último jugador hacia arriba al primer jugador sin bye
      for (let i = jugadoresRestantes.length - 1; i >= 0; i--) {
        const jugador = jugadoresRestantes[i];
        if (!jugadoresConBye[jugador.usuarioId]) {
          nuevosEnfrentamientos.push({
            torneoId,
            jugador1Id: jugador.usuarioId,
            jugador2Id: null,
            ganadorId: null,
            ronda: siguienteRonda,
            finalizado: true
          });
          jugadoresRestantes.splice(i, 1);
          break;
        }
      }
    }

    // 5. Emparejar el resto de jugadores
    while (jugadoresRestantes.length > 0) {
      const jugadorA = jugadoresRestantes.shift(); // Tomar el primer jugador
      let mejorEmparejamiento = null;
      let mejorIndice = -1;
      let menorRepeticiones = Infinity;

      // Buscar el mejor emparejamiento posible
      for (let i = 0; i < jugadoresRestantes.length; i++) {
        const jugadorB = jugadoresRestantes[i];
        const key = [jugadorA.usuarioId, jugadorB.usuarioId].sort().join('-');
        const yaSeEnfrentaron = enfrentamientosPrevios.has(key);

        // Si encontramos un oponente sin enfrentamiento previo, lo usamos inmediatamente
        if (!yaSeEnfrentaron) {
          mejorEmparejamiento = jugadorB;
          mejorIndice = i;
          break;
        }

        // Si todos tienen enfrentamientos previos, elegimos el que tenga menos
        const repeticiones = Array.from(enfrentamientosPrevios).filter(k => 
          k.includes(jugadorA.usuarioId) && k.includes(jugadorB.usuarioId)
        ).length;

        if (repeticiones < menorRepeticiones) {
          menorRepeticiones = repeticiones;
          mejorEmparejamiento = jugadorB;
          mejorIndice = i;
        }
      }

      // Si encontramos un emparejamiento (siempre deberíamos encontrar uno)
      if (mejorEmparejamiento) {
        nuevosEnfrentamientos.push({
          torneoId,
          jugador1Id: jugadorA.usuarioId,
          jugador2Id: mejorEmparejamiento.usuarioId,
          ronda: siguienteRonda
        });
        jugadoresRestantes.splice(mejorIndice, 1);
      }
    }

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




