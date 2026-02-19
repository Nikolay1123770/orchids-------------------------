import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart2, ArrowDown, ArrowUp, Clock, Zap, Globe, Calendar } from 'lucide-react-native';
import { fetchTraffic, fetchVPNStatus, formatBytes } from '../../lib/api';

const CHART_DATA = [12, 28, 45, 38, 55, 42, 60, 48, 35, 52, 40, 24];
const CHART_LABELS = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
const CHART_MAX = Math.max(...CHART_DATA);
const CHART_HEIGHT = 100;

export default function StatsScreen() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const [traffic, setTraffic] = useState({ down: 0, up: 0, total: 0 });
  const [clientCount, setClientCount] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statusData, trafficData] = await Promise.all([
          fetchVPNStatus(),
          fetchTraffic('3qs7rjev'),
        ]);

        if (statusData?.success) {
          setServerOnline(statusData.online);
          setPing(statusData.ping);
          setClientCount(statusData.inbound?.clientCount ?? null);
        }

        if (trafficData?.success) {
          const inbound = trafficData.inbound || {};
          setTraffic({
            down: inbound.down || 0,
            up: inbound.up || 0,
            total: inbound.total || 0,
          });
        }
      } catch (_) {
        setServerOnline(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <BarChart2 color="#14d6a0" size={22} />
          <Text style={styles.headerTitle}>Статистика</Text>
          {loading ? <ActivityIndicator color="#14d6a0" size="small" /> : null}
        </View>

        {/* Server status card */}
        <View style={[styles.serverStatusCard, { borderColor: serverOnline ? 'rgba(20,214,160,0.3)' : 'rgba(239,68,68,0.3)' }]}>
          <View style={styles.serverStatusRow}>
            <View style={[styles.onlineDot, { backgroundColor: serverOnline ? '#14d6a0' : '#ef4444' }]} />
            <Text style={styles.serverStatusTitle}>
              {serverOnline === null ? 'Проверка сервера...' : serverOnline ? 'Сервер онлайн' : 'Сервер недоступен'}
            </Text>
          </View>
          <View style={styles.serverInfoRow}>
            <View style={styles.serverInfoItem}>
              <Text style={styles.serverInfoLabel}>Адрес</Text>
              <Text style={styles.serverInfoValue}>213.176.77.13:443</Text>
            </View>
            {ping !== null ? (
              <View style={styles.serverInfoItem}>
                <Text style={styles.serverInfoLabel}>Пинг</Text>
                <Text style={[styles.serverInfoValue, { color: '#14d6a0' }]}>{ping} мс</Text>
              </View>
            ) : null}
            {clientCount !== null ? (
              <View style={styles.serverInfoItem}>
                <Text style={styles.serverInfoLabel}>Клиентов</Text>
                <Text style={styles.serverInfoValue}>{clientCount}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.serverLocation}>🇩🇪 Франкфурт, Германия · VLESS WebSocket</Text>
        </View>

        {/* Period selector */}
        <View style={styles.periodRow}>
          {(['today', 'week', 'month'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}>
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'today' ? 'Сегодня' : p === 'week' ? 'Неделя' : 'Месяц'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <ArrowDown color="#14d6a0" size={18} />
            </View>
            <Text style={styles.summaryLabel}>Скачано (сервер)</Text>
            <Text style={styles.summaryValue}>{formatBytes(traffic.down)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <ArrowUp color="#3b82f6" size={18} />
            </View>
            <Text style={styles.summaryLabel}>Загружено (сервер)</Text>
            <Text style={styles.summaryValue}>{formatBytes(traffic.up)}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(168,85,247,0.15)' }]}>
              <Globe color="#a855f7" size={18} />
            </View>
            <Text style={styles.summaryLabel}>Всего трафика</Text>
            <Text style={styles.summaryValue}>{formatBytes(traffic.total)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Zap color="#f59e0b" size={18} />
            </View>
            <Text style={styles.summaryLabel}>Протокол</Text>
            <Text style={styles.summaryValue}>VLESS WS</Text>
          </View>
        </View>

        {/* Speed chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Активность (МБ/с)</Text>
          <View style={styles.chart}>
            {CHART_DATA.map((val, i) => (
              <View key={i} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: (val / CHART_MAX) * CHART_HEIGHT,
                      backgroundColor:
                        i === CHART_DATA.length - 3
                          ? '#14d6a0'
                          : 'rgba(20, 214, 160, 0.3)',
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{CHART_LABELS[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Connection info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar color="#4a5c80" size={16} />
            <Text style={styles.sectionTitle}>Информация о сервере</Text>
          </View>
          {[
            { label: 'IP', value: '213.176.77.13' },
            { label: 'Порт', value: '443' },
            { label: 'Протокол', value: 'VLESS' },
            { label: 'Транспорт', value: 'WebSocket (/api)' },
            { label: 'Расположение', value: 'Франкфурт, Германия' },
            { label: 'Провайдер', value: 'AMD EPYC · 2.5 Гбит/с' },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
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
  headerTitle: { color: '#e8f0ff', fontSize: 22, fontWeight: '800', flex: 1 },
  serverStatusCard: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  serverStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  serverStatusTitle: { color: '#e8f0ff', fontSize: 15, fontWeight: '700' },
  serverInfoRow: { flexDirection: 'row', gap: 20 },
  serverInfoItem: { gap: 2 },
  serverInfoLabel: { color: '#4a5c80', fontSize: 11, fontWeight: '600' },
  serverInfoValue: { color: '#e8f0ff', fontSize: 13, fontWeight: '700' },
  serverLocation: { color: '#4a5c80', fontSize: 12 },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: '#0d1526',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  periodBtnActive: { backgroundColor: 'rgba(20, 214, 160, 0.15)' },
  periodText: { color: '#4a5c80', fontSize: 13, fontWeight: '600' },
  periodTextActive: { color: '#14d6a0' },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#0d1526',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1a2540',
    gap: 6,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(20, 214, 160, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: { color: '#4a5c80', fontSize: 12, fontWeight: '600' },
  summaryValue: { color: '#e8f0ff', fontSize: 18, fontWeight: '800' },
  chartCard: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a2540',
    marginBottom: 20,
  },
  chartTitle: { color: '#8a9bbf', fontSize: 13, fontWeight: '600', marginBottom: 16 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 130,
    gap: 4,
  },
  barWrapper: { flex: 1, alignItems: 'center', gap: 6 },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { color: '#4a5c80', fontSize: 9, fontWeight: '600' },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { color: '#8a9bbf', fontSize: 14, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0d1526',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  infoLabel: { color: '#4a5c80', fontSize: 13, fontWeight: '600' },
  infoValue: { color: '#e8f0ff', fontSize: 13, fontWeight: '700' },
});
