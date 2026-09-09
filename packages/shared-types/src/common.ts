/**
 * Common types and utilities for Thai Watsadu WDS
 */

/**
 * MoneyString represents an exact monetary value serialized as string.
 * Example: "14500.5000"
 */
export type MoneyString = string;

/**
 * QuantityString represents an exact stock or item quantity serialized as string.
 * Example: "500.0000"
 */
export type QuantityString = string;

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  invalidParams?: Array<{
    name: string;
    reason: string;
  }>;
}

export enum EntityStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export interface AuditEventLog {
  eventId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  performedByUserId: string;
  performedAt: string; // ISO UTC string
  oldStateJson?: string;
  newStateJson: string;
  sha256Hash: string;
  previousEventHash?: string;
}
