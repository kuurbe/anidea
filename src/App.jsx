import React, { useState } from 'react'
import Header from './components/layout/Header'
import BottomTabs from './components/layout/BottomTabs'
import NowView from './components/views/NowView'
import MapView from './components/views/MapView'

export default function App() {
  const [active, setActive] = useState('now')

  return (
    <div className='flex flex-col justify-between w-full h-screen bg-gray-800'>

      <Header />

      <div className='flex-1 overflow-hidden'>
        {active === 'now' && <NowView />}
        {active === 'map' && <MapView />}
      </div>

      <BottomTabs active={active} setActive={setActive} />

    </div>
  )
}
