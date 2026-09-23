import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TimePickerModal } from 'react-native-paper-dates';
import { AvailableQueue, WorkflowSchedule } from '../../types/workflow';
import { AVAILABLE_MOCK_QUEUES } from '../../data/mockWorkflows';
import { theme } from '../../theme/theme';
import {
  formatDisplayDate,
  formatTo12Hr,
  calculateScheduleSummary,
} from './WorkflowScheduleCard';

interface Props {
  visible: boolean;
  initialQueueName?: string;
  workflowSchedule?: WorkflowSchedule;
  onCancel: () => void;
  onCreate: (newQueue: AvailableQueue) => void;
}

// Helper to auto-generate code from queue name
function generateQueueCode(name: string): string {
  if (!name.trim()) return '';
  const clean = name.replace(/queue/gi, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  let prefix = '';
  if (words.length >= 2) {
    prefix = words.map((w) => w[0]).join('').slice(0, 3).toUpperCase();
  } else if (words.length === 1) {
    const w = words[0];
    const consonants = w.replace(/[aeiou\W_]/gi, '').toUpperCase();
    prefix = (consonants.length >= 3 ? consonants.slice(0, 3) : w.slice(0, 3)).toUpperCase();
  } else {
    prefix = 'QUE';
  }
  if (prefix.length < 2) prefix = (prefix + 'X').toUpperCase();
  const randomNum = Math.floor(100 + Math.random() * 899);
  return `${prefix}-${randomNum}`;
}

function formatWeekdaySummary(repeatDays?: number[]): string {
  if (!repeatDays || repeatDays.length === 0) return 'Weekdays';
  const sorted = [...repeatDays].sort((a, b) => a - b);
  if (sorted.length === 5 && sorted.join(',') === '1,2,3,4,5') {
    return 'Monday–Friday';
  }
  if (sorted.length === 7) {
    return 'Every Day';
  }
  if (sorted.length === 2 && sorted.join(',') === '6,7') {
    return 'Weekends';
  }
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return sorted.map((d) => labels[d - 1]).join(', ');
}

export default function CreateQueueSheet({
  visible,
  initialQueueName = '',
  workflowSchedule,
  onCancel,
  onCreate,
}: Props) {
  const [name, setName] = useState(initialQueueName);
  const [code, setCode] = useState('');
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('60');
  const [avgProcessingTime, setAvgProcessingTime] = useState('5');
  const [bufferDuration, setBufferDuration] = useState('20');

  // Queue Availability: 'SAME_AS_WORKFLOW' (default) vs 'CUSTOM'
  const [availabilityMode, setAvailabilityMode] = useState<'SAME_AS_WORKFLOW' | 'CUSTOM'>('SAME_AS_WORKFLOW');
  const [openingTime, setOpeningTime] = useState(workflowSchedule?.startTime || '09:00');
  const [closingTime, setClosingTime] = useState(workflowSchedule?.endTime || '17:00');

  // Time picker modal state
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [activeTimeTarget, setActiveTimeTarget] = useState<'open' | 'close' | null>(null);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      const initName = initialQueueName.trim();
      setName(initName);
      setCode(initName ? generateQueueCode(initName) : '');
      setIsCodeManuallyEdited(false);
      setDescription('');
      setCapacity('60');
      setAvgProcessingTime('5');
      setBufferDuration('20');
      setAvailabilityMode(workflowSchedule ? 'SAME_AS_WORKFLOW' : 'CUSTOM');
      setOpeningTime(workflowSchedule?.startTime || '09:00');
      setClosingTime(workflowSchedule?.endTime || '17:00');
      setErrors({});
    }
  }, [visible, initialQueueName, workflowSchedule]);

  const scheduleSummary = useMemo(() => {
    if (!workflowSchedule) return null;
    return calculateScheduleSummary(workflowSchedule);
  }, [workflowSchedule]);

  const handleNameChange = (text: string) => {
    setName(text);
    if (!isCodeManuallyEdited) {
      setCode(generateQueueCode(text));
    }
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const handleCodeChange = (text: string) => {
    setCode(text.toUpperCase());
    setIsCodeManuallyEdited(true);
    if (errors.code) {
      setErrors((prev) => ({ ...prev, code: '' }));
    }
  };

  const handleTimeConfirm = ({ hours, minutes }: { hours: number; minutes: number }) => {
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    if (activeTimeTarget === 'open') {
      setOpeningTime(formatted);
      if (errors.openingTime || errors.timeWindow) {
        setErrors((prev) => ({ ...prev, openingTime: '', timeWindow: '' }));
      }
    } else if (activeTimeTarget === 'close') {
      setClosingTime(formatted);
      if (errors.closingTime || errors.timeWindow) {
        setErrors((prev) => ({ ...prev, closingTime: '', timeWindow: '' }));
      }
    }
    setTimePickerVisible(false);
    setActiveTimeTarget(null);
  };

  const handleCreate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Queue name is required.';
    }

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      newErrors.code = 'Queue code is required.';
    } else {
      const duplicate = AVAILABLE_MOCK_QUEUES.some(
        (q) => q.code.toUpperCase() === trimmedCode
      );
      if (duplicate) {
        newErrors.code = `Queue code "${trimmedCode}" is already in use. Please enter a unique code.`;
      }
    }

    const capNum = parseInt(capacity, 10);
    if (isNaN(capNum) || capNum <= 0) {
      newErrors.capacity = 'Capacity must be a positive integer greater than 0.';
    }

    const avgNum = parseFloat(avgProcessingTime);
    if (isNaN(avgNum) || avgNum <= 0) {
      newErrors.avgProcessingTime = 'Average processing time must be greater than 0 minutes.';
    }

    const bufNum = parseFloat(bufferDuration);
    if (isNaN(bufNum) || bufNum < 0) {
      newErrors.bufferDuration = 'Buffer duration must be 0 or greater.';
    }

    let finalOpenTime = openingTime;
    let finalCloseTime = closingTime;

    if (availabilityMode === 'SAME_AS_WORKFLOW' && workflowSchedule) {
      finalOpenTime = workflowSchedule.startTime || '09:00';
      finalCloseTime = workflowSchedule.endTime || '17:00';
    } else {
      if (!openingTime) {
        newErrors.openingTime = 'Opening time is required.';
      }
      if (!closingTime) {
        newErrors.closingTime = 'Closing time is required.';
      }

      if (openingTime && closingTime) {
        const [qOpenH, qOpenM] = openingTime.split(':').map(Number);
        const [qCloseH, qCloseM] = closingTime.split(':').map(Number);
        const qOpenMin = qOpenH * 60 + qOpenM;
        const qCloseMin = qCloseH * 60 + qCloseM;

        if (qOpenMin >= qCloseMin) {
          newErrors.closingTime = 'Closing time must be later than opening time.';
        } else if (workflowSchedule && workflowSchedule.startTime && workflowSchedule.endTime) {
          const [wfStartH, wfStartM] = workflowSchedule.startTime.split(':').map(Number);
          const [wfEndH, wfEndM] = workflowSchedule.endTime.split(':').map(Number);
          const wfStartMin = wfStartH * 60 + wfStartM;
          const wfEndMin = wfEndH * 60 + wfEndM;

          if (qOpenMin < wfStartMin || qCloseMin > wfEndMin) {
            newErrors.timeWindow = `Queue hours must remain within the workflow schedule of ${formatTo12Hr(workflowSchedule.startTime)}–${formatTo12Hr(workflowSchedule.endTime)}.`;
          }
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors(newErrors);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newQueue: AvailableQueue = {
      id: `q_${Date.now()}`,
      name: name.trim(),
      code: trimmedCode,
      service: name.trim(),
      description: description.trim() || undefined,
      capacity: capNum,
      avgProcessingTime: avgNum,
      bufferDuration: bufNum,
      openingTime: finalOpenTime,
      closingTime: finalCloseTime,
      status: 'OPEN',
    };

    onCreate(newQueue);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.headerIconBadge}>
                <MaterialIcons name="add-business" size={18} color="#004d99" />
              </View>
              <Text style={styles.sheetTitle}>Create New Queue</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
              <MaterialIcons name="close" size={22} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {/* Queue Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Queue Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                mode="outlined"
                value={name}
                onChangeText={handleNameChange}
                placeholder="e.g. Document Verification Queue"
                outlineColor={errors.name ? theme.colors.error : '#cfd8e3'}
                activeOutlineColor={errors.name ? theme.colors.error : theme.colors.primary}
                style={styles.textInput}
                textColor="#0e1d33"
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Queue Code */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  Queue Code <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.codeHint}>Auto-generated, unique</Text>
              </View>
              <TextInput
                mode="outlined"
                value={code}
                onChangeText={handleCodeChange}
                placeholder="e.g. VER-101"
                autoCapitalize="characters"
                outlineColor={errors.code ? theme.colors.error : '#cfd8e3'}
                activeOutlineColor={errors.code ? theme.colors.error : theme.colors.primary}
                style={styles.textInput}
                textColor="#0e1d33"
              />
              {errors.code ? <Text style={styles.errorText}>{errors.code}</Text> : null}
            </View>

            {/* Description (Optional) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                mode="outlined"
                value={description}
                onChangeText={setDescription}
                placeholder="Brief purpose of this queue"
                multiline
                numberOfLines={2}
                outlineColor="#cfd8e3"
                activeOutlineColor={theme.colors.primary}
                style={[styles.textInput, { minHeight: 60 }]}
                textColor="#0e1d33"
              />
            </View>

            {/* Capacity & Average Processing Time */}
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Capacity <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  mode="outlined"
                  value={capacity}
                  onChangeText={(val) => {
                    setCapacity(val.replace(/[^0-9]/g, ''));
                    if (errors.capacity) setErrors((prev) => ({ ...prev, capacity: '' }));
                  }}
                  keyboardType="number-pad"
                  placeholder="60"
                  outlineColor={errors.capacity ? theme.colors.error : '#cfd8e3'}
                  activeOutlineColor={errors.capacity ? theme.colors.error : theme.colors.primary}
                  style={styles.textInput}
                  textColor="#0e1d33"
                  right={<TextInput.Affix text="ppl" />}
                />
                {errors.capacity ? <Text style={styles.errorText}>{errors.capacity}</Text> : null}
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Avg Time <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  mode="outlined"
                  value={avgProcessingTime}
                  onChangeText={(val) => {
                    setAvgProcessingTime(val.replace(/[^0-9.]/g, ''));
                    if (errors.avgProcessingTime) setErrors((prev) => ({ ...prev, avgProcessingTime: '' }));
                  }}
                  keyboardType="numeric"
                  placeholder="5"
                  outlineColor={errors.avgProcessingTime ? theme.colors.error : '#cfd8e3'}
                  activeOutlineColor={errors.avgProcessingTime ? theme.colors.error : theme.colors.primary}
                  style={styles.textInput}
                  textColor="#0e1d33"
                  right={<TextInput.Affix text="min" />}
                />
                {errors.avgProcessingTime ? (
                  <Text style={styles.errorText}>{errors.avgProcessingTime}</Text>
                ) : null}
              </View>
            </View>

            {/* Buffer Duration */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Buffer Duration <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                mode="outlined"
                value={bufferDuration}
                onChangeText={(val) => {
                  setBufferDuration(val.replace(/[^0-9.]/g, ''));
                  if (errors.bufferDuration) setErrors((prev) => ({ ...prev, bufferDuration: '' }));
                }}
                keyboardType="numeric"
                placeholder="20"
                outlineColor={errors.bufferDuration ? theme.colors.error : '#cfd8e3'}
                activeOutlineColor={errors.bufferDuration ? theme.colors.error : theme.colors.primary}
                style={styles.textInput}
                textColor="#0e1d33"
                right={<TextInput.Affix text="min" />}
              />
              {errors.bufferDuration ? <Text style={styles.errorText}>{errors.bufferDuration}</Text> : null}
            </View>

            {/* Queue Availability Section */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Queue Availability <Text style={styles.required}>*</Text>
              </Text>

              {/* Toggle: Same as workflow vs Custom hours */}
              <View style={styles.availabilityRow}>
                <TouchableOpacity
                  style={[
                    styles.availabilityOption,
                    availabilityMode === 'SAME_AS_WORKFLOW' && styles.availabilityOptionActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAvailabilityMode('SAME_AS_WORKFLOW');
                    if (workflowSchedule) {
                      setOpeningTime(workflowSchedule.startTime || '09:00');
                      setClosingTime(workflowSchedule.endTime || '17:00');
                    }
                    setErrors((prev) => ({ ...prev, timeWindow: '', openingTime: '', closingTime: '' }));
                  }}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      availabilityMode === 'SAME_AS_WORKFLOW' && styles.radioCircleActive,
                    ]}
                  >
                    {availabilityMode === 'SAME_AS_WORKFLOW' && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.availabilityOptionText,
                      availabilityMode === 'SAME_AS_WORKFLOW' && styles.availabilityOptionTextActive,
                    ]}
                  >
                    Same as workflow
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.availabilityOption,
                    availabilityMode === 'CUSTOM' && styles.availabilityOptionActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAvailabilityMode('CUSTOM');
                  }}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      availabilityMode === 'CUSTOM' && styles.radioCircleActive,
                    ]}
                  >
                    {availabilityMode === 'CUSTOM' && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.availabilityOptionText,
                      availabilityMode === 'CUSTOM' && styles.availabilityOptionTextActive,
                    ]}
                  >
                    Custom hours
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Inherited Summary Card */}
              {availabilityMode === 'SAME_AS_WORKFLOW' && workflowSchedule && (
                <View style={styles.inheritedCard}>
                  <View style={styles.inheritedHeader}>
                    <MaterialIcons name="auto-awesome" size={15} color="#004d99" />
                    <Text style={styles.inheritedTitle}>Inherited from workflow</Text>
                  </View>
                  <View style={styles.inheritedContent}>
                    <Text style={styles.inheritedLine}>
                      {workflowSchedule.type === 'ONE_TIME'
                        ? formatDisplayDate(workflowSchedule.startDate)
                        : formatWeekdaySummary(workflowSchedule.repeatDays)}
                    </Text>
                    <Text style={styles.inheritedLine}>
                      {formatTo12Hr(workflowSchedule.startTime)}–{formatTo12Hr(workflowSchedule.endTime)}
                    </Text>
                    {scheduleSummary && (
                      <Text style={styles.inheritedLine}>
                        {scheduleSummary.calculatedOccurrences} scheduled{' '}
                        {scheduleSummary.calculatedOccurrences === 1 ? 'session' : 'sessions'}
                      </Text>
                    )}
                    <Text style={styles.inheritedLine}>
                      {workflowSchedule.timezone || 'Asia/Calcutta'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Custom Hours Pickers */}
              {availabilityMode === 'CUSTOM' && (
                <View style={{ marginTop: 10 }}>
                  <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.subLabel}>
                        Opening Time <Text style={styles.required}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={[styles.timeBtn, errors.openingTime ? styles.timeBtnError : null]}
                        onPress={() => {
                          setActiveTimeTarget('open');
                          setTimePickerVisible(true);
                        }}
                      >
                        <MaterialIcons name="schedule" size={17} color="#004d99" />
                        <Text style={styles.timeBtnText}>{formatTo12Hr(openingTime)}</Text>
                      </TouchableOpacity>
                      {errors.openingTime ? <Text style={styles.errorText}>{errors.openingTime}</Text> : null}
                    </View>

                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.subLabel}>
                        Closing Time <Text style={styles.required}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={[styles.timeBtn, errors.closingTime ? styles.timeBtnError : null]}
                        onPress={() => {
                          setActiveTimeTarget('close');
                          setTimePickerVisible(true);
                        }}
                      >
                        <MaterialIcons name="lock-clock" size={17} color="#004d99" />
                        <Text style={styles.timeBtnText}>{formatTo12Hr(closingTime)}</Text>
                      </TouchableOpacity>
                      {errors.closingTime ? <Text style={styles.errorText}>{errors.closingTime}</Text> : null}
                    </View>
                  </View>

                  {/* Inline Error for Out-of-Window Queue Timing */}
                  {errors.timeWindow ? (
                    <View style={styles.timeWindowErrorBox}>
                      <MaterialIcons name="error-outline" size={16} color="#c5221f" />
                      <Text style={styles.timeWindowErrorText}>{errors.timeWindow}</Text>
                    </View>
                  ) : (
                    <Text style={styles.windowHelperText}>
                      Custom queue hours must remain within the workflow operating window (
                      {workflowSchedule
                        ? `${formatTo12Hr(workflowSchedule.startTime)}–${formatTo12Hr(workflowSchedule.endTime)}`
                        : '09:00 AM–05:00 PM'}
                      ).
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
              <MaterialIcons name="add" size={18} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.createButtonText}>Create Queue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Picker Modal */}
        <TimePickerModal
          visible={timePickerVisible}
          onDismiss={() => setTimePickerVisible(false)}
          onConfirm={handleTimeConfirm}
          hours={
            activeTimeTarget === 'open'
              ? parseInt(openingTime.split(':')[0], 10) || 9
              : parseInt(closingTime.split(':')[0], 10) || 17
          }
          minutes={
            activeTimeTarget === 'open'
              ? parseInt(openingTime.split(':')[1], 10) || 0
              : parseInt(closingTime.split(':')[1], 10) || 0
          }
          label={activeTimeTarget === 'open' ? 'Select Opening Time' : 'Select Closing Time'}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f5',
  },
  headerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e6f0fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0e1d33',
  },
  closeBtn: {
    padding: 4,
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d3848',
    marginBottom: 5,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 4,
  },
  required: {
    color: '#d32f2f',
  },
  codeHint: {
    fontSize: 11,
    color: '#004d99',
    backgroundColor: '#e6f0fc',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  textInput: {
    backgroundColor: '#ffffff',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#cfd8e3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  timeBtnError: {
    borderColor: '#d32f2f',
  },
  timeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0e1d33',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 2,
  },
  availabilityRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  availabilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e7ef',
    backgroundColor: '#f8fafc',
  },
  availabilityOptionActive: {
    borderColor: '#004d99',
    backgroundColor: '#eef6ff',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#8a99ad',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#004d99',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#004d99',
  },
  availabilityOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4a5568',
  },
  availabilityOptionTextActive: {
    color: '#004d99',
    fontWeight: '700',
  },
  inheritedCard: {
    marginTop: 10,
    backgroundColor: '#f0f6ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#cce3ff',
  },
  inheritedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  inheritedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004d99',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inheritedContent: {
    gap: 2,
  },
  inheritedLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0e1d33',
  },
  timeWindowErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fde8e8',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f8b4b4',
    marginTop: 8,
  },
  timeWindowErrorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#c5221f',
  },
  windowHelperText: {
    fontSize: 11,
    color: '#5a697c',
    marginTop: 4,
  },
  sheetFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#edf1f5',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cfd8e3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424c5a',
  },
  createButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#004d99',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#004d99',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
