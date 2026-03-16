import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#1f2937',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#f3f4f6' },
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '600', color: '#1f2937' },
      }}
    >
      <Tabs.Screen
        name="feed/index"
        options={{
          title: '피드',
          tabBarLabel: '피드',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          headerTitle: '셀라',
        }}
      />
      <Tabs.Screen
        name="write"
        options={{
          title: '글쓰기',
          tabBarLabel: '글쓰기',
          tabBarIcon: ({ color, size }) => <Ionicons name="create-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: '알림',
          tabBarLabel: '알림',
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarLabel: '설정',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="feed/[id]" options={{ href: null, headerShown: true, title: '게시물' }} />
      <Tabs.Screen name="profile/[id]" options={{ href: null, headerShown: true, title: '프로필' }} />
    </Tabs>
  );
}
