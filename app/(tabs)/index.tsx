import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { 
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ArrowRight
} from 'lucide-react-native';
import { router } from 'expo-router';
import { t } from '@/lib/i18n';
import { User } from '@/utils/auth';
import AuthGate from '@/components/AuthGate';

// Mock transaction data for testing
const mockTransactions = [
  {
    id: '1',
    title: 'USDC → EUR',
    crypto: '1000 USDC',
    amount: '920 EUR',
    time: new Date().toLocaleDateString(),
    status: 'completed',
    type: 'sell',
  },
  {
    id: '2',
    title: 'EUR → USDC',
    crypto: '500 EUR',
    amount: '545 USDC',
    time: new Date(Date.now() - 86400000).toLocaleDateString(),
    status: 'processing',
    type: 'buy',
  },
  {
    id: '3',
    title: 'USDC → EUR',
    crypto: '750 USDC',
    amount: '690 EUR',
    time: new Date(Date.now() - 172800000).toLocaleDateString(),
    status: 'completed',
    type: 'sell',
  },
];

export default function HomePage() {
  const [userData, setUserData] = useState<User | null>({
    id: 'test-user',
    email: 'test@example.com',
    username: 'Test User',
    monthly_limit: 5000,
    monthly_limit_used: 1200,
    daily_limit: 1000,
    limit_reset_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const [orders, setOrders] = useState(mockTransactions);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [rateDirection, setRateDirection] = useState<'usdc-eur' | 'eur-usdc'>('usdc-eur');

  // Auto-flip exchange rate every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRateDirection(prev => prev === 'usdc-eur' ? 'eur-usdc' : 'usdc-eur');
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getProgressColor = () => {
    if (!userData?.monthly_limit || !userData?.monthly_limit_used) return '#10B981';
    const percentage = (userData.monthly_limit_used / userData.monthly_limit) * 100;
    if (percentage < 70) return '#10B981'; // Green
    if (percentage < 90) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getProgressPercentage = () => {
    if (!userData?.monthly_limit || !userData?.monthly_limit_used) return 0;
    return (userData.monthly_limit_used / userData.monthly_limit) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysUntilReset = () => {
    if (!userData?.limit_reset_date) return 0;
    const resetDate = new Date(userData.limit_reset_date);
    const today = new Date();
    const diffTime = resetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleViewLimitDetails = () => {
    router.push('/limit-details');
  };

  const handleExchange = () => {
    console.log('Navigating to ramp page...');
    router.push('/ramp');
  };

  const getCurrentRate = () => {
    return rateDirection === 'usdc-eur' ? '1 USDC ≈ 0.92 EUR' : '1 EUR ≈ 1.09 USDC';
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending') {
      return <Clock color="#F59E0B" size={20} />;
    }
    return type === 'buy' 
      ? <ArrowDownLeft color="#10B981" size={20} />
      : <ArrowUpRight color="#EF4444" size={20} />;
  };

  const getIconBackgroundColor = (type: string, status: string) => {
    if (status === 'pending') {
      return '#F59E0B' + '20';
    }
    return type === 'buy' ? '#10B981' + '20' : '#EF4444' + '20';
  };

  const handleOrderPress = (order: any) => {
    router.push({
      pathname: '/order-details',
      params: {
        orderId: order.id,
        isExistingOrder: 'true'
      }
    });
  };

  return (
    <AuthGate>
      <View style={styles.container}>
        <StatusBar style="dark" />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>{t('greeting')}</Text>
            <Text style={styles.subtitle} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>{t('readyToExchange')}</Text>
          </View>

          {/* Monthly Transaction Limit Block */}
          <View style={styles.card}>
            <Text style={styles.cardTitle} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>{t('monthlyLimit')}</Text>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[
                  styles.progressBarFill, 
                  { width: `${getProgressPercentage()}%`, backgroundColor: getProgressColor() }
                ]} />
              </View>
            </View>
            
            <Text style={styles.limitUsageText}>
              {userData?.monthly_limit && userData?.monthly_limit_used 
                ? formatCurrency(userData.monthly_limit - userData.monthly_limit_used) 
                : userData?.monthly_limit ? formatCurrency(userData.monthly_limit) : '€5,000'} / {userData?.monthly_limit ? formatCurrency(userData.monthly_limit) : '€5,000'} {t('limitRemaining')}
            </Text>
            <Text style={styles.limitResetText}>
              {t('limitResets')} {getDaysUntilReset()} {t('days')}
            </Text>
            
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={handleViewLimitDetails}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#3D8BFF', '#2A7FFF']}
                style={styles.viewDetailsGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.viewDetailsText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>{t('viewLimitDetails')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Exchange Rate Block */}
          <View style={styles.card}>
            <Text style={styles.cardTitle} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>{t('exchangeRate')}</Text>
            <View style={styles.rateContainer}>
              <TrendingUp color="#10B981" size={20} />
              <Text style={styles.rateText}>{getCurrentRate()}</Text>
            </View>
          </View>

          {/* Exchange Button */}
          <View style={styles.exchangeButtonContainer}>
            <TouchableOpacity
              style={styles.exchangeButton}
              onPress={handleExchange}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#3D8BFF', '#2A7FFF']}
                style={styles.exchangeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.exchangeButtonText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>{t('exchange')}</Text>
                <ArrowRight color="#FFFFFF" size={20} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Transaction History */}
          <View style={styles.card}>
            <Text style={styles.cardTitle} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>{t('transactionHistory')}</Text>
            
            {isLoadingOrders ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3D8BFF" />
                <Text style={styles.loadingText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>{t('loading')}</Text>
              </View>
            ) : orders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>{t('noOrdersYet')}</Text>
                <Text style={styles.emptySubtext} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>{t('startExchanging')}</Text>
              </View>
            ) : (
              <View style={styles.transactionsContainer}>
                {orders.slice(0, 5).map((order) => (
                  <TouchableOpacity 
                    key={order.id} 
                    style={styles.transactionItem}
                    onPress={() => handleOrderPress(order)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.transactionIcon, 
                      { backgroundColor: getIconBackgroundColor(order.type, order.status) }
                    ]}>
                      {getTransactionIcon(order.type, order.status)}
                    </View>
                    
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionTitle} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>{order.title}</Text>
                      <Text style={styles.transactionCrypto}>{order.crypto}</Text>
                      <Text style={styles.transactionTime}>{order.time}</Text>
                    </View>
                    
                    <View style={styles.transactionAmountContainer}>
                      <Text style={[
                        styles.transactionAmount,
                        { color: order.type === 'buy' ? '#10B981' : '#EF4444' }
                      ]}>
                        {order.amount}
                      </Text>
                      <Text style={[
                        styles.transactionStatus,
                        { 
                          color: order.status === 'completed' ? '#10B981' : 
                                 order.status === 'pending' ? '#F59E0B' : '#6B7280',
                          textTransform: 'capitalize'
                        }
                      ]} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>
                        {order.status === 'pending' ? t('pending') : 
                         order.status === 'processing' ? t('processing') : 
                         t('completed')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                
                {orders.length > 5 && (
                  <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={() => router.push('/transaction-history')}
                  >
                    <Text style={styles.viewAllText}>View All Transactions</Text>
                    <ArrowRight color="#3D8BFF" size={16} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </AuthGate>
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
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0C1E3C',
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
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
    marginBottom: 16,
    lineHeight: 22,
  },
  limitUsageText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0C1E3C',
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  limitResetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 18,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  viewDetailsButton: {
    height: 44,
    borderRadius: 12,
    shadowColor: '#3D8BFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  viewDetailsGradient: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0C1E3C',
    lineHeight: 24,
  },
  exchangeButtonContainer: {
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  exchangeButton: {
    height: 56,
    borderRadius: 16,
    shadowColor: '#3D8BFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  exchangeButtonGradient: {
    flex: 1,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  exchangeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
  },
  transactionsContainer: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C1E3C',
    marginBottom: 2,
    lineHeight: 18,
  },
  transactionCrypto: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
    lineHeight: 16,
  },
  transactionTime: {
    fontSize: 11,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 14,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 18,
  },
  transactionStatus: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D8BFF',
    lineHeight: 18,
  },
});