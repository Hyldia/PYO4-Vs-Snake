import Tablero from '../components/Tablero'

function Juego({ partida, onVolver }) {
    const estado = partida.estadoJuego || null
    const serpientes = estado?.serpientes || []
    const anchoInicial = Math.max((partida.jugadores || []).length, 1) * 11
    const altoInicial = anchoInicial

    return (
        <main className="contenedor contenedor-juego">
            <section className="pantalla-juego">
                <header className="encabezado-juego">
                    <div>
                        <span className="etiqueta-seccion">PARTIDA EN CURSO</span>
                        <h1>{partida.nombrePartida}</h1>
                        <p>Código {partida.codigo} · {partida.tematica === 'fruit-mix' ? 'Fruit Mix' : 'Clásica'}</p>
                    </div>
                    <div className="reloj-juego" aria-label="Tiempo restante">
                        <span>{partida.tipoJuego === 'tiempo' ? 'Tiempo restante' : 'Meta'}</span>
                        <strong>
                            {partida.tipoJuego === 'tiempo'
                                ? `${partida.tiempoRestante ?? '--'} s`
                                : `${partida.longitudObjetivo ?? '--'} segmentos`}
                        </strong>
                    </div>
                </header>

                <div className="contenido-juego">
                    <section className="panel-tablero">
                        <div className="titulo-panel">
                            <div>
                                <span className="etiqueta-seccion">CAMPO DE JUEGO</span>
                                <h2>Tablero</h2>
                            </div>
                            <span className="estado-en-vivo"><span /> En vivo</span>
                        </div>
                        <Tablero estado={estado} anchoInicial={anchoInicial} altoInicial={altoInicial} />
                        <div className="leyenda-tablero" aria-label="Leyenda del tablero">
                            <span><i className="leyenda-serpiente" /> Serpientes</span>
                            <span><i className="leyenda-comida" /> Alimento</span>
                            <span><i className="leyenda-veneno">✹</i> Veneno</span>
                        </div>
                    </section>

                    <aside className="panel-estadisticas">
                        <div className="titulo-panel">
                            <div>
                                <span className="etiqueta-seccion">RESUMEN</span>
                                <h2>Jugadores</h2>
                            </div>
                            <span className="contador-jugadores">
                                {partida.jugadores?.length || 0}/{partida.cantidadJugadores}
                            </span>
                        </div>

                        <ul className="estadisticas-jugadores">
                            {(partida.jugadores || []).map((jugador) => {
                                const serpiente = serpientes.find((item) =>
                                    item.nickname?.toLowerCase() === jugador.nickname.toLowerCase())

                                return (
                                    <li key={jugador.nickname}>
                                        <span className="jugador-unido">
                                            <span
                                                className="punto-color"
                                                style={{ backgroundColor: jugador.color }}
                                            />
                                            <strong>{jugador.nickname}</strong>
                                        </span>
                                        <span className="estadistica-jugador">
                                            <span>Largo</span>
                                            <strong>{serpiente?.largo ?? serpiente?.segmentos?.length ?? '--'}</strong>
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>

                        <div className="nota-sincronizacion">
                            Las estadísticas se actualizarán cuando el servidor comparta el estado de la partida.
                        </div>

                        <button className="boton-volver" type="button" onClick={onVolver}>
                            Salir de la partida
                        </button>
                    </aside>
                </div>
            </section>
        </main>
    )
}

export default Juego
