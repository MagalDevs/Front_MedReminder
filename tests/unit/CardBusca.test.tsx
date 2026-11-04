import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import Papa from 'papaparse';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BuscaMedicamento from '@/app/components/CardBusca/cardBusca';

const CSV = `NOME_PRODUTO,DESCRIÇÃO
  Sol Sintético  ,primeiro com espaços
Outro Sintético,fora da busca
DIP Zeta,primeiro DIP
dip Alfa,segundo DIP
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
Sem Descrição,
`;

async function mount(medicamentoInicial?: string, csv: string = CSV) {
  const onSelect = vi.fn();
  const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
    expect(url).toBe('/assets/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv');
    return new Response(csv);
  });
  vi.stubGlobal('fetch', fetchMock);
  await act(async () => {
    render(<BuscaMedicamento onSelect={onSelect} medicamentoInicial={medicamentoInicial} />);
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  return { input: screen.getByRole('textbox'), onSelect };
}

function search(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

function names() {
  return Array.from(document.querySelectorAll('span.font-semibold'), (el) => el.textContent);
}

describe('CardBusca — UT-14 CODE-02 TEST-01 DEP-03', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-04T12:00:00-03:00'));
  });

  it('UT-14 CODE-02 TEST-01 inicial encontra nome do catálogo aparado e ignora caixa', async () => {
    const { input, onSelect } = await mount('sOL sINTÉTICO');
    expect(input).toHaveValue('sOL sINTÉTICO');
    expect(screen.getByText('Selecionado: Sol Sintético')).toBeVisible();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith({
      NOME_PRODUTO: '  Sol Sintético  ', DESCRIÇÃO: 'primeiro com espaços',
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('UT-14 CODE-02 TEST-01 inicial inexistente não emite seleção', async () => {
    const { input, onSelect } = await mount('Inexistente');
    expect(input).toHaveValue('Inexistente');
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(input);
    expect(screen.getByText('Nenhum resultado encontrado')).toBeVisible();
  });

  it('UT-14 CODE-02 TEST-01 inicial duplicado escolhe o primeiro objeto na ordem do CSV', async () => {
    const { onSelect } = await mount('dip repetido');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith({
      NOME_PRODUTO: 'DIP Repetido', DESCRIÇÃO: 'duplicado um',
    });
  });

  it('UT-14 CODE-02 TEST-01 clique fecha dropdown e emite objeto original somente após timer zero', async () => {
    const { input, onSelect } = await mount();
    search(input, 'sol');
    fireEvent.click(screen.getByText('Sol Sintético'));
    expect(input).toHaveValue('Sol Sintético');
    expect(screen.getByText('Selecionado: Sol Sintético')).toBeVisible();
    expect(screen.queryByText('primeiro com espaços')).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(onSelect).toHaveBeenCalledExactlyOnceWith({
      NOME_PRODUTO: '  Sol Sintético  ', DESCRIÇÃO: 'primeiro com espaços',
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('UT-14 CODE-02 TEST-01 limpeza após seleção emite objeto vazio imediatamente', async () => {
    const { input, onSelect } = await mount();
    search(input, 'sol');
    fireEvent.click(screen.getByText('Sol Sintético'));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    search(input, '');
    expect(input).toHaveValue('');
    expect(screen.queryByText('Selecionado: Sol Sintético')).not.toBeInTheDocument();
    expect(screen.getByText('Digite para buscar um medicamento')).toBeVisible();
    expect(onSelect.mock.calls).toEqual([
      [{ NOME_PRODUTO: '  Sol Sintético  ', DESCRIÇÃO: 'primeiro com espaços' }],
      [{ NOME_PRODUTO: '', DESCRIÇÃO: '' }],
    ]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('UT-14 CODE-02 TEST-01 dropdown vazio abre e fecha sem sugestões nem callback', async () => {
    const { onSelect } = await mount();
    expect(screen.queryByText('Digite para buscar um medicamento')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Digite para buscar um medicamento')).toBeVisible();
    expect(names()).toEqual([]);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('Digite para buscar um medicamento')).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('UT-14 CODE-02 TEST-01 busca mantém ordem e duplicados no limite de dez', async () => {
    const { input, onSelect } = await mount();
    search(input, 'dIp');
    expect(names()).toEqual([
      'DIP Zeta', 'dip Alfa', 'DIP Repetido', 'DIP Repetido', 'DIP Épsilon',
      'DIP 06', 'DIP 07', 'DIP 08', 'DIP 09', 'DIP 10',
    ]);
    expect(screen.queryByText('DIP 11')).not.toBeInTheDocument();
    expect(screen.queryByText('DIP 12')).not.toBeInTheDocument();
    expect(screen.queryByText('Outro Sintético')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('duplicado dois'));
    expect(onSelect).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(onSelect).toHaveBeenCalledExactlyOnceWith({
      NOME_PRODUTO: 'DIP Repetido', DESCRIÇÃO: 'duplicado dois',
    });
  });

  it('UT-14 CODE-02 TEST-01 acento e espaços continuam significativos na busca', async () => {
    const { input, onSelect } = await mount();
    search(input, 'ÉPSILON');
    expect(names()).toEqual(['DIP Épsilon']);
    search(input, 'Epsilon');
    expect(screen.getByText('Nenhum resultado encontrado')).toBeVisible();
    search(input, ' DIP Zeta ');
    expect(names()).toEqual([]);
    expect(screen.getByText('Nenhum resultado encontrado')).toBeVisible();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('UT-14 CODE-02 TEST-01 descrição vazia é preservada no callback assíncrono', async () => {
    const { input, onSelect } = await mount();
    search(input, 'Sem Descrição');
    fireEvent.click(screen.getByText('Sem Descrição'));
    expect(onSelect).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(onSelect).toHaveBeenCalledExactlyOnceWith({
      NOME_PRODUTO: 'Sem Descrição', DESCRIÇÃO: '',
    });
  });

  it('CODE-02 reabrir após escolher duplicado com consulta exata mantém só a linha escolhida', async () => {
    const { input, onSelect } = await mount();
    search(input, 'DIP Repetido');
    fireEvent.click(screen.getByText('duplicado dois'));
    fireEvent.click(screen.getByRole('button'));
    expect(names()).toEqual(['DIP Repetido']);
    expect(screen.getByText('duplicado dois')).toBeVisible();
    expect(screen.queryByText('duplicado um')).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(onSelect).toHaveBeenCalledExactlyOnceWith({ NOME_PRODUTO: 'DIP Repetido', DESCRIÇÃO: 'duplicado dois' });
    search(input, 'DIP Repetid');
    expect(names()).toEqual(['DIP Repetido', 'DIP Repetido']);
  });

  it('CODE-02 mudança de inicial atualiza seleção encontrada e preserva a última quando não encontra', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(CSV)));
    const onSelect = vi.fn();
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<BuscaMedicamento onSelect={onSelect} medicamentoInicial="Sol Sintético" />);
    });
    expect(screen.getByText('Selecionado: Sol Sintético')).toBeVisible();
    view.rerender(<BuscaMedicamento onSelect={onSelect} medicamentoInicial="DIP Zeta" />);
    expect(screen.getByText('Selecionado: DIP Zeta')).toBeVisible();
    expect(onSelect).toHaveBeenLastCalledWith({ NOME_PRODUTO: 'DIP Zeta', DESCRIÇÃO: 'primeiro DIP' });
    view.rerender(<BuscaMedicamento onSelect={onSelect} medicamentoInicial="Inexistente" />);
    expect(screen.getByText('Selecionado: DIP Zeta')).toBeVisible();
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('textbox')).toHaveValue('Sol Sintético');
  });
});

// IT-09: dataset fixo com entradas que divergiriam se o termo fosse aparado ou sem acentos.
const CSV_EQUIV = `NOME_PRODUTO,DESCRIÇÃO
Dipirona Sódica,analgésico
 dip Espaço ,nome com espaço inicial
Ácido Fólico,vitamina
Acido Sintetico,sem acento
ÁCIDO ÚRICO,maiúsculo
Cloreto Sintético,sal
`;

type Row = { NOME_PRODUTO: string; DESCRIÇÃO: string };
const EQUIV_ROWS = Papa.parse<Row>(CSV_EQUIV, { header: true, skipEmptyLines: true }).data;

// Cópia literal da expressão de filtro anterior à T24 (termo em minúsculas por item).
function legacyNames(term: string) {
  return EQUIV_ROWS
    .filter((med) => med.NOME_PRODUTO?.toLowerCase().includes(term.toLowerCase()))
    .slice(0, 10)
    .map((med) => med.NOME_PRODUTO.trim());
}

describe('CardBusca — IT-09 CODE-02 equivalência da otimização', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-04T12:00:00-03:00'));
  });

  const CASES: [string, string[]][] = [
    ['DIP', ['Dipirona Sódica', 'dip Espaço']],
    ['dip', ['Dipirona Sódica', 'dip Espaço']],
    [' dip', ['dip Espaço']], // com trim, "Dipirona Sódica" também apareceria
    ['dip ', ['dip Espaço']], // espaço final continua significativo
    ['ácido', ['Ácido Fólico', 'ÁCIDO ÚRICO']],
    ['ÁCIDO', ['Ácido Fólico', 'ÁCIDO ÚRICO']],
    ['acido', ['Acido Sintetico']], // com accent folding apareceriam três itens
    ['ACIDO', ['Acido Sintetico']],
    ['xyz', []],
  ];

  it.each(CASES)('IT-09 CODE-02 TEST-01 termo %j mantém nomes, ordem e equivale ao filtro anterior', async (term, expected) => {
    const { input, onSelect } = await mount(undefined, CSV_EQUIV);
    search(input, term);
    expect(names()).toEqual(expected);
    expect(names()).toEqual(legacyNames(term));
    expect(input).toHaveValue(term); // termo original não é alterado nem aparado
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('IT-09 CODE-02 TEST-01 termos alternados e limpeza não reutilizam resultado anterior', async () => {
    const { input, onSelect } = await mount(undefined, CSV_EQUIV);
    search(input, 'dip');
    expect(names()).toEqual(['Dipirona Sódica', 'dip Espaço']);
    search(input, 'ACIDO');
    expect(names()).toEqual(['Acido Sintetico']);
    search(input, 'dip');
    expect(names()).toEqual(['Dipirona Sódica', 'dip Espaço']);
    search(input, '');
    expect(names()).toEqual([]);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith({ NOME_PRODUTO: '', DESCRIÇÃO: '' });
  });

  it('IT-09 CODE-02 TEST-01 seleção emite o objeto original somente após timer zero', async () => {
    const { input, onSelect } = await mount(undefined, CSV_EQUIV);
    search(input, 'dip');
    fireEvent.click(screen.getByText('dip Espaço'));
    expect(input).toHaveValue('dip Espaço');
    expect(screen.getByText('Selecionado: dip Espaço')).toBeVisible();
    expect(onSelect).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(onSelect).toHaveBeenCalledExactlyOnceWith({
      NOME_PRODUTO: ' dip Espaço ', DESCRIÇÃO: 'nome com espaço inicial',
    });
  });

  it('IT-09 CODE-02 TEST-01 medicamentoInicial ignora caixa, mas não acentos nem espaço inicial', async () => {
    const found = await mount('ácido fólico', CSV_EQUIV);
    expect(found.onSelect).toHaveBeenCalledExactlyOnceWith({
      NOME_PRODUTO: 'Ácido Fólico', DESCRIÇÃO: 'vitamina',
    });
    expect(screen.getByText('Selecionado: Ácido Fólico')).toBeVisible();
    cleanup();

    const semAcento = await mount('acido fólico', CSV_EQUIV);
    expect(semAcento.onSelect).not.toHaveBeenCalled();
    cleanup();

    const comEspaco = await mount(' dip espaço', CSV_EQUIV);
    expect(comEspaco.input).toHaveValue(' dip espaço');
    expect(comEspaco.onSelect).not.toHaveBeenCalled();
  });
});
