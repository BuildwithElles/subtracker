// Add this temporarily to your Onboarding.tsx for debugging

useEffect(() => {
  console.log('🔍 Onboarding State Debug:', {
    initializing,
    currentUser: !!currentUser,
    hasCheckedUser,
    currentStep,
    isScanning,
    loading,
    searchParams: Object.fromEntries(searchParams.entries()),
  })
}, [initializing, currentUser, hasCheckedUser, currentStep, isScanning, loading, searchParams])

// Add this to the beginning of your component to track renders
console.log('🔄 Onboarding Component Render:', {
  timestamp: new Date().toISOString(),
  initializing,
  currentUser: !!currentUser,
  hasCheckedUser,
  currentStep,
})
