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
import { CircleCheck as CheckCircle, Square } from 'lucide-react-native';
import { router } from 'expo-router';
import { t } from '@/lib/i18n';

interface StepItemProps {
  icon: React.ReactNode;
  title: string;
  status: 'completed' | 'not-started';
  isLast?: boolean;
}

const StepItem: React.FC<StepItemProps> = ({ icon, title, status, isLast }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#10B981';
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

export default function PostKYCPage() {
  const handleAddBankDetails = () => {
    router.push('/bank-details');
  };

  const steps = [
    {
      icon: <CheckCircle />,
      title: t('telegramAuth'),
      status: 'completed' as const,
    },
    {
      icon: <CheckCircle />,
      title: t('kycVerification'),
      status: 'completed' as const,
    },
    {
      icon: <Square />,
      title: t('bankDetailsSubmission'),
      status: 'not-started' as const,
    },
  ];

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
          <Text style={styles.heading}>{t('oneLastStep')}</Text>
          <Text style={styles.description}>
            {t('almostReady')}
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
          onPress={handleAddBankDetails}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#3D8BFF', '#2A7FFF']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ctaButtonText}>{t('addBankDetails')}</Text>
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