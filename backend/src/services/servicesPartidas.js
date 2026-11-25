const { randomInt } = require('node:crypto')
const config = require('../utils/configuracion')
const { existeJugador } = require('../utils/jugadoresConectados')
const Jugador = require('../models/Jugador')
const Partida = require('../models/Partida')
const {
    actualizarPartida: actualizarEnMemoria,
    buscarPartida: buscarEnMemoria,
    eliminarPartida: eliminarDeMemoria,
    guardarPartida,
    obtenerPartidas,
} = require('../utils/partidasActivas')

const TIEMPO_EXPIRACION_MS = config.expiracionPartidaSegundos * 1000
const CODIGOS_POR_GENERAR = 100
const codigosTemporizados = new Map()
const MODOS_VALIDOS = new Set(['tiempo', 'longitud'])
const TEMATICAS_VALIDAS = new Set(['clasica', 'fruit-mix'])

class ErrorPartida extends Error {
    constructor(mensaje, statusCode = 400) {
        super(mensaje)
        this.name = 'ErrorPartida'
        this.statusCode = statusCode
    }
}

/*
* Objetivo: Valida que el nombre de la partida cumpla con las reglas establecidas
* Entrada: Nombre ingresado para la partida.
* Salida: Nombre validado sin espacios al inicio ni al final.
* Restricciones:
            - Debe ser una cadena de texto.
            - Debe contener entre 1 y 30 caracteres.
 */
function validarNombre(nombre) {
    if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 30) {
        throw new ErrorPartida('El nombre debe tener entre 1 y 30 caracteres.')
    }
    return nombre.trim()
}

/*
 * Objetivo: Verifica la configuración seleccionada para la partida
 * Entrada:
        - Número máximo de jugadores permitido
        - Tipo de partida seleccionado
        - Temática escogida
 * Salida: Objeto con la configuración validada
 * Restricciones:
        - Solo se permiten 2, 3 o 4 jugadores
        - El modo de juego debe existir dentro de los modos permitidos
        - La temática debe existir dentro de las temáticas permitidas
 */
function validarConfiguracion({ cantidadJugadores, tipoJuego, tematica }) {
    const cantidad = Number(cantidadJugadores)
    const { minimoJugadores, maximoJugadores } = config
    if (!Number.isInteger(cantidad) || cantidad < minimoJugadores || cantidad > maximoJugadores) {
        throw new ErrorPartida(`La cantidad de jugadores debe estar entre ${minimoJugadores} y ${maximoJugadores}.`)
    }
    if (!MODOS_VALIDOS.has(tipoJuego)) {
        throw new ErrorPartida('El tipo de juego no es válido.')
    }
    if (!TEMATICAS_VALIDAS.has(tematica)) {
        throw new ErrorPartida('La temática no es válida.')
    }
    return { cantidadJugadores: cantidad, tipoJuego, tematica }
}
/*
 * Objetivo: Validar el valor que acompaña al modo de juego
 * Entrada:
        - Tipo de juego ('tiempo' o 'longitud')
        - Valor indicado por el anfitrión: minutos para 'tiempo' o largo a alcanzar para 'longitud'
 * Salida: Objeto con duracionSegundos y longitudObjetivo (el que no aplica queda en null)
 * Restricciones:
        - Los minutos deben ser un entero mayor o igual a 1
        - El largo objetivo debe ser un entero mayor o igual a 2, porque las serpientes inician con largo 1
 */
function validarValorModo(tipoJuego, valorModo) {
    const valor = Number(valorModo)

    if (tipoJuego === 'tiempo') {
        if (!Number.isInteger(valor) || valor < 1) {
            throw new ErrorPartida('Los minutos deben ser un número entero mayor o igual a 1.')
        }
        return { duracionSegundos: valor * 60, longitudObjetivo: null }
    }

    if (!Number.isInteger(valor) || valor < 2) {
        throw new ErrorPartida('El largo objetivo debe ser un número entero mayor o igual a 2.')
    }
    return { duracionSegundos: null, longitudObjetivo: valor }
}
/*
 * Objetivo: Validar que el color elegido exista en la paleta de config.json
 * Entrada: Color elegido por el jugador
 * Salida: El mismo color si es válido
 * Restricciones: Debe ser uno de los colores de config.json
 */
