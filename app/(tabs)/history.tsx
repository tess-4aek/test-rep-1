import React from 'react';
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
  const [orders, setOrders] = React.useState<CreatedOrder[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get current user data
        const userData = await getUserData();
        if (!userData?.telegram_id) {
          console.error('No telegram_id found for user');
          setError('User not authenticated');
          return;
        }

        // Fetch orders for this user
        const userOrders = await getUserOrders(userData.telegram_id);
        setOrders(userOrders);
        
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(t('errorLoadingOrders'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending') {
      return <Clock color="#F59E0B" size={20} />;
    }
    return type === 'usdc-eur' 
      ? <ArrowDownLeft color="#10B981" size={20} />
      : <ArrowUpRight color="#EF4444" size={20} />;
  };

  const getIconBackgroundColor = (type: string, status: string) => {
    if (status === 'pending') {
      return '#F59E0B' + '20';
    }
    return type === 'usdc-eur' ? '#10B981' + '20' : '#EF4444' + '20';
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

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
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

  const getOrderTitle = (direction: string) => {
    return direction === 'usdc-eur' ? 'USDC → EUR' : 'EUR → USDC';
  };

  const getOrderType = (direction: string) => {
    return direction === 'usdc-eur' ? 'usdc-eur' : 'eur-usdc';
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

        {/* Loading State */}
        {isLoading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3D8BFF" />
            <Text style={styles.loadingText}>{t('loadingOrders')}</Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !error && orders.length === 0 && (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>{t('noOrdersFound')}</Text>
          </View>
        )}

        {/* Orders List */}
        {!isLoading && !error && orders.length > 0 && (
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
                  { backgroundColor: getIconBackgroundColor(getOrderType(order.direction), order.status) }
                ]}>
                  {getTransactionIcon(getOrderType(order.direction), order.status)}
                </View>
                
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>{getOrderTitle(order.direction)}</Text>
                  <Text style={styles.transactionCrypto}>
                    {formatAmount(
                      order.direction === 'usdc-eur' ? order.usdc_amount : order.eur_amount,
                      order.direction === 'usdc-eur' ? 'USDC' : 'EUR'
                    )}
                  </Text>
                  <Text style={styles.transactionTime}>{formatDate(order.created_at)}</Text>
                </View>
                
                <View style={styles.transactionAmountContainer}>
                  <Text style={[
                    styles.transactionAmount,
                    { color: order.direction === 'usdc-eur' ? '#10B981' : '#EF4444' }
                  ]}>
                    {formatAmount(
                      order.direction === 'usdc-eur' ? order.eur_amount : order.usdc_amount,
                      order.direction === 'usdc-eur' ? 'EUR' : 'USDC'
                    )}
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
                     t('completed')}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
});