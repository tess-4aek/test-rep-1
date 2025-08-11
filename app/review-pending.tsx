import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CircleCheck as CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { t } from '@/lib/i18n';

interface StepItemProps {
  icon: React.ReactNode;
  title: string;
  status: 'completed';
  isLast?: boolean;
}

const StepItem: React.FC<StepItemProps> = ({ icon, title, status, isLast }) => {
  const getStatusColor = () => '#10B981';
  const getStatusText = () => t('completed');

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
          <Text 
            style={styles.stepTitle}
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.7}
          >
            {title}
          </Text>
          <Text style={[styles.stepStatus, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>
      
      {!isLast && <View style={styles.stepConnector} />}
    </View>
  );
};

export default function ReviewPendingPage() {
  const [countdown, setCountdown] = useState(7);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => router.replace('/(tabs)'), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
      icon: <CheckCircle />,
      title: t('bankDetailsSubmission'),
      status: 'completed' as const,
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
          <Text 
            style={styles.heading}
            adjustsFontSizeToFit
            numberOfLines={2}
            minimumFontScale={0.7}
          >
            {t('verificationInProgress')}
          </Text>
          <Text 
            style={styles.description}
            adjustsFontSizeToFit
            numberOfLines={2}
            minimumFontScale={0.7}
          >
            {t('allStepsCompleted')}
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

        {/* Loading Section */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3D8BFF" />
          <Text 
            style={styles.loadingText}
            adjustsFontSizeToFit
            numberOfLines={2}
            minimumFontScale={0.7}
          >
            {t('reviewingInfo')}
          </Text>
          <Text 
            style={styles.countdownText}
            adjustsFontSizeToFit
            numberOfLines={2}
            minimumFontScale={0.7}
          >
            {t('redirectingIn')} {countdown} {t('seconds')}
          </Text>
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
    flexGrow: 1,
    paddingTop: 60,
    paddingBottom: 40,
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
    marginBottom: 48,
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
  loadingContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1E3C',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
});