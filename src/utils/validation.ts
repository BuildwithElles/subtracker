/**
 * Form validation utilities
 */

export interface ValidationResult {
  isValid: boolean
  message: string
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, message: 'Email is required' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' }
  }
  
  return { isValid: true, message: '' }
}

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'Password is required' }
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' }
  }
  
  const requirements = []
  if (!/(?=.*[a-z])/.test(password)) requirements.push('one lowercase letter')
  if (!/(?=.*[A-Z])/.test(password)) requirements.push('one uppercase letter')
  if (!/(?=.*\d)/.test(password)) requirements.push('one number')
  
  if (requirements.length > 0) {
    return { 
      isValid: false, 
      message: `Password must contain ${requirements.join(', ')}` 
    }
  }
  
  return { isValid: true, message: '' }
}

export const validatePasswordConfirmation = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, message: 'Please confirm your password' }
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Passwords do not match' }
  }
  
  return { isValid: true, message: '' }
}

export const validateFullName = (fullName: string): ValidationResult => {
  if (!fullName || fullName.trim().length < 2) {
    return { isValid: false, message: 'Full name must be at least 2 characters long' }
  }
  
  return { isValid: true, message: '' }
}

export const getPasswordStrength = (password: string): number => {
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 8) strength++
  if (/(?=.*[a-z])/.test(password)) strength++
  if (/(?=.*[A-Z])/.test(password)) strength++
  if (/(?=.*\d)/.test(password)) strength++
  
  return strength
}

export const getPasswordStrengthLabel = (strength: number): string => {
  switch (strength) {
    case 0: return 'Very Weak'
    case 1: return 'Weak'
    case 2: return 'Fair'
    case 3: return 'Good'
    case 4: return 'Strong'
    default: return 'Unknown'
  }
}

export const getPasswordStrengthColor = (strength: number): string => {
  switch (strength) {
    case 0:
    case 1: return 'text-red-500'
    case 2: return 'text-yellow-500'
    case 3: return 'text-blue-500'
    case 4: return 'text-green-500'
    default: return 'text-gray-500'
  }
}
