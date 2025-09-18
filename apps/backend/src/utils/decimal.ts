import { Decimal } from "@prisma/client/runtime/library";

export function toDecimal(value: Decimal.Value): Decimal {
  return new Decimal(value);
}

export function decimalSum(values: Decimal.Value[]): Decimal {
  return values.reduce<Decimal>((acc, current) => acc.add(new Decimal(current)), new Decimal(0));
}

export function isApproximatelyEqual(
  a: Decimal.Value,
  b: Decimal.Value,
  tolerance: Decimal.Value = "0.01"
): boolean {
  const diff = new Decimal(a).sub(new Decimal(b)).abs();
  return diff.lte(new Decimal(tolerance));
}

export function decimalToNumber(value: Decimal | Decimal.Value): number {
  const decimalValue = value instanceof Decimal ? value : new Decimal(value);
  return Number(decimalValue.toFixed(2));
}

export { Decimal };