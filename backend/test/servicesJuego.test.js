const test = require('node:test')
const assert = require('node:assert/strict')
const { autenticarNickname, desconectarNickname } = require('../src/services/servicesAutenticacion')
const { crearPartida, eliminarPartida } = require('../src/services/servicesPartidas')
const {
    iniciarPartida,
    validarVictoria,
} = require('../src/services/servicesJuego')

test('inicia una partida con cuenta regresiva y acepta victoria por longitud', async () => {
    const anfitrion = `HostJuego-${Date.now()}`
    autenticarNickname(anfitrion)
    const partida = crearPartida({
        anfitrion,
        nombrePartida: 'Prueba juego',
        cantidadJugadores: 2,
        tipoJuego: 'longitud',
        tematica: 'clasica',
    })

    try {
        const iniciada = await iniciarPartida(partida.codigo, anfitrion)
        assert.equal(iniciada.estado, 'jugando')

        const victoria = validarVictoria(partida.codigo, {
            nickname: anfitrion,
            longitud: 20,
        })
        assert.equal(victoria.victoria, true)
        assert.equal(victoria.ganador, anfitrion)
        assert.equal(victoria.partida.estado, 'finalizada')
    } finally {
        eliminarPartida(partida.codigo, anfitrion)
        desconectarNickname(anfitrion)
    }
})
