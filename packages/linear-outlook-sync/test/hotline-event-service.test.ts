import {describe, expect, it} from 'vitest';
import {Effect} from 'effect';
import {HotlineEventService} from '../src/hotline-event/hotline-event-service';
import {Event, EventDateTime} from '../src/calendar/calendar-types';
import {DateTime} from 'luxon';

describe('HotlineEventService', () => {
    const mockLinearUsers = {
        'MM': 'user-id-1',
        'JOHN': 'user-id-2',
        'JANE': 'user-id-3'
    };

    const createMockEvent = (subject: string, dateTime?: string): Event => {
        const now = DateTime.now();
        return new Event({
            id: 'test-id',
            subject,
            start: new EventDateTime({
                dateTime: dateTime || now.toISO()!
            }),
            end: new EventDateTime({
                dateTime: dateTime || now.plus({hours: 1}).toISO()!
            })
        });
    };

    const runServiceTest = (
        events: Event[],
        eventRegex: RegExp
    ) => {
        const program = Effect.gen(function* () {
            const service = yield* HotlineEventService;
            return yield* service.getNextHotlineEvent({
                events,
                linearUsers: mockLinearUsers,
                eventRegex
            });
        });

        return Effect.provide(program, HotlineEventService.Default);
    };

    describe('getNextHotlineEvent', () => {
        it('should find event with "MM Hotline" when regex is /hotline/i', async () => {
            const events = [
                createMockEvent('MM Hotline'),
                createMockEvent('Regular Meeting'),
                createMockEvent('Another Event')
            ];

            const result = await Effect.runPromise(
                runServiceTest(events, /hotline/i)
            );

            expect(result.linearUserId).toBe('user-id-1');
            expect(result.userName).toBe('mm');
        });

        it('should find event with "Hotline MM" when regex is /hotline/i', async () => {
            const events = [
                createMockEvent('Hotline MM'),
                createMockEvent('Regular Meeting')
            ];

            const result = await Effect.runPromise(
                runServiceTest(events, /hotline/i)
            );

            expect(result.linearUserId).toBe('user-id-1');
            expect(result.userName).toBe('mm');
        });

        it('should find event with "JOHN Support Hotline" when regex is /hotline/i', async () => {
            const events = [
                createMockEvent('JOHN Support Hotline'),
                createMockEvent('Other Meeting')
            ];

            const result = await Effect.runPromise(
                runServiceTest(events, /hotline/i)
            );

            expect(result.linearUserId).toBe('user-id-2');
            expect(result.userName).toBe('john');
        });

        it('should handle case insensitive matching', async () => {
            const events = [
                createMockEvent('mm HOTLINE session'),
                createMockEvent('Other Meeting')
            ];

            const result = await Effect.runPromise(
                runServiceTest(events, /hotline/i)
            );

            expect(result.linearUserId).toBe('user-id-1');
            expect(result.userName).toBe('mm');
        });

        it('should only consider events for today', async () => {
            const yesterday = DateTime.now().minus({days: 1});
            const tomorrow = DateTime.now().plus({days: 1});

            const events = [
                createMockEvent('MM Hotline', yesterday.toISO()!),
                createMockEvent('Future MM Hotline', tomorrow.toISO()!),
                createMockEvent('Other Meeting')
            ];

            await expect(
                Effect.runPromise(runServiceTest(events, /hotline/i))
            ).rejects.toThrow();
        });

        it('should return earliest matching event when multiple exist today', async () => {
            const now = DateTime.now();
            const laterToday = now.plus({hours: 2});

            const events = [
                createMockEvent('JANE Hotline Later', laterToday.toISO()!),
                createMockEvent('MM Hotline Earlier', now.toISO()!),
                createMockEvent('Other Meeting')
            ];

            const result = await Effect.runPromise(
                runServiceTest(events, /hotline/i)
            );

            expect(result.linearUserId).toBe('user-id-1');
            expect(result.userName).toBe('mm');
        });

        it('should throw MissingHotlineEventError when no matching events found', async () => {
            const events = [
                createMockEvent('Regular Meeting'),
                createMockEvent('Another Event')
            ];

            await expect(
                Effect.runPromise(runServiceTest(events, /hotline/i))
            ).rejects.toThrow();
        });

        it('should throw DetermineHotlineUserError when no user found in event subject', async () => {
            const events = [
                createMockEvent('Unknown Person Hotline'),
                createMockEvent('Just Hotline')
            ];

            await expect(
                Effect.runPromise(runServiceTest(events, /hotline/i))
            ).rejects.toThrow();
        });

        it('should work with custom regex patterns', async () => {
            const events = [
                createMockEvent('MM Support Session'),
                createMockEvent('Regular Meeting')
            ];

            const result = await Effect.runPromise(
                runServiceTest(events, /support/i)
            );

            expect(result.linearUserId).toBe('user-id-1');
            expect(result.userName).toBe('mm');
        });

        it('should return earliest event when multiple hotline events with different users exist', async () => {
            const now = DateTime.now();
            const later1 = now.plus({hours: 1});
            const later2 = now.plus({hours: 2});

            const events = [
                createMockEvent('JANE Hotline at 12PM', later2.toISO()!),
                createMockEvent('JOHN Hotline at 11AM', later1.toISO()!),
                createMockEvent('MM Hotline at 10AM', now.toISO()!),
                createMockEvent('Regular Meeting')
            ];

            const result = await Effect.runPromise(
                runServiceTest(events, /hotline/i)
            );

            expect(result.linearUserId).toBe('user-id-1');
            expect(result.userName).toBe('mm');
        });
    });
});