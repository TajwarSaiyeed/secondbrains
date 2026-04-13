/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as audit from "../audit.js";
import type * as auth2fa from "../auth2fa.js";
import type * as boards from "../boards.js";
import type * as discussions from "../discussions.js";
import type * as embeddings from "../embeddings.js";
import type * as files from "../files.js";
import type * as globalSearch from "../globalSearch.js";
import type * as http from "../http.js";
import type * as inngestTrigger from "../inngestTrigger.js";
import type * as invites from "../invites.js";
import type * as links from "../links.js";
import type * as notes from "../notes.js";
import type * as notifications from "../notifications.js";
import type * as presence from "../presence.js";
import type * as scrape from "../scrape.js";
import type * as search from "../search.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  audit: typeof audit;
  auth2fa: typeof auth2fa;
  boards: typeof boards;
  discussions: typeof discussions;
  embeddings: typeof embeddings;
  files: typeof files;
  globalSearch: typeof globalSearch;
  http: typeof http;
  inngestTrigger: typeof inngestTrigger;
  invites: typeof invites;
  links: typeof links;
  notes: typeof notes;
  notifications: typeof notifications;
  presence: typeof presence;
  scrape: typeof scrape;
  search: typeof search;
  teams: typeof teams;
  users: typeof users;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
};
