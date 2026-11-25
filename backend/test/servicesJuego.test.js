const test = require('node:test')
const assert = require('node:assert/strict')
const { autenticarNickname, desconectarNickname } = require('../src/services/servicesAutenticacion')
const { crearPartida, eliminarPartida } = require('../src/services/servicesPartidas')
//const { actualizarPartida } = require('../src/utils/partidasActivas')
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
        valorModo: 20,
        tematica: 'clasica',
        color: '#e53935',
    })

    try {
        // Un segundo jugador se une para que la partida quede llena
        unirsePartida(partida.codigo, 'Invitado', '#1e88e5')

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

test('no permite iniciar una partida a la que le faltan jugadores', async () => {
    const anfitrion = `HostIncompleta-${Date.now()}`
    autenticarNickname(anfitrion)
    const partida = crearPartida({
        anfitrion,
        nombrePartida: 'Partida incompleta',
        cantidadJugadores: 2,
        tipoJuego: 'tiempo',
        valorModo: 1,
        tematica: 'clasica',
        color: '#e53935',
    })

    try {
        await assert.rejects(iniciarPartida(partida.codigo, anfitrion), /suficientes jugadores/)
    } finally {
        eliminarPartida(partida.codigo, anfitrion)
        desconectarNickname(anfitrion)
    }
})
