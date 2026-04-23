/**
 * 通用 Supabase 数据访问层。
 * 参照 agent-harness 的 client.py，封装 CRUD 基础操作。
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { now } from '../lib/timestamps.ts';

export interface SupabaseRow {
  id: string;
  data: Record<string, unknown>;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * 查询未删除的活跃记录，按 updated_at 降序。
 */
export async function fetchActiveRecords(
  supabase: SupabaseClient,
  table: string,
  userId: string,
): Promise<SupabaseRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select('id, data, updated_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch records from ${table}: ${error.message}`);
  }

  return (data ?? []) as SupabaseRow[];
}

/**
 * 按 ID 精确查询单条记录（忽略已软删除的）。
 */
export async function fetchRecordById(
  supabase: SupabaseClient,
  table: string,
  recordId: string,
  userId: string,
): Promise<SupabaseRow | null> {
  const { data, error } = await supabase
    .from(table)
    .select('id, data, updated_at')
    .eq('user_id', userId)
    .eq('id', recordId)
    .is('deleted_at', null)
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch record ${recordId}: ${error.message}`);
  }

  const rows = (data ?? []) as SupabaseRow[];
  return rows.length === 0 ? null : rows[0];
}

/**
 * 插入或更新一条记录。
 */
export async function upsertRecord(
  supabase: SupabaseClient,
  table: string,
  recordId: string,
  data: Record<string, unknown>,
  userId: string,
): Promise<void> {
  const ts = now();
  const { error } = await supabase
    .from(table)
    .upsert(
      {
        id: recordId,
        user_id: userId,
        data,
        updated_at: ts,
        deleted_at: null,
      },
      { onConflict: 'id,user_id' },
    );

  if (error) {
    throw new Error(`Failed to upsert record ${recordId}: ${error.message}`);
  }
}

/**
 * 软删除一条记录（设置 deleted_at）。
 */
export async function softDeleteRecord(
  supabase: SupabaseClient,
  table: string,
  recordId: string,
  userId: string,
): Promise<void> {
  const ts = now();
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: ts, updated_at: ts })
    .eq('user_id', userId)
    .eq('id', recordId);

  if (error) {
    throw new Error(`Failed to delete record ${recordId}: ${error.message}`);
  }
}
