/**
 * Ghanaian Phone Number Utilities
 * Formats and validates Ghanaian phone numbers to E.164 standard (+233XXXXXXXXX).
 */

/**
 * Formats Ghanaian phone numbers to E.164 format (+233XXXXXXXXX).
 * Handles inputs like: "0241234567", "241234567", "233241234567", "+233 24 123 4567"
 */
export function formatGhanaPhoneNumber(input: string): string {
  // Remove all non-digit characters
  let digits = input.replace(/\D/g, '');

  // Strip leading zero (e.g., 024XXXXXXX -> 24XXXXXXX)
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // Strip country code if entered without '+' (e.g., 23324XXXXXXX -> 24XXXXXXX)
  if (digits.startsWith('233')) {
    digits = digits.substring(3);
  }

  return `+233${digits}`;
}

/**
 * Validates whether the formatted string is a valid Ghanaian mobile number length.
 * Ghana mobile numbers are 9 digits excluding country code (e.g., 241234567).
 */
export function isValidGhanaPhone(input: string): boolean {
  const formatted = formatGhanaPhoneNumber(input);
  // +233 followed by 9 digits = 13 characters total
  return /^(\+233)[0-9]{9}$/.test(formatted);
}
