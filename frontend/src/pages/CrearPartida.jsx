function CrearPartida({ onVolver, onCrearPartida }) {
    function handleSubmit(event) {
        event.preventDefault()
        const datos = new FormData(event.currentTarget)
        const nombre = String(datos.get('nombre')).trim()

        if (!nombre) {
            return
        }

        onCrearPartida({
            nombre,
            jugadores: Number(datos.get('jugadores')),
            modo: datos.get('modo'),
            tematica: datos.get('tematica'),
        })
    }

    return (
        <main className="contenedor">
            <section className="tarjeta tarjeta-crear">
                <button className="boton-volver" type="button" onClick={onVolver}>
                    Volver
                </button>
                <h1>Crear partida</h1>
                <p>Personaliza una partida nueva.</p>

                <form className="formulario-partida" onSubmit={handleSubmit}>
                    <label className="campo-partida">
                        Nombre de la partida
                        <input
                            type="text"
                            name="nombre"
                            placeholder="Ej. Serpientes veloces"
                            maxLength={30}
                            required
                        />
                    </label>

                    <fieldset className="grupo-opciones">
                        <legend>Cantidad de jugadores</legend>
                        <div className="opciones-radio">
                            {[2, 3, 4].map((cantidad) => (
                                <label className="opcion-radio" key={cantidad}>
                                    <input
                                        type="radio"
                                        name="jugadores"
                                        value={cantidad}
                                        defaultChecked={cantidad === 2}
                                    />
                                    <span>{cantidad}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset className="grupo-opciones">
                        <legend>Modo</legend>
                        <div className="opciones-radio">
                            <label className="opcion-radio opcion-texto">
                                <input type="radio" name="modo" value="tiempo" defaultChecked />
                                <span>Tiempo</span>
                            </label>
                            <label className="opcion-radio opcion-texto">
                                <input type="radio" name="modo" value="longitud" />
                                <span>Longitud</span>
                            </label>
                        </div>
                    </fieldset>

                    <fieldset className="grupo-opciones">
                        <legend>Temática</legend>
                        <div className="opciones-radio">
                            <label className="opcion-radio opcion-texto">
                                <input type="radio" name="tematica" value="clasica" defaultChecked />
                                <span>Clásica</span>
                            </label>
                            <label className="opcion-radio opcion-texto">
                                <input type="radio" name="tematica" value="fruit-mix" />
                                <span>Fruit Mix</span>
                            </label>
                        </div>
                    </fieldset>

                    <button type="submit">Crear partida</button>
                </form>
            </section>
        </main>
    )
}

export default CrearPartida