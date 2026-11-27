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
     * Objetivo: Registrar la dirección pedida por el jugador con las flechas
     * Entrada: 'up', 'down', 'left' o 'right'
     * Salida: true si se aceptó; false si se ignoró
     * Restricciones:
     *      - Con largo mayor a 1 no se permite el giro de 180° (chocaría con su cuello);
     *        se compara contra la dirección realmente recorrida, así dos teclas
     *        seguidas en un mismo tick no pueden dar la vuelta
     *      - Una serpiente detenida arranca al recibir una dirección válida
     *      - Una serpiente inmovilizada ignora la dirección
     */
    cambiarDireccion(direccion) {
        if (!Object.hasOwn(DIRECCIONES, direccion)) {
            return false
        }
        if (this.estado === 'inmovilizada') {
            return false
        }
        if (this.largo > 1 && direccion === OPUESTAS[this.direccion]) {
            return false
        }
        this.direccionPendiente = direccion
        if (this.estado === 'detenida') {
            this.estado = 'activa'
        }
        return true
    }

    /*
     * Objetivo: Aplicar al inicio del tick la última dirección pedida
     * Entrada: No recibe parámetros
     * Salida: No retorna ningún valor
     * Restricciones: Solo cambia la dirección si hay una pendiente
     */
    aplicarDireccion() {
        if (this.direccionPendiente) {
            this.direccion = this.direccionPendiente
            this.direccionPendiente = null
        }
    }

    /*
     * Objetivo: Calcular la celda a la que iría la cabeza en el siguiente movimiento
     * Entrada: No recibe parámetros
     * Salida: Objeto {x, y}
     * Restricciones: No modifica la serpiente
     */
    siguienteCabeza() {
        const { dx, dy } = DIRECCIONES[this.direccion]
        return { x: this.cabeza.x + dx, y: this.cabeza.y + dy }
    }

    /*
     * Objetivo: Avanzar una celda; cada segmento ocupa el lugar del anterior
     * Entrada:
     *      - nuevaCabeza: celda {x, y} destino de la cabeza
     *      - colorCrecimiento: si viene, la serpiente crece un segmento de ese color
     * Salida: No retorna ningún valor
     * Restricciones:
     *      - Solo se mueven las posiciones; el color de cada segmento se queda con él
     *        (necesario para Fruit Mix)
     *      - Al crecer, el segmento nuevo ocupa la celda que dejó la cola, por lo que
     *        el cuerpo queda extendido hacia adelante respecto a su posición anterior
     */
    avanzar(nuevaCabeza, colorCrecimiento = null) {
        const cola = this.segmentos[this.segmentos.length - 1]
        const colaAnterior = { x: cola.x, y: cola.y }

        for (let i = this.segmentos.length - 1; i > 0; i -= 1) {
            this.segmentos[i].x = this.segmentos[i - 1].x
            this.segmentos[i].y = this.segmentos[i - 1].y
        }
        this.segmentos[0].x = nuevaCabeza.x
        this.segmentos[0].y = nuevaCabeza.y

        if (colorCrecimiento) {
            this.segmentos.push({ ...colaAnterior, color: colorCrecimiento })
        }
    }

    /*
     * Objetivo: Penalizar por choque quitando segmentos desde la cola y detener la serpiente
     * Entrada: Cantidad de celdas a perder
     * Salida: Cantidad de celdas realmente perdidas
     * Restricciones: El largo nunca baja de 1
     */
    penalizar(celdas) {
        const conservar = Math.max(1, this.largo - celdas)
        const perdidas = this.largo - conservar
        this.segmentos.length = conservar
        this.direccionPendiente = null
        this.estado = 'detenida'
        return perdidas
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