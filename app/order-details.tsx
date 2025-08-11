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
import { getOrderById, CreatedOrder } from '@/lib/supabase';

// Mock function to get order by ID - in real app this would fetch from database


export default function OrderDetailsPage() {
  const params = useLocalSearchParams<{
    orderId?: string;
    isExistingOrder?: string;
  }>();
  
  const isExistingOrder = params.isExistingOrder === 'true';
  const orderId = params.orderId;
  const [realOrderData, setRealOrderData] = React.useState<CreatedOrder | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = React.useState(false);
  
  // Get order data if it's an existing order
  const orderData = React.useMemo(() => {
    if (isExistingOrder && orderId && !realOrderData) {
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
  }, [isExistingOrder, orderId, realOrderData]);

  // Fetch real order data from database if it's an existing order
  React.useEffect(() => {
    const fetchOrderData = async () => {
      if (isExistingOrder && orderId && !realOrderData) {
        setIsLoadingOrder(true);
        try {
          const order = await getOrderById(orderId);
          if (order) {
            setRealOrderData(order);
          }
        } catch (error) {
          console.error('Error fetching order:', error);
        } finally {
          setIsLoadingOrder(false);
        }
      }
    };

    fetchOrderData();
  }, [isExistingOrder, orderId, realOrderData]);

  // Use real order data if available, otherwise fall back to mock data
  const displayOrderData = React.useMemo(() => {
    if (realOrderData) {
      return {
        ...realOrderData,
        exchangeRate: realOrderData.exchange_rate,
        estimatedReceived: realOrderData.direction === 'usdc-eur' ? realOrderData.eur_amount.toString() : realOrderData.usdc_amount.toString(),
      };
    }
    return orderData;
  }, [realOrderData, orderData]);

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

  if (!displayOrderData && !isLoadingOrder) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text 
            style={styles.errorText}
            adjustsFontSizeToFit
            numberOfLines={2}
            minimumFontScale={0.7}
          >
            Order not found
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text 
              style={styles.backButtonText}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.7}
            >
              {t('goBack')}
            </Text>
              style={styles.questionButtonText}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.7}
            >
              {t('askQuestion')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoadingOrder) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text 
            style={styles.loadingText}
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.7}
          >
            Loading order details...
          </Text>
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
        <Text 
          style={styles.headerTitle}
          adjustsFontSizeToFit
          numberOfLines={1}
          minimumFontScale={0.7}
        >
          {t('orderDetails')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Details Card */}
        <View style={styles.card}>
          <Text 
            style={styles.cardTitle}
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.7}
          >
            {t('exchangeOrder')}
          </Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text 
                style={styles.detailLabel}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {t('amount')}
              </Text>
              <Text 
                style={styles.detailValue}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {displayOrderData.direction === 'usdc-eur' ? displayOrderData.usdc_amount : displayOrderData.eur_amount} {displayOrderData.direction === 'usdc-eur' ? 'USDC' : 'EUR'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text 
                style={styles.detailLabel}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {t('currency')}
              </Text>
              <Text 
                style={styles.detailValue}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {displayOrderData.direction === 'usdc-eur' ? 'USDC → EUR' : 'EUR → USDC'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text 
                style={styles.detailLabel}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {t('exchangeRate')}
              </Text>
              <Text 
                style={styles.detailValue}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {displayOrderData.exchangeRate || displayOrderData.exchange_rate}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text 
                style={styles.detailLabel}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {t('fee')}
              </Text>
              <Text 
                style={styles.detailValue}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {displayOrderData.fee_percentage || 0.5}%
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text 
                style={styles.detailLabel}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {t('estimatedReceived')}
              </Text>
              <Text style={[styles.detailValue, styles.highlightedValue]}>
                {displayOrderData.estimatedReceived} {displayOrderData.direction === 'usdc-eur' ? 'EUR' : 'USDC'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text 
                style={styles.detailLabel}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                {t('status')}
              </Text>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusIndicator,
                  { 
                    backgroundColor: displayOrderData.status === 'completed' ? '#10B981' : 
                                   displayOrderData.status === 'pending' ? '#F59E0B' : '#6B7280'
                  }
                ]} />
                <Text style={[
                  styles.statusText,
                  { 
                    color: displayOrderData.status === 'completed' ? '#10B981' : 
                           displayOrderData.status === 'pending' ? '#F59E0B' : '#6B7280'
                  }
                ]}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.7}
              >
                  {displayOrderData.status === 'pending' ? t('pending') : 
                   displayOrderData.status === 'processing' ? t('processing') : 
                   displayOrderData.status === 'completed' ? t('completed') : displayOrderData.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Additional Info Card */}
        <View style={styles.card}>
          <Text 
            style={styles.cardTitle}
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.7}
          >
            {t('transactionInfo')}
          </Text>
          <Text 
            style={styles.infoText}
            adjustsFontSizeToFit
            numberOfLines={2}
            minimumFontScale={0.7}
          >
            {isExistingOrder 
              ? (displayOrderData.status === 'completed' 
                  ? 'This order has been completed successfully.' 
                  : 'This order is currently being processed.')
              : t('orderProcessing')
            }
          </Text>
          <Text 
            style={styles.infoSubtext}
            adjustsFontSizeToFit
            numberOfLines={2}
            minimumFontScale={0.7}
          >
            {isExistingOrder && displayOrderData.created_at
              ? `Order created: ${new Date(displayOrderData.created_at).toLocaleString()}`
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
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
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