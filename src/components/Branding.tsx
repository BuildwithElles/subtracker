import { TEST_IDS } from '../utils/testIds'

interface BrandingProps {
  size?: 'small' | 'medium' | 'large'
  showTagline?: boolean
  className?: string
}

export function Branding({ size = 'medium', showTagline = true, className = '' }: BrandingProps) {
  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl'
  }

  const taglineClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }

  return (
    <div className={`text-center ${className}`}>
      <h1 
        className={`font-bold text-gray-900 ${sizeClasses[size]}`}
        data-testid={TEST_IDS.APP_TITLE}
      >
        SubTracker
      </h1>
      {showTagline && (
        <p 
          className={`text-gray-600 mt-1 ${taglineClasses[size]}`}
          data-testid={TEST_IDS.APP_TAGLINE}
        >
          Track your subscriptions and manage your budget
        </p>
      )}
    </div>
  )
}

// Logo component for when we have an actual logo
interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      data-testid={TEST_IDS.APP_LOGO}
    >
      {/* Placeholder logo - replace with actual logo when available */}
      <div 
        className="bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        ST
      </div>
    </div>
  )
}
