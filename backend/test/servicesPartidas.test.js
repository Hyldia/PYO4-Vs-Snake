const test = require('node:test')
const assert = require('node:assert/strict')
const { autenticarNickname, desconectarNickname } = require('../src/services/servicioAutenticacion')
const {
    crearPartida,
    eliminarPartida,
    modificarConfiguracion,
    obtenerPartida,
} = require('../src/services/servicesPartidas')

test('crea partida con código único, permite modificarla y eliminarla', () => {
    const anfitrion = `Anfitrion-${Date.now()}`
    autenticarNickname(anfitrion)
    const partidas = []

    try {
        const configuracion = {
            anfitrion,
            nombrePartida: 'Partida de prueba',
            cantidadJugadores: 2,
            tipoJuego: 'tiempo',
            tematica: 'clasica',
        }
        const partida = crearPartida(configuracion)
        partidas.push(partida)
        const otraPartida = crearPartida(configuracion)
        partidas.push(otraPartida)

        assert.match(partida.codigo, /^\d{6}$/)
        assert.notEqual(partida.codigo, otraPartida.codigo)
        assert.deepEqual(partida.jugadores, [anfitrion])
        assert.equal(partida.estado, 'esperando')
        assert.equal(obtenerPartida(partida.codigo).codigo, partida.codigo)

        const actualizada = modificarConfiguracion(partida.codigo, anfitrion, {
            tematica: 'fruit-mix',
        })
        assert.equal(actualizada.tematica, 'fruit-mix')

        eliminarPartida(partida.codigo, anfitrion)
        assert.equal(obtenerPartida(partida.codigo), null)
    } finally {
        partidas.forEach(({ codigo }) => {
            if (obtenerPartida(codigo)) eliminarPartida(codigo, anfitrion)
        })
        desconectarNickname(anfitrion)
    }
})
