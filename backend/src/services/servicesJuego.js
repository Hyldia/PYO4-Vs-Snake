const config = require('../utils/configuracion')
const {
    actualizarPartida,
    buscarPartida,
} = require('../utils/partidasActivas')
const { cancelarExpiracion } = require('./servicesPartidas')

const CUENTA_REGRESIVA_SEGUNDOS = config.cuentaRegresivaSegundos
const DURACION_JUEGO_SEGUNDOS = config.duracionPorDefectoSegundos
const LONGITUD_OBJETIVO = config.longitudObjetivoPorDefecto
const temporizadoresJuego = new Map()

/*
 * Objetivo: Representar un error ocurrido durante el control del juego.
 * Entrada: Mensaje descriptivo y codigo HTTP asociado.
 * Salida: Instancia de ErrorJuego con su codigo HTTP.
 * Restricciones: Se utiliza para respuestas esperadas de la API del juego.
 */
class ErrorJuego extends Error {
    constructor(mensaje, statusCode = 400) {
        super(mensaje)
        this.name = 'ErrorJuego'
        this.statusCode = statusCode
    }
}

/*
 * Objetivo: Buscar una partida existente antes de iniciar el juego.
 * Entrada: Codigo de la partida.
 * Salida: Copia de la partida encontrada.
 * Restricciones: La partida debe existir y no debe estar finalizada.
 */
function obtenerPartidaActiva(codigo) {
    const partida = buscarPartida(codigo)
    if (!partida) {
        throw new ErrorJuego('No se encontró la partida.', 404)
    }
    if (partida.estado === 'finalizada') {
        throw new ErrorJuego('La partida ya fue finalizada.', 409)
    }
    return partida
}

/*
 * Objetivo: Ejecutar la cuenta regresiva de inicio.
 * Entrada: Codigo de la partida y segundos opcionales.
 * Salida: Promesa que termina cuando la cuenta llega a cero.
 * Restricciones: Solo puede iniciarse una vez y el limite predeterminado es tres segundos.
 */
function iniciarCuentaRegresiva(codigo, segundos = CUENTA_REGRESIVA_SEGUNDOS) {
    const partida = obtenerPartidaActiva(codigo)
    let restante = Number.isInteger(segundos) && segundos >= 0
        ? segundos
        : CUENTA_REGRESIVA_SEGUNDOS

    actualizarPartida(codigo, { // La partida esta en la fase previa al inico del juego
        estado: 'cuenta_regresiva',
        cuentaRegresiva: restante,
    })

    if (restante === 0) {
        actualizarPartida(codigo, {
            estado: 'jugando',
            cuentaRegresiva: 0,
        })
        return Promise.resolve(buscarPartida(codigo))
    }

    return new Promise((resolve) => { // Ejecuta la cuenta regresiva de forma asíncrona para no bloquear el servidor
        const temporizador = setInterval(() => { // Va reduciendo el contador
            restante -= 1
            const cambios = { cuentaRegresiva: Math.max(restante, 0) } // Evita que el contador pueda tener valores negativos

            if (restante <= 0) {
                clearInterval(temporizador)
                temporizadoresJuego.delete(`${codigo}:cuenta`)
                cambios.estado = 'jugando'
                cambios.cuentaRegresiva = 0
            }

            actualizarPartida(codigo, cambios)
            if (restante <= 0) {
                resolve(buscarPartida(codigo))
            }
        }, 1000)

        temporizadoresJuego.set(`${codigo}:cuenta`, temporizador)
    })
}

/*
 * Objetivo: Administrar el cronometro principal de una partida por tiempo.
 * Entrada: Codigo de la partida.
 * Salida: Estado actualizado de la partida.
 * Restricciones: Solo inicia el cronometro si el modo es tiempo y la partida esta jugando.
 */
function iniciarTemporizador(codigo) {
    const partida = obtenerPartidaActiva(codigo)
    if (partida.tipoJuego !== 'tiempo') {
        return partida
    }
    if (partida.estado !== 'jugando') {
        throw new ErrorJuego('La partida debe estar jugando para iniciar el cronometro.', 409)
    }
    // Comprueba si existe un cronometro para esa partido, si hay no crea uno nuevo
    const temporizadorAnterior = temporizadoresJuego.get(`${codigo}:juego`) 
    if (temporizadorAnterior) {
        clearInterval(temporizadorAnterior)
    }
    // Usa la uración personalizada de la partida o la duración predeterminada
    const duracion = Number.isInteger(partida.duracionSegundos) && partida.duracionSegundos > 0 
        ? partida.duracionSegundos
        : DURACION_JUEGO_SEGUNDOS

    actualizarPartida(codigo, { tiempoRestante: duracion })

    const temporizador = setInterval(() => {
        const actual = buscarPartida(codigo)
        if (!actual || actual.estado === 'finalizada') {
            clearInterval(temporizador)
            temporizadoresJuego.delete(`${codigo}:juego`)
            return
        }

        const tiempoRestante = Math.max(actual.tiempoRestante - 1, 0)
        if (tiempoRestante > 0) {
            actualizarPartida(codigo, { tiempoRestante })
            return
        }

        clearInterval(temporizador)
        temporizadoresJuego.delete(`${codigo}:juego`)
        actualizarPartida(codigo, {
            tiempoRestante: 0,
            estado: 'finalizada',
            ganador: determinarGanadorPorTiempo(actual),
        })
    }, 1000) // La actualización se ejecuta cada segundo para simular el cronómetro del juego

    if (typeof temporizador.unref === 'function') {
        temporizador.unref()
    }
    temporizadoresJuego.set(`${codigo}:juego`, temporizador) // Guarda la referencia del cronómetro para poder detenerlo despues
    return buscarPartida(codigo)
}

