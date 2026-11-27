const {
    ErrorJuego,
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
    victoria,
}
