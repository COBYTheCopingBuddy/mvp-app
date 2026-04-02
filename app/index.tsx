import { useEffect, useState } from 'react'
import { ActivityIndicator, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useRootNavigationState } from 'expo-router'
import { getOnboardingRoute } from '../lib/coby'
import { useSession } from '../lib/session'

export default function BootScreen() {
  const router = useRouter()
  const { loading: sessionLoading } = useSession()
  const navState = useRootNavigationState()
  const [route, setRoute] = useState<string | null>(null)

  // Step 1: resolve destination after session is known
  useEffect(() => {
    if (sessionLoading) return
    getOnboardingRoute()
      .then(setRoute)
      .catch((err) => {
        console.error('Failed to resolve route:', err)
        setRoute('/welcome')
      })
  }, [sessionLoading])

  // Step 2: navigate only once the nav container is mounted AND route is resolved
  useEffect(() => {
    if (!navState?.key || route === null) return
    router.replace(route as never)
  }, [navState?.key, route, router])

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#0b1020', alignItems: 'center', justifyContent: 'center' }}
    >
      <ActivityIndicator size="large" color="#ffffff" />
      <Text style={{ marginTop: 16, color: '#ffffff', fontSize: 16 }}>Preparing COBY…</Text>
    </SafeAreaView>
  )
}
