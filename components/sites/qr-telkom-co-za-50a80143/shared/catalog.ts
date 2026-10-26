export const ASSET = "/sites/qr-telkom-co-za-50a80143/shared";

/** Live Vodacom QR portal catalogue (salesfulfillment eligibility, Sep 2026). */
export type TopUpProduct =
  | "Summer Deals"
  | "Data"
  | "Airtime"
  | "Powerflex"
  | "Voice"
  | "Social Bundles"
  | "Chat Bundles"
  | "Data Bundles"
  | "SMS/MMS Bundles"
  | "Streaming Bundles"
  | "Vodacom Mobile Data Bundles"
  | "TikTok Bundles - Once Off"
  | "WhatsApp Bundles Once-off";

export const TOPUP_PRODUCTS: TopUpProduct[] = [
  "Summer Deals",
  "Data",
  "Airtime",
  "Powerflex",
  "Voice",
];

export type BundleType =
  | "Hourly"
  | "Daily"
  | "3 Day"
  | "Weekly"
  | "Weekend"
  | "Monthly"
  | "Once Off"
  | "SMS/MMS Bundles";

export const BUNDLE_TYPE_ORDER: BundleType[] = [
  "Hourly",
  "Daily",
  "3 Day",
  "Weekly",
  "Weekend",
  "Monthly",
  "Once Off",
  "SMS/MMS Bundles",
];

export interface TopUpBundle {
  id: string;
  product: TopUpProduct;
  type: BundleType;
  label: string;
  volume: string;
  /** -1 = unlimited */
  volumeMb: number;
  price: number;
  unlimited?: boolean;
}

function b(
  partial: Omit<TopUpBundle, "label" | "unlimited"> & {
    label?: string;
    unlimited?: boolean;
  },
): TopUpBundle {
  return {
    ...partial,
    label: partial.label ?? partial.product,
    unlimited: partial.unlimited ?? partial.volumeMb < 0,
  };
}

