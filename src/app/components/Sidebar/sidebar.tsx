'use client';

import { useState } from 'react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <aside className="grid grid-rows-[1fr - 2fr - 1fr] max-w-3xs bg-[#D9D9D9]">
        <div className="pb-5 pt-5 justify-center items-center">
          <img
            src="/assets/LogoDeitada.png"
            alt=""
            className="w-50 h-auto pl-10"
          />
        </div>
        <div className="h-[1px] bg-[#037F8C] pl-[0px]"></div>
        <div className="grid grid-rows-5 gap-8 pl-10 pt-7">
          <a className="KantumruyMedium text-[#044D55]" href="">
            Dashboard
          </a>
          <a className="KantumruyMedium text-[#044D55]" href="">
            Meus medicamentos
          </a>
          <a className="KantumruyMedium text-[#044D55]" href="">
            Lembrete
          </a>
          <a className="KantumruyMedium text-[#044D55]" href="">
            Histórico
          </a>
          <a className="KantumruyMedium text-[#044D55]" href="">
            Configuraçõess
          </a>
        </div>
        <div className="pt-50 pl-10 pb-4">
          <p className="KantumruySemiBold text-[#044D55]">User</p>
        </div>
      </aside>
    </>
  );
}
