import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Mail, Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { login, register } from '../lib/api';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const result = isLogin
        ? await login(email, password)
        : await register(email, password);

      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Ошибка', result.message || 'Произошла ошибка');
      }
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Shield color="#14d6a0" size={40} />
            </View>
            <Text style={styles.title}>SMG VPN</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Войдите в свой аккаунт' : 'Создайте аккаунт'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail color="#4a5c80" size={20} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#4a5c80"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock color="#4a5c80" size={20} />
              <TextInput
                style={styles.input}
                placeholder="Пароль"
                placeholderTextColor="#4a5c80"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#0a0f1e" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? 'Войти' : 'Зарегистрироваться'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.switchButtonText}>
                {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
                <Text style={styles.switchButtonTextBold}>
                  {isLogin ? 'Зарегистрироваться' : 'Войти'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080e1d',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(20, 214, 160, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#14d6a0',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#e8f0ff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8a9bbf',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1526',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1a2540',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: {
    flex: 1,
    color: '#e8f0ff',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#14d6a0',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#0a0f1e',
    fontSize: 16,
    fontWeight: '700',
  },
  switchButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#8a9bbf',
    fontSize: 14,
  },
  switchButtonTextBold: {
    color: '#14d6a0',
    fontWeight: '700',
  },
});
