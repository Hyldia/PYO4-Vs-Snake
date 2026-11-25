import { io } from 'socket.io-client'
import { API_URL } from './autenticacion'

// Una sola conexión para toda la aplicación; se abre cuando el jugador ingresa
export const socket = io(API_URL, { autoConnect: false })

/*
 * Objetivo: Abrir la conexión en tiempo real con el servidor
 * Entrada: Nickname del jugador autenticado
 * Salida: No retorna ningún valor
 * Restricciones: El nickname ya debe estar registrado por la autenticación
 */
export function conectarSocket(nickname) {
    socket.auth = { nickname }
    if (!socket.connected) {
        socket.connect()
    }
}

/*
 * Objetivo: Entrar a la sala de una partida para recibir sus cambios
 * Entrada: Código de la partida
 * Salida: Promesa con la partida actual
 * Restricciones: La partida debe existir en el servidor
 */
export function entrarSala(codigo) {
    return new Promise((resolve, reject) => {
        socket.emit('entrarSala', codigo, (respuesta) => {
            if (respuesta.error) {
                reject(new Error(respuesta.error))
            } else {
                resolve(respuesta.partida)
            }
        })
    })
}

/*
 * Objetivo: Salir de la sala de una partida
 * Entrada: Código de la partida
 * Salida: No retorna ningún valor
 * Restricciones: Después de salir ya no llegan los cambios de esa partida
 */
export function salirSala(codigo) {
    socket.emit('salirSala', codigo)
}
/*
 * Objetivo: Pedir al servidor la paleta de colores de config.json
 * Entrada: No recibe parámetros
 * Salida: Promesa con el arreglo de colores
 * Restricciones: El jugador ya debe haber ingresado su nickname
 */
export function obtenerColores() {
    return new Promise((resolve) => {
        socket.emit('obtenerColores', resolve)
    })
}

/*
 * Objetivo: Empezar a recibir la lista de partidas en espera
 * Entrada: No recibe parámetros
 * Salida: Promesa con la lista actual; los cambios llegan después con el evento 'listaPartidas'
 * Restricciones: Al salir de la pantalla hay que llamar a dejarDeVerPartidas
 */
export function verPartidas() {
    return new Promise((resolve) => {
        socket.emit('verPartidas', resolve)
    })
}

/*
 * Objetivo: Dejar de recibir la lista de partidas en espera
 * Entrada: No recibe parámetros
 * Salida: No retorna ningún valor
 * Restricciones: Ninguna
 */
export function dejarDeVerPartidas() {
    socket.emit('dejarDeVerPartidas')
}

/*
 * Objetivo: Unirse a una partida con el color elegido
 * Entrada: Código de la partida y color
 * Salida: Promesa con la partida actualizada
 * Restricciones: El servidor rechaza si la partida está llena, ya comenzó o el color está ocupado
 */
export function unirsePartida(codigo, color) {
    return new Promise((resolve, reject) => {
        socket.emit('unirsePartida', { codigo, color }, (respuesta) => {
            if (respuesta.error) {
                reject(new Error(respuesta.error))
            } else {
                resolve(respuesta.partida)
            }
        })
    })
}

/*
 * Objetivo: Salir de una partida en espera
 * Entrada: Código de la partida
 * Salida: No retorna ningún valor
 * Restricciones: Si sale el anfitrión, la partida se cancela para todos
 */
export function salirPartida(codigo) {
    socket.emit('salirPartida', codigo)
}