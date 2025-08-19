import { describe, it, expect } from 'vitest';
import { Console, Effect } from 'effect';
import {
  HotlineEventService,
  HotlineEventServiceLive,
  HotlineEventServiceTest,
} from '../../src/hotline-event/hotline-event-service';
import {
  createMockEvent,
  mockLinearUsers,
  dates,
  expectUser,
  expectError,
} from './test-utils';
import { Event } from '../../src/calendar/calendar-types.ts';

describe('HotlineEventService', () => {
  const runService = async (events: Event[], regex: string) => {
    const program = Effect.gen(function* () {
      const service = yield* HotlineEventService;
      return yield* service.getNextAssignableHotlineEvent(
        events,
        mockLinearUsers,
        regex
      );
    });
    return Effect.runPromise(
      program.pipe(Effect.provide(HotlineEventServiceTest))
    );
  };

  describe('README examples with "hotline" regex', () => {
    const regex = 'hotline';

    it('matches "John hotline duty" pattern', async () => {
      const result = await runService(
        [createMockEvent('John hotline duty', dates.today)],
        regex
      );
      expectUser(result, 'john');
    });

    it('matches "hotline Mike coverage" pattern', async () => {
      const result = await runService(
        [createMockEvent('hotline Mike coverage', dates.today)],
        regex
      );
      expectUser(result, 'mike');
    });

    it('handles case insensitive matching', async () => {
      const result = await runService(
        [createMockEvent('SARAH HOTLINE rotation', dates.today)],
        regex
      );
      expectUser(result, 'sarah');
    });

    it('picks earliest future event', async () => {
      const events = [
        createMockEvent('John hotline duty', dates.yesterday),
        createMockEvent('Sarah hotline shift', dates.today),
        createMockEvent('Mike hotline coverage', dates.tomorrow),
      ];
      const result = await runService(events, regex);
      expectUser(result, 'sarah');
    });

    it('matches "MM Hotline" pattern', async () => {
      const users = {
        ...mockLinearUsers,
        mm: '123e4567-e89b-12d3-a456-426614174000',
      };
      const program = Effect.gen(function* () {
        const service = yield* HotlineEventService;
        return yield* service.getNextAssignableHotlineEvent(
          [createMockEvent('MM Hotline', dates.today)],
          users,
          regex
        );
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(HotlineEventServiceTest))
      );
      expect(result.assignedUser.shortName).toBe('mm');
      expect(result.assignedUser.linearUserId).toBe(
        '123e4567-e89b-12d3-a456-426614174000'
      );
    });
  });

  describe('multi-pattern regex "hotline|support"', () => {
    const regex = 'hotline|support';

    it('matches "Support rotation - Sarah" from README', async () => {
      const result = await runService(
        [createMockEvent('Support rotation - Sarah', dates.today)],
        regex
      );
      expectUser(result, 'sarah');
    });

    it('matches both hotline and support events', async () => {
      const events = [
        createMockEvent('John hotline duty', dates.today),
        createMockEvent('Mike support shift', dates.tomorrow),
      ];
      const result = await runService(events, regex);
      expectUser(result, 'john');
    });

    it('matches "support Emma today"', async () => {
      const result = await runService(
        [createMockEvent('support Emma today', dates.today)],
        regex
      );
      expectUser(result, 'emma');
    });
  });

  describe('complex regex "on-call|hotline|support"', () => {
    const regex = 'on-call|hotline|support';

    it('matches "Alex on-call rotation"', async () => {
      const result = await runService(
        [createMockEvent('Alex on-call rotation', dates.today)],
        regex
      );
      expectUser(result, 'alex');
    });

    it('matches "on-call Sarah weekend"', async () => {
      const result = await runService(
        [createMockEvent('on-call Sarah weekend', dates.today)],
        regex
      );
      expectUser(result, 'sarah');
    });
  });

  describe('error cases', () => {
    const regex = 'hotline';

    it('throws when no username matches', async () => {
      await expectError(
        runService(
          [createMockEvent('Unknown hotline duty', dates.today)],
          regex
        )
      );
    });

    it('throws when regex matches but no username found', async () => {
      await expectError(
        runService([createMockEvent('hotline duty today', dates.today)], regex)
      );
    });

    it('throws when no events match regex', async () => {
      const events = [
        createMockEvent('Team meeting', dates.today),
        createMockEvent('John on vacation', dates.today),
      ];
      await expectError(runService(events, regex));
    });

    it('throws when no events exist', async () => {
      await expectError(runService([], regex));
    });

    it('throws when all matching events are past', async () => {
      await expectError(
        runService(
          [createMockEvent('John hotline duty', dates.yesterday)],
          regex
        )
      );
    });
  });

  describe('edge cases', () => {
    const regex = 'hotline';

    it('handles undefined subject', async () => {
      const events = [
        {
          id: 'test',
          subject: undefined,
          start: { dateTime: dates.today },
          end: { dateTime: dates.today },
        },
      ];
      await expectError(runService(events, regex));
    });

    it('handles multiple spaces in event names', async () => {
      const result = await runService(
        [createMockEvent('John  hotline  duty', dates.today)],
        regex
      );
      expectUser(result, 'john');
    });

    it('handles mixed case usernames', async () => {
      const mixedUsers = {
        John: mockLinearUsers.john,
        SARAH: mockLinearUsers.sarah,
      };
      const program = Effect.gen(function* () {
        const service = yield* HotlineEventService;
        return yield* service.getNextAssignableHotlineEvent(
          [createMockEvent('John hotline duty', dates.today)],
          mixedUsers,
          regex
        );
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(HotlineEventServiceLive))
      );
      expect(result.assignedUser.shortName).toBe('john');
    });
  });
});
