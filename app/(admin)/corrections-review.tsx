import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/app/_layout';
import {
  getAllPendingCorrections,
  applyCorrection,
  rejectCorrection,
  type CorrectionWithEmployee,
} from '@/src/api/corrections';
import { writeAuditEntry } from '@/src/api/auditLog';
import { colors } from '@/src/theme/colors';

export default function CorrectionsReviewScreen() {
  const { t } = useTranslation();
  const { profile: adminProfile } = useAuth();

  const [corrections, setCorrections] = useState<CorrectionWithEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await getAllPendingCorrections();

    if (error) {
      setErrorMessage(t('admin.corrections.errorLoading'));
    } else {
      setCorrections(data);
    }

    setIsLoading(false);
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function handleApprove(correction: CorrectionWithEmployee) {
    if (!adminProfile) return;

    setProcessingIds((prev) => new Set(prev).add(correction.id));

    const { error } = await applyCorrection(correction.id, adminProfile.id);

    if (error) {
      setErrorMessage(t('admin.corrections.errorApproving'));
    } else {
      await writeAuditEntry(
        adminProfile.id,
        'correction_approved',
        'punch_correction',
        correction.id,
        { status: 'pending' },
        { status: 'approved' },
      );

      // Remove from list
      setCorrections((prev) => prev.filter((c) => c.id !== correction.id));
    }

    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(correction.id);
      return next;
    });
  }

  async function handleReject(correction: CorrectionWithEmployee) {
    if (!adminProfile) return;

    setProcessingIds((prev) => new Set(prev).add(correction.id));

    const { error } = await rejectCorrection(correction.id, adminProfile.id);

    if (error) {
      setErrorMessage(t('admin.corrections.errorRejecting'));
    } else {
      await writeAuditEntry(
        adminProfile.id,
        'correction_rejected',
        'punch_correction',
        correction.id,
        { status: 'pending' },
        { status: 'rejected' },
      );

      // Remove from list
      setCorrections((prev) => prev.filter((c) => c.id !== correction.id));
    }

    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(correction.id);
      return next;
    });
  }

  function formatDate(isoString: string | null): string {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }

  function formatTime(isoString: string | null): string {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  function formatSubmittedDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
    >
      <Text className="text-on-surface font-geist-semibold text-2xl mb-6 mx-4">
        {t('admin.corrections.title')}
      </Text>

      {errorMessage && (
        <Text className="text-error text-center text-sm mb-4 mx-4">{errorMessage}</Text>
      )}

      {corrections.length === 0 ? (
        <View className="flex-1 justify-center items-center pt-20">
          <MaterialCommunityIcons name="check-circle-outline" size={48} color={colors.textSecondary} />
          <Text className="text-on-surface-variant text-base mt-4">
            {t('admin.corrections.empty')}
          </Text>
        </View>
      ) : (
        corrections.map((correction) => {
          const isProcessing = processingIds.has(correction.id);
          const isMissedShift = !correction.punch_id;

          return (
            <View
              key={correction.id}
              className="bg-surface-container-lowest rounded-xl mx-4 mb-3 p-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 2,
                opacity: isProcessing ? 0.6 : 1,
              }}
            >
              {/* Employee Name + Date */}
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-geist-semibold text-on-surface text-base">
                  {correction.employee_name}
                </Text>
                <Text className="font-inter text-xs text-on-surface-variant">
                  {t('admin.corrections.submitted', {
                    date: formatSubmittedDate(correction.created_at),
                  })}
                </Text>
              </View>

              {/* Original vs Requested */}
              {isMissedShift ? (
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.warning} />
                  <Text style={{ color: colors.warning }} className="font-geist-medium text-sm ml-1.5">
                    {t('admin.corrections.missedShift')}
                  </Text>
                </View>
              ) : null}

              {/* Requested times */}
              <View className="flex-row items-center mb-2">
                <MaterialCommunityIcons name="clock-edit-outline" size={16} color={colors.accent} />
                <Text style={{ color: colors.accent }} className="font-geist-medium text-sm ml-1.5 mr-1.5">
                  {t('admin.corrections.requestedChange')}
                </Text>
                <Text className="font-geist-semibold text-on-surface text-sm">
                  {formatDate(correction.requested_clock_in_at)} • {formatTime(correction.requested_clock_in_at)} → {formatTime(correction.requested_clock_out_at)}
                </Text>
              </View>

              {/* Reason */}
              {correction.reason ? (
                <View className="flex-row items-start mb-3">
                  <MaterialCommunityIcons name="comment-text-outline" size={14} color={colors.textSecondary} />
                  <Text className="text-on-surface-variant text-xs ml-1.5 flex-1 italic" numberOfLines={2}>
                    {t('admin.corrections.reason')} {correction.reason}
                  </Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View className="flex-row gap-3 mt-1">
                <Pressable
                  className="flex-1 bg-success/15 rounded-lg py-3 items-center active:opacity-80"
                  onPress={() => handleApprove(correction)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={colors.success} />
                  ) : (
                    <Text className="font-geist-semibold text-success text-sm">
                      {t('common.approve')}
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  className="flex-1 bg-error/15 rounded-lg py-3 items-center active:opacity-80"
                  onPress={() => handleReject(correction)}
                  disabled={isProcessing}
                >
                  <Text className="font-geist-semibold text-error text-sm">
                    {t('common.reject')}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
