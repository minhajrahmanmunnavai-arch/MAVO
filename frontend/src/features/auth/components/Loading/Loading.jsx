import React from 'react'

const Loading = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-amber-50">

            <div className="flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-white/4 px-12 py-10 shadow-2xl backdrop-blur-xl">

                {/* Spinner */}
                <div className="relative flex items-center justify-center">

                    <div className="absolute h-20 w-20 rounded-full bg-white blur-xl"></div>

                    <div className="h-16 w-16 animate-spin rounded-full border-[5px] border-slate-700 border-t-cyan-400 border-r-violet-500"></div>

                </div>

                {/* Loading Text */}
                <div className="text-center">

                    <h2 className="text-xl font-semibold tracking-wide text-white">
                        Loading...
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Please wait while we load the content for you.
                    </p>

                </div>

                {/* Animated Dots */}
                <div className="flex gap-2">

                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400"></span>

                    <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:150ms]"></span>

                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:300ms]"></span>

                </div>

            </div>

        </div>
    );
}

export default Loading