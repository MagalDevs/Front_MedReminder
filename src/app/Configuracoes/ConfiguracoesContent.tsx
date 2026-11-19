'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, ApiError } from '../utils/api';
import { getAccessToken, getSessionIdentity } from '../utils/session-storage';
import RequestFeedback from '../components/RequestFeedback/RequestFeedback';
import { RequestContractError, requestErrorMessage } from '../utils/request-errors';

const inputClass = 'block min-h-11 w-full rounded-md border border-[#037F8C] bg-white px-3 py-2 text-gray-700 KantumruyMedium placeholder:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#044D55]';

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
  dataNasc?: Date;
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
  const session = getSessionIdentity();
  const identity = `${user?.id ?? user?.email ?? ''}:${session}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const current = () => active && !controller.signal.aborted && getSessionIdentity() === session;
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
  }, [user, session, identity]);
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
    const originalSession = getSessionIdentity();
    const current = () => !controller.signal.aborted && getSessionIdentity() === originalSession;
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
            const tokenBeforeVerification = getAccessToken();
            try {
              const profile = await apiRequest<{ data: Usuario }>('usuario/me', { signal: controller.signal });
              if (!current()) return;
              if (!validUser(profile?.data)) throw new RequestContractError();
              detail = tokenBeforeVerification === getAccessToken()
                ? 'Senha atual incorreta. Sua sessão continua válida.'
                : 'Sua sessão foi renovada. Tente alterar a senha novamente.';
            } catch (sessionError) {
              if (controller.signal.aborted || (getSessionIdentity() !== originalSession && getSessionIdentity() !== null)) return;
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
      const originalSession = getSessionIdentity();
      const current = () => !controller.signal.aborted && getSessionIdentity() === originalSession;
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
      <>
        <p className="sr-only" role="status">Carregando configurações...</p>
        <div aria-hidden="true" className="max-w-lg motion-safe:animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded w-full mb-6"></div>
          <div className="h-32 bg-gray-200 rounded w-full"></div>
        </div>
      </>
    );
  }
  return (
    <div className="max-w-lg @min-[45rem]:max-w-[51.5rem]">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#037F8C] KantumruySemiBold mb-2">
          Configurações
        </h1>
        <p className="text-gray-600 KantumruyRegular">
          Gerencie suas informações pessoais
        </p>
      </header>
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
      )}
      <div className="grid items-start gap-6 @min-[45rem]:grid-cols-[minmax(0,30rem)_minmax(0,20rem)]">
        {/* Formulário unificado para alteração de dados */}
        <section aria-labelledby="perfil-dados" className="min-w-0 rounded-lg bg-white p-4 shadow-sm sm:p-6">
          <h2 id="perfil-dados" className="mb-4 text-xl font-semibold text-[#037F8C] KantumruySemiBold">
            Alterar Informações Pessoais
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Nome */}
            <div>
              <label htmlFor="perfil-nome" className="mb-2 block text-sm font-medium text-gray-700">
                Nome
              </label>
              <input
                id="perfil-nome"
                type="text"
                autoComplete="name"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome completo"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="perfil-email" className="mb-2 block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                id="perfil-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="perfil-cep" className="mb-2 block text-sm font-medium text-gray-700">
                CEP
              </label>
              <input
                id="perfil-cep"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                aria-describedby="perfil-cep-ajuda"
                value={cep}
                onChange={handleCepChange}
                placeholder="00000-000"
                className={`${inputClass} max-w-44`}
              />
              <p id="perfil-cep-ajuda" className="mt-1 text-xs text-gray-600">
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
                <label htmlFor="perfil-senha-atual" className="mb-2 block text-sm font-medium text-gray-700">
                  Senha Atual
                </label>
                <input
                  id="perfil-senha-atual"
                  type="password"
                  autoComplete="current-password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className={inputClass}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="perfil-nova-senha" className="mb-2 block text-sm font-medium text-gray-700">
                  Nova Senha
                </label>
                <input
                  id="perfil-nova-senha"
                  type="password"
                  autoComplete="new-password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="perfil-confirmar-senha" className="mb-2 block text-sm font-medium text-gray-700">
                  Confirmar Nova Senha
                </label>
                <input
                  id="perfil-confirmar-senha"
                  type="password"
                  autoComplete="new-password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || photoSaving}
                className="med-button med-button--primary w-full sm:w-auto"
              >
                {loading ? 'Atualizando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </section>
        <section aria-labelledby="perfil-foto" className="min-w-0 rounded-lg bg-white p-4 shadow-sm sm:p-6">
          <h2 id="perfil-foto" className="mb-4 text-xl font-semibold text-[#037F8C] KantumruySemiBold">
            Alterar foto de perfil
          </h2>
          <div className="flex flex-col items-start gap-4">
            <div className="flex aspect-square w-36 max-w-full items-center justify-center overflow-hidden rounded-full border border-[#037F8C] bg-gray-50">
              {foto ? (
                <Image
                  src={foto}
                  alt="Foto de perfil atual"
                  className="w-full h-full object-cover"
                  width={144}
                  height={144}
                />
              ) : (
                <span className="text-gray-600 KantumruyMedium">
                  Sem foto
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={openFileSelector}
              disabled={loading || photoSaving}
              aria-describedby="perfil-foto-ajuda"
              className="med-button med-button--primary"
            >
              {photoSaving ? 'Enviando...' : 'Alterar Foto'}
            </button>
            <p id="perfil-foto-ajuda" className="max-w-xs text-sm text-gray-600 KantumruyRegular">
              Selecione uma imagem de até 5MB para atualizar sua foto de perfil
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handlePhotoChange}
            accept="image/*"
            className="hidden"
          />
        </section>
      </div>
    </div>
  );
}
