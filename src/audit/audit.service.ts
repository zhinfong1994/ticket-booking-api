import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { pool } from '../db/db';

export interface AuditEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  async log(entry: AuditEntry): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO audit_logs (id, userId, action, resource, resourceId, metadata, ipAddress)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          randomUUID(),
          entry.userId ?? null,
          entry.action,
          entry.resource,
          entry.resourceId ?? null,
          entry.metadata ? JSON.stringify(entry.metadata) : null,
          entry.ipAddress ?? null,
        ],
      );
    } catch (err) {
      // Audit failures must never break the main request flow
      console.error('Audit log write failed:', err);
    }
  }
}
