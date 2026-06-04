export interface PaymentNotesMeta {
  abono_total?: number;
  text?: string;
}

export function parsePaymentNotes(notes: string | null): PaymentNotesMeta {
  if (!notes?.trim()) return {};
  try {
    const parsed = JSON.parse(notes) as PaymentNotesMeta;
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        abono_total: typeof parsed.abono_total === 'number' ? parsed.abono_total : undefined,
        text: typeof parsed.text === 'string' ? parsed.text : undefined,
      };
    }
  } catch {
    return { text: notes };
  }
  return {};
}

export function serializePaymentNotes(meta: PaymentNotesMeta, previous: string | null): string {
  const prev = parsePaymentNotes(previous);
  const next: PaymentNotesMeta = {
    text: meta.text ?? prev.text,
    abono_total: meta.abono_total ?? prev.abono_total,
  };
  if (next.abono_total == null && !next.text) return '';
  return JSON.stringify(next);
}

export function getAbonoTotal(notes: string | null): number {
  return parsePaymentNotes(notes).abono_total ?? 0;
}
