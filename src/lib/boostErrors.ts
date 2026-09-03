export function mapBoostError(message: string): string {
  if (message.includes('Insufficient credits')) {
    return 'Insufficient credits — buy more from /pricing#credits';
  }
  if (message.includes('Listing not boostable')) {
    return 'Only active, approved listings you posted can be boosted';
  }
  return message ? `Boost failed: ${message}` : 'Boost failed';
}
