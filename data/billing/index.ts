import type { Invoice } from "@/types";
import { getCustomer, lineLabel } from "@/data/customers";

/** Demo usage and paid bundle costs for the three-month billing insight. */
export const SHEN_DATA_USAGE = [
  { month: "Aug", gb: 32, lteCharge: 485, topups: 8 },
  { month: "Sep", gb: 35, lteCharge: 549, topups: 10 },
  { month: "Oct", gb: 38, lteCharge: 613, topups: 12 },
] as const;

export const SHEN_LTE_AVG =
  Math.round(
    (SHEN_DATA_USAGE.reduce((s, r) => s + r.lteCharge, 0) /
      SHEN_DATA_USAGE.length) *
      100,
  ) / 100;

function shenLine(msisdn: string): string {
  return lineLabel("shen", msisdn);
}

/** Invoices always reference MSISDNs from CUSTOMERS via lineLabel. */
export const INVOICES: Invoice[] = [
  {
    id: "INV-2026-07-SIPHO",
    customerId: "sipho",
    month: "July",
    invoiceDate: "2026-07-05",
    dueDate: "2026-07-25",
    previousBalance: 40,
    paymentsReceived: 40,
    lineItems: [
      { label: "Monthly rental — 20GB Data", amount: 199 },
      { label: "Out-of-bundle data", amount: 72 },
      { label: "Voice usage", amount: 28 },
      { label: "VAS / third-party", amount: 15 },
    ],
    vat: 47.1,
    totalDue: 361.1,
  },
  {
    id: "INV-2026-08-SIPHO",
    customerId: "sipho",
    month: "August",
    invoiceDate: "2026-08-05",
    dueDate: "2026-08-25",
    previousBalance: 0,
    paymentsReceived: 0,
    lineItems: [
      { label: "Monthly rental — 20GB Data", amount: 199 },
      { label: "Out-of-bundle data", amount: 95 },
      { label: "Voice usage", amount: 35 },
      { label: "VAS / third-party", amount: 21 },
    ],
    vat: 52.5,
    totalDue: 402.5,
  },
  {
    id: "INV-2026-09-SIPHO",
    customerId: "sipho",
    month: "September",
    invoiceDate: "2026-09-05",
    dueDate: "2026-09-25",
    previousBalance: 0,
    paymentsReceived: 0,
    lineItems: [
      { label: "Monthly rental — 20GB Data", amount: 199 },
      { label: "Out-of-bundle data", amount: 120 },
      { label: "Voice usage", amount: 35 },
      { label: "VAS / third-party", amount: 21 },
    ],
    vat: 71,
    totalDue: 546,
  },
  {
    id: "INV-2026-04-SHEN",
    customerId: "shen",
    month: "April",
    invoiceDate: "2026-04-01",
    dueDate: "2026-05-05",
    previousBalance: 1308.9,
    paymentsReceived: 444.15,
    lineItems: [
      { label: shenLine("0671399999"), amount: 479.68 },
      { label: shenLine("0795731369"), amount: 229.5 },
      { label: shenLine("0682155585"), amount: 9.1 },
      { label: "Account subscriptions & once-off", amount: 104.0 },
    ],
    vat: 0,
    totalDue: 1687.03,
  },
  {
    id: "INV-2026-05-SHEN",
    customerId: "shen",
    month: "May",
    invoiceDate: "2026-05-01",
    dueDate: "2026-06-05",
    previousBalance: 1687.03,
    paymentsReceived: 864.75,
    lineItems: [
      { label: shenLine("0671399999"), amount: 479.68 },
      { label: shenLine("0795731369"), amount: 299.43 },
      { label: shenLine("0682155585"), amount: 9.1 },
      { label: "Account subscriptions & once-off", amount: 248.0 },
    ],
    vat: 0,
    totalDue: 1858.49,
  },
  {
    id: "INV-2026-06-SHEN",
    customerId: "shen",
    month: "June",
    invoiceDate: "2026-06-01",
    dueDate: "2026-07-06",
    previousBalance: 1858.49,
    paymentsReceived: 822.28,
    lineItems: [
      { label: shenLine("0671399999"), amount: 479.68 },
      { label: shenLine("0795731369"), amount: 267.88 },
      { label: shenLine("0682155585"), amount: 9.1 },
    ],
    vat: 0,
    totalDue: 1792.87,
  },
  {
    id: "INV-2026-07-SHEN",
    customerId: "shen",
    month: "July",
    invoiceDate: "2026-07-01",
    dueDate: "2026-07-31",
    previousBalance: 1792.87,
    paymentsReceived: 1036.21,
    lineItems: [
      { label: shenLine("0671399999"), amount: 479.68 },
      { label: shenLine("0795731369"), amount: 290.04 },
      { label: shenLine("0682155585"), amount: 9.1 },
      { label: shenLine("0754190038"), amount: 9.1 },
    ],
    vat: 0,
    totalDue: 1544.58,
  },
  {
    id: "B941251817",
    customerId: "shen",
    month: "August",
    invoiceDate: "2026-08-01",
    dueDate: "2026-08-31",
    previousBalance: 0,
    paymentsReceived: 0,
    lineItems: [
      { label: "20GB monthly data bundle", amount: 229 },
      { label: "8 × 1.5GB daily data bundles", amount: 256 },
    ],
    vat: 0,
    totalDue: 485,
  },
  {
    id: "B941251946",
    customerId: "shen",
    month: "September",
    invoiceDate: "2026-09-01",
    dueDate: "2026-09-30",
    previousBalance: 0,
    paymentsReceived: 0,
    lineItems: [
      { label: "20GB monthly data bundle", amount: 229 },
      { label: "10 × 1.5GB daily data bundles", amount: 320 },
    ],
    vat: 0,
    totalDue: 549,
  },
  {
    id: "B941252099",
    customerId: "shen",
    month: "October",
    invoiceDate: "2026-10-01",
    dueDate: "2026-10-31",
    previousBalance: 0,
    paymentsReceived: 0,
    lineItems: [
      { label: "20GB monthly data bundle", amount: 229 },
      { label: "12 × 1.5GB daily data bundles", amount: 384 },
    ],
    vat: 0,
    totalDue: 613,
  },
];

export function getInvoices(customerId: string): Invoice[] {
  return INVOICES.filter((i) => i.customerId === customerId);
}

export function getLatestInvoice(customerId: string): Invoice | undefined {
  const list = getInvoices(customerId);
  return list[list.length - 1];
}

export function getAccountNumber(customerId: string): string | undefined {
  return getCustomer(customerId)?.accountNumber;
}
