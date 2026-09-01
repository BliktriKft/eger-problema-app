import type { Page } from '@playwright/test';

/**
 * Centralised selectors for test-id values that more than one screen
 * cares about. Keeping them here means a rename in components/*.tsx
 * shows up as a single TS error instead of fan-out across specs.
 */
export const TEST_IDS = {
  mapShell: 'map-shell',
  mapScreen: 'map-screen',
  signInButton: 'sign-in',
  signOutButton: 'sign-out',
  submitFab: 'submit-fab',
  oauthGroup: 'oauth-buttons',
  problemsList: 'problems-list',
  voteButtons: 'vote-buttons',
  voteUp: 'vote-up',
  voteDown: 'vote-down',
  voteScore: 'vote-score',
  submitForm: 'submit-form',
  submitTitle: 'submit-title',
  submitDescription: 'submit-description',
  submitCategoryTrigger: 'submit-category-trigger',
  submitInstitution: 'submit-institution',
  submitCoords: 'submit-coords',
  submitCta: 'submit-cta',
} as const;
export type TestId = (typeof TEST_IDS)[keyof typeof TEST_IDS];
