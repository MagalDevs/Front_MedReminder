import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfiguracoesContent from '@/app/Configuracoes/ConfiguracoesContent';

const state = vi.hoisted(() => ({
  user: { id: 7, nome: 'Ana', email: 'ana@example.test' },
}));
vi.mock('@/app/contexts/AuthContext', () => ({ useAuth: () => state }));
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function mount() {
  vi.mocked(fetch).mockResolvedValueOnce(json({ data: state.user }));
  const view = render(<ConfiguracoesContent />);
  await screen.findByDisplayValue('Ana');
  return view.container.querySelector('input[type="file"]')!;
}
function upload(
  input: Element,
  file = new File(['synthetic'], 'perfil.png', { type: 'image/png' }),
) {
  fireEvent.change(input, { target: { files: [file] } });
}

describe('NET-11 upload configurado', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'a');
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001');
  });

  it.each([404, 503, 'network'] as const)(
    'ERR-01 NET-11 falha%s é visível sem foto salva',
    async (status) => {
      const input = await mount();
      if (status === 'network')
        vi.mocked(fetch).mockRejectedValueOnce(
          new TypeError('http://private/token'),
        );
      else
        vi.mocked(fetch).mockResolvedValueOnce(
          json({ message: 'SQLITE_ERROR private' }, status),
        );
      upload(input);
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Ao atualizar foto:');
      expect(alert).toHaveTextContent(
        status === 404
          ? 'Não foi possível encontrar o recurso solicitado.'
          : status === 503
            ? 'O serviço está temporariamente indisponível. Tente novamente mais tarde.'
            : 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      );
      expect(alert).not.toHaveTextContent('private');
      expect(
        screen.queryByText('Foto atualizada com sucesso!'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Alterar Foto' }),
      ).toBeEnabled();
      const [url, options] = vi.mocked(fetch).mock.calls[1];
      expect(url).toBe('http://localhost:3001/usuario/foto');
      expect(options?.body).toBeInstanceOf(FormData);
      expect((options?.body as FormData).get('foto')).toBeInstanceOf(File);
      expect(new Headers(options?.headers).get('Content-Type')).toBeNull();
      expect(new Headers(options?.headers).get('Authorization')).toBe(
        'Bearer a',
      );
    },
  );

  it('ERR-18 nova foto confirmada limpa erro próprio e muda imagem', async () => {
    const input = await mount();
    vi.mocked(fetch).mockResolvedValueOnce(json({}, 404));
    upload(input);
    await screen.findByRole('alert');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    upload(input);
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Foto atualizada com sucesso!',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByAltText('Foto de perfil atual')).toBeInTheDocument();
  });

  it.each(['text/plain', 'oversize'])(
    'NET-11 validação local%s não envia upload',
    async (mode) => {
      const input = await mount();
      const file = new File(['synthetic'], 'perfil.png', {
        type: mode === 'oversize' ? 'image/png' : mode,
      });
      if (mode === 'oversize')
        Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 + 1 });
      upload(input, file);
      expect(await screen.findByRole('alert')).toHaveTextContent(
        mode === 'oversize'
          ? 'A imagem deve ter no máximo 5MB.'
          : 'Por favor, selecione apenas arquivos de imagem.',
      );
      expect(fetch).toHaveBeenCalledTimes(1);
    },
  );
});
