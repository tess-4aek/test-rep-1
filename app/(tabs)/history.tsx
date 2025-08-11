import React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { t } from '@/lib/i18n';
import { getUserData } from '@/utils/auth';
import { fetchUserOrders, CreatedOrder } from '@/lib/supabase';

// Helper function to format order data for display
const formatOrderForDisplay = (order: CreatedOrder) => {
  const isUsdcToEur = order.direction === 'usdc-eur';
  const fromAmount = isUsdcToEur ? order.usdc_amount : order.eur_amount;
  const toAmount = isUsdcToEur ? order.eur_amount : order.usdc_amount;
  const fromCurrency = isUsdcToEur ? 'USDC' : 'EUR';
  const toCurrency = isUsdcToEur ? 'EUR' : 'USDC';
  
  return {
    id: order.id,
    title: `${fromCurrency} → ${toCurrency}`,
    crypto: `${fromAmount} ${fromCurrency}`,
    amount: `${toAmount} ${toCurrency}`,
    time: new Date(order.created_at).toLocaleDateString(),
    status: order.status,
    type: isUsdcToEur ? 'sell' : 'buy', // sell USDC for EUR, buy USDC with EUR
  };
};

export default function HistoryPage() {
  const [orders, setOrders] = useState<CreatedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get current user data
        const userData = await getUserData();
        if (!userData?.telegram_id) {
          console.error('No user data or telegram_id found');
          setError('User not authenticated');
          return;
        }

        // Fetch user orders
        const userOrders = await fetchUserOrders(userData.telegram_id);
        setOrders(userOrders);
        
      } catch (error) {
        console.error('Error loading user orders:', error);
        setError('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserOrders();
  }, []);

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

  const handleOrderPress = (order: CreatedOrder) => {
    router.push({
      pathname: '/order-details',
      params: {
        orderId: order.id,
        isExistingOrder: 'true'
      }
    });
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
          <Text style={styles.heading}>{t('transactionHistory')}</Text>
          <Text style={styles.subtitle}>{t('recentExchanges')}</Text>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3D8BFF" />
              <Text style={styles.loadingText}>{t('loading')}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('noOrdersYet')}</Text>
              <Text style={styles.emptySubtext}>{t('startExchanging')}</Text>
            </View>
          ) : (
            orders.map((order) => {
              const displayOrder = formatOrderForDisplay(order);
              return (
            <TouchableOpacity 
              key={order.id} 
              style={styles.transactionItem}
              onPress={() => handleOrderPress(order)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.transactionIcon, 
                { backgroundColor: getIconBackgroundColor(displayOrder.type, displayOrder.status) }
              ]}>
                {getTransactionIcon(displayOrder.type, displayOrder.status)}
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{displayOrder.title}</Text>
                <Text style={styles.transactionCrypto}>{displayOrder.crypto}</Text>
                <Text style={styles.transactionTime}>{displayOrder.time}</Text>
              </View>
              
              <View style={styles.transactionAmountContainer}>
                <Text style={[
                  styles.transactionAmount,
                  { color: displayOrder.type === 'buy' ? '#10B981' : '#EF4444' }
                ]}>
                  {displayOrder.amount}
                </Text>
                <Text style={[
                  styles.transactionStatus,
                  { 
                    color: displayOrder.status === 'completed' ? '#10B981' : 
                           displayOrder.status === 'pending' ? '#F59E0B' : '#6B7280',
                    textTransform: 'capitalize'
                  }
                ]}>
                  {displayOrder.status === 'pending' ? t('pending') : 
                   displayOrder.status === 'processing' ? t('processing') : 
                   t('completed')}
                </Text>
              </View>
            </TouchableOpacity>
              );
            })
          )}
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
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
  },
  transactionsContainer: {
    paddingHorizontal: 32,
    gap: 16,
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
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1E3C',
    marginBottom: 2,
    lineHeight: 20,
  },
  transactionCrypto: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
    lineHeight: 18,
  },
  transactionTime: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 16,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 20,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
});