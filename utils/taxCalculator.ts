export interface FiscalSettings {
  isTaxEnabled: boolean;
  isInclusive: boolean;
  vatRate: number;
  nhilRate: number;
  getfundRate: number;
  serviceCharge: number;
  discountRate?: number;
}

export function calculateFiscalTotals(subtotal: number, settings: FiscalSettings) {
  // 0. Apply discount to raw subtotal first
  const discountRate = settings.discountRate ?? 0;
  const discountAmount = Number((subtotal * (discountRate / 100)).toFixed(2));
  const taxableBase = subtotal - discountAmount;

  // 1. Service Charge (on discounted base)
  const serviceAmount = taxableBase * (settings.serviceCharge / 100);

  // 2. Handle Legislative Taxes (on discounted base)
  let taxAmount = 0;
  let taxBreakdown = null;

  if (settings.isTaxEnabled) {
    const totalTaxRate = settings.vatRate + settings.nhilRate + settings.getfundRate;

    if (settings.isInclusive) {
      taxAmount = taxableBase - (taxableBase / (1 + totalTaxRate / 100));
    } else {
      taxAmount = taxableBase * (totalTaxRate / 100);
    }

    taxBreakdown = {
      vat: Number(((settings.vatRate / totalTaxRate) * taxAmount).toFixed(2)),
      nhil: Number(((settings.nhilRate / totalTaxRate) * taxAmount).toFixed(2)),
      getfund: Number(((settings.getfundRate / totalTaxRate) * taxAmount).toFixed(2))
    };
  }

  // 3. Final Total
  const total = settings.isInclusive
    ? taxableBase + serviceAmount
    : taxableBase + taxAmount + serviceAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount,
    tax: Number(taxAmount.toFixed(2)),
    serviceAmount: Number(serviceAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
    breakdown: taxBreakdown
  };
}
