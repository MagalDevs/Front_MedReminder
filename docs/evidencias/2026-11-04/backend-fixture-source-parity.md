# BEAPI-12 source parity

Reviewed 2026-11-04 against backend commit `b6b63168ba2a092e6e6350c256bfa15483199b4a` in the isolated checkout. Synthetic fixtures are source-reviewed; runtime response comparison belongs to the separate T12 evidence.

Sources inspected:
- `src/auth/auth.controller.ts`: login returns 200, token at root.
- `src/usuario/dto/usuario-response.dto.ts` and entity: explicit seven-field allowlist with number/string/boolean JSON values; no password/photo.
- `src/common/api-response.ts`: paginated data plus page/limit/total/totalPages; errors include statusCode/message/error and OPTIONAL code.
- `src/dose/dose.service.ts`: legacy dose/me remedy projection has id/nome/foto/motivo/cor/horaInicio/quantidadeDiaria/quantidadeDias/quantidadeDose; remedioId is not selected in this legacy projection.
- `src/remedio/dto/create-remedio.dto.ts`, `src/tratamento/create-tratamento.dto.ts`, `src/dose/dto/create-doses.dto.ts`, `src/common/dto-normalization.ts`: complete synthetic medicine request added; calendar validation, date-only OR explicit-timezone dose strings, millisecond precision, max1000 and duplicate-instant rejection confirmed.
- `src/tratamento/tratamento.service.ts`: key length/charset, account scoping, payload hash/conflict and enveloped remedy/doses response confirmed.

Corrections: optional error code, required error text, concrete pagination metadata and nonempty response examples. Date-only dose strings remain accepted because the backend explicitly supports them. Existing documentedTreatmentIssues checks remain a subset helper, not a replacement backend validator.

Validation: fixture/cadastro/treatment suites 105 passed before two additional account-race treatment cases; TypeScript passed. Runtime tests record their own sanitized evidence.
