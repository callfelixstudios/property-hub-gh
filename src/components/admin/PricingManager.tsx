'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { updateCreditConfig, updatePlanConfig } from '@/app/actions/configActions';
import { BILLING_CYCLES } from '@/lib/configValidation';
import type { CreditConfig } from '@/lib/creditPurchase';
import type { PlanPricing } from '@/lib/plansPricing';

interface PlanDraft {
  price: string;
  billing_cycle: string;
  cap: string;
  archive: string;
  features: string;
  is_active: boolean;
}

function draftFromPlan(plan: PlanPricing): PlanDraft {
  return {
    price: String(plan.price_ghs),
    billing_cycle: plan.billing_cycle,
    cap: String(plan.active_listing_cap),
    archive: String(plan.archive_after_days),
    features: plan.features.join('\n'),
    is_active: plan.is_active,
  };
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-navy-base focus:border-navy-base';
const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1';

export default function PricingManager({
  plans,
  credit,
}: {
  plans: PlanPricing[];
  credit: CreditConfig;
}) {
  const [isPending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, PlanDraft>>(() =>
    Object.fromEntries(plans.map((p) => [p.slug, draftFromPlan(p)]))
  );
  const [planMsg, setPlanMsg] = useState<Record<string, string | null>>({});
  const [creditDraft, setCreditDraft] = useState({
    credit_price_ghs: String(credit.credit_price_ghs),
    credit_min_qty: String(credit.credit_min_qty),
    credit_max_qty: String(credit.credit_max_qty),
    boost_duration_days: String(credit.boost_duration_days),
  });
  const [creditMsg, setCreditMsg] = useState<string | null>(null);

  const setDraft = (slug: string, patch: Partial<PlanDraft>) =>
    setDrafts((prev) => ({ ...prev, [slug]: { ...prev[slug], ...patch } }));

  const handleSavePlan = (plan: PlanPricing) => {
    const draft = drafts[plan.slug];
    if (!draft || !plan.id) return;
    setPlanMsg((prev) => ({ ...prev, [plan.slug]: null }));
    startTransition(async () => {
      try {
        await updatePlanConfig(plan.id, {
          price_ghs: Number(draft.price),
          billing_cycle: draft.billing_cycle,
          active_listing_cap: Number(draft.cap),
          archive_after_days: Number(draft.archive),
          features: draft.features
            .split('\n')
            .map((f) => f.trim())
            .filter(Boolean),
          is_active: draft.is_active,
        });
        setPlanMsg((prev) => ({ ...prev, [plan.slug]: 'Saved.' }));
      } catch (err) {
        setPlanMsg((prev) => ({
          ...prev,
          [plan.slug]: err instanceof Error ? err.message : 'Save failed.',
        }));
      }
    });
  };

  const handleSaveCredit = () => {
    setCreditMsg(null);
    startTransition(async () => {
      try {
        await updateCreditConfig({
          credit_price_ghs: Number(creditDraft.credit_price_ghs),
          credit_min_qty: Number(creditDraft.credit_min_qty),
          credit_max_qty: Number(creditDraft.credit_max_qty),
          boost_duration_days: Number(creditDraft.boost_duration_days),
        });
        setCreditMsg('Saved.');
      } catch (err) {
        setCreditMsg(err instanceof Error ? err.message : 'Save failed.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <p className="text-sm text-slate-600">
          Changes apply to new purchases only.
        </p>
        <p className="mt-1 text-sm font-semibold text-amber-700">
          Lowering a cap blocks new activations; existing listings over the cap stay active
          until archived.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const draft = drafts[plan.slug] ?? draftFromPlan(plan);
          const msg = planMsg[plan.slug];
          return (
            <div
              key={plan.slug}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-navy-base">{plan.name}</h3>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={draft.is_active}
                    onChange={(e) => setDraft(plan.slug, { is_active: e.target.checked })}
                    className="w-4 h-4 accent-[#0F172A]"
                  />
                  Active
                </label>
              </div>

              <div>
                <label className={labelClass}>Price (GH₵)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.price}
                  onChange={(e) => setDraft(plan.slug, { price: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Billing cycle</label>
                <select
                  value={draft.billing_cycle}
                  onChange={(e) => setDraft(plan.slug, { billing_cycle: e.target.value })}
                  className={inputClass}
                >
                  {BILLING_CYCLES.map((cycle) => (
                    <option key={cycle} value={cycle}>
                      {cycle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Listing cap</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={draft.cap}
                    onChange={(e) => setDraft(plan.slug, { cap: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Archive (days)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={draft.archive}
                    onChange={(e) => setDraft(plan.slug, { archive: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Features (one per line)</label>
                <textarea
                  rows={6}
                  value={draft.features}
                  onChange={(e) => setDraft(plan.slug, { features: e.target.value })}
                  className={`${inputClass} resize-y`}
                />
              </div>

              {msg && (
                <p
                  role={msg === 'Saved.' ? 'status' : 'alert'}
                  className={`text-sm ${msg === 'Saved.' ? 'text-emerald-700' : 'text-red-700'}`}
                >
                  {msg}
                </p>
              )}

              <button
                type="button"
                onClick={() => handleSavePlan(plan)}
                disabled={isPending || !plan.id}
                title={!plan.id ? 'Plan has no database row yet' : undefined}
                className="mt-auto w-full rounded-lg bg-navy-base text-white font-bold py-2.5 px-4 hover:bg-navy-light disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save {plan.name}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-navy-base mb-4">Boost credits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Credit price (GH₵)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={creditDraft.credit_price_ghs}
              onChange={(e) =>
                setCreditDraft((prev) => ({ ...prev, credit_price_ghs: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Min qty</label>
            <input
              type="number"
              min="1"
              step="1"
              value={creditDraft.credit_min_qty}
              onChange={(e) =>
                setCreditDraft((prev) => ({ ...prev, credit_min_qty: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Max qty</label>
            <input
              type="number"
              min="1"
              step="1"
              value={creditDraft.credit_max_qty}
              onChange={(e) =>
                setCreditDraft((prev) => ({ ...prev, credit_max_qty: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Boost days</label>
            <input
              type="number"
              min="1"
              step="1"
              value={creditDraft.boost_duration_days}
              onChange={(e) =>
                setCreditDraft((prev) => ({ ...prev, boost_duration_days: e.target.value }))
              }
              className={inputClass}
            />
          </div>
        </div>

        {creditMsg && (
          <p
            role={creditMsg === 'Saved.' ? 'status' : 'alert'}
            className={`mt-3 text-sm ${creditMsg === 'Saved.' ? 'text-emerald-700' : 'text-red-700'}`}
          >
            {creditMsg}
          </p>
        )}

        <button
          type="button"
          onClick={handleSaveCredit}
          disabled={isPending}
          className="mt-4 rounded-lg bg-accent-gold text-navy-base font-bold py-2.5 px-6 hover:brightness-105 disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save credit config
        </button>
      </div>
    </div>
  );
}
