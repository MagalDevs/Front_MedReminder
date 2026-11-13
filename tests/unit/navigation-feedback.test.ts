import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearNavigationFeedback, consumeNavigationFeedback, publishNavigationFeedback, subscribeNavigationFeedback } from '@/app/utils/navigation-feedback';

beforeEach(clearNavigationFeedback);
describe('Avisos efêmeros de navegação', () => {
  it('ERR-04 login montado recebe o código e cleanup remove assinatura', () => {
    const received: unknown[] = [];
    const unsubscribe = subscribeNavigationFeedback(() => received.push(consumeNavigationFeedback()));
    publishNavigationFeedback('session-expired'); unsubscribe(); publishNavigationFeedback('registered');
    expect(received).toEqual(['session-expired']);
    expect(consumeNavigationFeedback()).toBe('registered');
  });
  it('REG-08 confirmação fica disponível para a próxima página', () => {
    publishNavigationFeedback('registered');
    expect(consumeNavigationFeedback()).toBe('registered');
  });
  it('REG-09 aviso é consumido uma vez', () => {
    publishNavigationFeedback('registered'); consumeNavigationFeedback();
    expect(consumeNavigationFeedback()).toBeNull();
  });
  it('ERR-04 expiração atravessa navegação com código seguro', () => {
    publishNavigationFeedback('session-expired');
    expect(consumeNavigationFeedback()).toBe('session-expired');
  });
  it('REG-09 nova intenção limpa aviso pendente', () => {
    publishNavigationFeedback('registered'); clearNavigationFeedback();
    expect(consumeNavigationFeedback()).toBeNull();
  });
  it('REG-19 avisos não escrevem storage ou URL', () => {
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const href=window.location.href;
    publishNavigationFeedback('registered');
    expect(storage).not.toHaveBeenCalled();
    expect(window.location.href).toBe(href);
    expect(localStorage.length).toBe(0); expect(sessionStorage.length).toBe(0);
  });
});
