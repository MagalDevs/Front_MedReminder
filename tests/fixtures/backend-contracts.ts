/**
 * BEAPI-12 source parity reviewed against backend b6b63168ba2a092e6e6350c256bfa15483199b4a.
 * DTOs, controllers, services and api-response.ts inspected on 2026-11-04.
 * Fixtures remain synthetic; runtime parity is recorded separately by T12.
 * Messages/codes below are synthetic examples, not required server literals.
 */
export const BACKEND_CONTRACT_SOURCE = {
  commit: "b6b63168ba2a092e6e6350c256bfa15483199b4a",
  checkedAgainst: "backend source at b6b63168ba2a092e6e6350c256bfa15483199b4a",
  verifiedAgainstBackendCode: true,
  requiresRealResponseComparison: true,
} as const;

export interface MessageResponse { message: string }
export interface DataResponse<T> extends MessageResponse { data: T }
// B/src/auth/auth.controller.ts:18-33 (via design, Current Contract Matrix).
export interface LoginRequest { email: string; senha: string }
export interface LoginResponse extends MessageResponse { access_token: string }
// JSON scalar types checked against UsuarioResponseDto and Usuario entity.
// B/src/usuario/dto/usuario-response.dto.ts:4-22.
export interface UsuarioResponse {
  id: number; nome: string; email: string; dataNasc: string;
  cpf: string; cep: string; cuidador: boolean;
}
export interface UpdateProfileRequest {
  nome?: string; dataNasc?: string; email?: string; cep?: string;
}
export interface UpdatePasswordRequest { senhaAtual: string; novaSenha: string }
export type ProfileResponse = DataResponse<UsuarioResponse>;
export type PasswordResponse = MessageResponse;
export type DeleteResponse = MessageResponse;
// B/src/common/api-response.ts:34-39.
export interface BackendErrorResponse {
  message: string | string[];
  code?: string;
  error: string;
  statusCode: number;
}

