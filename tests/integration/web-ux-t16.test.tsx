import { beforeEach, expect, it, vi } from 'vitest';
import { updateMedication } from '@/app/features/web-ux/data/updateMedication';
const original = { nome: 'Vitamina', classificacao: 'Suplemento', quantidadeCaixa: 10, dataValidade: '2027-12-31', cor: 'Azul', motivo: 'Rotina', observacao: 'Com água' };
beforeEach(() => localStorage.setItem('access_token', 'token-A'));
it('envia somente os sete metadados alterados, sem alterar a agenda', async () => {
  const changed = { nome: 'Vitamina C', classificacao: 'Outro', quantidadeCaixa: 20, dataValidade: '2028-01-01', cor: 'Verde', motivo: 'Novo motivo', observacao: '' };
  const edited = { ...changed, quantidadeDiaria: 99, quantidadeDias: 60, horaInicio: '2030-01-01', quantidadeDose: '999 mg', unidadeMedida: 'kg', doses: ['2030-01-01'], foto: 'https://example.test/change.jpg' };
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ data: { id: 77, ...changed } }), { status: 200, headers: { 'content-type': 'application/json' } }));
  expect(await updateMedication(77, original, edited)).toEqual({ changed: true, medication: { id: 77, ...changed } });
  expect(fetch).toHaveBeenCalledTimes(1); const [url, options] = vi.mocked(fetch).mock.calls[0];
  expect(String(url)).toMatch(/\/remedio\/77$/); expect(options?.method).toBe('PUT'); expect(JSON.parse(String(options?.body))).toEqual(changed);
});
it('omite campos intactos e não envia quando não há mudanças', async () => {
  expect(await updateMedication(77, original, { ...original })).toEqual({ changed: false, medication: original }); expect(fetch).not.toHaveBeenCalled();
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ data: { id: 77, ...original, nome: 'Novo' } }), { status: 200, headers: { 'content-type': 'application/json' } }));
  await updateMedication(77, original, { ...original, nome: 'Novo' });
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({ nome: 'Novo' });
});
it('propaga falha e não aceita confirmação de outro medicamento', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(new Response(JSON.stringify({ data: { id: 88 } }), { status: 200, headers: { 'content-type': 'application/json' } }));
  await expect(updateMedication(77, original, { nome: 'Novo' })).rejects.toThrow();
  await expect(updateMedication(77, original, { nome: 'Novo' })).rejects.toThrow();
  expect(original.nome).toBe('Vitamina');
});
