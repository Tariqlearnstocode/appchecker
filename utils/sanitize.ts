/**
 * Input sanitization utilities
 * Prevents XSS, SQL injection attempts, and other malicious input
 */

/**
 * Maximum length for text fields to prevent DoS attacks
 */
const MAX_LENGTHS = {
  name: 255,
  email: 255,
  purpose: 1000,
  company_name: 255,
} as const;

/**
 * Sanitize a text string by:
 * - Removing HTML tags and their content (for dangerous tags like script, style, etc.)
 * - Trimming whitespace
 * - Limiting length
 * - Removing control characters (except newlines for multi-line fields)
 */
export function sanitizeText(input: string | null | undefined, maxLength: number = MAX_LENGTHS.name): string {
  if (!input) return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove null bytes and other control characters (except newlines for multi-line fields)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove dangerous HTML tags and their content (script, style, iframe, etc.)
  const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
    sanitized = sanitized.replace(regex, '');
  });
  
  // Remove any remaining HTML tags (including attributes)
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities (basic ones) to prevent double-encoding
  sanitized = sanitized.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize a name field (shorter, no newlines)
 */
export function sanitizeName(input: string | null | undefined): string {
  if (!input) return '';
  
  let sanitized = sanitizeText(input, MAX_LENGTHS.name);
  
  // Remove newlines for name fields
  sanitized = sanitized.replace(/[\r\n]/g, ' ');
  
  // Collapse multiple spaces into one
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized.trim();
}

/**
 * Sanitize an email address
 * Note: Email validation should still be done separately, this just cleans the input
 */
export function sanitizeEmail(input: string | null | undefined): string {
  if (!input) return '';
  
  // Trim and lowercase
  let sanitized = input.trim().toLowerCase();
  
  // Remove HTML tags first (email shouldn't contain HTML)
  const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
    sanitized = sanitized.replace(regex, '');
  });
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove whitespace
  sanitized = sanitized.replace(/\s/g, '');
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Limit length
  if (sanitized.length > MAX_LENGTHS.email) {
    sanitized = sanitized.substring(0, MAX_LENGTHS.email);
  }
  
  return sanitized;
}

/**
 * Sanitize a purpose/description field (allows newlines, longer)
 */
export function sanitizePurpose(input: string | null | undefined): string {
  if (!input) return '';
  
  return sanitizeText(input, MAX_LENGTHS.purpose);
}

/**
 * Sanitize company name
 */
export function sanitizeCompanyName(input: string | null | undefined): string {
  return sanitizeName(input);
}

/**
 * Escape HTML entities for safe inclusion in HTML emails
 * This should be used when inserting user input into HTML email templates
 */
export function escapeHtml(input: string | null | undefined): string {
  if (!input) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return input.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Sanitize an optional string field (returns empty string if null/undefined)
 */
export function sanitizeOptional(input: string | null | undefined, maxLength: number = MAX_LENGTHS.name): string {
  if (!input) return '';
  return sanitizeText(input, maxLength);
}
