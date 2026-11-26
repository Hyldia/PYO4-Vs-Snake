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