import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { UserAvatar } from './UserAvatar';
import type { PostWithAuthor, ReactionType } from '@/lib/types';

const CATEGORY_LABEL: Record<string, string> = {
  GENERAL: '일반', DEVOTIONAL: '묵상', MINISTRY: '사역', TESTIMONY: '간증',
  PHOTO: '사진', PRAYER: '기도', CELL: '셀', CONTENT: '컨텐츠', REQUEST: '요청', MISSION: '선교',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return `${Math.floor(diff / 86400000)}일 전`;
}

interface Props {
  post: PostWithAuthor;
  onReact?: (postId: string, reaction: ReactionType) => void;
}

export function PostCard({ post, onReact }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.push(`/(app)/feed/${post.id}`)}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push(`/(app)/profile/${post.author.id}`)}>
          <UserAvatar name={post.author.name} avatarUrl={post.author.avatarUrl} size={38} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <TouchableOpacity onPress={() => router.push(`/(app)/profile/${post.author.id}`)}>
            <Text style={styles.authorName}>{post.author.name}</Text>
          </TouchableOpacity>
          <Text style={styles.meta}>{formatDate(post.createdAt)} · {CATEGORY_LABEL[post.category] ?? post.category}</Text>
        </View>
      </View>

      <Text style={styles.content} numberOfLines={5}>{post.content}</Text>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.reactionBtn} onPress={() => onReact?.(post.id, 'PRAYED')}>
          <Text style={[styles.reactionIcon, post.myReaction === 'PRAYED' && styles.reactionActive]}>🙏</Text>
          <Text style={styles.reactionCount}>{post.reactionCount > 0 ? post.reactionCount : ''}</Text>
        </TouchableOpacity>
        <View style={styles.commentBtn}>
          <Text style={styles.commentIcon}>💬</Text>
          <Text style={styles.reactionCount}>{post.commentCount > 0 ? post.commentCount : ''}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  headerText: { marginLeft: 10, flex: 1 },
  authorName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  meta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  content: { fontSize: 15, color: '#374151', lineHeight: 22 },
  footer: { flexDirection: 'row', marginTop: 12, gap: 16 },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reactionIcon: { fontSize: 18, opacity: 0.5 },
  reactionActive: { opacity: 1 },
  reactionCount: { fontSize: 13, color: '#6b7280' },
  commentBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentIcon: { fontSize: 18, opacity: 0.5 },
});
