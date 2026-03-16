import { useEffect, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/lib/types';

const NOTIF_LABELS: Record<string, string> = {
  NEW_FOLLOWER: '님이 팔로우했습니다',
  POST_REACTION: '님이 기도했습니다',
  POST_COMMENT: '님이 댓글을 남겼습니다',
  COMMENT_REPLY: '님이 답글을 남겼습니다',
  COMMENT_LIKE: '님이 댓글에 좋아요를 눌렀습니다',
  DAILY_PRAYER: '오늘의 기도',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return '방금';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return `${Math.floor(diff / 86400000)}일 전`;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select(`id, type, actor_id, post_id, comment_id, message, read, created_at,
        users!notifications_actor_id_fkey(id, name, avatar_url)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      setNotifications(data.map((n: any) => {
        const actor = Array.isArray(n.users) ? n.users[0] : n.users;
        return {
          id: n.id, type: n.type, actorId: n.actor_id, postId: n.post_id,
          commentId: n.comment_id, message: n.message, read: n.read, createdAt: n.created_at,
          actor: actor ? { id: actor.id, name: actor.name, role: 'LAY', avatarUrl: actor.avatar_url, createdAt: '' } : null,
        };
      }));
    }
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  async function handleMarkRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#1f2937" /></View>;

  return (
    <FlatList
      data={notifications}
      keyExtractor={n => n.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item: n }) => (
        <TouchableOpacity style={[s.item, !n.read && s.unread]} onPress={() => handleMarkRead(n.id)} activeOpacity={0.7}>
          <View style={s.row}>
            <View style={[s.dot, !n.read && s.dotActive]} />
            <View style={{ flex: 1 }}>
              <Text style={s.text}>
                {n.actor ? <Text style={s.bold}>{n.actor.name}</Text> : null}
                {n.actor ? ' ' : ''}{NOTIF_LABELS[n.type] ?? n.type}
              </Text>
              {n.message && <Text style={s.message} numberOfLines={2}>{n.message}</Text>}
              <Text style={s.time}>{formatDate(n.createdAt)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<View style={s.center}><Text style={s.empty}>알림이 없습니다</Text></View>}
      style={s.list}
    />
  );
}

const s = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  empty: { color: '#9ca3af', fontSize: 15 },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  unread: { backgroundColor: '#f9fafb' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e7eb', marginTop: 5 },
  dotActive: { backgroundColor: '#3b82f6' },
  text: { fontSize: 14, color: '#374151', lineHeight: 20 },
  bold: { fontWeight: '600', color: '#1f2937' },
  message: { fontSize: 13, color: '#6b7280', marginTop: 3, lineHeight: 18 },
  time: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
});
