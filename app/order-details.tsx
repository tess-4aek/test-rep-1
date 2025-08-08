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
import { Order, getOrderById } from '@/lib/supabase';

export default function OrderDetailsPage() {
  const [orderData, setOrderData] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const params = useLocalSearchParams<{
    orderId?: string;
    isExistingOrder?: string;
  }>();
  
  const isExistingOrder = params.isExistingOrder === 'true';
  const orderId = params.orderId;
  
  React.useEffect(() => {
    const loadOrderData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (isExistingOrder && orderId) {
          // Fetch existing order from Supabase
          const order = await getOrderById(orderId);
          if (order) {
            setOrderData(order);
          } else {
            setError('Order not found');
          }
        } else {
          // Default data for new orders
          setOrderData({
            id: 'new',
            usdc_amount: 1000,
            eur_amount: 920,
            direction: 'usdc-eur',
            exchange_rate: '1 USDC ≈ 0.92 EUR',
            fee_percentage: 0.5,
            status: 'processing',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error loading order:', error);
        setError('Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    
    loadOrderData();
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

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} weeks ago`;
  };

  const getFromCurrency = (order: Order): string => {
    return order.direction === 'usdc-eur' ? 'USDC' : 'EUR';
  };

  const getToCurrency = (order: Order): string => {
    return order.direction === 'usdc-eur' ? 'EUR' : 'USDC';
  };

  const getFromAmount = (order: Order): string => {
    return order.direction === 'usdc-eur' 
      ? order.usdc_amount.toFixed(2) 
      : order.eur_amount.toFixed(2);
  };

  const getToAmount = (order: Order): string => {
    return order.direction === 'usdc-eur' 
      ? order.eur_amount.toFixed(2) 
      : order.usdc_amount.toFixed(2);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    );
  }

  if (error || !orderData) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Order not found'}</Text>
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
                {getFromAmount(orderData)} {getFromCurrency(orderData)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('currency')}</Text>
              <Text style={styles.detailValue}>
                {getFromCurrency(orderData)} → {getToCurrency(orderData)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('exchangeRate')}</Text>
              <Text style={styles.detailValue}>{orderData.exchange_rate}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('fee')}</Text>
              <Text style={styles.detailValue}>{orderData.fee_percentage}%</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('estimatedReceived')}</Text>
              <Text style={[styles.detailValue, styles.highlightedValue]}>
                {getToAmount(orderData)} {getToCurrency(orderData)}
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
              ? `Order created: ${formatTimeAgo(orderData.created_at)}`
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