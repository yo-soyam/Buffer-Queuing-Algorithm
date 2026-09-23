import { Workflow, WorkflowStep, AvailableQueue, WorkflowStudent, CompletionRule } from '../types/workflow';

export let AVAILABLE_MOCK_QUEUES: AvailableQueue[] = [
  {
    id: 'q_verif',
    name: 'Verification Queue',
    code: 'VRF-101',
    service: 'Document Verification Counter',
    description: 'Initial intake and document verification counter.',
    capacity: 60,
    avgProcessingTime: 5,
    bufferDuration: 20,
    openingTime: '09:00',
    closingTime: '17:00',
    status: 'OPEN',
  },
  {
    id: 'q_reg',
    name: 'Registration Queue',
    code: 'REG-202',
    service: 'Student Registration Desk',
    description: 'Student registration and profile creation counter.',
    capacity: 50,
    avgProcessingTime: 8,
    bufferDuration: 20,
    openingTime: '09:00',
    closingTime: '16:30',
    status: 'OPEN',
  },
  {
    id: 'q_pay',
    name: 'Payment Queue',
    code: 'PAY-303',
    service: 'Finance & Fee Collection',
    description: 'Tuition and laboratory fee collection desk.',
    capacity: 80,
    avgProcessingTime: 6,
    bufferDuration: 15,
    openingTime: '09:30',
    closingTime: '16:00',
    status: 'OPEN',
  },
  {
    id: 'q_uni',
    name: 'Uniform Queue',
    code: 'UNI-404',
    service: 'Apparel & Kit Distribution',
    description: 'Campus uniform sizing and kit distribution.',
    capacity: 40,
    avgProcessingTime: 10,
    bufferDuration: 25,
    openingTime: '10:00',
    closingTime: '17:00',
    status: 'OPEN',
  },
  {
    id: 'q_corr',
    name: 'Correction Queue',
    code: 'COR-505',
    service: 'Exceptions & Rectifications',
    description: 'Handling discrepancies in student documents.',
    capacity: 30,
    avgProcessingTime: 15,
    bufferDuration: 30,
    openingTime: '09:00',
    closingTime: '15:00',
    status: 'OPEN',
  },
  {
    id: 'q_med',
    name: 'Medical Triage Queue',
    code: 'MED-606',
    service: 'Health Screening Unit',
    description: 'Mandatory campus medical check-up.',
    capacity: 50,
    avgProcessingTime: 12,
    bufferDuration: 20,
    openingTime: '08:30',
    closingTime: '16:00',
    status: 'OPEN',
  },
];

export function addAvailableQueue(newQueue: AvailableQueue): AvailableQueue {
  AVAILABLE_MOCK_QUEUES = [newQueue, ...AVAILABLE_MOCK_QUEUES];
  return newQueue;
}

export const INITIAL_STEPS: WorkflowStep[] = [
  {
    id: 'step-1',
    order: 1,
    name: 'Document Verification',
    queueId: 'q_verif',
    queueName: 'Verification Queue',
    completionRule: 'MANUAL_STAFF',
    autoEnrollNext: true,
    nextStepId: 'step-2',
  },
  {
    id: 'step-2',
    order: 2,
    name: 'Registration',
    queueId: 'q_reg',
    queueName: 'Registration Queue',
    completionRule: 'FORM_SUBMITTED',
    autoEnrollNext: true,
    nextStepId: 'step-3',
  },
  {
    id: 'step-3',
    order: 3,
    name: 'Fee Payment',
    queueId: 'q_pay',
    queueName: 'Payment Queue',
    completionRule: 'PAYMENT_SUCCESS',
    autoEnrollNext: true,
    nextStepId: 'step-4',
  },
  {
    id: 'step-4',
    order: 4,
    name: 'Uniform Collection',
    queueId: 'q_uni',
    queueName: 'Uniform Queue',
    completionRule: 'MANUAL_STAFF',
    autoEnrollNext: false,
    nextStepId: null,
  },
];

