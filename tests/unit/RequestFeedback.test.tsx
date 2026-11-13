import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RequestFeedback from '@/app/components/RequestFeedback/RequestFeedback';

describe('RequestFeedback', () => {
  it('ERR-01 erro aparece em região acessível', () => {
    render(<RequestFeedback message="Não foi possível concluir a operação. Tente novamente." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível concluir a operação. Tente novamente.');
  });
  it('REG-08 sucesso usa status', () => {
    render(<RequestFeedback kind="success" message="Cadastro concluído! Entre com seu e-mail e senha." />);
    expect(screen.getByRole('status')).toHaveTextContent('Cadastro concluído! Entre com seu e-mail e senha.');
  });
  it('ERR-01 mantém o contexto da operação', () => {
    render(<RequestFeedback context="Ao carregar lembretes" message="O serviço está temporariamente indisponível. Tente novamente mais tarde." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Ao carregar lembretes: O serviço está temporariamente indisponível. Tente novamente mais tarde.');
  });
  it('ERR-17 conteúdo é texto e não markup executável', () => {
    const { container } = render(<RequestFeedback message="<script>executar()</script>" />);
    expect(screen.getByRole('alert')).toHaveTextContent('<script>executar()</script>');
    expect(container.querySelector('script')).toBeNull();
  });
});
