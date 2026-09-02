// apps/mobile/lib/api-error.ts
//
// Lightweight error class used by `lib/api.ts` AND `lib/mock.ts`.  Lives
// in its own module so unit tests can import the mock without dragging
// in `expo-secure-store` (which Jest can't transform without the Expo
// jest preset).

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
