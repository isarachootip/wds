export interface QcPayload {
  ref_no?: string;
  ticket?: string;
  booking_no?: string;
  qc_date?: string;
  customer_name?: string;
  customer_phone?: string;
  qc_round?: number;
  qc_score?: number;
  qc_round_text?: string;
  qc_result?: string;
  qc_score_text?: string;
  stk_ref?: string;
  job_no?: string;
  service?: string;
  qc_inspector?: string;
  full_payload?: Record<string, any>;
  [key: string]: any;
}

export interface QcEventRecord {
  id: string;
  name: string;
  aggregate: string;
  aggregateId: string;
  payload: QcPayload;
  occurredAt: string;
  processedAt?: string | null;
  attempts?: number;
  status: string;
  lastError?: string | null;
}

export interface QcStats {
  total: number;
  passed: number;
  failedOrWarning: number;
  averageScore: number;
  latestReceivedAt: string | null;
}
