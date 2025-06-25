const Inscripciones = require('../models/Inscripciones');
const Enfrentamientos = require('../models/Enfrentamientos');
const Usuarios = require('../models/Usuarios');
const Torneo = require('../models/Torneo');

class EnfrentamientosService {
    async verificarTorneoActivo(torneoId) {
        const torneo = await Torneo.findByPk(torneoId);
        if (!torneo || !torneo.estado === 'activo') {
            throw new Error('Las inscripciones deben estar cerradas para generar el primer enfrentamiento');
        }
        return torneo;
    }

    async obtenerJugadoresAleatorios(torneoId) {
        const inscripciones = await Inscripciones.findAll({
            where: { torneoId },
            include: ['usuario']
        });

        let jugadores = inscripciones.map(inscripcion => inscripcion.usuarioId);
        return this.mezclarArray(jugadores);
    }

    mezclarArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    async crearEnfrentamientosIniciales(torneoId, jugadores) {
        const enfrentamientos = [];

        if (jugadores.length % 2 !== 0) {
            const jugadorBye = jugadores.splice(Math.floor(Math.random() * jugadores.length), 1)[0];
            enfrentamientos.push(this.crearEnfrentamientoBye(torneoId, jugadorBye));
        }

        for (let i = 0; i < jugadores.length; i += 2) {
            enfrentamientos.push({
                torneoId,
                jugador1Id: jugadores[i],
                jugador2Id: jugadores[i + 1],
                ronda: 1
            });
        }

        return await Enfrentamientos.bulkCreate(enfrentamientos);
    }

    crearEnfrentamientoBye(torneoId, jugadorId) {
        return {
            torneoId,
            jugador1Id: jugadorId,
            jugador2Id: null,
            ganadorId: null,
            ronda: 1,
            finalizado: true
        };
    }

    async procesarResultado(torneoId, resultado) {
        const { enfrentamientoId, ganadorId, empate = false } = resultado;
        const enfrentamiento = await Enfrentamientos.findOne({ where: { id: enfrentamientoId, torneoId } });

        if (!enfrentamiento) {
            return {
                enfrentamientoId,
                estado: 'error',
                mensaje: 'Enfrentamiento no encontrado en este torneo'
            };
        }

        if (enfrentamiento.jugador2Id === null) {
            return {
                enfrentamientoId,
                estado: 'ok',
                mensaje: 'Enfrentamiento de bye, resultado ya asignado'
            };
        }

        if (enfrentamiento.finalizado) {
            return {
                enfrentamientoId,
                estado: 'error',
                mensaje: 'Ya finalizado'
            };
        }

        enfrentamiento.ganadorId = empate ? null : ganadorId;
        enfrentamiento.finalizado = true;
        await enfrentamiento.save();

        return {
            enfrentamientoId,
            estado: 'ok',
            mensaje: 'Resultado registrado',
            ganadorId: empate ? null : ganadorId
        };
    }

    async obtenerEnfrentamientosPrevios(torneoId) {
        return await Enfrentamientos.findAll({
            where: { torneoId, finalizado: true },
            attributes: ['jugador1Id', 'jugador2Id', 'ganadorId']
        });
    }

    async obtenerJugadoresOrdenadosPorVictorias(torneoId, enfrentamientosPrevios) {
        const victorias = this.contarVictorias(enfrentamientosPrevios);
        const jugadores = await Inscripciones.findAll({
            where: { torneoId },
            include: [{ model: Usuarios, as: 'usuario' }]
        });

        return jugadores.sort((a, b) => {
            const victoriasA = victorias[a.usuarioId] || 0;
            const victoriasB = victorias[b.usuarioId] || 0;
            return victoriasB - victoriasA;
        });
    }

    contarVictorias(enfrentamientos) {
        const victorias = {};
        enfrentamientos.forEach(enf => {
            if (enf.ganadorId) {
                victorias[enf.ganadorId] = (victorias[enf.ganadorId] || 0) + 1;
            }
        });
        return victorias;
    }

    async calcularSiguienteRonda(torneoId) {
        const ultimaRonda = await Enfrentamientos.max('ronda', { where: { torneoId } });
        return (ultimaRonda || 0) + 1;
    }

    async generarNuevosEnfrentamientos(torneoId, jugadores, ronda, enfrentamientosPrevios) {
        const nuevosEnfrentamientos = [];
        const jugadoresRestantes = [...jugadores];
        const jugadoresConBye = this.obtenerJugadoresConBye(enfrentamientosPrevios);

        if (jugadoresRestantes.length % 2 !== 0) {
            this.asignarBye(torneoId, jugadoresRestantes, jugadoresConBye, nuevosEnfrentamientos, ronda);
        }

        while (jugadoresRestantes.length > 0) {
            const jugadorA = jugadoresRestantes.shift();
            const { jugadorB, indice } = this.encontrarMejorEmparejamiento(
                jugadorA,
                jugadoresRestantes,
                enfrentamientosPrevios
            );

            if (jugadorB) {
                nuevosEnfrentamientos.push({
                    torneoId,
                    jugador1Id: jugadorA.usuarioId,
                    jugador2Id: jugadorB.usuarioId,
                    ronda
                });
                jugadoresRestantes.splice(indice, 1);
            }
        }

        return nuevosEnfrentamientos;
    }

