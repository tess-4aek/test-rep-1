import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { t } from '@/lib/i18n';

export default function OrderDetailsPage() {
  const handleBack = () => {
    router.back();
  };

  const handleAskQuestion = async () => {
    const message = encodeURIComponent(t('askQuestion'));
    const telegramUrl = `tg://resolve?domain=YourBotUsername&text=${message}`;
    
    try {
      await WebBrowser.openBrowserAsync(telegramUrl);
    } catch (error) {
      console.error('Error opening Telegram:', error);
    }
  };

  // Mock order data - in real app this would come from props/state
  const orderData = {
    amount: '1000.00',
    fromCurrency: 'USDC',
    toCurrency: 'EUR',
    exchangeRate: '1 USDC ≈ 0.92 EUR',
    fee: '0.5%',
    estimatedReceived: '915.40',
    status: t('processing'),
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#0C1E3C" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('orderDetails')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('exchangeOrder')}</Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('amount')}</Text>
              <Text style={styles.detailValue}>
                {orderData.amount} {orderData.fromCurrency}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('currency')}</Text>
              <Text style={styles.detailValue}>
                {orderData.fromCurrency} → {orderData.toCurrency}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('exchangeRate')}</Text>
              <Text style={styles.detailValue}>{orderData.exchangeRate}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('fee')}</Text>
              <Text style={styles.detailValue}>{orderData.fee}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('estimatedReceived')}</Text>
              <Text style={[styles.detailValue, styles.highlightedValue]}>
                {orderData.estimatedReceived} {orderData.toCurrency}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('status')}</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusIndicator} />
                <Text style={styles.statusText}>{orderData.status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Additional Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('transactionInfo')}</Text>
          <Text style={styles.infoText}>
            {t('orderProcessing')}
          </Text>
          <Text style={styles.infoSubtext}>
            {t('processingTime')}
          </Text>
        </View>
      </ScrollView>

      {/* Ask Question Button */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.questionButton}
          onPress={handleAskQuestion}
          activeOpacity={0.9}
        >
          <MessageCircle color="#3D8BFF" size={20} style={styles.buttonIcon} />
          <Text style={styles.questionButtonText}>{t('askQuestion')}</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 20,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
    marginBottom: 20,
    lineHeight: 22,
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 20,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1E3C',
    lineHeight: 20,
    textAlign: 'right',
  },
  highlightedValue: {
    color: '#3D8BFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    lineHeight: 20,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0C1E3C',
    lineHeight: 22,
    marginBottom: 8,
  },
  infoSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 18,
  },
  ctaContainer: {
    backgroundColor: '#F4F6F9',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 50,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  questionButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3D8BFF',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  questionButtonText: {
    color: '#3D8BFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});