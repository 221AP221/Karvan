"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { Card, Field, inputClass, secondaryButtonClass } from "@/components/ui";
import type { ParsedInvoice } from "@/lib/ai";
import { callAi } from "@/lib/ai-client";
import { CURRENCIES, formatMoney } from "@/lib/money";
import { createInvoiceAction } from "../../actions";

type Item = { title: string; quantity: string; unitPrice: string };
const emptyItem: Item = { title: "", quantity: "1", unitPrice: "" };

export function InvoiceEditor() {
  const [text, setText] = useState("");
  const [ai, setAi] = useState<{ busy?: boolean; error?: string; warnings?: string[] }>({});
  const [customer, setCustomer] = useState({ name: "", phone: "", dueDate: "", note: "" });
  const [items, setItems] = useState<Item[]>([emptyItem]);
  const [currency, setCurrency] = useState("AZN");

  const total = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice.replace(",", ".")) || 0), 0);

  async function parse() {
    setAi({ busy: true });
    try {
      const result = await callAi<ParsedInvoice>("parse-invoice", { text });
      setCustomer({
        name: result.customerName,
        phone: result.customerPhone ?? "",
        dueDate: result.dueDate ?? "",
        note: result.note ?? "",
      });
      setItems(
        result.items.length
          ? result.items.map((i) => ({ title: i.title, quantity: String(i.quantity), unitPrice: String(i.unitPriceAzn) }))
          : [emptyItem],
      );
      setAi({ warnings: result.warnings });
    } catch (e) {
      setAi({ error: (e as Error).message });
    }
  }

  function setCustomerField(field: keyof typeof customer, value: string) {
    setCustomer((c) => ({ ...c, [field]: value }));
  }

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="✨ AI ilə doldur">
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Məs: Aygün Məmmədova, 0501234567, 3 fərdi dərs hər biri 50 manat, cümə gününə qədər ödəsin"
          className={inputClass}
        />
        <div className="mt-3 flex items-center gap-3">
          <button type="button" onClick={parse} disabled={ai.busy || text.trim().length < 3} className={secondaryButtonClass}>
            {ai.busy ? "Oxuyur..." : "Fakturaya çevir"}
          </button>
          <span className="text-xs text-gray-500">Nəticəni aşağıda yoxlayıb təsdiqləyirsiniz.</span>
        </div>
        {ai.error && <p className="mt-3 text-sm text-red-600">{ai.error}</p>}
        {ai.warnings && ai.warnings.length > 0 && (
          <ul className="mt-3 list-inside list-disc rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            {ai.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        )}
      </Card>

      <ActionForm action={createInvoiceAction} submitLabel="Faktura yarat">
        <input type="hidden" name="items" value={JSON.stringify(items.map((i) => ({ ...i, unitPrice: i.unitPrice.replace(",", ".") })))} />
        <Card title="Müştəri">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ad" name="customerName" value={customer.name} onChange={(e) => setCustomerField("name", e.target.value)} required />
            <Field label="Telefon" name="customerPhone" type="tel" value={customer.phone} onChange={(e) => setCustomerField("phone", e.target.value)} placeholder="+994 50 123 45 67" />
            <Field label="Son ödəniş tarixi" name="dueDate" type="date" value={customer.dueDate} onChange={(e) => setCustomerField("dueDate", e.target.value)} />
            <Field label="Qeyd" name="note" value={customer.note} onChange={(e) => setCustomerField("note", e.target.value)} />
          </div>
        </Card>

        <Card title="Xidmətlər">
          <div className="flex flex-col gap-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_64px_96px_auto] items-center gap-2">
                <input aria-label="Xidmət" value={item.title} onChange={(e) => updateItem(index, { title: e.target.value })} placeholder="Xidmət" className={inputClass} />
                <input aria-label="Say" value={item.quantity} onChange={(e) => updateItem(index, { quantity: e.target.value })} inputMode="numeric" className={inputClass} />
                <input aria-label="Qiymət" value={item.unitPrice} onChange={(e) => updateItem(index, { unitPrice: e.target.value })} inputMode="decimal" placeholder={currency} className={inputClass} />
                <button type="button" onClick={() => setItems((l) => (l.length > 1 ? l.filter((_, i) => i !== index) : l))} className="px-2 text-gray-400 hover:text-red-600" aria-label="Sətri sil">
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button type="button" onClick={() => setItems((l) => [...l, emptyItem])} className="text-sm text-[var(--brand)] hover:underline">
              + Sətir əlavə et
            </button>
            <div className="flex items-center gap-3">
              <select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Valyuta" className={`${inputClass} !w-auto`}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <p className="font-semibold">Ümumi: {formatMoney(Math.round(total * 100), currency)}</p>
            </div>
          </div>
        </Card>
      </ActionForm>
    </div>
  );
}
