const test = require('node:test')
const assert = require('node:assert/strict')
const { autenticarNickname, desconectarNickname } = require('../src/services/servicesAutenticacion')
const {
    crearPartida,
    eliminarPartida,
    modificarConfiguracion,
    obtenerPartida,
    salirDePartida,
    unirsePartida
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
            valorModo: 3,
            tematica: 'clasica',
            color: '#e53935',
        }
        const partida = crearPartida(configuracion)
        partidas.push(partida)
        const otraPartida = crearPartida(configuracion)
        partidas.push(otraPartida)
        assert.equal(partida.jugadores.length, 1)
        assert.equal(partida.jugadores[0].nickname, anfitrion)
        assert.equal(partida.jugadores[0].color, '#e53935')
        assert.match(partida.codigo, /^\d{6}$/)
        assert.notEqual(partida.codigo, otraPartida.codigo)

        assert.equal(partida.estado, 'esperando')
        assert.equal(partida.jugadores[0].color, '#e53935')
        assert.equal(partida.duracionSegundos, 180)
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
test('permite unirse con un color libre y rechaza colores repetidos o partidas llenas', () => {
    const anfitrion = `AnfitrionUnirse-${Date.now()}`
    autenticarNickname(anfitrion)
    const partida = crearPartida({
        anfitrion,
        nombrePartida: 'Partida para unirse',
        cantidadJugadores: 2,
        tipoJuego: 'longitud',
        valorModo: 10,
        tematica: 'clasica',
        color: '#e53935',
    })

    try {
        assert.throws(() => unirsePartida(partida.codigo, 'Invitado', '#e53935'), /color ya lo eligió/)

        const actualizada = unirsePartida(partida.codigo, 'Invitado', '#1e88e5')
        assert.equal(actualizada.jugadores.length, 2)
        assert.equal(actualizada.jugadores[1].color, '#1e88e5')

        assert.throws(() => unirsePartida(partida.codigo, 'Otro', '#43a047'), /llena/)

        salirDePartida(partida.codigo, 'Invitado')
        assert.equal(obtenerPartida(partida.codigo).jugadores.length, 1)
    } finally {
        eliminarPartida(partida.codigo, anfitrion)
        desconectarNickname(anfitrion)
    }
})