let workflowsStore: Workflow[] = [
  {
    id: 'wf_admission_2026',
    name: 'College Admission 2026',
    description: 'Undergraduate admission process from document verification to uniform collection.',
    status: 'ACTIVE',
    steps: INITIAL_STEPS,
    enrolledCount: 148,
    completedCount: 62,
    inProgressCount: 86,
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-20T14:30:00Z',
  },
  {
    id: 'wf_scholarship',
    name: 'Scholarship Application',
    description: 'Annual merit and financial aid application review cycle.',
    status: 'DRAFT',
    steps: [
      {
        id: 'sc-1',
        order: 1,
        name: 'Application Review',
        queueId: 'q_verif',
        queueName: 'Verification Queue',
        completionRule: 'MANUAL_STAFF',
        autoEnrollNext: true,
        nextStepId: 'sc-2',
      },
      {
        id: 'sc-2',
        order: 2,
        name: 'Document Verification',
        queueId: 'q_reg',
        queueName: 'Registration Queue',
        completionRule: 'MANUAL_STAFF',
        autoEnrollNext: true,
        nextStepId: 'sc-3',
      },
      {
        id: 'sc-3',
        order: 3,
        name: 'Final Approval',
        queueId: 'q_pay',
        queueName: 'Payment Queue',
        completionRule: 'EXTERNAL_CONFIRMATION',
        autoEnrollNext: false,
        nextStepId: null,
      },
    ],
    enrolledCount: 0,
    completedCount: 0,
    inProgressCount: 0,
    createdAt: '2026-09-15T11:00:00Z',
    updatedAt: '2026-09-18T16:00:00Z',
  },
  {
    id: 'wf_grad_clearance',
    name: 'Graduation Clearance',
    description: 'Final semester library, laboratory, and department clearance.',
    status: 'ACTIVE',
    steps: [
      {
        id: 'gc-1',
        order: 1,
        name: 'Library Clearance',
        queueId: 'q_verif',
        queueName: 'Verification Queue',
        completionRule: 'MANUAL_STAFF',
        autoEnrollNext: true,
        nextStepId: 'gc-2',
      },
      {
        id: 'gc-2',
        order: 2,
        name: 'Laboratory Sign-off',
        queueId: 'q_reg',
        queueName: 'Registration Queue',
        completionRule: 'MANUAL_STAFF',
        autoEnrollNext: true,
        nextStepId: 'gc-3',
      },
      {
        id: 'gc-3',
        order: 3,
        name: 'Accounts Settlement',
        queueId: 'q_pay',
        queueName: 'Payment Queue',
        completionRule: 'PAYMENT_SUCCESS',
        autoEnrollNext: false,
        nextStepId: null,
      },
    ],
    enrolledCount: 65,
    completedCount: 28,
    inProgressCount: 37,
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-09-19T12:00:00Z',
  },
  {
    id: 'wf_campus_housing',
    name: 'Hostel & Housing Allocation',
    description: 'Hostel room verification, security deposit payment, and room key handover.',
    status: 'ACTIVE',
    steps: [
      {
        id: 'hh-1',
        order: 1,
        name: 'Room Verification',
        queueId: 'q_verif',
        queueName: 'Verification Queue',
        completionRule: 'MANUAL_STAFF',
        autoEnrollNext: true,
        nextStepId: 'hh-2',
      },
      {
        id: 'hh-2',
        order: 2,
        name: 'Security Deposit',
        queueId: 'q_pay',
        queueName: 'Payment Queue',
        completionRule: 'PAYMENT_SUCCESS',
        autoEnrollNext: true,
        nextStepId: 'hh-3',
      },
      {
        id: 'hh-3',
        order: 3,
        name: 'Key Handover',
        queueId: 'q_uni',
        queueName: 'Uniform Queue',
        completionRule: 'MANUAL_STAFF',
        autoEnrollNext: false,
        nextStepId: null,
      },
    ],
    enrolledCount: 35,
    completedCount: 15,
    inProgressCount: 20,
    createdAt: '2026-09-12T08:30:00Z',
    updatedAt: '2026-09-20T10:15:00Z',
  },
];