export const LEGACY_TOPUP_BUNDLES: TopUpBundle[] = [
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-DAY-25-MB-1",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Day 25 MB",
    volumeMb: 25,
    price: 3.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-DAY-50-MB-2",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Day 50 MB",
    volumeMb: 50,
    price: 4.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-DAY75-MB-4",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Day75 MB",
    volumeMb: 75,
    price: 5.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-DAY-100-MB-10",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Day 100 MB",
    volumeMb: 100,
    price: 6.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-WEEK-75-MB-11",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Week 75 MB",
    volumeMb: 75,
    price: 6.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-WEEK-100-MB-17",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Week 100 MB",
    volumeMb: 100,
    price: 10.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-MONTH-100-MB-19",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Month 100 MB",
    volumeMb: 100,
    price: 11.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-WEEK-250-MB-22",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Week 250 MB",
    volumeMb: 250,
    price: 11.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-DAY-250-MB-27",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Day 250 MB",
    volumeMb: 250,
    price: 12.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-DAY-500-MB-28",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Day 500 MB",
    volumeMb: 500,
    price: 12.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-MONTH-250-MB-37",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Month 250 MB",
    volumeMb: 250,
    price: 17.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-WEEK-500-MB-41",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Week 500 MB",
    volumeMb: 500,
    price: 20.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-MONTH-500-MB-49",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Month 500 MB",
    volumeMb: 500,
    price: 30.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-WEEK-1-GB-58",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Week 1 GB",
    volumeMb: 1024,
    price: 37.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-MONTH-1-GB-63",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Month 1 GB",
    volumeMb: 1024,
    price: 42.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-WEEK-2-GB-74",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Week 2 GB",
    volumeMb: 2048,
    price: 63.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-MONTH-2-GB-76",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Month 2 GB",
    volumeMb: 2048,
    price: 74.0,
  }),
  b({
    id: "TU-SOCIAL-ONCE-OFF-1-MONTH-3-GB-91",
    product: "Social Bundles",
    type: "Once Off",
    volume: "1 Month 3 GB",
    volumeMb: 3072,
    price: 105.0,
  }),
  b({
    id: "TU-CHAT-B-MONTHLY-RECURRING-250MB-38",
    product: "Chat Bundles",
    type: "Monthly",
    volume: "Recurring 250MB",
    volumeMb: 250,
    price: 17.0,
  }),
  b({
    id: "TU-CHAT-B-MONTHLY-RECURRING-500MB-51",
    product: "Chat Bundles",
    type: "Monthly",
    volume: "Recurring 500MB",
    volumeMb: 500,
    price: 30.0,
  }),
  b({
    id: "TU-CHAT-B-MONTHLY-RECURRING-1GB-66",
    product: "Chat Bundles",
    type: "Monthly",
    volume: "Recurring 1GB",
    volumeMb: 1024,
    price: 48.0,
  }),
  b({
    id: "TU-CHAT-B-MONTHLY-RECURRING-2GB-81",
    product: "Chat Bundles",
    type: "Monthly",
    volume: "Recurring 2GB",
    volumeMb: 2048,
    price: 80.0,
  }),
  b({
    id: "TU-CHAT-B-ONCE-OFF-DAILY-50MB-3",
    product: "Chat Bundles",
    type: "Once Off",
    volume: "Daily 50MB",
    volumeMb: 50,
    price: 4.0,
  }),
  b({
    id: "TU-CHAT-B-ONCE-OFF-DAILY-100MB-8",
    product: "Chat Bundles",
    type: "Once Off",
    volume: "Daily 100MB",
    volumeMb: 100,
    price: 6.0,
  }),
  b({
    id: "TU-CHAT-B-ONCE-OFF-WEEKLY-100MB-16",
    product: "Chat Bundles",
    type: "Once Off",
    volume: "Weekly 100MB",
    volumeMb: 100,
    price: 10.0,
  }),
  b({
    id: "TU-CHAT-B-ONCE-OFF-DAILY-250MB-24",
    product: "Chat Bundles",
    type: "Once Off",
    volume: "Daily 250MB",
    volumeMb: 250,
    price: 12.0,
  }),
  b({
    id: "TU-CHAT-B-ONCE-OFF-WEEKLY-250MB-25",
    product: "Chat Bundles",
    type: "Once Off",
    volume: "Weekly 250MB",
    volumeMb: 250,
    price: 12.0,
  }),
  b({
    id: "TU-CHAT-B-ONCE-OFF-DAILY-500MB-35",
    product: "Chat Bundles",
    type: "Once Off",
    volume: "Daily 500MB",
    volumeMb: 500,
    price: 17.0,
  }),
  b({
    id: "TU-CHAT-B-ONCE-OFF-MONTHLY-250MB-36",
    product: "Chat Bundles",
    type: "Once Off",
    volume: "Monthly 250MB",
    volumeMb: 250,
    price: 17.0,
  }),
  b({
    id: "TU-CHAT-B-ONCE-OFF-WEEKLY-500MB-39",
    product: "Chat Bundles",
    type: "Once Off",
    volume: "Weekly 500MB",
    volumeMb: 500,
    price: 19.0,
  }),
  b({
    id: "TU-CHAT-B-ONCE-OFF-MONTHLY-500MB-48",
    product: "Chat Bundles",
    type: "Once Off",
    volume: "Monthly 500MB",
    volumeMb: 500,
    price: 30.0,
  }),
  b({
    id: "TU-CHAT-B-ONCE-OFF-WEEKLY-1GB-59",
    product: "Chat Bundles",
    type: "Once Off",
    volume: "Weekly 1GB",
    volumeMb: 1024,
    price: 38.0,
  }),
  b({
    id: "TU-CHAT-B-ONCE-OFF-MONTHLY1GB-65",
    product: "Chat Bundles",
    type: "Once Off",
    volume: "Monthly1GB",
    volumeMb: 1024,
    price: 48.0,
  }),
  b({
    id: "TU-CHAT-B-ONCE-OFF-MONTHLY-2GB-80",
    product: "Chat Bundles",
    type: "Once Off",
    volume: "Monthly 2GB",
    volumeMb: 2048,
    price: 80.0,
  }),
  b({
    id: "TU-DATA-H-150",
    product: "Data Bundles",
    type: "Hourly",
    volume: "150MB",
    volumeMb: 150,
    price: 5.5,
  }),
  b({
    id: "TU-DATA-H-300",
    product: "Data Bundles",
    type: "Hourly",
    volume: "300MB",
    volumeMb: 300,
    price: 9.0,
  }),
  b({
    id: "TU-DATA-B-WEEKLY-50MB-7",
    product: "Data Bundles",
    type: "Weekly",
    volume: "50MB",
    volumeMb: 50,
    price: 6.0,
  }),
  b({
    id: "TU-DATA-B-WEEKLY-100MB-32",
    product: "Data Bundles",
    type: "Weekly",
    volume: "100MB",
    volumeMb: 100,
    price: 16.0,
  }),
  b({
    id: "TU-DATA-B-WEEKLY-250MB-53",
    product: "Data Bundles",
    type: "Weekly",
    volume: "250MB",
    volumeMb: 250,
    price: 32.0,
  }),
  b({
    id: "TU-DATA-B-WEEKLY-500MB-70",
    product: "Data Bundles",
    type: "Weekly",
    volume: "500MB",
    volumeMb: 500,
    price: 53.0,
  }),
  b({
    id: "TU-DATA-B-WEEKLY-1GB-78",
    product: "Data Bundles",
    type: "Weekly",
    volume: "1GB",
    volumeMb: 1024,
    price: 79.0,
  }),
  b({
    id: "TU-DATA-B-WEEKLY-2GB-90",
    product: "Data Bundles",
    type: "Weekly",
    volume: "2GB",
    volumeMb: 2048,
    price: 105.0,
  }),
  b({
    id: "TU-DATA-B-WEEKEND-100MB-23",
    product: "Data Bundles",
    type: "Weekend",
    volume: "100MB",
    volumeMb: 100,
    price: 12.0,
  }),
  b({
    id: "TU-DATA-B-WEEKEND-200MB-40",
    product: "Data Bundles",
    type: "Weekend",
    volume: "200MB",
    volumeMb: 200,
    price: 20.0,
  }),
  b({
    id: "TU-DATA-B-WEEKEND-500MB-52",
    product: "Data Bundles",
    type: "Weekend",
    volume: "500MB",
    volumeMb: 500,
    price: 31.0,
  }),
  b({
    id: "TU-DATA-B-WEEKEND-1GB-67",
    product: "Data Bundles",
    type: "Weekend",
    volume: "1GB",
    volumeMb: 1024,
    price: 52.0,
  }),
  b({
    id: "TU-DATA-B-MONTHLY-25MB-34",
    product: "Data Bundles",
    type: "Monthly",
    volume: "25MB",
    volumeMb: 25,
    price: 16.0,
  }),
  b({
    id: "TU-DATA-B-MONTHLY-50MB-44",
    product: "Data Bundles",
    type: "Monthly",
    volume: "50MB",
    volumeMb: 50,
    price: 21.5,
  }),
  b({
    id: "TU-DATA-B-MONTHLY-100MB-54",
    product: "Data Bundles",
    type: "Monthly",
    volume: "100MB",
    volumeMb: 100,
    price: 32.0,
  }),
  b({
    id: "TU-DATA-B-MONTHLY-150MB-56",
    product: "Data Bundles",
    type: "Monthly",
    volume: "150MB",
    volumeMb: 150,
    price: 35.0,
  }),
  b({
    id: "TU-DATA-B-MONTHLY-300MB-RECURRING-64",
    product: "Data Bundles",
    type: "Monthly",
    volume: "300MB Recurring",
    volumeMb: 300,
    price: 45.0,
  }),
  b({
    id: "TU-DATA-B-MONTHLY-250MB-71",
    product: "Data Bundles",
    type: "Monthly",
    volume: "250MB",
    volumeMb: 250,
    price: 53.0,
  }),
  b({
    id: "TU-DATA-B-MONTHLY-600MB-79",
    product: "Data Bundles",
    type: "Monthly",
    volume: "600MB",
    volumeMb: 600,
    price: 79.0,
  }),
  b({
    id: "TU-DATA-B-MONTHLY-900MB-83",
    product: "Data Bundles",
    type: "Monthly",
    volume: "900MB",
    volumeMb: 900,
    price: 89.0,
  }),
  b({
    id: "TU-DATA-B-MONTHLY-1GB-88",
    product: "Data Bundles",
    type: "Monthly",
    volume: "1GB",
    volumeMb: 1024,
    price: 100.0,
  }),
  b({
    id: "TU-DATA-B-MONTHLY-500MB-86",
    product: "Data Bundles",
    type: "Monthly",
    volume: "500MB",
    volumeMb: 500,
    price: 100.0,
  }),
  b({
    id: "TU-DATA-B-MONTHLY-2GB-94",
    product: "Data Bundles",
    type: "Monthly",
    volume: "2GB",
    volumeMb: 2048,
    price: 140.0,
  }),
  b({
    id: "TU-DATA-B-MONTHLY-3GB-99",
    product: "Data Bundles",
    type: "Monthly",
    volume: "3GB",
    volumeMb: 3072,
    price: 210.0,
  }),
  b({
    id: "TU-DATA-B-MONTHLY-5GB-103",
    product: "Data Bundles",
    type: "Monthly",
    volume: "5GB",
    volumeMb: 5120,
    price: 301.0,
  }),
  b({
    id: "TU-DATA-B-ONCE-OFF-35-MB-35-MB-13",
    product: "Data Bundles",
    type: "Once Off",
    volume: "35 MB + 35 MB",
    volumeMb: 35,
    price: 7.5,
  }),
  b({
    id: "TU-DATA-B-ONCE-OFF-75-MB-75-MB-31",
    product: "Data Bundles",
    type: "Once Off",
    volume: "75 MB + 75 MB",
    volumeMb: 75,
    price: 15.0,
  }),
  b({
    id: "TU-DATA-B-ONCE-OFF-150-MB-150-MB-47",
    product: "Data Bundles",
    type: "Once Off",
    volume: "150 MB + 150 MB",
    volumeMb: 150,
    price: 27.0,
  }),
  b({
    id: "TU-DATA-B-ONCE-OFF-300-MB-300-MB-68",
    product: "Data Bundles",
    type: "Once Off",
    volume: "300 MB + 300 MB",
    volumeMb: 300,
    price: 52.0,
  }),
  b({
    id: "TU-DATA-B-ONCE-OFF-500-MB-500-MB-75",
    product: "Data Bundles",
    type: "Once Off",
    volume: "500 MB + 500 MB",
    volumeMb: 500,
    price: 72.0,
  }),
  b({
    id: "TU-DATA-B-ONCE-OFF-1-2-GB-1-2-GB-77",
    product: "Data Bundles",
    type: "Once Off",
    volume: "1.2 GB + 1.2 GB",
    volumeMb: 1229,
    price: 79.0,
  }),
  b({
    id: "TU-DATA-B-ONCE-OFF-1-5-GB-1-5-GB-82",
    product: "Data Bundles",
    type: "Once Off",
    volume: "1.5 GB + 1.5 GB",
    volumeMb: 1536,
    price: 89.0,
  }),
  b({
    id: "TU-DATA-B-ONCE-OFF-2-5-GB-2-5-GB-95",
    product: "Data Bundles",
    type: "Once Off",
    volume: "2.5 GB + 2.5 GB",
    volumeMb: 2560,
    price: 149.0,
  }),
  b({
    id: "TU-DATA-B-ONCE-OFF-3-5-GB-3-5-GB-97",
    product: "Data Bundles",
    type: "Once Off",
    volume: "3.5 GB + 3.5 GB",
    volumeMb: 3584,
    price: 209.0,
  }),
  b({
    id: "TU-DATA-B-ONCE-OFF-5-5-GB-5-5-GB-102",
    product: "Data Bundles",
    type: "Once Off",
    volume: "5.5 GB + 5.5 GB",
    volumeMb: 5632,
    price: 299.0,
  }),
  b({
    id: "TU-DATA-B-ONCE-OFF-12-GB-12-GB-107",
    product: "Data Bundles",
    type: "Once Off",
    volume: "12 GB + 12 GB",
    volumeMb: 12288,
    price: 499.0,
  }),
  b({
    id: "TU-DATA-B-ONCE-OFF-20-GB-108",
    product: "Data Bundles",
    type: "Once Off",
    volume: "20 GB",
    volumeMb: 20480,
    price: 599.0,
  }),
  b({
    id: "TU-DATA-B-ONCE-OFF-50-GB-109",
    product: "Data Bundles",
    type: "Once Off",
    volume: "50 GB",
    volumeMb: 51200,
    price: 699.0,
  }),
  b({
    id: "TU-DATA-B-ONCE-OFF-100-GB-110",
    product: "Data Bundles",
    type: "Once Off",
    volume: "100 GB",
    volumeMb: 102400,
    price: 999.0,
  }),
  b({
    id: "TU-SMS-MM-SMS-MMS-BUNDLES-50-46",
    product: "SMS/MMS Bundles",
    type: "SMS/MMS Bundles",
    volume: "50",
    volumeMb: 50,
    price: 25.0,
  }),
  b({
    id: "TU-SMS-MM-SMS-MMS-BUNDLES-100-60",
    product: "SMS/MMS Bundles",
    type: "SMS/MMS Bundles",
    volume: "100",
    volumeMb: 100,
    price: 40.0,
  }),
  b({
    id: "TU-SMS-MM-SMS-MMS-BUNDLES-200-72",
    product: "SMS/MMS Bundles",
    type: "SMS/MMS Bundles",
    volume: "200",
    volumeMb: 200,
    price: 57.0,
  }),
  b({
    id: "TU-SMS-MM-SMS-MMS-BUNDLES-500-92",
    product: "SMS/MMS Bundles",
    type: "SMS/MMS Bundles",
    volume: "500",
    volumeMb: 500,
    price: 125.0,
  }),
  b({
    id: "TU-SMS-MM-SMS-MMS-BUNDLES-1000-100",
    product: "SMS/MMS Bundles",
    type: "SMS/MMS Bundles",
    volume: "1000",
    volumeMb: 1000,
    price: 239.0,
  }),
  b({
    id: "TU-SMS-MM-SMS-MMS-BUNDLES-1500-104",
    product: "SMS/MMS Bundles",
    type: "SMS/MMS Bundles",
    volume: "1500",
    volumeMb: 1500,
    price: 339.0,
  }),
  b({
    id: "TU-SMS-MM-SMS-MMS-BUNDLES-2000-106",
    product: "SMS/MMS Bundles",
    type: "SMS/MMS Bundles",
    volume: "2000",
    volumeMb: 2000,
    price: 449.0,
  }),
  b({
    id: "TU-STREAM-MONTHLY-STREAMING-MUSIC-87",
    product: "Streaming Bundles",
    type: "Monthly",
    volume: "Streaming Music",
    volumeMb: 0,
    price: 100.0,
  }),
  b({
    id: "TU-STREAM-ONCE-OFF-STREAMING-100MB-1-DAY-14",
    product: "Streaming Bundles",
    type: "Once Off",
    volume: "Streaming 100MB - 1 Day",
    volumeMb: 100,
    price: 8.0,
  }),
  b({
    id: "TU-STREAM-ONCE-OFF-STREAMING-500MB-1-DAY-42",
    product: "Streaming Bundles",
    type: "Once Off",
    volume: "Streaming 500MB - 1 Day",
    volumeMb: 500,
    price: 21.0,
  }),
  b({
    id: "TU-STREAM-ONCE-OFF-STREAMING-1GB-1-WEEK-62",
    product: "Streaming Bundles",
    type: "Once Off",
    volume: "Streaming 1GB - 1 Week",
    volumeMb: 1024,
    price: 42.0,
  }),
  b({
    id: "TU-STREAM-ONCE-OFF-STREAMING-2GB-1-DAY-69",
    product: "Streaming Bundles",
    type: "Once Off",
    volume: "Streaming 2GB - 1 Day",
    volumeMb: 2048,
    price: 53.0,
  }),
  b({
    id: "TU-STREAM-ONCE-OFF-STREAMING-1GB-1-MONTH-73",
    product: "Streaming Bundles",
    type: "Once Off",
    volume: "Streaming 1GB - 1 Month",
    volumeMb: 1024,
    price: 63.0,
  }),
  b({
    id: "TU-STREAM-ONCE-OFF-STREAMING-MUSIC-84",
    product: "Streaming Bundles",
    type: "Once Off",
    volume: "Streaming Music",
    volumeMb: 0,
    price: 100.0,
  }),
  b({
    id: "TU-STREAM-ONCE-OFF-STREAMING-3GB-1-WEEK-89",
    product: "Streaming Bundles",
    type: "Once Off",
    volume: "Streaming 3GB - 1 Week",
    volumeMb: 3072,
    price: 105.0,
  }),
  b({
    id: "TU-STREAM-ONCE-OFF-STREAMING-5GB-1-WEEK-96",
    product: "Streaming Bundles",
    type: "Once Off",
    volume: "Streaming 5GB - 1 Week",
    volumeMb: 5120,
    price: 158.0,
  }),
  b({
    id: "TU-STREAM-ONCE-OFF-STREAMING-5GB-1-MONTH-98",
    product: "Streaming Bundles",
    type: "Once Off",
    volume: "Streaming 5GB - 1 Month",
    volumeMb: 5120,
    price: 210.0,
  }),
  b({
    id: "TU-STREAM-ONCE-OFF-STREAMING-10GB-1-MONTH-101",
    product: "Streaming Bundles",
    type: "Once Off",
    volume: "Streaming 10GB - 1 Month",
    volumeMb: 10240,
    price: 294.0,
  }),
  b({
    id: "TU-STREAM-ONCE-OFF-STREAMING-25GB-1-MONTH-105",
    product: "Streaming Bundles",
    type: "Once Off",
    volume: "Streaming 25GB - 1 Month",
    volumeMb: 25600,
    price: 368.0,
  }),
  b({
    id: "TU-VODACOM-ONCE-OFF-100-GB-NIGHT-SURFER-93",
    product: "Vodacom Mobile Data Bundles",
    type: "Once Off",
    volume: "100 GB Night Surfer",
    volumeMb: 102400,
    price: 135.0,
  }),
  b({
    id: "TU-TT-D-150",
    product: "TikTok Bundles - Once Off",
    type: "Once Off",
    volume: "Daily 150MB",
    volumeMb: 150,
    price: 6.0,
  }),
  b({
    id: "TU-TT-D-300",
    product: "TikTok Bundles - Once Off",
    type: "Once Off",
    volume: "Daily 300MB",
    volumeMb: 300,
    price: 11.0,
  }),
  b({
    id: "TU-TIKTOK-ONCE-OFF-WEEKEND-250MB-21",
    product: "TikTok Bundles - Once Off",
    type: "Once Off",
    volume: "Weekend 250MB",
    volumeMb: 250,
    price: 11.0,
  }),
  b({
    id: "TU-TIKTOK-ONCE-OFF-WEEKLY-300MB-30",
    product: "TikTok Bundles - Once Off",
    type: "Once Off",
    volume: "Weekly 300MB",
    volumeMb: 300,
    price: 15.0,
  }),
  b({
    id: "TU-TIKTOK-ONCE-OFF-WEEKEND-500MB-33",
    product: "TikTok Bundles - Once Off",
    type: "Once Off",
    volume: "Weekend 500MB",
    volumeMb: 500,
    price: 16.0,
  }),
  b({
    id: "TU-TIKTOK-ONCE-OFF-WEEKLY-600MB-45",
    product: "TikTok Bundles - Once Off",
    type: "Once Off",
    volume: "Weekly 600MB",
    volumeMb: 600,
    price: 22.0,
  }),
  b({
    id: "TU-TIKTOK-ONCE-OFF-MONTHLY-1GB-57",
    product: "TikTok Bundles - Once Off",
    type: "Once Off",
    volume: "Monthly 1GB",
    volumeMb: 1024,
    price: 37.0,
  }),
  b({
    id: "TU-WA-D-150",
    product: "WhatsApp Bundles Once-off",
    type: "Daily",
    volume: "Daily 150MB",
    volumeMb: 150,
    price: 6.0,
  }),
  b({
    id: "TU-WA-D-300",
    product: "WhatsApp Bundles Once-off",
    type: "Daily",
    volume: "Daily 300MB",
    volumeMb: 300,
    price: 11.0,
  }),
  b({
    id: "TU-WA-D-UNL",
    product: "WhatsApp Bundles Once-off",
    type: "Daily",
    volume: "Daily unilimited",
    volumeMb: 0,
    price: 15.0,
  }),
  b({
    id: "TU-WHATSA-3-DAY-3-DAY-175MB-12",
    product: "WhatsApp Bundles Once-off",
    type: "3 Day",
    volume: "3-Day 175MB",
    volumeMb: 175,
    price: 7.0,
  }),
  b({
    id: "TU-WHATSA-WEEKLY-WEEKLY-300MB-26",
    product: "WhatsApp Bundles Once-off",
    type: "Weekly",
    volume: "Weekly 300MB",
    volumeMb: 300,
    price: 12.0,
  }),
  b({
    id: "TU-WHATSA-WEEKLY-WEEKLY-750MB-43",
    product: "WhatsApp Bundles Once-off",
    type: "Weekly",
    volume: "Weekly 750MB",
    volumeMb: 750,
    price: 21.0,
  }),
  b({
    id: "TU-WHATSA-WEEKLY-WEEKLY-UNLIMITED-55",
    product: "WhatsApp Bundles Once-off",
    type: "Weekly",
    volume: "Weekly Unlimited",
    volumeMb: -1,
    price: 35.0,
    unlimited: true,
  }),
  b({
    id: "TU-WHATSA-MONTHLY-MONTHLY-1GB-50",
    product: "WhatsApp Bundles Once-off",
    type: "Monthly",
    volume: "Monthly 1GB",
    volumeMb: 1024,
    price: 30.0,
  }),
  b({
    id: "TU-WHATSA-MONTHLY-MONTHLY-1-5GB-61",
    product: "WhatsApp Bundles Once-off",
    type: "Monthly",
    volume: "Monthly 1.5GB",
    volumeMb: 1536,
    price: 41.0,
  }),
  b({
    id: "TU-WHATSA-MONTHLY-MONTHLY-UNLIMITED-85",
    product: "WhatsApp Bundles Once-off",
    type: "Monthly",
    volume: "Monthly Unlimited",
    volumeMb: -1,
    price: 100.0,
    unlimited: true,
  }),
];

