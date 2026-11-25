/*
 * Objetivo: Representar a un jugador dentro de una partida
 * Entrada: Nickname del jugador y color elegido
 * Salida: Instancia de Jugador
 * Restricciones: El color se valida en el servicio antes de crear el jugador
 */
class Jugador {
    constructor(nickname, color) {
        this.nickname = nickname
        this.color = color
    }

    /*
     * Objetivo: Saber si este jugador tiene un nickname dado
     * Entrada: Nickname que se quiere comparar
     * Salida: true si coincide; false si no
     * Restricciones: No distingue mayúsculas de minúsculas
     */
    tieneNickname(nickname) {
        return this.nickname.toLowerCase() === String(nickname).trim().toLowerCase()
    }

    /*
     * Objetivo: Crear una copia independiente del jugador
     * Entrada: No recibe parámetros
     * Salida: Nueva instancia de Jugador con los mismos datos
     * Restricciones: Ninguna
     */
    copiar() {
        return new Jugador(this.nickname, this.color)
    }
}

module.exports = Jugador