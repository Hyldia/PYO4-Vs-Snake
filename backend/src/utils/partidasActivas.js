/*
 * Objetivo: Mantener las partidas activas en memoria
 * Entrada: Operaciones de almacenamiento desde el servicio de partidas
 * Salida: Acceso temporal a las partidas registradas por código
 * Restricciones: Los datos se pierden cuando se reinicia el proceso del backend
 */
const partidas = new Map()

/*
 * Objetivo: Crear una copia independiente de una partida
 * Entrada: Objeto de partida almacenado
 * Salida: Copia del objeto y de su lista de jugadores
 * Restricciones: Los campos de la partida son valores simples salvo la lista de jugadores
 */
function copiarPartida(partida) {
    return {
        ...partida,
        jugadores: [...partida.jugadores],
    }
}

/*
 * Objetivo: Guardar una partida nueva
 * Entrada: Objeto completo de partida
 * Salida: true si se guardó; false si el código ya existe
 * Restricciones: No reemplaza una partida que tenga el mismo código
 */
function guardarPartida(partida) {
    if (partidas.has(partida.codigo)) {
        return false
    }

    partidas.set(partida.codigo, copiarPartida(partida))
    return true
}

/*
 * Objetivo: Buscar una partida por código
 * Entrada: Código de la partida
 * Salida: Copia de la partida o null si no existe
 * Restricciones: Solo busca partidas almacenadas en memoria
 */
function buscarPartida(codigo) {
    const partida = partidas.get(String(codigo).trim())
    return partida ? copiarPartida(partida) : null
}

/*
 * Objetivo: Obtener todas las partidas almacenadas
 * Entrada: No recibe parámetros
 * Salida: Arreglo con copias de las partidas activas
 * Restricciones: No expone directamente los objetos internos del almacenamiento
 */
function obtenerPartidas() {
    return Array.from(partidas.values(), copiarPartida)
}

/*
 * Objetivo: Actualizar una partida existente
 * Entrada: Código de partida y objeto con los campos que se modificarán
 * Salida: Copia actualizada o null si no se encontró el código
 * Restricciones: La validación de los cambios corresponde al servicio de partidas
 */
function actualizarPartida(codigo, cambios) {
    const partida = partidas.get(String(codigo).trim())
    if (!partida) {
        return null
    }

    Object.assign(partida, cambios)
    return copiarPartida(partida)
}

/*
 * Objetivo: Eliminar una partida del almacenamiento
 * Entrada: Código de la partida
 * Salida: true si se eliminó; false si el código no existía
 * Restricciones: Solo elimina el registro indicado
 */
function eliminarPartida(codigo) {
    return partidas.delete(String(codigo).trim())
}

module.exports = {
    actualizarPartida,
    buscarPartida,
    eliminarPartida,
    guardarPartida,
    obtenerPartidas,
}