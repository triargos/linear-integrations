import {describe, expect, it} from 'vitest';
import {Effect} from 'effect';
import {CustomerSchema, InvalidDomainError, parseCsvRowToCustomer} from '../src/customer/parse-customer';
import {CsvRowSchema} from '../src/csv/parse-csv';
import {expectExitFailure, expectExitSuccess} from './__utils__/expect-exit-failure';

describe('parseCsvRowToCustomer', () => {
    describe('success cases', () => {
        it('should parse domain from email address', async () => {
            const row: CsvRowSchema = {
                Debitornummer: 123,
                B_Zuordnung: 'Test Company',
                Website: '',
                E_Mail: 'test@example.com',
                Kinderzahl: 2
            };
            const result = await Effect.runPromiseExit(
                parseCsvRowToCustomer({row})
            ).then(exit => expectExitSuccess(exit))
            expect(result.value).toBeInstanceOf(CustomerSchema);
            expect(result.value.name).toBe('Test Company');
            expect(result.value.domains).toEqual(['example.com']);
            expect(result.value.childCount).toBe(2);
        });

        it('should not duplicate domains when email and website match', async () => {
            const row: CsvRowSchema = {
                Debitornummer: 123,
                B_Zuordnung: 'Test Company',
                Website: 'example.com',
                E_Mail: 'test@example.com',
                Kinderzahl: 2
            };
            const result = await Effect.runPromiseExit(
                parseCsvRowToCustomer({row})
            ).then(exit => expectExitSuccess(exit))
            expect(result.value.domains).toEqual(['example.com']);
        });

        it('should handle missing childCount', async () => {
            const row: CsvRowSchema = {
                Debitornummer: 123,
                B_Zuordnung: 'Test Company',
                Website: '',
                E_Mail: 'test@example.com'
            };

            const result = await Effect.runPromiseExit(
                parseCsvRowToCustomer({row})
            ).then(exit => expectExitSuccess(exit));

            expect(result.value.childCount).toBeUndefined();
        });
    });

    describe('failure cases', () => {
        it('should fail when both email and website domains are invalid', async () => {
            const row: CsvRowSchema = {
                Debitornummer: 123,
                B_Zuordnung: 'Test Company',
                Website: 'not-a-valid-domain',
                E_Mail: 'test@invalid'
            }
            const result = await Effect.runPromiseExit(
                parseCsvRowToCustomer({row})
            ).then(exit => expectExitFailure(exit))
            expect(result).toBeInstanceOf(InvalidDomainError);
        });

        it('should fail when email domain is invalid and website is empty', async () => {
            const row: CsvRowSchema = {
                Debitornummer: 123,
                B_Zuordnung: 'Test Company',
                Website: '',
                E_Mail: 'test@invalid'
            };

            const result = await Effect.runPromiseExit(
                parseCsvRowToCustomer({row})
            ).then(exit => expectExitFailure(exit));

            expect(result).toBeInstanceOf(InvalidDomainError);
        });
    });
});