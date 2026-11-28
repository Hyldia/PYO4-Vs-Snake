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
 * Objetivo: Escoger una celda aleatoria del tablero que no esté ocupada por serpientes, alimentos ni venenos.
 * Entrada:
        - Estado actual de la partida
        - Función aleatrorio para generar los numeros aleatorios entre 0 y 1
 * Salida: Objeto con las coordenadas de una celda libre
 * Restricciones:
        - Debe existir al menos una celda disponible
        - El generador aleatorio debe devolver un valor entre 0 y 1
 */
function obtenerCeldaLibre(estado, aleatorio = Math.random){
    const ocupadas = new Set() // Lista de las celdas ocupadas
    // Agrega la posicion de los segmentos de las serpientes
    estado.serpientes.forEach((serpiente) => {
        serpiente.segmentos.forEach((segmento) => ocupadas.add(clave(segmento)))
    })
    estado.comida.forEach((alimento) => ocupadas.add(clave(alimento))) // Agrega las posicionesd de los aliemntos 
    estado.venenos.forEach((veneno) => ocupadas.add(clave(veneno))) // Agrega las posiciones de los venenos

    const libres = []
    // Recorre todo el tablero
    for (let y = 0; y < estado.tablero.alto; y += 1){
        for(let x = 0; x < estado.tablero.ancho; x += 1){
            const celda = {x,y} // Revisa si la celda esta libre
            if (!ocupadas.has(clave(celda))) {
                libres.push(celda)
            }
        }
    }
    if (libres.length === 0){ // Verificar si hay espacio
        throw new Error('No hay celdas libres para colocar el elemento.')
    }
    // Obtener un numero aleatorio para elegir una celda libre al azar
    const valorAleatotio = aleatorio() 
    if (!Number.isFinite(valorAleatotio) || valorAleatotio < 0 || valorAleatotio >= 1 ){
        throw new Error('El generador aleatorio debe devolver un numero entre 0 y 1')
    }
    return libres[Math.floor(valorAleatotio * libres.length)]
}

/*
 * Objetivo: Agregar un alimento en una posición libre del tablero.
 * Entrada:
        - Estado actual de la partida
        - Aleatorio para generar posiciones aleatorias
 * Salida: Nuevo estado con el alimento agregado.
 * Restricciones: El alimento no se puede generar sobre serpientes, alimentos o venenos existentes
 */
function agregarAlimento(estado, aleatorio = Math.random) {
    const celda = obtenerCeldaLibre(estado, aleatorio)
    return {
        ...estado, // Mantiene las propiedades ya existentes del juego
        comida: [...estado.comida, celda], // Toma la comiuda que ya exite y le agrega una nueva
    }
}

/*
 * Agrega un nuevo veneno al estado actual del juego en una posición libre del tablero
 */
function agregarVeneno(estado, aleatorio = Math.random) {
    const celda = obtenerCeldaLibre(estado, aleatorio)
    return {
        ...estado, // Mantiene las propiedades ya existentes del juego
        venenos: [...estado.venenos, celda], // Toma el veneno que ya exite y le agrega una nueva
    }
}

/*
 * Objetivo: Reubicar todos los venenos existentes en nuevas posiciones aleatorias
 * Entrada:
        - Estado actual de la partida
        - Aleatorio para las posiciones
 * Salida:nNuevo estado con los venenos ubicados en nuevas posiciones
 * Restricciones:
        - Mantiener la misma cantidad de venenos
        - Los nuevos venenos no pueden colocarse sobre serpientes, alimentos u otros venenos
 */
function reubicarVenenos(estado, aleatorio =Math.random){
    let resultado = {...estado, venenos: [],} // Mantine los estados actules pero elimina temporalmente los venenos
    for(let i = 0; i < estado.venenos.length; i += 1){
        resultado = agregarVeneno(resultado, aleatorio)
    }
    return resultado
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
    agregarAlimento,
    agregarVeneno,
    calcularDimension,
    crearEstado,
    obtenerCeldaLibre,
    reubicarVenenos,
    tick,
}