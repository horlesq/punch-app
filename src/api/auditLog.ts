import { supabase } from '@/src/lib/supabase';
import type { Json } from '@/src/types/database';

/**
 * Write an entry to the audit_log table.
 * Must be called for every admin action that changes data:
 * - Rate change, name change
 * - Employee deactivation
 * - Correction approve/reject
 * - Week unlock (Phase 4)
 */
export async function writeAuditEntry(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('audit_log')
    .insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_value: (oldValue as Json) ?? null,
      new_value: (newValue as Json) ?? null,
    });

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/** Shape of an audit log entry returned by getAuditLog(). */
export interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Fetch audit log entries, newest first.
 * Joins profiles to get the actor's full_name.
 * Default limit 200 — enough for practical use without pagination complexity in v1.
 */
export async function getAuditLog(
  limit: number = 200,
): Promise<{ data: AuditLogEntry[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('audit_log')
    .select(`
      id,
      actor_id,
      action,
      entity_type,
      entity_id,
      old_value,
      new_value,
      created_at,
      profiles!audit_log_actor_id_fkey ( full_name )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const entries: AuditLogEntry[] = (data ?? []).map((row: any) => ({
    id: row.id,
    actor_id: row.actor_id,
    actor_name: row.profiles?.full_name ?? 'Unknown',
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    old_value: row.old_value as Record<string, unknown> | null,
    new_value: row.new_value as Record<string, unknown> | null,
    created_at: row.created_at,
  }));

  return { data: entries, error: null };
}
