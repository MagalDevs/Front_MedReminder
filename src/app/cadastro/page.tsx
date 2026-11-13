'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../components/Logo/Logo';
import { apiRequest } from '../utils/api';
import { requestErrorMessages, RequestTimeoutError } from '../utils/request-errors';
import { clearNavigationFeedback, publishNavigationFeedback } from '../utils/navigation-feedback';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cuidador, setCuidador] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const pending = useRef<{ active: boolean; controller: AbortController; timer?: ReturnType<typeof setTimeout> } | null>(null);
  const router = useRouter();

  useEffect(() => () => {
    if (pending.current) {
      pending.current.active = false;
      pending.current.controller.abort();
      clearTimeout(pending.current.timer);
      pending.current = null;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.current) return;
    clearNavigationFeedback();
    setErros([]);

    // Validação básica
    if (senha !== confirmarSenha) {
      setErros(['As senhas não coincidem']);
      return;
    }

    // Remover formatação do CPF e CEP
    const cpfSemFormatacao = cpf.replace(/\D/g, '');
    const cepSemFormatacao = cep.replace(/\D/g, '');

    const usuarioParaCadastro = {
      nome,
      dataNasc: dataNascimento,
      cpf: cpfSemFormatacao,
      email,
      cep: cepSemFormatacao,
      cuidador,
      senha,
    };

    const attempt = { active: true, controller: new AbortController(), timer: undefined as ReturnType<typeof setTimeout> | undefined };
    pending.current = attempt;
    setLoading(true);
    const deadline = new Promise<never>((_resolve, reject) => {
      attempt.timer = setTimeout(() => {
        reject(new RequestTimeoutError());
        attempt.controller.abort();
      }, 15_000);
    });
    try {
      await Promise.race([deadline, apiRequest('/usuario', {
        method: 'POST',
        requireAuth: false,
        expectedStatus: 201,
        signal: attempt.controller.signal,
        body: JSON.stringify(usuarioParaCadastro),
      })]);
      if (!attempt.active || pending.current !== attempt) return;
      publishNavigationFeedback('registered');
      router.push('/login');
    } catch (error) {
      if (attempt.active && pending.current === attempt) {
        setErros(requestErrorMessages(error, 'registration'));
      }
    } finally {
      clearTimeout(attempt.timer);
      if (attempt.active && pending.current === attempt) {
        attempt.active = false;
        pending.current = null;
        setLoading(false);
      }
    }
  };

  // Formatação de CPF: 000.000.000-00
  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6)
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
        6,
      )}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
      6,
      9,
    )}-${numbers.slice(9, 11)}`;
  };

  // Formatação de CEP: 00000-000
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCpf(e.target.value);
    if (formattedValue.length <= 14) {
      setCpf(formattedValue);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCep(e.target.value);
    if (formattedValue.length <= 9) {
      setCep(formattedValue);
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

        {erros.length > 0 && (
          <div
            className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
            role="alert"
          >
            <ul className="list-disc pl-5">
              {erros.map((mensagem, index) => <li key={index}>{mensagem}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>{' '}
            <input
              type="text"
              value={nome}
              placeholder="Nome e sobrenome"
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>{' '}
            <input
              type="email"
              value={email}
              placeholder="exemplo@email.com"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF
            </label>{' '}
            <input
              type="text"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CEP
            </label>{' '}
            <input
              type="text"
              value={cep}
              onChange={handleCepChange}
              placeholder="00000-000"
              className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de nascimento
            </label>{' '}
            <input
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>{' '}
            <input
              type="password"
              value={senha}
              placeholder="********"
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar senha
            </label>{' '}
            <input
              type="password"
              value={confirmarSenha}
              placeholder="********"
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="cuidador"
              checked={cuidador}
              onChange={(e) => setCuidador(e.target.checked)}
              className="h-4 w-4 text-[#037F8C] border-gray-300 rounded focus:ring-[#037F8C]"
            />
            <label
              htmlFor="cuidador"
              className="ml-2 block text-sm text-gray-700"
            >
              Sou cuidador
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full bg-[#0B6E71] text-white py-2 px-4 rounded-md hover:bg-opacity-90 hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold"
            >
              {loading ? 'Carregando...' : 'Cadastrar'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <span className="text-gray-600">Já tem uma conta? </span>
          <Link
            href="/login"
            className="text-[#037F8C] hover:underline hover:text-opacity-80 transition-colors font-medium"
          >
            Entre aqui
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
