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
import { Linking } from 'react-native';
import { t } from '@/lib/i18n';
import { getUserData, User } from '@/utils/auth';

export default function LimitDetailsPage() {
  const [userData, setUserData] = React.useState<User | null>(null);

  React.useEffect(() => {
    const loadUserData = async () => {
      const user = await getUserData();
      setUserData(user);
    };
    loadUserData();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleRequestIncrease = async () => {
    const message = encodeURIComponent(t('increaseLimit'));
    const telegramUrl = `https://t.me/your_bot_username?start=${message}`;
    
    try {
      await Linking.openURL(telegramUrl);
    } catch (error) {
      console.error('Error opening Telegram:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

 const getMonthlyProgressPercentage = () => {
  const limit = Number(userData?.monthly_limit) || 0;
  const used = Number(userData?.monthly_limit_used) || 0;
  if (limit <= 0) return 0;
  return (used / limit) * 100;
};

const getDailyProgressPercentage = () => {
  const limit = Number(userData?.daily_limit) || 0;
  const used = Number(userData?.daily_limit_used) || 0;
  if (limit <= 0) return 0;
  return (used / limit) * 100;
};


  const getDaysUntilReset = () => {
    if (!userData?.limit_reset_date) return 0;
    const resetDate = new Date(userData.limit_reset_date);
    const today = new Date();
    const diffTime = resetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getResetDateFormatted = () => {
    if (!userData?.limit_reset_date) return 'January 1st';
    const resetDate = new Date(userData.limit_reset_date);
    return resetDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
  };
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color="#0C1E3C" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>{t('transactionLimits')}</Text>
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
            <Text style={styles.cardTitle} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>{t('monthlyLimit')}</Text>
          </View>
          
          <View style={styles.limitContainer}>
            <Text style={styles.limitAmount} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>
              {userData?.monthly_limit_used ? formatCurrency(userData.monthly_limit_used) : '€0'} / {userData?.monthly_limit ? formatCurrency(userData.monthly_limit) : '€5,000'}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${getMonthlyProgressPercentage()}%` }]} />
              </View>
              <Text style={styles.progressPercentage}>{Math.round(getMonthlyProgressPercentage())}%</Text>
            </View>
            <Text style={styles.limitSubtext} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>{t('resetsOn')} {getResetDateFormatted()}</Text>
          </View>
        </View>

        {/* Daily Limit Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Clock color="#10B981" size={24} />
            <Text style={styles.cardTitle} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>{t('dailyLimit')}</Text>
          </View>
          
          <View style={styles.limitContainer}>
            <Text style={styles.limitAmount} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>
              {userData?.daily_limit_used ? formatCurrency(userData.daily_limit_used) : '€0'} / {userData?.daily_limit ? formatCurrency(userData.daily_limit) : '€1,000'}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${getDailyProgressPercentage()}%`, backgroundColor: '#10B981' }]} />
              </View>
              <Text style={[styles.progressPercentage, { color: '#10B981' }]}>{Math.round(getDailyProgressPercentage())}%</Text>
            </View>
            <Text style={styles.limitSubtext} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>{t('resetsAtMidnight')}</Text>
          </View>
        </View>

        {/* How to Increase Limits */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <TrendingUp color="#F59E0B" size={24} />
            <Text style={styles.cardTitle} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>{t('howToIncrease')}</Text>
          </View>
          
          <View style={styles.explanationContainer}>
            <View style={styles.explanationItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>{t('enhancedVerification')}</Text>
                <Text style={styles.stepDescription} adjustsFontSizeToFit numberOfLines={3} minimumFontScale={0.7}>
                  {t('enhancedVerificationDesc')}
                </Text>
              </View>
            </View>
            
            <View style={styles.explanationItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>{t('buildHistory')}</Text>
                <Text style={styles.stepDescription} adjustsFontSizeToFit numberOfLines={3} minimumFontScale={0.7}>
                  {t('buildHistoryDesc')}
                </Text>
              </View>
            </View>
            
            <View style={styles.explanationItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>{t('manualReview')}</Text>
                <Text style={styles.stepDescription} adjustsFontSizeToFit numberOfLines={3} minimumFontScale={0.7}>
                  {t('manualReviewDesc')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Benefits Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>{t('higherLimitsBenefits')}</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>{t('largerAmounts')}</Text>
            <Text style={styles.benefitItem} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>{t('prioritySupport')}</Text>
            <Text style={styles.benefitItem} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>{t('reducedProcessing')}</Text>
            <Text style={styles.benefitItem} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>{t('advancedFeatures')}</Text>
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
            <Text style={styles.ctaButtonText} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>{t('requestLimitIncrease')}</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.footerText} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>
          {t('reviewWithin24h')}
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