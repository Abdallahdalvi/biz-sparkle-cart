export interface ShiprocketLineAmount {
  unitPricePaise: number;
  qty: number;
}

export interface ShiprocketOrderAmountInput {
  items: ShiprocketLineAmount[];
  storedSubtotalPaise: number;
  orderTotalPaise: number;
  codCollectablePaise: number;
  paymentMethod: "COD" | "Prepaid";
}

export interface ShiprocketOrderAmounts {
  grossMerchandisePaise: number;
  discountPaise: number;
  shiprocketCollectionPaise: number;
}

function requirePaise(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer paise amount`);
  }
  return value;
}

/**
 * Shiprocket subtracts total_discount from sub_total for COD collection.
 * Therefore sub_total must remain gross and the already-paid COD advance (or
 * a genuine prepaid discount) is represented exactly once as the discount.
 */
export function calculateShiprocketOrderAmounts(
  input: ShiprocketOrderAmountInput,
): ShiprocketOrderAmounts {
  const storedSubtotalPaise = requirePaise(input.storedSubtotalPaise, "Stored subtotal");
  const grossMerchandisePaise = input.items.reduce(
    (sum, item) =>
      sum +
      requirePaise(item.unitPricePaise, "Item unit price") *
        requirePaise(item.qty, "Item quantity"),
    0,
  );

  if (grossMerchandisePaise !== storedSubtotalPaise) {
    throw new Error(
      `Order item gross (${grossMerchandisePaise} paise) does not match stored subtotal (${storedSubtotalPaise} paise)`,
    );
  }

  const payablePaise = requirePaise(
    input.paymentMethod === "COD" ? input.codCollectablePaise : input.orderTotalPaise,
    input.paymentMethod === "COD" ? "COD collectable" : "Prepaid order total",
  );
  if (payablePaise > grossMerchandisePaise) {
    throw new Error("Shiprocket payable amount cannot exceed the gross merchandise subtotal");
  }

  const discountPaise = grossMerchandisePaise - payablePaise;
  return {
    grossMerchandisePaise,
    discountPaise,
    shiprocketCollectionPaise:
      input.paymentMethod === "COD" ? grossMerchandisePaise - discountPaise : 0,
  };
}

export function rupeesToPaise(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

export function paiseToRupees(valuePaise: number) {
  return requirePaise(valuePaise, "Amount") / 100;
}

export interface CourierWalletEstimateInput {
  rate: number;
  coverageCharge: number;
  otherCharges: number;
}

/**
 * Shiprocket's serviceability `rate` is treated as the base booking rate. The
 * response's freight and COD fields are breakdowns of that base, so adding
 * them again would double count. Coverage and other charges are additive in
 * the observed account response.
 */
export function calculateEstimatedWalletDebitPaise(input: CourierWalletEstimateInput) {
  return (
    rupeesToPaise(input.rate) +
    rupeesToPaise(input.coverageCharge) +
    rupeesToPaise(input.otherCharges)
  );
}

export function sortByEstimatedWalletDebit<
  T extends { estimatedWalletDebitPaise: number; id: number },
>(couriers: T[]) {
  return [...couriers].sort(
    (a, b) => a.estimatedWalletDebitPaise - b.estimatedWalletDebitPaise || a.id - b.id,
  );
}
