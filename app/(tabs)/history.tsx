import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { t } from '@/lib/i18n';
import { Order } from '@/types/order';
import getOrdersByTelegramId from '../lib/supabase.ts';

const transactions: Order[] = getOrdersByTelegramId();

export default function HistoryPage() {
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
          {transactions.map((transaction) => (
            <TouchableOpacity 
              key={transaction.id} 
              style={styles.transactionItem}
              onPress={() => handleOrderPress(transaction)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.transactionIcon, 
                { backgroundColor: getIconBackgroundColor(transaction.type, transaction.status) }
              ]}>
                {getTransactionIcon(transaction.type, transaction.status)}
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.title}</Text>
                <Text style={styles.transactionCrypto}>{transaction.crypto}</Text>
                <Text style={styles.transactionTime}>{transaction.time}</Text>
              </View>
              
              <View style={styles.transactionAmountContainer}>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'buy' ? '#10B981' : '#EF4444' }
                ]}>
                  {transaction.amount}
                </Text>
                <Text style={[
                  styles.transactionStatus,
                  { 
                    color: transaction.status === 'completed' ? '#10B981' : 
                           transaction.status === 'pending' ? '#F59E0B' : '#6B7280',
                    textTransform: 'capitalize'
                  }
                ]}>
                  {transaction.status === 'pending' ? t('pending') : 
                   transaction.status === 'processing' ? t('processing') : 
                   t('completed')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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