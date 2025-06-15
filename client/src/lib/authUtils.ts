export function isUnauthorizedError(error: Error): boolean {
  // Always return false in mock auth mode
  return false;
}