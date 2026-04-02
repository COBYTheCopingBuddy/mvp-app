import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

type Mode = 'signin' | 'signup'

export default function LoginScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ mode?: string }>()
  const initialMode = useMemo<Mode>(() => (params.mode === 'signup' ? 'signup' : 'signin'), [params.mode])

  const [mode, setMode] = useState<Mode>(initialMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  async function onSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please enter your email and password.')
      return
    }
    if (mode === 'signup' && !fullName.trim()) {
      Alert.alert('Missing name', 'Please enter your name for account setup.')
      return
    }

    try {
      setLoading(true)

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        })
        if (error) throw error
        if (!data.session) {
          Alert.alert('Check your email', 'Your project may require email confirmation before the first login.')
          return
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) throw error
      }

      router.replace('/' as never)
    } catch (error: any) {
      Alert.alert('Authentication failed', error?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1020' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
          <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>COBY account</Text>
          <Text style={{ color: 'white', fontSize: 34, fontWeight: '800', marginBottom: 10 }}>
            {mode === 'signup' ? 'Create your account' : 'Log in'}
          </Text>
          <Text style={{ color: '#cbd5e1', fontSize: 16, lineHeight: 24, marginBottom: 24 }}>
            Parent account first, then child profile, then CM5 pairing.
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            <Pressable
              onPress={() => setMode('signin')}
              style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: mode === 'signin' ? 'white' : '#111827' }}
            >
              <Text style={{ textAlign: 'center', fontWeight: '700', color: mode === 'signin' ? '#0f172a' : 'white' }}>
                Log in
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('signup')}
              style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: mode === 'signup' ? 'white' : '#111827' }}
            >
              <Text style={{ textAlign: 'center', fontWeight: '700', color: mode === 'signup' ? '#0f172a' : 'white' }}>
                Sign up
              </Text>
            </Pressable>
          </View>

          {mode === 'signup' && (
            <TextInput
              placeholder="Your full name"
              placeholderTextColor="#64748b"
              value={fullName}
              onChangeText={setFullName}
              style={inputStyle}
            />
          )}

          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={setEmail}
            style={inputStyle}
          />

          <TextInput
            secureTextEntry
            placeholder="Password"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            style={inputStyle}
          />

          <Pressable onPress={onSubmit} disabled={loading} style={primaryButtonStyle}>
            <Text style={{ textAlign: 'center', fontWeight: '700', fontSize: 16 }}>
              {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
            </Text>
          </Pressable>

          <Link href="/welcome" style={{ color: '#cbd5e1', textAlign: 'center', marginTop: 18 }}>
            Back to welcome
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const inputStyle = {
  backgroundColor: '#111827',
  borderWidth: 1,
  borderColor: '#334155',
  color: 'white',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 16,
  fontSize: 16,
  marginBottom: 12,
} as const

const primaryButtonStyle = {
  backgroundColor: 'white',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 18,
  marginTop: 8,
} as const
