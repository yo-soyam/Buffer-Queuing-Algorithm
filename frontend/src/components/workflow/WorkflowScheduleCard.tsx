import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SegmentedButtons, Chip, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TimePickerModal } from 'react-native-paper-dates';
import CompactDatePickerSheet from './CompactDatePickerSheet';
import { WorkflowSchedule, ScheduleType } from '../../types/workflow';
import { theme } from '../../theme/theme';

interface Props {
  schedule: WorkflowSchedule;
  onChange: (schedule: WorkflowSchedule) => void;
  errors?: Record<string, string>;
}

const WEEKDAYS = [
  { id: 1, label: 'Mon', full: 'Monday' },
  { id: 2, label: 'Tue', full: 'Tuesday' },
  { id: 3, label: 'Wed', full: 'Wednesday' },
  { id: 4, label: 'Thu', full: 'Thursday' },
  { id: 5, label: 'Fri', full: 'Friday' },
  { id: 6, label: 'Sat', full: 'Saturday' },
  { id: 7, label: 'Sun', full: 'Sunday' },
];

// Helper to format ISO YYYY-MM-DD to "10 October 2026"
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Convert "HH:MM" 24h to "9:00 AM" 12h
export function formatTo12Hr(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24;
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${ampm}`;
}

// Calculate occurrences and dates
export function calculateScheduleSummary(schedule: WorkflowSchedule): {
  summaryText: string;
  calculatedOccurrences: number;
  calculatedEndDate: string;
} {
  const {
    type,
    startDate,
    startTime,
    endTime,
    oneTimeEndDate,
    repeatDays = [1, 2, 3, 4, 5],
    recurrenceEndDate,
  } = schedule;

  if (type === 'ONE_TIME') {
    const startStr = formatDisplayDate(startDate);
    const endStr = formatDisplayDate(oneTimeEndDate || startDate);
    const sTime = formatTo12Hr(startTime);
    const eTime = formatTo12Hr(endTime);
    if (startDate === (oneTimeEndDate || startDate)) {
      return {
        summaryText: `This workflow will run on ${startStr} from ${sTime} to ${eTime} (1 scheduled session).`,
        calculatedOccurrences: 1,
        calculatedEndDate: startDate,
      };
    }
    return {
      summaryText: `This workflow starts ${startStr} at ${sTime} and ends ${endStr} at ${eTime}.`,
      calculatedOccurrences: 1,
      calculatedEndDate: oneTimeEndDate || startDate,
    };
  }

  // Recurring
  if (!startDate) {
    return {
      summaryText: 'Select a start date to calculate schedule.',
      calculatedOccurrences: 0,
      calculatedEndDate: '',
    };
  }

  const [startY, startM, startD] = startDate.split('-').map(Number);
  const start = new Date(startY, startM - 1, startD);

  // Weekday label
  const sortedDays = [...repeatDays].sort((a, b) => a - b);
  let daysText = '';
  if (sortedDays.length === 5 && sortedDays.join(',') === '1,2,3,4,5') {
    daysText = 'Monday to Friday';
  } else if (sortedDays.length === 7) {
    daysText = 'every day';
  } else if (sortedDays.length === 2 && sortedDays.join(',') === '6,7') {
    daysText = 'weekends';
  } else {
    daysText = sortedDays.map((d) => WEEKDAYS.find((w) => w.id === d)?.label).filter(Boolean).join(', ');
  }

  const sTime = formatTo12Hr(startTime);
  const eTime = formatTo12Hr(endTime);
  const startDisplay = formatDisplayDate(startDate);

  const effectiveEndDate = recurrenceEndDate || startDate;
  const [endY, endM, endD] = effectiveEndDate.split('-').map(Number);
  const end = new Date(endY, endM - 1, endD);

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const jsDay = cur.getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;
    if (repeatDays.includes(isoDay)) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  const endDisplay = formatDisplayDate(effectiveEndDate);
  const text = `This workflow will run ${daysText} from ${sTime} to ${eTime} for ${count} scheduled ${
    count === 1 ? 'session' : 'sessions'
  }, starting ${startDisplay} and ending on ${endDisplay}.`;

  return {
    summaryText: text,
    calculatedOccurrences: count,
    calculatedEndDate: effectiveEndDate,
  };
}

export default function WorkflowScheduleCard({ schedule, onChange, errors = {} }: Props) {
  // Modal states
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'startDate' | 'oneTimeEndDate' | 'recurrenceEndDate'>('startDate');

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<'startTime' | 'endTime'>('startTime');

  const summary = useMemo(() => calculateScheduleSummary(schedule), [schedule]);

  const handleTypeChange = (newType: ScheduleType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (newType === 'RECURRING') {
      onChange({
        ...schedule,
        type: newType,
        recurrenceEndType: 'ON_DATE',
        recurrenceEndDate: schedule.recurrenceEndDate || schedule.oneTimeEndDate || schedule.startDate,
        repeatDays: schedule.repeatDays && schedule.repeatDays.length > 0 ? schedule.repeatDays : [1, 2, 3, 4, 5],
      });
    } else {
      onChange({
        ...schedule,
        type: newType,
        oneTimeEndDate: schedule.oneTimeEndDate || schedule.startDate,
      });
    }
  };

  const handleDayToggle = (dayId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cur = schedule.repeatDays || [1, 2, 3, 4, 5];
    let next: number[];
    if (cur.includes(dayId)) {
      next = cur.filter((d) => d !== dayId);
    } else {
      next = [...cur, dayId].sort((a, b) => a - b);
    }
    onChange({ ...schedule, repeatDays: next });
  };

  const handleDateSelect = (dateStr: string) => {
    if (activeDateField === 'startDate') {
      const next: WorkflowSchedule = { ...schedule, startDate: dateStr };
      if (schedule.type === 'ONE_TIME' && (!schedule.oneTimeEndDate || schedule.oneTimeEndDate < dateStr)) {
        next.oneTimeEndDate = dateStr;
      }
      if (schedule.type === 'RECURRING' && (!schedule.recurrenceEndDate || schedule.recurrenceEndDate < dateStr)) {
        next.recurrenceEndDate = dateStr;
      }
      onChange(next);
    } else if (activeDateField === 'oneTimeEndDate') {
      onChange({ ...schedule, oneTimeEndDate: dateStr });
    } else if (activeDateField === 'recurrenceEndDate') {
      onChange({ ...schedule, recurrenceEndDate: dateStr });
    }
    setDatePickerVisible(false);
  };

  const handleQuickStartDate = (daysToAdd: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const next: WorkflowSchedule = { ...schedule, startDate: dateStr };
    if (schedule.type === 'ONE_TIME' && (!schedule.oneTimeEndDate || schedule.oneTimeEndDate < dateStr)) {
      next.oneTimeEndDate = dateStr;
    }
    if (schedule.type === 'RECURRING' && (!schedule.recurrenceEndDate || schedule.recurrenceEndDate < dateStr)) {
      next.recurrenceEndDate = dateStr;
    }
    onChange(next);
  };

  const handleQuickEndDate = (monthsToAdd: number, daysToAdd = 0) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const [y, m, d] = (schedule.startDate || '').split('-').map(Number);
    const base = y && m && d ? new Date(y, m - 1, d) : new Date();
    if (monthsToAdd > 0) {
      base.setMonth(base.getMonth() + monthsToAdd);
    }
    if (daysToAdd > 0) {
      base.setDate(base.getDate() + daysToAdd);
    }
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, '0');
    const dd = String(base.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    if (schedule.type === 'ONE_TIME') {
      onChange({ ...schedule, oneTimeEndDate: dateStr });
    } else {
      onChange({ ...schedule, recurrenceEndDate: dateStr });
    }
  };

  const handleTimeConfirm = ({ hours, minutes }: { hours: number; minutes: number }) => {
    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    if (activeTimeField === 'startTime') {
      onChange({ ...schedule, startTime: formatted });
    } else {
      onChange({ ...schedule, endTime: formatted });
    }
    setTimePickerVisible(false);
  };

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content style={styles.cardContent}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.headerIconWrap}>
              <MaterialIcons name="schedule" size={18} color="#004d99" />
            </View>
            <Text style={styles.headerTitle}>Workflow Schedule</Text>
          </View>
          <View style={styles.timezoneBadge}>
            <MaterialIcons name="public" size={12} color="#004d99" />
            <Text style={styles.timezoneText}>{schedule.timezone || 'Asia/Calcutta'}</Text>
          </View>
        </View>

        {/* Google Material 3 Segmented Buttons: One-time vs Recurring */}
        <View style={styles.segmentedContainer}>
          <SegmentedButtons
            value={schedule.type}
            onValueChange={(val) => handleTypeChange(val as ScheduleType)}
            buttons={[
              {
                value: 'ONE_TIME',
                label: 'One-time',
                icon: 'calendar-today',
                style: schedule.type === 'ONE_TIME' ? styles.segmentedActive : styles.segmentedInactive,
              },
              {
                value: 'RECURRING',
                label: 'Recurring',
                icon: 'repeat',
                style: schedule.type === 'RECURRING' ? styles.segmentedActive : styles.segmentedInactive,
              },
            ]}
            theme={{
              colors: {
                secondaryContainer: '#004d99',
                onSecondaryContainer: '#ffffff',
                outline: '#d4dbe4',
              },
            }}
          />
        </View>

        {/* ONE-TIME SCHEDULE CONTROLS */}
        {schedule.type === 'ONE_TIME' && (
          <View style={styles.formSection}>
            <View style={styles.row}>
              {/* Start Date */}
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  Start Date <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.pickerBox, errors.startDate ? styles.pickerBoxError : null]}
                  onPress={() => {
                    setActiveDateField('startDate');
                    setDatePickerVisible(true);
                  }}
                >
                  <MaterialIcons name="calendar-today" size={16} color="#004d99" />
                  <Text style={styles.pickerBoxText} numberOfLines={1}>
                    {formatDisplayDate(schedule.startDate) || 'Select date'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.quickPresetRow}>
                  <TouchableOpacity onPress={() => handleQuickStartDate(0)} style={styles.quickChip}>
                    <Text style={styles.quickChipText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleQuickStartDate(1)} style={styles.quickChip}>
                    <Text style={styles.quickChipText}>Tmrw</Text>
                  </TouchableOpacity>
                </View>
                {errors.startDate ? <Text style={styles.errorText}>{errors.startDate}</Text> : null}
              </View>

              {/* End Date */}
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  End Date <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.pickerBox, errors.oneTimeEndDate ? styles.pickerBoxError : null]}
                  onPress={() => {
                    setActiveDateField('oneTimeEndDate');
                    setDatePickerVisible(true);
                  }}
                >
                  <MaterialIcons name="event" size={16} color="#004d99" />
                  <Text style={styles.pickerBoxText} numberOfLines={1}>
                    {formatDisplayDate(schedule.oneTimeEndDate || schedule.startDate) || 'Select date'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.quickPresetRow}>
                  <TouchableOpacity onPress={() => handleQuickEndDate(0, 0)} style={styles.quickChip}>
                    <Text style={styles.quickChipText}>Same day</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleQuickEndDate(0, 1)} style={styles.quickChip}>
                    <Text style={styles.quickChipText}>+1 Day</Text>
                  </TouchableOpacity>
                </View>
                {errors.oneTimeEndDate ? <Text style={styles.errorText}>{errors.oneTimeEndDate}</Text> : null}
              </View>
            </View>

            <View style={styles.row}>
              {/* Start Time */}
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  Start Time <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.pickerBox, errors.startTime ? styles.pickerBoxError : null]}
                  onPress={() => {
                    setActiveTimeField('startTime');
                    setTimePickerVisible(true);
                  }}
                >
                  <MaterialIcons name="schedule" size={16} color="#004d99" />
                  <Text style={styles.pickerBoxText}>{formatTo12Hr(schedule.startTime) || '9:00 AM'}</Text>
                </TouchableOpacity>
                {errors.startTime ? <Text style={styles.errorText}>{errors.startTime}</Text> : null}
              </View>

              {/* End Time */}
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  End Time <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.pickerBox, errors.endTime ? styles.pickerBoxError : null]}
                  onPress={() => {
                    setActiveTimeField('endTime');
                    setTimePickerVisible(true);
                  }}
                >
                  <MaterialIcons name="lock-clock" size={16} color="#004d99" />
                  <Text style={styles.pickerBoxText}>{formatTo12Hr(schedule.endTime) || '5:00 PM'}</Text>
                </TouchableOpacity>
                {errors.endTime ? <Text style={styles.errorText}>{errors.endTime}</Text> : null}
              </View>
            </View>
          </View>
        )}

        {/* RECURRING SCHEDULE CONTROLS */}
        {schedule.type === 'RECURRING' && (
          <View style={styles.formSection}>
            {/* Start Date & End Date Row */}
            <View style={styles.row}>
              {/* Start Date */}
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  Start Date <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.pickerBox, errors.startDate ? styles.pickerBoxError : null]}
                  onPress={() => {
                    setActiveDateField('startDate');
                    setDatePickerVisible(true);
                  }}
                >
                  <MaterialIcons name="calendar-today" size={16} color="#004d99" />
                  <Text style={styles.pickerBoxText} numberOfLines={1}>
                    {formatDisplayDate(schedule.startDate) || 'Select start date'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.quickPresetRow}>
                  <TouchableOpacity onPress={() => handleQuickStartDate(0)} style={styles.quickChip}>
                    <Text style={styles.quickChipText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleQuickStartDate(1)} style={styles.quickChip}>
                    <Text style={styles.quickChipText}>Tmrw</Text>
                  </TouchableOpacity>
                </View>
                {errors.startDate ? <Text style={styles.errorText}>{errors.startDate}</Text> : null}
              </View>

              {/* End Date (Clean, direct date picker) */}
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  End Date <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.pickerBox, errors.recurrenceEndDate ? styles.pickerBoxError : null]}
                  onPress={() => {
                    setActiveDateField('recurrenceEndDate');
                    setDatePickerVisible(true);
                  }}
                >
                  <MaterialIcons name="event" size={16} color="#004d99" />
                  <Text style={styles.pickerBoxText} numberOfLines={1}>
                    {formatDisplayDate(schedule.recurrenceEndDate || schedule.startDate) || 'Select end date'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.quickPresetRow}>
                  <TouchableOpacity onPress={() => handleQuickEndDate(1)} style={styles.quickChip}>
                    <Text style={styles.quickChipText}>+1 Mo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleQuickEndDate(3)} style={styles.quickChip}>
                    <Text style={styles.quickChipText}>+3 Mo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleQuickEndDate(6)} style={styles.quickChip}>
                    <Text style={styles.quickChipText}>+6 Mo</Text>
                  </TouchableOpacity>
                </View>
                {errors.recurrenceEndDate ? (
                  <Text style={styles.errorText}>{errors.recurrenceEndDate}</Text>
                ) : null}
              </View>
            </View>

            {/* Daily Hours Row */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  Daily Start Time <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.pickerBox, errors.startTime ? styles.pickerBoxError : null]}
                  onPress={() => {
                    setActiveTimeField('startTime');
                    setTimePickerVisible(true);
                  }}
                >
                  <MaterialIcons name="schedule" size={16} color="#004d99" />
                  <Text style={styles.pickerBoxText}>{formatTo12Hr(schedule.startTime) || '9:00 AM'}</Text>
                </TouchableOpacity>
                {errors.startTime ? <Text style={styles.errorText}>{errors.startTime}</Text> : null}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  Daily End Time <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.pickerBox, errors.endTime ? styles.pickerBoxError : null]}
                  onPress={() => {
                    setActiveTimeField('endTime');
                    setTimePickerVisible(true);
                  }}
                >
                  <MaterialIcons name="lock-clock" size={16} color="#004d99" />
                  <Text style={styles.pickerBoxText}>{formatTo12Hr(schedule.endTime) || '5:00 PM'}</Text>
                </TouchableOpacity>
                {errors.endTime ? <Text style={styles.errorText}>{errors.endTime}</Text> : null}
              </View>
            </View>

            {/* Repeat On (Material 3 Chips) */}
            <View style={{ marginTop: 2, marginBottom: 6 }}>
              <Text style={styles.fieldLabel}>
                Repeat On <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.weekdayChipsRow}>
                {WEEKDAYS.map((w) => {
                  const isSelected = (schedule.repeatDays || [1, 2, 3, 4, 5]).includes(w.id);
                  return (
                    <Chip
                      key={w.id}
                      selected={isSelected}
                      showSelectedCheck={false}
                      mode={isSelected ? 'flat' : 'outlined'}
                      style={[
                        styles.weekdayChip,
                        isSelected ? styles.weekdayChipSelected : styles.weekdayChipNormal,
                      ]}
                      textStyle={[
                        styles.weekdayChipText,
                        isSelected && styles.weekdayChipTextSelected,
                      ]}
                      onPress={() => handleDayToggle(w.id)}
                    >
                      {w.label}
                    </Chip>
                  );
                })}
              </View>
              {errors.repeatDays ? (
                <Text style={styles.errorText}>{errors.repeatDays}</Text>
              ) : null}
            </View>
          </View>
        )}

        {/* Schedule Summary Banner */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <MaterialIcons name="auto-awesome" size={16} color="#004d99" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>Schedule Summary</Text>
            <Text style={styles.summaryBody}>{summary.summaryText}</Text>
          </View>
        </View>

        {/* Compact Date Picker Bottom Sheet (no full opening calendar) */}
        <CompactDatePickerSheet
          visible={datePickerVisible}
          onDismiss={() => setDatePickerVisible(false)}
          title={
            activeDateField === 'startDate'
              ? 'Select Start Date'
              : activeDateField === 'oneTimeEndDate'
              ? 'Select End Date'
              : 'Select Recurrence End Date'
          }
          selectedDate={
            activeDateField === 'startDate'
              ? schedule.startDate
              : activeDateField === 'oneTimeEndDate'
              ? schedule.oneTimeEndDate || schedule.startDate
              : schedule.recurrenceEndDate || schedule.startDate
          }
          onSelectDate={handleDateSelect}
          mode={activeDateField === 'startDate' ? 'start' : 'end'}
          minDate={activeDateField === 'startDate' ? undefined : schedule.startDate}
          referenceStartDate={schedule.startDate}
        />

        {/* Time Picker Modal */}
        <TimePickerModal
          visible={timePickerVisible}
          onDismiss={() => setTimePickerVisible(false)}
          onConfirm={handleTimeConfirm}
          hours={
            activeTimeField === 'startTime'
              ? parseInt(schedule.startTime.split(':')[0], 10) || 9
              : parseInt(schedule.endTime.split(':')[0], 10) || 17
          }
          minutes={
            activeTimeField === 'startTime'
              ? parseInt(schedule.startTime.split(':')[1], 10) || 0
              : parseInt(schedule.endTime.split(':')[1], 10) || 0
          }
          label={activeTimeField === 'startTime' ? 'Select Start Time' : 'Select End Time'}
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e7ef',
    elevation: 1,
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e6f0fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0e1d33',
  },
  timezoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f5fc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timezoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#004d99',
  },
  segmentedContainer: {
    marginVertical: 4,
  },
  segmentedActive: {
    backgroundColor: '#004d99',
  },
  segmentedInactive: {
    backgroundColor: '#ffffff',
  },
  formSection: {
    gap: 10,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#344050',
    marginBottom: 4,
  },
  required: {
    color: '#d32f2f',
  },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.2,
    borderColor: '#cfd8e3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  pickerBoxError: {
    borderColor: '#d32f2f',
  },
  pickerBoxText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0e1d33',
    flex: 1,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
    marginLeft: 2,
  },
  weekdayChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  weekdayChip: {
    height: 36,
    borderRadius: 18,
  },
  weekdayChipNormal: {
    backgroundColor: '#ffffff',
    borderColor: '#d4dbe4',
  },
  weekdayChipSelected: {
    backgroundColor: '#004d99',
  },
  weekdayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#344050',
  },
  weekdayChipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f0f6ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#cce3ff',
    marginTop: 6,
  },
  summaryIconWrap: {
    marginTop: 2,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004d99',
    marginBottom: 2,
  },
  summaryBody: {
    fontSize: 12,
    color: '#1a365d',
    lineHeight: 17,
  },
  quickPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 5,
  },
  quickChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
});
