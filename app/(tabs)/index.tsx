import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type JoinCard = {
  id: 'member' | 'counselor';
  title: string;
  subtitle: string;
  icon: 'heart' | 'stethoscope';
  iconColor: string;
  iconBackground: string;
};

const joinCards: JoinCard[] = [
  {
    id: 'member',
    title: 'Member',
    subtitle: 'Seeking support & wellness',
    icon: 'heart',
    iconColor: '#0D8AF3',
    iconBackground: '#EAF5FF',
  },
  {
    id: 'counselor',
    title: 'Counselor',
    subtitle: 'Providing expert care',
    icon: 'stethoscope',
    iconColor: '#0B7A75',
    iconBackground: '#E7F7F4',
  },
];

export default function RoleSelectionScreen() {
  const handlePressCard = (id: JoinCard['id']) => {
    void Haptics.selectionAsync();

    if (id === 'counselor') {
      router.push('/counselor-register');
      return;
    }

    router.push('/(main-tabs)/home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor="#2F88E8" translucent={false} />
      <View style={styles.container}>
        <View pointerEvents="none" style={styles.topGlow} />
        <View pointerEvents="none" style={styles.bottomGlow} />

        <View style={styles.header}>
          <Text style={styles.title}>Welcome to MindCare</Text>
          <Text style={styles.subtitle}>Your journey to mental wellness starts here</Text>
          <Text style={styles.joinPrompt}>I want to join as a</Text>
        </View>

        <View style={styles.cardsWrap}>
          {joinCards.map((card) => (
            <TouchableOpacity key={card.id} style={styles.card} activeOpacity={0.92} onPress={() => handlePressCard(card.id)}>
              <View style={[styles.iconWrap, { backgroundColor: card.iconBackground }]}>
                {card.id === 'member' ? (
                  <Ionicons name={card.icon as 'heart'} size={30} color={card.iconColor} />
                ) : (
                  <MaterialCommunityIcons name={card.icon as 'stethoscope'} size={32} color={card.iconColor} />
                )}
              </View>

              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              </View>

              <View style={styles.arrowWrap}>
                <Ionicons name="arrow-forward" size={18} color="#16324F" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2F88E8',
  },
  container: {
    flex: 1,
    backgroundColor: '#2F88E8',
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  topGlow: {
    position: 'absolute',
    top: 40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 90,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(187, 231, 255, 0.12)',
  },
  header: {
    marginBottom: 28,
  },
  title: {
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 40,
    lineHeight: 46,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 21,
    color: '#E7F2FF',
    fontWeight: '500',
    paddingHorizontal: 18,
  },
  joinPrompt: {
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardsWrap: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: '#123D6A',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    lineHeight: 28,
    color: '#0F1728',
    fontWeight: '800',
  },
  cardSubtitle: {
    marginTop: 4,
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    color: '#6C7788',
    fontWeight: '500',
  },
  arrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDF4FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
