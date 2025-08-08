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
import { router, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';
import { t } from '@/lib/i18n';
import { Order } from '@/types/order';

// Mock function to get order by ID - in real app this would fetch from database
const getOrderById = (orderId: string): Order | null => {
  const orders: Order[] = [
    {
      id: '1',
      type: 'buy',
      title: `${t('bought')} Bitcoin`,
      amount: '+$500.00',
      crypto: '0.0125 BTC',
      time: '2 hours ago',
      status: 'completed',
      fromCurrency: 'USD',
      toCurrency: 'BTC',
      exchangeRate: '1 USD ≈ 0.000025 BTC',
      fee: '0.5%',
      estimatedReceived: '0.0125',
    },
    {
      id: '2',
      type: 'sell',
      title: `${t('sold')} Ethereum`,
      amount: '-$1,200.00',
      crypto: '0.75 ETH',
      time: '1 day ago',
      status: 'completed',
      fromCurrency: 'ETH',
      toCurrency: 'USD',
      exchangeRate: '1 ETH ≈ 1600 USD',
      fee: '0.5%',
      estimatedReceived: '1200.00',
    },
    {
      id: '3',
      type: 'buy',
      title: `${t('bought')} Litecoin`,
      amount: '+$300.00',
      crypto: '4.2 LTC',
      time: '3 days ago',
      status: 'pending',
      fromCurrency: 'USD',
      toCurrency: 'LTC',
      exchangeRate: '1 USD ≈ 0.014 LTC',
      fee: '0.5%',
      estimatedReceived: '4.2',
    },
    {
      id: '4',
      type: 'sell',
      title: `${t('sold')} Bitcoin`,
      amount: '-$800.00',
      crypto: '0.02 BTC',
      time: '1 week ago',
      status: 'completed',
      fromCurrency: 'BTC',
      toCurrency: 'USD',
      exchangeRate: '1 BTC ≈ 40000 USD',
      fee: '0.5%',
      estimatedReceived: '800.00',
    },
  ];

  return orders.find(order => order.id === orderId) || null;
};

export default function OrderDetailsPage() {
  const params = useLocalSearchParams<{
    orderId?: string;
    isExistingOrder?: string;
  }>();
  
  const isExistingOrder = params.isExistingOrder === 'true';
  const orderId = params.orderId;
  
  // Get order data if it's an existing order
  const orderData = React.useMemo(() => {
    if (isExistingOrder && orderId) {
      return getOrderById(orderId);
    }
    
    // Default data for new orders (current behavior)
    return {
      id: 'new',
      type: 'buy' as const,
      title: t('exchangeOrder'),
      amount: '1000.00',
      crypto: '',
      time: '',
      status: t('processing'),
      fromCurrency: 'USDC',
      toCurrency: 'EUR',
      exchangeRate: '1 USDC ≈ 0.92 EUR',
      fee: '0.5%',
      estimatedReceived: '915.40',
    };
  }, [isExistingOrder, orderId]);

  const handleBack = () => {
    router.back();
  };

  const handleAskQuestion = async () => {
    const message = encodeURIComponent(t('askQuestion'));
    const telegramUrl = `tg://resolve?domain=YourBotUsername&text=${message}`;
    
    try {
      await Linking.openURL(telegramUrl);
    } catch (error) {
      console.error('Error opening Telegram:', error);
    }
  };

  if (!orderData) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>{t('goBack')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
                {orderData.amount.replace(/[+-]/g, '')} {orderData.fromCurrency}
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
                <View style={[
                  styles.statusIndicator,
                  { 
                    backgroundColor: orderData.status === 'completed' ? '#10B981' : 
                                   orderData.status === 'pending' ? '#F59E0B' : '#6B7280'
                  }
                ]} />
                <Text style={[
                  styles.statusText,
                  { 
                    color: orderData.status === 'completed' ? '#10B981' : 
                           orderData.status === 'pending' ? '#F59E0B' : '#6B7280'
                  }
                ]}>
                  {orderData.status === 'pending' ? t('pending') : 
                   orderData.status === 'processing' ? t('processing') : 
                   orderData.status === 'completed' ? t('completed') : orderData.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Additional Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('transactionInfo')}</Text>
          <Text style={styles.infoText}>
            {isExistingOrder 
              ? (orderData.status === 'completed' 
                  ? 'This order has been completed successfully.' 
                  : 'This order is currently being processed.')
              : t('orderProcessing')
            }
          </Text>
          <Text style={styles.infoSubtext}>
            {isExistingOrder 
              ? `Order created: ${orderData.time}`
              : t('processingTime')
            }
          </Text>
        </View>
      </ScrollView>

      {/* Ask Question Button - Only show for existing orders or if it's a new order */}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
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
  backButtonText: {
    color: '#0C1E3C',
    fontSize: 16,
    fontWeight: '600',
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