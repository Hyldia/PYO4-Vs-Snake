const express = require('express')
const {
    iniciarPartidaJuego,
    victoria,
} = require('../controllers/controllerJuego')

const router = express.Router()

/*
 * Objetivo: Definir las rutas HTTP relacionadas con la logica del juego.
 * Entrada: Solicitudes bajo /api/juego.
 * Salida: Delegacion de cada accion al controlador correspondiente.
 * Restricciones: Las reglas de inicio y victoria se resuelven en el servicio.
 */
router.post('/:codigo/iniciar', iniciarPartidaJuego)
//router.post('/:codigo/cuenta', cuentaRegresiva)
//router.post('/:codigo/temporizador', temporizador)
router.post('/:codigo/victoria', victoria)

module.exports = router