export const MOCK_STUDENTS: WorkflowStudent[] = [
  {
    id: 'std_01',
    name: 'Aarav Sharma',
    identifier: 'BUF-2026-081',
    workflowId: 'wf_admission_2026',
    currentStepId: 'step-2',
    currentStepName: 'Registration',
    currentQueueStatus: 'Position #4 in Queue',
    enteredStageAt: '10:42 AM',
    completedStepCount: 1,
    totalStepCount: 4,
    status: 'IN_PROGRESS',
    timeline: [
      { stepId: 'step-1', stepName: 'Document Verification', completedAt: '10:35 AM', status: 'COMPLETED' },
      { stepId: 'step-2', stepName: 'Registration', status: 'IN_PROGRESS' },
      { stepId: 'step-3', stepName: 'Fee Payment', status: 'UPCOMING' },
      { stepId: 'step-4', stepName: 'Uniform Collection', status: 'UPCOMING' },
    ],
  },
  {
    id: 'std_02',
    name: 'Meera Patel',
    identifier: 'BUF-2026-044',
    workflowId: 'wf_admission_2026',
    currentStepId: 'step-3',
    currentStepName: 'Fee Payment',
    currentQueueStatus: 'Waiting for Payment Link',
    enteredStageAt: '11:15 AM',
    completedStepCount: 2,
    totalStepCount: 4,
    status: 'WAITING',
    timeline: [
      { stepId: 'step-1', stepName: 'Document Verification', completedAt: '09:50 AM', status: 'COMPLETED' },
      { stepId: 'step-2', stepName: 'Registration', completedAt: '11:10 AM', status: 'COMPLETED' },
      { stepId: 'step-3', stepName: 'Fee Payment', status: 'IN_PROGRESS' },
      { stepId: 'step-4', stepName: 'Uniform Collection', status: 'UPCOMING' },
    ],
  },
  {
    id: 'std_03',
    name: 'Rohan Verma',
    identifier: 'BUF-2026-012',
    workflowId: 'wf_admission_2026',
    currentStepId: 'step-4',
    currentStepName: 'Uniform Collection',
    currentQueueStatus: 'Finished at Counter',
    enteredStageAt: '01:20 PM',
    completedStepCount: 4,
    totalStepCount: 4,
    status: 'COMPLETED',
    timeline: [
      { stepId: 'step-1', stepName: 'Document Verification', completedAt: '10:00 AM', status: 'COMPLETED' },
      { stepId: 'step-2', stepName: 'Registration', completedAt: '11:00 AM', status: 'COMPLETED' },
      { stepId: 'step-3', stepName: 'Fee Payment', completedAt: '12:15 PM', status: 'COMPLETED' },
      { stepId: 'step-4', stepName: 'Uniform Collection', completedAt: '01:45 PM', status: 'COMPLETED' },
    ],
  },
  {
    id: 'std_04',
    name: 'Ananya Iyer',
    identifier: 'BUF-2026-105',
    workflowId: 'wf_admission_2026',
    currentStepId: 'step-1',
    currentStepName: 'Document Verification',
    currentQueueStatus: 'Position #2 in Queue',
    enteredStageAt: '11:30 AM',
    completedStepCount: 0,
    totalStepCount: 4,
    status: 'IN_PROGRESS',
    timeline: [
      { stepId: 'step-1', stepName: 'Document Verification', status: 'IN_PROGRESS' },
      { stepId: 'step-2', stepName: 'Registration', status: 'UPCOMING' },
      { stepId: 'step-3', stepName: 'Fee Payment', status: 'UPCOMING' },
      { stepId: 'step-4', stepName: 'Uniform Collection', status: 'UPCOMING' },
    ],
  },
  {
    id: 'std_05',
    name: 'Vikram Rao',
    identifier: 'BUF-2026-067',
    workflowId: 'wf_admission_2026',
    currentStepId: 'step-2',
    currentStepName: 'Registration',
    currentQueueStatus: 'Hold: Incomplete Marksheet',
    enteredStageAt: '10:15 AM',
    completedStepCount: 1,
    totalStepCount: 4,
    status: 'BLOCKED',
    timeline: [
      { stepId: 'step-1', stepName: 'Document Verification', completedAt: '10:10 AM', status: 'COMPLETED' },
      { stepId: 'step-2', stepName: 'Registration', status: 'IN_PROGRESS' },
      { stepId: 'step-3', stepName: 'Fee Payment', status: 'UPCOMING' },
      { stepId: 'step-4', stepName: 'Uniform Collection', status: 'UPCOMING' },
    ],
  },
];

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeWorkflows(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getWorkflows(): Workflow[] {
  return [...workflowsStore];
}

export function getWorkflowById(id: string): Workflow | undefined {
  return workflowsStore.find((w) => w.id === id);
}

export function saveWorkflow(workflow: Workflow): Workflow {
  const index = workflowsStore.findIndex((w) => w.id === workflow.id);
  if (index >= 0) {
    workflowsStore[index] = { ...workflow, updatedAt: new Date().toISOString() };
  } else {
    workflowsStore = [
      {
        ...workflow,
        id: workflow.id || `wf_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...workflowsStore,
    ];
  }
  notify();
  return workflow;
}

export function updateWorkflowStatus(id: string, status: Workflow['status']) {
  workflowsStore = workflowsStore.map((w) =>
    w.id === id ? { ...w, status, updatedAt: new Date().toISOString() } : w
  );
  notify();
}

export function deleteWorkflow(id: string) {
  workflowsStore = workflowsStore.filter((w) => w.id !== id);
  notify();
}

export function duplicateWorkflow(id: string): Workflow | null {
  const original = getWorkflowById(id);
  if (!original) return null;
  const copy: Workflow = {
    ...original,
    id: `wf_${Date.now()}`,
    name: `${original.name} (Copy)`,
    status: 'DRAFT',
    enrolledCount: 0,
    completedCount: 0,
    inProgressCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  workflowsStore = [copy, ...workflowsStore];
  notify();
  return copy;
}

export function getAvailableQueues(): AvailableQueue[] {
  return [...AVAILABLE_MOCK_QUEUES];
}

export function getStudentsForWorkflow(workflowId: string): WorkflowStudent[] {
  return MOCK_STUDENTS.filter((s) => s.workflowId === workflowId);
}
