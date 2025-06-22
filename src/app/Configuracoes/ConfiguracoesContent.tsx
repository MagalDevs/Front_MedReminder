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
  cep?: string;
  [key: string]: unknown;
};

export default function ConfiguracoesContent() {
  const { user } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
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
        const userData = await apiRequest<Usuario>('usuario/me', {
          method: 'GET',
        });
        setUsuario(userData);
        setNome(userData.nome || userData.name || '');
        setEmail(userData.email || '');
        setCep((userData.cep as string) || '');

        if (userData.foto && typeof userData.foto === 'string') {
          setFoto(userData.foto);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        if (user) {
          setNome((user.nome as string) || (user.name as string) || '');
          setEmail((user.email as string) || '');
          setCep((user.cep as string) || '');
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

    if (!nome.trim()) {
      setMessage('Nome é obrigatório.');
      setMessageType('error');
      return;
    }

    if (!email.trim()) {
      setMessage('E-mail é obrigatório.');
      setMessageType('error');
      return;
    }
    if (cep.trim()) {
      const cepSemFormatacao = cep.replace(/\D/g, '');
      if (cepSemFormatacao.length !== 8) {
        setMessage('CEP deve ter 8 dígitos ou deixe em branco.');
        setMessageType('error');
        return;
      }
    }
    if (senhaAtual || novaSenha || confirmarSenha) {
      if (!senhaAtual) {
        setMessage('Senha atual é obrigatória para alterar a senha.');
        setMessageType('error');
        return;
      }
      if (!novaSenha) {
        setMessage('Nova senha é obrigatória.');
        setMessageType('error');
        return;
      }
      if (novaSenha !== confirmarSenha) {
        setMessage('As senhas não coincidem.');
        setMessageType('error');
        return;
      }
      if (novaSenha.length < 8) {
        setMessage('A nova senha deve ter pelo menos 8 caracteres.');
        setMessageType('error');
        return;
      }
    }
    setLoading(true);
    setMessage('');
    try {
      const updateData: { nome: string; email: string; cep?: string } = {
        nome,
        email,
      };
      if (cep.trim()) {
        updateData.cep = cep.replace(/\D/g, '');
      }
      const updatedUser = await apiRequest<Usuario>('usuario/me', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      if (senhaAtual && novaSenha) {
        await apiRequest('usuario/senha', {
          method: 'PATCH',
          body: JSON.stringify({
            senhaAtual,
            novaSenha,
          }),
        });
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
      }
      setUsuario(updatedUser);
      setNome(updatedUser.nome || updatedUser.name || '');
      setEmail(updatedUser.email || '');
      setCep((updatedUser.cep as string) || '');
      setMessage('Dados atualizados com sucesso!');
      setMessageType('success');
    } catch (error) {
      let errorMessage = 'Erro ao atualizar dados. Tente novamente.';
      if (error instanceof Error) {
        if (
          error.message.includes('401') ||
          error.message.includes('atual incorreta')
        ) {
          errorMessage = 'Senha atual incorreta.';
        } else if (error.message.includes('400')) {
          errorMessage =
            'Dados inválidos. Verifique as informações fornecidas.';
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
      if (file.size > 5 * 1024 * 1024) {
        setMessage('A imagem deve ter no máximo 5MB.');
        setMessageType('error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setMessage('Por favor, selecione apenas arquivos de imagem.');
        setMessageType('error');
        return;
      }
      setLoading(true);
      setMessage('');
      try {
        const formData = new FormData();
        formData.append('foto', file);

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
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCep(e.target.value);
    if (formattedValue.length <= 9) {
      setCep(formattedValue);
    }
  };
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
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
      )}{' '}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Formulário unificado para alteração de dados */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#037F8C] mb-4 KantumruySemiBold">
            Alterar Informações Pessoais
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome completo"
                className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
                required
              />
            </div>

            {/* CEP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <input
                type="text"
                value={cep}
                onChange={handleCepChange}
                placeholder="00000-000"
                className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Digite apenas números, a formatação será aplicada
                automaticamente.
              </p>
            </div>

            {/* Divider para seção de senha */}
            <div className="border-t border-gray-200 pt-4 mt-6">
              <h3 className="text-lg font-medium text-[#037F8C] mb-3 KantumruySemiBold">
                Alterar Senha
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Preencha os campos abaixo apenas se desejar alterar sua senha.
              </p>

              {/* Senha Atual */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
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
                  placeholder="Confirme sua nova senha"
                  className="w-full px-3 py-2 border border-[#037F8C] rounded-md bg-white outline-none text-gray-700 KantumruyMedium focus:ring-2 focus:ring-[#037F8C]"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#037F8C] text-white py-3 px-4 rounded-md hover:bg-opacity-90 hover:scale-102 hover:bg-[#044D55] hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Atualizando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>{' '}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#037F8C] mb-6 KantumruySemiBold text-center">
            Alterar foto de perfil
          </h2>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="flex flex-col items-center gap-8 py-8">
              <div className="w-48 h-48 rounded-full border-4 border-[#037F8C] border-opacity-20 overflow-hidden bg-gray-50 flex items-center justify-center shadow-lg">
                {foto ? (
                  <Image
                    src={foto}
                    alt="Foto de perfil atual"
                    className="w-full h-full object-cover"
                    width={192}
                    height={192}
                  />
                ) : (
                  <span className="text-gray-400 text-lg KantumruyMedium">
                    Sem foto
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={openFileSelector}
                disabled={loading}
                className="bg-[#037F8C] text-white py-4 px-8 rounded-lg text-lg hover:bg-opacity-90 hover:scale-105 hover:bg-[#044D55] hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
              >
                {loading ? 'Enviando...' : 'Alterar Foto'}
              </button>
              <p className="text-sm text-gray-500 text-center max-w-xs KantumruyRegular">
                Selecione uma imagem de até 5MB para atualizar sua foto de
                perfil
              </p>
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
