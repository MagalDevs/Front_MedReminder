'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, ApiError } from '../utils/api';
import RequestFeedback from '../components/RequestFeedback/RequestFeedback';
import { RequestContractError, requestErrorMessage } from '../utils/request-errors';

function validUser(value: unknown): value is Usuario {
  if (!value || typeof value !== 'object') return false;
  const data = value as Usuario;
  return Boolean(data.id) && (typeof data.id === 'number' || typeof data.id === 'string') && ['nome', 'email', 'cep', 'foto'].every(field => {
    const item = data[field as keyof Usuario];
    return item === undefined || item === null || typeof item === 'string';
  });
}

type Usuario = {
  id?: string | number;
  nome?: string;
  email?: string;
  cpf?: string;
  cuidador?: boolean;
  dataNasc?: Date | string;
  foto?: string;
  cep?: string;
  senha?: string;
};

export default function ConfiguracoesContent() {
  const { user } = useAuth();
  return <ConfiguracoesForm key={String(user?.id ?? user?.email ?? '')} user={user} />;
}

function ConfiguracoesForm({ user }: { user: Usuario | null }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const mutation = useRef<AbortController | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [foto, setFoto] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState('');
  const [photoSaving, setPhotoSaving] = useState(false);
  const photoRequest = useRef<AbortController | null>(null);
  const [readError, setReadError] = useState<{ identity: string; message: string | null } | null>(null);
  const token = typeof window === 'undefined' ? null : localStorage.getItem('access_token');
  const identity = `${user?.id ?? user?.email ?? ''}:${token}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const current = () => active && !controller.signal.aborted && localStorage.getItem('access_token') === token;
    const fetchUserData = async () => {
      setLoading(true);
      setReadError(null);
      setUsuario(null);
      setNome(user?.nome || '');
      setEmail(user?.email || '');
      setCep(user?.cep || '');
      setFoto('');
      try {
        const response = await apiRequest<{
          message: string;
          data: Usuario;
        }>('usuario/me', {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (!current()) return;
        const userData = response?.data;
        if (!validUser(userData)) throw new RequestContractError();

        setUsuario(userData);
        setNome(userData.nome || '');
        setEmail(userData.email || '');
        setCep(userData.cep || '');

        if (userData.foto && typeof userData.foto === 'string') {
          setFoto(userData.foto);
        }
      } catch (error) {
        if (!current()) return;
        if (user) {
          setNome(user.nome || '');
          setEmail(user.email || '');
          setCep(user.cep || '');
          setUsuario(user);
        }
        const detail = requestErrorMessage(error);
        setReadError({ identity, message: detail ? `${detail}${user ? ' Alguns dados podem estar desatualizados.' : ''}` : null });
      } finally {
        if (current()) setLoading(false);
      }
    };

    void fetchUserData();
    return () => { active = false; controller.abort(); };
  }, [user, token, identity]);
  useEffect(() => () => { mutation.current?.abort(); mutation.current = null; }, [identity]);
  useEffect(() => () => { photoRequest.current?.abort(); photoRequest.current = null; }, [identity]);
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mutation.current) return;
    if (!nome.trim()) {
      setProfileError('Nome é obrigatório.');
      return;
    }
    if (!email.trim()) {
      setProfileError('E-mail é obrigatório.');
      return;
    }

    if (cep.trim()) {
      const cepSemFormatacao = cep.replace(/\D/g, '');
      if (cepSemFormatacao.length !== 8) {
        setProfileError('CEP deve ter 8 dígitos ou deixe em branco.');
          return;
      }
    }

    if (senhaAtual || novaSenha || confirmarSenha) {
      if (!senhaAtual) {
        setProfileError('Senha atual é obrigatória para alterar a senha.');
          return;
      }
      if (!novaSenha) {
        setProfileError('Nova senha é obrigatória.');
          return;
      }
      if (novaSenha !== confirmarSenha) {
        setProfileError('As senhas não coincidem.');
          return;
      }
      if (novaSenha.length < 8) {
        setProfileError('A nova senha deve ter pelo menos 8 caracteres.');
          return;
      }
    }
    const controller = new AbortController();
    mutation.current = controller;
    const originalToken = localStorage.getItem('access_token');
    const current = () => !controller.signal.aborted && localStorage.getItem('access_token') === originalToken;
    const changesPassword = Boolean(senhaAtual && novaSenha);
    setLoading(true);
    setProfileError(null);
    if (changesPassword) setPasswordError(null);
    setMessage('');
    try {
      const response = await apiRequest<{ message: string; data: Usuario }>('usuario/me', {
        method: 'PATCH', signal: controller.signal,
        body: JSON.stringify({ nome, email, cep: cep.replace(/\D/g, '').trim() }),
      });
      if (!current()) return;
      const updatedUser = response?.data;
      if (!validUser(updatedUser)) throw new RequestContractError();
      setUsuario(updatedUser);
      setNome(updatedUser.nome || '');
      setEmail(updatedUser.email || '');
      setCep(updatedUser.cep || '');
      if (changesPassword) {
        try {
          await apiRequest('usuario/senha', {
            method: 'PATCH', onUnauthorized: 'throw', signal: controller.signal,
            body: JSON.stringify({ senhaAtual, novaSenha }),
          });
          if (!current()) return;
          setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
        } catch (error) {
          if (!current()) return;
          let detail = requestErrorMessage(error);
          if (error instanceof ApiError && error.status === 401) {
            try {
              const profile = await apiRequest<{ data: Usuario }>('usuario/me', { signal: controller.signal });
              if (!current()) return;
              if (!validUser(profile?.data)) throw new RequestContractError();
              detail = 'Senha atual incorreta. Sua sessão continua válida.';
            } catch (sessionError) {
              if (controller.signal.aborted || (localStorage.getItem('access_token') !== originalToken && localStorage.getItem('access_token') !== null)) return;
              detail = sessionError instanceof ApiError && sessionError.status === 401
                ? 'Sessão expirada. Entre novamente.'
                : 'Não foi possível verificar a sessão. A alteração da senha não foi confirmada.';
            }
          }
          setPasswordError(`Perfil atualizado. Senha não atualizada: ${detail}`);
          return;
        }
      }
      setMessage(changesPassword ? 'Perfil e senha atualizados com sucesso!' : 'Dados atualizados com sucesso!');
      setMessageType('success');
    } catch (error) {
      if (current()) setProfileError(requestErrorMessage(error));
    } finally {
      if (mutation.current === controller) mutation.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  };
  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (photoRequest.current) return;
      setPhotoMessage('');
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError('A imagem deve ter no máximo 5MB.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setPhotoError('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      const controller = new AbortController();
      photoRequest.current = controller;
      const originalToken = localStorage.getItem('access_token');
      const current = () => !controller.signal.aborted && localStorage.getItem('access_token') === originalToken;
      setPhotoSaving(true);
      setPhotoError(null);
      try {
        const formData = new FormData();
        formData.append('foto', file);

        await apiRequest('usuario/foto', { method: 'POST', body: formData, signal: controller.signal });
        if (!current()) return;
        const image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new RequestContractError());
          reader.onerror = () => reject(new RequestContractError());
          reader.readAsDataURL(file);
        });
        if (!current()) return;
        setFoto(image);
        setPhotoMessage('Foto atualizada com sucesso!');
      } catch (error) {
        if (current()) setPhotoError(requestErrorMessage(error));
      } finally {
        if (photoRequest.current === controller) photoRequest.current = null;
        if (current()) setPhotoSaving(false);
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
    if (message && messageType === 'success') {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, messageType]);

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
      {readError?.identity === identity && readError.message && <RequestFeedback context="Ao carregar perfil" message={readError.message} />}
      {profileError && <RequestFeedback context="Ao salvar perfil" message={profileError} />}
      {passwordError && <RequestFeedback context="Ao alterar senha" message={passwordError} />}
      {photoError && <RequestFeedback context="Ao atualizar foto" message={photoError} />}
      {photoMessage && <RequestFeedback kind="success" message={photoMessage} />}
      {message && (
        <div
          role={messageType === 'error' ? 'alert' : 'status'}
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
                disabled={loading || photoSaving}
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
                disabled={loading || photoSaving}
                className="bg-[#037F8C] text-white py-4 px-8 rounded-lg text-lg hover:bg-opacity-90 hover:scale-105 hover:bg-[#044D55] hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer KantumruySemiBold disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
              >
                {photoSaving ? 'Enviando...' : 'Alterar Foto'}
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
