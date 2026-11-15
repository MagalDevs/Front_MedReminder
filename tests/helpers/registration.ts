import { fireEvent, screen } from '@testing-library/react';

/** Perform the two approved form stages; never bypass validation with a request. */
export function fillRegistrationAccount(email: string, senha: string, confirmation = senha) {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: senha } });
  fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: confirmation } });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
}

export function fillRegistrationPersonal(values: { nome: string; cpf: string; cep: string; dataNasc: string; cuidador?: boolean }) {
  for (const [label, value] of [['Nome completo', values.nome], ['CPF', values.cpf], ['CEP', values.cep], ['Data de nascimento', values.dataNasc]]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  if (values.cuidador) fireEvent.click(screen.getByLabelText('Sou cuidador'));
}

export function submitRegistration() {
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
}
