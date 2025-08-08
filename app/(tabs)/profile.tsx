import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { User, CreditCard, Shield, Settings, CircleHelp as HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { t } from '@/lib/i18n';
import { getUserData, User as UserType } from '@/utils/auth';

const menuItems = [
  {
    icon: <User color="#6B7280" size={20} />,
    title: t('personalInformation'),
    subtitle: t('updateProfile'),
  },
  {
    icon: <Settings color="#6B7280" size={20} />,
    title: t('appSettings'),
    subtitle: t('appPreferences'),
  },
  {
    icon: <HelpCircle color="#6B7280" size={20} />,
    title: t('helpAndSupport'),
    subtitle: t('getHelp'),
  },
];

export default function ProfilePage() {
  const [userData, setUserData] = React.useState<UserType | null>(null);

  React.useEffect(() => {
    const loadUserData = async () => {
      const user = await getUserData();
      setUserData(user);
    };
    loadUserData();
  }, []);

  const handleMenuItemPress = (index: number) => {
    switch (index) {
      case 0: // Personal Information
        router.push('/personal-information');
        break;
      case 1: // Settings
        router.push('/settings');
        break;
      case 2: // Help & Support
        router.push('/help-support');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>{t('profile')}</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User color="#3D8BFF" size={32} />
            </View>
          </View>
          <Text style={styles.userName}>{userData?.name || 'User'}</Text>
          <Text style={styles.userEmail}>
            {userData?.telegram_username ? `@${userData.telegram_username}` : 'No username'}
          </Text>
          <View style={styles.verificationBadge}>
            <Shield color="#10B981" size={16} />
            <Text style={styles.verificationText}>{t('verifiedAccount')}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(index)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}>
                {item.icon}
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton}>
            <LogOut color="#EF4444" size={20} />
            <Text style={styles.logoutText}>{t('signOut')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0C1E3C',
    lineHeight: 34,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 32,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3D8BFF' + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0C1E3C',
    marginBottom: 4,
    lineHeight: 28,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981' + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    lineHeight: 18,
  },
  menuContainer: {
    paddingHorizontal: 32,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F4F6F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1E3C',
    marginBottom: 2,
    lineHeight: 20,
  },
  menuSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },
  logoutContainer: {
    paddingHorizontal: 32,
    marginTop: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    lineHeight: 20,
  },
});