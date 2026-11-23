// Guarda temporalmente losjugadors que estan conectados
// La información se mantiene únicamente mientras el servidor esté encendido
// Si el servidor se reinicia, todos los nicknames registrados se perderán
const jugadoresConectados = new Map()

/*
* Objetivo: Convertir un nickname a un formato estándar para hacer más facil las comparaciones
* Entrada: Nombre ingresado por el jugador
* Salida: Cadena de texto normalizada en minúsculas y sin espacios al inicio o al final
* Resticción: Debe recibir una cadena de texto válida
*/
function normalizarNickname(nickname) {
    return nickname.trim().toLowerCase()
}

/*
* Objetivo: Verificar si un nickname ya esta registrado entre los jugadores conectados
* Entrada:
* Nombre del jugador que se desea consultar
* Salida:
*       - True si el nickname ya está registrado
        - False si el nickname no existe.
*/
function existeJugador(nickname) {
    return jugadoresConectados.has(normalizarNickname(nickname))
}

/*
* Objetivo: Registrar un nuevo jugador conectado al sistema
* Entrada: Nombre del jugador que desea ingresar
* Salida:
        - True si el jugador fue agregado correctamente
        - False Si el nickname ya se encontraba registrado
* Restricciones: No se permiten nicknames duplicados
*/
function agregarJugador(nickname) {
    const clave = normalizarNickname(nickname) // Se usa la versión normalizada para eviatr duplicados.
    if (jugadoresConectados.has(clave)) {
        return false
    }

    jugadoresConectados.set(clave, nickname.trim())
    return true
}

/**
* Objetivo: Eliminar un jugador de la lista de jugadores conectados
* Entrada: Nombre del jugador que abandonó la sesión o se desconectó
* Salida:
        - True si el jugador fue eliminado
        - False si el nickname no existía.
* Restricciones: La búsqueda se realiza utilizando el nickname normalizado
 */
function eliminarJugador(nickname) {
    return jugadoresConectados.delete(normalizarNickname(nickname))
}

module.exports = {
    agregarJugador,
    eliminarJugador,
    existeJugador,
}