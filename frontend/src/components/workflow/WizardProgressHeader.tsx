import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export type WizardStage = 1 | 2 | 3;

interface StageConfig {
  stage: WizardStage;
  label: string;
}

const STAGES: StageConfig[] = [
  { stage: 1, label: 'Details' },
  { stage: 2, label: 'Steps' },
  { stage: 3, label: 'Review' },
];

interface Props {
  currentStage: WizardStage;
  maxCompletedStage: number;
  onSelectStage: (stage: WizardStage) => void;
  canNavigateToStage: (stage: WizardStage) => boolean;
}

export default function WizardProgressHeader({
  currentStage,
  maxCompletedStage,
  onSelectStage,
  canNavigateToStage,
}: Props) {
  const handleStagePress = (stage: WizardStage) => {
    if (stage === currentStage) return;
    if (canNavigateToStage(stage)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelectStage(stage);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepperRow}>
        {STAGES.map((s, index) => {
          const isCurrent = s.stage === currentStage;
          const isCompleted = s.stage < currentStage || s.stage <= maxCompletedStage;
          const isAccessible = canNavigateToStage(s.stage);

          return (
            <React.Fragment key={s.stage}>
              <TouchableOpacity
                style={[
                  styles.stageItem,
                  isCurrent && styles.stageItemCurrent,
                  !isAccessible && !isCurrent && styles.stageItemDisabled,
                ]}
                activeOpacity={isAccessible ? 0.75 : 1}
                onPress={() => handleStagePress(s.stage)}
              >
                <View
                  style={[
                    styles.iconCircle,
                    isCurrent && styles.iconCircleCurrent,
                    isCompleted && !isCurrent && styles.iconCircleCompleted,
                    !isCompleted && !isCurrent && styles.iconCircleUpcoming,
                  ]}
                >
                  {isCompleted && !isCurrent ? (
                    <MaterialIcons name="check" size={13} color="#ffffff" />
                  ) : (
                    <Text
                      style={[
                        styles.stageNumberText,
                        isCurrent && styles.stageNumberCurrent,
                        !isCompleted && !isCurrent && styles.stageNumberUpcoming,
                      ]}
                    >
                      {s.stage}
                    </Text>
                  )}
                </View>

                <Text
                  style={[
                    styles.stageLabel,
                    isCurrent && styles.stageLabelCurrent,
                    isCompleted && !isCurrent && styles.stageLabelCompleted,
                    !isCompleted && !isCurrent && styles.stageLabelUpcoming,
                  ]}
                  numberOfLines={1}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>

              {index < STAGES.length - 1 && (
                <View style={styles.arrowWrap}>
                  <MaterialIcons
                    name="arrow-forward"
                    size={14}
                    color={s.stage < currentStage ? '#004d99' : '#c0c9d6'}
                  />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5eaf0',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  stageItemCurrent: {
    backgroundColor: '#e6f0fc',
  },
  stageItemDisabled: {
    opacity: 0.65,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleCurrent: {
    backgroundColor: '#004d99',
  },
  iconCircleCompleted: {
    backgroundColor: '#004d99',
  },
  iconCircleUpcoming: {
    backgroundColor: '#e2e7ef',
  },
  stageNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stageNumberCurrent: {
    color: '#ffffff',
  },
  stageNumberUpcoming: {
    color: '#8a99ad',
  },
  stageLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  stageLabelCurrent: {
    color: '#004d99',
    fontWeight: '700',
  },
  stageLabelCompleted: {
    color: '#0e1d33',
    fontWeight: '600',
  },
  stageLabelUpcoming: {
    color: '#8a99ad',
  },
  arrowWrap: {
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
