"use client"

import { useState } from "react";

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <aside className="min-h-screen w-60 bg-[#D9D9D9] flex flex-col shadow-md">
            {/* Logo */}
            <div className="pb-5 pt-5 flex justify-center items-center">
                <img src="/assets/LogoDeitada.png" alt="MedReminder Logo" className="w-40 h-auto pr-5"/>
            </div>
            
            {/* Linha divisória */}
            <div className="h-[1px] bg-[#037F8C] w-full"></div>
            
            {/* Menu de navegação */}
            <div className="flex flex-col gap-8 pl-10 pr-5 pt-7 flex-grow">
                <a className="KantumruyMedium text-[#044D55] hover:text-[#E0DDDD] hover:bg-[#037F8C] rounded hover:scale-105 px-1 py-1 transition duration-700 ease-in-out" href="">Meus medicamentos</a>
                <a className="KantumruyMedium text-[#044D55] hover:text-[#E0DDDD] hover:bg-[#037F8C] rounded hover:scale-105 px-1 py-1 transition duration-700 ease-in-out" href="">Lembrete</a>
                <a className="KantumruyMedium text-[#044D55] hover:text-[#E0DDDD] hover:bg-[#037F8C] rounded hover:scale-105 px-1 py-1 transition duration-700 ease-in-out" href="">Histórico</a>
                <a className="KantumruyMedium text-[#044D55] hover:text-[#E0DDDD] hover:bg-[#037F8C] rounded hover:scale-105 px-1 py-1 transition duration-700 ease-in-out" href="">Configuraçõess</a>
            </div>
            
            {/* Seção do usuário */}
            <div className="mt-auto pl-10 pr-5 pb-4">
                <p className="KantumruySemiBold text-[#044D55]">User</p>
            </div>
        </aside>
    )
}