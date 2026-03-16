import { useEffect, useState } from 'react';
import { ScrollView, View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { UserAvatar } from '@/components/UserAvatar';
import { PostCard } from '@/components/PostCard';
import type { User, PostWithAuthor } from '@/lib/types';

const ROLE_DISPLAY: Record<string, string> = {
  LAY: '평신도', MINISTRY_WORKER: '전도사', PASTOR: '목사',
  MISSIONARY: '선교사', SEMINARIAN: '신학생', ADMIN: '관리자',
};

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user: me } } = await supabase.auth.getUser();
      setMyId(me?.id ?? null);

      const [{ data: profile }, { data: postRows }, { data: followers }, { data: following }, { data: followCheck }] = await Promise.all([
        supabase.from('users').select('id, name, role, bio, affiliation, church, username, avatar_url, created_at').eq('id', id).single(),
        supabase.from('posts').select(`
          id, author_id, category, content, visibility, tags, created_at,
          users!posts_author_id_fkey(id, name, role, avatar_url),
          reactions(reaction_type, user_id), comments(id)
        `).eq('author_id', id).in('visibility', ['PUBLIC', 'MEMBERS']).order('created_at', { ascending: false }).limit(20),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', id),
        me ? supabase.from('follows').select('id').eq('follower_id', me.id).eq('following_id', id).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      if (profile) {
        setUser({ id: profile.id, name: profile.name, role: profile.role, bio: profile.bio, affiliation: profile.affiliation, church: profile.church, username: profile.username, avatarUrl: profile.avatar_url, createdAt: profile.created_at });
      }
      setFollowerCount(followers.count ?? 0);
      setFollowingCount(following.count ?? 0);
      setIsFollowing(!!followCheck);

      if (postRows) {
        setPosts(postRows.map((row: any) => {
          const author = Array.isArray(row.users) ? row.users[0] : row.users;
          const reactions = row.reactions ?? [];
          const myReaction = reactions.find((r: any) => r.user_id === me?.id);
          return {
            id: row.id, authorId: row.author_id, category: row.category, content: row.content,
            visibility: row.visibility, tags: row.tags ?? [], createdAt: row.created_at,
            author: { id: author?.id ?? '', name: author?.name ?? '', role: author?.role ?? 'LAY', avatarUrl: author?.avatar_url, createdAt: '' },
            reactionCount: reactions.length, myReaction: myReaction?.reaction_type ?? null,
            commentCount: (row.comments ?? []).length,
          };
        }));
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleFollow() {
    if (!myId) return;
    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: myId, following_id: id });
      setIsFollowing(false);
      setFollowerCount(n => n - 1);
    } else {
      await supabase.from('follows').insert({ follower_id: myId, following_id: id });
      setIsFollowing(true);
      setFollowerCount(n => n + 1);
    }
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#1f2937" /></View>;
  if (!user) return <View style={s.center}><Text style={s.empty}>사용자를 찾을 수 없습니다</Text></View>;

  const isMe = myId === user.id;

  return (
    <ScrollView style={s.scroll}>
      <View style={s.header}>
        <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size={72} />
        <View style={s.info}>
          <Text style={s.name}>{user.name}</Text>
          <Text style={s.role}>{ROLE_DISPLAY[user.role] ?? user.role}</Text>
          {user.church && <Text style={s.sub}>{user.church}</Text>}
          {user.affiliation && <Text style={s.sub}>{user.affiliation}</Text>}
        </View>
      </View>

      {user.bio && <Text style={s.bio}>{user.bio}</Text>}

      <View style={s.statsRow}>
        <View style={s.stat}><Text style={s.statNum}>{followerCount}</Text><Text style={s.statLabel}>팔로워</Text></View>
        <View style={s.stat}><Text style={s.statNum}>{followingCount}</Text><Text style={s.statLabel}>팔로잉</Text></View>
        <View style={s.stat}><Text style={s.statNum}>{posts.length}</Text><Text style={s.statLabel}>게시물</Text></View>
      </View>

      {!isMe && myId && (
        <TouchableOpacity style={[s.followBtn, isFollowing && s.followingBtn]} onPress={handleFollow}>
          <Text style={[s.followBtnText, isFollowing && s.followingBtnText]}>
            {isFollowing ? '팔로잉' : '팔로우'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={s.divider} />

      {posts.map((p) => <PostCard key={p.id} post={p} />)}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  empty: { color: '#9ca3af', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  info: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  role: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  sub: { fontSize: 13, color: '#9ca3af', marginTop: 1 },
  bio: { paddingHorizontal: 20, paddingBottom: 16, fontSize: 14, color: '#374151', lineHeight: 22 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 16, gap: 24 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  statLabel: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  followBtn: {
    marginHorizontal: 20, marginBottom: 16, borderWidth: 1.5, borderColor: '#1f2937',
    borderRadius: 8, paddingVertical: 10, alignItems: 'center',
  },
  followingBtn: { backgroundColor: '#1f2937' },
  followBtnText: { fontWeight: '600', fontSize: 14, color: '#1f2937' },
  followingBtnText: { color: '#fff' },
  divider: { height: 8, backgroundColor: '#f3f4f6' },
});
