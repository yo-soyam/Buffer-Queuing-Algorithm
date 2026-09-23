export type WorkflowStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ARCHIVED';

export type ScheduleType = 'ONE_TIME' | 'RECURRING';

export type RecurrenceEndType = 'AFTER_OCCURRENCES' | 'ON_DATE';

export interface WorkflowSchedule {
  type: ScheduleType;
  startDate: string;
  startTime: string;
  endTime: string;
  oneTimeEndDate?: string;
  repeatDays?: number[]; // 1 = Monday, 7 = Sunday (or 0 = Sunday)
  recurrenceEndType?: RecurrenceEndType;
  occurrenceCount?: number;
  recurrenceEndDate?: string;
  timezone: string;
}

export type CompletionRule =
  | 'MANUAL_STAFF'
  | 'PAYMENT_SUCCESS'
  | 'FORM_SUBMITTED'
  | 'EXTERNAL_CONFIRMATION';

export interface WorkflowBranch {
  id: string;
  label: string;
  condition: string;
  destinationStepId: string;
  isDefault?: boolean;
}

export interface WorkflowStep {
  id: string;
  order: number;
  name: string;
  queueId: string;
  queueName: string;
  completionRule?: CompletionRule;
  autoEnrollNext?: boolean;
  nextStepId: string | null;
  condition?: string;
  branches?: WorkflowBranch[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  schedule?: WorkflowSchedule;
  steps: WorkflowStep[];
  enrolledCount: number;
  completedCount: number;
  inProgressCount: number;
  createdAt: string;
  updatedAt: string;
}

export type StudentWorkflowStatus = 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'WAITING';

export interface WorkflowStudent {
  id: string;
  name: string;
  identifier: string;
  workflowId: string;
  currentStepId: string;
  currentStepName: string;
  currentQueueStatus: string;
  enteredStageAt: string;
  completedStepCount: number;
  totalStepCount: number;
  status: StudentWorkflowStatus;
  timeline?: {
    stepId: string;
    stepName: string;
    completedAt?: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  }[];
}

export interface AvailableQueue {
  id: string;
  name: string;
  code: string;
  service?: string;
  description?: string;
  capacity?: number;
  avgProcessingTime?: number; // in minutes
  bufferDuration?: number; // in minutes
  openingTime?: string; // e.g. "09:00"
  closingTime?: string; // e.g. "17:00"
  status: 'OPEN' | 'BUSY' | 'CLOSING_SOON' | 'CLOSED';
}
