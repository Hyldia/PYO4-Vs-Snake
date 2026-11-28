const config = require('../utils/configuracion')
const {actualizarPartida, buscarPartida,} = require('../utils/partidasActivas')
const {agregarAlimento, agregarVeneno, crearEstado, reubicarVenenos,} = require('../utils/logicaTablero')
const temporizadoresElementos = new Map()

/*
 * Objetivo: Obtener una partida especifica con el codigo identificador
 * Entrada: Codigo unico asociado a la partida
 * Salida: Objeto con la información de la partida encontrada
 * Restricciones:
        - La partida debe existir dentro de las partidas activas.}
        - Si el código no existe, se genera un error
 */
function obtenerPartida(codigo) {
    const partida = buscarPartida(codigo)
    if (!partida){
        throw new Error(`No se encontro la partida ${codigo}.`)
    }
    return partida
}

/*
 * Objetivo: Guardar o actualizar el estado actual del juego dentro de una partida
 * Entrada:
        - Codigo identificador de la partida
        - Estado actual del tablero, serpientes, alimentos y venenos
 * Salida: Objeto de la partida actualizado con el nuevo estado del juego
 * Restricciones: La partida debe existir y la actualización debe realizarse correctamente en memoria
 */
function guardarEstado(codigo, estadoJuego) {
    const partidaActualizada = actualizarPartida(codigo, { estadoJuego })
    if (! partidaActualizada) {
        throw new Error(`No se pudo actualizar el estado de la partida ${codigo}`)
    }
    return partidaActualizada
}

/*
 * Objetivo: Verifica que la partida siga activa, si lo esta ejecuta la tarea relacionada con los elementos del juego y si no esta activa, detiene los procesos automáticos
 * Entrada:
        - Codigo identificador de la partida
        - Función tarea que contiene la logica a ejecutar periódicamente
 * Salida: No retorna ningun valor
 * Restricciones:
        - La partida debe existir
        - La partida debe encontrarse en estado "jugando"
        - Si ocurre un error, se detienen automáticamente los procesos asociados
 */
function verificarYEjecutarTarea(codigo, tarea) {
    try {
        const partida = buscarPartida(codigo)
        if (!partida || partida.estado !== 'jugando') {
            detenerElementos(codigo)
            return
        }
        tarea(partida)
    } catch (error) {
        console.error(`Error al administrar los elementos de la partida ${codigo}:`, error)
        detenerElementos(codigo)
    }
}

