import { useEffect, useState, useCallback } from 'react';
import { FlatList, View, Text, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { PostCard } from '@/components/PostCard';
import type { PostWithAuthor } from '@/lib/types';

const PAGE_SIZE = 20;

export default function FeedScreen() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  async function fetchPosts(reset = false) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('posts')
      .select(`
        id, author_id, category, content, visibility, tags, created_at,
        youtube_url, media_urls, is_subscriber_only,
        users!posts_author_id_fkey(id, name, role, bio, affiliation, church, username, avatar_url),
        reactions(reaction_type, user_id),
        comments(id)
      `)
      .in('visibility', ['PUBLIC', 'MEMBERS'])
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (!reset && cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error || !data) return;

    const mapped: PostWithAuthor[] = data.map((row: any) => {
      const author = Array.isArray(row.users) ? row.users[0] : row.users;
      const reactions = row.reactions ?? [];
      const myReaction = reactions.find((r: any) => r.user_id === user.id);
      return {
        id: row.id,
        authorId: row.author_id,
        category: row.category,
        content: row.content,
        visibility: row.visibility,
        tags: row.tags ?? [],
        createdAt: row.created_at,
        youtubeUrl: row.youtube_url,
        mediaUrls: row.media_urls ?? [],
        isSubscriberOnly: row.is_subscriber_only ?? false,
        author: {
          id: author?.id ?? '',
          name: author?.name ?? '',
          role: author?.role ?? 'LAY',
          bio: author?.bio,
          affiliation: author?.affiliation,
          church: author?.church,
          username: author?.username,
          avatarUrl: author?.avatar_url,
          createdAt: '',
        },
        reactionCount: reactions.length,
        myReaction: myReaction?.reaction_type ?? null,
        commentCount: (row.comments ?? []).length,
      };
    });

    if (reset) {
      setPosts(mapped);
    } else {
      setPosts((prev) => [...prev, ...mapped]);
    }
    setHasMore(mapped.length === PAGE_SIZE);
    setCursor(mapped[mapped.length - 1]?.createdAt ?? null);
  }

  useEffect(() => { fetchPosts(true).finally(() => setLoading(false)); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCursor(null);
    await fetchPosts(true);
    setRefreshing(false);
  }, []);

  const onEndReached = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPosts();
    setLoadingMore(false);
  }, [loadingMore, hasMore, cursor]);

  async function handleReact(postId: string, reaction: 'PRAYED' | 'WITH_YOU') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const existing = posts.find(p => p.id === postId)?.myReaction;
    if (existing === reaction) {
      await supabase.from('reactions').delete().match({ post_id: postId, user_id: user.id });
    } else {
      await supabase.from('reactions').upsert({ post_id: postId, user_id: user.id, reaction_type: reaction });
    }
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const wasReacted = p.myReaction === reaction;
      return { ...p, myReaction: wasReacted ? null : reaction, reactionCount: wasReacted ? p.reactionCount - 1 : p.reactionCount + 1 };
    }));
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#1f2937" /></View>;
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard post={item} onReact={handleReact} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>게시물이 없습니다</Text></View>}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} color="#9ca3af" /> : null}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  empty: { color: '#9ca3af', fontSize: 15 },
});
