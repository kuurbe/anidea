export default function BottomTabs({ active, setActive }) {
  return (
    <div className='w-full h-14 bg-gray-900 text-white flex justify-around items-center'>
      <button
        className={"px-4 py-2 " + (active === 'now' ? 'text-yellow-400 font-bold' : '')}
        onClick={() => setActive('now')}
      >
        Now
      </button>

      <button
        className={"px-4 py-2 " + (active === 'map' ? 'text-yellow-400 font-bold' : '')}
        onClick={() => setActive('map')}
      >
        Map
      </button>
    </div>
  )
}
