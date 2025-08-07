/**
 * Test Utilities for Supabase Integration
 * Provides helper functions for E2E testing with Supabase
 */

import { Page } from '@playwright/test'

export interface TestSupabaseClient {
  auth: {
    getSession: () => Promise<any>
    signUp: (credentials: { email: string; password: string }) => Promise<any>
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<any>
    signOut: () => Promise<any>
    onAuthStateChange: (callback: Function) => any
  }
}

/**
 * Ensures Supabase client is available and working in the browser
 */
export async function ensureSupabaseClient(page: Page): Promise<void> {
  // Wait for the page to load and initialize
  await page.waitForLoadState('networkidle')
  
  // Wait for Supabase client to be available
  await page.waitForFunction(() => {
    return typeof (window as any).supabase !== 'undefined' && 
           (window as any).supabase.auth !== undefined
  }, { timeout: 10000 })
}

/**
 * Gets the Supabase client from the browser context
 */
export async function getSupabaseClient(page: Page): Promise<TestSupabaseClient> {
  await ensureSupabaseClient(page)
  
  return await page.evaluate(() => {
    return (window as any).supabase
  })
}

/**
 * Tests Supabase connection and basic functionality
 */
export async function testSupabaseConnection(page: Page): Promise<{
  connected: boolean
  error?: string
  canPerformAuth: boolean
}> {
  try {
    await ensureSupabaseClient(page)
    
    const result = await page.evaluate(async () => {
      try {
        const supabase = (window as any).supabase
        
        // Test basic connection
        const { data, error } = await supabase.auth.getSession()
        
        if (error && error.message.includes('Invalid API key')) {
          return {
            connected: false,
            error: 'Invalid Supabase API key',
            canPerformAuth: false
          }
        }
        
        // Test auth functionality
        try {
          // This should not throw an error even with invalid credentials
          await supabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'invalid'
          })
        } catch (authError) {
          // Auth errors are expected, but the function should exist
        }
        
        return {
          connected: true,
          canPerformAuth: true
        }
      } catch (error) {
        return {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          canPerformAuth: false
        }
      }
    })
    
    return result
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Failed to test connection',
      canPerformAuth: false
    }
  }
}

/**
 * Creates a test user for E2E testing
 */
export async function createTestUser(page: Page, email: string, password: string): Promise<{
  success: boolean
  error?: string
  needsConfirmation?: boolean
}> {
  try {
    await ensureSupabaseClient(page)
    
    return await page.evaluate(async ({ email, password }) => {
      try {
        const supabase = (window as any).supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        })
        
        if (error) {
          return {
            success: false,
            error: error.message
          }
        }
        
        return {
          success: true,
          needsConfirmation: !data.session // No session means email confirmation needed
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, { email, password })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create test user'
    }
  }
}

/**
 * Signs in a test user
 */
export async function signInTestUser(page: Page, email: string, password: string): Promise<{
  success: boolean
  error?: string
  session?: any
}> {
  try {
    await ensureSupabaseClient(page)
    
    return await page.evaluate(async ({ email, password }) => {
      try {
        const supabase = (window as any).supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) {
          return {
            success: false,
            error: error.message
          }
        }
        
        return {
          success: true,
          session: data.session
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, { email, password })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign in test user'
    }
  }
}

/**
 * Cleans up test user session
 */
export async function cleanupTestSession(page: Page): Promise<void> {
  try {
    await page.evaluate(async () => {
      if ((window as any).supabase) {
        await (window as any).supabase.auth.signOut()
      }
      
      // Clear any local storage
      localStorage.clear()
      sessionStorage.clear()
    })
  } catch (error) {
    console.warn('Failed to cleanup test session:', error)
  }
}
