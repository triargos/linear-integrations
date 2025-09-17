import { describe, it, expect } from 'vitest';
import { Effect, Schema } from 'effect';
import { FileSystem } from '@effect/platform';
import { CsvRowSchema, CsvParser, ParseCsvRowError } from '../src/csv/parse-csv';
import { expectExitSuccess, expectExitFailure } from './__utils__/expect-exit-failure';

describe('CsvRowSchema', () => {
  it('should parse valid data', async () => {
    const validData: CsvRowSchema = {
      Debitornummer: 123,
      B_Zuordnung: 'Test Company',
      Website: 'example.com',
      E_Mail: 'test@example.com',
      Kinderzahl: 2
    };

    const result = await Effect.runPromiseExit(
      Schema.decodeUnknown(CsvRowSchema)(validData)
    ).then(exit => expectExitSuccess(exit));
    
    expect(result.value.Debitornummer).toBe(123);
    expect(result.value.B_Zuordnung).toBe('Test Company');
    expect(result.value.E_Mail).toBe('test@example.com');
    expect(result.value.Kinderzahl).toBe(2);
  });

  it('should handle optional Kinderzahl', async () => {
    const data: CsvRowSchema = {
      Debitornummer: 123,
      B_Zuordnung: 'Test Company',
      Website: 'example.com',
      E_Mail: 'test@example.com'
    };

    const result = await Effect.runPromiseExit(
      Schema.decodeUnknown(CsvRowSchema)(data)
    ).then(exit => expectExitSuccess(exit));
    
    expect(result.value.Kinderzahl).toBeUndefined();
  });

  it('should reject empty B_Zuordnung', async () => {
    const invalidData = {
      Debitornummer: 123,
      B_Zuordnung: '',
      Website: 'example.com',
      E_Mail: 'test@example.com'
    };

    await Effect.runPromiseExit(
      Schema.decodeUnknown(CsvRowSchema)(invalidData)
    ).then(exit => expectExitFailure(exit));
  });

  it('should reject newlines in fields', async () => {
    const testData = {
      Debitornummer: 123,
      B_Zuordnung: 'Test\nCompany',
      Website: 'example.com',
      E_Mail: 'test@example.com'
    };

    await Effect.runPromiseExit(
      Schema.decodeUnknown(CsvRowSchema)(testData)
    ).then(exit => expectExitFailure(exit));
  });

  it('should reject invalid email format', async () => {
    const data = {
      Debitornummer: 123,
      B_Zuordnung: 'Test Company',
      Website: 'example.com',
      E_Mail: 'invalid-email'
    };

    await Effect.runPromiseExit(
      Schema.decodeUnknown(CsvRowSchema)(data)
    ).then(exit => expectExitFailure(exit));
  });
});

describe('CsvParser', () => {
  const mockCsvContent = `Debitornummer,B_Zuordnung,Website,E_Mail,Kinderzahl
123,Test Company 1,example1.com,test1@example1.com,2
124,Test Company 2,example2.com,test2@example2.com,1`;

  const mockFileSystem = FileSystem.layerNoop({
    readFileString: () => Effect.succeed(mockCsvContent)
  });

  it('should read and parse CSV file', async () => {
    const program = Effect.gen(function* () {
      const csvParser = yield* CsvParser;
      return yield* csvParser.readCustomersFile({ customFilePath: '/valid/path.csv' });
    });

    const result = await Effect.runPromiseExit(
      program.pipe(
        Effect.provide(CsvParser.Default),
        Effect.provide(mockFileSystem)
      )
    ).then(exit => expectExitSuccess(exit));

    expect(result.value).toHaveLength(2);
    expect(result.value[0]).toMatchObject({
      Debitornummer: '123',
      B_Zuordnung: 'Test Company 1',
      E_Mail: 'test1@example1.com'
    });
  });

  it('should parse valid rows successfully', async () => {
    const validRows: CsvRowSchema[] = [
      {
        Debitornummer: 123,
        B_Zuordnung: 'Test Company',
        Website: 'example.com',
        E_Mail: 'test@example.com',
        Kinderzahl: 2
      }
    ];

    const program = Effect.gen(function* () {
      const csvParser = yield* CsvParser;
      return yield* csvParser.parseCsvRows({ rows: validRows });
    });

    const result = await Effect.runPromiseExit(
      program.pipe(
        Effect.provide(CsvParser.Default),
        Effect.provide(mockFileSystem)
      )
    ).then(exit => expectExitSuccess(exit));

    expect(result.value.customers).toHaveLength(1);
    expect(result.value.failedRows).toHaveLength(0);
    expect(result.value.customers[0]).toBeInstanceOf(CsvRowSchema);
  });

  it('should handle mixed valid and invalid rows', async () => {
    const mixedRows = [
      {
        Debitornummer: 123,
        B_Zuordnung: 'Valid Company',
        Website: 'example.com',
        E_Mail: 'test@example.com'
      } as CsvRowSchema,
      {
        Debitornummer: 124,
        B_Zuordnung: '',  // Invalid
        Website: 'example.com',
        E_Mail: 'test@example.com'
      }
    ];

    const program = Effect.gen(function* () {
      const csvParser = yield* CsvParser;
      return yield* csvParser.parseCsvRows({ rows: mixedRows });
    });

    const result = await Effect.runPromiseExit(
      program.pipe(
        Effect.provide(CsvParser.Default),
        Effect.provide(mockFileSystem)
      )
    ).then(exit => expectExitSuccess(exit));

    expect(result.value.customers).toHaveLength(1);
    expect(result.value.failedRows).toHaveLength(1);
    expect(result.value.failedRows[0]).toBeInstanceOf(ParseCsvRowError);
    expect(result.value.failedRows[0].rowIndex).toBe(1);
  });
});