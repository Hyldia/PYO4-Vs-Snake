/*
 * Objetivo: Dibujar el tablero del juego con las serpientes, la comida y el veneno
 * Entrada: Tamaño del tablero y listas de serpientes, comida y venenos
 * Salida: Cuadrícula de tamaño x tamaño celdas
 * Restricciones:
 *      - Las posiciones son {x, y} y empiezan en 0 desde la esquina de arriba a la izquierda
 *      - Cada segmento de serpiente trae su propio color
 */
function Tablero({ tamano, serpientes = [], comida = [], venenos = [] }) {
    // Se guarda qué hay en cada celda ocupada, con la clave "x,y"
    const ocupadas = new Map()
    comida.forEach((alimento) => {
        ocupadas.set(`${alimento.x},${alimento.y}`, { tipo: 'comida', color: alimento.color })
    })
    venenos.forEach((veneno) => {
        ocupadas.set(`${veneno.x},${veneno.y}`, { tipo: 'veneno' })
    })
    serpientes.forEach((serpiente) => {
        serpiente.segmentos.forEach((segmento, indice) => {
            const tipo = indice === 0 ? 'cabeza' : 'cuerpo'
            ocupadas.set(`${segmento.x},${segmento.y}`, { tipo, color: segmento.color })
        })
    })

    // Se arma la cuadrícula fila por fila
    const celdas = []
    for (let y = 0; y < tamano; y += 1) {
        for (let x = 0; x < tamano; x += 1) {
            const contenido = ocupadas.get(`${x},${y}`)
            celdas.push(
                <div
                    key={`${x},${y}`}
                    className={contenido ? `celda ${contenido.tipo}` : 'celda'}
                    style={contenido?.color ? { backgroundColor: contenido.color } : undefined}
                />,
            )
        }
    }

    return (
        <div
            className="tablero"
            style={{
                gridTemplateColumns: `repeat(${tamano}, 1fr)`,
                gridTemplateRows: `repeat(${tamano}, 1fr)`,
            }}
            aria-label={`Tablero de ${tamano} por ${tamano} celdas`}
        >
            {celdas}
        </div>
    )
}

export default Tablero