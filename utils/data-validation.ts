// Comprehensive data validation utilities

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

// Validate user profile data
export const validateProfileData = (data: any): ValidationResult => {
  const errors: string[] = [];
  const sanitized: any = {};

  // Validate name
  if (data.name) {
    if (typeof data.name !== 'string') {
      errors.push('Name must be a string');
    } else if (data.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    } else if (data.name.length > 50) {
      errors.push('Name must be less than 50 characters');
    } else {
      sanitized.name = data.name.trim();
    }
  }

  // Validate email
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    } else {
      sanitized.email = data.email.toLowerCase().trim();
    }
  }

  // Validate age
  if (data.age) {
    const age = parseInt(data.age);
    if (isNaN(age) || age < 13 || age > 120) {
      errors.push('Age must be between 13 and 120');
    } else {
      sanitized.age = age;
    }
  }

  // Validate weight
  if (data.weight) {
    const weight = parseFloat(data.weight);
    if (isNaN(weight) || weight < 20 || weight > 500) {
      errors.push('Weight must be between 20 and 500 kg');
    } else {
      sanitized.weight = weight;
    }
  }

  // Validate height
  if (data.height) {
    const height = parseFloat(data.height);
    if (isNaN(height) || height < 100 || height > 250) {
      errors.push('Height must be between 100 and 250 cm');
    } else {
      sanitized.height = height;
    }
  }

  // Validate body fat
  if (data.bodyFat) {
    const bodyFat = parseFloat(data.bodyFat);
    if (isNaN(bodyFat) || bodyFat < 0 || bodyFat > 50) {
      errors.push('Body fat must be between 0 and 50%');
    } else {
      sanitized.bodyFat = bodyFat;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined
  };
};

// Validate workout data
export const validateWorkoutData = (data: any): ValidationResult => {
  const errors: string[] = [];
  const sanitized: any = {};

  // Validate workout name
  if (data.name) {
    if (typeof data.name !== 'string') {
      errors.push('Workout name must be a string');
    } else if (data.name.length < 3) {
      errors.push('Workout name must be at least 3 characters');
    } else if (data.name.length > 100) {
      errors.push('Workout name must be less than 100 characters');
    } else {
      sanitized.name = data.name.trim();
    }
  }

  // Validate duration
  if (data.duration) {
    const duration = parseInt(data.duration);
    if (isNaN(duration) || duration < 1 || duration > 480) {
      errors.push('Duration must be between 1 and 480 minutes');
    } else {
      sanitized.duration = duration;
    }
  }

  // Validate exercises
  if (data.exercises && Array.isArray(data.exercises)) {
    const validExercises = data.exercises.filter((exercise: any) => {
      return exercise && 
             typeof exercise.name === 'string' && 
             exercise.name.length > 0 &&
             typeof exercise.sets === 'number' &&
             exercise.sets > 0;
    });
    
    if (validExercises.length !== data.exercises.length) {
      errors.push('Some exercises have invalid data');
    }
    
    sanitized.exercises = validExercises;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined
  };
};

