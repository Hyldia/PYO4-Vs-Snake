/*
 * Objetivo: Mostrar la paleta de colores para que el jugador elija el suyo
 * Entrada: Lista de colores, colores ocupados, color seleccionado y función para elegir
 * Salida: Botones de colores; los ocupados aparecen bloqueados
 * Restricciones: No se puede elegir un color que ya tiene otro jugador
 */
function SelectorColor({ colores, ocupados = [], seleccionado, onSeleccionar }) {
    return (
        <div className="selector-color">
            {colores.map((color) => {
                const ocupado = ocupados.includes(color)
                return (
                    <button
                        key={color}
                        type="button"
                        className={color === seleccionado ? 'opcion-color seleccionado' : 'opcion-color'}
                        style={{ backgroundColor: color }}
                        disabled={ocupado}
                        onClick={() => onSeleccionar(color)}
                        title={ocupado ? 'Color ocupado' : 'Color disponible'}
                        aria-label={ocupado ? `Color ${color} ocupado` : `Elegir el color ${color}`}
                    />
                )
            })}
        </div>
    )
}

export default SelectorColor