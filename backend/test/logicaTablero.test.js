const test = require('node:test')
const assert = require('node:assert/strict')
const { Serpiente } = require('../src/utils/serpiente')
const { calcularDimension, crearEstado, tick } = require('../src/utils/logicaTablero')

const PARAMETROS = { celdasPerdidasPorChoque: 2 }

// Estado de prueba con tablero 22x22 (2 jugadores) y las serpientes indicadas
function estadoCon(...serpientes) {
    return { tablero: { ancho: 22, alto: 22 }, serpientes, comida: [], veneno: [] }
}

// Serpiente activa con los segmentos dados (cabeza primero)
function serpiente(nickname, color, celdas, direccion) {
    const s = new Serpiente(nickname, color, celdas[0], direccion)
    s.segmentos = celdas.map(([x, y]) => ({ x, y, color }))
    s.estado = 'activa'
    return s
}

const posiciones = (s) => s.segmentos.map(({ x, y }) => [x, y])

test('el tablero mide 11n x 11n', () => {
    assert.equal(calcularDimension(3), 33)
    const estado = crearEstado([{ nickname: 'a', color: '#f00' }, { nickname: 'b', color: '#0f0' }])
    assert.deepEqual(estado.tablero, { ancho: 22, alto: 22 })
    assert.equal(estado.serpientes.length, 2)
    estado.serpientes.forEach((s) => assert.equal(s.largo, 1))
})

test('las serpientes nacen detenidas y no se mueven sin dirección', () => {
    const s = new Serpiente('a', '#f00', { x: 5, y: 5 })
    const estado = estadoCon(s)
    tick(estado, PARAMETROS)
    assert.deepEqual(posiciones(s), [[5, 5]])
})

test('arranca al indicar una dirección y avanza una celda por tick', () => {
    const s = new Serpiente('a', '#f00', { x: 5, y: 5 })
    const estado = estadoCon(s)
    assert.equal(s.cambiarDireccion('down'), true)
    tick(estado, PARAMETROS)
    assert.deepEqual(posiciones(s), [[5, 6]])
    tick(estado, PARAMETROS)
    assert.deepEqual(posiciones(s), [[5, 7]])
})

test('el cuerpo sigue el camino de la cabeza al doblar', () => {
    const s = serpiente('a', '#f00', [[5, 5], [4, 5], [3, 5]], 'right')
    const estado = estadoCon(s)
    s.cambiarDireccion('down')
    tick(estado, PARAMETROS)
    assert.deepEqual(posiciones(s), [[5, 6], [5, 5], [4, 5]])
    tick(estado, PARAMETROS)
    assert.deepEqual(posiciones(s), [[5, 7], [5, 6], [5, 5]])
})

test('no permite el giro de 180° si el largo es mayor a 1', () => {
    const s = serpiente('a', '#f00', [[5, 5], [4, 5]], 'right')
    assert.equal(s.cambiarDireccion('left'), false)
    s.cambiarDireccion('up')
    assert.equal(s.cambiarDireccion('left'), false) // sigue comparando contra 'right'
    tick(estadoCon(s), PARAMETROS)
    assert.deepEqual(posiciones(s), [[5, 4], [5, 5]])
})

test('con largo 1 sí permite cualquier dirección', () => {
    const s = new Serpiente('a', '#f00', { x: 5, y: 5 }, 'right')
    assert.equal(s.cambiarDireccion('left'), true)
})

test('ignora direcciones inválidas', () => {
    const s = new Serpiente('a', '#f00', { x: 5, y: 5 })
    assert.equal(s.cambiarDireccion('arriba'), false)
    assert.equal(s.estado, 'detenida')
})

test('crece un segmento al comer y conserva el color de cada segmento', () => {
    const s = serpiente('a', '#f00', [[5, 5], [4, 5]], 'right')
    const estado = estadoCon(s)
    estado.comida = [{ x: 6, y: 5, color: '#0f0' }]
    const eventos = tick(estado, PARAMETROS)
    assert.deepEqual(posiciones(s), [[6, 5], [5, 5], [4, 5]])
    assert.deepEqual(s.segmentos.map((x) => x.color), ['#f00', '#f00', '#0f0'])
    assert.equal(estado.comida.length, 0)
    assert.deepEqual(eventos, [{ tipo: 'comio', nickname: 'a', color: '#0f0', celda: { x: 6, y: 5 } }])

    tick(estado, PARAMETROS) // el color verde no cambia de segmento al moverse
    assert.deepEqual(s.segmentos.map((x) => x.color), ['#f00', '#f00', '#0f0'])
})