// Validate nutrition data
export const validateNutritionData = (data: any): ValidationResult => {
  const errors: string[] = [];
  const sanitized: any = {};

  // Validate food name
  if (data.name) {
    if (typeof data.name !== 'string') {
      errors.push('Food name must be a string');
    } else if (data.name.length < 2) {
      errors.push('Food name must be at least 2 characters');
    } else if (data.name.length > 100) {
      errors.push('Food name must be less than 100 characters');
    } else {
      sanitized.name = data.name.trim();
    }
  }

  // Validate calories
  if (data.calories) {
    const calories = parseFloat(data.calories);
    if (isNaN(calories) || calories < 0 || calories > 10000) {
      errors.push('Calories must be between 0 and 10000');
    } else {
      sanitized.calories = calories;
    }
  }

  // Validate macros
  const macroFields = ['protein', 'carbs', 'fat', 'fiber'];
  macroFields.forEach(field => {
    if (data[field] !== undefined) {
      const value = parseFloat(data[field]);
      if (isNaN(value) || value < 0 || value > 1000) {
        errors.push(`${field} must be between 0 and 1000g`);
      } else {
        sanitized[field] = value;
      }
    }
  });

  // Validate quantity
  if (data.quantity) {
    const quantity = parseFloat(data.quantity);
    if (isNaN(quantity) || quantity <= 0 || quantity > 10000) {
      errors.push('Quantity must be between 0 and 10000');
    } else {
      sanitized.quantity = quantity;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined
  };
};

// Validate AI chat input
export const validateChatInput = (message: string): ValidationResult => {
  const errors: string[] = [];

  if (!message || typeof message !== 'string') {
    errors.push('Message is required');
  } else if (message.trim().length === 0) {
    errors.push('Message cannot be empty');
  } else if (message.length > 1000) {
    errors.push('Message must be less than 1000 characters');
  } else if (message.length < 3) {
    errors.push('Message must be at least 3 characters');
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /eval\s*\(/i,
    /import\s+/i,
    /require\s*\(/i,
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(message))) {
    errors.push('Message contains potentially harmful content');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? message.trim() : undefined
  };
};

// Validate file upload data
export const validateFileUpload = (file: any): ValidationResult => {
  const errors: string[] = [];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }

  if (!file.uri) {
    errors.push('File URI is required');
  }

  if (file.fileSize && file.fileSize > 10 * 1024 * 1024) { // 10MB
    errors.push('File size must be less than 10MB');
  }

  if (file.mimeType) {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/mov',
      'video/avi'
    ];
    
    if (!allowedTypes.includes(file.mimeType)) {
      errors.push('File type not supported');
    }
  }

  if (file.fileName) {
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js'];
    const extension = file.fileName.toLowerCase().substring(file.fileName.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(extension)) {
      errors.push('File type not allowed for security reasons');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generic data validation
export const validateData = (data: any, schema: any): ValidationResult => {
  const errors: string[] = [];
  const sanitized: any = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const fieldRules = rules as any;

    // Required field check
    if (fieldRules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    if (fieldRules.type && typeof value !== fieldRules.type) {
      errors.push(`${field} must be of type ${fieldRules.type}`);
      continue;
    }

    // String length validation
    if (fieldRules.type === 'string') {
      if (fieldRules.minLength && value.length < fieldRules.minLength) {
        errors.push(`${field} must be at least ${fieldRules.minLength} characters`);
      }
      if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
        errors.push(`${field} must be less than ${fieldRules.maxLength} characters`);
      }
      sanitized[field] = value.trim();
    }

    // Number validation
    if (fieldRules.type === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        errors.push(`${field} must be a valid number`);
      } else {
        if (fieldRules.min !== undefined && num < fieldRules.min) {
          errors.push(`${field} must be at least ${fieldRules.min}`);
        }
        if (fieldRules.max !== undefined && num > fieldRules.max) {
          errors.push(`${field} must be at most ${fieldRules.max}`);
        }
        sanitized[field] = num;
      }
    }

    // Array validation
    if (fieldRules.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${field} must be an array`);
      } else {
        if (fieldRules.minItems && value.length < fieldRules.minItems) {
          errors.push(`${field} must have at least ${fieldRules.minItems} items`);
        }
        if (fieldRules.maxItems && value.length > fieldRules.maxItems) {
          errors.push(`${field} must have at most ${fieldRules.maxItems} items`);
        }
        sanitized[field] = value;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined
  };
};

// Common validation schemas
export const VALIDATION_SCHEMAS = {
  profile: {
    name: { type: 'string', required: true, minLength: 2, maxLength: 50 },
    email: { type: 'string', required: false, maxLength: 100 },
    age: { type: 'number', required: false, min: 13, max: 120 },
    weight: { type: 'number', required: false, min: 20, max: 500 },
    height: { type: 'number', required: false, min: 100, max: 250 },
    bodyFat: { type: 'number', required: false, min: 0, max: 50 }
  },
  
  workout: {
    name: { type: 'string', required: true, minLength: 3, maxLength: 100 },
    duration: { type: 'number', required: false, min: 1, max: 480 },
    exercises: { type: 'array', required: false, minItems: 1, maxItems: 50 }
  },
  
  nutrition: {
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    calories: { type: 'number', required: false, min: 0, max: 10000 },
    protein: { type: 'number', required: false, min: 0, max: 1000 },
    carbs: { type: 'number', required: false, min: 0, max: 1000 },
    fat: { type: 'number', required: false, min: 0, max: 1000 },
    quantity: { type: 'number', required: false, min: 0.1, max: 10000 }
  }
};
