import { resolveIsolatedApiUrl } from './e2e';

/** Metadados declarados pelo operador; os testes não comprovam o filesystem remoto. */
export function backendEnvironment() {
  const api = resolveIsolatedApiUrl();
  const commit = process.env.E2E_BACKEND_COMMIT;
  const sqliteFile = process.env.E2E_SQLITE_FILE;
  if (!commit || !/^[a-f0-9]{40}$/i.test(commit)) {
    throw new Error('BLOQUEADO: informe E2E_BACKEND_COMMIT com a revisão completa da API isolada.');
  }
  if (!sqliteFile || /:memory:|mode=memory/i.test(sqliteFile)) {
    throw new Error('BLOQUEADO: E2E_SQLITE_FILE deve identificar o SQLite temporário em arquivo, inicializado com migrações.');
  }
  if (process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') !== api || process.env.NEXT_PUBLIC_API_ENV !== 'isolated') {
    throw new Error('BLOQUEADO: build requer NEXT_PUBLIC_API_URL igual a E2E_API_URL e NEXT_PUBLIC_API_ENV=isolated.');
  }
  return { api, commit, sqliteFile };
}
