# Batch 2 Acceptance Review

## Acceptance Verdict

Accept as-is.

Batch 2 improves one bounded CRUD-style API slice without drifting into generic framework work. The repeated four-field internal problem contract scaffolding is reduced to one shared internal shape, and the document endpoint now matches the cleaner contract ownership already used in the adjacent binder and tenant-user slices.

## Review Targets

- `src/PaperBinder.Api/PaperBinderApiProblem.cs`
- `src/PaperBinder.Api/PaperBinderBinderProblemMapping.cs`
- `src/PaperBinder.Api/PaperBinderDocumentProblemMapping.cs`
- `src/PaperBinder.Api/PaperBinderTenantUserProblemMapping.cs`
- `src/PaperBinder.Api/PaperBinderDocumentContractModels.cs`
- `src/PaperBinder.Api/PaperBinderDocumentEndpoints.cs`
- `tests/PaperBinder.UnitTests/DocumentDomainAndImmutableDocumentRulesTests.cs`

## Review Questions

For each changed production file, answer:

1. Did the change remove real repetition rather than just moving it?
2. Did the change improve contract organization or readability?
3. Did the change preserve route, failure, and `ProblemDetails` behavior?
4. Did the change avoid introducing a generic or awkward abstraction?
5. Did the batch stay narrow enough?

## Special Scrutiny Areas

### Problem Contract Consolidation

- Confirm that the shared problem contract is only a narrow internal transport shape and not the start of a generic endpoint framework.
- Confirm that feature-specific problem mapping logic remains explicit and domain-shaped.

### Document Contract Organization

- Confirm that moving the remaining document request/response types out of the endpoint file improved ownership clarity.
- Confirm that the document endpoint did not pick up extra abstraction or behavior changes.

### Test Impact

- Confirm that the selected unit and integration slices still cover the changed scaffolding and contract boundaries adequately.

## Per-File Review Notes

### `src/PaperBinder.Api/PaperBinderApiProblem.cs`

- Repetition removed: yes. This file replaces three identical internal problem-contract record definitions with one shared internal transport shape.
- Organization improvement: yes. The shared record makes the repeated scaffolding explicit without changing any feature-specific mapping logic.
- Behavior preservation: preserved. The record only carries values already produced by the mapping functions.
- Abstraction risk: low. This is a narrow record type, not a generic result framework.

### `src/PaperBinder.Api/PaperBinderBinderProblemMapping.cs`

- Repetition removed: yes. The file keeps only binder-specific failure-to-problem mapping logic.
- Organization improvement: yes. The domain mapping remains explicit while the duplicated record definition is removed.
- Behavior preservation: preserved. Status code, title, detail, and error code outputs are unchanged.
- Abstraction risk: none of significance.

### `src/PaperBinder.Api/PaperBinderDocumentProblemMapping.cs`

- Repetition removed: yes. The file now only owns document-specific problem mapping logic.
- Organization improvement: yes. The mapping remains explicit and readable.
- Behavior preservation: preserved. Existing document failure semantics remain intact.
- Abstraction risk: none of significance.

### `src/PaperBinder.Api/PaperBinderTenantUserProblemMapping.cs`

- Repetition removed: yes. The file now owns only tenant-user-specific mapping logic.
- Organization improvement: yes. The change is small but real and keeps the file honest about its responsibility.
- Behavior preservation: preserved.
- Abstraction risk: none of significance.

### `src/PaperBinder.Api/PaperBinderDocumentContractModels.cs`

- Repetition removed: partially. The new `MapList` helper removes one remaining local response-shaping block from the document endpoint.
- Organization improvement: clearly improved. The document request/response contract ownership now matches the adjacent binder and tenant-user slices.
- Behavior preservation: preserved. Request and response shapes did not change.
- Abstraction risk: low. The file remains a straightforward contract-and-mapping file.

### `src/PaperBinder.Api/PaperBinderDocumentEndpoints.cs`

- Repetition removed: yes, in a bounded way. The endpoint no longer owns local document request/response records or a local list-response construction block.
- Organization improvement: improved. The file is more focused on route wiring, command/query orchestration, and failure handling.
- Behavior preservation: preserved.
- Abstraction risk: none introduced.

### `tests/PaperBinder.UnitTests/DocumentDomainAndImmutableDocumentRulesTests.cs`

- Coverage fit: still appropriate. The existing document problem-mapping and response-mapping assertions still validate the changed internal contract and document mapping behavior without requiring test-structure churn.

## Scope-Discipline Findings

- Batch 2 stayed narrow enough.
- The cleanup is limited to one bounded CRUD-style API slice.
- It does not introduce a generic endpoint framework, a cross-layer result model, or a broader architecture refactor.
- It leaves tenant-lease, impersonation, auth, and application-layer outcome/failure cleanup for later.

## Repetition-Cleanup Findings

1. The shared problem contract is justified.
   - Binder, document, and tenant-user problem mappings were carrying identical four-field internal record definitions.
   - Replacing those with one shared internal API problem record removes real duplication without flattening domain-specific mapping logic.

2. The document contract move is justified.
   - The document endpoint was the one remaining adjacent CRUD-style endpoint still owning request/response contract types locally.
   - Moving those into `PaperBinderDocumentContractModels.cs` makes file responsibility more consistent and easier to browse.

## Remaining Implementation Issues

- Similar problem-contract repetition still exists outside this bounded CRUD slice, such as lease and impersonation mappings, but widening into those areas would have turned this into a broader consistency sweep.
- Transcript-style integration test cleanup remains intentionally deferred.

## Recommended Next Action

- Keep the code changes in this batch.
- Defer any further problem-mapping or contract-organization cleanup until the next explicitly scoped batch rather than widening this one post hoc.
