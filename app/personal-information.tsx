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

export default function PersonalInformationPage() {
  const handleBack = () => {
    router.back();
  };

  // Mock user data - in real app this would come from state/API
  const userData = {
    telegram: {
      username: '@johndoe',
    },
    bankAccount: {
      fullName: 'John Doe',
      iban: 'GB29 NWBK 6016 1331 9268 19',
      swiftBic: 'NWBKGB2L',
      bankName: 'NatWest Bank',
      country: 'United Kingdom',
    },
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#0C1E3C" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('personalInfo')}</Text>
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
            <Text style={styles.cardTitle}>{t('telegramAccount')}</Text>
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('username')}</Text>
              <Text style={styles.infoValue}>{userData.telegram.username}</Text>
            </View>
          </View>
        </View>

        {/* Bank Account Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CreditCard color="#10B981" size={24} />
            <Text style={styles.cardTitle}>{t('bankAccountDetails')}</Text>
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('fullName')}</Text>
              <Text style={styles.infoValue}>{userData.bankAccount.fullName}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('iban')}</Text>
              <Text style={styles.infoValue}>{userData.bankAccount.iban}</Text>
            </View>
            
            {userData.bankAccount.swiftBic && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('swiftBic')}</Text>
                <Text style={styles.infoValue}>{userData.bankAccount.swiftBic}</Text>
              </View>
            )}
            
            {userData.bankAccount.bankName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('bankName')}</Text>
                <Text style={styles.infoValue}>{userData.bankAccount.bankName}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('country')}</Text>
              <Text style={styles.infoValue}>{userData.bankAccount.country}</Text>
            </View>
          </View>
        </View>

        {/* Info Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
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