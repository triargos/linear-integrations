import { describe, it, expect } from 'vitest';
import { Effect } from 'effect';
import { parseCsvRowToCustomer, CustomerSchema, InvalidDomainError } from '../src/customer/parse-customer.ts';
import { CsvRowSchema } from '../src/csv/parse-csv.ts';
import { expectExitSuccess, expectExitFailure } from './__utils__/expect-exit-failure.ts';

describe('parseCsvRowToCustomer', () => {
  describe('success cases', () => {
    it('should parse a valid CSV row with simple domain', async () => {
      const row = new CsvRowSchema({
        B_Zuordnung: 'Test Company',
        Website: 'example.com',
        E_Mail: 'test@example.com',
        Kinderzahl: 2
      });
      const result = await Effect.runPromiseExit(
          parseCsvRowToCustomer({row})
      ).then(exit => expectExitSuccess(exit))
      expect(result.value).toBeInstanceOf(CustomerSchema);
      expect(result.value.name).toBe('Test Company');
      expect(result.value.domains).toEqual(['example.com']);
      expect(result.value.childCount).toBe(2);
    });

    it('should remove https protocol from domain', async () => {
      const row = new CsvRowSchema({
        B_Zuordnung: 'Test Company',
        Website: 'https://example.com',
        E_Mail: 'test@example.com'
      });

      const result = await Effect.runPromiseExit(
        parseCsvRowToCustomer({ row })
      ).then(exit => expectExitSuccess(exit));
      
      expect(result.value.domains).toEqual(['example.com']);
    });

    it('should remove http protocol from domain', async () => {
      const row = new CsvRowSchema({
        B_Zuordnung: 'Test Company',
        Website: 'http://example.com',
        E_Mail: 'test@example.com'
      });

      const result = await Effect.runPromiseExit(
        parseCsvRowToCustomer({ row })
      ).then(exit => expectExitSuccess(exit));
      
      expect(result.value.domains).toEqual(['example.com']);
    });

    it('should remove www prefix from domain', async () => {
      const row = new CsvRowSchema({
        B_Zuordnung: 'Test Company',
        Website: 'www.example.com',
        E_Mail: 'test@example.com'
      });

      const result = await Effect.runPromiseExit(
        parseCsvRowToCustomer({ row })
      ).then(exit => expectExitSuccess(exit));
      
      expect(result.value.domains).toEqual(['example.com']);
    });

    it('should remove trailing slashes from domain', async () => {
      const row = new CsvRowSchema({
        B_Zuordnung: 'Test Company',
        Website: 'example.com/',
        E_Mail: 'test@example.com'
      });

      const result = await Effect.runPromiseExit(
        parseCsvRowToCustomer({ row })
      ).then(exit => expectExitSuccess(exit));
      
      expect(result.value.domains).toEqual(['example.com']);
    });

    it('should handle complex website URL and clean it properly', async () => {
      const row = new CsvRowSchema({
        B_Zuordnung: 'Test Company',
        Website: 'https://www.example.com/',
        E_Mail: 'test@example.com'
      });

      const result = await Effect.runPromiseExit(
        parseCsvRowToCustomer({ row })
      ).then(exit => expectExitSuccess(exit));
      
      expect(result.value.domains).toEqual(['example.com']);
    });

    it('should convert domain to lowercase', async () => {
      const row = new CsvRowSchema({
        B_Zuordnung: 'Test Company',
        Website: 'EXAMPLE.COM',
        E_Mail: 'test@example.com'
      });

      const result = await Effect.runPromiseExit(
        parseCsvRowToCustomer({ row })
      ).then(exit => expectExitSuccess(exit));
      
      expect(result.value.domains).toEqual(['example.com']);
    });

    it('should fail with InvalidDomainError for empty website field', async () => {
      const row = new CsvRowSchema({
        B_Zuordnung: 'Test Company',
        Website: '',
        E_Mail: 'test@example.com'
      });

      const result = await Effect.runPromiseExit(
        parseCsvRowToCustomer({ row })
      ).then(exit => expectExitFailure(exit));
      
      expect(result).toBeInstanceOf(InvalidDomainError);
    });

    it('should handle missing childCount', async () => {
      const row = new CsvRowSchema({
        B_Zuordnung: 'Test Company',
        Website: 'example.com',
        E_Mail: 'test@example.com'
      });

      const result = await Effect.runPromiseExit(
        parseCsvRowToCustomer({ row })
      ).then(exit => expectExitSuccess(exit));
      
      expect(result.value.childCount).toBeUndefined();
    });
  });

  describe('failure cases', () => {
    it('should fail with InvalidDomainError for invalid domain format', async () => {
      const row = new CsvRowSchema({
        B_Zuordnung: 'Test Company',
        Website: 'not-a-valid-domain',
        E_Mail: 'test@example.com'
      });

      const result = await Effect.runPromiseExit(
        parseCsvRowToCustomer({ row })
      ).then(exit => expectExitFailure(exit));
      
      expect(result).toBeInstanceOf(InvalidDomainError);
    });

    it('should fail with InvalidDomainError for domain with invalid characters', async () => {
      const row = new CsvRowSchema({
        B_Zuordnung: 'Test Company',
        Website: 'example..com',
        E_Mail: 'test@example.com'
      });

      const result = await Effect.runPromiseExit(
        parseCsvRowToCustomer({ row })
      ).then(exit => expectExitFailure(exit));

      expect(result).toBeInstanceOf(InvalidDomainError);
    });

    it('should fail with InvalidDomainError for domain starting with hyphen', async () => {
      const row = new CsvRowSchema({
        B_Zuordnung: 'Test Company',
        Website: '-example.com',
        E_Mail: 'test@example.com'
      });

      const result = await Effect.runPromiseExit(
        parseCsvRowToCustomer({ row })
      ).then(exit => expectExitFailure(exit));
      
      expect(result).toBeInstanceOf(InvalidDomainError);
    });

    it('should fail with InvalidDomainError for domain ending with hyphen', async () => {
      const row = new CsvRowSchema({
        B_Zuordnung: 'Test Company',
        Website: 'example-.com',
        E_Mail: 'test@example.com'
      });

      const result = await Effect.runPromiseExit(
        parseCsvRowToCustomer({ row })
      ).then(exit => expectExitFailure(exit));
      
      expect(result).toBeInstanceOf(InvalidDomainError);
    });
  });
});