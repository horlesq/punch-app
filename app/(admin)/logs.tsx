import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';

import { useTheme } from '@/src/theme/ThemeProvider';
import { getAuditLog, type AuditLogEntry } from '@/src/api/auditLog';
import { getAllEmployees, type Profile } from '@/src/api/profiles';
import { LogsSkeleton } from '@/src/components/ui/Skeleton';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';

/** Categories of actions for the filter */
type ActionCategory = 'corrections' | 'rate_changes' | 'pay_events' | 'employee_status' | 'name_changes';

const CATEGORY_MAP: Record<ActionCategory, string[]> = {
  corrections: ['correction_approved', 'correction_rejected'],
  rate_changes: ['rate_changed'],
  pay_events: ['week_marked_paid', 'week_unlocked'],
  employee_status: ['employee_deactivated', 'employee_reactivated'],
  name_changes: ['name_changed'],
};

export default function LogsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter state
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<ActionCategory>>(new Set());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const [logsResult, employeesResult] = await Promise.all([
      getAuditLog(200),
      getAllEmployees(),
    ]);

    if (logsResult.error) {
      setErrorMessage(t('admin.logs.errorLoading'));
    } else {
      setLogs(logsResult.data);
    }

    if (!employeesResult.error) {
      setEmployees(employeesResult.data);
    }

    setIsLoading(false);
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Apply filters locally
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Employee filter
      // Check if the entity being affected is the employee, OR if the actor is the employee (though actor is usually admin)
      // For rate changes, status changes, name changes, entity_id IS the employee_id
      // For pay events, old_value/new_value might contain employee_id
      if (selectedEmployeeId) {
        let isMatch = log.entity_id === selectedEmployeeId;
        if (!isMatch && log.new_value && (log.new_value as any).employee_id === selectedEmployeeId) {
          isMatch = true;
        }
        if (!isMatch && log.old_value && (log.old_value as any).employee_id === selectedEmployeeId) {
          isMatch = true;
        }
        if (!isMatch) return false;
      }

      // 2. Category filter
      if (selectedCategories.size > 0) {
        let matchesCategory = false;
        for (const category of selectedCategories) {
          if (CATEGORY_MAP[category].includes(log.action)) {
            matchesCategory = true;
            break;
          }
        }
        if (!matchesCategory) return false;
      }

      return true;
    });
  }, [logs, selectedEmployeeId, selectedCategories]);

  function getHumanActionLabel(action: string): string {
    switch (action) {
      case 'correction_approved': return t('admin.logs.actionCorrectionApproved');
      case 'correction_rejected': return t('admin.logs.actionCorrectionRejected');
      case 'rate_changed': return t('admin.logs.actionRateChanged');
      case 'week_marked_paid': return t('admin.logs.actionWeekPaid');
      case 'week_unlocked': return t('admin.logs.actionWeekUnlocked');
      case 'employee_deactivated': return t('admin.logs.actionEmployeeDeactivated');
      case 'employee_reactivated': return t('admin.logs.actionEmployeeReactivated');
      case 'name_changed': return t('admin.logs.actionNameChanged');
      default: return t('admin.logs.actionUnknown') + ` (${action})`;
    }
  }

  function formatRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return t('admin.logs.timeJustNow');
    if (diffMins < 60) return t('admin.logs.timeMinutesAgo', { count: diffMins });
    if (diffHours < 24 && now.getDate() === date.getDate()) return t('admin.logs.timeHoursAgo', { count: diffHours });
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
      const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
      return t('admin.logs.timeYesterday', { time: timeStr });
    }

    // Older
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function getIconForAction(action: string): { name: keyof typeof MaterialCommunityIcons.glyphMap, color: string } {
    if (action.includes('correction')) return { name: 'clock-edit-outline', color: theme.accent };
    if (action.includes('rate') || action.includes('pay') || action.includes('week')) return { name: 'cash', color: theme.success };
    if (action.includes('status') || action.includes('employee') || action.includes('name')) return { name: 'account-cog-outline', color: theme.primary };
    return { name: 'information-outline', color: theme.textSecondary };
  }

  function toggleCategory(category: ActionCategory) {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function renderOldNewValue(log: AuditLogEntry) {
    const action = log.action;
    
    if (action === 'rate_changed' && log.old_value && log.new_value) {
      return (
        <Text style={{ color: theme.textSecondary }} className="font-inter text-xs mt-1">
          ${Number(log.old_value.hourly_rate).toFixed(2)} → ${Number(log.new_value.hourly_rate).toFixed(2)}
        </Text>
      );
    }
    
    if (action === 'name_changed' && log.old_value && log.new_value) {
      return (
        <Text style={{ color: theme.textSecondary }} className="font-inter text-xs mt-1">
          {log.old_value.full_name as string} → {log.new_value.full_name as string}
        </Text>
      );
    }

    if ((action === 'week_marked_paid' || action === 'week_unlocked') && log.new_value) {
      const hours = log.new_value.total_hours as number;
      const pay = log.new_value.total_pay as number;
      if (hours !== undefined && pay !== undefined) {
         return (
          <Text style={{ color: theme.textSecondary }} className="font-inter text-xs mt-1">
            {hours.toFixed(1)}h • ${pay.toFixed(2)}
          </Text>
        );
      }
    }

    if ((action === 'correction_approved' || action === 'correction_rejected') && log.new_value) {
      const inTime = log.new_value.requested_clock_in_at as string | undefined;
      const outTime = log.new_value.requested_clock_out_at as string | undefined;
      
      if (inTime || outTime) {
        const formatTime = (iso?: string) => iso ? new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';
        
        return (
          <Text style={{ color: theme.textSecondary }} className="font-inter text-xs mt-1">
            {formatTime(inTime)} → {formatTime(outTime)}
            {log.new_value.punch_id ? ' (Edited Shift)' : ' (Missed Shift)'}
          </Text>
        );
      }
    }

    return null;
  }

  if (isLoading) {
    return (
      <ScreenWrapper scrollable={false}>
        <LogsSkeleton />
      </ScreenWrapper>
    );
  }

  if (errorMessage) {
    return (
      <View style={{ backgroundColor: theme.background }} className="flex-1 justify-center items-center px-6">
        <Text style={{ color: theme.error }} className="text-center mb-4">{errorMessage}</Text>
        <Pressable onPress={loadData} className="active:opacity-70">
          <Text style={{ color: theme.accent }} className="font-geist-semibold">
            {t('common.retry')}
          </Text>
        </Pressable>
      </View>
    );
  }

  const hasFilters = selectedCategories.size > 0 || selectedEmployeeId !== null;

  return (
    <ScreenWrapper>
      <View className="pt-4">
        
        {/* Header / Filter Bar */}
        <View className="flex-row items-center justify-between mx-4 mb-4">
          <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-2xl">
            {t('admin.logs.title')}
          </Text>
          <Pressable 
            style={{ 
              backgroundColor: hasFilters ? theme.accent + '20' : theme.surfaceContainerLowest,
              borderColor: hasFilters ? theme.accent : theme.borderLight + '40',
              borderWidth: 1,
            }} 
            className="w-10 h-10 rounded-full justify-center items-center active:opacity-60"
            onPress={() => setIsFilterModalVisible(true)}
          >
            <MaterialCommunityIcons 
              name={hasFilters ? "filter-check" : "filter-variant"} 
              size={20} 
              color={hasFilters ? theme.accent : theme.textPrimary} 
            />
          </Pressable>
        </View>

        {filteredLogs.length === 0 ? (
          <View className="flex-1 justify-center items-center pt-20">
            <MaterialCommunityIcons name="clipboard-text-clock-outline" size={48} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary }} className="text-base mt-4 text-center mx-6">
              {hasFilters ? t('admin.logs.emptyFiltered') : t('admin.logs.empty')}
            </Text>
            {hasFilters && (
              <Pressable 
                className="mt-4 px-4 py-2 rounded-lg"
                style={{ backgroundColor: theme.surfaceVariant }}
                onPress={() => {
                  setSelectedCategories(new Set());
                  setSelectedEmployeeId(null);
                }}
              >
                <Text style={{ color: theme.textPrimary }} className="font-geist-medium text-sm">
                  {t('admin.logs.filterClear')}
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          filteredLogs.map((log) => {
            const iconInfo = getIconForAction(log.action);
            
            const targetEmployeeId = log.entity_type === 'profile' 
              ? log.entity_id 
              : ((log.new_value as any)?.employee_id || (log.old_value as any)?.employee_id);
              
            const targetEmployee = employees.find(e => e.id === targetEmployeeId);
            const targetName = targetEmployee?.full_name || 'Unknown Employee';
            
            return (
              <View
                key={log.id}
                style={{
                  backgroundColor: theme.surfaceContainerLowest,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                className="rounded-xl mx-4 mb-3 p-4"
              >
                {/* Header Row: Target Employee & Time */}
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="account" size={14} color={theme.textSecondary} className="mr-1.5" />
                    <Text style={{ color: theme.textPrimary }} className="font-geist-medium text-sm">
                      {targetName}
                    </Text>
                  </View>
                  <Text style={{ color: theme.textSecondary }} className="font-inter text-xs">
                    {formatRelativeTime(log.created_at)}
                  </Text>
                </View>

                {/* Action Row */}
                <View className="flex-row items-start mt-1">
                  <View style={{ backgroundColor: iconInfo.color + '15' }} className="w-8 h-8 rounded-full justify-center items-center mr-3">
                    <MaterialCommunityIcons name={iconInfo.name} size={16} color={iconInfo.color} />
                  </View>
                  <View className="flex-1 pt-1">
                    <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-[15px]">
                      {getHumanActionLabel(log.action)}
                    </Text>
                    {renderOldNewValue(log)}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Filters Modal */}
      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View style={{ backgroundColor: theme.surfaceContainerLowest }} className="rounded-t-3xl pt-6 pb-10 px-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text style={{ color: theme.textPrimary }} className="font-geist-bold text-xl">
                {t('admin.logs.filterTitle')}
              </Text>
              <Pressable onPress={() => setIsFilterModalVisible(false)} className="active:opacity-60 p-2 -mr-2">
                <MaterialCommunityIcons name="close" size={24} color={theme.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category Filters */}
              <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-base mb-3">
                {t('admin.logs.filterByAction')}
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {(['corrections', 'rate_changes', 'pay_events', 'employee_status', 'name_changes'] as ActionCategory[]).map(cat => {
                  const isSelected = selectedCategories.has(cat);
                  // Dynamic translation key based on category
                  let label = cat as string;
                  if (cat === 'corrections') label = t('admin.logs.categoryCorrections');
                  if (cat === 'rate_changes') label = t('admin.logs.categoryRateChanges');
                  if (cat === 'pay_events') label = t('admin.logs.categoryPayEvents');
                  if (cat === 'employee_status') label = t('admin.logs.categoryEmployeeStatus');
                  if (cat === 'name_changes') label = t('admin.logs.categoryNameChanges');
                  
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => toggleCategory(cat)}
                      style={{
                        backgroundColor: isSelected ? theme.accent : theme.surfaceVariant,
                        borderColor: isSelected ? theme.accent : theme.borderLight + '40',
                        borderWidth: 1,
                      }}
                      className="px-4 py-2 rounded-full active:opacity-80"
                    >
                      <Text style={{ color: isSelected ? '#ffffff' : theme.textPrimary }} className="font-geist-medium text-sm">
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Employee Filter */}
              <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-base mb-2">
                {t('admin.logs.filterByEmployee')}
              </Text>
              <View 
                style={{ 
                  backgroundColor: theme.surfaceVariant,
                  borderColor: theme.borderLight + '40',
                  borderWidth: 1,
                }} 
                className="rounded-xl overflow-hidden mb-6"
              >
                <Picker
                  selectedValue={selectedEmployeeId ?? 'all'}
                  onValueChange={(itemValue: string) => setSelectedEmployeeId(itemValue === 'all' ? null : itemValue)}
                  dropdownIconColor={theme.textPrimary}
                  style={{ color: theme.textPrimary }}
                >
                  <Picker.Item label={t('admin.logs.filterAll')} value="all" color={theme.textPrimary} />
                  {employees.map(emp => (
                    <Picker.Item key={emp.id} label={emp.full_name} value={emp.id} color={theme.textPrimary} />
                  ))}
                </Picker>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 pt-2">
                <Pressable
                  style={{ backgroundColor: theme.surfaceVariant }}
                  className="flex-1 py-3.5 rounded-xl items-center active:opacity-80"
                  onPress={() => {
                    setSelectedCategories(new Set());
                    setSelectedEmployeeId(null);
                  }}
                >
                  <Text style={{ color: theme.textPrimary }} className="font-geist-semibold text-base">
                    {t('admin.logs.filterClear')}
                  </Text>
                </Pressable>
                <Pressable
                  style={{ backgroundColor: theme.primary }}
                  className="flex-1 py-3.5 rounded-xl items-center active:opacity-80"
                  onPress={() => setIsFilterModalVisible(false)}
                >
                  <Text style={{ color: '#ffffff' }} className="font-geist-semibold text-base">
                    {t('common.close')}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