function validarColor(color) {
    if (!config.colores.includes(color)) {
        throw new ErrorPartida('Debes elegir un color válido.')
    }
    return color
}
/*
 * Objetivo: Valida que el anfitrión tenga una sesión activa
 * Entrada: Nickname del anfitrión
 * Salida: Nickname sin espacios al inicio ni al final
 * Restricciones: El nickname debe ser texto no vacío y estar registrado como conectado
 */
function validarAnfitrion(anfitrion) {
    if (typeof anfitrion !== 'string' || !anfitrion.trim()) {
        throw new ErrorPartida('Debes indicar el nickname del anfitrión.')
    }
    if (!existeJugador(anfitrion)) {
        throw new ErrorPartida('El anfitrión no tiene una sesión activa.', 401) // usuario no autenticado.
    }
    return anfitrion.trim()
}

/*
 * Objetivo: Genera un codigo único para cada partida
 * Entrada: No recibe parámetros
 * Salida: Un codigo numérico único en formato texto
 * Restricciones: El código generado no puede estar asociado a otra partida activa
 */
function generarCodigo() {
    for (let intento = 0; intento < CODIGOS_POR_GENERAR; intento += 1) { //Permite htas 100 intentos para evitar ciclos infinitos
        const codigo = String(randomInt(100000, 1000000)) // Genera un codigo aleatorio de 6 digitos para cada partida
        if (!buscarEnMemoria(codigo)) {
            return codigo
        }
    }
    throw new ErrorPartida('No se pudo generar un código único. Intenta de nuevo.', 503) // El servicio no puede completar la solicitud temporalmente.
}

/*
 * Objetivo: Programa que se elimine automaticamante una partida después de un tiempo límite
 * Entrada: El codigo de la partida
 * Salida: No retorna ningún valor
 * Restricciones: La partida se va a eliminar automáticamente si permanece activa en el tiempo de expiración definido
 */
function programarExpiracion(codigo) {
    const temporizador = setTimeout(() => { // Temporizador de 3 minutos si pasa ese tiempo se elimina la partida automaticamente
        codigosTemporizados.delete(codigo)
        eliminarDeMemoria(codigo)
    }, TIEMPO_EXPIRACION_MS)

    if (typeof temporizador.unref === 'function') { // Hace que Node.js pueda terminar la ejecución auqnue el temporizador este activo
        temporizador.unref()
    }
    codigosTemporizados.set(codigo, temporizador)
}
/*
 * Objetivo: Cancelar la expiración automática de una partida
 * Entrada: Código de la partida
 * Salida: No retorna ningún valor
 * Restricciones: Se usa cuando la partida arranca o cuando el anfitrión la elimina
 */
function cancelarExpiracion(codigo) {
    const temporizador = codigosTemporizados.get(codigo)
    if (temporizador) {
        clearTimeout(temporizador)
        codigosTemporizados.delete(codigo)
    }
}

/*
 * Objetivo: Crea y guarda una partida con la configuración del anfitrión
 * Entrada: Objeto con nickname, nombre y configuración de la partida
 * Salida: Objeto completo con el código único y los datos de la partida creada
 * Restricciones: El anfitrión debe estar conectado y la configuración debe ser válida
 */
function crearPartida(configuracion) {
    const anfitrion = validarAnfitrion(configuracion.anfitrion)
    const nombrePartida = validarNombre(configuracion.nombrePartida)
    const { cantidadJugadores, tipoJuego, tematica } = validarConfiguracion(configuracion)
    const { duracionSegundos, longitudObjetivo } = validarValorModo(tipoJuego, configuracion.valorModo)
    const color = validarColor(configuracion.color)
    const codigo = generarCodigo()

    const partida = new Partida({
        codigo,
        nombrePartida,
        cantidadJugadores,
        tipoJuego,
        duracionSegundos,
        longitudObjetivo,
        tematica,
    }, new Jugador(anfitrion, color))

    if (!guardarPartida(partida)) {
        throw new ErrorPartida('El código generado ya está en uso. Intenta de nuevo.', 503)
    }

    programarExpiracion(codigo)
    return buscarEnMemoria(codigo)
}

