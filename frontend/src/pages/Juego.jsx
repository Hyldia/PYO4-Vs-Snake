import { useEffect, useState } from 'react'
import Tablero from '../components/Tablero'
import { cambiarDireccion, entrarSala, iniciarJuego, salirSala, socket } from '../services/socket'

// Tecla del navegador y la dirección que entiende la clase Serpiente del servidor
const DIRECCIONES = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
}

/*
 * Objetivo: Describir en texto el momento en que está la partida
 * Entrada: Partida actual
 * Salida: Texto para el panel del juego
 * Restricciones: Ninguna
 */
function textoEstado(partida) {
    if (partida.estado === 'en_tablero') {
        return 'Esperando que alguien presione la tecla U'
    }
    if (partida.estado === 'cuenta_regresiva') {
        return `Comienza en ${partida.cuentaRegresiva}...`
    }
    if (partida.estado === 'jugando') {
        return partida.tipoJuego === 'tiempo'
            ? `Tiempo restante: ${partida.tiempoRestante ?? '--'} s`
            : `Meta: largo ${partida.longitudObjetivo}`
    }
    return 'Partida finalizada'
}

/*
 * Objetivo: Mostrar el tablero de la partida y recibir las teclas del jugador
 * Entrada: Nickname del jugador, partida en la que entró y función para volver al inicio
 * Salida: Pantalla con el tablero, los jugadores con su color y el estado de la partida
 * Restricciones:
 *      - La tecla "u" solo arranca la cuenta cuando todos están en el tablero
 *      - Las flechas solo se envían mientras se está jugando
 */
function Juego({ jugador, partida: partidaInicial, onVolver }) {
    const [partida, setPartida] = useState(partidaInicial)
    const [estadoJuego, setEstadoJuego] = useState(null)
    const [cancelada, setCancelada] = useState(false)
    const [error, setError] = useState('')
    const tamano = 11 * partida.cantidadJugadores 

    // Al abrir la pantalla se entra a la sala de la partida para recibir sus cambios
    useEffect(() => {
        const codigo = partidaInicial.codigo

        /*
         * Objetivo: Guardar la versión más reciente de la partida
         * Entrada: Partida enviada por el servidor
         * Salida: No retorna valor; actualiza el estado
         * Restricciones: Solo acepta cambios de esta partida
         */
        function manejarActualizacion(partidaActualizada) {
            if (partidaActualizada.codigo === codigo) {
                setPartida(partidaActualizada)
            }
        }

        /*
         * Objetivo: Mostrar el aviso cuando la partida deja de existir
         * Entrada: Código de la partida eliminada
         * Salida: No retorna valor; marca la partida como cancelada
         * Restricciones: Solo reacciona si el código es el de esta partida
         */
        function manejarEliminacion(codigoEliminado) {
            if (codigoEliminado === codigo) {
                setCancelada(true)
            }
        }

        /*
         * Objetivo: Guardar las serpientes, la comida y el veneno que manda el motor del juego
         * Entrada: Estado del juego enviado por el servidor en cada movimiento
         * Salida: No retorna valor; actualiza el tablero
         * Restricciones: Solo acepta el estado de esta partida
         */
        function manejarEstadoJuego(estado) {
            if (estado.codigo === codigo) {
                setEstadoJuego(estado)
            }
        }

        socket.on('partidaActualizada', manejarActualizacion)
        socket.on('partidaEliminada', manejarEliminacion)
        socket.on('estadoJuego', manejarEstadoJuego)
        entrarSala(codigo)
            .then(setPartida)
            .catch(() => setCancelada(true))

        // Al salir de la pantalla se dejan de escuchar los cambios
        return () => {
            socket.off('partidaActualizada', manejarActualizacion)
            socket.off('partidaEliminada', manejarEliminacion)
            socket.off('estadoJuego', manejarEstadoJuego)
            salirSala(codigo)
        }
    }, [partidaInicial.codigo])
    useEffect(() => {
        /*
         * Objetivo: Reaccionar a las teclas que presiona el jugador
         * Entrada: Evento del teclado
         * Salida: No retorna valor; avisa al servidor
         * Restricciones: Las demás teclas se ignoran
         */
        function manejarTecla(event) {
            if (event.key === 'u' || event.key === 'U') {
                if (partida.estado === 'en_tablero') {
                    iniciarJuego(partida.codigo).catch((errorInicio) => setError(errorInicio.message))
                }
                return
            }

            const direccion = DIRECCIONES[event.key]
            if (direccion) {
                event.preventDefault() // Evita que la página se desplace con las flechas
                if (partida.estado === 'jugando') {
                    cambiarDireccion(partida.codigo, direccion)
                }
            }
        }

        window.addEventListener('keydown', manejarTecla)
        return () => window.removeEventListener('keydown', manejarTecla)
    }, [partida.codigo, partida.estado])

    // Aviso que se muestra si la partida expiró antes de presionar "u"
    if (cancelada) {
        return (
            <main className="contenedor">
                <section className="tarjeta tarjeta-sala">
                    <h1>Partida cancelada</h1>
                    <p>La partida se canceló porque no se inició a tiempo.</p>
                    <button className="boton-volver" type="button" onClick={onVolver}>
                        Volver al inicio
                    </button>
                </section>
            </main>
        )
    }

    return (
        <main className="pantalla-juego">
            <section className="zona-tablero">
                <Tablero
                    tamano={tamano}
                    serpientes={estadoJuego?.serpientes}
                    comida={estadoJuego?.comida}
                    venenos={estadoJuego?.venenos}
                />

                {partida.estado === 'en_tablero' && (
                    <div className="aviso-tablero">
                        <p>Presiona la tecla <strong>U</strong> para iniciar</p>
                        <span>Después muévete con las flechas</span>
                    </div>
                )}
                {partida.estado === 'cuenta_regresiva' && (
                    <div className="aviso-tablero">
                        <strong className="numero-cuenta">{partida.cuentaRegresiva}</strong>
                    </div>
                )}
                {partida.estado === 'finalizada' && (
                    <div className="aviso-tablero">
                        <p>Partida finalizada</p>
                        <strong>{partida.ganador ? `Ganó ${partida.ganador}` : 'Empate'}</strong>
                    </div>
                )}
            </section>

            <aside className="panel-juego">
                <h1>{partida.nombrePartida}</h1>
                <p className="codigo-juego">Código {partida.codigo}</p>
                <p className="estado-juego">{textoEstado(partida)}</p>

                <h2>Jugadores</h2>
                <ul className="jugadores-juego">
                    {partida.jugadores.map((jugadorPartida) => (
                        <li key={jugadorPartida.nickname}>
                            <span className="punto-color" style={{ backgroundColor: jugadorPartida.color }} />
                            <span style={{ color: jugadorPartida.color }}>{jugadorPartida.nickname}</span>
                            {jugadorPartida.nickname.toLowerCase() === jugador.toLowerCase() && (
                                <span className="etiqueta-tu">(tú)</span>
                            )}
                        </li>
                    ))}
                </ul>

                {error && <p className="error-autenticacion" role="alert">{error}</p>}

                {partida.estado === 'finalizada' && (
                    <button type="button" onClick={onVolver}>
                        Volver al inicio
                    </button>
                )}
            </aside>
        </main>
    )
}

export default Juego