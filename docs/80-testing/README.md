# Testing Lane Guide

## AI Summary

- This lane defines testing strategy, standards, and test-type responsibilities.
- Priority is deterministic enforcement of tenancy, authorization, and lifecycle invariants.
- Start from strategy and standards, then drill into unit/integration/e2e docs.

## Read First

- `docs/80-testing/test-strategy.md`
- `docs/80-testing/testing-standards.md`

## Repo-Native Commands

- Full test pass: `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1`
- Focused frontend tests: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1`
- Focused integration tests: `powershell -ExecutionPolicy Bypass -File .\scripts\test-integration.ps1`

## Test-Type Guides

- `docs/80-testing/unit-tests.md`
- `docs/80-testing/integration-tests.md`
- `docs/80-testing/e2e-tests.md`
- `docs/80-testing/test-data.md`
