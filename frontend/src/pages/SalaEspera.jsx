function SalaEspera({ jugador, partida, onVolver }) {
    const espaciosLibres = Math.max(partida.jugadores - 1, 0)

    return (
        <main className="contenedor">
            <section className="tarjeta tarjeta-sala">
                <h1>Sala de espera</h1>
                <h2 className="nombre-partida">{partida.nombre}</h2>

                <div className="codigo-partida">
                    <span>Código de la partida</span>
                    <strong>{partida.codigo}</strong>
                </div>

                <section className="lista-jugadores" aria-labelledby="titulo-jugadores">
                    <h2 id="titulo-jugadores">
                        Jugadores ({partida.jugadores - espaciosLibres}/{partida.jugadores})
                    </h2>
                    <ul>
                        <li>
                            <span>{jugador}</span>
                            <span className="etiqueta-anfitrion">Anfitrión</span>
                        </li>
                        {Array.from({ length: espaciosLibres }, (_, index) => (
                            <li className="espacio-libre" key={index}>
                                Esperando jugador...
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="contador-sala" aria-label="Contador de inicio">
                    <p>La partida comenzará en</p>
                    <strong>--:--</strong>
                    <span>El contador aparecerá cuando se conecte la partida.</span>
                </section>

                <button className="boton-volver" type="button" onClick={onVolver}>
                    Volver al inicio
                </button>
            </section>
        </main>
    )
}

export default SalaEspera