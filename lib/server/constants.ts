export const YOOMONEY_TOKEN =
  process.env.YOOMONEY_TOKEN ||
  "4100118889570559.5471FE93036FACB51259800442ED5D0F29CDED2C77B14C6871BF92A581C1F86ABA3F7E9F4E7C783BB985C11F23553601954C7CBC216A723FBD010627D92285A53E0F2EA68DA75C135BA0EBB318679FF772D2CF6FB9890E70B1E813B29EDF84FC7111B5D72C598E94655E77C679595195E44141B807535C9F23F47074C47A93AD";

export const YOOMONEY_WALLET = process.env.YOOMONEY_WALLET || "4100118889570559";

export const PLAN_DURATION: Record<string, number> = {
  "1_month": 30 * 24 * 3600,
  "3_month": 90 * 24 * 3600,
  "6_month": 180 * 24 * 3600,
  "12_month": 365 * 24 * 3600,
};

export const PRICES: Record<string, number> = {
  "1_month": 50,
  "3_month": 150,
  "6_month": 300,
  "12_month": 600,
};

export const PLANS = [
  { id: "1_month", title: "1 \u043C\u0435\u0441\u044F\u0446", price: 50, pricePerDay: "~1.7 \u20BD/\u0434\u0435\u043D\u044C" },
  { id: "3_month", title: "3 \u043C\u0435\u0441\u044F\u0446\u0430", price: 150, pricePerDay: "~1.7 \u20BD/\u0434\u0435\u043D\u044C", badge: "\u041F\u043E\u043F\u0443\u043B\u044F\u0440\u043D\u044B\u0439" },
  { id: "6_month", title: "6 \u043C\u0435\u0441\u044F\u0446\u0435\u0432", price: 300, pricePerDay: "~1.7 \u20BD/\u0434\u0435\u043D\u044C", badge: "\u0412\u044B\u0433\u043E\u0434\u043D\u043E" },
  { id: "12_month", title: "12 \u043C\u0435\u0441\u044F\u0446\u0435\u0432", price: 600, pricePerDay: "~1.6 \u20BD/\u0434\u0435\u043D\u044C", badge: "\u041B\u0443\u0447\u0448\u0430\u044F \u0446\u0435\u043D\u0430" },
];
