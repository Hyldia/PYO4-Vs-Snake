/*
 * Objetivo: Mantener las partidas activas en memoria
 * Entrada: Operaciones de almacenamiento desde el servicio de partidas
 * Salida: Acceso temporal a las partidas registradas por código
 * Restricciones: Los datos se pierden cuando se reinicia el proceso del backend
 */
const partidas = new Map()
const observadores = []

/*
 * Objetivo: Crear una copia independiente de una partida
 * Entrada: Objeto de partida almacenado
 * Salida: Copia del objeto y de su lista de jugadores
 * Restricciones: Los campos de la partida son valores simples salvo la lista de jugadores
 */
function copiarPartida(partida) {
    return partida.copiar() //se cambio para que se use el metodo copiar de la clase partida
}

/*
 * Objetivo: Registrar una función que se ejecuta cada vez que una partida cambia
 * Entrada: Función que recibe el tipo de cambio ('actualizada' o 'eliminada') y los datos
 * Salida: No retorna ningún valor
 * Restricciones: Permite avisar los cambios por Socket.IO sin que los servicios conozcan los sockets
 */
function suscribirCambios(observador) {
    observadores.push(observador)
}

/*
 * Objetivo: Avisar a todas las funciones registradas que una partida cambió
 * Entrada: Tipo de cambio y datos: la partida si se actualizó o el código si se eliminó
 * Salida: No retorna ningún valor
 * Restricciones: Si una función falla, no detiene a las demás ni a la operación original
 */
function notificarCambio(tipo, datos) {
    observadores.forEach((observador) => {
        try {
            observador(tipo, datos)
        } catch (error) {
            console.error('No se pudo avisar el cambio de la partida:', error)
        }
    })
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
    notificarCambio('actualizada', copiarPartida(partida))
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
    notificarCambio('actualizada', copiarPartida(partida))
    return copiarPartida(partida)
}

/*
 * Objetivo: Eliminar una partida del almacenamiento
 * Entrada: Código de la partida
 * Salida: true si se eliminó; false si el código no existía
 * Restricciones: Solo elimina el registro indicado
 */
function eliminarPartida(codigo) {
    const clave = String(codigo).trim()
    const elimnada = partidas.delete(clave)
    if (elimnada) {
        notificarCambio('eliminada', clave)
    }
    return elimnada
}

module.exports = {
    actualizarPartida,
    buscarPartida,
    eliminarPartida,
    guardarPartida,
    obtenerPartidas,
    suscribirCambios,
}