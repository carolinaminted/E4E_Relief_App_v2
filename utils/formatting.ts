/**
 * Formats a phone number string as the user types.
 * It strips invalid characters, enforces a 16-digit limit,
 * and applies US-style formatting. International numbers
 * are returned as a string of digits with a leading '+'.
 */
export function formatPhoneNumber(value: string): string {
    if (!value) {
        return '';
    }

    // 1. Check for international format and clean the input to get only digits.
    const isInternational = value.trim().startsWith('+');
    let digits = value.replace(/[^\d]/g, '');

    // 2. Enforce a 16-digit limit.
    const maxDigits = 16;
    if (digits.length > maxDigits) {
        digits = digits.slice(0, maxDigits);
    }

    // 3. Apply formatting based on whether it's international or US-style.
    if (isInternational) {
        // For international numbers, just return the '+' and the cleaned digits.
        return `+${digits}`;
    }

    // Apply standard US-style formatting: (XXX) XXX-XXXX
    const len = digits.length;
    if (len === 0) return '';
    if (len <= 3) return `(${digits}`;
    if (len <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    
    // Format for 7 to 10 digits.
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}
