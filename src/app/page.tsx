import SearchBar from './components/SearchBar/SearchBar';
import Logo from './components/Logo/Logo';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#E8E6E6] p-6 relative">
      {/* Login button at the top right */}
      <div className="absolute top-0 right-0 mt-6 mr-6">
        <Link href="/login">
          <button
            aria-label="Login"
            className="bg-[#BE185D] text-white px-4 py-2 rounded-md shadow-sm hover:bg-opacity-90 hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold"
          >
            Entrar
          </button>
        </Link>
      </div>

      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <Logo width={200} />
        <SearchBar />{' '}
        <Link
          href="/Lembrete"
          className="flex items-center gap-2 text-[#037F8C] hover:text-[#025e6a] transition-colors KantumruyMedium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
            <path
              fillRule="evenodd"
              d="M3 8a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"
              clipRule="evenodd"
            />
            <path d="M3 12a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
          </svg>
          Meu Painel
        </Link>
      </div>
    </main>
  );
}
