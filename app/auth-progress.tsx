import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { CircleCheck as CheckCircle, Clock, Square } from 'lucide-react-native';
import { router } from 'expo-router';
import { t } from '@/lib/i18n';
import { getUserData, saveUserData, determineNextScreen } from '@/utils/auth';
import { checkUserExists } from '@/lib/supabase';

interface StepItemProps {
  icon: React.ReactNode;
  title: string;
  status: 'completed' | 'pending' | 'not-started';
  isLast?: boolean;
}

const StepItem: React.FC<StepItemProps> = ({ icon, title, status, isLast }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'not-started':
        return '#9CA3AF';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return t('completed');
      case 'pending':
        return t('inProgress');
      case 'not-started':
        return t('notStarted');
      default:
        return t('notStarted');
    }
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepContent}>
        <View style={[styles.iconContainer, { backgroundColor: getStatusColor() + '20' }]}>
          {React.cloneElement(icon as React.ReactElement, {
            color: getStatusColor(),
            size: 24,
          })}
        </View>
        
        <View style={styles.stepTextContainer}>
          <Text style={styles.stepTitle}>{title}</Text>
          <Text style={[styles.stepStatus, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>
      
      {!isLast && <View style={styles.stepConnector} />}
    </View>
  );
};

export default function AuthProgressPage() {
  const [userData, setUserData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Re-fetch user data when screen is focused to get latest KYC status from webhook
  useFocusEffect(
    React.useCallback(() => {
      const refreshUserData = async () => {
        try {
          setIsLoading(true);
          console.log('🔄 Refreshing user data to check KYC status...');
          
          // Get current user data
          const currentUser = await getUserData();
          if (!currentUser?.id) {
            console.error('No user data found');
            router.replace('/');
            return;
          }

          // Fetch latest user data from database (includes webhook updates)
          const latestUserData = await checkUserExists(currentUser.id);
          if (latestUserData) {
            // Update local storage with latest data
            await saveUserData(latestUserData);
            setUserData(latestUserData);
            
            console.log('📊 Latest user KYC status:', latestUserData.kyc_status);
            
            // Check if user should be redirected to next screen
            const nextScreen = determineNextScreen(latestUserData);
            if (nextScreen !== '/auth-progress') {
              console.log('🏠 User status changed, navigating to:', nextScreen);
              router.replace(nextScreen as any);
              return;
            }
          } else {
            setUserData(currentUser);
          }
        } catch (error) {
          console.error('❌ Error refreshing user data:', error);
          // Use cached data on error
          const cachedUser = await getUserData();
          setUserData(cachedUser);
        } finally {
          setIsLoading(false);
        }
      };

      refreshUserData();
    }, [])
  );

  const handleContinueKYC = async () => {
    try {
      // Mock user data - in real app this would come from auth context
      const currentUser = {
        user_id: 'a3b8e7f2-4c1d-4b9a-a2c3-7d5e9f8a1b2c',
      };

      console.log('Starting KYC process for user:', currentUser.id);
      
      // Make request to generate KYC link
      const response = await fetch('https://baiuvyjptnggsuwucspy.supabase.co/functions/v1/generate-kyc-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth token if needed: 'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          user_id: currentUser.user_id,
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (!data.data?.verification_url) {
        console.error('No URL in response:', data);
        throw new Error('No verification URL received');
      }

      console.log('Opening KYC URL:', data.data.verification_url);
      // Navigate to KYC WebView with the verification URL
      router.push({
        pathname: '/kyc-webview',
        params: { url: data.data.verification_url }
      });
      
    } catch (error) {
      console.error('Error generating KYC link:', error);
      Alert.alert(
        'Error',
        'Не удалось получить ссылку для верификации. Попробуйте позже.',
        [{ text: 'OK' }]
      );
    }
  };

  // Determine KYC status dynamically based on user data
  const getKYCStatus = () => {
    if (isLoading) return 'pending';
    if (!userData) return 'pending';
    
    // Check if KYC is completed (webhook sets this to true when verification passes)
    if (userData.kyc_status === true || userData.kyc_verified === true) {
      return 'completed';
    }
    
    // If KYC verification URL exists, it means process was started
    if (userData.kyc_verification_url) {
      return 'pending';
    }
    
    return 'pending';
  };

  const steps = [
    {
      icon: <CheckCircle />,
      title: t('telegramAuth'),
      status: 'completed' as const,
    },
    {
      icon: <Clock />,
      title: t('kycVerification'),
      status: getKYCStatus() as 'completed' | 'pending' | 'not-started',
    },
    {
      icon: <Square />,
      title: t('bankDetailsSubmission'),
      status: 'not-started' as const,
    },
  ];

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Checking verification status...</Text>
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
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.heading}>{t('almostThere')}</Text>
          <Text style={styles.description}>
            {t('completeSteps')}
          </Text>
        </View>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <StepItem
              key={index}
              icon={step.icon}
              title={step.title}
              status={step.status}
              isLast={index === steps.length - 1}
            />
          ))}
        </View>
      </ScrollView>

      {/* CTA Section */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleContinueKYC}
          activeOpacity={0.9}
          disabled={getKYCStatus() === 'completed'}
        >
          <LinearGradient
            colors={getKYCStatus() === 'completed' ? ['#9CA3AF', '#9CA3AF'] : ['#3D8BFF', '#2A7FFF']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ctaButtonText}>
              {getKYCStatus() === 'completed' ? t('completed') : t('continueKyc')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.footerText}>
          {t('secureProcess')}
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
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
  },
  headerContainer: {
    paddingHorizontal: 32,
    marginBottom: 48,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0C1E3C',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  stepsContainer: {
    paddingHorizontal: 32,
    flex: 1,
    justifyContent: 'center',
  },
  stepContainer: {
    marginBottom: 32,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1E3C',
    marginBottom: 4,
    lineHeight: 20,
  },
  stepStatus: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 55,
    marginTop: 8,
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