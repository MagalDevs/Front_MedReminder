import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SearchBar from '@/app/components/SearchBar/SearchBar';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

// Ordem intencionalmente não alfabética; Papa Parse real lê a fronteira CSV.
const CSV = `NOME_PRODUTO,DESCRIÇÃO
DIP Zeta,primeiro
Outro Sintético,fora da busca
dip Alfa,segundo
DIP Repetido,duplicado um
DIP Repetido,duplicado dois
DIP Épsilon,quinto
DIP 06,sexto
DIP 07,sétimo
DIP 08,oitavo
DIP 09,nono
DIP 10,décimo
DIP 11,décimo primeiro
DIP 12,décimo segundo
  Ácido & Sol Sintético  ,especial
Sem Descrição,
`;

async function mount() {
  const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
    expect(url).toBe('/assets/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv');
    return new Response(CSV);
  });
  vi.stubGlobal('fetch', fetchMock);
  await act(async () => { render(<SearchBar />); });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  return screen.getByRole('textbox');
}

function search(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

// As linhas atuais não têm papel semântico; lemos os nomes exibidos no DOM.
function names() {
  return Array.from(document.querySelectorAll('span.font-semibold'), (el) => el.textContent);
}

describe('SearchBar — CODE-01 TEST-01 DEP-03', () => {
  beforeEach(() => { push.mockReset(); });

  it('UT-09 CODE-01 TEST-01 abre consulta vazia sem listar o catálogo', async () => {
    const input = await mount();
    expect(screen.queryByText('Digite para buscar um medicamento')).not.toBeInTheDocument();
    fireEvent.click(input);
    expect(screen.getByText('Digite para buscar um medicamento')).toBeVisible();
    expect(names()).toEqual([]);
    expect(screen.queryByRole('button', { name: 'Cadastrar' })).not.toBeInTheDocument();
  });

  it('UT-09 UT-10 CODE-01 TEST-01 mantém ordem e duplicados e limita 12 correspondências a dez', async () => {
    const input = await mount();
    search(input, 'dIp');
    expect(names()).toEqual([
      'DIP Zeta', 'dip Alfa', 'DIP Repetido', 'DIP Repetido', 'DIP Épsilon',
      'DIP 06', 'DIP 07', 'DIP 08', 'DIP 09', 'DIP 10',
    ]);
    expect(screen.getByText('duplicado um')).toBeVisible();
    expect(screen.getByText('duplicado dois')).toBeVisible();
    expect(screen.queryByText('DIP 11')).not.toBeInTheDocument();
    expect(screen.queryByText('DIP 12')).not.toBeInTheDocument();
    expect(screen.queryByText('Outro Sintético')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cadastrar' })).not.toBeInTheDocument();
  });

  it('UT-09 CODE-01 TEST-01 encontra substring com acento sem distinguir caixa', async () => {
    const input = await mount();
    search(input, 'ÁCIDO');
    expect(names()).toEqual(['Ácido & Sol Sintético']);
    expect(screen.queryByRole('button', { name: 'Cadastrar' })).not.toBeInTheDocument();
  });

  it('UT-09 CODE-01 TEST-01 preserva distinção de acentos', async () => {
    const input = await mount();
    search(input, 'Acido');
    expect(screen.getByText('Nenhum resultado encontrado')).toBeVisible();
    expect(names()).toEqual([]);
  });

  it('UT-09 CODE-01 TEST-01 preserva espaços da consulta em vez de apará-la no filtro', async () => {
    const input = await mount();
    search(input, ' DIP Zeta ');
    expect(screen.getByText('Nenhum resultado encontrado')).toBeVisible();
    expect(names()).toEqual([]);
  });

  it('UT-09 CODE-01 TEST-01 limpar resultados volta à orientação de consulta vazia', async () => {
    const input = await mount();
    search(input, 'dIp');
    search(input, '');
    expect(names()).toEqual([]);
    expect(screen.getByText('Digite para buscar um medicamento')).toBeVisible();
  });

  it('UT-10 CODE-01 TEST-01 seleção apara nome e Cadastrar envia URL codificada literal', async () => {
    const input = await mount();
    search(input, 'Ácido');
    fireEvent.click(screen.getByText('Ácido & Sol Sintético'));
    expect(input).toHaveValue('Ácido & Sol Sintético');
    expect(names()).toEqual(['Ácido & Sol Sintético']);
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(push).toHaveBeenCalledExactlyOnceWith(
      '/novo-medicamento?medicamento=%C3%81cido%20%26%20Sol%20Sint%C3%A9tico',
    );
  });

  it('UT-10 CODE-01 TEST-01 Cadastrar exige correspondência única e nome com caixa exata', async () => {
    const input = await mount();
    search(input, 'dip zeta');
    expect(names()).toEqual(['DIP Zeta']);
    expect(screen.queryByRole('button', { name: 'Cadastrar' })).not.toBeInTheDocument();
    search(input, 'DIP Zeta');
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeVisible();
    search(input, 'DIP Zet');
    expect(screen.queryByRole('button', { name: 'Cadastrar' })).not.toBeInTheDocument();
  });

  it('UT-10 CODE-01 TEST-01 nome duplicado digitado não habilita Cadastrar', async () => {
    const input = await mount();
    search(input, 'DIP Repetido');
    expect(names()).toEqual(['DIP Repetido', 'DIP Repetido']);
    expect(screen.queryByRole('button', { name: 'Cadastrar' })).not.toBeInTheDocument();
  });

  it('UT-09 CODE-01 TEST-01 botão fecha e reabre dropdown preservando consulta', async () => {
    const input = await mount();
    search(input, 'Zeta');
    fireEvent.click(screen.getByRole('button', { name: '' }));
    expect(names()).toEqual([]);
    expect(input).toHaveValue('Zeta');
    fireEvent.click(screen.getByRole('button', { name: '' }));
    expect(names()).toEqual(['DIP Zeta']);
  });

  it('UT-09 CODE-01 TEST-01 linha com descrição vazia continua selecionável', async () => {
    const input = await mount();
    search(input, 'Sem Descrição');
    expect(names()).toEqual(['Sem Descrição']);
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeVisible();
  });
});
