import { apiRequest } from '../../../utils/api';
import { RequestContractError } from '../../../utils/request-errors';

export type MedicationMetadata = {
  nome: string; classificacao: string; quantidadeCaixa: number; dataValidade: string;
  cor: string; motivo: string; observacao: string;
};
const editableFields = ['nome', 'classificacao', 'quantidadeCaixa', 'dataValidade', 'cor', 'motivo', 'observacao'] as const;
export async function updateMedication(
  id: number,
  original: Partial<MedicationMetadata>,
  edited: Partial<MedicationMetadata>,
  options: { signal?: AbortSignal } = {},
) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Medicamento inválido');
  const changed = Object.fromEntries(editableFields.filter(field => Object.hasOwn(edited, field) && edited[field] !== undefined && edited[field] !== original[field]).map(field => [field, edited[field]]));
  if (Object.keys(changed).length === 0) return { changed: false as const, medication: original };
  const response = await apiRequest<{ data?: Partial<MedicationMetadata> & { id?: number } }>(`remedio/${id}`, { method: 'PUT', body: JSON.stringify(changed), signal: options.signal });
  if (response?.data?.id !== id) throw new RequestContractError();
  return { changed: true as const, medication: response.data };
}
