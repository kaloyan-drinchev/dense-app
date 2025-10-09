// Input sanitization utilities for security

// Basic HTML/script tag removal
export const sanitizeText = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/data:/gi, '') // Remove data: protocols
    .replace(/vbscript:/gi, '') // Remove vbscript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Sanitize user input for AI chat
export const sanitizeUserInput = (input: string): string => {
  const sanitized = sanitizeText(input);
  
  // Additional AI-specific sanitization
  return sanitized
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/['"]/g, '') // Remove quotes that could break JSON
    .substring(0, 1000); // Limit length
};

// Sanitize AI response
export const sanitizeAIResponse = (response: string): string => {
  const sanitized = sanitizeText(response);
  
  // Additional response sanitization
  return sanitized
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/\*\*[^*]*\*\*/g, '') // Remove bold text
    .replace(/\*[^*]*\*/g, '') // Remove italic text
    .substring(0, 2000); // Limit length
};

// Validate and sanitize profile data
export const sanitizeProfileData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const sanitized: any = {};
  
  if (data.name) {
    sanitized.name = sanitizeText(data.name).substring(0, 50);
  }
  
  if (data.email) {
    sanitized.email = sanitizeText(data.email).substring(0, 100);
  }
  
  if (data.goal) {
    sanitized.goal = sanitizeText(data.goal).substring(0, 100);
  }
  
  return sanitized;
};

// Validate numeric inputs
export const validateNumericInput = (value: any, min: number, max: number): number | null => {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return null;
  }
  
  if (num < min || num > max) {
    return null;
  }
  
  return num;
};

// Validate text input length
export const validateTextLength = (text: string, maxLength: number): boolean => {
  return typeof text === 'string' && text.length <= maxLength;
};

// Sanitize search queries
export const sanitizeSearchQuery = (query: string): string => {
  return sanitizeText(query)
    .replace(/[^\w\s]/g, '') // Remove special characters
    .substring(0, 100)
    .trim();
};

// Validate and sanitize workout data
export const sanitizeWorkoutData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const sanitized: any = {};
  
  if (data.name) {
    sanitized.name = sanitizeText(data.name).substring(0, 100);
  }
  
  if (data.description) {
    sanitized.description = sanitizeText(data.description).substring(0, 500);
  }
  
  if (data.notes) {
    sanitized.notes = sanitizeText(data.notes).substring(0, 1000);
  }
  
  return sanitized;
};

// Check for malicious patterns
export const containsMaliciousContent = (input: string): boolean => {
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /data:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /import\s+/i,
    /require\s*\(/i,
  ];
  
  return maliciousPatterns.some(pattern => pattern.test(input));
};

// Comprehensive input validation
export const validateAndSanitizeInput = (input: string, options: {
  maxLength?: number;
  allowHtml?: boolean;
  allowSpecialChars?: boolean;
} = {}): { isValid: boolean; sanitized: string; errors: string[] } => {
  const { maxLength = 1000, allowHtml = false, allowSpecialChars = true } = options;
  const errors: string[] = [];
  
  // Check if input is string
  if (typeof input !== 'string') {
    errors.push('Input must be a string');
    return { isValid: false, sanitized: '', errors };
  }
  
  // Check length
  if (input.length > maxLength) {
    errors.push(`Input too long (max ${maxLength} characters)`);
  }
  
  // Check for malicious content
  if (containsMaliciousContent(input)) {
    errors.push('Input contains potentially malicious content');
  }
  
  // Sanitize based on options
  let sanitized = input;
  
  if (!allowHtml) {
    sanitized = sanitizeText(sanitized);
  }
  
  if (!allowSpecialChars) {
    sanitized = sanitized.replace(/[^\w\s]/g, '');
  }
  
  return {
    isValid: errors.length === 0,
    sanitized: sanitized.substring(0, maxLength),
    errors
  };
};
