import { useState } from 'react'

function Autenticacion({ onIngresar }) {
    const [nickname, setNickname] = useState('')

    function handleSubmit(event) {
        event.preventDefault()
        const nombre = nickname.trim()
        if (nombre) onIngresar(nombre)
    }

    return (
        <div className="contenedor">
        <div className="tarjeta">
            <h1>VS Snake</h1>

            <p>Bienvenido al campo de batalla</p>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Ingrese su nickname"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    required
                />
                <button type="submit">Ingresar</button>
            </form>
        </div>
        </div>
    );
}

export default Autenticacion;