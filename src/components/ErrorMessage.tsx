import React from 'react'

interface ErrorMessageProps {
  message: string
  className?: string
  'data-testid'?: string
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  className = '', 
  'data-testid': testId 
}) => {
  if (!message) return null

  return (
    <div 
      className={`error text-red-500 text-sm mt-1 flex items-center ${className}`}
      role="alert"
      data-testid={testId}
      aria-live="polite"
    >
      <svg 
        className="h-4 w-4 mr-1 flex-shrink-0" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
      {message}
    </div>
  )
}

interface SuccessMessageProps {
  message: string
  className?: string
  'data-testid'?: string
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ 
  message, 
  className = '', 
  'data-testid': testId 
}) => {
  if (!message) return null

  return (
    <div 
      className={`success text-green-600 text-sm mt-1 flex items-center ${className}`}
      role="status"
      data-testid={testId}
      aria-live="polite"
    >
      <svg 
        className="h-4 w-4 mr-1 flex-shrink-0" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M5 13l4 4L19 7" 
        />
      </svg>
      {message}
    </div>
  )
}
