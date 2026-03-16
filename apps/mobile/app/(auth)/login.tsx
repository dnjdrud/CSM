import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { requestMobileLogin } from '@/lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed || pending) return;
    setPending(true);
    const result = await requestMobileLogin(trimmed);
    setPending(false);
    if (result.notRegistered) {
      setNotRegistered(true);
    } else if (result.error) {
      Alert.alert('오류', result.error);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>이메일을 확인해주세요</Text>
        <Text style={styles.desc}>
          <Text style={styles.bold}>{email.trim()}</Text>으로 로그인 링크를 발송했습니다.{'\n'}
          이메일의 링크를 클릭하면 바로 로그인됩니다.
        </Text>
        <TouchableOpacity onPress={() => { setSent(false); setEmail(''); }} style={styles.linkBtn}>
          <Text style={styles.linkText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (notRegistered) {
    return (
      <View style={styles.container}>
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>가입 승인이 되지 않은 이메일입니다</Text>
          <Text style={styles.warningDesc}>
            <Text style={styles.bold}>{email.trim()}</Text>으로 가입된 계정이 없거나 아직 승인 대기 중입니다.
          </Text>
        </View>
        <TouchableOpacity onPress={() => { setNotRegistered(false); setEmail(''); }} style={styles.btn}>
          <Text style={styles.btnText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.appName}>셀라</Text>
      <Text style={styles.title}>로그인</Text>
      <Text style={styles.desc}>이메일을 입력하면 로그인 링크를 발송합니다.</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
      />
      <TouchableOpacity
        style={[styles.btn, (!email.trim() || pending) && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={!email.trim() || pending}
      >
        {pending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>로그인 링크 받기</Text>}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#fff' },
  appName: { fontSize: 32, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  desc: { fontSize: 15, color: '#6b7280', marginBottom: 24, lineHeight: 22 },
  bold: { fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: '#1f2937', marginBottom: 16,
  },
  btn: {
    backgroundColor: '#1f2937', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginBottom: 12,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: '#6b7280', fontSize: 14 },
  warningBox: {
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
    borderRadius: 10, padding: 16, marginBottom: 20,
  },
  warningTitle: { color: '#92400e', fontWeight: '600', fontSize: 14, marginBottom: 6 },
  warningDesc: { color: '#b45309', fontSize: 14, lineHeight: 20 },
});
