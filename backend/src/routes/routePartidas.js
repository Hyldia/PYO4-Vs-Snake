const express = require('express')
const {
    actualizarPartida,
    buscarPartida,
    crearPartida,
    eliminarPartida,
    listarPartidas,
} = require('../controllers/controllerPartidas')

const router = express.Router()

/*
 * Objetivo: Definir las rutas para las operaciones de partidas
 * Entrada: Solicitudes de /api/partidas
 * Salida: Delegación de cada operación al controlador correspondiente
 * Restricciones: La validación y las reglas de negocio se manejan en las capas controller y service
 */
router.post('/', crearPartida)
router.get('/', listarPartidas)
router.get('/:codigo', buscarPartida)
router.patch('/:codigo', actualizarPartida)
router.delete('/:codigo', eliminarPartida)

module.exports = router