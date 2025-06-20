'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

type Usuario = {
  nome?: string;
  name?: string;
  email?: string;
  id?: string | number;
  foto?: string;
  [key: string]: unknown;
};

export default function ConfiguracoesContent() {
  const { user } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [foto, setFoto] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Buscar dados do usuário da API
        const userData = await apiRequest<Usuario>('usuario/me', {
          method: 'GET',
        });

        console.log('Dados do usuário carregados:', userData);
        setUsuario(userData);
        setNome(userData.nome || userData.name || '');
        setEmail(userData.email || '');
        // Carregar foto do usuário se disponível
        if (userData.foto && typeof userData.foto === 'string') {
          setFoto(userData.foto);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        // Fallback para dados do contexto se a API falhar
        if (user) {
          setNome((user.nome as string) || (user.name as string) || '');
          setEmail((user.email as string) || '');
          setUsuario(user);
        }

        setMessage(
          'Erro ao carregar dados do usuário. Alguns dados podem estar desatualizados.',
        );
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage('');

    try {
      const form = e.target as HTMLFormElement;
      const formId = form.id;

      let updateData: { nome?: string; email?: string } = {};
      let successMessage = '';

      if (formId === 'nome-form') {
        updateData = { nome };
        successMessage = 'Nome atualizado com sucesso!';
      } else if (formId === 'email-form') {
        updateData = { email };
        successMessage = 'E-mail atualizado com sucesso!';
      } else {
        updateData = { nome, email };
        successMessage = 'Perfil atualizado com sucesso!';
      } // Fazer chamada à API para atualizar o perfil
      const updatedUser = await apiRequest<Usuario>('usuario/me', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      console.log('Perfil atualizado:', updatedUser);

      // Atualizar os dados do usuário localmente
      setUsuario(updatedUser);

      // Se atualizou o nome, também atualizar o campo de nome
      if (updatedUser.nome || updatedUser.name) {
        setNome(
          (updatedUser.nome as string) || (updatedUser.name as string) || '',
        );
      }

      // Se atualizou o email, também atualizar o campo de email
      if (updatedUser.email) {
        setEmail(updatedUser.email as string);
      }

      setMessage(successMessage);
      setMessageType('success');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);

      let errorMessage = 'Erro ao atualizar dados. Tente novamente.';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setMessage(errorMessage);
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

    if (novaSenha.length < 6) {
      setMessage('A nova senha deve ter pelo menos 6 caracteres.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Fazer chamada à API para atualizar a senha
      await apiRequest('usuario/senha', {
        method: 'PUT',
        body: JSON.stringify({
          senhaAtual,
          novaSenha,
        }),
      });

      // Limpar campos após atualização
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');

      setMessage('Senha atualizada com sucesso!');
      setMessageType('success');
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);

      let errorMessage =
        'Erro ao atualizar senha. Verifique se a senha atual está correta.';

      if (error instanceof Error) {
        if (
          error.message.includes('401') ||
          error.message.includes('atual incorreta')
        ) {
          errorMessage = 'Senha atual incorreta.';
        } else if (error.message.includes('400')) {
          errorMessage =
            'Dados inválidos. Verifique se a nova senha atende aos requisitos.';
        } else {
          errorMessage = error.message;
        }
      }

      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };
  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('A imagem deve ter no máximo 5MB.');
        setMessageType('error');
        return;
      }

      // Validar tipo do arquivo
      if (!file.type.startsWith('image/')) {
        setMessage('Por favor, selecione apenas arquivos de imagem.');
        setMessageType('error');
        return;
      }

      setLoading(true);
      setMessage('');

      try {
        // Criar FormData para upload da imagem
        const formData = new FormData();
        formData.append('foto', file);

        // Upload da foto via API
        const response = await fetch(
          'https://medreminder-backend.onrender.com/usuario/foto',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error('Erro ao fazer upload da foto');
        }

        const result = await response.json();
        console.log('Foto atualizada:', result);

        // Atualizar preview da foto
        const reader = new FileReader();
        reader.onload = (e) => {
          setFoto(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        setMessage('Foto atualizada com sucesso!');
        setMessageType('success');
      } catch (error) {
        console.error('Erro ao atualizar foto:', error);

        let errorMessage = 'Erro ao atualizar foto. Tente novamente.';

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        setMessage(errorMessage);
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // Função para limpar mensagens após um tempo
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000); // Limpa a mensagem após 5 segundos

      return () => clearTimeout(timer);
    }
  }, [message]);

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
        <h1 className="text-2xl font-bold text-[#037F8C] KantumruySemiBold mb-2 ml-10">
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
        <div className="bg-white rounded-lg shadow-lg p-6">
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
                className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#037F8C] text-white py-2 px-4 rounded-md hover:bg-opacity-90 hover:scale-102 hover:bg-[#044D55] hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Atualizando...' : 'Atualizar Nome'}
              </button>
            </div>
          </form>
        </div>

        {/* Formulário para alteração de email */}
        <div className="bg-white rounded-lg shadow-lg p-6">
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
                className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#037F8C] text-white py-2 px-4 rounded-md hover:bg-opacity-90 hover:scale-102 hover:bg-[#044D55] hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Atualizando...' : 'Atualizar E-mail'}
              </button>
            </div>
          </form>
        </div>

        {/* Formulário para alteração de senha */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#037F8C] mb-4 KantumruySemiBold">
            Alterar Senha
          </h2>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha Atual
              </label>{' '}
              <input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>{' '}
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nova Senha
              </label>{' '}
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#037F8C] text-white py-2 px-4 rounded-md hover:bg-opacity-90 hover:scale-102 hover:bg-[#044D55] hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </div>
          </form>
        </div>

        {/* Atualizar foto de perfil */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#037F8C] mb-4 KantumruySemiBold">
            Alterar foto de perfil
          </h2>
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 pt-10">
              <div className="w-40 h-40 rounded-full border-2 border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center">
                {foto ? (
                  <Image
                    src={foto}
                    alt="Foto de perfil atual"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">Sem foto</span>
                )}
              </div>{' '}
              <button
                type="button"
                onClick={openFileSelector}
                disabled={loading}
                className="bg-[#037F8C] text-white py-2 px-4 rounded-md hover:bg-opacity-90 hover:scale-102 hover:bg-[#044D55] hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Alterar Foto'}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handlePhotoChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
