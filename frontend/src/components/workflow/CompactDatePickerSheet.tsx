import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  title?: string;
  minDate?: string; // YYYY-MM-DD
  mode?: 'start' | 'end';
  referenceStartDate?: string; // YYYY-MM-DD
}

function parseYMD(str: string): Date {
  if (!str) return new Date();
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatLongDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseYMD(dateStr);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function CompactDatePickerSheet({
  visible,
  onDismiss,
  selectedDate,
  onSelectDate,
  title = 'Select Date',
  minDate,
  mode = 'start',
  referenceStartDate,
}: Props) {
  const initialDate = selectedDate || minDate || formatYMD(new Date());
  const [tempDate, setTempDate] = useState(initialDate);

  const initialParsed = parseYMD(initialDate);
  const [viewYear, setViewYear] = useState(initialParsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialParsed.getMonth());

  useEffect(() => {
    if (visible) {
      const active = selectedDate || minDate || formatYMD(new Date());
      setTempDate(active);
      const p = parseYMD(active);
      setViewYear(p.getFullYear());
      setViewMonth(p.getMonth());
    }
  }, [visible, selectedDate, minDate]);

  const todayStr = formatYMD(new Date());

  // Quick preset calculations
  const presets = React.useMemo(() => {
    const list: { label: string; dateStr: string }[] = [];
    const base = parseYMD(mode === 'end' && referenceStartDate ? referenceStartDate : formatYMD(new Date()));

    if (mode === 'start') {
      // Today
      list.push({ label: 'Today', dateStr: formatYMD(new Date()) });

      // Tomorrow
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      list.push({ label: 'Tomorrow', dateStr: formatYMD(tmrw) });

      // Next Monday
      const nextMon = new Date();
      const day = nextMon.getDay();
      const diff = day === 0 ? 1 : 8 - day;
      nextMon.setDate(nextMon.getDate() + diff);
      list.push({ label: 'Next Mon', dateStr: formatYMD(nextMon) });

      // +1 Week
      const plusWeek = new Date();
      plusWeek.setDate(plusWeek.getDate() + 7);
      list.push({ label: '+1 Week', dateStr: formatYMD(plusWeek) });
    } else {
      // End date presets relative to start date
      if (referenceStartDate) {
        list.push({ label: 'Same Day', dateStr: referenceStartDate });
      }

      // +1 Week
      const w1 = new Date(base);
      w1.setDate(w1.getDate() + 7);
      list.push({ label: '+1 Week', dateStr: formatYMD(w1) });

      // +2 Weeks
      const w2 = new Date(base);
      w2.setDate(w2.getDate() + 14);
      list.push({ label: '+2 Weeks', dateStr: formatYMD(w2) });

      // +1 Month
      const m1 = new Date(base);
      m1.setMonth(m1.getMonth() + 1);
      list.push({ label: '+1 Month', dateStr: formatYMD(m1) });

      // +3 Months
      const m3 = new Date(base);
      m3.setMonth(m3.getMonth() + 3);
      list.push({ label: '+3 Months', dateStr: formatYMD(m3) });

      // +6 Months
      const m6 = new Date(base);
      m6.setMonth(m6.getMonth() + 6);
      list.push({ label: '+6 Months', dateStr: formatYMD(m6) });
    }

    return list.filter((p) => !minDate || p.dateStr >= minDate);
  }, [mode, referenceStartDate, minDate]);

  // Calendar days generation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayJs = new Date(viewYear, viewMonth, 1).getDay();
  // Adjust so Monday = 0, Sunday = 6
  const leadBlanks = firstDayJs === 0 ? 6 : firstDayJs - 1;

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const target = `${viewYear}-${mm}-${dd}`;
    if (minDate && target < minDate) return;
    setTempDate(target);
  };

  const handleApplyPreset = (presetDate: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempDate(presetDate);
    const p = parseYMD(presetDate);
    setViewYear(p.getFullYear());
    setViewMonth(p.getMonth());
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelectDate(tempDate);
    onDismiss();
  };

  // Check if prev month navigation should be disabled
  const isPrevDisabled = React.useMemo(() => {
    if (!minDate) return false;
    const minD = parseYMD(minDate);
    const minYear = minD.getFullYear();
    const minMonth = minD.getMonth();
    return viewYear < minYear || (viewYear === minYear && viewMonth <= minMonth);
  }, [minDate, viewYear, viewMonth]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onDismiss} />

        <View style={styles.sheetContainer}>
          {/* Top Grabber */}
          <View style={styles.grabberContainer}>
            <View style={styles.grabber} />
          </View>

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.selectedBadge}>
                <MaterialIcons name="event" size={14} color="#004d99" />
                <Text style={styles.selectedBadgeText}>
                  {formatLongDate(tempDate) || 'Pick a date'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onDismiss}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Quick Presets Row */}
          <View style={styles.presetSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetScroll}
            >
              {presets.map((preset) => {
                const isActive = tempDate === preset.dateStr;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => handleApplyPreset(preset.dateStr)}
                    style={[
                      styles.presetChip,
                      isActive && styles.presetChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        isActive && styles.presetChipTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Month / Year Navigator */}
          <View style={styles.navigatorRow}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              disabled={isPrevDisabled}
              style={[styles.navBtn, isPrevDisabled && styles.navBtnDisabled]}
            >
              <MaterialIcons
                name="chevron-left"
                size={22}
                color={isPrevDisabled ? '#cbd5e1' : '#0e1d33'}
              />
            </TouchableOpacity>

            <Text style={styles.monthYearTitle}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <MaterialIcons name="chevron-right" size={22} color="#0e1d33" />
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekdayRow}>
            {WEEK_DAYS.map((day) => (
              <Text key={day} style={styles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.daysGrid}>
            {/* Blank leading days */}
            {Array.from({ length: leadBlanks }).map((_, idx) => (
              <View key={`lead-${idx}`} style={styles.dayCellPlaceholder} />
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const mm = String(viewMonth + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const cellDate = `${viewYear}-${mm}-${dd}`;
              const isSelected = cellDate === tempDate;
              const isToday = cellDate === todayStr;
              const isDisabled = Boolean(minDate && cellDate < minDate);

              return (
                <TouchableOpacity
                  key={cellDate}
                  disabled={isDisabled}
                  onPress={() => handleSelectDay(day)}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                    isDisabled && styles.dayCellDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday,
                      isDisabled && styles.dayTextDisabled,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bottom Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={onDismiss} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
              <MaterialIcons name="check" size={16} color="#ffffff" />
              <Text style={styles.confirmBtnText}>Apply Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(14, 29, 51, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d0d7de',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0e1d33',
    marginBottom: 4,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e6f0fc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#004d99',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetSection: {
    marginVertical: 6,
  },
  presetScroll: {
    gap: 6,
    paddingVertical: 4,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetChipActive: {
    backgroundColor: '#004d99',
    borderColor: '#004d99',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#ffffff',
  },
  navigatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  monthYearTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0e1d33',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 6,
  },
  dayCellPlaceholder: {
    width: 38,
    height: 38,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#004d99',
    elevation: 2,
    shadowColor: '#004d99',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#004d99',
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dayTextToday: {
    color: '#004d99',
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: '#94a3b8',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#004d99',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 1,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
