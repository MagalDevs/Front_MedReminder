'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../components/Logo/Logo';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cuidador, setCuidador] = useState(false);
  const [erro, setErro] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    // Validação básica
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem');
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

    console.log('Dados de cadastro para API:', usuarioParaCadastro);

    try {
      const response = await fetch(
        'https://medreminder-backend.onrender.com/usuario',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(usuarioParaCadastro),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        setErro(errorData.message || 'Erro ao cadastrar. Tente novamente.');
        return;
      }

      console.log('Usuário cadastrado com sucesso!');
      router.push('/login');
    } catch (error) {
      console.error('Erro na requisição de cadastro:', error);
      setErro('Erro ao conectar com o servidor. Tente novamente mais tarde.');
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

        {erro && (
          <div
            className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
            role="alert"
          >
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>{' '}
            <input
              type="text"
              value={nome}
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
              Data de Nascimento
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
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha
            </label>{' '}
            <input
              type="password"
              value={confirmarSenha}
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
              Cadastrar como Cuidador
            </label>
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-[#0B6E71] text-white py-2 px-4 rounded-md hover:bg-opacity-90 hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold"
            >
              Cadastrar
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
