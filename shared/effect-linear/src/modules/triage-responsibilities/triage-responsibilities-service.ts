import { Effect } from 'effect';
import {
  CreateTriageResponsibilityOptions,
  TriageResponsibilityIdOptions,
  UpdateTriageResponsibilityOptions,
} from './triage-responsibilities-schemas.ts';
import {
  CreateTriageResponsibilityError,
  DeleteTriageResponsibilityError,
  FindTriageResponsibilityError,
  ListTriageResponsibilitiesError,
  UpdateTriageResponsibilityError,
} from './triage-responsibilities-errors.ts';
import { LinearClientWrapper } from '../../internal/client-wrapper.ts';

/**
 *
 * Manages Linear triage responsibilities that automate assignment and notification
 * of team members for new issues.
 */
export class LinearTriageResponsibilities extends Effect.Service<LinearTriageResponsibilities>()(
  'LinearTriageResponsibilities',
  {
    effect: Effect.gen(function* () {
      const client = yield* LinearClientWrapper;
      return {
        /**
         * Retrieves all triage responsibilities from Linear.
         */
        list: Effect.fn('triageResponsibilities.list')(function* () {
          return yield* client
            .use(linearClient => linearClient.triageResponsibilities())
            .pipe(
              Effect.map(list => list.nodes),
              Effect.mapError(
                error => new ListTriageResponsibilitiesError({ error })
              )
            );
        }),

        /**
         * Finds a specific triage responsibility by its unique ID.
         */
        findById: Effect.fn('triageResponsibilities.findById')(function* (
          options: TriageResponsibilityIdOptions
        ) {
          return yield* client
            .use(linearClient => linearClient.triageResponsibility(options.id))
            .pipe(
              Effect.mapError(
                error =>
                  new FindTriageResponsibilityError({ id: options.id, error })
              )
            );
        }),

        /**
         * Creates a new triage responsibility configuration.
         */
        create: Effect.fn('triageResponsibilities.create')(function* (
          options: CreateTriageResponsibilityOptions
        ) {
          return yield* client
            .use(linearClient =>
              linearClient.createTriageResponsibility({
                teamId: options.teamId,
                action: options.action,
                ...(options.users && {
                  manualSelection: { userIds: options.users },
                }),
              })
            )
            .pipe(
              Effect.mapError(
                error =>
                  new CreateTriageResponsibilityError({
                    error,
                    input: options,
                  })
              )
            );
        }),

        /**
         * Updates an existing triage responsibility configuration.
         */
        update: Effect.fn('triageResponsibilities.update')(function* (
          options: UpdateTriageResponsibilityOptions
        ) {
          return yield* client
            .use(linearClient =>
              linearClient.updateTriageResponsibility(options.id, {
                action: options.action,
                ...(options.users && {
                  manualSelection: { userIds: options.users },
                }),
              })
            )
            .pipe(
              Effect.mapError(
                error =>
                  new UpdateTriageResponsibilityError({
                    error,
                    input: options,
                    id: options.id,
                  })
              )
            );
        }),

        /**
         * Deletes an existing triage responsibility configuration.
         */
        delete: Effect.fn('triageResponsibilities.delete')(function* (
          options: TriageResponsibilityIdOptions
        ) {
          return yield* client
            .use(linearClient =>
              linearClient.deleteTriageResponsibility(options.id)
            )
            .pipe(
              Effect.mapError(
                error =>
                  new DeleteTriageResponsibilityError({
                    error,
                    id: options.id,
                  })
              )
            );
        }),
      } as const;
    }),
  }
) {}
