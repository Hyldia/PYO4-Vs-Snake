const {
    ErrorJuego,
    iniciarCuentaRegresiva,
    iniciarPartida,
    iniciarTemporizador,
    validarVictoria,
} = require('../services/servicesJuego')

/*
 * Objetivo: Convertir los errores del servicio de juego en respuestas HTTP.
 * Entrada: Respuesta de Express y error generado por el servicio.
 * Salida: Respuesta JSON con mensaje y codigo HTTP.
 * Restricciones: Solo procesa errores conocidos de ErrorJuego.
 */
function responderConError(res, error) {
    if (!(error instanceof ErrorJuego)) {
        throw error
    }
    return res.status(error.statusCode).json({ error: error.message })
}

/*
 * Objetivo: Iniciar una partida desde el controlador.
 * Entrada: Codigo de partida y nickname del anfitrion.
 * Salida: Codigo HTTP 200 y partida actualizada.
 * Restricciones: Solo el anfitrion puede iniciar la partida.
 */
async function iniciarPartidaJuego(req, res) {
    try {
        const partida = await iniciarPartida(
            req.params.codigo,
            req.body?.anfitrion,
        )
        return res.status(200).json(partida)
    } catch (error) {
        return responderConError(res, error)
    }
}

/*
 * Objetivo: Consultar o reiniciar manualmente la cuenta regresiva.
 * Entrada: Codigo de partida y segundos opcionales.
 * Salida: Codigo HTTP 200 y partida al finalizar la cuenta.
 * Restricciones: El reinicio manual solo debe usarse para pruebas o control de servidores.
 */
async function cuentaRegresiva(req, res) {
    try {
        const partida = await iniciarCuentaRegresiva(
            req.params.codigo,
            req.body?.segundos,
        )
        return res.status(200).json(partida)
    } catch (error) {
        return responderConError(res, error)
    }
}

/*
 * Objetivo: Iniciar el cronometro de una partida por tiempo.
 * Entrada: Codigo de partida.
 * Salida: Codigo HTTP 200 y estado actual del cronometro.
 * Restricciones: La partida debe estar jugando y usar el modo tiempo.
 */
function temporizador(req, res) {
    try {
        return res.status(200).json(iniciarTemporizador(req.params.codigo))
    } catch (error) {
        return responderConError(res, error)
    }
}

/*
 * Objetivo: Validar una victoria enviada por el jugador.
 * Entrada: Codigo de partida y datos con nickname y longitud opcional.
 * Salida: Codigo HTTP 200 con victoria, ganador y partida actual.
 * Restricciones: Solo acepta datos relacionados con una partida activa.
 */
function victoria(req, res) {
    try {
        return res.status(200).json(validarVictoria(req.params.codigo, req.body || {}))
    } catch (error) {
        return responderConError(res, error)
    }
}

module.exports = {
    cuentaRegresiva,
    iniciarPartidaJuego,
    temporizador,
    victoria,
}
