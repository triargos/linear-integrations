import {schedules} from "@trigger.dev/sdk/v3";
import {runOutlookSync} from "../main.ts";

export const outlookSyncTask = schedules.task({
    id: "run-outlook-sync",
    // Every hour
    cron: "0 * * * *",
    // Set an optional maxDuration to prevent tasks from running indefinitely
    maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
    run: async (payload, {ctx}) => {
        await runOutlookSync()
    },
});