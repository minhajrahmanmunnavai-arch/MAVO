import React, { useEffect, useState } from 'react'

export const TimerSection = () => {

    const initialSeconds = (8 * 3600) + (33 * 60) + 59;
    const [totalSecond, setTotalSecond] = useState(initialSeconds)

    useEffect (() => {
        if (totalSecond <= 0) return;

        const timer = setInterval (() => {
            setTotalSecond((prevTime) => prevTime - 1)
        },1000)

        return() => clearInterval(timer)
    }, [totalSecond])

    const hours = Math.floor(totalSecond/3600)
    const minutes = Math.floor((totalSecond%3600) / 60)
    const second = totalSecond % 60

    const formatTime = (time) => String(time).padStart(2, '0')

  return (
    <div className='flash-timer-section flex justify-between gap-10'>
        <h1 className='flash-timer-label text-[17px] font-medium text-black'>Ends In:</h1>
        <div className='flash-timer-values flex justify-between gap-5'>
            <div className='flash-timer-unit'>
                <span className='flash-timer-value bg-black text-white py-1 px-2 rounded'>{formatTime(hours)}</span>
                <span className='flash-timer-separator ml-3 font-bold'>:</span>
            </div>
            <div className='flash-timer-unit'>
                <span className='flash-timer-value bg-black text-white py-1 px-2 rounded'>{formatTime(minutes)}</span>
                <span className='flash-timer-separator ml-3 font-bold'>:</span>
            </div>
            <div className='flash-timer-unit'>
                <span className='flash-timer-value bg-black text-white py-1 px-2 rounded'>{formatTime(second)}</span>
            </div>
        </div>

    </div>
  )
}
