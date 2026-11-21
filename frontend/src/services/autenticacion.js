const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const AUTH_URL = `${API_URL}/api/autenticacion`

export async function autenticarNickname(nickname) {
    const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
    })
    const resultado = await response.json()

    if (!response.ok) {
        throw new Error(resultado.error || 'No se pudo validar el nickname.')
    }

    return resultado.nickname
}

export function desconectarNickname(nickname) {
    const body = new URLSearchParams({ nickname })
    return navigator.sendBeacon(`${AUTH_URL}/salir`, body)
}