    obtenerJugadoresConBye(enfrentamientos) {
        const jugadoresConBye = {};
        enfrentamientos.forEach(enf => {
            if (enf.jugador1Id && !enf.jugador2Id) {
                jugadoresConBye[enf.jugador1Id] = true;
            }
        });
        return jugadoresConBye;
    }

    asignarBye(torneoId, jugadoresRestantes, jugadoresConBye, nuevosEnfrentamientos, ronda) {
        for (let i = jugadoresRestantes.length - 1; i >= 0; i--) {
            const jugador = jugadoresRestantes[i];
            if (!jugadoresConBye[jugador.usuarioId]) {
                nuevosEnfrentamientos.push({
                    torneoId,
                    jugador1Id: jugador.usuarioId,
                    jugador2Id: null,
                    ganadorId: null,
                    ronda,
                    finalizado: true
                });
                jugadoresRestantes.splice(i, 1);
                break;
            }
        }
    }

    encontrarMejorEmparejamiento(jugadorA, jugadoresRestantes, enfrentamientosPrevios) {
        let mejorEmparejamiento = null;
        let mejorIndice = -1;
        let menorRepeticiones = Infinity;

        for (let i = 0; i < jugadoresRestantes.length; i++) {
            const jugadorB = jugadoresRestantes[i];
            const key = [jugadorA.usuarioId, jugadorB.usuarioId].sort().join('-');
            const yaSeEnfrentaron = this.verificarEnfrentamientoPrevio(key, enfrentamientosPrevios);

            if (!yaSeEnfrentaron) {
                return { jugadorB, indice: i };
            }

            const repeticiones = this.contarRepeticionesEnfrentamiento(
                jugadorA.usuarioId,
                jugadorB.usuarioId,
                enfrentamientosPrevios
            );

            if (repeticiones < menorRepeticiones) {
                menorRepeticiones = repeticiones;
                mejorEmparejamiento = jugadorB;
                mejorIndice = i;
            }
        }

        return { jugadorB: mejorEmparejamiento, indice: mejorIndice };
    }

    verificarEnfrentamientoPrevio(key, enfrentamientosPrevios) {
        return Array.from(new Set(enfrentamientosPrevios.map(e => 
            [e.jugador1Id, e.jugador2Id].sort().join('-')
        ))).includes(key);
    }

    contarRepeticionesEnfrentamiento(jugadorAId, jugadorBId, enfrentamientosPrevios) {
        return enfrentamientosPrevios.filter(e => 
            (e.jugador1Id === jugadorAId && e.jugador2Id === jugadorBId) ||
            (e.jugador1Id === jugadorBId && e.jugador2Id === jugadorAId)
        ).length;
    }

    async obtenerEnfrentamientosRonda(torneoId, ronda) {
        return await Enfrentamientos.findAll({
            where: { torneoId, ronda },
            include: [
                {
                    model: Usuarios,
                    as: 'jugador1',
                    attributes: ['id', 'nombre']
                },
                {
                    model: Usuarios,
                    as: 'jugador2',
                    attributes: ['id', 'nombre']
                }
            ],
            order: [['id', 'ASC']]
        });
    }

    formatearEnfrentamientos(enfrentamientos) {
        return enfrentamientos.map(enf => ({
            id: enf.id,
            jugador1: enf.jugador1 ? { id: enf.jugador1.id, nombre: enf.jugador1.nombre } : null,
            jugador2: enf.jugador2 ? { id: enf.jugador2.id, nombre: enf.jugador2.nombre } : null,
            ganadorId: enf.ganadorId,
            ronda: enf.ronda,
            finalizado: enf.finalizado
        }));
    }

    async obtenerTodosEnfrentamientos(torneoId) {
        return await Enfrentamientos.findAll({
            where: { torneoId },
            include: [
                { model: Usuarios, as: 'jugador1', attributes: ['id', 'nombre'] },
                { model: Usuarios, as: 'jugador2', attributes: ['id', 'nombre'] },
                { model: Usuarios, as: 'ganador', attributes: ['id', 'nombre'] }
            ],
            order: [['ronda', 'ASC'], ['id', 'ASC']]
        });
    }

    agruparEnfrentamientosPorRonda(enfrentamientos) {
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

        return enfrentamientosPorRonda;
    }
}

module.exports = new EnfrentamientosService();