export type RemedioResponse = Record<string, unknown>;
export type DoseResponse = Record<string, unknown>;
export interface ListedDoseResponse extends DoseResponse {
  remedio: Record<string, unknown>;
}
// "Legado" significa data array dentro do envelope, não array na raiz.
// B/src/dose/dose.service.ts:143-189, :84-133.
export type LegacyDosesResponse = DataResponse<ListedDoseResponse[]>;
export interface PaginatedDosesResponse extends LegacyDosesResponse {
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
export interface ListDosesQuery {
  page?: number; limit?: number; from?: string; to?: string;
  tomado?: boolean; order?: "ASC" | "DESC";
}
export const DOSE_QUERY_DEFAULTS = { page: 1, limit: 20, order: "ASC" } as const;
export const DOSE_QUERY_MAX_LIMIT = 100;
export type LegacyRemediosResponse = RemedioResponse[];
export type MyRemediosResponse = DataResponse<RemedioResponse[]>;

/** Documented subset ONLY; NOT a complete CreateRemedioDto or valid API payload. */
export interface DocumentedRemedioInput {
  dataValidade: string;
  quantidadeDiaria: number;
  quantidadeDias: number;
}
/** JSON input corresponding to backend CreateRemedioDto (dates serialized). */
export interface CreateRemedioInput extends DocumentedRemedioInput {
  nome: string;
  quantidadeCaixa: number;
  foto: string;
  classificacao: string;
  horaInicio: string;
  cor: string;
  unidadeMedida: string;
  motivo: string;
  quantidadeDose: string;
  observacao?: string;
}
export interface TreatmentRequest<TRemedio = CreateRemedioInput> {
  remedio: TRemedio;
  doses: string[];
}
export interface TreatmentHeaders { "Idempotency-Key": string }
// B/src/tratamento/tratamento.service.ts:107-110.
export type TreatmentResponse = DataResponse<{
  remedio: RemedioResponse;
  doses: DoseResponse[];
}>;
export const TREATMENT_LIMITS = { minDoses: 1, maxDoses: 1000, maxKeyLength: 128 } as const;

export const loginRequestFixture: LoginRequest = { email: "ana@example.test", senha: "SenhaSintetica1!" };
export const loginResponseFixture: LoginResponse = { access_token: "token-sintetico", message: "Login sintético" };
export const LOGIN_SUCCESS_STATUS = 200; // único status de sucesso explícito na matriz.
export const userFixture: UsuarioResponse = {
  id: 101, nome: "Ana Sintética", email: "ana@example.test", dataNasc: "1990-01-02",
  cpf: "00000000000", cep: "01001000", cuidador: false,
};
export const getProfileFixture: ProfileResponse = { message: "Perfil sintético", data: { ...userFixture } };
export const patchProfileFixture: ProfileResponse = {
  message: "Perfil atualizado", data: { ...userFixture, nome: "Ana Atualizada" },
};
export const passwordResponseFixture: PasswordResponse = { message: "Senha atualizada" };
export const deleteResponseFixture: DeleteResponse = { message: "Remédio excluído" };
export const stringErrorFixture: BackendErrorResponse = {
  message: "Senha atual incorreta", error: "Unauthorized", code: "SYNTHETIC_PASSWORD_ERROR", statusCode: 401,
};
export const arrayErrorFixture: BackendErrorResponse = {
  message: ["Validade obrigatória", "Lote deve conter de 1 a 1000 doses"],
  error: "Bad Request", code: "SYNTHETIC_VALIDATION_ERROR", statusCode: 400,
};
export const legacyDosesFixture: LegacyDosesResponse = { message: "Doses sintéticas", data: [{ id: 1, tomado: false, usuarioId: 101, data_dose: "2026-11-04T15:00:00.000Z", remedio: {
  id: 77, nome: "Dipirona", foto: "https://example.com/image.jpg", motivo: "Dor", cor: "Azul",
  horaInicio: "2026-11-04T15:00:00.000Z", quantidadeDiaria: 1, quantidadeDias: 1, quantidadeDose: "1 comp",
} }] };
export const emptyDosesFixture: LegacyDosesResponse = { message: "Sem doses", data: [] };
export const paginatedDosesFixture: PaginatedDosesResponse = {
  ...legacyDosesFixture, pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }, // src/common/api-response.ts
};
export const legacyRemediosFixture: LegacyRemediosResponse = [];
export const myRemediosFixture: MyRemediosResponse = { message: "Sem remédios", data: [] };
export const treatmentHeadersFixture: TreatmentHeaders = { "Idempotency-Key": "sintetico:tratamento-001" };
export const treatmentRequestFixture: TreatmentRequest = {
  remedio: {
    nome: "Dipirona", quantidadeCaixa: 30, dataValidade: "2027-12-31", quantidadeDiaria: 1,
    foto: "https://example.com/image.jpg", classificacao: "Analgesico", horaInicio: "2026-11-04T15:00:00.000Z",
    cor: "Azul", unidadeMedida: "comp", motivo: "Dor", quantidadeDias: 1, quantidadeDose: "1 comp", observacao: "",
  },
  doses: ["2026-11-04T12:00:00-03:00"],
};
export const treatmentResponseFixture: TreatmentResponse = {
  message: "Tratamento sintético", data: { remedio: { ...treatmentRequestFixture.remedio, id: 77, usuarioId: 101 }, doses: [{ id: 1, usuarioId: 101, remedioId: 77, tomado: false, data_dose: "2026-11-04T15:00:00.000Z" }] },
};

/** Sintaxe documentada em B/src/common/dto-normalization.ts:33-47. */
export function isDocumentedDoseInstant(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return false;
  const day = value.slice(0, 10);
  const parsedDay = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(parsedDay.getTime()) && parsedDay.toISOString().slice(0, 10) === day
    && Number.isFinite(Date.parse(value));
}

/** Checks ONLY constraints stated in design; not a backend DTO validator. */
export function documentedTreatmentIssues(
  request: { remedio: Partial<DocumentedRemedioInput> | null; doses: string[] },
  headers: Partial<TreatmentHeaders>,
): string[] {
  const issues: string[] = [];
  const validity = request.remedio?.dataValidade;
  if (typeof validity !== "string" || !isDocumentedDoseInstant(validity)) issues.push("dataValidade");
  for (const field of ["quantidadeDiaria", "quantidadeDias"] as const) {
    const quantity = request.remedio?.[field];
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) issues.push(field);
  }
  if (request.doses.length < 1 || request.doses.length > 1000) issues.push("doses.length");
  if (!request.doses.every(isDocumentedDoseInstant)) issues.push("doses.date");
  if (new Set(request.doses.map((dose) => Date.parse(dose))).size !== request.doses.length) issues.push("doses.uniqueInstant");
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(headers["Idempotency-Key"] ?? "")) issues.push("Idempotency-Key");
  return issues;
}