// Current public Vodacom prepaid catalogue. Airtime remains an entry point;
// this page does not invent denominations not listed on the referenced page.
export const TOPUP_BUNDLES: TopUpBundle[] = [
  ...[
    ["SUMMER-7-5", "7.5GB + 7.5GB Night Owl", 7680, 99],
    ["SUMMER-15", "15GB + 15GB Night Owl", 15360, 169],
    ["SUMMER-30", "30GB + 30GB Night Owl", 30720, 249],
    ["SUMMER-75", "75GB + 75GB Night Owl", 76800, 399],
  ].map(([id, volume, volumeMb, price]) =>
    b({ id: String(id), product: "Summer Deals", type: "Monthly", label: "VodaPay exclusive", volume: String(volume), volumeMb: Number(volumeMb), price: Number(price) }),
  ),
  ...[
    ["DATA-M-5", "5GB + 5GB Night Owl", 5120, 99],
    ["DATA-M-10", "10GB + 10GB Night Owl", 10240, 149],
    ["DATA-M-20", "20GB + 20GB Night Owl", 20480, 229],
    ["DATA-M-50", "50GB + 50GB Night Owl", 51200, 349],
  ].map(([id, volume, volumeMb, price]) =>
    b({ id: String(id), product: "Data", type: "Monthly", label: "Monthly recurring · 30 days", volume: String(volume), volumeMb: Number(volumeMb), price: Number(price) }),
  ),
  ...[
    ["DATA-W-1-5", "1.5GB + 1.5GB Night Owl", 1536, 29],
    ["DATA-W-5", "5GB + 5GB Night Owl", 5120, 49],
  ].map(([id, volume, volumeMb, price]) =>
    b({ id: String(id), product: "Data", type: "Weekly", label: "Once-off · 7 days", volume: String(volume), volumeMb: Number(volumeMb), price: Number(price) }),
  ),
  ...[
    ["DATA-D-250", "250MB · 1 hour", 250, 5],
    ["DATA-D-1", "1GB · 1 hour", 1024, 12],
    ["DATA-D-200", "200MB · until midnight", 200, 5],
    ["DATA-D-500", "500MB · until midnight", 500, 10],
    ["DATA-D-3", "3GB · until midnight", 3072, 32],
  ].map(([id, volume, volumeMb, price]) =>
    b({ id: String(id), product: "Data", type: "Daily", label: "Data once-off", volume: String(volume), volumeMb: Number(volumeMb), price: Number(price) }),
  ),
  ...[
    ["PF-5-300", "5GB + 300 minutes", 5120, 199],
    ["PF-20", "20GB", 20480, 229],
    ["PF-10-300", "10GB + 300 minutes", 10240, 249],
    ["PF-20-300", "20GB + 300 minutes", 20480, 299],
    ["PF-10-600", "10GB + 600 minutes", 10240, 329],
    ["PF-20-1000", "20GB + 1000 minutes", 20480, 399],
  ].map(([id, volume, volumeMb, price]) =>
    b({ id: String(id), product: "Powerflex", type: "Monthly", label: "PowerFlex", volume: String(volume), volumeMb: Number(volumeMb), price: Number(price) }),
  ),
  ...[
    ["VOICE-M-100", "100 minutes", 0, 50],
    ["VOICE-M-250", "250 minutes", 0, 100],
    ["VOICE-M-900", "900 minutes", 0, 250],
  ].map(([id, volume, volumeMb, price]) =>
    b({ id: String(id), product: "Voice", type: "Monthly", label: "Voice bundle", volume: String(volume), volumeMb: Number(volumeMb), price: Number(price) }),
  ),
  ...[
    ["VOICE-D-30", "30 min · Vodacom to Vodacom", 0, 3],
    ["VOICE-D-60V", "60 min · Vodacom to Vodacom", 0, 5],
    ["VOICE-D-60A", "60 min · any network", 0, 12],
    ["VOICE-D-UNL", "Unlimited · any network", -1, 15],
  ].map(([id, volume, volumeMb, price]) =>
    b({ id: String(id), product: "Voice", type: "Daily", label: "Valid until midnight", volume: String(volume), volumeMb: Number(volumeMb), price: Number(price) }),
  ),
];

