import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

import EuropeMap3D from './components/Map'
import type { LanguageConfig } from './lang/i18n'
import Navbar from './components/Navbar'

function App({ languageConfig }: { languageConfig: LanguageConfig }) {

  console.log(languageConfig)
  const [count, setCount] = useState(0)

  return (
    <>
      <Navbar languageConfig={languageConfig} />
      <div className="page-section"></div>
      <div className="page-section map-section">
        <h2 className="map-header">Uczniowie ZSTZ w całej Europie!</h2>
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