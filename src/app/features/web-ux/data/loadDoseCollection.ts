import { apiRequest } from '../../../utils/api';
import { RequestContractError, requestErrorMessage } from '../../../utils/request-errors';
import { DoseView, normalizeDose } from '../domain/agenda';

export type DoseCollection = { items: DoseView[]; complete: boolean; loading: boolean; error: string | null; expectedTotal: number | null; failure?: unknown };
type Pagination = { page: number; limit: number; total: number; totalPages: number };
export type DoseCollectionOptions = {
  signal?: AbortSignal; from?: string; to?: string; tomado?: boolean; order?: 'ASC' | 'DESC';
  onProgress?: (result: DoseCollection) => void;
};

function envelope(value: unknown): { data: unknown[]; pagination?: Pagination } {
  if (!value || typeof value !== 'object' || !('data' in value) || !Array.isArray(value.data)) throw new RequestContractError();
  const data = value.data;
  if (!('pagination' in value)) return { data };
  const page = value.pagination as Pagination | null;
  if (!page || !['page', 'limit', 'total', 'totalPages'].every(key => Number.isSafeInteger(page[key as keyof Pagination])) || page.page < 1 || page.limit < 1 || page.limit > 100 || page.total < 0 || page.totalPages < 0 || page.totalPages !== Math.max(1, Math.ceil(page.total / page.limit)) && !(page.total === 0 && page.totalPages === 0)) throw new RequestContractError();
  return { data, pagination: page };
}

export async function loadDoseCollection(options: DoseCollectionOptions = {}): Promise<DoseCollection> {
  let result: DoseCollection = { items: [], complete: false, loading: true, error: null, expectedTotal: null };
  const query = new URLSearchParams({ limit: '100', order: options.order ?? 'ASC' });
  if (options.from) query.set('from', options.from);
  if (options.to) query.set('to', options.to);
  if (options.tomado !== undefined) query.set('tomado', String(options.tomado));
  let first: Pagination | undefined;
  const ids = new Set<number>();
  try {
    for (let page = 1; ; page++) {
      options.signal?.throwIfAborted();
      query.set('page', String(page));
      const response = envelope(await apiRequest<unknown>(`dose/me?${query}`, { method: 'GET', onUnauthorized: 'throw', signal: options.signal }));
      options.signal?.throwIfAborted();
      const pagination = response.pagination;
      if (page > 1 && !pagination) throw new RequestContractError();
      if (pagination && (pagination.page !== page || (first && (pagination.total !== first.total || pagination.limit !== first.limit || pagination.totalPages !== first.totalPages)))) throw new RequestContractError();
      first ??= pagination;
      const items = response.data.map(normalizeDose);
      result = { ...result, items: [...result.items, ...items], expectedTotal: pagination?.total ?? items.length };
      for (const item of items) {
        if (item.id !== undefined) {
          if (ids.has(item.id)) throw new RequestContractError();
          ids.add(item.id);
        }
      }
      if (pagination) {
        const expectedPageCount = pagination.total === 0 ? 0 : Math.min(pagination.limit, pagination.total - (page - 1) * pagination.limit);
        if (items.length !== expectedPageCount) throw new RequestContractError();
      }
      const complete = !pagination || page >= pagination.totalPages;
      if (complete) return { ...result, complete: true, loading: false };
      options.onProgress?.(result);
    }
  } catch (failure) {
    options.signal?.throwIfAborted();
    return { ...result, loading: false, complete: false, error: requestErrorMessage(failure), failure };
  }
}
