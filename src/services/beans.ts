/**
 * 咖啡豆业务逻辑层。
 * 对应 agent-harness 的 core/beans.py。
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  fetchActiveRecords,
  fetchRecordById,
  upsertRecord,
  softDeleteRecord,
} from './base.ts';

const TABLE = 'coffee_beans';

export interface BeanFilters {
  roastLevel?: string;
  beanType?: string;
  hasRemaining?: boolean;
}

function parseGrams(value: unknown): number {
  if (typeof value !== 'string') return 0;
  const match = value.match(/^([\d.]+)/);
  return match ? Number.parseFloat(match[1]) : 0;
}

/**
 * 查询咖啡豆列表，支持筛选。
 */
export async function listBeans(
  supabase: SupabaseClient,
  userId: string,
  filters?: BeanFilters,
): Promise<Array<Record<string, unknown>>> {
  const rows = await fetchActiveRecords(supabase, TABLE, userId);
  const results: Array<Record<string, unknown>> = [];

  for (const row of rows) {
    const bean: Record<string, unknown> = { ...row.data, id: row.id, updated_at: row.updated_at };

    if (filters?.roastLevel && bean.roastLevel !== filters.roastLevel) continue;
    if (filters?.beanType && bean.beanType !== filters.beanType) continue;

    if (filters?.hasRemaining === true) {
      if (parseGrams(bean.remaining) <= 0) continue;
    }
    if (filters?.hasRemaining === false) {
      if (parseGrams(bean.remaining) > 0) continue;
    }

    results.push(bean);
  }

  return results;
}

/**
 * 查询单个咖啡豆详情。
 */
export async function getBean(
  supabase: SupabaseClient,
  beanId: string,
  userId: string,
): Promise<Record<string, unknown> | null> {
  const row = await fetchRecordById(supabase, TABLE, beanId, userId);
  if (!row) return null;
  return { ...row.data, id: row.id, updated_at: row.updated_at };
}

/**
 * 更新咖啡豆的部分字段（读取→合并→写回）。
 */
export async function updateBean(
  supabase: SupabaseClient,
  beanId: string,
  updates: Record<string, unknown>,
  userId: string,
): Promise<Record<string, unknown> | null> {
  const row = await fetchRecordById(supabase, TABLE, beanId, userId);
  if (!row) return null;

  const merged = { ...row.data, ...updates };
  await upsertRecord(supabase, TABLE, beanId, merged, userId);
  return { ...merged, id: beanId };
}

/**
 * 软删除咖啡豆。
 */
export async function deleteBean(
  supabase: SupabaseClient,
  beanId: string,
  userId: string,
): Promise<boolean> {
  const row = await fetchRecordById(supabase, TABLE, beanId, userId);
  if (!row) return false;
  await softDeleteRecord(supabase, TABLE, beanId, userId);
  return true;
}

/**
 * 扣减咖啡豆余量。
 */
export async function consumeBean(
  supabase: SupabaseClient,
  beanId: string,
  amountGrams: number,
  userId: string,
): Promise<Record<string, unknown> | null> {
  const row = await fetchRecordById(supabase, TABLE, beanId, userId);
  if (!row) return null;

  const bean = row.data;
  const remaining = parseGrams(bean.remaining);
  const newRemaining = Math.max(0, remaining - amountGrams);
  bean.remaining = `${newRemaining}`;

  await upsertRecord(supabase, TABLE, beanId, bean, userId);
  return { ...bean, id: beanId };
}
