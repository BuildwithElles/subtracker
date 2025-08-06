// Centralized logout utility for consistent session management
import { supabase } from './supabase'

export interface LogoutOptions {
  redirectTo?: string
  clearStorage?: boolean
  forceReload?: boolean
}

/**
 * Comprehensive logout function that ensures complete session cleanup
 */
export const performLogout = async (options: LogoutOptions = {}) => {
  const { redirectTo = '/', clearStorage = true, forceReload = true } = options

  try {
    console.log('🔐 Performing comprehensive logout...')

    // 1. Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Supabase signOut error:', error)
      // Continue with cleanup even if signOut fails
    }

    // 2. Clear browser storage if requested
    if (clearStorage) {
      try {
        localStorage.clear()
        sessionStorage.clear()
        console.log('✅ Browser storage cleared')
      } catch (storageError) {
        console.warn('Could not clear storage:', storageError)
      }

      // 3. Clear IndexedDB (where Supabase stores auth tokens)
      if (window.indexedDB) {
        const databases = ['supabase-auth-token', 'sb-auth-token', 'supabase.auth.token']

        for (const dbName of databases) {
          try {
            indexedDB.deleteDatabase(dbName)
            console.log(`✅ Cleared IndexedDB: ${dbName}`)
          } catch (dbError) {
            console.warn(`Could not clear IndexedDB ${dbName}:`, dbError)
          }
        }
      }
    }

    // 4. Navigate to destination
    if (forceReload) {
      // Hard reload to ensure complete state reset
      window.location.href = redirectTo
    } else {
      // Soft navigation (for React Router)
      window.location.assign(redirectTo)
    }

    console.log('✅ Logout completed successfully')
  } catch (error) {
    console.error('💥 Logout error:', error)

    // Fallback: force navigation anyway
    try {
      window.location.href = redirectTo
    } catch (navError) {
      console.error('Could not navigate after logout error:', navError)
    }
  }
}

/**
 * Quick logout for normal use cases
 */
export const quickLogout = () =>
  performLogout({
    redirectTo: '/',
    clearStorage: false,
    forceReload: false,
  })

/**
 * Emergency logout for corrupted sessions
 */
export const emergencyLogout = () =>
  performLogout({
    redirectTo: '/',
    clearStorage: true,
    forceReload: true,
  })

/**
 * Logout and redirect to a specific page
 */
export const logoutAndRedirect = (path: string) =>
  performLogout({
    redirectTo: path,
    clearStorage: true,
    forceReload: false,
  })
