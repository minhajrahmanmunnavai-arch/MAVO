import React from 'react'
import './Loading.css'

const Loading = () => {
    return (
        <div className="loading-screen flex items-center justify-center bg-amber-50">

            <div className="loading-card flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-white/4 px-12 py-10 shadow-2xl backdrop-blur-xl">

                {/* Spinner */}
                <div className="loading-spinner-wrap relative flex items-center justify-center">

                    <div className="loading-spinner-glow absolute h-20 w-20 rounded-full bg-white blur-xl"></div>

                    <div className="loading-spinner h-16 w-16 animate-spin rounded-full border-[5px] border-slate-700 border-t-cyan-400 border-r-violet-500"></div>

                </div>

                {/* Loading Text */}
                <div className="text-center">

                    <h2 className="loading-title text-xl font-semibold tracking-wide text-white">
                        Loading...
                    </h2>

                    <p className="loading-description mt-2 text-sm text-slate-400">
                        Please wait while we load the content for you.
                    </p>

                </div>

                {/* Animated Dots */}
                <div className="loading-dots flex gap-2">

                    <span className="loading-dot h-2 w-2 animate-bounce rounded-full bg-cyan-400"></span>

                    <span className="loading-dot h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:150ms]"></span>

                    <span className="loading-dot h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:300ms]"></span>

                </div>

            </div>

        </div>
    );
}

export default Loading