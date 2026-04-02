import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  assignDeviceToChild,
  getActiveAssignment,
  getDevicePreferences,
  getMyChildren,
  getMyDevices,
  saveDevicePreferences,
} from '../../lib/coby'

type DeviceState = {
  deviceId: string | null
  activeChildId: string | null
  locale: string
  wakePhrase: string
  volume: string
  listeningMode: 'push_to_talk' | 'always_listen'
  serial: string
  onlineState: string
  firmwareVersion: string
}

export default function DeviceTab() {
  const [children, setChildren] = useState<Array<{ id: string; name: string }>>([])
  const [state, setState] = useState<DeviceState>({
    deviceId: null,
    activeChildId: null,
    locale: 'en',
    wakePhrase: 'Hey COBY',
    volume: '80',
    listeningMode: 'push_to_talk',
    serial: '',
    onlineState: 'offline',
    firmwareVersion: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [devices, householdChildren] = await Promise.all([getMyDevices(), getMyChildren()])
      const firstDevice = devices[0]
      setChildren(householdChildren.map((c) => ({ id: c.id, name: c.name })))

      if (!firstDevice) { setState((prev) => ({ ...prev, deviceId: null })); return }

      const [prefs, assignment] = await Promise.all([
        getDevicePreferences(firstDevice.id),
        getActiveAssignment(firstDevice.id),
      ])

      setState({
        deviceId: firstDevice.id,
        activeChildId: assignment?.child_id ?? null,
        locale: prefs?.locale ?? 'en',
        wakePhrase: prefs?.wake_phrase ?? 'Hey COBY',
        volume: String(prefs?.volume ?? 80),
        listeningMode: (prefs?.listening_mode as DeviceState['listeningMode']) ?? 'push_to_talk',
        serial: firstDevice.serial ?? '',
        onlineState: firstDevice.online_state ?? 'offline',
        firmwareVersion: firstDevice.firmware_version ?? '',
      })
    } catch (error: any) {
      Alert.alert('Could not load device', error?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function onSave() {
    if (!state.deviceId) { Alert.alert('No device', 'Pair a device first from the home screen.'); return }
    try {
      setSaving(true)
      await saveDevicePreferences(state.deviceId, {
        locale: state.locale,
        wake_phrase: state.wakePhrase,
        volume: Math.max(0, Math.min(100, Number(state.volume) || 0)),
        listening_mode: state.listeningMode,
      })
      if (state.activeChildId) await assignDeviceToChild(state.deviceId, state.activeChildId)
      Alert.alert('Saved', 'Device preferences updated.')
    } catch (error: any) {
      Alert.alert('Could not save device', error?.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', marginBottom: 18 }}>Device</Text>

        {loading ? (
          <Text style={{ color: '#cbd5e1' }}>Loading…</Text>
        ) : !state.deviceId ? (
          <Text style={{ color: '#cbd5e1' }}>No paired device yet.</Text>
        ) : (
          <>
            <View style={cardStyle}>
              <Text style={secondaryStyle}>Serial</Text>
              <Text style={primaryStyle}>{state.serial}</Text>
              <Text style={secondaryStyle}>Online</Text>
              <Text style={primaryStyle}>{state.onlineState}</Text>
              <Text style={secondaryStyle}>Firmware</Text>
              <Text style={primaryStyle}>{state.firmwareVersion || '—'}</Text>
            </View>

            <Field label="Locale" value={state.locale} onChangeText={(v) => setState((p) => ({ ...p, locale: v }))} placeholder="en" />
            <Field label="Wake phrase" value={state.wakePhrase} onChangeText={(v) => setState((p) => ({ ...p, wakePhrase: v }))} placeholder="Hey COBY" />
            <Field label="Volume (0-100)" value={state.volume} onChangeText={(v) => setState((p) => ({ ...p, volume: v }))} placeholder="80" />
            <Field
              label="Listening mode"
              value={state.listeningMode}
              onChangeText={(v) => setState((p) => ({ ...p, listeningMode: v as DeviceState['listeningMode'] }))}
              placeholder="push_to_talk"
            />

            <Text style={labelStyle}>Assigned child ID</Text>
            <TextInput
              value={state.activeChildId ?? ''}
              onChangeText={(v) => setState((p) => ({ ...p, activeChildId: v || null }))}
              placeholder={children[0]?.id ?? 'Paste a child id'}
              placeholderTextColor="#64748b"
              style={inputStyle}
            />
            <Text style={{ color: '#94a3b8', marginBottom: 8 }}>
              Available children: {children.map((c) => `${c.name} (${c.id})`).join(' • ') || 'none'}
            </Text>

            <Pressable onPress={onSave} disabled={saving} style={primaryButtonStyle}>
              <Text style={{ textAlign: 'center', fontWeight: '700' }}>
                {saving ? 'Saving…' : 'Save device settings'}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Field({
  label, value, onChangeText, placeholder,
}: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder: string
}) {
  return (
    <>
      <Text style={labelStyle}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#64748b" style={inputStyle} />
    </>
  )
}

const cardStyle = {
  backgroundColor: '#111827', borderWidth: 1, borderColor: '#1e293b',
  borderRadius: 16, padding: 18, marginBottom: 18,
} as const
const primaryStyle = { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 10 } as const
const secondaryStyle = { color: '#94a3b8', marginBottom: 4 } as const
const labelStyle = { color: '#e2e8f0', marginBottom: 8, marginTop: 4, fontWeight: '600' } as const
const inputStyle = {
  backgroundColor: '#111827', borderWidth: 1, borderColor: '#334155', color: 'white',
  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, marginBottom: 14,
} as const
const primaryButtonStyle = {
  backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 18, marginTop: 12,
} as const
