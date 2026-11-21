// Define la ruta
const express = require('express')
const {
    autenticarNickname,
    desconectarJugador,
} = require('../controllers/controllerAutenticacion')

const router = express.Router()

// Ruta para entrar al juego y verificar que el nickname no este siendo usado
router.post('/', autenticarNickname)
// Ruta para eliminar a un jugador de la ista cuando se sale del juego
router.post('/salir', desconectarJugador)

module.exports = router