import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WorkflowStatus } from '../../types/workflow';
import { theme } from '../../theme/theme';

interface Props {
  status: WorkflowStatus;
}

export default function WorkflowStatusBadge({ status }: Props) {
  const getConfig = () => {
    switch (status) {
      case 'ACTIVE':
        return {
          label: 'Active',
          bg: '#e8f5e9',
          color: '#1b873f',
          icon: 'play-arrow' as const,
        };
      case 'DRAFT':
        return {
          label: 'Draft',
          bg: '#eceef1',
          color: theme.colors.onSurfaceVariant,
          icon: 'edit' as const,
        };
      case 'PAUSED':
        return {
          label: 'Paused',
          bg: '#fff3e0',
          color: '#b26a00',
          icon: 'pause' as const,
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          bg: '#e1edff',
          color: theme.colors.primary,
          icon: 'check-circle' as const,
        };
      case 'SCHEDULED':
        return {
          label: 'Scheduled',
          bg: '#e8f0fe',
          color: '#0052cc',
          icon: 'event' as const,
        };
      case 'ARCHIVED':
        return {
          label: 'Archived',
          bg: '#f5f5f5',
          color: '#757575',
          icon: 'archive' as const,
        };
      default:
        return {
          label: 'Draft',
          bg: '#eceef1',
          color: theme.colors.onSurfaceVariant,
          icon: 'edit' as const,
        };
    }
  };

  const config = getConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <MaterialIcons name={config.icon} size={13} color={config.color} style={styles.icon} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
