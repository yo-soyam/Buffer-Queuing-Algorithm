import React, { useState, useEffect } from 'react';
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
import { WorkflowStep, AvailableQueue, WorkflowSchedule } from '../../types/workflow';
import { AVAILABLE_MOCK_QUEUES, addAvailableQueue } from '../../data/mockWorkflows';
import { theme } from '../../theme/theme';
import QueueSelector from './QueueSelector';
import CreateQueueSheet from './CreateQueueSheet';

interface Props {
  visible: boolean;
  step: WorkflowStep | null;
  stepIndex: number;
  totalSteps: number;
  existingSteps: WorkflowStep[];
  workflowSchedule?: WorkflowSchedule;
  onSave: (stepData: Omit<WorkflowStep, 'id' | 'order'>) => void;
  onCancel: () => void;
}

export default function ConfigureStepSheet({
  visible,
  step,
  stepIndex,
  totalSteps,
  existingSteps,
  workflowSchedule,
  onSave,
  onCancel,
}: Props) {
  const [name, setName] = useState('');
  const [selectedQueueId, setSelectedQueueId] = useState('');
  const [condition, setCondition] = useState('');

  // Queue state
  const [availableQueues, setAvailableQueues] = useState<AvailableQueue[]>([...AVAILABLE_MOCK_QUEUES]);
  const [createQueueVisible, setCreateQueueVisible] = useState(false);
  const [initialNewQueueName, setInitialNewQueueName] = useState('');

  // Snackbar feedback
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // Inline validation errors
  const [errors, setErrors] = useState<{ name?: string; queue?: string }>({});

  useEffect(() => {
    setAvailableQueues([...AVAILABLE_MOCK_QUEUES]);
    if (step) {
      setName(step.name);
      setSelectedQueueId(step.queueId);
      setCondition(step.condition || '');
    } else {
      setName('');
      setSelectedQueueId('');
      setCondition('');
    }
    setErrors({});
    setSnackbarMessage(null);
  }, [step, visible]);

  // Check queues already assigned to OTHER steps in this workflow
  const isQueueUsedByOtherStep = (queueId: string) => {
    return existingSteps.some((s) => s.queueId === queueId && (!step || s.id !== step.id));
  };

  const handleSelectQueue = (queue: AvailableQueue) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedQueueId(queue.id);
    if (!name.trim()) {
      setName(queue.name.replace(' Queue', ''));
    }
    setErrors((prev) => ({ ...prev, queue: undefined }));
  };

  const handleOpenCreateQueue = (initialName?: string) => {
    setInitialNewQueueName(initialName || '');
    setCreateQueueVisible(true);
  };

  const handleQueueCreated = (newQueue: AvailableQueue) => {
    // 1. Add to store
    addAvailableQueue(newQueue);
    // 2. Update local queues
    setAvailableQueues([...AVAILABLE_MOCK_QUEUES]);
    // 3. Automatically select the newly created queue
    setSelectedQueueId(newQueue.id);
    // 4. Preserve existing step name if already entered; else default from new queue
    if (!name.trim()) {
      setName(newQueue.name.replace(' Queue', ''));
    }
    // Clear queue validation error
    setErrors((prev) => ({ ...prev, queue: undefined }));
    // 5. Close Create Queue sheet
    setCreateQueueVisible(false);
    // 6. Show success snackbar
    setSnackbarMessage('Queue created and selected');
    setTimeout(() => {
      setSnackbarMessage(null);
    }, 3500);
  };

  const handleSave = () => {
    const newErrors: { name?: string; queue?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Step name is required.';
    }

    if (!selectedQueueId) {
      newErrors.queue = 'Please select a queue.';
    }

    if (Object.keys(newErrors).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors(newErrors);
      return;
    }

    const selectedQueue = availableQueues.find((q) => q.id === selectedQueueId);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      name: name.trim(),
      queueId: selectedQueueId,
      queueName: selectedQueue?.name || 'Selected Queue',
      completionRule: 'MANUAL_STAFF',
      autoEnrollNext: true,
      nextStepId: null,
      condition: condition.trim() || undefined,
    });
  };

  const isFinalStep = stepIndex >= 0 && stepIndex === totalSteps - 1;
  const nextStep = !isFinalStep && stepIndex >= 0 && stepIndex < existingSteps.length - 1 ? existingSteps[stepIndex + 1] : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {step ? `Edit Step ${stepIndex + 1}` : `Configure Step ${stepIndex + 1}`}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
              <MaterialIcons name="close" size={22} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {/* Step Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Step Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                mode="outlined"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="e.g. Fee Payment, Document Check"
                outlineColor={errors.name ? theme.colors.error : '#cfd8e3'}
                activeOutlineColor={errors.name ? theme.colors.error : theme.colors.primary}
                style={styles.textInput}
                textColor="#0e1d33"
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Queue Selector with Search & Inline Creation */}
            <QueueSelector
              queues={availableQueues}
              selectedQueueId={selectedQueueId}
              isQueueAssignedToOtherStep={isQueueUsedByOtherStep}
              onSelectQueue={handleSelectQueue}
              onOpenCreateQueue={handleOpenCreateQueue}
              error={errors.queue}
            />

            {/* Automatic Dequeue Transfer Info Card */}
            <View style={[styles.transitionCard, isFinalStep && styles.transitionCardFinal]}>
              <View style={[styles.transitionIconWrap, isFinalStep && styles.transitionIconWrapFinal]}>
                <MaterialIcons
                  name={isFinalStep ? 'check-circle' : 'swap-vert'}
                  size={20}
                  color={isFinalStep ? '#1b873f' : theme.colors.primary}
                />
              </View>
              <View style={styles.transitionContent}>
                <Text style={[styles.transitionHeading, isFinalStep && styles.transitionHeadingFinal]}>
                  {isFinalStep ? 'Final Workflow Step' : 'Automatic Transfer on Dequeue'}
                </Text>
                <Text style={styles.transitionDetail}>
                  {isFinalStep
                    ? 'When a person is dequeued from this queue, their workflow is automatically completed.'
                    : nextStep
                    ? `When a person is dequeued from this queue, they are automatically transferred into "${nextStep.queueName}".`
                    : 'When a person is dequeued from this queue, they are automatically transferred into the next sequential queue.'}
                </Text>
              </View>
            </View>

            {/* Optional Routing Condition */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Condition (Optional)</Text>
              <TextInput
                mode="outlined"
                value={condition}
                onChangeText={setCondition}
                placeholder="e.g. If documents are verified"
                outlineColor="#cfd8e3"
                activeOutlineColor={theme.colors.primary}
                style={styles.textInput}
                textColor="#0e1d33"
              />
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <MaterialIcons name="check" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.saveButtonText}>Save Step</Text>
            </TouchableOpacity>
          </View>

          {/* Success Snackbar */}
          {snackbarMessage && (
            <View style={styles.toastSnackbar}>
              <MaterialIcons name="check-circle" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.toastSnackbarText}>{snackbarMessage}</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Create New Queue Modal Sheet */}
      <CreateQueueSheet
        visible={createQueueVisible}
        initialQueueName={initialNewQueueName}
        workflowSchedule={workflowSchedule}
        onCancel={() => setCreateQueueVisible(false)}
        onCreate={handleQueueCreated}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f5',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0e1d33',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f2f4f7',
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a2433',
    marginBottom: 6,
  },
  required: {
    color: theme.colors.error,
  },
  textInput: {
    backgroundColor: '#ffffff',
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
    fontWeight: '500',
  },
  toastSnackbar: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b873f',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 9999,
  },
  toastSnackbarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  transitionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f5fc',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#cde0f5',
  },
  transitionCardFinal: {
    backgroundColor: '#f1f8f3',
    borderColor: '#c3e6cb',
  },
  transitionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0edfb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  transitionIconWrapFinal: {
    backgroundColor: '#d8f0e0',
  },
  transitionContent: {
    flex: 1,
  },
  transitionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#004d99',
    marginBottom: 4,
  },
  transitionHeadingFinal: {
    color: '#1b873f',
  },
  transitionDetail: {
    fontSize: 13,
    color: '#3d4b5c',
    lineHeight: 18,
  },
  sheetFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
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
  saveButton: {
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
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
