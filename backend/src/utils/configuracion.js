// Lee una sola vez, al iniciar el servidor y los parámetros que necesita el juego que están en backend/config.json
const configuracion = require('../../config.json')

const CAMPOS_NUMERICOS = [
    'expiracionPartidaSegundos',
    'cuentaRegresivaSegundos',
    'duracionPorDefectoSegundos',
    'longitudObjetivoPorDefecto',
    'minimoJugadores',
    'maximoJugadores',
    'movimientosPorSegundo',
    'celdasPerdidasPorChoque',
    'segundosInmovilPorVeneno',
    'segundosAparicionVeneno',
    'segundosCambioVeneno',
    'maximoVenenos',
]

/*
 * Objetivo: Revisar que los valores de config.json sean válidos antes de usarlos
 * Entrada: Objeto leído desde config.json
 * Salida: No retorna ningún valor solo lanza un error si algún valor es inválido
 * Restricciones:
        - Los campos numéricos deben ser enteros mayores que 0
        - El mínimo de jugadores debe ser al menos 2 y no mayor que el máximo
        - Debe haber al menos un color por cada jugador posible
 */
function revisarConfiguracion(configuracion) {
    CAMPOS_NUMERICOS.forEach((campo) => {
        const valor = configuracion[campo]
        if (!Number.isInteger(valor) || valor <= 0) {
            throw new Error(`config.json: "${campo}" debe ser un número entero mayor que 0.`)
        }
    })

    if (configuracion.minimoJugadores < 2 || configuracion.minimoJugadores > configuracion.maximoJugadores) {
        throw new Error('config.json: el mínimo de jugadores debe ser al menos 2 y no puede ser mayor que el máximo.')
    }

    if (!Array.isArray(configuracion.colores) || configuracion.colores.length < configuracion.maximoJugadores) {
        throw new Error('config.json: "colores" debe tener al menos un color por cada jugador.')
    }
}

revisarConfiguracion(configuracion)

module.exports = configuracion