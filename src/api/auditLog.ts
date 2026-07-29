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
