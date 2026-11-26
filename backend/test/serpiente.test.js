const test = require('node:test')
const assert = require('node:assert/strict')
const { Serpiente } = require('../src/utils/serpiente')

test('crea una serpiente detenida de largo 1', () => {
    const serpiente = new Serpiente('Jugador', 'rojo', { x: 5, y: 3 })

    assert.equal(serpiente.largo, 1)
    assert.equal(serpiente.estado, 'detenida')
    assert.equal(serpiente.direccion, 'right')
    assert.deepEqual(serpiente.cabeza, { x: 5, y: 3, color: 'rojo' })
})

test('permite indicar una dirección inicial', () => {
    const serpiente = new Serpiente('Jugador', 'azul', { x: 0, y: 0 }, 'up')

    assert.equal(serpiente.direccion, 'up')
})

test('aJSON devuelve copias de los segmentos', () => {
    const serpiente = new Serpiente('Jugador', 'rojo', { x: 5, y: 3 })
    const datos = serpiente.aJSON()

    datos.segmentos[0].x = 99
    assert.equal(serpiente.cabeza.x, 5)
})

test('una dirección válida activa la serpiente y se aplica al iniciar el tick', () => {
    const serpiente = new Serpiente('Jugador', 'rojo', { x: 5, y: 3 })

    assert.equal(serpiente.cambiarDireccion('invalida'), false)
    assert.equal(serpiente.estado, 'detenida')
    assert.equal(serpiente.cambiarDireccion('up'), true)
    assert.equal(serpiente.estado, 'activa')
    assert.equal(serpiente.direccion, 'right')
    assert.equal(serpiente.cambiarDireccion('down'), true)

    serpiente.aplicarDireccion()
    assert.equal(serpiente.direccion, 'down')
    assert.equal(serpiente.direccionPendiente, null)
})

test('rechaza el giro opuesto a la dirección recorrida cuando tiene cuerpo', () => {
    const serpiente = new Serpiente('Jugador', 'rojo', { x: 5, y: 3 })
    serpiente.segmentos.push({ x: 4, y: 3, color: 'rojo' })

    assert.equal(serpiente.cambiarDireccion('up'), true)
    assert.equal(serpiente.cambiarDireccion('left'), false)
    serpiente.aplicarDireccion()
    assert.equal(serpiente.direccion, 'up')
    assert.equal(serpiente.cambiarDireccion('down'), false)
})

test('permite invertir la dirección cuando tiene largo 1', () => {
    const serpiente = new Serpiente('Jugador', 'rojo', { x: 5, y: 3 })

    assert.equal(serpiente.cambiarDireccion('left'), true)
    serpiente.aplicarDireccion()
    assert.equal(serpiente.direccion, 'left')
})

test('una serpiente inmovilizada ignora las direcciones', () => {
    const serpiente = new Serpiente('Jugador', 'rojo', { x: 5, y: 3 })
    serpiente.estado = 'inmovilizada'

    assert.equal(serpiente.cambiarDireccion('up'), false)
    assert.equal(serpiente.estado, 'inmovilizada')
    assert.equal(serpiente.direccionPendiente, null)
})

test('calcula la siguiente cabeza en cada dirección sin modificar la serpiente', () => {
    const posiciones = {
        up: { x: 5, y: 2 },
        down: { x: 5, y: 4 },
        left: { x: 4, y: 3 },
        right: { x: 6, y: 3 },
    }

    for (const [direccion, esperada] of Object.entries(posiciones)) {
        const serpiente = new Serpiente('Jugador', 'rojo', { x: 5, y: 3 }, direccion)
        assert.deepEqual(serpiente.siguienteCabeza(), esperada)
        assert.deepEqual(serpiente.cabeza, { x: 5, y: 3, color: 'rojo' })
    }
})