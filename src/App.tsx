import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

import EuropeMap3D from './components/Map'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <EuropeMap3D />
    </>
  )
}

export default App
