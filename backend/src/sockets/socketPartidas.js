const { autenticarNickname, desconectarNickname } = require('../services/servicesAutenticacion')
const { existeJugador } = require('../utils/jugadoresConectados')
const { buscarPartida, suscribirCambios } = require('../utils/partidasActivas')

/*
 * Objetivo: Obtener el nombre de la sala de Socket.IO de una partida
 * Entrada: Código de la partida
 * Salida: Texto con el nombre de la sala, por ejemplo "partida:123456"
 * Restricciones: Cada partida tiene su propia sala
 */
function nombreSala(codigo) {
    return `partida:${String(codigo).trim()}`
}

/*
 * Objetivo: Revisar el nickname que manda el jugador al conectarse
 * Entrada: Socket que se está conectando y función next de Socket.IO
 * Salida: Acepta la conexión o la rechaza con un error
 * Restricciones:
        - El nickname debe venir en socket.handshake.auth
        - Si la conexión se cayó y el nickname se liberó, se vuelve a reservar
 */
function validarNickname(socket, next) {
    const nickname = socket.handshake.auth?.nickname
    if (typeof nickname !== 'string' || !nickname.trim()) {
        return next(new Error('Debes indicar tu nickname.'))
    }

    if (!existeJugador(nickname)) {
        const resultado = autenticarNickname(nickname)
        if (!resultado.nickname) {
            return next(new Error(resultado.error || resultado.conflicto))
        }
    }

    socket.data.nickname = nickname.trim()
    return next()
}

/*
 * Objetivo: Registrar los eventos de un jugador conectado
 * Entrada: Socket del jugador
 * Salida: No retorna ningún valor
 * Restricciones: El nickname ya fue validado por validarNickname
 */
function manejarConexion(socket) {
    // El jugador entra a la sala de una partida para recibir sus cambios
    socket.on('entrarSala', (codigo, responder) => {
        if (typeof responder !== 'function') {
            return
        }
        const partida = buscarPartida(codigo)
        if (!partida) {
            responder({ error: 'No se encontró la partida.' })
            return
        }
        socket.join(nombreSala(codigo))
        responder({ partida })
    })

    // El jugador deja de recibir los cambios de esa partida
    socket.on('salirSala', (codigo) => {
        socket.leave(nombreSala(codigo))
    })

    // Al cerrar la pestaña o perder la conexión, se libera el nickname
    socket.on('disconnect', () => {
        desconectarNickname(socket.data.nickname)
    })
}

/*
 * Objetivo: Configurar Socket.IO en el servidor
 * Entrada: Instancia del servidor de Socket.IO
 * Salida: No retorna ningún valor
 * Restricciones: Se llama una sola vez al iniciar el servidor
 */
function configurarSockets(io) {
    // Cada vez que una partida cambia, se avisa solo a los jugadores de su sala
    suscribirCambios((tipo, datos) => {
        if (tipo === 'actualizada') {
            io.to(nombreSala(datos.codigo)).emit('partidaActualizada', datos)
        } else {
            io.to(nombreSala(datos)).emit('partidaEliminada', datos)
        }
    })

    io.use(validarNickname)
    io.on('connection', manejarConexion)
}

module.exports = {
    configurarSockets,
}