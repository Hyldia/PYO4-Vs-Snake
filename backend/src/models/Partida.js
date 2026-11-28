/*
 * Objetivo: Representar una partida con su configuración y sus jugadores
 * Entrada: Datos de la partida ya validados y el jugador anfitrión
 * Salida: Instancia de Partida en estado de espera
 * Restricciones: Los datos se validan en el servicio antes de crear la partida
 */
class Partida {
    constructor(datos, anfitrion) {
        this.codigo = datos.codigo
        this.nombrePartida = datos.nombrePartida
        this.anfitrion = anfitrion.nickname
        this.jugadores = [anfitrion] // El creador de la partida es el primer jugador
        this.cantidadJugadores = datos.cantidadJugadores
        this.tipoJuego = datos.tipoJuego
        this.duracionSegundos = datos.duracionSegundos
        this.longitudObjetivo = datos.longitudObjetivo
        this.tematica = datos.tematica
        this.estado = 'esperando'
        this.estadoJuego = null
    }

    /*
     * Objetivo: Saber si la partida ya tiene todos sus jugadores
     * Entrada: No recibe parámetros
     * Salida: true si está llena; false si todavía hay cupo
     * Restricciones: Ninguna
     */
    estaLlena() {
        return this.jugadores.length >= this.cantidadJugadores
    }

    /*
     * Objetivo: Buscar un jugador de la partida por su nickname
     * Entrada: Nickname del jugador
     * Salida: El jugador encontrado o null si no está en la partida
     * Restricciones: No distingue mayúsculas de minúsculas
     */
    buscarJugador(nickname) {
        return this.jugadores.find((jugador) => jugador.tieneNickname(nickname)) || null
    }

    /*
     * Objetivo: Saber si un color ya lo eligió otro jugador
     * Entrada: Color que se quiere revisar
     * Salida: true si está ocupado; false si está libre
     * Restricciones: Ninguna
     */
    colorOcupado(color) {
        return this.jugadores.some((jugador) => jugador.color === color)
    }

    /*
     * Objetivo: Saber si un nickname es el del anfitrión
     * Entrada: Nickname que se quiere revisar
     * Salida: true si es el anfitrión; false si no
     * Restricciones: No distingue mayúsculas de minúsculas
     */
    esAnfitrion(nickname) {
        return this.anfitrion.toLowerCase() === String(nickname).trim().toLowerCase()
    }

    /*
     * Objetivo: Agregar un jugador a la partida
     * Entrada: Instancia de Jugador
     * Salida: No retorna ningún valor
     * Restricciones: El cupo y el color se validan antes en el servicio
     */
    agregarJugador(jugador) {
        this.jugadores.push(jugador)
    }

    /*
     * Objetivo: Quitar un jugador de la partida
     * Entrada: Nickname del jugador
     * Salida: No retorna ningún valor
     * Restricciones: Si el jugador no está, la partida queda igual
     */
    quitarJugador(nickname) {
        this.jugadores = this.jugadores.filter((jugador) => !jugador.tieneNickname(nickname))
    }

    /*
     * Objetivo: Crear una copia independiente de la partida
     * Entrada: No recibe parámetros
     * Salida: Nueva instancia de Partida con los mismos datos y copias de sus jugadores
     * Restricciones: Se usa para que nadie modifique la partida guardada sin pasar por el almacenamiento
     */
    copiar() {
        const copia = Object.create(Partida.prototype) // Objeto Partida vacío, sin pasar por el constructor
        Object.assign(copia, this)
        copia.jugadores = this.jugadores.map((jugador) => jugador.copiar())
        return copia
    }
}

module.exports = Partida