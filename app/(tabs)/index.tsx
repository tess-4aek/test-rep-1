import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { 
  ArrowUpDown, 
  X,
  TrendingUp 
} from 'lucide-react-native';
import { router } from 'expo-router';
import { t } from '@/lib/i18n';
import { getUserData, User } from '@/utils/auth';
import { createOrder, CreateOrderData, fetchUserOrders, CreatedOrder } from '@/lib/supabase';
import { Linking } from 'react-native';

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
    type: isUsdcToEur ? 'sell' : 'buy',
  };
};

export default function HomePage() {
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [exchangeDirection, setExchangeDirection] = useState<'usdc-eur' | 'eur-usdc'>('usdc-eur');
  const [rateDirection, setRateDirection] = useState<'usdc-eur' | 'eur-usdc'>('usdc-eur');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userData, setUserData] = useState<User | null>(null);
  const [orders, setOrders] = useState<CreatedOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      const user = await getUserData();
      setUserData(user);
    };
    loadUserData();
  }, []);

  useEffect(() => {
    const loadUserOrders = async () => {
      try {
        setIsLoadingOrders(true);
        
        const userData = await getUserData();
        if (!userData?.telegram_id) {
          console.error('No user data or telegram_id found');
          return;
        }

        const userOrders = await fetchUserOrders(userData.telegram_id);
        setOrders(userOrders);
        
      } catch (error) {
        console.error('Error loading user orders:', error);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    loadUserOrders();
  }, []);

  const getProgressColor = () => {
    if (!userData?.monthly_limit || !userData?.monthly_limit_used) return '#10B981';
    const percentage = (userData.monthly_limit_used / userData.monthly_limit) * 100;
    if (percentage < 70) return '#10B981';
    if (percentage < 90) return '#F59E0B';
    return '#EF4444';
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

  // Auto-flip exchange rate every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRateDirection(prev => prev === 'usdc-eur' ? 'eur-usdc' : 'usdc-eur');
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getCurrentRate = () => {
    return rateDirection === 'usdc-eur' ? '1 USDC ≈ 0.92 EUR' : '1 EUR ≈ 1.09 USDC';
  };

  const calculateReceiveAmount = () => {
    if (!exchangeAmount || isNaN(Number(exchangeAmount))) return '';
    const amount = Number(exchangeAmount);
    if (exchangeDirection === 'usdc-eur') {
      return (amount * 0.92).toFixed(2);
    } else {
      return (amount * 1.09).toFixed(2);
    }
  };

  const formatDecimalInput = (value: string): string => {
    let cleaned = value.replace(/[^0-9.]/g, '');
    
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return cleaned;
  };

  const handleAmountChange = (value: string) => {
    const formattedValue = formatDecimalInput(value);
    setExchangeAmount(formattedValue);
  };

  const handleSwapDirection = () => {
    const newDirection = exchangeDirection === 'usdc-eur' ? 'eur-usdc' : 'usdc-eur';
    setExchangeDirection(newDirection);
    
    const currentReceiveAmount = calculateReceiveAmount();
    if (currentReceiveAmount && !isNaN(Number(currentReceiveAmount))) {
      setExchangeAmount(currentReceiveAmount);
    } else {
      setExchangeAmount('');
    }
  };

  const handleCreateExchange = () => {
    if (exchangeAmount && !isNaN(Number(exchangeAmount))) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmOrder = async () => {
    if (!userData?.telegram_id) {
      setErrorMessage('User authentication error. Please try logging in again.');
      setShowErrorModal(true);
      return;
    }

    if (!exchangeAmount || isNaN(Number(exchangeAmount))) {
      setErrorMessage('Invalid exchange amount. Please enter a valid number.');
      setShowErrorModal(true);
      return;
    }

    const amount = Number(exchangeAmount);
    const receiveAmount = Number(calculateReceiveAmount());
    const eurAmount = exchangeDirection === 'usdc-eur' ? receiveAmount : amount;

    const oneTimeLimit = userData?.daily_limit || 0;
    if (oneTimeLimit > 0 && eurAmount > oneTimeLimit) {
      setErrorMessage(t('oneTimeLimitExceeded', { 
        amount: formatCurrency(eurAmount), 
        limit: formatCurrency(oneTimeLimit) 
      }));
      setShowErrorModal(true);
      return;
    }

    const monthlyLimit = userData?.monthly_limit || 0;
    const monthlyUsed = userData?.monthly_limit_used || 0;
    const remainingMonthlyLimit = monthlyLimit - monthlyUsed;
    
    if (monthlyLimit > 0 && eurAmount > remainingMonthlyLimit) {
      setErrorMessage(t('monthlyLimitExceeded', { 
        amount: formatCurrency(eurAmount), 
        remaining: formatCurrency(remainingMonthlyLimit),
        limit: formatCurrency(monthlyLimit)
      }));
      setShowErrorModal(true);
      return;
    }

    setIsCreatingOrder(true);
    
    try {
      const orderData: CreateOrderData = {
        user_id: userData.id,
        telegram_id: userData.telegram_id,
        usdc_amount: exchangeDirection === 'usdc-eur' ? amount : receiveAmount,
        eur_amount: exchangeDirection === 'usdc-eur' ? receiveAmount : amount,
        direction: exchangeDirection,
        exchange_rate: getCurrentRate(),
        status: 'pending'
      };

      console.log('Creating order with data:', orderData);
      const createdOrder = await createOrder(orderData);
      
      if (createdOrder) {
        console.log('Order created successfully:', createdOrder.id);
        setShowConfirmModal(false);
        setExchangeAmount('');
        
        // Refresh orders list
        const userOrders = await fetchUserOrders(userData.telegram_id);
        setOrders(userOrders);
        
        router.push({
          pathname: '/order-details',
          params: {
            orderId: createdOrder.id,
            isExistingOrder: 'true'
          }
        });
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setErrorMessage(t('orderCreationError'));
      setShowConfirmModal(false);
      setShowErrorModal(true);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleRetryOrder = () => {
    setShowErrorModal(false);
    setShowConfirmModal(true);
  };

  const handleContactSupport = async () => {
    setShowErrorModal(false);
    const message = encodeURIComponent(t('contactSupport'));
    const telegramUrl = `https://t.me/xpaid_manager?text=${message}`;
    
    try {
      await Linking.openURL(telegramUrl);
    } catch (error) {
      console.error('Error opening Telegram:', error);
    }
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

  const getFromCurrency = () => exchangeDirection === 'usdc-eur' ? 'USDC' : 'EUR';
  const getToCurrency = () => exchangeDirection === 'usdc-eur' ? 'EUR' : 'USDC';

  const getTransactionIcon = (type: string, status: string) => {
    return type === 'buy' 
      ? <ArrowUpDown color="#10B981" size={20} />
      : <ArrowUpDown color="#EF4444" size={20} />;
  };

  const getIconBackgroundColor = (type: string, status: string) => {
    return type === 'buy' ? '#10B981' + '20' : '#EF4444' + '20';
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
          <Text style={styles.greeting}>{t('greeting')}</Text>
          <Text style={styles.subtitle}>{t('readyToExchange')}</Text>
        </View>

        {/* Monthly Transaction Limit Block */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('monthlyLimit')}</Text>
          
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
              ? `${formatCurrency(userData.monthly_limit - userData.monthly_limit_used)} / ${formatCurrency(userData.monthly_limit)} ${t('limitRemaining')}`
              : `${userData?.monthly_limit ? formatCurrency(userData.monthly_limit) : '€5,000'} / ${userData?.monthly_limit ? formatCurrency(userData.monthly_limit) : '€5,000'} ${t('limitRemaining')}`}
          </Text>
          <Text style={styles.limitResetText}>
            {`${t('limitResets')} ${getDaysUntilReset()} ${t('days')}`}
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
              <Text style={styles.viewDetailsText}>{t('viewLimitDetails')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Exchange Rate Block */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('exchangeRate')}</Text>
          <View style={styles.rateContainer}>
            <TrendingUp color="#10B981" size={20} />
            <Text style={styles.rateText}>{getCurrentRate()}</Text>
          </View>
        </View>

        {/* Exchange Block */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('exchange')}</Text>
          
          {/* From Input */}
          <View style={styles.exchangeInputContainer}>
            <Text style={styles.inputLabel}>{t('youSend')}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.amountInput}
                value={exchangeAmount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
              <Text style={styles.currencyLabel}>{getFromCurrency()}</Text>
            </View>
          </View>

          {/* Swap Button */}
          <View style={styles.swapContainer}>
            <TouchableOpacity style={styles.swapButton} onPress={handleSwapDirection}>
              <ArrowUpDown color="#3D8BFF" size={20} />
            </TouchableOpacity>
          </View>

          {/* To Input */}
          <View style={styles.exchangeInputContainer}>
            <Text style={styles.inputLabel}>{t('youReceive')}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.amountInput, styles.readOnlyInput]}
                value={calculateReceiveAmount()}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                editable={false}
              />
              <Text style={styles.currencyLabel}>{getToCurrency()}</Text>
            </View>
          </View>

          {/* Exchange Fee */}
          <View style={styles.feeContainer}>
            <Text style={styles.feeText}>{`${t('fee')}: ~0.5%`}</Text>
          </View>

          {/* Create Exchange Button */}
          <TouchableOpacity
            style={[
              styles.createExchangeButton,
              (!exchangeAmount || isNaN(Number(exchangeAmount))) && styles.disabledButton,
            ]}
            onPress={handleCreateExchange}
            activeOpacity={0.9}
            disabled={!exchangeAmount || isNaN(Number(exchangeAmount))}
          >
            <LinearGradient
              colors={
                exchangeAmount && !isNaN(Number(exchangeAmount))
                  ? ['#3D8BFF', '#2A7FFF']
                  : ['#9CA3AF', '#9CA3AF']
              }
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.createExchangeButtonText}>{t('createOrder')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('transactionHistory')}</Text>
          
          {isLoadingOrders ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('loading')}</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('noOrdersYet')}</Text>
              <Text style={styles.emptySubtext}>{t('startExchanging')}</Text>
            </View>
          ) : (
            <View style={styles.transactionsContainer}>
              {orders.slice(0, 3).map((order) => {
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
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('confirmExchange')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <X color="#6B7280" size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.exchangeSummary}>
                <Text style={styles.summaryLabel}>{t('youSend')}</Text>
                <Text style={styles.summaryAmount}>
                  {`${exchangeAmount} ${getFromCurrency()}`}
                </Text>
              </View>
              
              <View style={styles.exchangeArrow}>
                <ArrowUpDown color="#6B7280" size={16} />
              </View>
              
              <View style={styles.exchangeSummary}>
                <Text style={styles.summaryLabel}>{t('youReceive')}</Text>
                <Text style={styles.summaryAmount}>
                  {`${calculateReceiveAmount()} ${getToCurrency()}`}
                </Text>
              </View>
              
              <Text style={styles.rateInfo}>
                {`${t('rate')}: ${getCurrentRate()}`}
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmOrder}
                disabled={isCreatingOrder}
              >
                <LinearGradient
                  colors={isCreatingOrder ? ['#9CA3AF', '#9CA3AF'] : ['#3D8BFF', '#2A7FFF']}
                  style={styles.confirmButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.confirmButtonText}>
                    {isCreatingOrder ? t('creatingOrder') : t('confirm')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('orderCreationFailed')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowErrorModal(false)}
              >
                <X color="#6B7280" size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleContactSupport}
              >
                <Text style={styles.cancelButtonText}>{t('contactSupportOrder')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleRetryOrder}
              >
                <LinearGradient
                  colors={['#3D8BFF', '#2A7FFF']}
                  style={styles.confirmButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.confirmButtonText}>{t('retryOrder')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  exchangeInputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
    marginRight: 12,
  },
  readOnlyInput: {
    color: '#6B7280',
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F4F6F9',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  feeContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  feeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  createExchangeButton: {
    height: 56,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: '#3D8BFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  disabledButton: {
    shadowOpacity: 0.1,
  },
  buttonGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createExchangeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  transactionsContainer: {
    gap: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1E3C',
    marginBottom: 4,
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
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
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
    fontSize: 10,
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
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#0C1E3C',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0C1E3C',
    lineHeight: 24,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F6F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    marginBottom: 32,
  },
  exchangeSummary: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C1E3C',
    lineHeight: 22,
  },
  exchangeArrow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  rateInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F4F6F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 20,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
  },
  confirmButtonGradient: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#EF4444',
    textAlign: 'center',
    lineHeight: 22,
  },
});