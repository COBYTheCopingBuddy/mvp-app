import { useState } from 'react'
import { Alert, FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  assignDeviceToChild,
  getMyChildren,
  saveDevicePreferences,
  startPairing,
  waitForClaimedDevice,
} from '../../lib/coby'
import { connectAndProvision, disconnectDevice, scanForCobyDevices, ScannedCobyDevice } from '../../lib/ble'

export default function OnboardingPairScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ childId?: string }>()

  const [deviceSerial, setDeviceSerial] = useState('COBY-CM5-0001')
  const [wifiSsid, setWifiSsid] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [devices, setDevices] = useState<ScannedCobyDevice[]>([])
  const [selectedBleId, setSelectedBleId] = useState<string | null>(null)
  const [status, setStatus] = useState('Waiting to scan…')
  const [scanning, setScanning] = useState(false)
  const [pairing, setPairing] = useState(false)

  async function onScan() {
    try {
      setScanning(true)
      setDevices([])
      setStatus('Scanning for nearby COBY devices…')
      await scanForCobyDevices((found) => {
        setDevices((prev) => prev.some((d) => d.id === found.id) ? prev : [...prev, found])
      })
      setStatus('Scan finished. Select the CM5 device below.')
    } catch (error: any) {
      Alert.alert('Scan failed', error?.message ?? 'Unknown BLE error')
      setStatus('BLE scan failed')
    } finally {
      setScanning(false)
    }
  }

  async function onPair() {
    if (!deviceSerial.trim()) { Alert.alert('Missing serial', 'Enter the serial printed on the device label.'); return }
    if (!wifiSsid.trim() || !wifiPassword.trim()) { Alert.alert('Missing Wi‑Fi', 'Enter the Wi‑Fi SSID and password.'); return }
    if (!selectedBleId) { Alert.alert('Pick a device', 'Scan first, then select the COBY device you want to pair.'); return }

    try {
      setPairing(true)
      setStatus('Creating one-time pairing token…')

      const pairStart = await startPairing({ deviceSerial: deviceSerial.trim(), wifiSsid: wifiSsid.trim() })

      setStatus('Connecting over BLE…')
      await connectAndProvision(
        selectedBleId,
        { pairToken: pairStart.pairToken, wifiSsid: wifiSsid.trim(), wifiPassword },
        (s) => setStatus(`Device says: ${s}`),
      )

      setStatus('Waiting for device to join Wi‑Fi and claim itself…')
      const claimedDevice = await waitForClaimedDevice(deviceSerial.trim())

      const childId = params.childId ?? (await getMyChildren().then((c) => c[0]?.id ?? null))
      if (!childId) throw new Error('No child available to assign to the device')

      await assignDeviceToChild(claimedDevice.id, childId)
      await saveDevicePreferences(claimedDevice.id, {
        locale: 'en',
        wake_phrase: 'Hey COBY',
        volume: 80,
        listening_mode: 'push_to_talk',
      })

      setStatus('Pairing complete')
      Alert.alert('Success', 'Your COBY device is now paired and assigned.')
      router.replace('/(tabs)' as never)
    } catch (error: any) {
      Alert.alert('Pairing failed', error?.message ?? 'Unknown error')
      setStatus(`Failed: ${error?.message ?? 'Unknown error'}`)
    } finally {
      if (selectedBleId) await disconnectDevice(selectedBleId)
      setPairing(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={{ color: '#94a3b8', fontSize: 14 }}>Step 3 of 3</Text>
        <Text style={{ color: 'white', fontSize: 32, fontWeight: '800', marginTop: 8 }}>Pair your CM5</Text>
        <Text style={{ color: '#cbd5e1', fontSize: 16, lineHeight: 24, marginTop: 12, marginBottom: 24 }}>
          Power on the device, put it into pairing mode, and keep the phone nearby.
        </Text>

        <Text style={labelStyle}>Device serial</Text>
        <TextInput value={deviceSerial} onChangeText={setDeviceSerial} placeholder="COBY-CM5-0001" placeholderTextColor="#64748b" style={inputStyle} />

        <Text style={labelStyle}>Wi‑Fi SSID</Text>
        <TextInput value={wifiSsid} onChangeText={setWifiSsid} placeholder="Home WiFi" placeholderTextColor="#64748b" style={inputStyle} />

        <Text style={labelStyle}>Wi‑Fi password</Text>
        <TextInput value={wifiPassword} onChangeText={setWifiPassword} placeholder="••••••••" placeholderTextColor="#64748b" secureTextEntry style={inputStyle} />

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <Pressable onPress={onScan} disabled={scanning || pairing} style={[secondaryButtonStyle, { flex: 1 }]}>
            <Text style={{ textAlign: 'center', color: 'white', fontWeight: '700' }}>
              {scanning ? 'Scanning…' : 'Scan BLE'}
            </Text>
          </Pressable>
          <Pressable onPress={onPair} disabled={pairing} style={[primaryButtonStyle, { flex: 1 }]}>
            <Text style={{ textAlign: 'center', fontWeight: '700' }}>
              {pairing ? 'Pairing…' : 'Pair device'}
            </Text>
          </Pressable>
        </View>

        <Text style={{ color: '#93c5fd', marginBottom: 12 }}>{status}</Text>

        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const selected = selectedBleId === item.id
            return (
              <Pressable
                onPress={() => setSelectedBleId(item.id)}
                style={{
                  borderWidth: 1,
                  borderColor: selected ? '#93c5fd' : '#334155',
                  borderRadius: 14,
                  padding: 16,
                  backgroundColor: selected ? '#0f172a' : '#111827',
                }}
              >
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>{item.name}</Text>
                <Text style={{ color: '#94a3b8', marginTop: 6 }}>{item.id}</Text>
              </Pressable>
            )
          }}
          ListEmptyComponent={
            <View style={{ borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 18 }}>
              <Text style={{ color: '#94a3b8' }}>No BLE devices found yet.</Text>
            </View>
          }
        />

        <Pressable onPress={() => router.replace('/(tabs)' as never)} style={{ marginTop: 20 }}>
          <Text style={{ color: '#cbd5e1', textAlign: 'center' }}>Skip for now</Text>
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
  backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 18,
} as const
const secondaryButtonStyle = {
  backgroundColor: '#111827', borderWidth: 1, borderColor: '#334155',
  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 18,
} as const
