import { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { UserAvatar } from '@/components/UserAvatar';
import type { PostWithAuthor, Comment } from '@/lib/types';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const [{ data: row }, { data: commentRows }] = await Promise.all([
        supabase.from('posts').select(`
          id, author_id, category, content, visibility, tags, created_at, youtube_url,
          users!posts_author_id_fkey(id, name, role, bio, avatar_url),
          reactions(reaction_type, user_id),
          comments(id)
        `).eq('id', id).single(),
        supabase.from('comments').select(`
          id, post_id, author_id, content, created_at, parent_id,
          users!comments_author_id_fkey(id, name, role, avatar_url)
        `).eq('post_id', id).is('parent_id', null).order('created_at', { ascending: true }),
      ]);

      if (row) {
        const author = Array.isArray(row.users) ? row.users[0] : row.users;
        const reactions = row.reactions ?? [];
        const myReaction = reactions.find((r: any) => r.user_id === user?.id);
        setPost({
          id: row.id, authorId: row.author_id, category: row.category,
          content: row.content, visibility: row.visibility, tags: row.tags ?? [],
          createdAt: row.created_at, youtubeUrl: row.youtube_url, mediaUrls: [],
          author: { id: author?.id ?? '', name: author?.name ?? '', role: author?.role ?? 'LAY', avatarUrl: author?.avatar_url, createdAt: '' },
          reactionCount: reactions.length, myReaction: myReaction?.reaction_type ?? null,
          commentCount: (row.comments ?? []).length,
        });
      }
      if (commentRows) {
        setComments(commentRows.map((c: any) => {
          const a = Array.isArray(c.users) ? c.users[0] : c.users;
          return { id: c.id, postId: c.post_id, authorId: c.author_id, content: c.content, createdAt: c.created_at, parentId: c.parent_id,
            author: { id: a?.id ?? '', name: a?.name ?? '', role: a?.role ?? 'LAY', avatarUrl: a?.avatar_url, createdAt: '' } };
        }));
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleComment() {
    if (!commentText.trim() || submitting) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({ post_id: id, author_id: user.id, content: commentText.trim() });
    setSubmitting(false);
    if (error) { Alert.alert('오류', error.message); return; }
    setCommentText('');
    // Reload comments
    const { data } = await supabase.from('comments').select(`
      id, post_id, author_id, content, created_at, parent_id,
      users!comments_author_id_fkey(id, name, role, avatar_url)
    `).eq('post_id', id).is('parent_id', null).order('created_at', { ascending: true });
    if (data) setComments(data.map((c: any) => {
      const a = Array.isArray(c.users) ? c.users[0] : c.users;
      return { id: c.id, postId: c.post_id, authorId: c.author_id, content: c.content, createdAt: c.created_at, parentId: c.parent_id,
        author: { id: a?.id ?? '', name: a?.name ?? '', role: a?.role ?? 'LAY', avatarUrl: a?.avatar_url, createdAt: '' } };
    }));
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#1f2937" /></View>;
  if (!post) return <View style={s.center}><Text style={s.empty}>게시물을 찾을 수 없습니다</Text></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={s.postCard}>
          <View style={s.header}>
            <UserAvatar name={post.author.name} avatarUrl={post.author.avatarUrl} size={40} />
            <View style={{ marginLeft: 10 }}>
              <Text style={s.authorName}>{post.author.name}</Text>
              <Text style={s.meta}>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</Text>
            </View>
          </View>
          <Text style={s.content}>{post.content}</Text>
          <View style={s.footer}>
            <Text style={s.reactionCount}>🙏 {post.reactionCount}  💬 {post.commentCount}</Text>
          </View>
        </View>

        <View style={s.commentsSection}>
          <Text style={s.commentsTitle}>댓글 {comments.length}</Text>
          {comments.map((c) => (
            <View key={c.id} style={s.comment}>
              <UserAvatar name={c.author.name} avatarUrl={c.author.avatarUrl} size={32} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={s.commentAuthor}>{c.author.name}</Text>
                <Text style={s.commentContent}>{c.content}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={s.inputBar}>
        <TextInput
          style={s.input}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="댓글을 입력하세요..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity style={[s.sendBtn, (!commentText.trim() || submitting) && { opacity: 0.4 }]} onPress={handleComment} disabled={!commentText.trim() || submitting}>
          <Text style={s.sendText}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#9ca3af', fontSize: 15 },
  postCard: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  authorName: { fontWeight: '600', fontSize: 15, color: '#1f2937' },
  meta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  content: { fontSize: 16, color: '#374151', lineHeight: 26 },
  footer: { marginTop: 16 },
  reactionCount: { color: '#6b7280', fontSize: 14 },
  commentsSection: { padding: 16 },
  commentsTitle: { fontWeight: '600', color: '#374151', fontSize: 14, marginBottom: 12 },
  comment: { flexDirection: 'row', marginBottom: 16 },
  commentAuthor: { fontWeight: '600', fontSize: 13, color: '#1f2937' },
  commentContent: { fontSize: 14, color: '#374151', marginTop: 2, lineHeight: 20 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff',
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    marginLeft: 10, backgroundColor: '#1f2937', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  sendText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
