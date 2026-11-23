// Se maneja la logica de autenticación
// Los nicknames son temporales y permanecen activos únicamente mientras el
const { agregarJugador, eliminarJugador, existeJugador } = require('../utils/jugadoresConectados')

const LONGITUD_MAXIMA_NICKNAME = 30

/*
* Objetivo: Validar un nickname y registrarlo como jugador conectado si se esta disponible
* Entrada: Nickname ingresado por el jugador
* Salida:
        - Ingresa si el nickname es valido
        - Mensaje si ya esta en uso
* Restricción: 
        - Debe ser una cadena de texto.
        - Debe tener entre 1 y 30 caracteres.
*/
function autenticarNickname(nickname) {
    if (typeof nickname !== 'string') {
        return { error: 'El nickname debe ser texto.' }
    }

    const nombre = nickname.trim()
    if (!nombre || nombre.length > LONGITUD_MAXIMA_NICKNAME) {
        return { error: 'El nickname debe tener entre 1 y 30 caracteres.' }
    }

    if (existeJugador(nombre)) {
        return { conflicto: 'Este nickname ya está en uso.' }
    }

    agregarJugador(nombre)
    return { nickname: nombre }
}

/*
* Objetivo:  Eliminar un nickname de la lista de jugadores conectados
* Entrada: Nombre del jugador que abandonó la partida o se desconecto
* Salida: 
        - True si el jugador fue eliminado 
        - False si el nickname recibido es inválido o no se pudo eliminar
* Restricción: El nickname debe ser una cadena de texto y no puede ser vacio
*/
function desconectarNickname(nickname) {
    if (typeof nickname !== 'string' || !nickname.trim()) {
        return false
    }

    return eliminarJugador(nickname)
}

module.exports = {
    autenticarNickname,
    desconectarNickname,
}