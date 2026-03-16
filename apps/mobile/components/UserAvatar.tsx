import { View, Text, Image, StyleSheet } from 'react-native';

interface Props {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}

export function UserAvatar({ name, avatarUrl, size = 40 }: Props) {
  const initials = name.trim().charAt(0).toUpperCase();
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  return (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: '#e5e7eb' },
  placeholder: { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#6b7280', fontWeight: '600' },
});
