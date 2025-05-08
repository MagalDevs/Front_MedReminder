'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../components/Logo/Logo';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would implement actual authentication logic
    console.log('Login attempt with:', username, password);
    // For now, just redirect back to home after "login"
    router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#E8E6E6] p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <Logo width={140} />
          </div>
          <h1 className="text-2xl font-bold text-[#037F8C] KantumruySemiBold">
            Entrar
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              E-mail
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-[#BE185D] text-white py-2 px-4 rounded-md hover:bg-opacity-90 hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold"
            >
              Entrar
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/cadastro"
            className="text-[#037F8C] hover:underline hover:text-opacity-80 transition-colors font-medium"
          >
            Cadastre-se
          </Link>
        </div>

        <div className="mt-3 text-center">
          <Link
            href="/"
            className="text-[#037F8C] hover:underline hover:text-opacity-80 text-sm transition-colors"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
