import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { getMyProfile, saveMyProfile } from '../../lib/coby'
import { supabase } from '../../lib/supabase'

export default function SettingsTab() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('en')
  const [timezone, setTimezone] = useState('Europe/Berlin')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    let mounted = true
    getMyProfile()
      .then((profile) => {
        if (!mounted) return
        setFullName(profile.full_name ?? '')
        setPreferredLanguage(profile.preferred_language ?? 'en')
        setTimezone(profile.timezone ?? 'Europe/Berlin')
      })
      .catch((error: any) => Alert.alert('Could not load settings', error?.message ?? 'Unknown error'))
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  async function onSave() {
    try {
      setSaving(true)
      await saveMyProfile({ fullName, preferredLanguage, timezone })
      Alert.alert('Saved', 'Profile updated.')
    } catch (error: any) {
      Alert.alert('Could not save profile', error?.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  async function onLogout() {
    try {
      setLoggingOut(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.replace('/welcome' as never)
    } catch (error: any) {
      Alert.alert('Logout failed', error?.message ?? 'Unknown error')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', marginBottom: 18 }}>Settings</Text>

        {loading ? (
          <Text style={{ color: '#cbd5e1' }}>Loading…</Text>
        ) : (
          <>
            <Text style={labelStyle}>Parent name</Text>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="Jane Smith" placeholderTextColor="#64748b" style={inputStyle} />

            <Text style={labelStyle}>Preferred language</Text>
            <TextInput value={preferredLanguage} onChangeText={setPreferredLanguage} placeholder="en" placeholderTextColor="#64748b" style={inputStyle} />

            <Text style={labelStyle}>Timezone</Text>
            <TextInput value={timezone} onChangeText={setTimezone} placeholder="Europe/Berlin" placeholderTextColor="#64748b" style={inputStyle} />

            <Pressable onPress={onSave} disabled={saving} style={primaryButtonStyle}>
              <Text style={{ textAlign: 'center', fontWeight: '700' }}>
                {saving ? 'Saving…' : 'Save profile'}
              </Text>
            </Pressable>

            <Pressable onPress={onLogout} disabled={loggingOut} style={dangerButtonStyle}>
              <Text style={{ textAlign: 'center', color: 'white', fontWeight: '700' }}>
                {loggingOut ? 'Logging out…' : 'Log out'}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const labelStyle = { color: '#e2e8f0', marginBottom: 8, marginTop: 4, fontWeight: '600' } as const
const inputStyle = {
  backgroundColor: '#111827', borderWidth: 1, borderColor: '#334155', color: 'white',
  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, marginBottom: 14,
} as const
const primaryButtonStyle = {
  backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 18, marginTop: 12,
} as const
const dangerButtonStyle = {
  backgroundColor: '#b91c1c', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 18, marginTop: 12,
} as const
