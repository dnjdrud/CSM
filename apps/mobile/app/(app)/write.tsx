import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { PostCategory } from '@/lib/types';

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'GENERAL', label: '일반' },
  { value: 'DEVOTIONAL', label: '묵상' },
  { value: 'MINISTRY', label: '사역' },
  { value: 'TESTIMONY', label: '간증' },
  { value: 'PRAYER', label: '기도' },
  { value: 'MISSION', label: '선교' },
];

export default function WriteScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('GENERAL');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!content.trim() || submitting) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('posts').insert({
      author_id: user.id,
      category,
      content: content.trim(),
      visibility: 'PUBLIC',
      tags: [],
    });
    setSubmitting(false);
    if (error) { Alert.alert('오류', error.message); return; }
    setContent('');
    router.push('/(app)/feed');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.categoryRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[s.categoryChip, category === c.value && s.categoryChipActive]}
              onPress={() => setCategory(c.value)}
            >
              <Text style={[s.categoryLabel, category === c.value && s.categoryLabelActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={s.contentInput}
          value={content}
          onChangeText={setContent}
          placeholder="무슨 생각을 하고 계신가요?"
          multiline
          autoFocus
          maxLength={5000}
          textAlignVertical="top"
        />

        <Text style={s.charCount}>{content.length}/5000</Text>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.submitBtn, (!content.trim() || submitting) && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!content.trim() || submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>게시하기</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff', padding: 16 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  categoryChipActive: { backgroundColor: '#1f2937', borderColor: '#1f2937' },
  categoryLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  categoryLabelActive: { color: '#fff' },
  contentInput: {
    fontSize: 16, color: '#1f2937', lineHeight: 26,
    minHeight: 200, paddingTop: 0,
  },
  charCount: { fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 8 },
  footer: {
    padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff',
  },
  submitBtn: {
    backgroundColor: '#1f2937', borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
