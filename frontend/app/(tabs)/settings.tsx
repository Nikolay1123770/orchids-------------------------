import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Settings,
  Shield,
  Bell,
  Zap,
  Globe,
  Lock,
  ChevronRight,
  Info,
  LogOut,
  Wifi,
  Eye,
  Moon,
} from 'lucide-react-native';
import { logout } from '../../lib/api';

type ToggleKey =
  | 'autoConnect'
  | 'killSwitch'
  | 'notifications'
  | 'dnsLeak'
  | 'splitTunnel'
  | 'darkMode';

const PROTOCOL_OPTIONS = ['VLESS', 'Trojan', 'Hysteria2', 'Shadowsocks'];

export default function SettingsScreen() {
  const router = useRouter();
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    autoConnect: true,
    killSwitch: true,
    notifications: false,
    dnsLeak: true,
    splitTunnel: false,
    darkMode: true,
  });
  const [protocol, setProtocol] = useState('VLESS');
  const [showProtocols, setShowProtocols] = useState(false);

  const toggle = (key: ToggleKey) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/auth');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Settings color="#14d6a0" size={22} />
          <Text style={styles.headerTitle}>Настройки</Text>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>SMG Premium</Text>
            <Text style={styles.profilePlan}>Pro план — активен</Text>
          </View>
          <View style={styles.proBadge}>
            <Text style={styles.proText}>PRO</Text>
          </View>
        </View>

        {/* Connection section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Подключение</Text>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(20,214,160,0.15)' }]}>
                  <Zap color="#14d6a0" size={16} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Автоподключение</Text>
                  <Text style={styles.settingDesc}>При запуске приложения</Text>
                </View>
              </View>
              <Switch
                value={toggles.autoConnect}
                onValueChange={() => toggle('autoConnect')}
                trackColor={{ false: '#1a2540', true: 'rgba(20,214,160,0.4)' }}
                thumbColor={toggles.autoConnect ? '#14d6a0' : '#4a5c80'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                  <Shield color="#ef4444" size={16} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Kill Switch</Text>
                  <Text style={styles.settingDesc}>Блокировать трафик без VPN</Text>
                </View>
              </View>
              <Switch
                value={toggles.killSwitch}
                onValueChange={() => toggle('killSwitch')}
                trackColor={{ false: '#1a2540', true: 'rgba(20,214,160,0.4)' }}
                thumbColor={toggles.killSwitch ? '#14d6a0' : '#4a5c80'}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowProtocols(!showProtocols)}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(168,85,247,0.15)' }]}>
                  <Globe color="#a855f7" size={16} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Протокол</Text>
                  <Text style={styles.settingDesc}>{protocol}</Text>
                </View>
              </View>
              <ChevronRight color="#4a5c80" size={18} />
            </TouchableOpacity>

            {showProtocols ? (
              <View style={styles.protocolList}>
                {PROTOCOL_OPTIONS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.protocolOption,
                      protocol === p && styles.protocolOptionActive,
                    ]}
                    onPress={() => {
                      setProtocol(p);
                      setShowProtocols(false);
                    }}>
                    <Text style={[styles.protocolText, protocol === p && styles.protocolTextActive]}>
                      {p}
                    </Text>
                    {protocol === p ? <View style={styles.protocolDot} /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {/* Privacy section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Приватность</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                  <Lock color="#3b82f6" size={16} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Защита от DNS-утечек</Text>
                  <Text style={styles.settingDesc}>DNS через зашифрованный туннель</Text>
                </View>
              </View>
              <Switch
                value={toggles.dnsLeak}
                onValueChange={() => toggle('dnsLeak')}
                trackColor={{ false: '#1a2540', true: 'rgba(20,214,160,0.4)' }}
                thumbColor={toggles.dnsLeak ? '#14d6a0' : '#4a5c80'}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                  <Wifi color="#f59e0b" size={16} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Раздельное туннелирование</Text>
                  <Text style={styles.settingDesc}>Выбрать приложения для VPN</Text>
                </View>
              </View>
              <Switch
                value={toggles.splitTunnel}
                onValueChange={() => toggle('splitTunnel')}
                trackColor={{ false: '#1a2540', true: 'rgba(20,214,160,0.4)' }}
                thumbColor={toggles.splitTunnel ? '#14d6a0' : '#4a5c80'}
              />
            </View>
          </View>
        </View>

        {/* General section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Общие</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(20,214,160,0.15)' }]}>
                  <Bell color="#14d6a0" size={16} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Уведомления</Text>
                  <Text style={styles.settingDesc}>Статус подключения</Text>
                </View>
              </View>
              <Switch
                value={toggles.notifications}
                onValueChange={() => toggle('notifications')}
                trackColor={{ false: '#1a2540', true: 'rgba(20,214,160,0.4)' }}
                thumbColor={toggles.notifications ? '#14d6a0' : '#4a5c80'}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(168,85,247,0.15)' }]}>
                  <Moon color="#a855f7" size={16} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Тёмная тема</Text>
                  <Text style={styles.settingDesc}>Всегда включена</Text>
                </View>
              </View>
              <Switch
                value={toggles.darkMode}
                onValueChange={() => toggle('darkMode')}
                trackColor={{ false: '#1a2540', true: 'rgba(20,214,160,0.4)' }}
                thumbColor={toggles.darkMode ? '#14d6a0' : '#4a5c80'}
              />
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
                  <Info color="#8b5cf6" size={16} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>О приложении</Text>
                  <Text style={styles.settingDesc}>SMG VPN v1.0.0</Text>
                </View>
              </View>
              <ChevronRight color="#4a5c80" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#ef4444" size={18} />
          <Text style={styles.logoutText}>Выйти из аккаунта</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080e1d' },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },
  headerTitle: { color: '#e8f0ff', fontSize: 22, fontWeight: '800' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(20, 214, 160, 0.2)',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(20, 214, 160, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#14d6a0',
  },
  avatarText: { color: '#14d6a0', fontSize: 22, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { color: '#e8f0ff', fontSize: 16, fontWeight: '700' },
  profilePlan: { color: '#14d6a0', fontSize: 12, marginTop: 2 },
  proBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
  },
  proText: { color: '#f59e0b', fontSize: 12, fontWeight: '800' },
  section: { marginBottom: 16 },
  sectionTitle: {
    color: '#4a5c80',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1a2540',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: { color: '#e8f0ff', fontSize: 14, fontWeight: '600' },
  settingDesc: { color: '#4a5c80', fontSize: 12, marginTop: 1 },
  divider: { height: 1, backgroundColor: '#1a2540', marginHorizontal: 14 },
  protocolList: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 6,
  },
  protocolOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a2540',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  protocolOptionActive: {
    backgroundColor: 'rgba(20, 214, 160, 0.15)',
    borderWidth: 1,
    borderColor: '#14d6a0',
  },
  protocolText: { color: '#8a9bbf', fontSize: 14, fontWeight: '600' },
  protocolTextActive: { color: '#14d6a0' },
  protocolDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#14d6a0',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginTop: 4,
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
});
