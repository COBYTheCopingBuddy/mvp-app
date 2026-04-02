import { Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1020' }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <View style={{ marginTop: 60 }}>
          <Text style={{ color: '#94a3b8', fontSize: 16, marginBottom: 16 }}>Welcome to</Text>
          <Text style={{ color: 'white', fontSize: 42, fontWeight: '800' }}>COBY</Text>
          <Text style={{ color: '#cbd5e1', fontSize: 18, lineHeight: 28, marginTop: 18 }}>
            A voice companion for children, with parent-controlled preferences, child profiles, and
            CM5 device pairing.
          </Text>
        </View>

        <View style={{ gap: 12, marginBottom: 40 }}>
          <Pressable
            onPress={() => router.push({ pathname: '/(auth)/login', params: { mode: 'signup' } })}
            style={{ backgroundColor: 'white', borderRadius: 14, padding: 18 }}
          >
            <Text style={{ textAlign: 'center', fontWeight: '700', fontSize: 16 }}>
              Create account
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push({ pathname: '/(auth)/login', params: { mode: 'signin' } })}
            style={{ borderWidth: 1, borderColor: '#334155', borderRadius: 14, padding: 18 }}
          >
            <Text style={{ textAlign: 'center', color: 'white', fontWeight: '700', fontSize: 16 }}>
              Log in
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}
