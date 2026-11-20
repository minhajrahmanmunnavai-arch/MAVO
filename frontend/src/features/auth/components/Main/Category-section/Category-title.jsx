import React from 'react'

export const CategoryTitle= (props) => {
  return (
    <div className='flex justify-between items-center'>
        <h1 className='text-[1.75rem] font-medium mt-1.25 ' >{props.tile}</h1>
        <a className='font-medium hover:scale-105 decoration-auto active:scale-100' href="/category">{props.button} &#x2192;</a>
    </div>
  )
}
