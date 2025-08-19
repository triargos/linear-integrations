import { DateTime } from 'luxon';
import { Event } from '../../src/calendar/calendar-types';
import { expect } from 'vitest';
import { HotlineEvent } from '../../src/hotline-event/hotline-event-types.ts';

export const createMockEvent = (subject: string, dateTime?: string): Event => ({
  id: 'test-event-id',
  subject,
  start: { dateTime: dateTime || DateTime.now().startOf('day').toISO() },
  end: { dateTime: dateTime || DateTime.now().startOf('day').toISO() },
});

export const mockLinearUsers = {
  john: '550e8400-e29b-41d4-a716-446655440000',
  sarah: '660e8400-e29b-41d4-a716-446655440001',
  mike: '770e8400-e29b-41d4-a716-446655440002',
  alex: '880e8400-e29b-41d4-a716-446655440003',
  emma: '990e8400-e29b-41d4-a716-446655440004',
};

export const dates = {
  today: DateTime.now().startOf('day').toISO(),
  tomorrow: DateTime.now().plus({ days: 1 }).startOf('day').toISO(),
  yesterday: DateTime.now().minus({ days: 1 }).startOf('day').toISO(),
};

export const expectUser = (result: HotlineEvent, name: string) => {
  expect(result.assignedUser.shortName).toBe(name);
  expect(result.assignedUser.linearUserId).toBe(
    mockLinearUsers[name as keyof typeof mockLinearUsers]
  );
};

export const expectError = async (promise: Promise<any>) => {
  await expect(promise).rejects.toThrow();
};
