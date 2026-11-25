const config = require('../utils/configuracion')
const { autenticarNickname, desconectarNickname } = require('../services/servicesAutenticacion')
const {
    ErrorPartida,
    listarPartidas,
    salirDePartida,
    salirDeTodasLasPartidas,
    unirsePartida,
} = require('../services/servicesPartidas')
const { existeJugador } = require('../utils/jugadoresConectados')
const { buscarPartida, suscribirCambios } = require('../utils/partidasActivas')

const SALA_LISTA = 'lista-partidas' // Sala de quienes están viendo la lista de partidas para unirse

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
 * Objetivo: Responder a un evento solo si el cliente mandó una función de respuesta
 * Entrada: Función de respuesta del cliente y datos que se le envían
 * Salida: No retorna ningún valor
 * Restricciones: Evita que el servidor falle si el cliente no manda la función
 */
function responder(callback, datos) {
    if (typeof callback === 'function') {
        callback(datos)
    }
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
    // Envía la paleta de colores de config.json
    socket.on('obtenerColores', (callback) => {
        responder(callback, config.colores)
    })

    // El jugador abre la pantalla de unirse: recibe la lista y después sus cambios en vivo
    socket.on('verPartidas', (callback) => {
        socket.join(SALA_LISTA)
        responder(callback, listarPartidas())
    })

    // El jugador sale de la pantalla de unirse
    socket.on('dejarDeVerPartidas', () => {
        socket.leave(SALA_LISTA)
    })

    // El jugador se une a una partida con el color que eligió
    socket.on('unirsePartida', (datos, callback) => {
        try {
            const partida = unirsePartida(datos?.codigo, socket.data.nickname, datos?.color)
            socket.join(nombreSala(partida.codigo))
            responder(callback, { partida })
        } catch (error) {
            if (!(error instanceof ErrorPartida)) {
                console.error('Error al unirse a la partida:', error)
            }
            const mensaje = error instanceof ErrorPartida ? error.message : 'No se pudo unir a la partida.'
            responder(callback, { error: mensaje })
        }
    })

    // El jugador entra a la sala de una partida para recibir sus cambios
    socket.on('entrarSala', (codigo, callback) => {
        const partida = buscarPartida(codigo)
        if (!partida) {
            responder(callback, { error: 'No se encontró la partida.' })
            return
        }
        socket.join(nombreSala(codigo))
        responder(callback, { partida })
    })

    // El jugador deja de recibir los cambios de esa partida
    socket.on('salirSala', (codigo) => {
        socket.leave(nombreSala(codigo))
    })

    // El jugador sale de la partida desde la sala de espera
    socket.on('salirPartida', (codigo) => {
        salirDePartida(codigo, socket.data.nickname)
        socket.leave(nombreSala(codigo))
    })

    // Al cerrar la pestaña: sale de las partidas en espera y se libera el nickname
    socket.on('disconnect', () => {
        salirDeTodasLasPartidas(socket.data.nickname)
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
    suscribirCambios((tipo, datos) => {
        // Se avisa solo a los jugadores de la sala de esa partida
        if (tipo === 'actualizada') {
            io.to(nombreSala(datos.codigo)).emit('partidaActualizada', datos)
        } else {
            io.to(nombreSala(datos)).emit('partidaEliminada', datos)
        }
        // Quienes están en la pantalla de unirse reciben la lista actualizada
        io.to(SALA_LISTA).emit('listaPartidas', listarPartidas())
    })

    io.use(validarNickname)
    io.on('connection', manejarConexion)
}

module.exports = {
    configurarSockets,
}