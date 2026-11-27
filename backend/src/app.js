const express = require('express')
const cors = require('cors')
const routeAutenticacion = require('./routes/routeAutenticacion')
const routePartidas = require('./routes/routePartidas')
const routeJuego = require('./routes/routeJuego')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/api/autenticacion', routeAutenticacion)
app.use('/api/partidas', routePartidas)
app.use('/api/juego', routeJuego)

module.exports = app