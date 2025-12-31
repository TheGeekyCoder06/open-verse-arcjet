import arcjet, {
  detectBot,
  shield,
  slidingWindow,
  tokenBucket,
} from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [],
});

/* ===========================
   LOGIN / AUTH
=========================== */

export const loginRules = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({ mode: "LIVE", allow: [] }),
    slidingWindow({
      mode: "LIVE",
      interval: "1m",
      max: 50,
    }),
  ],
});

/* ===========================
   BLOG — READ ACTIONS
=========================== */

export const blogReadRules = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    detectBot({ mode: "LIVE", allow: [] }),
    shield({ mode: "LIVE" }),
    slidingWindow({
      mode: "LIVE",
      interval: "1m",
      max: 100,
    }),
  ],
});

/* ===========================
   BLOG — WRITE ACTIONS
=========================== */

export const blogWriteRules = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    detectBot({ mode: "LIVE", allow: [] }),
    shield({ mode: "LIVE" }),
    slidingWindow({
      mode: "LIVE",
      interval: "1m",
      max: 20,
    }),
  ],
});

/* ===========================
   COMMENTS
=========================== */

export const commentRules = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    detectBot({ mode: "LIVE", allow: [] }),
    shield({ mode: "LIVE" }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 20,
      interval: "1m",
      capacity: 2,
    }),
  ],
});

/* ===========================
   SEARCH
=========================== */

export const searchRules = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    detectBot({ mode: "LIVE", allow: [] }),
    shield({ mode: "LIVE" }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 20,
      interval: "1m",
      capacity: 2,
    }),
  ],
});

export default aj;
