// Recibe la petición del nickname del frontend
const {
    autenticarNickname: autenticar,
    desconectarNickname,
} = require('../services/servicesAutenticacion')

/*
* Objetivo: Validar que el nickname ingresado sea válido y que no este usando por otro jugador conectado.
* Entrada: Nickname del juegador
* Salida: Si el nickname es aceptado, invalido o si esta en uso
* Restricción: El nickname no puede estar vacio
*/
function autenticarNickname(req, res) {
    const resultado = autenticar(req.body && req.body.nickname)

    if (resultado.error) {
        return res.status(400).json({ error: resultado.error })
    }

    if (resultado.conflicto) {
        return res.status(409).json({ error: resultado.conflicto })
    }

    return res.status(201).json({
        mensaje: 'Nickname aceptado.',
        nickname: resultado.nickname,
    })
}

/*
* Objetivo: Elimina aun jugador de la lista de jugados conectados
* Entrada: Nickname del jugador que abandona el juego
* Salida: elimna el jugador o indica que es invalido
* Restricción: El nickname debe existir y contener al menos un carácter valido
*/
function desconectarJugador(req, res) {
    const nickname = req.body && req.body.nickname
    if (typeof nickname !== 'string' || !nickname.trim()) {
        return res.status(400).json({ error: 'Debes ingresar un nickname válido.' })
    }

    desconectarNickname(nickname) // Cuanod se descnecta un juegador el nickname vuelve a estar disponible
    return res.status(204).end()
}

module.exports = {
    autenticarNickname,
    desconectarJugador,
}