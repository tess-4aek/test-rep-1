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
import { ArrowLeft, Calendar, Clock, TrendingUp, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

export default function LimitDetailsPage() {
  const handleBack = () => {
    router.back();
  };

  const handleRequestIncrease = async () => {
    const message = encodeURIComponent('I want to increase my transaction limit');
    const telegramUrl = `https://t.me/your_bot_username?start=${message}`;
    
    try {
      await WebBrowser.openBrowserAsync(telegramUrl);
    } catch (error) {
      console.error('Error opening Telegram:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#0C1E3C" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Limits</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Monthly Limit Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Calendar color="#3D8BFF" size={24} />
            <Text style={styles.cardTitle}>Monthly Limit</Text>
          </View>
          
          <View style={styles.limitContainer}>
            <Text style={styles.limitAmount}>€3,200 / €5,000</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: '64%' }]} />
              </View>
              <Text style={styles.progressPercentage}>64%</Text>
            </View>
            <Text style={styles.limitSubtext}>Resets on January 1st</Text>
          </View>
        </View>

        {/* Daily Limit Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Clock color="#10B981" size={24} />
            <Text style={styles.cardTitle}>Daily Limit</Text>
          </View>
          
          <View style={styles.limitContainer}>
            <Text style={styles.limitAmount}>€450 / €1,000</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: '45%', backgroundColor: '#10B981' }]} />
              </View>
              <Text style={[styles.progressPercentage, { color: '#10B981' }]}>45%</Text>
            </View>
            <Text style={styles.limitSubtext}>Resets at midnight UTC</Text>
          </View>
        </View>

        {/* How to Increase Limits */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <TrendingUp color="#F59E0B" size={24} />
            <Text style={styles.cardTitle}>How to Increase Limits</Text>
          </View>
          
          <View style={styles.explanationContainer}>
            <View style={styles.explanationItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Complete Enhanced Verification</Text>
                <Text style={styles.stepDescription}>
                  Provide additional documentation for identity verification
                </Text>
              </View>
            </View>
            
            <View style={styles.explanationItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Build Transaction History</Text>
                <Text style={styles.stepDescription}>
                  Complete successful transactions to demonstrate account activity
                </Text>
              </View>
            </View>
            
            <View style={styles.explanationItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Request Manual Review</Text>
                <Text style={styles.stepDescription}>
                  Contact our support team for personalized limit assessment
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Benefits Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Higher Limits Benefits</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>• Access to larger exchange amounts</Text>
            <Text style={styles.benefitItem}>• Priority customer support</Text>
            <Text style={styles.benefitItem}>• Reduced processing times</Text>
            <Text style={styles.benefitItem}>• Advanced trading features</Text>
          </View>
        </View>
      </ScrollView>

      {/* Request Increase Button */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleRequestIncrease}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#3D8BFF', '#2A7FFF']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MessageCircle color="#FFFFFF" size={20} style={styles.buttonIcon} />
            <Text style={styles.ctaButtonText}>Request Limit Increase</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.footerText}>
          Our team will review your request within 24 hours
        </Text>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
  },
  headerSpacer: {
    width: 40,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
    lineHeight: 22,
  },
  limitContainer: {
    gap: 12,
  },
  limitAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0C1E3C',
    lineHeight: 32,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3D8BFF',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D8BFF',
    minWidth: 35,
  },
  limitSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 18,
  },
  explanationContainer: {
    gap: 20,
  },
  explanationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3D8BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1E3C',
    marginBottom: 4,
    lineHeight: 20,
  },
  stepDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    fontSize: 16,
    fontWeight: '400',
    color: '#0C1E3C',
    lineHeight: 22,
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
  ctaButton: {
    width: '100%',
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
  buttonGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footerText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});