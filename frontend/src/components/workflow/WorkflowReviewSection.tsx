import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WorkflowStep, WorkflowSchedule, AvailableQueue } from '../../types/workflow';
import {
  formatDisplayDate,
  formatTo12Hr,
  calculateScheduleSummary,
} from './WorkflowScheduleCard';
import { theme } from '../../theme/theme';

interface Props {
  workflowName: string;
  description?: string;
  schedule: WorkflowSchedule;
  steps: WorkflowStep[];
  availableQueues: AvailableQueue[];
  isValid: boolean;
  validationErrors: string[];
  onEditDetails: () => void;
  onEditSchedule: () => void;
  onEditSteps: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export default function WorkflowReviewSection({
  workflowName,
  description,
  schedule,
  steps,
  availableQueues,
  isValid,
  validationErrors,
  onEditDetails,
  onEditSchedule,
  onEditSteps,
  onSaveDraft,
  onPublish,
}: Props) {
  const summary = calculateScheduleSummary(schedule);

  // Check queue schedule interaction conflicts
  const queueTimingWarnings: string[] = [];
  steps.forEach((step) => {
    const queue = availableQueues.find((q) => q.id === step.queueId);
    if (!queue) return;

    if (queue.closingTime && schedule.endTime && queue.closingTime < schedule.endTime) {
      queueTimingWarnings.push(
        `${queue.name} closes at ${formatTo12Hr(queue.closingTime)}, earlier than the workflow closing time (${formatTo12Hr(schedule.endTime)}).`
      );
    } else if (queue.openingTime && schedule.startTime && queue.openingTime > schedule.startTime) {
      queueTimingWarnings.push(
        `${queue.name} opens at ${formatTo12Hr(queue.openingTime)}, later than the workflow start time (${formatTo12Hr(schedule.startTime)}).`
      );
    }
  });

  const handlePublishPress = () => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Publish Workflow',
      `Publish "${workflowName.trim()}" with ${steps.length} sequential steps? Patrons will immediately begin following this workflow.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          style: 'default',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onPublish();
          },
        },
      ]
    );
  };

  const handleSaveDraftPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSaveDraft();
  };

  return (
    <View style={styles.container}>
      {/* 1. Basic Information Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <MaterialIcons name="info-outline" size={18} color="#004d99" />
            <Text style={styles.cardTitle}>Basic Information</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onEditDetails}
          >
            <MaterialIcons name="edit" size={14} color="#004d99" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContent}>
          <Text style={styles.wfName}>{workflowName.trim() || 'Untitled Workflow'}</Text>
          {description?.trim() ? (
            <Text style={styles.wfDesc}>{description.trim()}</Text>
          ) : (
            <Text style={styles.wfDescMuted}>No description provided</Text>
          )}
        </View>
      </View>

      {/* 2. Schedule Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <MaterialIcons name="schedule" size={18} color="#004d99" />
            <Text style={styles.cardTitle}>Schedule</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onEditSchedule}
          >
            <MaterialIcons name="edit" size={14} color="#004d99" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Schedule Type</Text>
            <Text style={styles.metaValue}>
              {schedule.type === 'ONE_TIME' ? 'One-time' : 'Recurring'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Starting Date</Text>
            <Text style={styles.metaValue}>
              {formatDisplayDate(schedule.startDate) || 'Not set'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Operating Hours</Text>
            <Text style={styles.metaValue}>
              {formatTo12Hr(schedule.startTime)} - {formatTo12Hr(schedule.endTime)}
            </Text>
          </View>

          {schedule.type === 'RECURRING' && (
            <>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Selected Weekdays</Text>
                <Text style={styles.metaValue}>
                  {(schedule.repeatDays || [])
                    .sort((a, b) => a - b)
                    .map((d) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d - 1])
                    .join(', ') || 'None'}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Ending Date</Text>
                <Text style={styles.metaValue}>
                  {formatDisplayDate(schedule.recurrenceEndDate || schedule.startDate)}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Scheduled Sessions</Text>
                <Text style={styles.metaValue}>
                  {summary.calculatedOccurrences} scheduled {summary.calculatedOccurrences === 1 ? 'session' : 'sessions'}
                </Text>
              </View>
            </>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Timezone</Text>
            <Text style={styles.metaValue}>{schedule.timezone || 'Asia/Calcutta'}</Text>
          </View>
        </View>

        {/* Schedule Summary Banner */}
        <View style={styles.summaryBanner}>
          <MaterialIcons name="auto-awesome" size={15} color="#004d99" style={{ marginTop: 1 }} />
          <Text style={styles.summaryBannerText}>{summary.summaryText}</Text>
        </View>
      </View>

      {/* 3. Workflow Journey */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <MaterialIcons name="linear-scale" size={18} color="#004d99" />
            <Text style={styles.cardTitle}>
              Workflow Journey ({steps.length} {steps.length === 1 ? 'Step' : 'Steps'})
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onEditSteps}
          >
            <MaterialIcons name="edit" size={14} color="#004d99" />
            <Text style={styles.editBtnText}>Edit Steps</Text>
          </TouchableOpacity>
        </View>

        {steps.length === 0 ? (
          <View style={styles.noStepsBox}>
            <MaterialIcons name="queue" size={24} color="#a0aec0" />
            <Text style={styles.noStepsText}>No steps configured yet</Text>
          </View>
        ) : (
          <View style={styles.journeyList}>
            {steps.map((step, idx) => {
              const queue = availableQueues.find((q) => q.id === step.queueId);
              const isLast = idx === steps.length - 1;
              const isInherited =
                !queue?.openingTime ||
                (queue.openingTime === schedule.startTime &&
                  queue.closingTime === schedule.endTime);

              return (
                <View key={step.id} style={styles.journeyItemWrap}>
                  <View style={styles.journeyItemCard}>
                    <View style={styles.stepBadgeColumn}>
                      <View style={styles.stepNumCircle}>
                        <Text style={styles.stepNumText}>{idx + 1}</Text>
                      </View>
                      {!isLast && <View style={styles.connectorLine} />}
                    </View>

                    <View style={styles.stepDetailsColumn}>
                      <Text style={styles.stepTitle}>{step.name}</Text>
                      <Text style={styles.stepQueueSub}>
                        Connected Queue: <Text style={styles.boldQueue}>{step.queueName}</Text>
                        {queue?.code ? ` (${queue.code})` : ''}
                      </Text>

                      {/* Queue Schedule Chip */}
                      <View style={styles.queueMetaRow}>
                        <View
                          style={[
                            styles.timingChip,
                            isInherited ? styles.timingChipInherited : styles.timingChipCustom,
                          ]}
                        >
                          <MaterialIcons
                            name={isInherited ? 'sync' : 'schedule'}
                            size={12}
                            color={isInherited ? '#004d99' : '#b26a00'}
                          />
                          <Text
                            style={[
                              styles.timingChipText,
                              isInherited
                                ? styles.timingChipTextInherited
                                : styles.timingChipTextCustom,
                            ]}
                          >
                            {isInherited
                              ? 'Inherited schedule'
                              : `Custom: ${formatTo12Hr(queue?.openingTime || '09:00')} - ${formatTo12Hr(queue?.closingTime || '17:00')}`}
                          </Text>
                        </View>
                      </View>

                      {/* Queue Parameters */}
                      {queue && (
                        <View style={styles.specsRow}>
                          <Text style={styles.specItem}>
                            Capacity: <Text style={styles.specValue}>{queue.capacity || 60} ppl</Text>
                          </Text>
                          <Text style={styles.specDot}>•</Text>
                          <Text style={styles.specItem}>
                            Avg: <Text style={styles.specValue}>{queue.avgProcessingTime || 5} min</Text>
                          </Text>
                          <Text style={styles.specDot}>•</Text>
                          <Text style={styles.specItem}>
                            Buffer: <Text style={styles.specValue}>{queue.bufferDuration || 20} min</Text>
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {!isLast && (
                    <View style={styles.arrowRow}>
                      <MaterialIcons name="arrow-downward" size={16} color="#004d99" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* 4. Queue Timing Warnings if any */}
      {queueTimingWarnings.length > 0 && (
        <View style={styles.timingWarningCard}>
          <View style={styles.warningHeader}>
            <MaterialIcons name="warning" size={17} color="#b26a00" />
            <Text style={styles.warningTitle}>Queue Timing Advisory</Text>
          </View>
          {queueTimingWarnings.map((warn, i) => (
            <Text key={i} style={styles.warningLine}>• {warn}</Text>
          ))}
        </View>
      )}

      {/* 5. Validation Summary Banner */}
      <View style={styles.validationSection}>
        {isValid ? (
          <View style={styles.readyBanner}>
            <MaterialIcons name="check-circle" size={20} color="#1b873f" />
            <Text style={styles.readyBannerText}>✓ Workflow is ready to publish</Text>
          </View>
        ) : (
          <View style={styles.errorBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <MaterialIcons name="error-outline" size={18} color="#c5221f" />
              <Text style={styles.errorBoxTitle}>Please resolve these issues before publishing:</Text>
            </View>
            {validationErrors.map((err, idx) => (
              <Text key={idx} style={styles.errorBoxItem}>• {err}</Text>
            ))}
          </View>
        )}
      </View>

      {/* 6. Bottom Actions (Google Material 3) */}
      <View style={styles.bottomActionsRow}>
        <TouchableOpacity
          style={styles.draftButton}
          activeOpacity={0.8}
          onPress={handleSaveDraftPress}
        >
          <MaterialIcons name="save" size={18} color="#004d99" style={{ marginRight: 6 }} />
          <Text style={styles.draftButtonText}>Save as Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.publishButton, !isValid && styles.publishButtonDisabled]}
          activeOpacity={isValid ? 0.85 : 1}
          disabled={!isValid}
          onPress={handlePublishPress}
        >
          <MaterialIcons name="cloud-upload" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.publishButtonText}>Publish Workflow</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e7ef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0e1d33',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e6f0fc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004d99',
  },
  infoContent: {
    gap: 4,
  },
  wfName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0e1d33',
  },
  wfDesc: {
    fontSize: 13,
    color: '#4a5568',
    lineHeight: 18,
  },
  wfDescMuted: {
    fontSize: 13,
    color: '#8a99ad',
    fontStyle: 'italic',
  },
  metaGrid: {
    gap: 8,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f6f9',
  },
  metaLabel: {
    fontSize: 13,
    color: '#65758b',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0e1d33',
    maxWidth: '55%',
    textAlign: 'right',
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#eef6ff',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#d0e4ff',
  },
  summaryBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#004d99',
    lineHeight: 17,
    fontWeight: '500',
  },
  journeyList: {
    gap: 4,
  },
  journeyItemWrap: {
    position: 'relative',
  },
  journeyItemCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5ecf3',
    gap: 12,
  },
  stepBadgeColumn: {
    alignItems: 'center',
  },
  stepNumCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#004d99',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#cbd8e6',
    marginTop: 4,
  },
  stepDetailsColumn: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0e1d33',
  },
  stepQueueSub: {
    fontSize: 12,
    color: '#556475',
  },
  boldQueue: {
    fontWeight: '700',
    color: '#1a2433',
  },
  queueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timingChipInherited: {
    backgroundColor: '#e6f0fc',
  },
  timingChipCustom: {
    backgroundColor: '#fff4e5',
  },
  timingChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timingChipTextInherited: {
    color: '#004d99',
  },
  timingChipTextCustom: {
    color: '#b26a00',
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  specItem: {
    fontSize: 11,
    color: '#65758b',
  },
  specValue: {
    fontWeight: '600',
    color: '#1e293b',
  },
  specDot: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  arrowRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  noStepsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  noStepsText: {
    fontSize: 13,
    color: '#8a99ad',
  },
  timingWarningCard: {
    backgroundColor: '#fffbf0',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: 4,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b26a00',
  },
  warningLine: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
  },
  validationSection: {
    marginTop: 2,
  },
  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#edfbf1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  readyBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b873f',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 4,
  },
  errorBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b91c1c',
  },
  errorBoxItem: {
    fontSize: 12,
    color: '#dc2626',
    lineHeight: 16,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  draftButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#004d99',
    paddingVertical: 14,
    borderRadius: 14,
  },
  draftButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#004d99',
  },
  publishButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#004d99',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#004d99',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  publishButtonDisabled: {
    backgroundColor: '#a3bccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  publishButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
