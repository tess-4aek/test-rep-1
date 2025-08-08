import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowUpRight, ArrowDownLeft, Clock, RefreshCw } from 'lucide-react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { t } from '@/lib/i18n';
import { Order } from '@/lib/supabase';
import { getUserOrders } from '@/lib/supabase';
import { getUserData } from '@/utils/auth';

export default function HistoryPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user data
      const userData = await getUserData();
      
      // Fetch orders from Supabase
      const userOrders = await getUserOrders(userData?.id, userData?.telegram_id);
      setOrders(userOrders);
      
      console.log('Loaded orders:', userOrders.length);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Load orders when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [])
  );

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

  const getTransactionTitle = (order: Order): string => {
    if (order.direction === 'usdc-eur') {
      return `${t('sold')} USDC`;
    } else {
      return `${t('bought')} USDC`;
    }
  };

  const getTransactionAmount = (order: Order): string => {
    if (order.direction === 'usdc-eur') {
      return `+€${order.eur_amount.toFixed(2)}`;
    } else {
      return `-€${order.eur_amount.toFixed(2)}`;
    }
  };

  const getTransactionCrypto = (order: Order): string => {
    return `${order.usdc_amount.toFixed(2)} USDC`;
  };

  const getTransactionType = (order: Order): 'buy' | 'sell' => {
    return order.direction === 'eur-usdc' ? 'buy' : 'sell';
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

  const handleOrderPress = (order: Order) => {
    router.push({
      pathname: '/order-details',
      params: {
        orderId: order.id,
        isExistingOrder: 'true'
      }
    });
  };

  const handleRetry = () => {
    loadOrders();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <RefreshCw color="#3D8BFF" size={32} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
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

        {/* Orders List */}
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>Your exchange history will appear here</Text>
          </View>
        ) : (
          <View style={styles.transactionsContainer}>
            {orders.map((order) => {
              const transactionType = getTransactionType(order);
              return (
                <TouchableOpacity 
                  key={order.id} 
                  style={styles.transactionItem}
                  onPress={() => handleOrderPress(order)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.transactionIcon, 
                    { backgroundColor: getIconBackgroundColor(transactionType, order.status) }
                  ]}>
                    {getTransactionIcon(transactionType, order.status)}
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>{getTransactionTitle(order)}</Text>
                    <Text style={styles.transactionCrypto}>{getTransactionCrypto(order)}</Text>
                    <Text style={styles.transactionTime}>{formatTimeAgo(order.created_at)}</Text>
                  </View>
                  
                  <View style={styles.transactionAmountContainer}>
                    <Text style={[
                      styles.transactionAmount,
                      { color: transactionType === 'buy' ? '#10B981' : '#EF4444' }
                    ]}>
                      {getTransactionAmount(order)}
                    </Text>
                    <Text style={[
                      styles.transactionStatus,
                      { 
                        color: order.status === 'completed' ? '#10B981' : 
                               order.status === 'pending' ? '#F59E0B' : '#6B7280',
                        textTransform: 'capitalize'
                      }
                    ]}>
                      {order.status === 'pending' ? t('pending') : 
                       order.status === 'processing' ? t('processing') : 
                       order.status === 'completed' ? t('completed') : order.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
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
  retryButton: {
    backgroundColor: '#3D8BFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});