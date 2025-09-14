/**
 * Input validation and sanitization utilities
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const sanitized = sanitizeString(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) {
    errors.push('Invalid email format');
  }

  if (sanitized.length > 254) {
    errors.push('Email is too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized.toLowerCase()
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password is too long');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: password
  };
}

/**
 * Validate prompt text for AI generation
 */
export function validatePrompt(prompt: string): ValidationResult {
  const errors: string[] = [];

  if (!prompt || typeof prompt !== 'string') {
    errors.push('Prompt is required');
    return { isValid: false, errors };
  }

  const sanitized = sanitizeString(prompt);

  if (sanitized.length < 10) {
    errors.push('Prompt must be at least 10 characters long');
  }

  if (sanitized.length > 2000) {
    errors.push('Prompt is too long (maximum 2000 characters)');
  }

  // Check for potentially harmful content patterns
  const harmfulPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(sanitized)) {
      errors.push('Prompt contains potentially harmful content');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * Validate numeric input within range
 */
export function validateNumber(
  value: any,
  options: {
    min?: number;
    max?: number;
    required?: boolean;
    fieldName?: string;
  } = {}
): ValidationResult {
  const { min, max, required = true, fieldName = 'Value' } = options;
  const errors: string[] = [];

  if (required && (value === null || value === undefined || value === '')) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  const numValue = Number(value);

  if (isNaN(numValue)) {
    errors.push(`${fieldName} must be a valid number`);
    return { isValid: false, errors };
  }

  if (min !== undefined && numValue < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined && numValue > max) {
    errors.push(`${fieldName} must be at most ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: numValue
  };
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];

  if (!url || typeof url !== 'string') {
    errors.push('URL is required');
    return { isValid: false, errors };
  }

  const sanitized = sanitizeString(url);

  try {
    const urlObj = new URL(sanitized);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('URL must use HTTP or HTTPS protocol');
    }

    // Prevent localhost in production
    if (process.env.NODE_ENV === 'production' &&
        (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
      errors.push('Localhost URLs are not allowed in production');
    }

  } catch {
    errors.push('Invalid URL format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitized
  };
}

/**
 * General input sanitization for form data
 */
export function sanitizeFormData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeFormData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
