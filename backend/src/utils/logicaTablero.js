/*
 * Avanza la lógica del tablero un tick. No gestiona sockets ni temporizadores.
 */
const { Serpiente } = require('./serpiente')

const FACTOR_TABLERO = 11

/*
 * Calcula el lado del tablero: 11 celdas por jugador.
 */
function calcularDimension(cantidadJugadores) {
    return FACTOR_TABLERO * cantidadJugadores
}

/*
 * Crea el tablero y ubica una serpiente por jugador en celdas distintas.
 */
function crearEstado(jugadores, aleatorio = Math.random) {
    const lado = calcularDimension(jugadores.length)
    const usadas = new Set()
    const serpientes = jugadores.map(({ nickname, color }) => {
        let x
        let y
        do {
            x = Math.floor(aleatorio() * lado)
            y = Math.floor(aleatorio() * lado)
        } while (usadas.has(`${x},${y}`))
        usadas.add(`${x},${y}`)
        return new Serpiente(nickname, color, { x, y })
    })

    return {
        tablero: { ancho: lado, alto: lado },
        serpientes,
        comida: [],
        veneno: [],
    }
}

// Convierte una celda en una clave para mapas y conjuntos.
function clave(celda) {
    return `${celda.x},${celda.y}`
}

// Indica si dos celdas tienen las mismas coordenadas.
function mismaCelda(a, b) {
    return a.x === b.x && a.y === b.y
}

/*
 * Detecta choques con bordes, cuerpos u otras cabezas.
 */
function detectarChoque(movimiento, movimientos, ocupadas, tablero) {
    const { serpiente, destino } = movimiento

    if (destino.x < 0 || destino.y < 0 || destino.x >= tablero.ancho || destino.y >= tablero.alto) {
        return 'borde'
    }

    const dueno = ocupadas.get(clave(destino))
    if (dueno) {
        return dueno === serpiente.nickname ? 'si-misma' : dueno
    }

    // Choque frontal: dos cabezas quieren la misma celda
    const mismaDestino = movimientos.find((otro) =>
        otro.serpiente !== serpiente && mismaCelda(otro.destino, destino))
    if (mismaDestino) {
        return mismaDestino.serpiente.nickname
    }

    // Cruce: dos cabezas intercambian celdas
    const cruce = movimientos.find((otro) =>
        otro.serpiente !== serpiente &&
        mismaCelda(otro.destino, serpiente.cabeza) &&
        mismaCelda(destino, otro.serpiente.cabeza))
    if (cruce) {
        return cruce.serpiente.nickname
    }

    return null
}

/*
 * Mueve las serpientes activas, procesa comida y choques; devuelve los eventos.
 */
function tick(estado, { celdasPerdidasPorChoque }) {
    const eventos = []

    const movimientos = estado.serpientes
        .filter((serpiente) => serpiente.estado === 'activa')
        .map((serpiente) => {
            serpiente.aplicarDireccion()
            const destino = serpiente.siguienteCabeza()
            const comida = estado.comida.find((item) => mismaCelda(item, destino)) || null
            return { serpiente, destino, comida }
        })

    const ocupadas = new Map()
    estado.serpientes.forEach((serpiente) => {
        const movimiento = movimientos.find((m) => m.serpiente === serpiente)
        const colaLibre = movimiento && !movimiento.comida
        const limite = colaLibre ? serpiente.largo - 1 : serpiente.largo
        for (let i = 0; i < limite; i += 1) {
            ocupadas.set(clave(serpiente.segmentos[i]), serpiente.nickname)
        }
    })

    // Primero se deciden todos los choques y después se aplican los cambios
    const resultados = movimientos.map((movimiento) => ({
        movimiento,
        contra: detectarChoque(movimiento, movimientos, ocupadas, estado.tablero),
    }))

    resultados.forEach(({ movimiento, contra }) => {
        const { serpiente, destino, comida } = movimiento

        if (contra) {
            const celdasPerdidas = serpiente.penalizar(celdasPerdidasPorChoque)
            eventos.push({ tipo: 'choque', nickname: serpiente.nickname, contra, celdasPerdidas })
            return
        }

        if (comida) {
            const color = comida.color || serpiente.color
            serpiente.avanzar(destino, color)
            estado.comida = estado.comida.filter((item) => item !== comida)
            eventos.push({ tipo: 'comio', nickname: serpiente.nickname, color, celda: { ...destino } })
            return
        }

        serpiente.avanzar(destino)
    })

    return eventos
}

module.exports = {
    calcularDimension,
    crearEstado,
    tick,
}