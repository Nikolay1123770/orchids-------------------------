import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, ShieldCheck, ShieldOff, ChevronRight, Zap, Globe, ArrowDown, ArrowUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { connectVPN, disconnectVPN, fetchTraffic, fetchVPNStatus, formatBytes } from '../../lib/api';

const { width } = Dimensions.get('window');

const SERVER = {
  id: '1',
  country: 'Германия',
  city: 'Франкфурт',
  flag: '🇩🇪',
  protocol: 'VLESS',
};

export default function HomeScreen() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [ping, setPing] = useState<number | null>(null);
  const [traffic, setTraffic] = useState({ down: 0, up: 0 });
  const [vlessUrl, setVlessUrl] = useState<string | null>(null);
  const router = useRouter();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const ringAnim1 = useRef(new Animated.Value(0.8)).current;
  const ringAnim2 = useRef(new Animated.Value(0.6)).current;

  // Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (connected) {
      timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [connected]);

  // Traffic polling every 5s when connected
  useEffect(() => {
    if (!connected) return;
    const poll = async () => {
      try {
        const data = await fetchTraffic('3qs7rjev');
        if (data?.success) {
          setTraffic({
            down: data.client?.down || data.inbound?.down || 0,
            up: data.client?.up || data.inbound?.up || 0,
          });
        }
      } catch (_) {}
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [connected]);

  // Fetch server ping on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await fetchVPNStatus();
        if (data?.success) setPing(data.ping);
      } catch (_) {}
    };
    checkStatus();
  }, []);

  // Connecting animation
  useEffect(() => {
    if (connecting) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [connecting]);

  // Connected animation
  useEffect(() => {
    if (connected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim1, { toValue: 1.3, duration: 1500, useNativeDriver: true }),
          Animated.timing(ringAnim1, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim2, { toValue: 1.5, duration: 2000, useNativeDriver: true }),
          Animated.timing(ringAnim2, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    } else {
      ringAnim1.setValue(0.8);
      ringAnim2.setValue(0.6);
      Animated.timing(glowAnim, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    }
  }, [connected]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleToggle = useCallback(async () => {
    if (connected) {
      try {
        await disconnectVPN();
      } catch (_) {}
      setConnected(false);
      setTraffic({ down: 0, up: 0 });
      setVlessUrl(null);
    } else {
      setConnecting(true);
      try {
        const data = await connectVPN('3qs7rjev');
        if (data?.success) {
          setVlessUrl(data.config?.vlessUrl || null);
          setConnected(true);
        } else {
          Alert.alert('Ошибка', data?.message || 'Не удалось подключиться');
        }
      } catch (err: any) {
        Alert.alert('Ошибка подключения', err?.message || 'Проверьте интернет-соединение');
      } finally {
        setConnecting(false);
      }
    }
  }, [connected]);

  const statusColor = connected ? '#14d6a0' : connecting ? '#f59e0b' : '#4a5c80';
  const statusText = connected ? 'ПОДКЛЮЧЕНО' : connecting ? 'ПОДКЛЮЧЕНИЕ...' : 'НЕ ПОДКЛЮЧЕНО';

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(20, 214, 160, 0)', 'rgba(20, 214, 160, 0.25)'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Shield color="#14d6a0" size={26} />
            <Text style={styles.logoText}>SMG VPN</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        {/* Connection button area */}
        <View style={styles.buttonArea}>
          {connected ? (
            <>
              <Animated.View
                style={[
                  styles.ring,
                  { transform: [{ scale: ringAnim1 }], opacity: 0.2, borderColor: '#14d6a0' },
                ]}
              />
              <Animated.View
                style={[
                  styles.ring,
                  styles.ring2,
                  { transform: [{ scale: ringAnim2 }], opacity: 0.1, borderColor: '#14d6a0' },
                ]}
              />
            </>
          ) : null}

          <Animated.View style={[styles.glowBackdrop, { backgroundColor: glowColor }]} />

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={handleToggle}
              style={[
                styles.connectButton,
                connected && styles.connectButtonActive,
                connecting && styles.connectButtonConnecting,
              ]}
              activeOpacity={0.85}>
              {connected ? (
                <ShieldCheck color="#0a0f1e" size={52} />
              ) : connecting ? (
                <Shield color="#f59e0b" size={52} />
              ) : (
                <ShieldOff color="#4a5c80" size={52} />
              )}
              <Text
                style={[
                  styles.connectLabel,
                  { color: connected ? '#0a0f1e' : connecting ? '#f59e0b' : '#8a9bbf' },
                ]}>
                {connected ? 'ОТКЛЮЧИТЬ' : connecting ? 'ПОДКЛЮЧЕНИЕ...' : 'ПОДКЛЮЧИТЬ'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Timer */}
        <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>

        {/* Server selector */}
        <TouchableOpacity style={styles.serverCard} onPress={() => router.push('/(tabs)/servers')}>
          <View style={styles.serverLeft}>
            <Text style={styles.serverFlag}>{SERVER.flag}</Text>
            <View>
              <Text style={styles.serverCountry}>{SERVER.country}</Text>
              <Text style={styles.serverCity}>{SERVER.city}</Text>
            </View>
          </View>
          <View style={styles.serverRight}>
            {ping !== null ? (
              <View style={styles.pingBadge}>
                <Zap color="#14d6a0" size={12} />
                <Text style={styles.pingText}>{ping} мс</Text>
              </View>
            ) : null}
            <Text style={styles.protocolBadge}>{SERVER.protocol}</Text>
            <ChevronRight color="#4a5c80" size={18} />
          </View>
        </TouchableOpacity>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ArrowDown color="#14d6a0" size={20} />
            <Text style={styles.statLabel}>Скачано</Text>
            <Text style={styles.statValue}>{formatBytes(traffic.down)}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Zap color="#14d6a0" size={20} />
            <Text style={styles.statLabel}>Сессия</Text>
            <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
          </View>
          <View style={styles.statCard}>
            <ArrowUp color="#3b82f6" size={20} />
            <Text style={styles.statLabel}>Загружено</Text>
            <Text style={styles.statValue}>{formatBytes(traffic.up)}</Text>
          </View>
        </View>

        {/* VLESS connection info when connected */}
        {connected && vlessUrl ? (
          <View style={styles.vlessCard}>
            <View style={styles.vlessHeader}>
              <Globe color="#14d6a0" size={16} />
              <Text style={styles.vlessTitle}>VLESS конфигурация</Text>
            </View>
            <Text style={styles.vlessUrl} numberOfLines={2} ellipsizeMode="tail">
              {vlessUrl}
            </Text>
            <Text style={styles.vlessHint}>
              Скопируйте ссылку в v2rayNG / NekoBox для подключения
            </Text>
          </View>
        ) : null}

        {/* Protection info */}
        <View style={styles.infoCard}>
          <ShieldCheck color={connected ? '#14d6a0' : '#4a5c80'} size={20} />
          <Text style={[styles.infoText, { color: connected ? '#14d6a0' : '#4a5c80' }]}>
            {connected
              ? 'Подключено к серверу: 213.176.77.13 (Франкфурт)'
              : 'Нажмите кнопку для подключения к VPN'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const BTN_SIZE = 170;
const RING_SIZE = BTN_SIZE + 60;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080e1d',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    color: '#e8f0ff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
    marginTop: 12,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
  },
  ring2: {
    width: RING_SIZE + 50,
    height: RING_SIZE + 50,
    borderRadius: (RING_SIZE + 50) / 2,
  },
  glowBackdrop: {
    position: 'absolute',
    width: BTN_SIZE + 80,
    height: BTN_SIZE + 80,
    borderRadius: (BTN_SIZE + 80) / 2,
  },
  connectButton: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: '#0d1526',
    borderWidth: 3,
    borderColor: '#1a2540',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 10,
  },
  connectButtonActive: {
    backgroundColor: '#14d6a0',
    borderColor: '#0fb88a',
    elevation: 14,
  },
  connectButtonConnecting: {
    borderColor: '#f59e0b',
  },
  connectLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  timer: {
    textAlign: 'center',
    color: '#8a9bbf',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 3,
    marginTop: 4,
    marginBottom: 20,
  },
  serverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a2540',
    marginBottom: 20,
  },
  serverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  serverFlag: {
    fontSize: 32,
  },
  serverCountry: {
    color: '#e8f0ff',
    fontSize: 16,
    fontWeight: '700',
  },
  serverCity: {
    color: '#4a5c80',
    fontSize: 13,
    marginTop: 2,
  },
  serverRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 214, 160, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  pingText: {
    color: '#14d6a0',
    fontSize: 12,
    fontWeight: '600',
  },
  protocolBadge: {
    color: '#8a9bbf',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: '#1a2540',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0d1526',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  statCardMiddle: {
    borderColor: 'rgba(20, 214, 160, 0.2)',
  },
  statLabel: {
    color: '#4a5c80',
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    color: '#e8f0ff',
    fontSize: 13,
    fontWeight: '700',
  },
  vlessCard: {
    backgroundColor: '#0d1526',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(20, 214, 160, 0.3)',
    marginBottom: 16,
    gap: 8,
  },
  vlessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vlessTitle: {
    color: '#14d6a0',
    fontSize: 13,
    fontWeight: '700',
  },
  vlessUrl: {
    color: '#8a9bbf',
    fontSize: 11,
    fontFamily: 'monospace',
    backgroundColor: '#060b18',
    padding: 8,
    borderRadius: 8,
  },
  vlessHint: {
    color: '#4a5c80',
    fontSize: 11,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1526',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
