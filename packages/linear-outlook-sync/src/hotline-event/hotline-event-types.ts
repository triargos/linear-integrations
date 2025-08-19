import { DateTime } from 'luxon';

export interface AssignedUser {
  shortName: string;
  linearUserId: string;
}

export interface HotlineEvent {
  assignedUser: AssignedUser;
  date: DateTime;
}
