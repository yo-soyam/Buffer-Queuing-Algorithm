import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WorkflowStep } from '../../types/workflow';
import { theme } from '../../theme/theme';

interface Props {
  step: WorkflowStep;
  index: number;
  totalSteps: number;
  onEdit: (step: WorkflowStep, index: number) => void;
  onDelete: (stepId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export default function WorkflowStepCard({
  step,
  index,
  totalSteps,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  const isFirst = index === 0;
  const isLast = index === totalSteps - 1;

  const handleDelete = () => {
    if (totalSteps <= 1) {
      Alert.alert('Cannot Delete Step', 'A workflow must have at least one step.');
      return;
    }

    Alert.alert(
      'Delete Step',
      `Are you sure you want to remove Step ${index + 1}: "${step.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete(step.id);
          },
        },
      ]
    );
  };


  return (
    <View style={styles.card}>
      {/* Top Header: Step number, drag handle, action buttons */}
      <View style={styles.cardHeader}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step {index + 1}</Text>
        </View>

        {/* Step Controls: Move Up, Move Down, Edit, Delete */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, isFirst && styles.actionBtnDisabled]}
            disabled={isFirst}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onMoveUp(index);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <MaterialIcons
              name="keyboard-arrow-up"
              size={20}
              color={isFirst ? '#c4cdd8' : '#004d99'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, isLast && styles.actionBtnDisabled]}
            disabled={isLast}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onMoveDown(index);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <MaterialIcons
              name="keyboard-arrow-down"
              size={20}
              color={isLast ? '#c4cdd8' : '#004d99'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onEdit(step, index);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <MaterialIcons name="edit" size={17} color="#455163" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <MaterialIcons name="delete-outline" size={17} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Step Name */}
      <Text style={styles.stepTitle} numberOfLines={2}>
        {step.name}
      </Text>

      {/* Connected Queue */}
      <View style={styles.queueContainer}>
        <View style={styles.queueIconWrap}>
          <MaterialIcons name="confirmation-number" size={16} color="#004d99" />
        </View>
        <Text style={styles.queueName} numberOfLines={1}>
          {step.queueName}
        </Text>
      </View>

      {/* Metadata Tags */}
      <View style={styles.tagsRow}>
        <View
          style={[
            styles.tag,
            isLast ? styles.finalStepTag : styles.autoTransferTag,
          ]}
        >
          <MaterialIcons
            name={isLast ? 'check-circle' : 'swap-vert'}
            size={13}
            color={isLast ? '#1b873f' : '#005281'}
          />
          <Text
            style={[
              styles.tagText,
              { color: isLast ? '#1b873f' : '#005281', fontWeight: '600' },
            ]}
          >
            {isLast ? 'Final Step (Completes workflow)' : 'Auto-transfers on dequeue'}
          </Text>
        </View>

        {step.condition ? (
          <View style={[styles.tag, styles.conditionTag]}>
            <MaterialIcons name="call-split" size={13} color="#005281" />
            <Text style={[styles.tagText, { color: '#005281' }]} numberOfLines={1}>
              {step.condition}
            </Text>
          </View>
        ) : null}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 8,
  },
  stepBadge: {
    backgroundColor: '#e6f0fc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cce1fa',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004d99',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    backgroundColor: '#f6f8fb',
    opacity: 0.5,
  },
  deleteBtn: {
    backgroundColor: '#ffefef',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0e1d33',
    lineHeight: 22,
    marginBottom: 10,
  },
  queueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e8edf4',
    marginBottom: 10,
    gap: 10,
  },
  queueIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e3effc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#657488',
    letterSpacing: 0.5,
  },
  queueName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#131e2d',
    marginTop: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f4f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#424e60',
  },
  autoTransferTag: {
    backgroundColor: '#edf5fd',
    borderColor: '#cde0f5',
    borderWidth: 1,
  },
  finalStepTag: {
    backgroundColor: '#eaf6ed',
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  conditionTag: {
    backgroundColor: '#e7f2fa',
  },
});
