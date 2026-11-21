import { useState } from 'react'
import Autenticacion from './pages/Autenticacion'
import CrearPartida from './pages/CrearPartida'
import Inicio from './pages/Inicio'
import SalaEspera from './pages/SalaEspera'
import './styles.css'

function App() {
  const [jugador, setJugador] = useState('')
  const [pantalla, setPantalla] = useState('inicio')
  const [partida, setPartida] = useState(null)

  if (!jugador) {
    return <Autenticacion onIngresar={setJugador} />
  }

  if (pantalla === 'crear') {
    return (
      <CrearPartida
        onVolver={() => setPantalla('inicio')}
        onCrearPartida={(configuracion) => {
          const codigo = String(Math.floor(100000 + Math.random() * 900000))
          setPartida({ ...configuracion, codigo })
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
