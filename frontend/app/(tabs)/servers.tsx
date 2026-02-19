import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Zap, CheckCircle, Star, StarOff, Globe } from 'lucide-react-native';

type Server = {
  id: string;
  country: string;
  city: string;
  flag: string;
  ping: number;
  protocol: string;
  load: number;
  premium: boolean;
};

const ALL_SERVERS: Server[] = [
  { id: '1', country: 'Германия', city: 'Франкфурт', flag: '🇩🇪', ping: 24, protocol: 'VLESS', load: 35, premium: false },
  { id: '2', country: 'США', city: 'Нью-Йорк', flag: '🇺🇸', ping: 88, protocol: 'Trojan', load: 62, premium: false },
  { id: '3', country: 'Нидерланды', city: 'Амстердам', flag: '🇳🇱', ping: 31, protocol: 'VLESS', load: 18, premium: false },
  { id: '4', country: 'Япония', city: 'Токио', flag: '🇯🇵', ping: 145, protocol: 'Hysteria2', load: 44, premium: true },
  { id: '5', country: 'Сингапур', city: 'Сингапур', flag: '🇸🇬', ping: 172, protocol: 'VLESS', load: 28, premium: true },
  { id: '6', country: 'Великобритания', city: 'Лондон', flag: '🇬🇧', ping: 56, protocol: 'Trojan', load: 71, premium: false },
  { id: '7', country: 'Франция', city: 'Париж', flag: '🇫🇷', ping: 42, protocol: 'VLESS', load: 22, premium: false },
  { id: '8', country: 'Швеция', city: 'Стокгольм', flag: '🇸🇪', ping: 38, protocol: 'VLESS', load: 15, premium: false },
  { id: '9', country: 'Австралия', city: 'Сидней', flag: '🇦🇺', ping: 210, protocol: 'Hysteria2', load: 33, premium: true },
  { id: '10', country: 'Канада', city: 'Торонто', flag: '🇨🇦', ping: 102, protocol: 'Trojan', load: 48, premium: false },
];

function getPingColor(ping: number) {
  if (ping < 50) return '#14d6a0';
  if (ping < 120) return '#f59e0b';
  return '#ef4444';
}

function getLoadColor(load: number) {
  if (load < 40) return '#14d6a0';
  if (load < 70) return '#f59e0b';
  return '#ef4444';
}

export default function ServersScreen() {
  const [selected, setSelected] = useState('1');
  const [favorites, setFavorites] = useState<string[]>(['1']);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  const filtered = ALL_SERVERS.filter((s) => {
    const q = search.toLowerCase();
    const match = s.country.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
    if (filter === 'favorites') return match && favorites.includes(s.id);
    return match;
  });

  const toggleFav = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Globe color="#14d6a0" size={22} />
        <Text style={styles.headerTitle}>Серверы</Text>
        <Text style={styles.serverCount}>{ALL_SERVERS.length} серверов</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color="#4a5c80" size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по стране или городу..."
            placeholderTextColor="#4a5c80"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}>
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            Все
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'favorites' && styles.filterTabActive]}
          onPress={() => setFilter('favorites')}>
          <Text style={[styles.filterTabText, filter === 'favorites' && styles.filterTabTextActive]}>
            Избранные
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = item.id === selected;
          const isFav = favorites.includes(item.id);
          const pingColor = getPingColor(item.ping);
          const loadColor = getLoadColor(item.load);

          return (
            <TouchableOpacity
              style={[styles.serverCard, isSelected && styles.serverCardSelected]}
              onPress={() => setSelected(item.id)}
              activeOpacity={0.8}>
              <View style={styles.cardLeft}>
                <Text style={styles.flag}>{item.flag}</Text>
                <View>
                  <View style={styles.nameRow}>
                    <Text style={styles.country}>{item.country}</Text>
                    {item.premium ? (
                        <View style={styles.premiumBadge}>
                          <Text style={styles.premiumText}>PRO</Text>
                        </View>
                      ) : null}
                  </View>
                  <Text style={styles.city}>{item.city}</Text>
                  <Text style={styles.protocol}>{item.protocol}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <View style={styles.pingRow}>
                  <Zap color={pingColor} size={12} />
                  <Text style={[styles.pingText, { color: pingColor }]}>{item.ping} мс</Text>
                </View>
                <View style={styles.loadBar}>
                  <View style={[styles.loadFill, { width: `${item.load}%` as any, backgroundColor: loadColor }]} />
                </View>
                <Text style={[styles.loadText, { color: loadColor }]}>{item.load}%</Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => toggleFav(item.id)} style={styles.favBtn}>
                    {isFav ? (
                      <Star color="#f59e0b" size={18} fill="#f59e0b" />
                    ) : (
                      <Star color="#4a5c80" size={18} />
                    )}
                  </TouchableOpacity>
                  {isSelected ? <CheckCircle color="#14d6a0" size={20} fill="rgba(20,214,160,0.2)" /> : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Globe color="#4a5c80" size={40} />
            <Text style={styles.emptyText}>Серверы не найдены</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080e1d' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },
  headerTitle: {
    color: '#e8f0ff',
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
  },
  serverCount: {
    color: '#4a5c80',
    fontSize: 13,
    fontWeight: '600',
  },
  searchRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1526',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a2540',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#e8f0ff',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0d1526',
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  filterTabActive: {
    backgroundColor: 'rgba(20, 214, 160, 0.15)',
    borderColor: '#14d6a0',
  },
  filterTabText: {
    color: '#4a5c80',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#14d6a0',
  },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  serverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  serverCardSelected: {
    borderColor: '#14d6a0',
    backgroundColor: 'rgba(20, 214, 160, 0.05)',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  flag: { fontSize: 30 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  country: { color: '#e8f0ff', fontSize: 15, fontWeight: '700' },
  premiumBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  premiumText: { color: '#f59e0b', fontSize: 9, fontWeight: '800' },
  city: { color: '#4a5c80', fontSize: 12, marginTop: 2 },
  protocol: {
    color: '#8a9bbf',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  pingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pingText: { fontSize: 12, fontWeight: '700' },
  loadBar: {
    width: 60,
    height: 4,
    backgroundColor: '#1a2540',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadFill: { height: 4, borderRadius: 2 },
  loadText: { fontSize: 10, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  favBtn: { padding: 2 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: '#4a5c80', fontSize: 15, fontWeight: '600' },
});
