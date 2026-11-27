const {
    ErrorPartida,
    crearPartida: crear,
    eliminarPartida: eliminar,
    listarPartidas: listar,
    modificarConfiguracion,
    obtenerPartida,
} = require('../services/servicesPartidas')

/*
* Objetivo: Generar una respuesta de error para todas las operaciones relacionadas con las partidas
* Entrada:
        - Error generado durante la ejecución de una operación
* Salida: Mensaje de error correspondientes.
* Restricciones: 
        - Solo procesa errores del tipo ErrorPartida.
 */
function responderConError(res, error) {
    if (!(error instanceof ErrorPartida)) {
        throw error
    }

    return res.status(error.statusCode).json({ error: error.message })
}

/*
* Objetivo: Crear una nueva partida usando la información enviada
* Entrada: Datos de configuración de la partida
* Salida: la información de la partida creada
* Restricciones: Los datos deben cumplir las validaciones definidas en el servicio
 */
function crearPartida(req, res) {
    try {
        return res.status(201).json(crear(req.body || {})) // 201 significa que se creo un recurso nuevo
    } catch (error) {
        return responderConError(res, error)
    }
}

/*
* Objetivo: Obtener el listado de todas las partidas disponibles
* Entrada: No requiere parámetros de entrada
* Salida: La lista de partidas registradas
* Restricciones: Solo devuelve partidas activas almacenadas en memoria
 */
function listarPartidas(req, res) {
    return res.status(200).json(listar()) // 200 ssignifica que la operación salio bien
}

/*
* Objetivo: Busca una partida específica por medio del codigo de la partida
* Entrada: Codigo de la partida
* Salida:
        - La información de la partida encontrada
        - Error si la partida no existe
* Restricciones: El codigo debe pertenecer a una partida registrada.
 */
function buscarPartida(req, res) {
    const partida = obtenerPartida(req.params.codigo)
    if (!partida) {
        return res.status(404).json({ error: 'No se encontró la partida.' }) // 404 significa no se encontro lo que se buscaba
    }

    return res.status(200).json(partida) // 200 ssignifica que la operación salio bien
}

/*
* Objetivo: Modifica la configuración de una partida existente
        - Cantidad de juagdores
        - tematica
        - Modo de juego
* Entrada:
        - El codigo de la partida
        - El nickname del anfitrión
        - Los nuevos datos de configuración
* Salida: La información actualizada de la partida
* Restricciones: Solo el anfitrión puede modificar la configuración de la partida
 */
function actualizarPartida(req, res) {
    try {
        return res.status(200).json( // 200 ssignifica que la operación salio bien
            modificarConfiguracion(req.params.codigo, req.body?.anfitrion, req.body || {}),
        )
    } catch (error) {
        return responderConError(res, error)
    }
}

/**
* Objetivo: Elimina una partida existente
* Entrada:
        - El Codigo de la partida
        - El nickname del anfitrión
* Salida: Código 204 cuando la partida es eliminada correctamente
 * Restricciones: Solo el anfitrión tiene permiso para eliminar la partida
 */
function eliminarPartida(req, res) {
    try {
        eliminar(req.params.codigo, req.body?.anfitrion)
        return res.status(204).end() // 204 significa operación exitosa y no hay datos que devolver
    } catch (error) {
        return responderConError(res, error)
    }
}

module.exports = {
    actualizarPartida,
    buscarPartida,
    crearPartida,
    eliminarPartida,
    listarPartidas,
}