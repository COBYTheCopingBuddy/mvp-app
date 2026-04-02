import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { getMyProfile, saveMyProfile } from '../../lib/coby'

export default function OnboardingProfileScreen() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('en')
  const [timezone, setTimezone] = useState('Europe/Berlin')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    getMyProfile()
      .then((profile) => {
        if (!mounted) return
        setFullName(profile.full_name ?? '')
        setPreferredLanguage(profile.preferred_language ?? 'en')
        setTimezone(profile.timezone ?? 'Europe/Berlin')
      })
      .catch((error: any) => Alert.alert('Could not load profile', error?.message ?? 'Unknown error'))
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  async function onSave() {
    if (!fullName.trim()) {
      Alert.alert('Missing name', 'Please enter the parent name.')
      return
    }
    try {
      setSaving(true)
      await saveMyProfile({ fullName, preferredLanguage, timezone })
      router.replace('/onboarding/child' as never)
    } catch (error: any) {
      Alert.alert('Could not save profile', error?.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={{ color: '#94a3b8', fontSize: 14 }}>Step 1 of 3</Text>
        <Text style={{ color: 'white', fontSize: 32, fontWeight: '800', marginTop: 8 }}>
          Parent profile
        </Text>
        <Text style={{ color: '#cbd5e1', fontSize: 16, lineHeight: 24, marginTop: 12, marginBottom: 24 }}>
          These details help set defaults for the household and the prompt context the device will use.
        </Text>

        <Text style={labelStyle}>Full name</Text>
        <TextInput value={fullName} onChangeText={setFullName} placeholder="Jane Smith" placeholderTextColor="#64748b" style={inputStyle} />

        <Text style={labelStyle}>Preferred language</Text>
        <TextInput value={preferredLanguage} onChangeText={setPreferredLanguage} placeholder="en" placeholderTextColor="#64748b" style={inputStyle} />

        <Text style={labelStyle}>Timezone</Text>
        <TextInput value={timezone} onChangeText={setTimezone} placeholder="Europe/Berlin" placeholderTextColor="#64748b" style={inputStyle} />

        <Pressable onPress={onSave} disabled={saving || loading} style={primaryButtonStyle}>
          <Text style={{ textAlign: 'center', fontWeight: '700', fontSize: 16 }}>
            {saving ? 'Saving…' : 'Continue'}
          </Text>
        </Pressable>
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
