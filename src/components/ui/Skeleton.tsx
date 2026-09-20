import React, { useEffect, useState } from 'react';
import {
  Animated,
  DimensionValue,
  Easing,
  LayoutChangeEvent,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeProvider';

/** Width of the travelling highlight band, in px. */
const SHIMMER_WIDTH = 160;
/** One sweep plus the rest that follows it, in ms. */
const CYCLE_DURATION = 1600;
/** Share of the cycle spent sweeping; the rest is a pause between passes. */
const SWEEP_FRACTION = 0.7;

/**
 * Every Skeleton reads its highlight position from this one clock, so a screen
 * full of blocks sweeps in unison instead of each running at its own speed and
 * phase. Reference counted: the loop only runs while skeletons are mounted.
 */
const shimmerClock = new Animated.Value(0);
let shimmerLoop: Animated.CompositeAnimation | null = null;
let mountedCount = 0;

function acquireShimmerClock() {
  mountedCount += 1;
  if (shimmerLoop) return;

  shimmerClock.setValue(0);
  shimmerLoop = Animated.loop(
    Animated.timing(shimmerClock, {
      toValue: 1,
      duration: CYCLE_DURATION,
      // A loop needs a linear ramp; the default ease stutters at every seam.
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
  shimmerLoop.start();
}

function releaseShimmerClock() {
  mountedCount = Math.max(0, mountedCount - 1);
  if (mountedCount > 0) return;

  shimmerLoop?.stop();
  shimmerLoop = null;
}

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Premium Shimmer Skeleton Block.
 * Sweeps a smooth light gradient wave across the element, in step with every
 * other block on screen.
 */
export function Skeleton({
  width,
  height,
  borderRadius = 12,
  className = '',
  style,
}: SkeletonProps) {
  const { theme } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    acquireShimmerClock();
    return releaseShimmerClock;
  }, []);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    setContainerWidth((prev) => (prev === w ? prev : w));
  };

  const isDark = theme.themeMode === 'dark';

  // Enter from off the left edge, cross the block, then park off the right
  // edge for the remainder of the cycle.
  const translateX = shimmerClock.interpolate({
    inputRange: [0, SWEEP_FRACTION, 1],
    outputRange: [-SHIMMER_WIDTH, containerWidth, containerWidth],
  });

  return (
    <View
      onLayout={onLayout}
      className={`overflow-hidden relative ${className}`}
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.surfaceVariant,
        },
        style,
      ]}
    >
      {/* Held back until measured, so the first frame can't flash a
          highlight at a guessed offset. */}
      {containerWidth > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: SHIMMER_WIDTH,
            transform: [{ translateX }],
          }}
        >
          <LinearGradient
            colors={
              isDark
                ? [
                    'rgba(255, 255, 255, 0)',
                    'rgba(255, 255, 255, 0.12)',
                    'rgba(255, 255, 255, 0)',
                  ]
                : [
                    'rgba(255, 255, 255, 0)',
                    'rgba(255, 255, 255, 0.45)',
                    'rgba(255, 255, 255, 0)',
                  ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
}

/** Skeleton placeholder for main Punch screen (punch.tsx). */
export function PunchSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1 items-center pt-8 px-6">
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
        <View
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            borderColor: theme.borderLight + '40',
            borderWidth: 1,
          }}
          className="rounded-2xl p-4 mb-3 flex-row justify-between items-center"
        >
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
  const { theme } = useTheme();
  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1 pt-4">
      {/* Top Missed Shift Banner Button Skeleton */}
      <View className="mx-4 mb-6">
        <Skeleton width="100%" height={52} borderRadius={12} />
      </View>

      {/* Shift Card Skeletons */}
      {[1, 2, 3].map((key) => (
        <View
          key={key}
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            borderColor: theme.borderLight + '40',
            borderWidth: 1,
          }}
          className="rounded-xl mx-4 mb-3 p-4"
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
  const { theme } = useTheme();
  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1 pt-4">
      {/* Week Cards Skeletons */}
      {[1, 2, 3].map((key) => (
        <View
          key={key}
          className="rounded-xl mx-4 mb-3 p-4"
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            borderColor: theme.borderLight + '40',
            borderWidth: 1,
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

            <View style={{ backgroundColor: theme.borderLight + '40' }} className="w-px h-10 mx-4" />

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
  const { theme } = useTheme();
  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1 pt-4">
      {/* Currently Clocked In Section */}
      <View className="mx-4 mb-6">
        <Skeleton width={150} height={20} borderRadius={6} className="mb-3" />
        <View style={{ backgroundColor: theme.surfaceContainerLowest }} className="rounded-xl overflow-hidden p-4">
          {[1, 2].map((key) => (
            <View key={key} style={{ borderBottomColor: theme.borderLight + '40', borderBottomWidth: key === 1 ? 1 : 0 }} className="flex-row items-center justify-between py-2">
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
        <View style={{ backgroundColor: theme.surfaceContainerLowest, borderColor: theme.borderLight + '40', borderWidth: 1 }} className="rounded-xl p-4 flex-row items-center justify-between">
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
  const { theme } = useTheme();
  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1 pt-4">
      {[1, 2, 3, 4].map((key) => (
        <View
          key={key}
          className="rounded-xl mx-4 mb-3 p-4 flex-row items-center justify-between"
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            borderColor: theme.borderLight + '40',
            borderWidth: 1,
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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ backgroundColor: theme.background, paddingTop: insets.top + 16 }}
      className="flex-1"
    >
      {/* Header Profile Card Skeleton */}
      <View style={{ backgroundColor: theme.surfaceContainerLowest, borderColor: theme.borderLight + '40', borderWidth: 1 }} className="mx-4 p-5 rounded-2xl mb-6 items-center">
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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ backgroundColor: theme.background, paddingTop: insets.top + 16 }}
      className="flex-1"
    >
      {[1, 2].map((key) => (
        <View
          key={key}
          style={{ backgroundColor: theme.surfaceContainerLowest, borderColor: theme.borderLight + '40', borderWidth: 1 }}
          className="rounded-xl mx-4 mb-4 p-4"
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
  const { theme } = useTheme();
  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1 pt-4">
      {/* Week Selector Bar */}
      <View
        className="flex-row items-center justify-between mx-4 mb-3 p-3 rounded-xl"
        style={{
          backgroundColor: theme.surfaceContainerLowest,
          borderColor: theme.borderLight + '40',
          borderWidth: 1,
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
          className="rounded-xl mx-4 mb-3 p-4 flex-row items-center justify-between"
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            borderColor: theme.borderLight + '40',
            borderWidth: 1,
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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ backgroundColor: theme.background, paddingTop: insets.top + 16 }}
      className="flex-1"
    >
      {/* Header Info */}
      <View className="mx-4 mb-4">
        <Skeleton width={180} height={26} borderRadius={8} className="mb-2" />
        <Skeleton width={130} height={16} borderRadius={6} />
      </View>

      {/* Shifts Table */}
      <View style={{ backgroundColor: theme.surfaceContainerLowest, borderColor: theme.borderLight + '40', borderWidth: 1 }} className="mx-4 rounded-xl overflow-hidden mb-4">
        <View style={{ backgroundColor: theme.surfaceVariant }} className="px-3 py-3 flex-row justify-between">
          <Skeleton width={50} height={12} borderRadius={4} />
          <Skeleton width={70} height={12} borderRadius={4} />
          <Skeleton width={40} height={12} borderRadius={4} />
          <Skeleton width={40} height={12} borderRadius={4} />
        </View>
        {[1, 2, 3, 4].map((key) => (
          <View key={key} style={{ borderBottomColor: theme.borderLight + '40', borderBottomWidth: 1 }} className="px-3 py-3.5 flex-row items-center justify-between">
            <Skeleton width={65} height={14} borderRadius={5} />
            <Skeleton width={85} height={14} borderRadius={5} />
            <Skeleton width={35} height={14} borderRadius={5} />
            <Skeleton width={50} height={14} borderRadius={5} />
          </View>
        ))}
      </View>

      {/* Summary Totals */}
      <View style={{ backgroundColor: theme.surfaceContainerLowest, borderColor: theme.borderLight + '40', borderWidth: 1 }} className="mx-4 p-4 rounded-xl flex-row justify-between">
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
  const { theme } = useTheme();
  return (
    <View
      style={{ backgroundColor: theme.surface }}
      className="flex-1 items-center justify-center p-6"
    >
      <Skeleton width={72} height={72} borderRadius={36} className="mb-6" />
      <Skeleton width={180} height={24} borderRadius={8} className="mb-3" />
      <Skeleton width={120} height={14} borderRadius={6} />
    </View>
  );
}

/** Skeleton placeholder for Admin Settings screen (settings.tsx). */
export function SettingsSkeleton() {
  const { theme } = useTheme();
  const cardStyle = { backgroundColor: theme.surfaceContainerLowest };
  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1 pt-4">
      {/* Branding Section Header */}
      <View className="mx-4 mb-4">
        <Skeleton width={120} height={20} borderRadius={6} className="mb-3" />
        <View style={cardStyle} className="rounded-2xl p-5">
          <Skeleton width={100} height={14} borderRadius={4} className="mb-2" />
          <Skeleton width="100%" height={44} borderRadius={12} className="mb-5" />
          <Skeleton width={60} height={14} borderRadius={4} className="mb-2.5" />
          <View className="flex-row items-center mb-5">
            <Skeleton width={56} height={56} borderRadius={12} className="mr-3" />
            <Skeleton width={120} height={36} borderRadius={12} />
          </View>
          <Skeleton width={100} height={14} borderRadius={4} className="mb-2.5" />
          <View className="flex-row gap-2.5 mb-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
              <Skeleton key={k} width={38} height={38} borderRadius={19} />
            ))}
          </View>
          <Skeleton width="100%" height={100} borderRadius={12} className="mb-5" />
          <Skeleton width="100%" height={48} borderRadius={12} />
        </View>
      </View>
      {/* Rules Section Header */}
      <View className="mx-4">
        <Skeleton width={130} height={20} borderRadius={6} className="mb-3" />
        <View style={cardStyle} className="rounded-2xl p-5">
          <View className="flex-row items-center justify-between mb-5">
            <Skeleton width={120} height={14} borderRadius={4} />
            <Skeleton width={80} height={40} borderRadius={12} />
          </View>
          <View className="flex-row items-center justify-between mb-5">
            <Skeleton width={120} height={14} borderRadius={4} />
            <Skeleton width={80} height={40} borderRadius={12} />
          </View>
          <Skeleton width="100%" height={48} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

/** Skeleton placeholder for Admin Logs screen (logs.tsx). */
export function LogsSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1 pt-4">
      {/* Filter Bar */}
      <View className="flex-row justify-between items-center mx-4 mb-4">
        <Skeleton width={180} height={24} borderRadius={8} />
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>

      {/* Log Entries */}
      {[1, 2, 3, 4, 5].map((key) => (
        <View
          key={key}
          style={{
            backgroundColor: theme.surfaceContainerLowest,
            borderColor: theme.borderLight + '40',
            borderWidth: 1,
          }}
          className="rounded-xl mx-4 mb-3 p-4"
        >
          {/* Header Row: Actor Name & Time */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Skeleton width={20} height={20} borderRadius={10} className="mr-2" />
              <Skeleton width={110} height={16} borderRadius={6} />
            </View>
            <Skeleton width={60} height={14} borderRadius={4} />
          </View>

          {/* Action & Entity Details */}
          <View className="pl-7">
            <Skeleton width={140} height={14} borderRadius={5} className="mb-2" />
            <Skeleton width={90} height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}
