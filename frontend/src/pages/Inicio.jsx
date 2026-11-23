function Inicio({ jugador, onCrearPartida }) {
    return (
        <main className="contenedor">
            <section className="tarjeta inicio">
                <h1>¡Bienvenido, {jugador}!</h1>
                <p>¿Qué quieres hacer?</p>

                <div className="opciones-juego">
                    <article className="opcion-juego">
                        <h2>Crear partida</h2>
                        <p>Inicia una nueva partida y espera a tus amigos.</p>
                        <button type="button" onClick={onCrearPartida}>
                            Crear partida
                        </button>
                    </article>
                    <article className="opcion-juego">
                        <h2>Unirse a una partida</h2>
                        <p>Entra a una partida creada por otro jugador.</p>
                    </article>
                </div>
            </section>
        </main>
    )
}

export default Inicio