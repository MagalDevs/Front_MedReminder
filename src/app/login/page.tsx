'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../components/Logo/Logo';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, endWebSession, startWebSession } from '../utils/api';
import { getWebSessionId } from '../utils/session-storage';
import RequestFeedback from '../components/RequestFeedback/RequestFeedback';
import { requestErrorMessage, RequestContractError } from '../utils/request-errors';
import { clearNavigationFeedback, consumeNavigationFeedback, subscribeNavigationFeedback, type NavigationFeedback } from '../utils/navigation-feedback';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<NavigationFeedback | null>(null);
  const noticeRead = useRef(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => {
    pending.current?.abort();
    pending.current = null;
  }, []);
  useEffect(() => {
    const readNotice = () => {
      const next = consumeNavigationFeedback();
      if (next) {
        setNotice(next);
        setError('');
      }
    };
    if (!noticeRead.current) {
      noticeRead.current = true;
      readNotice();
    }
    return subscribeNavigationFeedback(readNotice);
  }, []);
  const router = useRouter();
  const { login, logout } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.current) return;
    const attempt = new AbortController();
    pending.current = attempt;
    const current = () => pending.current === attempt && !attempt.signal.aborted;
    setError('');
    setNotice(null);
    clearNavigationFeedback();
    setIsLoading(true);
    try {
      await startWebSession(
        JSON.stringify({ email: username, senha: password }),
        attempt.signal,
        async (data) => {
          if (!current()) return;
          if (!data || typeof data.access_token !== 'string' || !data.access_token.trim() ||
              (data.session_id !== undefined && data.session_id !== getWebSessionId(data.access_token))) {
            throw new RequestContractError();
          }

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
              signal: AbortSignal.any([attempt.signal, AbortSignal.timeout(15000)]),
              requireAuth: false,
              headers: { Authorization: `Bearer ${data.access_token}` },
            });
            if (!current()) return;

            if (!userData?.data || !userData.data.id) throw new RequestContractError();
            login(data.access_token, userData.data);
            router.push('/');
          } catch (profileError) {
            if (!current()) return;
            if (data.session_id) void endWebSession(data.session_id).catch(() => undefined);
            setError(`Não foi possível carregar seu perfil. Faça o login novamente. ${requestErrorMessage(profileError, 'session') || ''}`.trim());
            logout();
          }
        },
      );
    } catch (err) {
      if (current()) setError(requestErrorMessage(err, 'login') || '');
    } finally {
      if (current()) {
        pending.current = null;
        setIsLoading(false);
      }
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

        {notice === 'registered' && <RequestFeedback kind="success" message="Cadastro concluído! Entre com seu e-mail e senha." />}
        {notice === 'session-expired' && <RequestFeedback message="Sessão expirada. Entre novamente." />}
        {error && <RequestFeedback message={error} />}

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
