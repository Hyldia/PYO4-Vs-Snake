const dns = require('node:dns')
const mongoose = require('mongoose')

/*
 * Objetivo: Conectar el servidor con la base de datos de MongoDB
 * Entrada: Dirección de conexión; por defecto la variable MONGODB_URI del archivo .env
 * Salida: Promesa con true si se conectó; false si no hay dirección o la conexión falló
 * Restricciones: Si no se conecta, el juego sigue funcionando pero no se guardan resultados
 */
async function conectarBaseDatos(uri = process.env.MONGODB_URI) {
    if (!uri) {
        console.warn('No hay MONGODB_URI en el archivo .env: los resultados no se van a guardar.')
        return false
    }
    dns.setServers(['8.8.8.8', '1.1.1.1'])

    try {
        await mongoose.connect(uri)
        console.log('Conectado a la base de datos')
        return true
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error.message)
        return false
    }
}

/*
 * Objetivo: Saber si el servidor tiene conexión con la base de datos
 * Entrada: No recibe parámetros
 * Salida: true si está conectada; false si no
 * Restricciones: Se usa antes de guardar o consultar para no esperar una conexión que no existe
 */
function hayBaseDatos() {
    return mongoose.connection.readyState === 1 // 1 significa conectada
}

module.exports = {
    conectarBaseDatos,
    hayBaseDatos,
}