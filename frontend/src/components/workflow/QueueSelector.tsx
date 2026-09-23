import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AvailableQueue } from '../../types/workflow';
import { theme } from '../../theme/theme';

interface Props {
  queues: AvailableQueue[];
  selectedQueueId: string;
  isQueueAssignedToOtherStep: (queueId: string) => boolean;
  onSelectQueue: (queue: AvailableQueue) => void;
  onOpenCreateQueue: (initialName?: string) => void;
  error?: string;
}

// Convert 24-hr "HH:MM" to 12-hr display "hh:mm AM/PM"
function formatTo12Hr(time24?: string): string {
  if (!time24 || !time24.includes(':')) return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${ampm}`;
}

export default function QueueSelector({
  queues,
  selectedQueueId,
  isQueueAssignedToOtherStep,
  onSelectQueue,
  onOpenCreateQueue,
  error,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQueues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return queues;
    return queues.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.service && item.service.toLowerCase().includes(q))
    );
  }, [queues, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Top Row: Label & Available Count */}
      <View style={styles.headerRow}>
        <Text style={styles.label}>
          Select Queue <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.helperCount}>{queues.length} available</Text>
      </View>

      {/* Action Row: Search Input & "+ Create New Queue" Button */}
      <View style={styles.actionRow}>
        <View style={styles.searchWrap}>
          <TextInput
            mode="outlined"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search queues"
            left={<TextInput.Icon icon="magnify" color="#718096" size={20} />}
            right={
              searchQuery ? (
                <TextInput.Icon
                  icon="close-circle"
                  color="#718096"
                  size={18}
                  onPress={() => setSearchQuery('')}
                />
              ) : null
            }
            outlineColor="#d4dbe4"
            activeOutlineColor="#004d99"
            style={styles.searchInput}
            textColor="#0e1d33"
            dense
          />
        </View>

        <TouchableOpacity
          style={styles.createQueueBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onOpenCreateQueue(searchQuery.trim());
          }}
        >
          <MaterialIcons name="add" size={18} color="#004d99" />
          <Text style={styles.createQueueBtnText}>Create New Queue</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Queue Grid / Empty Search State */}
      {filteredQueues.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={32} color="#8a99ad" />
          <Text style={styles.emptyTitle}>No matching queue found</Text>
          {searchQuery.trim() ? (
            <TouchableOpacity
              style={styles.emptyCreateBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOpenCreateQueue(searchQuery.trim());
              }}
            >
              <MaterialIcons name="add-circle" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.emptyCreateBtnText}>
                Create "{searchQuery.trim()}"
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.emptyCreateBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOpenCreateQueue();
              }}
            >
              <MaterialIcons name="add-circle" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.emptyCreateBtnText}>Create New Queue</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.queueGrid}>
          {filteredQueues.map((queue) => {
            const isSelected = selectedQueueId === queue.id;
            const isAssigned = isQueueAssignedToOtherStep(queue.id);

            return (
              <TouchableOpacity
                key={queue.id}
                style={[
                  styles.queueOption,
                  isSelected && styles.queueOptionSelected,
                  isAssigned && !isSelected && styles.queueOptionDisabled,
                ]}
                onPress={() => {
                  if (isAssigned && !isSelected) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    Alert.alert(
                      'Reuse Queue?',
                      `"${queue.name}" is already used in another step of this workflow. Are you sure you want to reuse it here?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Reuse Queue',
                          style: 'default',
                          onPress: () => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onSelectQueue(queue);
                          },
                        },
                      ]
                    );
                    return;
                  }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelectQueue(queue);
                }}
              >
                <View style={styles.queueOptionTop}>
                  <View
                    style={[
                      styles.queueIconWrap,
                      isSelected && { backgroundColor: 'rgba(255,255,255,0.25)' },
                      isAssigned && !isSelected && { backgroundColor: '#eaeff5' },
                    ]}
                  >
                    <MaterialIcons
                      name="confirmation-number"
                      size={15}
                      color={isSelected ? '#ffffff' : isAssigned ? '#718096' : theme.colors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.queueCode,
                      isSelected && { color: '#ffffff' },
                      isAssigned && !isSelected && { color: '#5a697c' },
                    ]}
                  >
                    {queue.code}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.queueName,
                    isSelected && { color: '#ffffff' },
                    isAssigned && !isSelected && { color: '#4a5568' },
                  ]}
                  numberOfLines={1}
                >
                  {queue.name}
                </Text>

                {/* Timing Badge if configured */}
                {queue.openingTime && queue.closingTime ? (
                  <View style={styles.timingBadge}>
                    <MaterialIcons
                      name="schedule"
                      size={11}
                      color={isSelected ? 'rgba(255,255,255,0.85)' : '#5a697c'}
                    />
                    <Text
                      style={[
                        styles.timingBadgeText,
                        isSelected && { color: 'rgba(255,255,255,0.9)' },
                      ]}
                      numberOfLines={1}
                    >
                      {formatTo12Hr(queue.openingTime)} - {formatTo12Hr(queue.closingTime)}
                    </Text>
                  </View>
                ) : null}

                {/* Used in another step badge */}
                {isAssigned && (
                  <View style={styles.assignedBadge}>
                    <MaterialIcons name="info-outline" size={11} color="#65758b" />
                    <Text style={styles.assignedBadgeText} numberOfLines={1}>
                      Used in another step
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3848',
  },
  required: {
    color: '#d32f2f',
  },
  helperCount: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  actionRow: {
    gap: 8,
    marginBottom: 12,
  },
  searchWrap: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    fontSize: 13,
  },
  createQueueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6f0fc',
    borderWidth: 1,
    borderColor: '#c6d9ed',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  createQueueBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#004d99',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 2,
  },
  queueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  queueOption: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e7ef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  queueOptionSelected: {
    backgroundColor: '#004d99',
    borderColor: '#003366',
  },
  queueOptionDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#dce3eb',
    opacity: 0.7,
  },
  queueOptionWarning: {
    borderColor: '#ffd599',
    backgroundColor: '#fffbf5',
  },
  queueOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  queueIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#e6f0fc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004d99',
  },
  queueName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#121d2d',
    marginBottom: 4,
  },
  timingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timingBadgeText: {
    fontSize: 10,
    color: '#5a697c',
    fontWeight: '500',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  assignedBadgeText: {
    fontSize: 10,
    color: '#b26a00',
    fontWeight: '500',
  },
  emptyContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e7ef',
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#556475',
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#004d99',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 4,
  },
  emptyCreateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