/*
 * Objetivo: Determinar el ganador por mayor longitud al finalizar el tiempo.
 * Entrada: Partida con las longitudes registradas por jugador.
 * Salida: Nickname ganador o null si hay empate.
 * Restricciones: Las longitudes no registradas se consideran cero.
 */
function determinarGanadorPorTiempo(partida) {
    const longitudes = partida.longitudes || {}
    let mayor = -1
    let ganador = null
    let empate = false

    partida.jugadores.forEach((jugador) => {
        const longitud = Number(longitudes[jugador.nickname]) || 0
        if (longitud > mayor) {
            mayor = longitud
            ganador = jugador.nickname
            empate = false
        } else if (longitud === mayor) {
            empate = true
        }
    })
    

    return empate ? null : ganador
}

/*
 * Objetivo: Validar si un jugador gano por tiempo o por longitud.
 * Entrada: Codigo, nickname y longitud actual opcional.
 * Salida: Resultado con estado actual y ganador si existe.
 * Restricciones: Victoria por longitud requiere alcanzar la meta; por tiempo solo se valida al agotar el cronometro.
 */
function validarVictoria(codigo, datos = {}) {
    const partida = obtenerPartidaActiva(codigo)
    const nickname = typeof datos.nickname === 'string' ? datos.nickname.trim() : ''
    const longitud = Number(datos.longitud)

    if (nickname && Number.isFinite(longitud) && longitud >= 0) {
        const longitudes = {
            ...(partida.longitudes || {}),
            [nickname]: longitud,
        }
        actualizarPartida(codigo, { longitudes })
        partida.longitudes = longitudes
    }

    if (partida.tipoJuego === 'longitud') {
        const objetivo = Number.isInteger(partida.longitudObjetivo) && partida.longitudObjetivo > 0
            ? partida.longitudObjetivo
            : LONGITUD_OBJETIVO

        if (nickname && (Number(partida.longitudes?.[nickname]) || 0) >= objetivo) { 
            const finalizada = actualizarPartida(codigo, {
                estado: 'finalizada',
                ganador: nickname,
            })
            cancelarTemporizadores(codigo)
            return {
                victoria: true,
                ganador: nickname,
                partida: finalizada,
            }
        }
    }

    if (partida.tipoJuego === 'tiempo' && partida.tiempoRestante === 0) {
        const ganador = determinarGanadorPorTiempo(partida)
        const finalizada = actualizarPartida(codigo, {
            estado: 'finalizada',
            ganador,
        })
        cancelarTemporizadores(codigo)
        return {
            victoria: ganador !== null,
            ganador,
            empate: ganador === null,
            partida: finalizada,
        }
    }

    return {
        victoria: false,
        ganador: null,
        partida: buscarPartida(codigo),
    }
}

/*
 * Objetivo: Cancelar los temporizadores asociados a una partida.
 * Entrada: Codigo de la partida.
 * Salida: No retorna ningun valor.
 * Restricciones: Cancela la cuenta regresiva y el cronometro del juego.
 */
function cancelarTemporizadores(codigo) {
    [`${codigo}:cuenta`, `${codigo}:juego`].forEach((clave) => {
        const temporizador = temporizadoresJuego.get(clave)
        if (temporizador) {
            clearInterval(temporizador)
            temporizadoresJuego.delete(clave)
        }
    })
}

/*
 * Objetivo: Pasar la partida al tablero cuando un jugador presiona "Entrar"
 * Entrada: Código de la partida y nickname del jugador que presionó el botón
 * Salida: Partida actualizada en estado 'en_tablero'
 * Restricciones:
 *      - Solo un jugador de la partida puede entrar
 *      - La partida debe estar llena
 *      - Si otro jugador ya presionó "Entrar", no cambia nada
 */
function entrarAlTablero(codigo, nickname) {
    const partida = obtenerPartidaActiva(codigo)

    if (!partida.buscarJugador(nickname)) {
        throw new ErrorJuego('No eres jugador de esta partida.', 403)
    }
    if (partida.estado !== 'esperando') {
        return partida // Otro jugador ya presionó "Entrar"
    }
    if (!partida.estaLlena()) {
        throw new ErrorJuego('No hay suficientes jugadores para entrar al tablero.', 400)
    }
    return actualizarPartida(codigo, { estado: 'en_tablero' })
}
/*
 * Objetivo: Arrancar el juego cuando un jugador presiona la tecla "u"
 * Entrada: Código de la partida y nickname del jugador que presionó la tecla
 * Salida: Partida actualizada después de la cuenta regresiva
 * Restricciones:
 *      - Cualquier jugador de la partida puede presionar "u"
 *      - Solo funciona cuando todos ya están en el tablero
 *      - Si la cuenta ya empezó o el juego está en curso, se ignora
 */
async function iniciarPartida(codigo, nickname) { 
    const partida = obtenerPartidaActiva(codigo)

    if (!partida.buscarJugador(nickname)) { 
        throw new ErrorJuego('No eres jugador de esta partida.', 403)
    }
    if (partida.estado === 'cuenta_regresiva' || partida.estado === 'jugando') {
        return partida // Otro jugador ya presionó "u"
    }
    if (partida.estado !== 'en_tablero') {
        throw new ErrorJuego('Primero hay que entrar al tablero.', 409)
    }
    cancelarExpiracion(partida.codigo) // Cancela la expiración de la partida al iniciar el juego

    const iniciando = await iniciarCuentaRegresiva(codigo) // Aquí arranca el motor del juego
    if (iniciando.tipoJuego === 'tiempo') {
        iniciarTemporizador(codigo)
    }
    return buscarPartida(codigo)
}

module.exports = {
    ErrorJuego,
    entrarAlTablero,
    iniciarPartida,
    validarVictoria,
}