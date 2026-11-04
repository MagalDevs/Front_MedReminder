import { describe, expect, expectTypeOf, it } from "vitest";
import {
  BACKEND_CONTRACT_SOURCE, LOGIN_SUCCESS_STATUS, DOSE_QUERY_DEFAULTS, DOSE_QUERY_MAX_LIMIT,
  arrayErrorFixture, stringErrorFixture, loginRequestFixture, loginResponseFixture,
  getProfileFixture, patchProfileFixture, passwordResponseFixture, deleteResponseFixture,
  userFixture, legacyDosesFixture, emptyDosesFixture, paginatedDosesFixture,
  legacyRemediosFixture, myRemediosFixture, treatmentHeadersFixture,
  treatmentRequestFixture, treatmentResponseFixture, documentedTreatmentIssues,
  isDocumentedDoseInstant, TREATMENT_LIMITS,
  type BackendErrorResponse, type LoginResponse, type ProfileResponse,
  type TreatmentResponse, type TreatmentRequest, type MessageResponse,
} from "../fixtures/backend-contracts";

describe("BEAPI-12 contratos documentados do backend (sem prova de API real)", () => {
  it("BEAPI-12 registra revisão de código e comparação de respostas em T12", () => {
    expect(BACKEND_CONTRACT_SOURCE).toEqual({
      commit: "b6b63168ba2a092e6e6350c256bfa15483199b4a",
      checkedAgainst: "backend source at b6b63168ba2a092e6e6350c256bfa15483199b4a",
      verifiedAgainstBackendCode: true, requiresRealResponseComparison: true,
    });
  });

  it("BEAPI-12 login recebe email/senha e retorna token na raiz, status 200", () => {
    expect(Object.keys(loginRequestFixture).sort()).toEqual(["email", "senha"]);
    expect(loginRequestFixture.email).toBe("ana@example.test");
    expect(Object.keys(loginResponseFixture).sort()).toEqual(["access_token", "message"]);
    expect(loginResponseFixture.access_token).toBe("token-sintetico");
    expect(LOGIN_SUCCESS_STATUS).toBe(200);
    expectTypeOf(loginResponseFixture).toEqualTypeOf<LoginResponse>();
    expectTypeOf<LoginResponse>().not.toHaveProperty("data");
  });

  it.each([["GET", getProfileFixture], ["PATCH", patchProfileFixture]] as const)(
    "BEAPI-12 %s perfil mantém allowlist em data e rejeita leitura na raiz",
    (_, fixture) => {
      expect(Object.keys(fixture).sort()).toEqual(["data", "message"]);
      expect(Object.keys(fixture.data).sort()).toEqual(["cep", "cpf", "cuidador", "dataNasc", "email", "id", "nome"]);
      expect(fixture.data.email).toBe("ana@example.test");
      expect(fixture).not.toHaveProperty("nome");
      expect(fixture.data).not.toHaveProperty("senha");
      expect(fixture.data).not.toHaveProperty("foto");
      expectTypeOf(fixture).toEqualTypeOf<ProfileResponse>();
      expectTypeOf<ProfileResponse>().not.toHaveProperty("nome");
    },
  );

  it("BEAPI-12 PATCH altera os valores do usuário dentro do envelope", () => {
    expect(getProfileFixture.data).toEqual(userFixture);
    expect(patchProfileFixture.data.nome).toBe("Ana Atualizada");
    expect(getProfileFixture.data.nome).toBe("Ana Sintética");
  });

  it.each([["senha", passwordResponseFixture], ["exclusão", deleteResponseFixture]] as const)(
    "BEAPI-12 sucesso de %s contém somente message",
    (_, fixture) => {
      expect(Object.keys(fixture)).toEqual(["message"]);
      expect(fixture.message).toEqual(expect.any(String));
      expectTypeOf(fixture).toEqualTypeOf<MessageResponse>();
    },
  );

  it.each([["string", stringErrorFixture, 401], ["array", arrayErrorFixture, 400]] as const)(
    "BEAPI-12 erro message %s preserva code e statusCode",
    (kind, fixture, status) => {
      expect(Object.keys(fixture).sort()).toEqual(["code", "error", "message", "statusCode"]);
      expect(fixture.statusCode).toBe(status);
      expect(fixture.code).toEqual(expect.any(String));
      expect(Array.isArray(fixture.message)).toBe(kind === "array");
      expect([fixture.message].flat().every((message) => typeof message === "string")).toBe(true);
      expectTypeOf<BackendErrorResponse["message"]>().toEqualTypeOf<string | string[]>();
    },
  );

  it("BEAPI-12 doses legadas usam data array; vazias continuam envelopadas", () => {
    expect(Object.keys(legacyDosesFixture).sort()).toEqual(["data", "message"]);
    expect(legacyDosesFixture.data).toHaveLength(1);
    expect(legacyDosesFixture.data[0]).toHaveProperty("remedio");
    expect(Array.isArray(legacyDosesFixture)).toBe(false);
    expect(emptyDosesFixture).toEqual({ message: "Sem doses", data: [] });
  });

  it("BEAPI-12 doses paginadas mantêm envelope e metadata do servidor", () => {
    expect(Object.keys(paginatedDosesFixture).sort()).toEqual(["data", "message", "pagination"]);
    expect(paginatedDosesFixture.data).toEqual(legacyDosesFixture.data);
    expect(paginatedDosesFixture.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    expect(DOSE_QUERY_DEFAULTS).toEqual({ page: 1, limit: 20, order: "ASC" });
    expect(DOSE_QUERY_MAX_LIMIT).toBe(100);
  });

  it("BEAPI-12 remédios distinguem array raiz de /remedio e envelope de /remedio/me", () => {
    expect(legacyRemediosFixture).toEqual([]);
    expect(myRemediosFixture).toEqual({ message: "Sem remédios", data: [] });
  });

  it("BEAPI-12 tratamento tem request remedio/doses, header e resposta data.remedio/data.doses", () => {
    expect(Object.keys(treatmentRequestFixture).sort()).toEqual(["doses", "remedio"]);
    expect(Object.keys(treatmentResponseFixture).sort()).toEqual(["data", "message"]);
    expect(Object.keys(treatmentResponseFixture.data).sort()).toEqual(["doses", "remedio"]);
    expect(treatmentResponseFixture.data.doses).toHaveLength(1);
    expect(treatmentResponseFixture).not.toHaveProperty("remedio");
    expect(documentedTreatmentIssues(treatmentRequestFixture, treatmentHeadersFixture)).toEqual([]);
    expect(TREATMENT_LIMITS).toEqual({ minDoses: 1, maxDoses: 1000, maxKeyLength: 128 });
    expectTypeOf(treatmentRequestFixture).toEqualTypeOf<TreatmentRequest>();
    expectTypeOf(treatmentResponseFixture).toEqualTypeOf<TreatmentResponse>();
    expectTypeOf<TreatmentResponse>().not.toHaveProperty("remedio");
  });

  it.each([0, 1, 1000, 1001])("BEAPI-12 fronteira de %i doses", (count) => {
    const doses = Array.from({ length: count }, (_, index) => new Date(Date.UTC(2026, 10, 4, 15, index)).toISOString());
    const issues = documentedTreatmentIssues({ ...treatmentRequestFixture, doses }, treatmentHeadersFixture);
    expect(issues).toEqual(count === 0 || count === 1001 ? ["doses.length"] : []);
  });

  it("BEAPI-12 duplicidade é por instante, inclusive offsets diferentes e virada de dia", () => {
    const doses = ["2026-11-04T23:30:00-03:00", "2026-11-05T02:30:00Z"];
    expect(doses[0]).not.toBe(doses[1]);
    expect(Date.parse(doses[0])).toBe(Date.parse(doses[1]));
    expect(documentedTreatmentIssues({ ...treatmentRequestFixture, doses }, treatmentHeadersFixture)).toEqual(["doses.uniqueInstant"]);
  });

  it.each([undefined, null, "", "inválida", "2026-02-30"])(
    "BEAPI-12 validade ausente/inválida %s não satisfaz contrato documentado", (value) => {
      // JSON inválido de propósito; não ampliar o DTO para aceitar null.
      const remedio = { ...treatmentRequestFixture.remedio, dataValidade: value };
      // @ts-expect-error fronteira inválida null/undefined não pertence ao DTO.
      expect(documentedTreatmentIssues({ remedio, doses: treatmentRequestFixture.doses }, treatmentHeadersFixture)).toContain("dataValidade");
    },
  );

  it.each(["2026-11-04", "2026-11-04T15:00:00Z", "2026-11-04T12:00:00.123-03:00"])(
    "BEAPI-12 aceita instante documentado %s", (value) => expect(isDocumentedDoseInstant(value)).toBe(true),
  );
  it.each(["inválida", "2026-02-30", "2026-11-04T12:00:00", "2026-11-04T12:00:00.1234Z"])(
    "BEAPI-12 rejeita instante fora do formato %s", (value) => {
      expect(isDocumentedDoseInstant(value)).toBe(false);
      expect(documentedTreatmentIssues({ ...treatmentRequestFixture, doses: [value] }, treatmentHeadersFixture)).toContain("doses.date");
    },
  );

  it.each([0, -1, 1.5, NaN])("BEAPI-12 quantidades devem ser inteiros positivos: %s", (quantity) => {
    const remedio = { ...treatmentRequestFixture.remedio, quantidadeDiaria: quantity, quantidadeDias: quantity };
    expect(documentedTreatmentIssues({ ...treatmentRequestFixture, remedio }, treatmentHeadersFixture)).toEqual(["quantidadeDiaria", "quantidadeDias"]);
  });

  it.each([["a", true], ["A0._:-", true], ["a".repeat(128), true], ["a".repeat(129), false], ["", false], ["com espaço", false], ["á", false]])(
    "BEAPI-12 chave de idempotência %s válida=%s", (key, valid) => {
      const issues = documentedTreatmentIssues(treatmentRequestFixture, { "Idempotency-Key": key as string });
      expect(issues.includes("Idempotency-Key")).toBe(!valid);
    },
  );
  it("BEAPI-12 header Idempotency-Key é obrigatório", () => {
    expect(documentedTreatmentIssues(treatmentRequestFixture, {})).toEqual(["Idempotency-Key"]);
  });
});

it('BEAPI-12 resposta de erro sem code satisfaz contrato real', () => {
  const validation: BackendErrorResponse = { statusCode: 400, message: ['Campo invalido'], error: 'Bad Request' };
  expect(validation).not.toHaveProperty('code');
  expectTypeOf<BackendErrorResponse['code']>().toEqualTypeOf<string | undefined>();
});
