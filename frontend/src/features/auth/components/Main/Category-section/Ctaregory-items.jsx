import React from 'react'
import {useNavigate} from "react-router-dom"

export const CtaregoryItems = (props) => {
  const navigate = useNavigate()

  const categoryHandler = () => {
    navigate("/category");
  };

  return (
    <div onClick={categoryHandler} className="category-card group relative h-75 w-75 overflow-hidden rounded-2xl cursor-pointer">
   
      <img 
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" 
        src={props.img} 
        alt="Watch" 
      />

      <div className="absolute inset-0 bg-black/40 transition-opacity duration-300 group-hover:bg-black/20" />

      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />

      <div className="category-card-content absolute bottom-0 left-0 p-5 text-white z-10">
        <h1 className="category-card-title text-xl font-bold tracking-wide transition-transform duration-300 group-hover:-translate-y-1">
          {props.title}
        </h1>
        <p className="category-card-count text-sm text-gray-300 mt-1 transition-transform duration-300 group-hover:-translate-y-1">
          {props.Artifacts} Artifacts
        </p>
      </div>
    </div>
  )
}