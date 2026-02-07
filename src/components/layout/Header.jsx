import { useState } from 'react'

function Header() {
  return (
    <header className="h-10 bg-[#106EBE] flex items-center justify-between px-3 shrink-0 text-white z-50">
      <div className="flex items-center space-x-3">
        <span className="material-symbols-outlined text-[20px]">description</span>
        <span className="font-semibold text-sm">Kairos WebScan</span>
        <div className="h-4 w-px bg-white/20 mx-2"></div>
        <div className="flex items-center space-x-1">
          <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
            <span className="material-symbols-outlined text-[18px]">save</span>
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
            <span className="material-symbols-outlined text-[18px]">undo</span>
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
            <span className="material-symbols-outlined text-[18px]">redo</span>
          </button>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-white/10 rounded px-2 py-1 h-7">
          <span className="material-symbols-outlined text-[16px] mr-2">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-xs p-0 w-40 placeholder-white/60"
            placeholder="Search features..."
            type="text"
          />
        </div>
        <div className="w-7 h-7 rounded-full bg-white/20 overflow-hidden border border-white/30">
          <img
            alt="User"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl3E7htN3y7W1dQg533vblGrq_JbzH3MEU6f2LWX2-Gvfw-dFDzNCbxXucuiifw75esq6EjY6QbpA4qVgQOqzHVC6pD6AgRpnpmkmBYO52JuHIcjSQro9yWbH4yejREHxLrVqvgMMfnN7jiqx9MDFlFuC_llAVQwDLbi4wSwf-cK3LCdGfCbHVE4hpiio7sHHkGC59HYdKcS9PltSWguWqd61efj_gaTdwMQE3BSjdinZpdbyoDVbGI4ILSwRvMVvSz-i386qZsZLx"
          />
        </div>
      </div>
    </header>
  )
}

export default Header
