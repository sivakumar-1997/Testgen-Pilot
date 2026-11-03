import { CustomTemplate } from '../types';

export const DEFAULT_TEMPLATES: CustomTemplate[] = [
  {
    id: 'screenshot-template',
    name: 'Executive Matrix (Visual Reference)',
    description: 'Clean high-density layout matching your UI reference with Scope, Preconditions, Expectation, and Status.',
    isBuiltIn: true,
    columns: [
      { key: 'order', label: '#', width: 'w-12', type: 'text', editable: false },
      { key: 'scope', label: 'Scope', width: 'w-1/4', type: 'text', editable: true },
      { key: 'preconditions', label: 'Preconditions', width: 'w-1/4', type: 'text', editable: true },
      { key: 'expectation', label: 'Expectation', width: 'w-1/3', type: 'text', editable: true },
      { key: 'status', label: 'Pass/Fail', width: 'w-28', type: 'status', editable: true },
    ],
  },
  {
    id: 'rtcm-standard',
    name: 'Comprehensive RTCM Standard (FR-009)',
    description: 'Complete QA specification: ID, Scenario, Category, Priority, Preconditions, Steps, Test Data, Expected Result, Status.',
    isBuiltIn: true,
    columns: [
      { key: 'id', label: 'Test ID', width: 'w-24', type: 'badge', editable: false },
      { key: 'scenario', label: 'Scenario / Title', width: 'w-1/4', type: 'text', editable: true },
      { key: 'category', label: 'Category', width: 'w-28', type: 'badge', editable: true },
      { key: 'priority', label: 'Priority', width: 'w-24', type: 'badge', editable: true },
      { key: 'preconditions', label: 'Preconditions', width: 'w-1/5', type: 'text', editable: true },
      { key: 'steps', label: 'Test Steps', width: 'w-1/4', type: 'steps', editable: true },
      { key: 'testData', label: 'Test Data', width: 'w-1/5', type: 'text', editable: true },
      { key: 'expectedResult', label: 'Expected Result', width: 'w-1/4', type: 'text', editable: true },
      { key: 'status', label: 'Status', width: 'w-28', type: 'status', editable: true },
    ],
  },
  {
    id: 'jira-xray',
    name: 'Jira & Zephyr / Xray',
    description: 'Standard enterprise format for syncing with Atlassian Jira and Zephyr Test Management.',
    isBuiltIn: true,
    columns: [
      { key: 'id', label: 'Issue Key', width: 'w-24', type: 'badge', editable: false },
      { key: 'scenario', label: 'Test Summary', width: 'w-1/3', type: 'text', editable: true },
      { key: 'priority', label: 'Priority', width: 'w-24', type: 'badge', editable: true },
      { key: 'steps', label: 'Test Steps', width: 'w-1/3', type: 'steps', editable: true },
      { key: 'testData', label: 'Test Data', width: 'w-1/5', type: 'text', editable: true },
      { key: 'expectedResult', label: 'Expected Result', width: 'w-1/4', type: 'text', editable: true },
      { key: 'status', label: 'Execution', width: 'w-28', type: 'status', editable: true },
    ],
  },
  {
    id: 'bdd-gherkin',
    name: 'BDD / Gherkin Format',
    description: 'Behavior-Driven Development format with Given-When-Then criteria.',
    isBuiltIn: true,
    columns: [
      { key: 'id', label: 'Scenario ID', width: 'w-24', type: 'badge', editable: false },
      { key: 'scenario', label: 'Feature Scenario', width: 'w-1/3', type: 'text', editable: true },
      { key: 'preconditions', label: 'Given (Preconditions)', width: 'w-1/4', type: 'text', editable: true },
      { key: 'scope', label: 'When (Action)', width: 'w-1/4', type: 'text', editable: true },
      { key: 'expectation', label: 'Then (Expectation)', width: 'w-1/3', type: 'text', editable: true },
      { key: 'status', label: 'Status', width: 'w-28', type: 'status', editable: true },
    ],
  },
];
