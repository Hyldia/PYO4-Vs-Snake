function Tablero({ estado, anchoInicial, altoInicial }) {
    const ancho = Number.isInteger(estado?.tablero?.ancho) && estado.tablero.ancho > 0
        ? estado.tablero.ancho
        : anchoInicial
    const alto = Number.isInteger(estado?.tablero?.alto) && estado.tablero.alto > 0
        ? estado.tablero.alto
        : altoInicial
    const ocupacion = new Map()

    ;(estado?.serpientes || []).forEach((serpiente) => {
        ;(serpiente.segmentos || []).forEach((segmento, indice) => {
            ocupacion.set(`${segmento.x},${segmento.y}`, {
                tipo: indice === 0 ? 'cabeza' : 'segmento',
                color: segmento.color || serpiente.color,
            })
        })
    })

    ;(estado?.comida || estado?.alimentos || []).forEach((alimento) => {
        ocupacion.set(`${alimento.x},${alimento.y}`, {
            tipo: 'comida',
            color: alimento.color || '#FACC15',
        })
    })

    ;(estado?.veneno || []).forEach((veneno) => {
        ocupacion.set(`${veneno.x},${veneno.y}`, { tipo: 'veneno' })
    })

    const celdas = Array.from({ length: ancho * alto }, (_, indice) => {
        const x = indice % ancho
        const y = Math.floor(indice / ancho)
        const elemento = ocupacion.get(`${x},${y}`)

        return (
            <div
                className={`celda-tablero${elemento ? ` celda-${elemento.tipo}` : ''}`}
                key={`${x}-${y}`}
                role="gridcell"
                aria-label={elemento ? `${elemento.tipo} en ${x}, ${y}` : `celda ${x}, ${y}`}
                style={elemento?.color ? { '--color-celda': elemento.color } : undefined}
            >
                {elemento?.tipo === 'comida' && <span aria-hidden="true">●</span>}
                {elemento?.tipo === 'veneno' && <span aria-hidden="true">✹</span>}
            </div>
        )
    })

    return (
        <div className="marco-tablero">
            <div
                className="matriz-tablero"
                role="grid"
                aria-label={`Tablero de ${ancho} por ${alto}`}
                style={{ gridTemplateColumns: `repeat(${ancho}, minmax(0, 1fr))` }}
            >
                {celdas}
            </div>
            {!estado && (
                <div className="aviso-tablero">
                    <strong>Esperando el estado del juego</strong>
                    <span>El servidor todavía no está enviando la posición de las serpientes y los elementos.</span>
                </div>
            )}
        </div>
    )
}

export default Tablero
