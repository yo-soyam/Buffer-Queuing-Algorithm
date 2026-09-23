import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme/theme';
import { Workflow } from '../../types/workflow';
import {
  getWorkflows,
  subscribeWorkflows,
  duplicateWorkflow,
  updateWorkflowStatus,
  deleteWorkflow,
} from '../../data/mockWorkflows';
import WorkflowCard from '../../components/workflow/WorkflowCard';

export default function WorkflowsDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [workflows, setWorkflows] = useState<Workflow[]>(getWorkflows());
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'SCHEDULED' | 'DRAFT'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeWorkflows(() => {
      setWorkflows(getWorkflows());
    });
    return unsubscribe;
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWorkflows(getWorkflows());
    setTimeout(() => setRefreshing(false), 500);
  };

  const activeWorkflows = workflows.filter((w) => w.status === 'ACTIVE');
  const activeCount = activeWorkflows.length;
  const scheduledCount = workflows.filter((w) => w.status === 'SCHEDULED').length;
  const totalActiveStudents = activeWorkflows.reduce((acc, w) => acc + w.enrolledCount, 0);

  const filteredWorkflows = workflows.filter((w) => {
    if (filter === 'ACTIVE') return w.status === 'ACTIVE';
    if (filter === 'SCHEDULED') return w.status === 'SCHEDULED';
    if (filter === 'DRAFT') return w.status === 'DRAFT';
    return true;
  });

  const handleCreatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/workflows/create' as any);
  };

  const handleDuplicate = (id: string) => {
    duplicateWorkflow(id);
  };

  const handleTogglePause = (id: string, currentStatus: Workflow['status']) => {
    let nextStatus: Workflow['status'] = 'PAUSED';
    if (currentStatus === 'PAUSED') {
      const target = workflows.find((w) => w.id === id);
      if (target?.schedule) {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        nextStatus = todayStr < target.schedule.startDate ? 'SCHEDULED' : 'ACTIVE';
      } else {
        nextStatus = 'ACTIVE';
      }
    }
    updateWorkflowStatus(id, nextStatus);
  };

  const handleDelete = (id: string) => {
    deleteWorkflow(id);
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/customer-dashboard' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#0e1d33" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workflows</Text>
        </View>

        <TouchableOpacity
          style={styles.headerCreateBtn}
          onPress={handleCreatePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="add" size={22} color="#004d99" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 96 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#004d99" />
        }
      >
        {/* Summary Metric Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconWrap, { backgroundColor: '#e6f7eb' }]}>
              <MaterialIcons name="play-circle-filled" size={22} color="#1b873f" />
            </View>
            <View>
              <Text style={styles.summaryValue}>{activeCount}</Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconWrap, { backgroundColor: '#e6f0fc' }]}>
              <MaterialIcons name="people-alt" size={22} color="#004d99" />
            </View>
            <View>
              <Text style={styles.summaryValue}>{totalActiveStudents}</Text>
              <Text style={styles.summaryLabel}>Students</Text>
            </View>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'ALL' && styles.filterPillActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter('ALL');
            }}
          >
            <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>
              All ({workflows.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === 'ACTIVE' && styles.filterPillActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter('ACTIVE');
            }}
          >
            <Text style={[styles.filterText, filter === 'ACTIVE' && styles.filterTextActive]}>
              Active ({activeCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === 'SCHEDULED' && styles.filterPillActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter('SCHEDULED');
            }}
          >
            <Text style={[styles.filterText, filter === 'SCHEDULED' && styles.filterTextActive]}>
              Scheduled ({scheduledCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === 'DRAFT' && styles.filterPillActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter('DRAFT');
            }}
          >
            <Text style={[styles.filterText, filter === 'DRAFT' && styles.filterTextActive]}>
              Drafts ({workflows.filter((w) => w.status === 'DRAFT').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Workflow Cards Section */}
        <View style={styles.workflowsList}>
          {filteredWorkflows.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="account-tree" size={40} color="#a4b3c4" />
              <Text style={styles.emptyTitle}>No workflows yet</Text>
            </View>
          ) : (
            filteredWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onDuplicate={handleDuplicate}
                onTogglePause={handleTogglePause}
                onDelete={handleDelete}
              />
            ))
          )}
        </View>

        {/* Prominent Create Workflow Button */}
        <TouchableOpacity style={styles.createWorkflowBtn} onPress={handleCreatePress}>
          <MaterialIcons name="add" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.createWorkflowText}>Create Workflow</Text>
        </TouchableOpacity>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5eaf0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0e1d33',
    letterSpacing: -0.3,
  },
  headerCreateBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e6f0fc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e7ef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0e1d33',
    lineHeight: 24,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5a6678',
    marginTop: 1,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9e2ec',
  },
  filterPillActive: {
    backgroundColor: '#004d99',
    borderColor: '#004d99',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495666',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  workflowsList: {
    gap: 4,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e7ef',
    marginVertical: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2a3545',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#657488',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  createWorkflowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#004d99',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: '#004d99',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createWorkflowText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
