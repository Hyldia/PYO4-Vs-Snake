const express = require('express')
const cors = require('cors')
const routeAutenticacion = require('./routes/routeAutenticacion')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/api/autenticacion', routeAutenticacion)

module.exports = app