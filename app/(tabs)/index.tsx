import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { getDashboardData } from '../../lib/coby'

type DashboardState = Awaited<ReturnType<typeof getDashboardData>> | null

export default function HomeTab() {
  const router = useRouter()
  const [data, setData] = useState<DashboardState>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true)
      else setLoading(true)
      setData(await getDashboardData())
    } catch (error) {
      console.error('Failed to load dashboard', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading && !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </SafeAreaView>
    )
  }

  const assignedChild =
    data?.children.find((c) => c.id === data?.activeAssignment?.child_id) ??
    data?.children[0] ??
    null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#ffffff" />}
      >
        <Text style={{ color: '#94a3b8', fontSize: 14 }}>Dashboard</Text>
        <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', marginTop: 8 }}>
          Hi {data?.profile.full_name || 'there'}
        </Text>

        <View style={cardStyle}>
          <Text style={cardTitleStyle}>Assigned child</Text>
          <Text style={primaryValueStyle}>{assignedChild?.name ?? 'No child assigned yet'}</Text>
          <Text style={secondaryValueStyle}>Age band: {assignedChild?.age_band ?? '—'}</Text>
        </View>

        <View style={cardStyle}>
          <Text style={cardTitleStyle}>Device status</Text>
          <Text style={primaryValueStyle}>{data?.device?.serial ?? 'No device paired'}</Text>
          <Text style={secondaryValueStyle}>Online: {data?.device?.online_state ?? 'offline'}</Text>
          <Text style={secondaryValueStyle}>Firmware: {data?.device?.firmware_version ?? '—'}</Text>
          <Text style={secondaryValueStyle}>Config version: {data?.device?.config_version ?? '—'}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={() => router.push('/onboarding/pair' as never)} style={[primaryButtonStyle, { flex: 1 }]}>
            <Text style={{ textAlign: 'center', fontWeight: '700' }}>Pair / re-pair</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/device' as never)} style={[secondaryButtonStyle, { flex: 1 }]}>
            <Text style={{ textAlign: 'center', fontWeight: '700', color: 'white' }}>Device settings</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const cardStyle = {
  backgroundColor: '#111827', borderWidth: 1, borderColor: '#1e293b',
  borderRadius: 16, padding: 18, marginTop: 16,
} as const
const cardTitleStyle = { color: '#94a3b8', fontSize: 14, marginBottom: 8 } as const
const primaryValueStyle = { color: 'white', fontSize: 22, fontWeight: '700' } as const
const secondaryValueStyle = { color: '#cbd5e1', marginTop: 4 } as const
const primaryButtonStyle = {
  backgroundColor: 'white', paddingVertical: 16, borderRadius: 12, marginTop: 18,
} as const
const secondaryButtonStyle = {
  backgroundColor: '#111827', borderWidth: 1, borderColor: '#334155',
  paddingVertical: 16, borderRadius: 12, marginTop: 18,
} as const
