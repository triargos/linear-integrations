import { Event } from '../calendar/calendar-types';
import { DateTime } from 'luxon';

export function sortEvents(a: Event, b: Event) {
  const aDate = DateTime.fromISO(a.start.dateTime);
  const bDate = DateTime.fromISO(b.start.dateTime);
  return aDate.toMillis() - bDate.toMillis();
}

export function isTodayOrFuture(event: Event) {
  const now = DateTime.now();
  const eventDate = DateTime.fromISO(event.start.dateTime);
  return eventDate.startOf('day') >= now.startOf('day');
}
