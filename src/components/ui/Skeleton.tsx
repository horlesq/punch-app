import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Premium Shimmer Skeleton Block.
 * Sweeps a smooth light gradient wave continuously across the element.
 */
export function Skeleton({
  width,
  height,
  borderRadius = 12,
  className = '',
  style,
}: SkeletonProps) {
  const [containerWidth, setContainerWidth] = useState<number>(200);
  const translateX = useRef(new Animated.Value(-150)).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setContainerWidth(w);
    }
  };

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: containerWidth + 150,
        duration: 1350,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [containerWidth, translateX]);

  return (
    <View
      onLayout={onLayout}
      className={`bg-surface-container-high overflow-hidden relative ${className}`}
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            width: 150,
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0)',
            'rgba(255, 255, 255, 0.45)',
            'rgba(255, 255, 255, 0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/** Skeleton placeholder for main Punch screen (punch.tsx). */
export function PunchSkeleton() {
  return (
    <View className="flex-1 bg-surface items-center pt-8 px-6">
      {/* Header Greeting & Time Skeleton */}
      <View className="items-center mb-10">
        <Skeleton width={180} height={28} borderRadius={8} className="mb-2.5" />
        <Skeleton width={150} height={16} borderRadius={6} />
      </View>

      {/* Big Circular Punch Button Skeleton */}
      <View className="items-center w-full mb-12">
        <Skeleton width={260} height={260} borderRadius={130} />
        {/* Status Pill Skeleton */}
        <Skeleton width={160} height={42} borderRadius={21} className="mt-10" />
      </View>

      {/* Recent Activity Section Skeleton */}
      <View className="w-full max-w-lg">
        <View className="flex-row justify-between items-end mb-4">
          <Skeleton width={140} height={22} borderRadius={6} />
          <Skeleton width={60} height={16} borderRadius={4} />
        </View>

        {/* Shift Card Skeleton */}
        <View className="bg-surface-container-lowest rounded-2xl p-4 mb-3 flex-row justify-between items-center border border-outline-variant/10">
          <View>
            <Skeleton width={110} height={16} borderRadius={6} className="mb-2" />
            <Skeleton width={140} height={14} borderRadius={4} />
          </View>
          <Skeleton width={50} height={20} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

/** Skeleton placeholder for Shift History screen (history.tsx). */
export function HistorySkeleton() {
  return (
    <View className="flex-1 bg-background pt-4">
      {/* Top Missed Shift Banner Button Skeleton */}
      <View className="mx-4 mb-6">
        <Skeleton width="100%" height={52} borderRadius={12} />
      </View>

      {/* Shift Card Skeletons */}
      {[1, 2, 3].map((key) => (
        <View
          key={key}
          className="bg-surface-container-lowest rounded-xl mx-4 mb-3 p-4 border border-outline-variant/10"
        >
          {/* Header Row: Date & Hours Badge */}
          <View className="flex-row justify-between items-center mb-3">
            <Skeleton width={120} height={16} borderRadius={6} />
            <Skeleton width={65} height={22} borderRadius={11} />
          </View>

          {/* Time Row */}
          <View className="flex-row items-center mb-2">
            <Skeleton width={16} height={16} borderRadius={8} className="mr-2" />
            <Skeleton width={140} height={14} borderRadius={4} />
          </View>

          {/* Net Hours Row */}
          <View className="flex-row items-center">
            <Skeleton width={16} height={16} borderRadius={8} className="mr-2" />
            <Skeleton width={110} height={14} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Skeleton placeholder for Employee My Pay screen (my-pay.tsx). */
export function MyPaySkeleton() {
  return (
    <View className="flex-1 bg-background pt-4">
      {/* Week Cards Skeletons */}
      {[1, 2, 3].map((key) => (
        <View
          key={key}
          className="bg-surface-container-lowest rounded-xl mx-4 mb-3 p-4"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {/* Week Header */}
          <View className="flex-row items-center justify-between mb-3">
            <Skeleton width={130} height={18} borderRadius={6} />
            <Skeleton width={60} height={22} borderRadius={11} />
          </View>

          {/* Stats Row */}
          <View className="flex-row justify-between items-center pt-2">
            <View className="items-center flex-1">
              <Skeleton width={20} height={20} borderRadius={10} className="mb-1" />
              <Skeleton width={90} height={20} borderRadius={6} />
            </View>

            <View className="w-px bg-outline-variant/30 h-10 mx-4" />

            <View className="items-center flex-1">
              <Skeleton width={20} height={20} borderRadius={10} className="mb-1" />
              <Skeleton width={90} height={20} borderRadius={6} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Skeleton placeholder for Admin Dashboard screen (dashboard.tsx). */
export function DashboardSkeleton() {
  return (
    <View className="flex-1 bg-background pt-4">
      {/* Currently Clocked In Section */}
      <View className="mx-4 mb-6">
        <Skeleton width={150} height={20} borderRadius={6} className="mb-3" />
        <View className="bg-surface-container-lowest rounded-xl overflow-hidden p-4">
          {[1, 2].map((key) => (
            <View key={key} className="flex-row items-center justify-between py-2 border-b border-outline-variant/20">
              <View className="flex-row items-center flex-1">
                <Skeleton width={40} height={40} borderRadius={20} className="mr-3" />
                <View>
                  <Skeleton width={120} height={15} borderRadius={5} className="mb-1" />
                  <Skeleton width={90} height={12} borderRadius={4} />
                </View>
              </View>
              <Skeleton width={65} height={24} borderRadius={12} />
            </View>
          ))}
        </View>
      </View>

      {/* Pending Corrections Section */}
      <View className="mx-4">
        <Skeleton width={160} height={20} borderRadius={6} className="mb-3" />
        <View className="bg-surface-container-lowest rounded-xl p-4 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Skeleton width={40} height={40} borderRadius={20} className="mr-3" />
            <View>
              <Skeleton width={140} height={15} borderRadius={5} className="mb-1" />
              <Skeleton width={100} height={12} borderRadius={4} />
            </View>
          </View>
          <Skeleton width={16} height={16} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

/** Skeleton placeholder for Admin Employees list screen (employees.tsx). */
export function EmployeesSkeleton() {
  return (
    <View className="flex-1 bg-background pt-4">
      {[1, 2, 3, 4].map((key) => (
        <View
          key={key}
          className="bg-surface-container-lowest rounded-xl mx-4 mb-3 p-4 flex-row items-center justify-between"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center flex-1">
            <Skeleton width={44} height={44} borderRadius={22} className="mr-3" />
            <View className="flex-1">
              <Skeleton width={130} height={16} borderRadius={6} className="mb-1.5" />
              <Skeleton width={90} height={12} borderRadius={4} />
            </View>
          </View>

          <Skeleton width={60} height={20} borderRadius={6} />
        </View>
      ))}
    </View>
  );
}

/** Skeleton placeholder for Admin Employee Edit Detail screen (employee-detail.tsx). */
export function EmployeeDetailSkeleton() {
  return (
    <View className="flex-1 bg-background pt-4">
      {/* Header Profile Card Skeleton */}
      <View className="bg-surface-container-lowest mx-4 p-5 rounded-2xl mb-6 items-center">
        <Skeleton width={72} height={72} borderRadius={36} className="mb-3" />
        <Skeleton width={160} height={22} borderRadius={6} className="mb-2" />
        <Skeleton width={100} height={14} borderRadius={4} />
      </View>

      {/* Form Fields Skeleton */}
      <View className="mx-4 mb-4">
        <Skeleton width={100} height={14} borderRadius={4} className="mb-2" />
        <Skeleton width="100%" height={48} borderRadius={12} />
      </View>
      <View className="mx-4 mb-4">
        <Skeleton width={100} height={14} borderRadius={4} className="mb-2" />
        <Skeleton width="100%" height={48} borderRadius={12} />
      </View>
      <View className="mx-4 mb-6">
        <Skeleton width={100} height={14} borderRadius={4} className="mb-2" />
        <Skeleton width="100%" height={48} borderRadius={12} />
      </View>
    </View>
  );
}

/** Skeleton placeholder for Admin Corrections Review screen (corrections-review.tsx). */
export function CorrectionsReviewSkeleton() {
  return (
    <View className="flex-1 bg-background pt-4">
      {[1, 2].map((key) => (
        <View
          key={key}
          className="bg-surface-container-lowest rounded-xl mx-4 mb-4 p-4 border border-outline-variant/20"
        >
          {/* Card Header: Avatar & Name */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Skeleton width={36} height={36} borderRadius={18} className="mr-3" />
              <View>
                <Skeleton width={120} height={16} borderRadius={6} className="mb-1" />
                <Skeleton width={80} height={12} borderRadius={4} />
              </View>
            </View>
            <Skeleton width={70} height={22} borderRadius={11} />
          </View>

          {/* Change Info Box */}
          <Skeleton width="100%" height={48} borderRadius={10} className="mb-4" />

          {/* Action Buttons */}
          <View className="flex-row justify-end space-x-3">
            <Skeleton width={90} height={36} borderRadius={8} />
            <Skeleton width={90} height={36} borderRadius={8} className="ml-3" />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Skeleton placeholder for main pay periods weekly summary table (pay-periods.tsx). */
export function PayPeriodsSkeleton() {
  return (
    <View className="flex-1 bg-background pt-4">
      {/* Week Selector Bar */}
      <View
        className="flex-row items-center justify-between mx-4 mb-3 p-3 bg-surface-container-lowest rounded-xl"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={160} height={24} borderRadius={8} />
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>

      {/* Employee Rows */}
      {[1, 2, 3, 4].map((key) => (
        <View
          key={key}
          className="bg-surface-container-lowest rounded-xl mx-4 mb-3 p-4 flex-row items-center justify-between"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center flex-1">
            <Skeleton width={40} height={40} borderRadius={20} className="mr-3" />
            <View className="flex-1">
              <Skeleton width={120} height={16} borderRadius={6} className="mb-1.5" />
              <Skeleton width={80} height={12} borderRadius={4} />
            </View>
          </View>

          <View className="items-end">
            <Skeleton width={65} height={22} borderRadius={11} className="mb-1.5" />
            <Skeleton width={70} height={16} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Skeleton placeholder for employee detail shifts screen (pay-period-detail.tsx). */
export function PayPeriodDetailSkeleton() {
  return (
    <View className="flex-1 bg-background pt-4">
      {/* Header Info */}
      <View className="mx-4 mb-4">
        <Skeleton width={180} height={26} borderRadius={8} className="mb-2" />
        <Skeleton width={130} height={16} borderRadius={6} />
      </View>

      {/* Shifts Table */}
      <View className="mx-4 bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/20 mb-4">
        <View className="bg-surface-container-high px-3 py-3 flex-row justify-between">
          <Skeleton width={50} height={12} borderRadius={4} />
          <Skeleton width={70} height={12} borderRadius={4} />
          <Skeleton width={40} height={12} borderRadius={4} />
          <Skeleton width={40} height={12} borderRadius={4} />
        </View>
        {[1, 2, 3, 4].map((key) => (
          <View key={key} className="px-3 py-3.5 flex-row items-center justify-between border-b border-outline-variant/10">
            <Skeleton width={65} height={14} borderRadius={5} />
            <Skeleton width={85} height={14} borderRadius={5} />
            <Skeleton width={35} height={14} borderRadius={5} />
            <Skeleton width={50} height={14} borderRadius={5} />
          </View>
        ))}
      </View>

      {/* Summary Totals */}
      <View className="mx-4 p-4 rounded-xl bg-surface-container-lowest flex-row justify-between border border-outline-variant/20">
        <View>
          <Skeleton width={80} height={12} borderRadius={4} className="mb-2" />
          <Skeleton width={60} height={22} borderRadius={6} />
        </View>
        <View className="items-end">
          <Skeleton width={80} height={12} borderRadius={4} className="mb-2" />
          <Skeleton width={90} height={22} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

/** Skeleton placeholder for initial app & profile boot loading. */
export function RootAppSkeleton() {
  return (
    <View className="flex-1 bg-surface items-center justify-center p-6">
      <Skeleton width={72} height={72} borderRadius={36} className="mb-6" />
      <Skeleton width={180} height={24} borderRadius={8} className="mb-3" />
      <Skeleton width={120} height={14} borderRadius={6} />
    </View>
  );
}
