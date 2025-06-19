'use client';

import SearchBar from './components/SearchBar/SearchBar';
import Logo from './components/Logo/Logo';
import Link from 'next/link';
import { User, Settings, LogOut } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function Home() {
  const { isAuthenticated, logout, getUserDisplayName } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Handle hydration mismatch with client/server
  useEffect(() => {
    setMounted(true);
  }, []);
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Get reference to dropdown container
      const dropdownContainer = document.getElementById(
        'user-dropdown-container',
      );

      // Check if click is outside the dropdown container
      if (dropdownContainer && !dropdownContainer.contains(target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Don't render authentication-dependent UI until after client-side hydration
  if (!mounted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#E8E6E6] p-6 relative">
        <div className="w-full max-w-md flex flex-col items-center gap-8">
          <Logo width={200} />
          <div className="h-10 w-full bg-gray-200 animate-pulse rounded-md"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#E8E6E6] p-6 relative">
      {' '}
      {/* Login/User dropdown at the top right */}
      <div className="absolute top-0 right-0 mt-6 mr-6">
        {isAuthenticated ? (
          <div className="relative" id="user-dropdown-container">
            {' '}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              aria-label="User menu"
              className={`bg-[#4A90A4] text-white px-4 py-2 rounded-md shadow-sm hover:bg-opacity-90 transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold flex items-center gap-2 ${
                dropdownOpen
                  ? 'shadow-md ring-2 ring-[#037F8C]/30'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="bg-white text-[#4A90A4] rounded-full p-1">
                <User size={16} />
              </div>
              <span className="hidden sm:inline">
                Olá, {getUserDisplayName()}
              </span>
              <svg
                className={`h-4 w-4 ml-1 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 transform transition-all duration-200 ease-in-out origin-top-right scale-100 opacity-100">
                <Link
                  href="/medicamentos"
                  className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-[#F5F5F5] hover:text-[#037F8C] w-full text-left transition-colors duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span className="KantumruyMedium">Meu painel</span>
                </Link>
                <div className="h-[1px] bg-gray-200 mx-2"></div>
                <Link
                  href="/Configuracoes"
                  className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-[#F5F5F5] hover:text-[#037F8C] w-full text-left transition-colors duration-200"
                >
                  <Settings size={16} />
                  <span className="KantumruyMedium">Configurações</span>
                </Link>
                <div className="h-[1px] bg-gray-200 mx-2"></div>
                <button
                  onClick={logout}
                  className="cursor-pointer flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-[#F5F5F5] hover:text-[#037F8C] w-full text-left transition-colors duration-200"
                >
                  <LogOut size={16} />
                  <span className="KantumruyMedium">Sair</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login">
            <button
              aria-label="Login"
              className="bg-[#4A90A4] text-white px-4 py-2 rounded-md shadow-sm hover:bg-opacity-90 hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold flex items-center gap-2"
            >
              <User size={20} />
              <span className="hidden sm:inline">Entrar</span>
            </button>
          </Link>
        )}
      </div>
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <Logo width={200} />
        <SearchBar />
        <Link
          href={isAuthenticated ? '/medicamentos' : '/login'}
          className="flex items-center gap-2 text-[#037F8C] hover:text-[#025e6a] transition-colors KantumruyMedium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Meu painel
        </Link>
      </div>
    </main>
  );
}