export function getTopUpBundle(id: string): TopUpBundle | undefined {
  return TOPUP_BUNDLES.find((x) => x.id === id);
}

export function shelfBundles(
  product: TopUpProduct,
  type: BundleType,
): TopUpBundle[] {
  return TOPUP_BUNDLES.filter((x) => x.product === product && x.type === type);
}

export interface MoniceOffer {
  id: string;
  category: "Voice Offers" | "Data Offers" | "Combo Offers";
  title: string;
  volumeMb: number;
  price: number;
  validityDays: number;
}

export const MONICE_OFFERS: MoniceOffer[] = [
  {
    id: "MN-335MB",
    category: "Data Offers",
    title: "335MB Vodacom Data @R5.73 (3 Days) validity",
    volumeMb: 335,
    price: 5.73,
    validityDays: 3,
  },
  {
    id: "MN-1.2GB",
    category: "Data Offers",
    title: "1.2GB Vodacom Data @R22.19 (5 Days) validity",
    volumeMb: 1229,
    price: 22.19,
    validityDays: 5,
  },
  {
    id: "MN-1GB-7D",
    category: "Data Offers",
    title: "1GB Vodacom Data @R19.71 (7 Days) validity",
    volumeMb: 1024,
    price: 19.71,
    validityDays: 7,
  },
  {
    id: "MN-1GB-5D",
    category: "Data Offers",
    title: "1GB Vodacom Data @R16.98 (5 Days) validity",
    volumeMb: 1024,
    price: 16.98,
    validityDays: 5,
  },
  {
    id: "MN-VOICE-50",
    category: "Voice Offers",
    title: "50 Min Vodacom Voice @R12.00 (7 Days) validity",
    volumeMb: 0,
    price: 12,
    validityDays: 7,
  },
  {
    id: "MN-COMBO-1",
    category: "Combo Offers",
    title: "500MB + 25 Min @R29.00 (7 Days) validity",
    volumeMb: 500,
    price: 29,
    validityDays: 7,
  },
];

export function randPerGb(price: number, volumeMb: number): number {
  if (volumeMb <= 0) return Number.POSITIVE_INFINITY;
  return (price / volumeMb) * 1024;
}
