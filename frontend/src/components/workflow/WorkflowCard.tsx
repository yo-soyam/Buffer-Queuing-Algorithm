import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Workflow } from '../../types/workflow';
import { theme } from '../../theme/theme';
import WorkflowStatusBadge from './WorkflowStatusBadge';
import { formatDisplayDate, formatTo12Hr } from './WorkflowScheduleCard';

interface Props {
  workflow: Workflow;
  onDuplicate: (id: string) => void;
  onTogglePause: (id: string, currentStatus: Workflow['status']) => void;
  onDelete: (id: string) => void;
}

export default function WorkflowCard({ workflow, onDuplicate, onTogglePause, onDelete }: Props) {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (workflow.status === 'DRAFT') {
      router.push(`/workflows/create?id=${workflow.id}` as any);
    } else {
      router.push(`/workflows/${workflow.id}` as any);
    }
  };

  const handleEditPress = () => {
    setMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/workflows/create?id=${workflow.id}` as any);
  };

  const handleDuplicatePress = () => {
    setMenuVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDuplicate(workflow.id);
  };

  const handlePauseResumePress = () => {
    setMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTogglePause(workflow.id, workflow.status);
  };

  const handleDeletePress = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Workflow',
      `Are you sure you want to delete "${workflow.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete(workflow.id);
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={handleCardPress}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {workflow.name}
          </Text>
          <View style={styles.badgeWrap}>
            <WorkflowStatusBadge status={workflow.status} />
          </View>
        </View>

        {/* Overflow Menu Trigger */}
        <TouchableOpacity
          style={styles.menuButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMenuVisible(true);
          }}
        >
          <MaterialIcons name="more-vert" size={22} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Description */}
      {workflow.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {workflow.description}
        </Text>
      ) : null}

      {/* Schedule Info */}
      {workflow.schedule ? (
        <View style={styles.scheduleRow}>
          <MaterialIcons name="schedule" size={13} color="#004d99" />
          <Text style={styles.scheduleText} numberOfLines={1}>
            {workflow.schedule.type === 'ONE_TIME'
              ? `${formatDisplayDate(workflow.schedule.startDate)} • ${formatTo12Hr(workflow.schedule.startTime)} - ${formatTo12Hr(workflow.schedule.endTime)}`
              : `${(workflow.schedule.repeatDays || []).map((d) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d - 1]).join(', ')} • ${formatTo12Hr(workflow.schedule.startTime)} - ${formatTo12Hr(workflow.schedule.endTime)}`}
          </Text>
        </View>
      ) : null}

      {/* Horizontal Stages Preview */}
      <View style={styles.stagesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stagesScroll}
        >
          {workflow.steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <View style={styles.stagePill}>
                <Text style={styles.stageNumber}>{index + 1}</Text>
                <Text style={styles.stageName} numberOfLines={1}>
                  {step.name}
                </Text>
              </View>
              {index < workflow.steps.length - 1 && (
                <MaterialIcons
                  name="arrow-forward"
                  size={14}
                  color={theme.colors.primary}
                  style={styles.stageArrow}
                />
              )}
            </React.Fragment>
          ))}
        </ScrollView>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <MaterialIcons name="people-alt" size={15} color={theme.colors.primary} />
          <Text style={styles.metricText}>
            <Text style={styles.metricBold}>{workflow.enrolledCount}</Text> enrolled
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <MaterialIcons name="check-circle" size={15} color="#1b873f" />
          <Text style={styles.metricText}>
            <Text style={styles.metricBold}>{workflow.completedCount}</Text> completed
          </Text>
        </View>

        {workflow.inProgressCount > 0 && (
          <>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <MaterialIcons name="timelapse" size={15} color="#0062cc" />
              <Text style={styles.metricText}>
                <Text style={styles.metricBold}>{workflow.inProgressCount}</Text> in progress
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Overflow Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuSheet}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle} numberOfLines={1}>{workflow.name}</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <MaterialIcons name="close" size={20} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={handleEditPress}>
              <MaterialIcons name="edit" size={20} color={theme.colors.primary} />
              <Text style={styles.menuItemText}>Edit Workflow</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleDuplicatePress}>
              <MaterialIcons name="content-copy" size={20} color={theme.colors.onSurface} />
              <Text style={styles.menuItemText}>Duplicate Workflow</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handlePauseResumePress}>
              <MaterialIcons
                name={workflow.status === 'PAUSED' ? 'play-arrow' : 'pause'}
                size={20}
                color={workflow.status === 'PAUSED' ? '#1b873f' : '#b26a00'}
              />
              <Text style={styles.menuItemText}>
                {workflow.status === 'PAUSED' ? 'Resume Workflow' : 'Pause Workflow'}
              </Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleDeletePress}>
              <MaterialIcons name="delete-outline" size={20} color={theme.colors.error} />
              <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Delete Workflow</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e7ee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0e1d33',
    lineHeight: 22,
    marginBottom: 6,
  },
  badgeWrap: {
    alignSelf: 'flex-start',
  },
  menuButton: {
    padding: 4,
  },
  description: {
    fontSize: 13,
    color: '#495260',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  stagesSection: {
    backgroundColor: '#f5f8fc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e7ecf2',
  },
  stagesScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d6e0ea',
  },
  stageNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004d99',
    marginRight: 5,
    backgroundColor: '#e3effc',
    width: 17,
    height: 17,
    borderRadius: 9,
    textAlign: 'center',
    lineHeight: 17,
  },
  stageName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a2433',
    maxWidth: 140,
  },
  stageArrow: {
    marginHorizontal: 6,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f0f5fc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  scheduleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#004d99',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f3f7',
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricText: {
    fontSize: 12,
    color: '#556070',
  },
  metricBold: {
    fontWeight: '700',
    color: '#121d2d',
  },
  metricDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#c0c8d4',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuSheet: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f5',
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
    flex: 1,
    marginRight: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e242d',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#edf1f5',
    marginVertical: 4,
  },
});
