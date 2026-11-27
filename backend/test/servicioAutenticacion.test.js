const test = require('node:test')
const assert = require('node:assert/strict')
const {
    autenticarNickname,
    desconectarNickname,
} = require('../src/services/servicesAutenticacion')

test('reserva nickname, rechaza duplicados ignorando mayúsculas y lo libera', () => {
    const nickname = `Jugador-${Date.now()}`

    try {
        assert.deepEqual(autenticarNickname(` ${nickname} `), { nickname })
        assert.deepEqual(autenticarNickname(nickname.toLowerCase()), {
            conflicto: 'Este nickname ya está en uso.',
        })
    } finally {
        desconectarNickname(nickname)
    }

    assert.deepEqual(autenticarNickname(nickname), { nickname })
    desconectarNickname(nickname)
})

test('rechaza nicknames vacíos o demasiado largos', () => {
    assert.deepEqual(autenticarNickname('   '), {
        error: 'El nickname debe tener entre 1 y 30 caracteres.',
    })
    assert.deepEqual(autenticarNickname('a'.repeat(31)), {
        error: 'El nickname debe tener entre 1 y 30 caracteres.',
    })
    assert.deepEqual(autenticarNickname(null), {
        error: 'El nickname debe ser texto.',
    })
})
