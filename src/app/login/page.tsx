'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../components/Logo/Logo';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, logout } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await apiRequest<{
        access_token: string;
        message?: string;
      }>('auth/login', {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify({
          email: username,
          senha: password,
        }),
      });

      if (data.message && !data.access_token) {
        setError(data.message);
        return;
      }

      if (data.access_token) {
        try {
          const userData = await apiRequest<{
            message: string;
            data: {
              id: string | number;
              nome: string;
              email: string;
              cep: string;
              cpf: string;
              cuidador: boolean;
              dataNasc: Date;
              senha: string;
            };
          }>('usuario/me', {
            method: 'GET',
            requireAuth: false,
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          });

          login(data.access_token, userData.data);

          router.push('/');
        } catch (profileError) {
          setError('Não foi possível carregar seu perfil. Faça o login novamente.');
          logout();
        }
      } else {
        setError('Erro no servidor: Token de autenticação não encontrado.');
      }
    } catch (err) {
      if (err instanceof Error) {
        const errorMessage = err.message;
        if (
          errorMessage.includes('401') ||
          errorMessage.toLowerCase().includes('invalid') ||
          errorMessage.toLowerCase().includes('inválido')
        ) {
          setError('E-mail ou senha inválidos');
        } else if (
          errorMessage.includes('404') ||
          errorMessage.includes('not found')
        ) {
          setError(
            'Serviço temporariamente indisponível. Tente novamente mais tarde.',
          );
        } else if (errorMessage.includes('429')) {
          setError(
            'Muitas tentativas. Aguarde um momento antes de tentar novamente.',
          );
        } else if (
          errorMessage.includes('timeout') ||
          errorMessage.includes('timed out')
        ) {
          setError(
            'O servidor está demorando para responder. Verifique sua conexão.',
          );
        } else {
          setError(errorMessage);
        }
      } else if (
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof err.message === 'string'
      ) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro durante o login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#E8E6E6] p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <Logo width={140} />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              E-mail
            </label>{' '}
            <input
              id="username"
              type="email"
              placeholder="Digite seu e-mail"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Senha
            </label>{' '}
            <input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#4A90A4] text-white py-2 px-4 rounded-md hover:bg-opacity-90 hover:bg-[#044D55] hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processando...' : 'Entrar'}
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
