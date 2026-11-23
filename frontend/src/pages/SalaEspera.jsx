import { useEffect, useState } from 'react'
import { iniciarPartida, obtenerPartida } from '../services/partidas'

function SalaEspera({ jugador, partida: partidaInicial, onVolver }) {
    const [partida, setPartida] = useState(partidaInicial)
    const [error, setError] = useState('')
    const [iniciando, setIniciando] = useState(false)
    const esAnfitrion = jugador.toLowerCase() === partida.anfitrion.toLowerCase()
    const jugadores = partida.jugadores || [jugador]
    const espaciosLibres = Math.max(partida.cantidadJugadores - jugadores.length, 0)

    useEffect(() => {
        if (partida.estado === 'finalizada') {
            return undefined
        }

        const intervalo = setInterval(async () => {
            try {
                setPartida(await obtenerPartida(partida.codigo))
            } catch {
                // La partida puede vencer mientras se consulta.
            }
        }, 1000)

        return () => clearInterval(intervalo)
    }, [partida.codigo, partida.estado])

    async function handleIniciar() {
        setError('')
        setIniciando(true)
        try {
            const partidaActualizada = await iniciarPartida(partida.codigo, jugador)
            setPartida(partidaActualizada)
        } catch (error) {
            setError(error.message || 'No se pudo iniciar la partida.')
        } finally {
            setIniciando(false)
        }
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
                        {jugadores.map((nombre, index) => (
                            <li key={`${nombre}-${index}`}>
                                <span>{nombre}</span>
                                {nombre.toLowerCase() === partida.anfitrion.toLowerCase() && (
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
                                    : 'Meta de longitud'}
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

                <button className="boton-volver" type="button" onClick={onVolver}>
                    Volver al inicio
                </button>
            </section>
        </main>
    )
}

export default SalaEspera