/*
 * Objetivo: Buscar una partida por su código
 * Entrada: Código de la partida
 * Salida: Partida encontrada o null si no existe
 * Restricciones: Solo busca partidas activas almacenadas en memoria
 */
function obtenerPartida(codigo) {
    return buscarEnMemoria(codigo)
}

/*
 * Objetivo: Obtener todas las partidas activas
 * Entrada: No recibe parámetros
 * Salida: Arreglo con las partidas almacenadas
 * Restricciones: Solo incluye partidas que no han sido eliminadas ni expirado
 */
function listarPartidas() {
    return obtenerPartidas().filter((partida) => partida.estado === 'esperando') //se cambio porque solo se quieren mostrar las partidas que estan en espera y no las que ya comenzaron
}

/*
 * Objetivo: Verificar que el solicitante sea el anfitrión de la partida
 * Entrada: Partida encontrada y nickname que realiza la operación
 * Salida: No retorna un valor si el anfitrión coincide
 * Restricciones: Nicknames se comparan sin distinguir mayúsculas y minúsculas
 */
function verificarAnfitrion(partida, anfitrion) {
    const nombre = validarAnfitrion(anfitrion)
    if (nombre.toLowerCase() !== partida.anfitrion.toLowerCase()) {
        throw new ErrorPartida('Solo el anfitrión puede modificar esta partida.', 403) // El usuario está autenticado pero no tiene permisos.
    }
}

/*
 * Objetivo: Modificar la configuración de una partida
 * Entrada: Código, nickname del anfitrión y campos que se desean cambiar
 * Salida: Partida con la configuración actualizada
 * Restricciones: Solo el anfitrión puede cambiarla mientras está en espera; el cupo no puede quedar por debajo de los jugadores actuales
 */
//esta función permite que el anfitrión cambie la configuración de la partida.
function modificarConfiguracion(codigo, anfitrion, datos) {
    const partida = buscarEnMemoria(codigo)
    if (!partida) {
        throw new ErrorPartida('No se encontró la partida.', 404) // No se encontró el recurso solicitado
    }
    verificarAnfitrion(partida, anfitrion)
    if (partida.estado !== 'esperando') {
        throw new ErrorPartida('Solo se puede modificar una partida en espera.', 409) // Existe un conflicto con el estado actual del sistema
    }

    const cambios = {}
    if (Object.hasOwn(datos, 'nombrePartida')) {
        cambios.nombrePartida = validarNombre(datos.nombrePartida)
    }

    const configuracionIncluyeModo =
        Object.hasOwn(datos, 'cantidadJugadores') ||
        Object.hasOwn(datos, 'tipoJuego') ||
        Object.hasOwn(datos, 'tematica')
    if (configuracionIncluyeModo) {
        const validada = validarConfiguracion({
            cantidadJugadores: Object.hasOwn(datos, 'cantidadJugadores')
                ? datos.cantidadJugadores
                : partida.cantidadJugadores,
            tipoJuego: Object.hasOwn(datos, 'tipoJuego') ? datos.tipoJuego : partida.tipoJuego,
            tematica: Object.hasOwn(datos, 'tematica') ? datos.tematica : partida.tematica,
        })
        if (validada.cantidadJugadores < partida.jugadores.length) { // No se puede reducir la cantidad maxima de jugadores, por debajo del la cantidad que esta conectada
            throw new ErrorPartida('No puedes reducir el máximo por debajo de los jugadores actuales.')
        }
        Object.assign(cambios, validada)
    }

    // Si cambia el modo, también debe venir su valor (minutos o largo)
    if (Object.hasOwn(datos, 'tipoJuego') || Object.hasOwn(datos, 'valorModo')) {
        const tipoJuego = Object.hasOwn(datos, 'tipoJuego') ? datos.tipoJuego : partida.tipoJuego
        Object.assign(cambios, validarValorModo(tipoJuego, datos.valorModo))
    }

    if (Object.keys(cambios).length === 0) {
        throw new ErrorPartida('Debes enviar al menos una opción para modificar.')
    }

    return actualizarEnMemoria(codigo, cambios)
}
/*
 * Objetivo: Eliminar una partida y cancelar su temporizador pendiente
 * Entrada: Código de la partida y nickname del anfitrión
 * Salida: true cuando la partida fue eliminada
 * Restricciones: Solo el anfitrión puede eliminarla antes de su expiración automática
 */
