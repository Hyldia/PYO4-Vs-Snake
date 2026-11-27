const test = require('node:test')
const assert = require('node:assert/strict')
const { autenticarNickname, desconectarNickname } = require('../src/services/servicesAutenticacion')
const { crearPartida, eliminarPartida, unirsePartida } = require('../src/services/servicesPartidas')

const {
    entrarAlTablero,
    iniciarPartida,
    validarVictoria,
} = require('../src/services/servicesJuego')

test('entra al tablero, arranca con la tecla u y acepta victoria por longitud', async () => {
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

        const enTablero = entrarAlTablero(partida.codigo, 'Invitado')
        assert.equal(enTablero.estado, 'en_tablero')

        const iniciada = await iniciarPartida(partida.codigo, "Invitado")
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

test('no permite entrar al tablero a una partida a la que le faltan jugadores', async () => {
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
        assert.throws(() => entrarAlTablero(partida.codigo, anfitrion), /suficientes jugadores/)
    } finally {
        eliminarPartida(partida.codigo, anfitrion)
        desconectarNickname(anfitrion)
    }

})
test('la tecla u no funciona antes de entrar al tablero', async () => {
    const anfitrion = `HostSinTablero-${Date.now()}`
    autenticarNickname(anfitrion)
    const partida = crearPartida({
        anfitrion,
        nombrePartida: 'Sin tablero',
        cantidadJugadores: 2,
        tipoJuego: 'tiempo',
        valorModo: 1,
        tematica: 'clasica',
        color: '#e53935',
    })

    try {
        unirsePartida(partida.codigo, 'Otro', '#1e88e5')
        await assert.rejects(iniciarPartida(partida.codigo, anfitrion), /entrar al tablero/)
    } finally {
        eliminarPartida(partida.codigo, anfitrion)
        desconectarNickname(anfitrion)
    }
})