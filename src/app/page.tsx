import SearchBar from './components/SearchBar/SearchBar';
import Logo from './components/Logo/Logo';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#E8E6E6] p-6 relative">
      {/* Login button at the top right */}
      <div className="absolute top-0 right-0 mt-6 mr-6">
        <Link href="/login">
          <button className="bg-[#BE185D] text-white px-4 py-2 rounded-md shadow-sm hover:bg-opacity-90 hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold">
            Entrar
          </button>
        </Link>
      </div>

      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <Logo width={200} />
        <SearchBar />
      </div>
    </main>
  );
}
