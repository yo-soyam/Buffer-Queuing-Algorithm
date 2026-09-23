import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WorkflowStep } from '../../types/workflow';
import { theme } from '../../theme/theme';
import WorkflowStepCard from './WorkflowStepCard';

interface Props {
  steps: WorkflowStep[];
  onEditStep: (step: WorkflowStep, index: number) => void;
  onDeleteStep: (stepId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onInsertStepAt: (index: number) => void;
  onAddNextStep: () => void;
}

export default function WorkflowStepper({
  steps,
  onEditStep,
  onDeleteStep,
  onMoveUp,
  onMoveDown,
  onInsertStepAt,
  onAddNextStep,
}: Props) {
  return (
    <View style={styles.container}>
      {steps.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialIcons name="format-list-numbered" size={32} color="#004d99" />
          <Text style={styles.emptyTitle}>No steps added</Text>
          <TouchableOpacity
            style={styles.addFirstStepBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAddNextStep();
            }}
          >
            <MaterialIcons name="add" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.addFirstStepText}>Add Step</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;

            return (
              <View key={step.id} style={styles.stepBlock}>
                {/* Step Card */}
                <WorkflowStepCard
                  step={step}
                  index={index}
                  totalSteps={steps.length}
                  onEdit={onEditStep}
                  onDelete={onDeleteStep}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                />

                {/* Vertical Connector and Between-Step Plus Button */}
                {!isLast && (
                  <View style={styles.connectorSection}>
                    {/* Top Connector Line */}
                    <View style={styles.connectorLine} />

                    {/* Inline Insert Button */}
                    <TouchableOpacity
                      style={styles.insertBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onInsertStepAt(index + 1);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MaterialIcons name="add" size={16} color="#004d99" />
                    </TouchableOpacity>

                    {/* Bottom Connector Line */}
                    <View style={styles.connectorLine} />

                    {/* Directional Arrow */}
                    <View style={styles.arrowWrap}>
                      <MaterialIcons name="keyboard-arrow-down" size={20} color="#004d99" />
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          {/* Action Buttons Below the Sequence */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.addNextStepBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAddNextStep();
              }}
            >
              <MaterialIcons name="add-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.addNextStepText}>Add Next Step</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  stepBlock: {
    position: 'relative',
  },
  connectorSection: {
    alignItems: 'center',
    marginVertical: -2,
    zIndex: 2,
  },
  connectorLine: {
    width: 2,
    height: 14,
    backgroundColor: '#b9d4f6',
  },
  insertBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#004d99',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#004d99',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    marginVertical: 2,
  },
  arrowWrap: {
    marginTop: -4,
    marginBottom: 4,
  },
  bottomActions: {
    marginTop: 18,
    gap: 10,
  },
  addNextStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#004d99',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#004d99',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addNextStepText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e7ef',
    borderStyle: 'dashed',
    marginVertical: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#384656',
    marginTop: 8,
    marginBottom: 14,
  },
  addFirstStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#004d99',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addFirstStepText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
