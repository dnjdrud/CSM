import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserAvatar } from '@/components/UserAvatar';
import type { User } from '@/lib/types';

const ROLE_DISPLAY: Record<string, string> = {
  LAY: '평신도', MINISTRY_WORKER: '전도사', PASTOR: '목사',
  MISSIONARY: '선교사', SEMINARIAN: '신학생', ADMIN: '관리자',
};

export default function SettingsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) return;
      supabase.from('users').select('id, name, role, bio, affiliation, church, username, avatar_url, created_at')
        .eq('id', authUser.id).single()
        .then(({ data }) => {
          if (data) setUser({ id: data.id, name: data.name, role: data.role, bio: data.bio, affiliation: data.affiliation, church: data.church, username: data.username, avatarUrl: data.avatar_url, createdAt: data.created_at });
        });
    });
  }, []);

  async function handleSignOut() {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
        router.replace('/(auth)/login');
      }},
    ]);
  }

  return (
    <ScrollView style={s.scroll}>
      {user && (
        <TouchableOpacity style={s.profileCard} onPress={() => router.push(`/(app)/profile/${user.id}`)}>
          <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size={56} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={s.userName}>{user.name}</Text>
            <Text style={s.userRole}>{ROLE_DISPLAY[user.role] ?? user.role}</Text>
            {user.church && <Text style={s.userSub}>{user.church}</Text>}
          </View>
          <Text style={s.chevron}>›</Text>
        </TouchableOpacity>
      )}

      <View style={s.section}>
        <Text style={s.sectionTitle}>계정</Text>
        <TouchableOpacity style={s.row} onPress={() => Alert.alert('준비중', '프로필 편집은 곧 추가됩니다.')}>
          <Text style={s.rowText}>프로필 편집</Text>
          <Text style={s.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>기타</Text>
        <TouchableOpacity style={s.row} onPress={handleSignOut}>
          <Text style={[s.rowText, { color: '#ef4444' }]}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.version}>셀라 v1.0.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f9fafb' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  userName: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  userRole: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  userSub: { fontSize: 13, color: '#9ca3af', marginTop: 1 },
  section: { backgroundColor: '#fff', marginBottom: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#9ca3af', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowText: { flex: 1, fontSize: 15, color: '#1f2937' },
  chevron: { fontSize: 20, color: '#d1d5db' },
  version: { textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 24 },
});
