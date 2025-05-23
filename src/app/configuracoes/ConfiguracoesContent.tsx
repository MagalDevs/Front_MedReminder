'use client';

import { useState, useEffect } from 'react';

type Usuario = {
  nome: string;
  email: string;
  id: string;
};

export default function ConfiguracoesContent() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  useEffect(() => {
    // Simular busca de dados do usuário atual
    // No ambiente real isso seria uma chamada de API
    setTimeout(() => {
      const usuarioMock = {
        nome: '',
        email: '',
        id: 'usr123',
      };

      setNome(usuarioMock.nome);
      setEmail(usuarioMock.email);
      setUsuario(usuarioMock);
      setLoading(false);
    }, 800);
  }, []);
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      // Simulação de atualização de perfil
      // Em produção isso seria uma chamada API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Atualizar os dados do usuário em memória para simular sucesso
      if (usuario) {
        // Verificar qual campo foi atualizado com base no form target
        const form = e.target as HTMLFormElement;
        const formId = form.id;

        if (formId === 'nome-form') {
          setUsuario({
            ...usuario,
            nome,
          });
          setMessage('Nome atualizado com sucesso!');
        } else if (formId === 'email-form') {
          setUsuario({
            ...usuario,
            email,
          });
          setMessage('E-mail atualizado com sucesso!');
        } else {
          // Se não houver ID específico, atualizamos ambos (compatibilidade)
          setUsuario({
            ...usuario,
            nome,
            email,
          });
          setMessage('Perfil atualizado com sucesso!');
        }
      }

      setMessageType('success');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage('Erro ao atualizar dados. Tente novamente.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (novaSenha !== confirmarSenha) {
      setMessage('As senhas não coincidem.');
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      // Simulação de atualização de senha
      // Em produção isso seria uma chamada API para validar a senha atual e alterar para a nova
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Limpar campos após atualização
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');

      setMessage('Senha atualizada com sucesso!');
      setMessageType('success');
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      setMessage(
        'Erro ao atualizar senha. Verifique se a senha atual está correta.',
      );
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !usuario) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded w-full mb-6"></div>
          <div className="h-32 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#037F8C] KantumruySemiBold mb-2">
          Configurações
        </h1>
        <p className="text-gray-600 KantumruyRegular">
          Gerencie suas informações pessoais
        </p>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 rounded-md ${
            messageType === 'success'
              ? 'bg-green-100 text-green-700'
              : messageType === 'error'
              ? 'bg-red-100 text-red-700'
              : ''
          }`}
        >
          {message}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Formulário para alteração de nome */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {' '}
          <h2 className="text-xl font-semibold text-[#037F8C] mb-4 KantumruySemiBold">
            Alterar Nome
          </h2>
          <form
            id="nome-form"
            onSubmit={handleUpdateProfile}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>{' '}
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu novo nome"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#BE185D] text-white py-2 px-4 rounded-md hover:bg-opacity-90 hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Atualizando...' : 'Atualizar Nome'}
              </button>
            </div>
          </form>
        </div>

        {/* Formulário para alteração de email */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {' '}
          <h2 className="text-xl font-semibold text-[#037F8C] mb-4 KantumruySemiBold">
            Alterar E-mail
          </h2>
          <form
            id="email-form"
            onSubmit={handleUpdateProfile}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>{' '}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu novo e-mail"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#BE185D] text-white py-2 px-4 rounded-md hover:bg-opacity-90 hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Atualizando...' : 'Atualizar E-mail'}
              </button>
            </div>
          </form>
        </div>

        {/* Formulário para alteração de senha */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-[#037F8C] mb-4 KantumruySemiBold">
            Alterar Senha
          </h2>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha Atual
              </label>
              <input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#BE185D] text-white py-2 px-4 rounded-md hover:bg-opacity-90 hover:scale-105 hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
