/**
 * 自定义器具业务逻辑层。
 * 对应 agent-harness 的 core/equipment.py。
 */
import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchActiveRecords,
  fetchRecordById,
  upsertRecord,
  softDeleteRecord,
} from './base.ts';

const TABLE = 'custom_equipments';

/**
 * 查询所有自定义器具。
 */
export async function listEquipment(
  supabase: SupabaseClient,
  userId: string,
): Promise<Array<Record<string, unknown>>> {
  const rows = await fetchActiveRecords(supabase, TABLE, userId);
  return rows.map((row) => ({
    ...row.data,
    id: row.id,
    updated_at: row.updated_at,
  }));
}

/**
 * 查询单个器具详情。
 */
export async function getEquipment(
  supabase: SupabaseClient,
  eqId: string,
  userId: string,
): Promise<Record<string, unknown> | null> {
  const row = await fetchRecordById(supabase, TABLE, eqId, userId);
  if (!row) return null;
  return { ...row.data, id: row.id, updated_at: row.updated_at };
}

/**
 * 添加自定义器具。
 */
export async function addEquipment(
  supabase: SupabaseClient,
  name: string,
  animationType: string,
  hasValve: boolean,
  note: string,
  userId: string,
): Promise<Record<string, unknown>> {
  const eqId = crypto.randomUUID();
  const data: Record<string, unknown> = {
    name,
    isCustom: true,
    animationType,
    hasValve,
    note,
    timestamp: new Date().toISOString(),
  };

  await upsertRecord(supabase, TABLE, eqId, data, userId);
  return { ...data, id: eqId };
}

/**
 * 更新器具字段。
 */
export async function updateEquipment(
  supabase: SupabaseClient,
  eqId: string,
  updates: Record<string, unknown>,
  userId: string,
): Promise<Record<string, unknown> | null> {
  const row = await fetchRecordById(supabase, TABLE, eqId, userId);
  if (!row) return null;

  const merged = { ...row.data, ...updates };
  await upsertRecord(supabase, TABLE, eqId, merged, userId);
  return { ...merged, id: eqId };
}

/**
 * 软删除器具。
 */
export async function deleteEquipment(
  supabase: SupabaseClient,
  eqId: string,
  userId: string,
): Promise<boolean> {
  const row = await fetchRecordById(supabase, TABLE, eqId, userId);
  if (!row) return false;
  await softDeleteRecord(supabase, TABLE, eqId, userId);
  return true;
}