function eliminarPartida(codigo, anfitrion) {
    const partida = buscarEnMemoria(codigo)
    if (!partida) {
        throw new ErrorPartida('No se encontró la partida.', 404) // No se encontró el recurso solicitado.
    }
    verificarAnfitrion(partida, anfitrion)
    cancelarExpiracion(partida.codigo)

    eliminarDeMemoria(partida.codigo)
    return true
}
/*
 * Objetivo: Agregar un jugador a una partida en espera con el color que eligió
 * Entrada: Código de la partida, nickname del jugador y color elegido
 * Salida: Partida actualizada con el nuevo jugador
 * Restricciones:
        - La partida debe existir, estar en espera y tener cupo
        - El color debe ser válido y no estar ocupado por otro jugador
        - Si el jugador ya estaba en la partida, se devuelve la partida sin cambios
 */
function unirsePartida(codigo, nickname, color) {
    if (typeof nickname !== 'string' || !nickname.trim()) {
        throw new ErrorPartida('Debes indicar tu nickname.')
    }
    const partida = buscarEnMemoria(codigo)
    if (!partida) {
        throw new ErrorPartida('No se encontró la partida.', 404)
    }
    if (partida.buscarJugador(nickname)) {
        return partida
    }
    if (partida.estado !== 'esperando') {
        throw new ErrorPartida('La partida ya comenzó.', 409)
    }
    if (partida.estaLlena()) {
        throw new ErrorPartida('La partida ya está llena.', 409)
    }
    if (partida.colorOcupado(validarColor(color))) {
        throw new ErrorPartida('Ese color ya lo eligió otro jugador.', 409)
    }

    partida.agregarJugador(new Jugador(nickname.trim(), color))
    return actualizarEnMemoria(codigo, { jugadores: partida.jugadores })
}

/*
 * Objetivo: Sacar a un jugador de una partida que todavía está en espera
 * Entrada: Código de la partida y nickname del jugador
 * Salida: Partida actualizada, o null si la partida se canceló o no había nada que cambiar
 * Restricciones:
        - Solo aplica a partidas en espera
        - Si sale el anfitrión, la partida se cancela para todos
 */
function salirDePartida(codigo, nickname) {
    const partida = buscarEnMemoria(codigo)
    if (!partida || partida.estado !== 'esperando' || !partida.buscarJugador(nickname)) {
        return null
    }

    if (partida.esAnfitrion(nickname)) {
        cancelarExpiracion(partida.codigo)
        eliminarDeMemoria(partida.codigo)
        return null
    }

    partida.quitarJugador(nickname)
    return actualizarEnMemoria(codigo, { jugadores: partida.jugadores })
}

/*
 * Objetivo: Sacar a un jugador de todas las partidas en espera donde esté
 * Entrada: Nickname del jugador
 * Salida: No retorna ningún valor
 * Restricciones: Se usa cuando el jugador cierra la pestaña o pierde la conexión
 */
function salirDeTodasLasPartidas(nickname) {
    listarPartidas()
        .filter((partida) => partida.buscarJugador(nickname))
        .forEach((partida) => salirDePartida(partida.codigo, nickname))
}
module.exports = {
    ErrorPartida,
    cancelarExpiracion,
    crearPartida,
    eliminarPartida,
    listarPartidas,
    modificarConfiguracion,
    obtenerPartida,
    salirDePartida,
    salirDeTodasLasPartidas,
    unirsePartida,
}