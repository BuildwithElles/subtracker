/**
 * Environment Configuration Validation
 * Validates that all required environment variables are present and properly formatted
 */

export interface EnvValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  config: {
    supabaseUrl?: string
    supabaseKey?: string
    appUrl?: string
    environment: string
  }
}

/**
 * Validates environment configuration
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Get environment variables
  const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
  const appUrl = import.meta.env.VITE_APP_URL
  const environment = import.meta.env.MODE || 'development'
  
  // Validate Supabase URL
  if (!supabaseUrl) {
    errors.push('VITE_PUBLIC_SUPABASE_URL is required')
  } else {
    try {
      const url = new URL(supabaseUrl)
      if (!url.hostname.includes('supabase.co') && !url.hostname.includes('localhost')) {
        warnings.push('Supabase URL does not appear to be a valid Supabase instance')
      }
    } catch {
      errors.push('VITE_PUBLIC_SUPABASE_URL is not a valid URL')
    }
  }
  
  // Validate Supabase Key
  if (!supabaseKey) {
    errors.push('VITE_PUBLIC_SUPABASE_ANON_KEY is required')
  } else {
    // Basic JWT format validation (should start with 'eyJ')
    if (!supabaseKey.startsWith('eyJ')) {
      warnings.push('VITE_PUBLIC_SUPABASE_ANON_KEY does not appear to be a valid JWT token')
    }
  }
  
  // Validate App URL (optional, with defaults)
  if (!appUrl) {
    warnings.push('VITE_APP_URL not set, using default')
  }
  
  // Environment-specific validations
  if (environment === 'production') {
    if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
      errors.push('Production Supabase URL must use HTTPS')
    }
    
    if (appUrl && !appUrl.startsWith('https://')) {
      warnings.push('Production app URL should use HTTPS')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      supabaseUrl,
      supabaseKey: supabaseKey ? '***' + supabaseKey.slice(-4) : undefined,
      appUrl,
      environment
    }
  }
}

/**
 * Logs environment validation results
 */
export function logEnvironmentStatus(): void {
  const validation = validateEnvironment()
  
  console.group('🔧 Environment Configuration')
  
  if (validation.isValid) {
    console.log('✅ Environment configuration is valid')
  } else {
    console.error('❌ Environment configuration has errors')
  }
  
  console.log('Environment:', validation.config.environment)
  console.log('Supabase URL:', validation.config.supabaseUrl)
  console.log('Supabase Key:', validation.config.supabaseKey)
  console.log('App URL:', validation.config.appUrl)
  
  if (validation.errors.length > 0) {
    console.error('Errors:')
    validation.errors.forEach(error => console.error('  -', error))
  }
  
  if (validation.warnings.length > 0) {
    console.warn('Warnings:')
    validation.warnings.forEach(warning => console.warn('  -', warning))
  }
  
  console.groupEnd()
}

/**
 * Throws an error if environment is not properly configured
 */
export function requireValidEnvironment(): void {
  const validation = validateEnvironment()
  
  if (!validation.isValid) {
    const errorMessage = [
      'Environment configuration is invalid:',
      ...validation.errors.map(error => `  - ${error}`),
      '',
      'Please check your .env file and ensure all required variables are set.',
      'See .env.example for reference.'
    ].join('\n')
    
    throw new Error(errorMessage)
  }
}