test('choque contra el borde: pierde celdas, se detiene y reanuda con una dirección', () => {
    const s = serpiente('a', '#f00', [[21, 5], [20, 5], [19, 5], [18, 5]], 'right')
    const estado = estadoCon(s)
    const eventos = tick(estado, PARAMETROS)
    assert.equal(s.largo, 2)
    assert.equal(s.estado, 'detenida')
    assert.deepEqual(eventos[0], { tipo: 'choque', nickname: 'a', contra: 'borde', celdasPerdidas: 2 })

    tick(estado, PARAMETROS) // sigue detenida
    assert.deepEqual(posiciones(s), [[21, 5], [20, 5]])

    s.cambiarDireccion('up')
    tick(estado, PARAMETROS)
    assert.deepEqual(posiciones(s), [[21, 4], [21, 5]])
})

test('la penalización nunca deja la serpiente con menos de 1 celda', () => {
    const s = serpiente('a', '#f00', [[0, 0], [1, 0]], 'left')
    tick(estadoCon(s), PARAMETROS)
    assert.equal(s.largo, 1)
})

test('choque contra su propio cuerpo', () => {
    const s = serpiente('a', '#f00', [[5, 5], [5, 6], [6, 6], [6, 5], [6, 4]], 'up')
    s.cambiarDireccion('right') // gira a la derecha y se topa con su propio cuerpo en (6,5)
    const eventos = tick(estadoCon(s), PARAMETROS)
    assert.equal(eventos[0].contra, 'si-misma')
    assert.equal(s.estado, 'detenida')
})

test('moverse a la celda que deja libre su propia cola no es choque', () => {
    const s = serpiente('a', '#f00', [[5, 5], [5, 6], [6, 6], [6, 5]], 'up')
    assert.equal(s.cambiarDireccion('right'), true) // destino (6,5) es su cola, que se libera
    const eventos = tick(estadoCon(s), PARAMETROS)
    assert.deepEqual(eventos, [])
    assert.deepEqual(posiciones(s), [[6, 5], [5, 5], [5, 6], [6, 6]])
})

test('choque contra el cuerpo de otra serpiente: solo penaliza a quien chocó', () => {
    const a = serpiente('a', '#f00', [[5, 5], [4, 5], [3, 5]], 'right')
    const b = serpiente('b', '#00f', [[6, 4], [6, 5], [6, 6]], 'down') // cuerpo de b en (6,5)
    b.estado = 'detenida'
    const eventos = tick(estadoCon(a, b), PARAMETROS)
    assert.equal(eventos.length, 1)
    assert.deepEqual(eventos[0], { tipo: 'choque', nickname: 'a', contra: 'b', celdasPerdidas: 2 })
    assert.equal(b.largo, 3)
})

test('choque frontal en la misma celda: ambas se penalizan', () => {
    const a = serpiente('a', '#f00', [[5, 5], [4, 5], [3, 5]], 'right')
    const b = serpiente('b', '#00f', [[7, 5], [8, 5], [9, 5]], 'left')
    const eventos = tick(estadoCon(a, b), PARAMETROS)
    assert.equal(eventos.length, 2)
    assert.deepEqual(eventos.map((e) => e.contra).sort(), ['a', 'b'])
    assert.equal(a.largo, 1)
    assert.equal(b.largo, 1)
})

test('choque frontal por cruce de celdas: ambas se penalizan', () => {
    const a = serpiente('a', '#f00', [[5, 5], [4, 5], [3, 5]], 'right')
    const b = serpiente('b', '#00f', [[6, 5], [7, 5], [8, 5]], 'left')
    const eventos = tick(estadoCon(a, b), PARAMETROS)
    assert.equal(eventos.length, 2)
    assert.equal(a.estado, 'detenida')
    assert.equal(b.estado, 'detenida')
})

test('una serpiente inmovilizada no se mueve ni acepta direcciones', () => {
    const s = serpiente('a', '#f00', [[5, 5]], 'right')
    s.estado = 'inmovilizada'
    assert.equal(s.cambiarDireccion('up'), false)
    tick(estadoCon(s), PARAMETROS)
    assert.deepEqual(posiciones(s), [[5, 5]])
})

test('el orden de las serpientes no cambia el resultado de un choque frontal', () => {
    const crear = () => [
        serpiente('a', '#f00', [[5, 5], [4, 5]], 'right'),
        serpiente('b', '#00f', [[7, 5], [8, 5]], 'left'),
    ]
    const [a1, b1] = crear()
    const [a2, b2] = crear()
    tick(estadoCon(a1, b1), PARAMETROS)
    tick(estadoCon(b2, a2), PARAMETROS)
    assert.equal(a1.largo, a2.largo)
    assert.equal(b1.largo, b2.largo)
})