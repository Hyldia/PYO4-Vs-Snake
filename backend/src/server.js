require('dotenv').config()

const http = require('node:http')
const { Server } = require('socket.io')
const app = require('./app')
const { configurarSockets } = require('./sockets/socketPartidas')
const { conectarBaseDatos } = require('./utils/baseDatos.js')

const port = process.env.PORT || 3000
const servidor = http.createServer(app) // Servidor HTTP que comparten Express y Socket.IO
const io = new Server(servidor, {
    cors: { origin: '*' },
})

configurarSockets(io)
conectarBaseDatos()

servidor.listen(port, () => {
    console.log(`Backend escuchando en http://localhost:${port}`)
})