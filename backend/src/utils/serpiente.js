/*
 * Objetivo: Representar una serpiente y su movimiento sobre el tablero (lógica pura)
 * Entrada: Operaciones de dirección, avance, crecimiento y penalización
 * Salida: Estado de la serpiente (segmentos, dirección y estado)
 * Restricciones: No conoce sockets, partidas ni temporizadores
 */

// Desplazamiento en celdas por dirección (el eje Y crece hacia abajo)
const DIRECCIONES = Object.freeze({
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
})

const OPUESTAS = Object.freeze({
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
})

/*
 * Estados posibles:
 *  - 'detenida':    no se mueve hasta que el jugador indique una dirección
 *  - 'activa':      avanza en cada tick
 *  - 'inmovilizada': no avanza ni acepta direcciones (la activa quien maneje el veneno)
 */
class Serpiente {
    /*
     * Objetivo: Crear una serpiente de largo 1
     * Entrada: Nickname, color, posición inicial {x, y} y dirección inicial opcional
     * Salida: Instancia de Serpiente detenida
     * Restricciones: La dirección debe ser up, down, left o right
     */
    constructor(nickname, color, posicion, direccion = 'right') {
        this.nickname = nickname
        this.color = color
        this.direccion = direccion
        this.direccionPendiente = null
        this.estado = 'detenida'
        this.segmentos = [{ x: posicion.x, y: posicion.y, color }]
    }

    get largo() {
        return this.segmentos.length
    }

    get cabeza() {
        return this.segmentos[0]
    }

    /*
     * Objetivo: Obtener la serpiente en formato simple para enviarla por socket
     * Entrada: No recibe parámetros
     * Salida: Objeto plano con nickname, color, dirección, estado y segmentos
     * Restricciones: Devuelve copias de los segmentos
     */
    aJSON() {
        return {
            nickname: this.nickname,
            color: this.color,
            direccion: this.direccion,
            estado: this.estado,
            largo: this.largo,
            segmentos: this.segmentos.map((segmento) => ({ ...segmento })),
        }
    }
}

module.exports = {
    DIRECCIONES,
    OPUESTAS,
    Serpiente,
}