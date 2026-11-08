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
      <div className="page-section"></div>
      <div className="page-section">
        <h2>Uczniowie ZSTZ w całej Europie!</h2>
        <EuropeMap3D />
      </div>
      <div className="page-section"></div>
      <div className="page-section"></div>
      <div className="page-section"></div>
      <div className="page-section"></div>
      <div className="page-section"></div>
      <div className="page-section"></div>
      <div className="page-section"></div>
      <div className="page-section"></div>


    </>
  )
}

export default App
