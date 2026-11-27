import { useEffect, useState } from 'react'
import { entrarJuego, entrarSala, salirSala, salirPartida, socket } from '../services/socket'

/*
* Objetivo: Mostrar la sala de espera de una partida con sus cambios en tiempo real
 * Entrada: Partida inicial, función para volver al inicio y función para pasar al tablero
 * Salida: Pantalla con los jugadores, sus colores y el botón Entrar
 * Restricciones: Entrar se habilita cuando la partida está llena; si la partida se elimina se muestra un aviso
*/
function SalaEspera({ partida: partidaInicial, onVolver, onEntrar }) {
    const [partida, setPartida] = useState(partidaInicial)
    const [cancelada, setCancelada] = useState(false)
    const [error, setError] = useState('')
    const [entrando, setEntrando] = useState(false)
    const jugadores = partida.jugadores || []
    const espaciosLibres = Math.max(partida.cantidadJugadores - jugadores.length, 0)
    const llena = jugadores.length >= partida.cantidadJugadores

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

    // Cuando alguien presiona Entrar, la partida sale de 'esperando' y a todos se les carga el tablero
    useEffect(() => {
        if (partida.estado !== 'esperando') {
            onEntrar(partida)
        }
    }, [partida, onEntrar])

    /*
     * Objetivo: Pedir al servidor que cargue el tablero para todos los jugadores
     * Entrada: No recibe parámetros
     * Salida: No retorna valor; el cambio de pantalla llega por Socket.IO
     * Restricciones: Solo se puede cuando la partida está llena
     */
    async function handleEntrar() {
        setError('')
        setEntrando(true)
        try {
            await entrarJuego(partida.codigo)
        } catch (error) {
            setError(error.message || 'No se pudo entrar al tablero.')
            setEntrando(false)
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
                    {partida.estado === 'esperando' && (
                        <>
                            <p>{llena ? 'La partida está completa' : 'La partida está esperando jugadores'}</p>
                            <strong>--:--</strong>
                        </>
                    )}
                    {error && <span className="error-autenticacion" role="alert">{error}</span>}
                </section>

                <button type="button" onClick={handleEntrar} disabled={!llena || entrando}>
                    {entrando ? 'Entrando...' : 'Entrar'}
                </button>

                <button className="boton-volver" type="button" onClick={handleSalir}>
                    Volver al inicio
                </button>
            </section>
        </main>
    )
}

export default SalaEspera