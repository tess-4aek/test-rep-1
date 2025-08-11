import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, MessageCircle, CreditCard } from 'lucide-react-native';
import { router } from 'expo-router';
import { t } from '@/lib/i18n';
import { getUserData, User } from '@/utils/auth';

export default function PersonalInformationPage() {
  const [userData, setUserData] = React.useState<User | null>(null);

  React.useEffect(() => {
    const loadUserData = async () => {
      const user = await getUserData();
      setUserData(user);
    };
    loadUserData();
  }, []);

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#0C1E3C" size={24} />
        </TouchableOpacity>
        <Text 
          style={styles.headerTitle}
          adjustsFontSizeToFit
          numberOfLines={1}
          minimumFontScale={0.7}
        >
          {t('personalInformation')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Telegram Account Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MessageCircle color="#3D8BFF" size={24} />
            <Text 
              style={styles.cardTitle}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.7}
            >
              {t('telegramAccount')}
            </Text>
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text 
                style={styles.infoLabel}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {t('username')}
              </Text>
              <Text 
                style={styles.infoValue}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {userData?.username ? `@${userData.username}` : 'Not available'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bank Account Section - Only show if bank details exist */}
        {userData?.bank_details_status && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <CreditCard color="#10B981" size={24} />
              <Text 
                style={styles.cardTitle}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {t('bankAccountDetails')}
              </Text>
            </View>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text 
                  style={styles.infoLabel}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  minimumFontScale={0.7}
                >
                  {t('fullName')}
                </Text>
                <Text 
                  style={styles.infoValue}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  minimumFontScale={0.7}
                >
                  {userData?.bank_full_name || 'Not provided'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text 
                  style={styles.infoLabel}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  minimumFontScale={0.7}
                >
                  {t('iban')}
                </Text>
                <Text 
                  style={styles.infoValue}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  minimumFontScale={0.7}
                >
                  {userData?.bank_iban || 'Not provided'}
                </Text>
              </View>
              
              {userData?.bank_swift_bic && (
                <View style={styles.infoRow}>
                  <Text 
                    style={styles.infoLabel}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.7}
                  >
                    {t('swiftBic')}
                  </Text>
                  <Text 
                    style={styles.infoValue}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.7}
                  >
                    {userData.bank_swift_bic}
                  </Text>
                </View>
              )}
              
              {userData?.bank_name && (
                <View style={styles.infoRow}>
                  <Text 
                    style={styles.infoLabel}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.7}
                  >
                    {t('bankName')}
                  </Text>
                  <Text 
                    style={styles.infoValue}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.7}
                  >
                    {userData.bank_name}
                  </Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Text 
                  style={styles.infoLabel}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  minimumFontScale={0.7}
                >
                  {t('country')}
                </Text>
                <Text 
                  style={styles.infoValue}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  minimumFontScale={0.7}
                >
                  {userData?.bank_country || 'Not provided'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Info Note */}
        <View style={styles.noteContainer}>
          <Text 
            style={styles.noteText}
            adjustsFontSizeToFit
            numberOfLines={2}
            minimumFontScale={0.7}
          >
            {t('updateInfoNote')}
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#F4F6F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 32,
    marginBottom: 24,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
    lineHeight: 22,
  },
  infoContainer: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 20,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1E3C',
    lineHeight: 20,
    textAlign: 'right',
    flex: 2,
  },
  noteContainer: {
    paddingHorizontal: 32,
    marginTop: 16,
  },
  noteText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});