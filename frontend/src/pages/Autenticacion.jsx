import { useState } from 'react'
import { autenticarNickname } from '../services/autenticacion'

function Autenticacion({ onIngresar }) {
    const [nickname, setNickname] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()
        const nombre = nickname.trim()
        if (!nombre) return

        setError('')
        setCargando(true)
        try {
            const jugador = await autenticarNickname(nombre)
            onIngresar(jugador)
        } catch (error) {
            setError(error.message || 'No se pudo conectar con el servidor.')
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="contenedor">
        <div className="tarjeta">
            <h1>VS Snake</h1>

            <p>Bienvenido al campo de batalla</p>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Ingrese un nickname, 1 - 30 caracteres"
                    value={nickname}
                    maxLength={30}
                    onChange={(event) => setNickname(event.target.value)}
                    required
                />
                <button type="submit" disabled={cargando}>
                    {cargando ? 'Verificando...' : 'Ingresar'}
                </button>
                {error && <p className="error-autenticacion" role="alert">{error}</p>}
            </form>
        </div>
        </div>
    );
}

export default Autenticacion;