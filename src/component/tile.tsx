import React, { memo } from 'react'

const TileComponent = ({
  value,
}: {
  value: number,
}) => {
  return (
    <div
      className={`w-8 h-8 text-xs relative group flex justify-center items-center bg-neutral-800 rounded-md cursor-pointer`}>
        {
          value === 0 && <div className='w-full h-full rounded-md bg-neonCyan'/>
        }
        {
          value === -1 && <div className='w-full h-full rounded-md bg-neonPink'/>
        }
        {
          value === 1 && <div className='w-full h-full rounded-md bg-neutral-900'/>
        }
    </div>
  )
}

export const Tile = memo(TileComponent)