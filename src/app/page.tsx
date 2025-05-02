import SearchBar from './components/SearchBar/SearchBar';
import Logo from './components/Logo/Logo';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#E8E6E6] p-6">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <Logo width={200} />
        <SearchBar />
      </div>
    </main>
  );
}
