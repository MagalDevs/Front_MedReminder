import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import BuscaMedicamento from '@/app/components/CardBusca/cardBusca';
const csv = 'NOME_PRODUTO,DESCRIÇÃO\nVitamina A,Suplemento A\nVitamina B,Suplemento B\n';
function Harness() {
  const [name, setName] = useState(''); const [classification, setClassification] = useState('');
  const [amount, setAmount] = useState('1,5');
  return <><BuscaMedicamento onSelect={med => { setName(med.NOME_PRODUTO); setClassification(med.DESCRIÇÃO); }} onManual={setName} />
    <label>Nome<input value={name} onChange={event => setName(event.target.value)} /></label>
    <label>Classificação<input value={classification} onChange={event => setClassification(event.target.value)} /></label>
    <label>Quantidade por dose<input value={amount} onChange={event => setAmount(event.target.value)} /></label></>;
}
it('WUX_FORM_02', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(csv)); render(<Harness />);
  await waitFor(() => expect(screen.queryByText('Carregando catálogo...')).not.toBeInTheDocument());
  const input = screen.getByRole('combobox', { name: 'Buscar no catálogo' }); fireEvent.change(input, { target: { value: 'Vitamina' } });
  fireEvent.click(screen.getByRole('option', { name: 'Vitamina A Suplemento A' }));
  await waitFor(() => expect(screen.getByLabelText('Nome')).toHaveValue('Vitamina A'));
  expect(screen.getByLabelText('Classificação')).toHaveValue('Suplemento A'); expect(screen.getByLabelText('Quantidade por dose')).toHaveValue('1,5');
  fireEvent.change(input, { target: { value: 'Manual novo' } }); expect(screen.getByText('Nenhum resultado encontrado')).toBeVisible();
  fireEvent.click(screen.getByText('Cadastrar manualmente'));
  expect(screen.getByLabelText('Nome')).toHaveValue('Manual novo'); expect(screen.getByText('Cadastro manual selecionado. Preencha os dados do medicamento.')).toBeVisible();
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Manual editado' } }); expect(screen.getByLabelText('Nome')).toHaveValue('Manual editado');
});
it('WUX_FORM_17', async () => {
  vi.mocked(fetch).mockRejectedValue(new TypeError('offline')); render(<Harness />); await screen.findByRole('alert');
  expect(screen.queryByRole('option')).not.toBeInTheDocument(); fireEvent.click(screen.getByText('Cadastrar manualmente'));
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Digitado sem catálogo' } });
  fireEvent.change(screen.getByLabelText('Classificação'), { target: { value: 'Outra' } });
  expect(screen.getByLabelText('Nome')).toHaveValue('Digitado sem catálogo'); expect(screen.getByLabelText('Classificação')).toHaveValue('Outra'); expect(fetch).toHaveBeenCalledTimes(1);
});
it('WUX_ACCESS_02', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(csv)); render(<Harness />);
  await waitFor(() => expect(screen.queryByText('Carregando catálogo...')).not.toBeInTheDocument());
  const input = screen.getByRole('combobox'); input.focus(); fireEvent.change(input, { target: { value: 'Vitamina' } });
  fireEvent.keyDown(input, { key: 'Escape' }); expect(input).toHaveAttribute('aria-expanded', 'false'); expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  fireEvent.keyDown(input, { key: 'ArrowDown' }); expect(input).toHaveAttribute('aria-expanded', 'true');
  expect(document.getElementById(input.getAttribute('aria-controls')!)).toHaveAttribute('role', 'listbox');
  expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Vitamina A');
  fireEvent.keyDown(input, { key: 'ArrowDown' }); expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Vitamina B');
  fireEvent.keyDown(input, { key: 'ArrowUp' }); expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Vitamina A');
  fireEvent.keyDown(input, { key: 'ArrowDown' }); expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { selected: true }).id);
  fireEvent.keyDown(input, { key: 'Enter' }); await waitFor(() => expect(screen.getByLabelText('Nome')).toHaveValue('Vitamina B'));
  expect(input).toHaveFocus(); expect(input).toHaveValue('Vitamina B'); expect(input).toHaveAttribute('aria-expanded', 'false'); expect(screen.getByLabelText('Classificação')).toHaveValue('Suplemento B');
});
