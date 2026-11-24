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