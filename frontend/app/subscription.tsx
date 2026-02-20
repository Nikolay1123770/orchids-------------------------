import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, Check, ArrowLeft, ExternalLink } from 'lucide-react-native';
import { router } from 'expo-router';
import { fetchPlans, createPayment, checkPaymentStatus, verifyPayment, getMe } from '../lib/api';

type Plan = {
  id: string;
  title: string;
  price: number;
  pricePerDay: string;
  badge?: string;
};

export default function SubscriptionScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('3_month');
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [paymentLabel, setPaymentLabel] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (paymentLabel) {
      setPollCount(0);
      const interval = setInterval(checkStatus, 4000);
      return () => clearInterval(interval);
    }
  }, [paymentLabel]);

  const loadPlans = async () => {
    try {
      const result = await fetchPlans();
      if (result.success) {
        setPlans(result.plans);
      }
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось загрузить тарифы');
    } finally {
      setLoadingPlans(false);
    }
  };

  const checkStatus = async () => {
    if (!paymentLabel) return;

    try {
      // checkPaymentStatus now also queries YooMoney API server-side if still pending
      const result = await checkPaymentStatus(paymentLabel);
      if (result.success && result.status === 'confirmed') {
        setPaymentLabel(null);
        setPollCount(0);
        Alert.alert('Подписка активирована!', 'VPN готов к использованию. Нажмите OK для подключения.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') },
        ]);
        return;
      }

      setPollCount((c) => c + 1);
    } catch (err) {
      console.log('Check status error:', err);
    }
  };

  const handleManualVerify = async () => {
    setVerifying(true);
    try {
      const result = await verifyPayment();
      if (result.success && result.activated) {
        setPaymentLabel(null);
        Alert.alert('Подписка активирована!', 'VPN готов к использованию.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') },
        ]);
      } else {
        Alert.alert(
          'Оплата не найдена',
          'Платёж ещё не поступил. Если вы уже оплатили, подождите 1-2 минуты и попробуйте снова.',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось проверить оплату');
    } finally {
      setVerifying(false);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const result = await createPayment(selectedPlan);

      if (result.success && result.payUrl) {
        setPaymentLabel(result.label);

        const canOpen = await Linking.canOpenURL(result.payUrl);
        if (canOpen) {
          await Linking.openURL(result.payUrl);
          Alert.alert(
            'Ожидание оплаты',
            'После оплаты подписка будет активирована автоматически. Можете закрыть браузер и вернуться в приложение.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Ошибка', 'Не удалось открыть страницу оплаты');
        }
      } else {
        Alert.alert('Ошибка', result.message || 'Не удалось создать платеж');
      }
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPlans) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#14d6a0" size="large" />
          <Text style={styles.loadingText}>Загрузка тарифов...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#e8f0ff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Выберите тариф</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.crownContainer}>
          <View style={styles.crownCircle}>
            <Crown color="#f59e0b" size={40} />
          </View>
          <Text style={styles.mainTitle}>SMG VPN Premium</Text>
          <Text style={styles.mainSubtitle}>
            Безлимитный высокоскоростной VPN без ограничений
          </Text>
        </View>

        <View style={styles.features}>
          {[
            'Безлимитный трафик',
            'Высокая скорость',
            'Без логов',
            'Защита от утечек DNS',
            'Поддержка 24/7',
          ].map((feature, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Check color="#14d6a0" size={16} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan(plan.id)}>
              {plan.badge && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>
              )}

              <View style={styles.planLeft}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planPricePerDay}>{plan.pricePerDay}</Text>
              </View>

              <View style={styles.planRight}>
                <Text style={styles.planPrice}>{plan.price} ₽</Text>
                {selectedPlan === plan.id && (
                  <View style={styles.selectedIcon}>
                    <Check color="#14d6a0" size={18} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {paymentLabel && (
          <View style={styles.waitingCard}>
            <ActivityIndicator color="#14d6a0" size="small" />
            <View style={{ flex: 1 }}>
              <Text style={styles.waitingText}>Ожидаем подтверждение оплаты...</Text>
              <Text style={styles.waitingSubtext}>
                {pollCount > 3
                  ? 'Если вы оплатили, нажмите "Проверить оплату"'
                  : 'Это может занять до минуты после оплаты'}
              </Text>
            </View>
          </View>
        )}

        {paymentLabel && pollCount > 2 && (
          <TouchableOpacity
            style={[styles.verifyButton, verifying && styles.purchaseButtonDisabled]}
            onPress={handleManualVerify}
            disabled={verifying}>
            {verifying ? (
              <ActivityIndicator color="#14d6a0" />
            ) : (
              <Text style={styles.verifyButtonText}>Проверить оплату</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.purchaseButton, (loading || !!paymentLabel) && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={loading || !!paymentLabel}>
          {loading ? (
            <ActivityIndicator color="#0a0f1e" />
          ) : paymentLabel ? (
            <Text style={styles.purchaseButtonText}>Ожидание оплаты...</Text>
          ) : (
            <>
              <Text style={styles.purchaseButtonText}>
                {'Оплатить '}
                {plans.find((p) => p.id === selectedPlan)?.price || 0}
                {' \u20BD'}
              </Text>
              <ExternalLink color="#0a0f1e" size={18} />
            </>
          )}
        </TouchableOpacity>

        {paymentLabel && (
          <TouchableOpacity
            style={styles.cancelPaymentButton}
            onPress={() => {
              setPaymentLabel(null);
              setPollCount(0);
            }}>
            <Text style={styles.cancelPaymentText}>Отменить и выбрать другой тариф</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.disclaimer}>
          {paymentLabel
            ? 'Оплатите в открывшемся браузере. Подписка активируется автоматически.'
            : 'После оплаты через ЮMoney подписка активируется автоматически'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080e1d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#e8f0ff',
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#8a9bbf',
    fontSize: 16,
  },
  crownContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  crownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e8f0ff',
    marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#8a9bbf',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  features: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1a2540',
    gap: 14,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(20, 214, 160, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: '#e8f0ff',
    fontSize: 15,
    fontWeight: '600',
  },
  plansContainer: {
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#1a2540',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planCardSelected: {
    borderColor: '#14d6a0',
    backgroundColor: 'rgba(20, 214, 160, 0.05)',
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planBadgeText: {
    color: '#0a0f1e',
    fontSize: 11,
    fontWeight: '800',
  },
  planLeft: {
    flex: 1,
  },
  planTitle: {
    color: '#e8f0ff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  planPricePerDay: {
    color: '#4a5c80',
    fontSize: 13,
  },
  planRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  planPrice: {
    color: '#14d6a0',
    fontSize: 22,
    fontWeight: '800',
  },
  selectedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(20, 214, 160, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(20, 214, 160, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 214, 160, 0.3)',
  },
  waitingText: {
    color: '#14d6a0',
    fontSize: 14,
    fontWeight: '600',
  },
  waitingSubtext: {
    color: '#8a9bbf',
    fontSize: 12,
    marginTop: 4,
  },
  verifyButton: {
    backgroundColor: 'rgba(20, 214, 160, 0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(20, 214, 160, 0.4)',
  },
  verifyButtonText: {
    color: '#14d6a0',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelPaymentButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelPaymentText: {
    color: '#4a5c80',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  purchaseButton: {
    backgroundColor: '#14d6a0',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#0a0f1e',
    fontSize: 17,
    fontWeight: '800',
  },
  disclaimer: {
    color: '#4a5c80',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
