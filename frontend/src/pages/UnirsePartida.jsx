import { useEffect, useState } from 'react'
import SelectorColor from '../components/SelectorColor'
import {
    dejarDeVerPartidas,
    obtenerColores,
    socket,
    unirsePartida,
    verPartidas,
} from '../services/socket'

/*
 * Objetivo: Convertir el modo de juego de una partida en texto
 * Entrada: Partida con su tipo de juego y su valor
 * Salida: Texto como "Tiempo: 3 min" o "Longitud: largo 10"
 * Restricciones: Ninguna
 */
function textoModo(partida) {
    if (partida.tipoJuego === 'tiempo') {
        return `Tiempo: ${partida.duracionSegundos / 60} min`
    }
    return `Longitud: largo ${partida.longitudObjetivo}`
}

/*
 * Objetivo: Convertir la temática de una partida en texto
 * Entrada: Temática guardada en la partida
 * Salida: Nombre de la temática para mostrar
 * Restricciones: Ninguna
 */
function textoTematica(tematica) {
    return tematica === 'fruit-mix' ? 'Fruit Mix' : 'Clásica'
}

/*
 * Objetivo: Mostrar las partidas en espera y permitir unirse con un color libre
 * Entrada: Función para volver al inicio y función que recibe la partida a la que se unió
 * Salida: Pantalla con la lista de partidas en vivo y la paleta de colores
 * Restricciones: Solo se puede elegir una partida con cupo y un color que nadie más tenga
 */
function UnirsePartida({ onVolver, onUnido }) {
    const [partidas, setPartidas] = useState([])
    const [colores, setColores] = useState([])
    const [codigoElegido, setCodigoElegido] = useState('')
    const [color, setColor] = useState('')
    const [error, setError] = useState('')
    const [uniendo, setUniendo] = useState(false)
    const partidaElegida = partidas.find((partida) => partida.codigo === codigoElegido) || null
    const ocupados = partidaElegida ? partidaElegida.jugadores.map((jugador) => jugador.color) : []
    const hayCupo = partidaElegida && partidaElegida.jugadores.length < partidaElegida.cantidadJugadores
    const puedeUnirse = hayCupo && color && !ocupados.includes(color)

    // Al abrir la pantalla se pide la lista y se escuchan sus cambios en vivo
    useEffect(() => {
        socket.on('listaPartidas', setPartidas)
        verPartidas().then(setPartidas)
        obtenerColores().then(setColores)

        return () => {
            socket.off('listaPartidas', setPartidas)
            dejarDeVerPartidas()
        }
    }, [])

    /*
     * Objetivo: Marcar la partida que el jugador quiere elegir
     * Entrada: Código de la partida
     * Salida: No retorna valor; actualiza el estado
     * Restricciones: Al cambiar de partida se borra el color elegido
     */
    function elegirPartida(codigo) {
        setCodigoElegido(codigo)
        setColor('')
        setError('')
    }

    /*
     * Objetivo: Pedir al servidor unirse a la partida elegida
     * Entrada: No recibe parámetros
     * Salida: No retorna valor; si sale bien pasa a la sala de espera
     * Restricciones: Debe haber una partida con cupo y un color libre elegido
     */
    async function handleUnirse() {
        setError('')
        setUniendo(true)
        try {
            const partida = await unirsePartida(codigoElegido, color)
            onUnido(partida)
        } catch (error) {
            setError(error.message || 'No se pudo unir a la partida.')
            setUniendo(false)
        }
    }

    return (
        <main className="contenedor">
            <section className="tarjeta tarjeta-crear">
                <button className="boton-volver" type="button" onClick={onVolver}>
                    Volver
                </button>
                <h1>Unirse a una partida</h1>
                <p>Elige una partida en espera y un color libre.</p>

                {partidas.length === 0 && <p>No hay partidas en espera por ahora.</p>}

                <ul className="lista-partidas">
                    {partidas.map((partida) => {
                        const llena = partida.jugadores.length >= partida.cantidadJugadores
                        const elegida = partida.codigo === codigoElegido
                        return (
                            <li key={partida.codigo}>
                                <button
                                    type="button"
                                    className={elegida ? 'partida-disponible elegida' : 'partida-disponible'}
                                    onClick={() => elegirPartida(partida.codigo)}
                                    disabled={llena}
                                >
                                    <span className="partida-titulo">
                                        <strong>{partida.nombrePartida}</strong>
                                        <span>#{partida.codigo}</span>
                                    </span>
                                    <span>
                                        {textoTematica(partida.tematica)} · {textoModo(partida)} ·{' '}
                                        {llena ? 'Llena' : `${partida.jugadores.length}/${partida.cantidadJugadores} jugadores`}
                                    </span>
                                    <span className="partida-jugadores">
                                        {partida.jugadores.map((jugador) => (
                                            <span className="jugador-unido" key={jugador.nickname}>
                                                <span className="punto-color" style={{ backgroundColor: jugador.color }} />
                                                {jugador.nickname}
                                            </span>
                                        ))}
                                    </span>
                                </button>
                            </li>
                        )
                    })}
                </ul>

                {partidaElegida && (
                    <div className="formulario-partida">
                        <fieldset className="grupo-opciones">
                            <legend>Elige tu color</legend>
                            <SelectorColor
                                colores={colores}
                                ocupados={ocupados}
                                seleccionado={color}
                                onSeleccionar={setColor}
                            />
                        </fieldset>
                        <button type="button" onClick={handleUnirse} disabled={!puedeUnirse || uniendo}>
                            {uniendo ? 'Uniendo...' : 'Unirse'}
                        </button>
                    </div>
                )}
                {error && <p className="error-autenticacion" role="alert">{error}</p>}
            </section>
        </main>
    )
}

export default UnirsePartida