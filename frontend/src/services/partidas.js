import { API_URL } from './autenticacion'

export async function crearPartida(configuracion) {
    const response = await fetch(`${API_URL}/api/partidas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configuracion),
    })
    const resultado = await response.json()

    if (!response.ok) {
        throw new Error(resultado.error || 'No se pudo crear la partida.')
    }

    return resultado
}

export async function obtenerPartida(codigo) {
    const response = await fetch(`${API_URL}/api/partidas/${codigo}`)
    const resultado = await response.json()

    if (!response.ok) {
        throw new Error(resultado.error || 'No se pudo consultar la partida.')
    }

    return resultado
}
