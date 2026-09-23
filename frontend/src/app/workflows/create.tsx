import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { TextInput, Button, Card, HelperText } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme/theme';
import { WorkflowStep, Workflow, WorkflowSchedule, WorkflowStatus } from '../../types/workflow';
import {
  INITIAL_STEPS,
  getWorkflowById,
  saveWorkflow,
  AVAILABLE_MOCK_QUEUES,
} from '../../data/mockWorkflows';
import WizardProgressHeader, { WizardStage } from '../../components/workflow/WizardProgressHeader';
import WorkflowStepper from '../../components/workflow/WorkflowStepper';
import ConfigureStepSheet from '../../components/workflow/ConfigureStepSheet';
import WorkflowScheduleCard, {
  calculateScheduleSummary,
} from '../../components/workflow/WorkflowScheduleCard';
import WorkflowReviewSection from '../../components/workflow/WorkflowReviewSection';

export default function CreateWorkflowScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();

  // Wizard Stage: 1 = Details & Schedule, 2 = Workflow Steps & Queues, 3 = Review & Publish
  const [wizardStage, setWizardStage] = useState<WizardStage>(1);

  const [workflowId, setWorkflowId] = useState<string>(params.id || `wf_${Date.now()}`);
  const [workflowName, setWorkflowName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Workflow Schedule State (Default: One-time, with fallback recurrenceEndDate for recurring)
  const todayStr = new Date().toISOString().split('T')[0];
  const [schedule, setSchedule] = useState<WorkflowSchedule>({
    type: 'ONE_TIME',
    startDate: todayStr,
    startTime: '09:00',
    endTime: '17:00',
    oneTimeEndDate: todayStr,
    repeatDays: [1, 2, 3, 4, 5],
    recurrenceEndType: 'ON_DATE',
    recurrenceEndDate: todayStr,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Calcutta',
  });

  // Step Configuration Sheet State
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null);

  // Stage 1 inline errors
  const [stage1Errors, setStage1Errors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (params.id) {
      const existing = getWorkflowById(params.id);
      if (existing) {
        setIsEditingExisting(true);
        setWorkflowId(existing.id);
        setWorkflowName(existing.name);
        setDescription(existing.description || '');
        setSteps(existing.steps);
        if (existing.schedule) {
          setSchedule(existing.schedule);
        }
      }
    }
  }, [params.id]);

  // Validation logic
  const scheduleValidationErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!schedule.startDate) {
      errs.startDate = 'Start date is required';
    }
    if (!schedule.startTime) {
      errs.startTime = 'Start time is required';
    }
    if (!schedule.endTime) {
      errs.endTime = 'End time is required';
    }

    if (schedule.type === 'ONE_TIME') {
      const sDate = schedule.startDate;
      const eDate = schedule.oneTimeEndDate || sDate;
      if (!schedule.oneTimeEndDate) {
        errs.oneTimeEndDate = 'End date is required';
      } else if (schedule.oneTimeEndDate < schedule.startDate) {
        errs.oneTimeEndDate = 'End date cannot be earlier than start date';
      } else if (schedule.oneTimeEndDate === schedule.startDate && schedule.startTime && schedule.endTime) {
        if (schedule.startTime >= schedule.endTime) {
          errs.endTime = 'End time must be after start time';
        }
      }
    } else if (schedule.type === 'RECURRING') {
      if (schedule.startTime && schedule.endTime && schedule.startTime >= schedule.endTime) {
        errs.endTime = 'Daily end time must be after start time';
      }
      if (!schedule.repeatDays || schedule.repeatDays.length === 0) {
        errs.repeatDays = 'Select at least one operating day';
      }
      if (!schedule.recurrenceEndDate) {
        errs.recurrenceEndDate = 'End date is required';
      } else if (schedule.recurrenceEndDate < schedule.startDate) {
        errs.recurrenceEndDate = 'End date must be on or after start date';
      }
    }
    return errs;
  }, [schedule]);

  const isStage1Valid = useMemo(() => {
    return workflowName.trim().length > 0 && Object.keys(scheduleValidationErrors).length === 0;
  }, [workflowName, scheduleValidationErrors]);

  const isStage2Valid = useMemo(() => {
    return isStage1Valid && steps.length >= 2 && steps.every((s) => Boolean(s.queueId));
  }, [isStage1Valid, steps]);

  const maxCompletedStage = useMemo(() => {
    if (isStage2Valid) return 2;
    if (isStage1Valid) return 1;
    return 0;
  }, [isStage1Valid, isStage2Valid]);

  const canNavigateToStage = (target: WizardStage): boolean => {
    if (target === 1) return true;
    if (target === 2) return isStage1Valid;
    if (target === 3) return isStage1Valid && isStage2Valid;
    return false;
  };

  // Validation errors list for Stage 3 Review
  const reviewValidationErrors = useMemo(() => {
    const list: string[] = [];
    if (!workflowName.trim()) {
      list.push('Workflow name is required.');
    }
    Object.values(scheduleValidationErrors).forEach((err) => list.push(err));
    if (steps.length < 2) {
      list.push('Add at least two connected workflow steps.');
    }
    steps.forEach((s, idx) => {
      if (!s.queueId) {
        list.push(`Step ${idx + 1} (${s.name}) requires a connected queue.`);
      }
    });
    return list;
  }, [workflowName, scheduleValidationErrors, steps]);

  const isReviewValid = reviewValidationErrors.length === 0;

  // Header Back Button Action
  const handleHeaderBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (wizardStage === 2) {
      setWizardStage(1);
    } else if (wizardStage === 3) {
      setWizardStage(2);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/workflows' as any);
      }
    }
  };

  // Save Draft Action (accessible in header)
  const handleSaveDraft = () => {
    if (!workflowName.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for this workflow before saving a draft.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const draft: Workflow = {
      id: workflowId,
      name: workflowName.trim(),
      description: description.trim() || undefined,
      status: 'DRAFT',
      schedule,
      steps,
      enrolledCount: isEditingExisting ? (getWorkflowById(workflowId)?.enrolledCount || 0) : 0,
      completedCount: isEditingExisting ? (getWorkflowById(workflowId)?.completedCount || 0) : 0,
      inProgressCount: isEditingExisting ? (getWorkflowById(workflowId)?.inProgressCount || 0) : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveWorkflow(draft);
    Alert.alert('Draft Saved', `Workflow "${workflowName}" has been saved as a draft.`, [
      { text: 'OK', onPress: () => router.replace('/workflows' as any) },
    ]);
  };

  // Advance from Stage 1 -> Stage 2
  const handleContinueToSteps = () => {
    const errs: Record<string, string> = {};
    if (!workflowName.trim()) {
      errs.workflowName = 'Workflow name is required.';
    }
    Object.assign(errs, scheduleValidationErrors);

    if (Object.keys(errs).length > 0) {
      setStage1Errors(errs);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Required Information',
        errs.workflowName || Object.values(scheduleValidationErrors)[0] || 'Please complete all required fields before continuing.'
      );
      return;
    }

    setStage1Errors({});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWizardStage(2);
  };

  // Advance from Stage 2 -> Stage 3
  const handleContinueToReview = () => {
    if (steps.length < 2) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Minimum Steps Required',
        'A workflow must contain at least 2 connected steps. Please add more steps.'
      );
      return;
    }

    const unassigned = steps.find((s) => !s.queueId);
    if (unassigned) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Missing Queue',
        `Step "${unassigned.name}" has no connected queue. Please assign or create a queue for it.`
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWizardStage(3);
  };

  // Step operations in Stage 2
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    const temp = newSteps[index - 1];
    newSteps[index - 1] = newSteps[index];
    newSteps[index] = temp;
    setSteps(newSteps.map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    const temp = newSteps[index + 1];
    newSteps[index + 1] = newSteps[index];
    newSteps[index] = temp;
    setSteps(newSteps.map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  const handleEditStep = (step: WorkflowStep, index: number) => {
    setEditingStep(step);
    setEditingIndex(index);
    setInsertAtIndex(null);
    setSheetVisible(true);
  };

  const handleDeleteStep = (stepId: string) => {
    const updated = steps
      .filter((s) => s.id !== stepId)
      .map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(updated);
  };

  const handleInsertStepAt = (index: number) => {
    setEditingStep(null);
    setEditingIndex(index);
    setInsertAtIndex(index);
    setSheetVisible(true);
  };

  const handleAddNextStep = () => {
    setEditingStep(null);
    setEditingIndex(steps.length);
    setInsertAtIndex(steps.length);
    setSheetVisible(true);
  };

  const handleSaveConfiguredStep = (stepData: Omit<WorkflowStep, 'id' | 'order'>) => {
    if (editingStep !== null && editingIndex >= 0 && insertAtIndex === null) {
      const updated = [...steps];
      updated[editingIndex] = {
        ...editingStep,
        ...stepData,
        order: editingIndex + 1,
      };
      setSteps(updated);
    } else {
      const newStep: WorkflowStep = {
        ...stepData,
        id: `step_${Date.now()}`,
        order: (insertAtIndex !== null ? insertAtIndex : steps.length) + 1,
      };

      const targetIndex = insertAtIndex !== null ? insertAtIndex : steps.length;
      const updated = [...steps];
      updated.splice(targetIndex, 0, newStep);
      setSteps(updated.map((s, idx) => ({ ...s, order: idx + 1 })));
    }

    setSheetVisible(false);
    setEditingStep(null);
    setEditingIndex(-1);
    setInsertAtIndex(null);
  };

  // Status computation for simulation in mobile client
  const computeInitialStatus = (): WorkflowStatus => {
    try {
      const now = new Date();
      const curToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const [startH, startM] = (schedule.startTime || '09:00').split(':').map(Number);
      const [endH, endM] = (schedule.endTime || '17:00').split(':').map(Number);
      const schedStartMin = startH * 60 + startM;
      const schedEndMin = endH * 60 + endM;

      if (schedule.type === 'ONE_TIME') {
        const sDate = schedule.startDate;
        const eDate = schedule.oneTimeEndDate || sDate;

        if (curToday < sDate) return 'SCHEDULED';
        if (curToday === sDate && nowMinutes < schedStartMin) return 'SCHEDULED';
        if (curToday > eDate) return 'COMPLETED';
        if (curToday === eDate && nowMinutes > schedEndMin) return 'COMPLETED';
        return 'ACTIVE';
      } else {
        if (curToday < schedule.startDate) return 'SCHEDULED';
        const jsDay = now.getDay();
        const isoDay = jsDay === 0 ? 7 : jsDay;
        const repeatsToday = (schedule.repeatDays || [1, 2, 3, 4, 5]).includes(isoDay);

        const summary = calculateScheduleSummary(schedule);
        if (summary.calculatedEndDate && curToday > summary.calculatedEndDate) {
          return 'COMPLETED';
        }

        if (repeatsToday && nowMinutes >= schedStartMin && nowMinutes <= schedEndMin) {
          return 'ACTIVE';
        }
        return 'SCHEDULED';
      }
    } catch {
      return 'ACTIVE';
    }
  };

  // Publish from Stage 3
  const handleConfirmPublish = () => {
    if (!isReviewValid) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const initialStatus = computeInitialStatus();

    const publishedWorkflow: Workflow = {
      id: workflowId,
      name: workflowName.trim(),
      description: description.trim() || undefined,
      status: initialStatus,
      schedule,
      steps,
      enrolledCount: isEditingExisting ? (getWorkflowById(workflowId)?.enrolledCount || 0) : 0,
      completedCount: isEditingExisting ? (getWorkflowById(workflowId)?.completedCount || 0) : 0,
      inProgressCount: isEditingExisting ? (getWorkflowById(workflowId)?.inProgressCount || 0) : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveWorkflow(publishedWorkflow);
    router.replace('/workflows' as any);
  };

  // Dynamic screen title
  const getHeaderTitle = () => {
    if (wizardStage === 1) return isEditingExisting ? 'Edit Workflow' : 'Create Workflow';
    if (wizardStage === 2) return 'Build Workflow';
    return 'Review Workflow';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Shared Page Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleHeaderBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons
              name={wizardStage === 1 ? 'close' : 'arrow-back'}
              size={24}
              color="#0e1d33"
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
            {wizardStage === 2 && workflowName.trim() ? (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {workflowName.trim()}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Save Draft Action */}
        <TouchableOpacity style={styles.draftBtn} onPress={handleSaveDraft}>
          <MaterialIcons name="save" size={16} color="#004d99" style={{ marginRight: 4 }} />
          <Text style={styles.draftBtnText}>Save draft</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Compact Wizard Stepper Header */}
      <WizardProgressHeader
        currentStage={wizardStage}
        maxCompletedStage={maxCompletedStage}
        onSelectStage={setWizardStage}
        canNavigateToStage={canNavigateToStage}
      />

      {/* 3. Stage Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* STAGE 1: Details & Schedule */}
          {wizardStage === 1 && (
            <View style={styles.stageWrap}>
              {/* Google Material 3 Basic Information Card */}
              <Card style={styles.sectionCard} mode="outlined">
                <Card.Content style={styles.cardContent}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.headerIconWrap}>
                      <MaterialIcons name="info-outline" size={18} color="#004d99" />
                    </View>
                    <Text style={styles.sectionTitle}>Basic Information</Text>
                  </View>

                  <View style={styles.inputWrap}>
                    <TextInput
                      mode="outlined"
                      label="Workflow Name *"
                      value={workflowName}
                      onChangeText={(val) => {
                        setWorkflowName(val);
                        if (stage1Errors.workflowName) {
                          setStage1Errors((prev) => ({ ...prev, workflowName: '' }));
                        }
                      }}
                      placeholder="e.g. Student Onboarding, Patient Check-in"
                      outlineColor={stage1Errors.workflowName ? theme.colors.error : '#cfd8e3'}
                      activeOutlineColor={
                        stage1Errors.workflowName ? theme.colors.error : '#004d99'
                      }
                      style={styles.textInput}
                      textColor="#0e1d33"
                    />
                    {stage1Errors.workflowName ? (
                      <HelperText type="error" visible={Boolean(stage1Errors.workflowName)}>
                        {stage1Errors.workflowName}
                      </HelperText>
                    ) : null}
                  </View>

                  <View style={styles.inputWrap}>
                    <TextInput
                      mode="outlined"
                      label="Description (Optional)"
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Brief summary of what this workflow accomplishes"
                      outlineColor="#cfd8e3"
                      activeOutlineColor="#004d99"
                      multiline
                      numberOfLines={2}
                      style={[styles.textInput, { minHeight: 64 }]}
                      textColor="#0e1d33"
                    />
                  </View>
                </Card.Content>
              </Card>

              {/* Workflow Schedule Card (Google Material 3) */}
              <WorkflowScheduleCard
                schedule={schedule}
                onChange={setSchedule}
                errors={scheduleValidationErrors}
              />

              {/* Google Material 3 Next Step Button directly at the bottom of Stage 1 form */}
              <View style={styles.stageActionsWrap}>
                <Button
                  mode="contained"
                  icon="arrow-right"
                  contentStyle={styles.btnContentReverse}
                  buttonColor="#004d99"
                  textColor="#ffffff"
                  labelStyle={styles.m3BtnLabel}
                  style={styles.m3ActionBtn}
                  onPress={handleContinueToSteps}
                >
                  Continue to Steps
                </Button>
              </View>
            </View>
          )}

          {/* STAGE 2: Workflow Steps & Queues */}
          {wizardStage === 2 && (
            <View style={styles.stageWrap}>
              <Card style={styles.sectionCard} mode="outlined">
                <Card.Content style={styles.cardContent}>
                  <View style={styles.stepsHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={styles.headerIconWrap}>
                        <MaterialIcons name="linear-scale" size={18} color="#004d99" />
                      </View>
                      <Text style={styles.sectionTitle}>Workflow Pipeline</Text>
                    </View>
                    <View style={styles.stepsCountBadge}>
                      <Text style={styles.stepsCountText}>
                        {steps.length} {steps.length === 1 ? 'Step' : 'Steps'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.stepsHelper}>
                    Build the sequential pipeline. When a person is dequeued from one step, they automatically progress to the next.
                  </Text>

                  {/* Stepper Component */}
                  <WorkflowStepper
                    steps={steps}
                    onEditStep={handleEditStep}
                    onDeleteStep={handleDeleteStep}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onInsertStepAt={handleInsertStepAt}
                    onAddNextStep={handleAddNextStep}
                  />
                </Card.Content>
              </Card>

              {/* Google Material 3 Stage 2 Actions directly at the bottom */}
              <View style={styles.stage2ActionRow}>
                <Button
                  mode="outlined"
                  icon="arrow-left"
                  textColor="#004d99"
                  labelStyle={styles.m3BtnLabel}
                  style={styles.m3BackBtn}
                  onPress={() => setWizardStage(1)}
                >
                  Back
                </Button>

                <Button
                  mode="contained"
                  icon="arrow-right"
                  contentStyle={styles.btnContentReverse}
                  buttonColor="#004d99"
                  textColor="#ffffff"
                  labelStyle={styles.m3BtnLabel}
                  style={styles.m3NextBtn}
                  onPress={handleContinueToReview}
                >
                  Review Workflow
                </Button>
              </View>
            </View>
          )}

          {/* STAGE 3: Review & Publish */}
          {wizardStage === 3 && (
            <WorkflowReviewSection
              workflowName={workflowName}
              description={description}
              schedule={schedule}
              steps={steps}
              availableQueues={AVAILABLE_MOCK_QUEUES}
              isValid={isReviewValid}
              validationErrors={reviewValidationErrors}
              onEditDetails={() => setWizardStage(1)}
              onEditSchedule={() => setWizardStage(1)}
              onEditSteps={() => setWizardStage(2)}
              onSaveDraft={handleSaveDraft}
              onPublish={handleConfirmPublish}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Configure Step Bottom Sheet Modal */}
      <ConfigureStepSheet
        visible={sheetVisible}
        step={editingStep}
        stepIndex={editingIndex}
        totalSteps={steps.length}
        existingSteps={steps}
        workflowSchedule={schedule}
        onSave={handleSaveConfiguredStep}
        onCancel={() => {
          setSheetVisible(false);
          setEditingStep(null);
          setEditingIndex(-1);
          setInsertAtIndex(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f4f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    padding: 4,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0e1d33',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#65758b',
    marginTop: 1,
    maxWidth: 200,
  },
  draftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f0fc',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  draftBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#004d99',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stageWrap: {
    gap: 16,
  },
  sectionCard: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0e1d33',
  },
  inputWrap: {
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#ffffff',
    fontSize: 14,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepsCountBadge: {
    backgroundColor: '#e6f0fc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  stepsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004d99',
  },
  stepsHelper: {
    fontSize: 12,
    color: '#556475',
    marginBottom: 12,
    lineHeight: 17,
  },
  stageActionsWrap: {
    marginTop: 6,
    marginBottom: 12,
  },
  m3ActionBtn: {
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#004d99',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  btnContentReverse: {
    flexDirection: 'row-reverse',
    height: 52,
  },
  m3BtnLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  stage2ActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  m3BackBtn: {
    flex: 1,
    borderRadius: 16,
    borderColor: '#004d99',
    borderWidth: 1.5,
    height: 52,
    justifyContent: 'center',
  },
  m3NextBtn: {
    flex: 1.6,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#004d99',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
});
