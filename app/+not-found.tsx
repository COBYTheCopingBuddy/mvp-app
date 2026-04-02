import { Pressable, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

export default function NotFoundScreen() {
  const router = useRouter()
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#0b1020', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>404</Text>
      <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', marginBottom: 12 }}>
        Screen not found
      </Text>
      <Pressable onPress={() => router.replace('/' as never)}>
        <Text style={{ color: '#93c5fd', fontSize: 16 }}>Go home</Text>
      </Pressable>
    </SafeAreaView>
  )
}
