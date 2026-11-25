import { useEffect, useState } from 'react'
import { iniciarPartida } from '../services/partidas'
import { entrarSala, salirSala, salirPartida, socket } from '../services/socket'

/*
* Objetivo: Mostrar la sala de espera de una partida con sus cambios en tiempo real
 * Entrada: Nickname del jugador, partida inicial y función para volver al inicio
 * Salida: Pantalla con los jugadores, el estado de la partida y el botón de iniciar
 * Restricciones: Solo el anfitrión puede iniciar; si la partida se elimina se muestra un aviso
*/
function SalaEspera({ jugador, partida: partidaInicial, onVolver }) {
    const [partida, setPartida] = useState(partidaInicial)
    const [cancelada, setCancelada] = useState(false)
    const [error, setError] = useState('')
    const [iniciando, setIniciando] = useState(false)
    const esAnfitrion = jugador.toLowerCase() === partida.anfitrion.toLowerCase()
    const jugadores = partida.jugadores || []
    const espaciosLibres = Math.max(partida.cantidadJugadores - jugadores.length, 0)

    useEffect(() => {
        const codigo = partidaInicial.codigo
        /*
         * Objetivo: Guardar la versión más reciente de la partida
         * Entrada: Partida enviada por el servidor
         * Salida: No retorna valor; actualiza el estado
         * Restricciones: Solo acepta cambios de la partida de esta sala
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
         * Restricciones: Solo reacciona si el código es el de esta sala
         */
        function manejarEliminacion(codigoEliminado) {
            if (codigoEliminado === codigo) {
                setCancelada(true)
            }
        }

        socket.on('partidaActualizada', manejarActualizacion)
        socket.on('partidaEliminada', manejarEliminacion)
        entrarSala(codigo)
            .then(setPartida)
            .catch(() => setCancelada(true))

        // Al salir de la pantalla se dejan de escuchar los cambios
        return () => {
            socket.off('partidaActualizada', manejarActualizacion)
            socket.off('partidaEliminada', manejarEliminacion)
            salirSala(codigo)
        }
    }, [partidaInicial.codigo])

    /*
     * Objetivo: Pedir al servidor que inicie la partida
     * Entrada: No recibe parámetros
     * Salida: No retorna valor; los cambios llegan por Socket.IO
     * Restricciones: Solo el anfitrión ve el botón y la partida debe estar llena
     */
    async function handleIniciar() {
        setError('')
        setIniciando(true)
        try {
            await iniciarPartida(partida.codigo, jugador)
        } catch (error) {
            setError(error.message || 'No se pudo iniciar la partida.')
        } finally {
            setIniciando(false)
        }
    }
    /*
     * Objetivo: Salir de la partida y volver al inicio
     * Entrada: No recibe parámetros
     * Salida: No retorna valor; cambia a la pantalla de inicio
     * Restricciones: Si sale el anfitrión, la partida se cancela para todos
     */
    function handleSalir() {
        salirPartida(partida.codigo)
        onVolver()
    }

    if (cancelada) {

        return (
            <main className="contenedor">
                <section className="tarjeta tarjeta-sala">
                    <h1>Partida cancelada</h1>
                    <p>La partida ya no existe o fue eliminada por el anfitrión.</p>
                    <button className="boton-volver" type="button" onClick={onVolver}>
                        Volver al inicio
                    </button>
                </section>
            </main>
        )
    }
    return (
        <main className="contenedor">
            <section className="tarjeta tarjeta-sala">
                <h1>Sala de espera</h1>
                <h2 className="nombre-partida">{partida.nombrePartida}</h2>

                <div className="codigo-partida">
                    <span>Código de la partida</span>
                    <strong>{partida.codigo}</strong>
                </div>

                <section className="lista-jugadores" aria-labelledby="titulo-jugadores">
                    <h2 id="titulo-jugadores">
                        Jugadores ({jugadores.length}/{partida.cantidadJugadores})
                    </h2>
                    <ul>
                        {jugadores.map((jugadorSala) => (
                            <li key={jugadorSala.nickname}>
                                <span className="jugador-unido">
                                    <span className="punto-color" style={{ backgroundColor: jugadorSala.color }} />
                                    {jugadorSala.nickname}
                                </span>
                                {jugadorSala.nickname.toLowerCase() === partida.anfitrion.toLowerCase() && (
                                    <span className="etiqueta-anfitrion">Anfitrión</span>
                                )}
                            </li>
                        ))}
                        {Array.from({ length: espaciosLibres }, (_, index) => (
                            <li className="espacio-libre" key={index}>
                                Esperando jugador...
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="contador-sala" aria-label="Contador de inicio">
                    {partida.estado === 'cuenta_regresiva' && (
                        <>
                            <p>La partida comenzará en</p>
                            <strong>{partida.cuentaRegresiva}</strong>
                        </>
                    )}
                    {partida.estado === 'esperando' && (
                        <>
                            <p>La partida está esperando jugadores</p>
                            <strong>--:--</strong>
                        </>
                    )}
                    {partida.estado === 'jugando' && (
                        <>
                            <p>Juego en curso</p>
                            <strong>
                                {partida.tipoJuego === 'tiempo'
                                    ? `${partida.tiempoRestante ?? '--'} s`
                                    : `Meta: largo ${partida.longitudObjetivo}`}
                            </strong>
                        </>
                    )}
                    {partida.estado === 'finalizada' && (
                        <>
                            <p>Partida finalizada</p>
                            <strong>{partida.ganador || 'Empate'}</strong>
                        </>
                    )}
                    {error && <span className="error-autenticacion" role="alert">{error}</span>}
                </section>

                {esAnfitrion && partida.estado === 'esperando' && (
                    <button type="button" onClick={handleIniciar} disabled={iniciando}>
                        {iniciando ? 'Iniciando...' : 'Iniciar partida'}
                    </button>
                )}

                <button className="boton-volver" type="button" onClick={handleSalir}>
                    Volver al inicio
                </button>
            </section>
        </main>
    )
}

export default SalaEspera