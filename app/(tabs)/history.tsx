import React from 'react';
import React, { useState, useEffect } from 'react';
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
import { getUserOrders, CreatedOrder } from '@/lib/supabase';
import { getUserData } from '@/utils/auth';

export default function HistoryPage() {
  const [orders, setOrders] = useState<CreatedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserOrders();
  }, []);

  const loadUserOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get current user data
      const userData = await getUserData();
      if (!userData?.telegram_id) {
        setError('User not authenticated');
        return;
      }

      // Fetch user orders
      const userOrders = await getUserOrders(userData.telegram_id);
      setOrders(userOrders);
      
    } catch (err) {
      console.error('Error loading user orders:', err);
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (direction: string, status: string) => {
    if (status === 'pending') {
      return <Clock color="#F59E0B" size={20} />;
    }
    return direction === 'eur-usdc' 
      ? <ArrowDownLeft color="#10B981" size={20} />
      : <ArrowUpRight color="#EF4444" size={20} />;
  };

  const getIconBackgroundColor = (direction: string, status: string) => {
    if (status === 'pending') {
      return '#F59E0B' + '20';
    }
    return direction === 'eur-usdc' ? '#10B981' + '20' : '#EF4444' + '20';
  };

  const getTransactionTitle = (direction: string) => {
    return direction === 'usdc-eur' ? 'USDC → EUR' : 'EUR → USDC';
  };

  const getTransactionAmount = (order: CreatedOrder) => {
    const amount = order.direction === 'usdc-eur' ? order.usdc_amount : order.eur_amount;
    const currency = order.direction === 'usdc-eur' ? 'USDC' : 'EUR';
    return `${amount} ${currency}`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return t('pending');
      case 'processing':
        return t('processing');
      case 'completed':
        return t('completed');
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'processing':
        return '#3D8BFF';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3D8BFF" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadUserOrders}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>Your exchange history will appear here</Text>
          </View>
        ) : (
        <View style={styles.transactionsContainer}>
          {orders.map((order) => (
            <TouchableOpacity 
              key={order.id} 
              style={styles.transactionItem}
              onPress={() => handleOrderPress(order)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.transactionIcon, 
                { backgroundColor: getIconBackgroundColor(order.direction, order.status) }
              ]}>
                {getTransactionIcon(order.direction, order.status)}
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{getTransactionTitle(order.direction)}</Text>
                <Text style={styles.transactionCrypto}>Order #{order.id.slice(0, 8)}</Text>
                <Text style={styles.transactionTime}>{formatDate(order.created_at)}</Text>
              </View>
              
              <View style={styles.transactionAmountContainer}>
                <Text style={[
                  styles.transactionAmount,
                  { color: order.direction === 'eur-usdc' ? '#10B981' : '#EF4444' }
                ]}>
                  {getTransactionAmount(order)}
                </Text>
                <Text style={[
                  styles.transactionStatus,
                  { color: getStatusColor(order.status) }
                ]}>
                  {getStatusText(order.status)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
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
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
  },
});