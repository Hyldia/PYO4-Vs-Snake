import { useEffect, useState } from 'react'
import Autenticacion from './pages/Autenticacion'
import CrearPartida from './pages/CrearPartida'
import Inicio from './pages/Inicio'
import SalaEspera from './pages/SalaEspera'
import { conectarSocket} from './services/socket'
//import { desconectarNickname } from './services/autenticacion'
import './styles.css'

function App() {
  const [jugador, setJugador] = useState('')
  const [pantalla, setPantalla] = useState('inicio')
  const [partida, setPartida] = useState(null)

  useEffect(() => {
    if (jugador) {
      conectarSocket(jugador)
    }
  }, [jugador])
    if (!jugador) {
      return <Autenticacion onIngresar={setJugador} />
    }

  if (pantalla === 'crear') {
    return (
      <CrearPartida
        jugador={jugador}
        onVolver={() => setPantalla('inicio')}
        onPartidaCreada={(nuevaPartida) => {
          setPartida(nuevaPartida)
          setPantalla('sala')
        }}
      />
    )
  }

  if (pantalla === 'sala') {
    return (
      <SalaEspera
        jugador={jugador}
        partida={partida}
        onVolver={() => setPantalla('inicio')}
      />
    )
  }

  return <Inicio jugador={jugador} onCrearPartida={() => setPantalla('crear')} />
}

export default App
