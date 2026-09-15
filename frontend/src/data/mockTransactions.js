// Initial mock transactions specified in Section 16
export const initialMockTransactions = [
  {
    transaction_id: "TX-1001",
    timestamp: "10:48:12",
    amount: 450,
    merchant: "Amazon",
    location: "Mumbai",
    device: "mobile",
    payment_method: "UPI",
    fraud_probability: 0.021,
    anomaly_score: 0.052,
    risk_score: 0.031,
    risk_level: "LOW",
    is_suspicious: false,
    prediction: "LEGITIMATE",
    explanation: []
  },
  {
    transaction_id: "TX-1002",
    timestamp: "10:48:18",
    amount: 8500,
    merchant: "Unknown Merchant",
    location: "Delhi",
    device: "desktop",
    payment_method: "CARD",
    fraud_probability: 0.682,
    anomaly_score: 0.614,
    risk_score: 0.662,
    risk_level: "HIGH",
    is_suspicious: true,
    prediction: "FRAUD",
    explanation: [
      "Unusual transaction amount",
      "Unknown merchant",
      "Anomalous transaction pattern"
    ]
  },
  {
    transaction_id: "TX-1003",
    timestamp: "10:48:24",
    amount: 95000,
    merchant: "Unknown Merchant",
    location: "Dubai",
    device: "new_device",
    payment_method: "CARD",
    fraud_probability: 0.941,
    anomaly_score: 0.887,
    risk_score: 0.925,
    risk_level: "CRITICAL",
    is_suspicious: true,
    prediction: "FRAUD",
    explanation: [
      "Transaction amount is unusually high",
      "New device detected",
      "Unusual transaction location",
      "Highly anomalous transaction pattern"
    ]
  }
];

let nextTxId = 1004;

const MERCHANTS = [
  { name: "Amazon India", category: "Retail", defaultRisk: "LOW" },
  { name: "Flipkart", category: "Retail", defaultRisk: "LOW" },
  { name: "Swiggy", category: "Food", defaultRisk: "LOW" },
  { name: "Apple Store", category: "Electronics", defaultRisk: "MEDIUM" },
  { name: "Netflix", category: "Entertainment", defaultRisk: "LOW" },
  { name: "Unknown Merchant", category: "Unknown", defaultRisk: "HIGH" },
  { name: "Crypto Exchange Global", category: "Finance", defaultRisk: "CRITICAL" },
  { name: "Uber Rides", category: "Transport", defaultRisk: "LOW" }
];

const LOCATIONS = ["Mumbai", "Bangalore", "Delhi", "Hyderabad", "London, UK", "Dubai, UAE", "Singapore"];
const DEVICES = ["mobile", "desktop", "new_device"];
const PAYMENT_METHODS = ["UPI", "CARD", "NETBANKING"];

function formatCurrentTime() {
  const d = new Date();
  return d.toTimeString().split(" ")[0];
}

// Auto-generated mock transaction generator (Section 17)
export function generateMockTransaction() {
  const id = `TX-${nextTxId++}`;
  const time = formatCurrentTime();
  const rand = Math.random();

  let riskLevel = "LOW";
  let prediction = "LEGITIMATE";
  let fraudProb = 0.01 + Math.random() * 0.15;
  let anomalyScore = 0.02 + Math.random() * 0.18;
  let amount = Math.floor(100 + Math.random() * 2500);
  let merchant = MERCHANTS[Math.floor(Math.random() * 5)].name;
  let location = LOCATIONS[Math.floor(Math.random() * 4)];
  let device = "mobile";
  let paymentMethod = PAYMENT_METHODS[Math.floor(Math.random() * 2)];
  let explanations = [];

  if (rand > 0.88) {
    // CRITICAL
    riskLevel = "CRITICAL";
    prediction = "FRAUD";
    amount = Math.floor(65000 + Math.random() * 85000);
    merchant = "Unknown Merchant";
    location = Math.random() > 0.5 ? "Dubai, UAE" : "Unknown International";
    device = "new_device";
    paymentMethod = "CARD";
    fraudProb = 0.88 + Math.random() * 0.11;
    anomalyScore = 0.85 + Math.random() * 0.12;
    explanations = [
      "Transaction amount is unusually high",
      "New device detected without prior fingerprint",
      "Cross-border transaction location mismatch",
      "Abnormal velocity spike for cardholder"
    ];
  } else if (rand > 0.72) {
    // HIGH
    riskLevel = "HIGH";
    prediction = "FRAUD";
    amount = Math.floor(8000 + Math.random() * 25000);
    merchant = Math.random() > 0.5 ? "Crypto Exchange Global" : "Unknown Merchant";
    location = "Singapore";
    device = Math.random() > 0.5 ? "new_device" : "desktop";
    paymentMethod = "CARD";
    fraudProb = 0.62 + Math.random() * 0.22;
    anomalyScore = 0.58 + Math.random() * 0.25;
    explanations = [
      "Unusual transaction amount spike",
      "High risk merchant category",
      "Anomalous transaction frequency"
    ];
  } else if (rand > 0.55) {
    // MEDIUM
    riskLevel = "MEDIUM";
    prediction = "LEGITIMATE";
    amount = Math.floor(3500 + Math.random() * 8000);
    merchant = "Apple Store";
    location = "Hyderabad";
    device = "desktop";
    paymentMethod = "NETBANKING";
    fraudProb = 0.28 + Math.random() * 0.22;
    anomalyScore = 0.25 + Math.random() * 0.22;
    explanations = [
      "Moderate deviation from average card expenditure",
      "Unfamiliar shopping time"
    ];
  }

  const riskScore = Number(((fraudProb * 0.6) + (anomalyScore * 0.4)).toFixed(3));

  return {
    transaction_id: id,
    timestamp: time,
    amount: amount,
    merchant: merchant,
    location: location,
    device: device,
    payment_method: paymentMethod,
    fraud_probability: Number(fraudProb.toFixed(3)),
    anomaly_score: Number(anomalyScore.toFixed(3)),
    risk_score: riskScore,
    risk_level: riskLevel,
    is_suspicious: riskLevel === "HIGH" || riskLevel === "CRITICAL",
    prediction: prediction,
    explanation: explanations
  };
}

// Fake mock analysis used by /pay before backend is online (Section 11, 23)
export function mockAnalyzeTransaction(input) {
  const amount = Number(input.amount) || 0;
  const isNewDevice = input.device === "new_device";
  const isUnknownMerchant = input.merchant.toLowerCase().includes("unknown");
  const isForeignLocation = input.location.toLowerCase().includes("dubai") || input.location.toLowerCase().includes("unknown");

  let fraudProb = 0.042;
  let anomalyScore = 0.065;
  let riskLevel = "LOW";
  let prediction = "LEGITIMATE";
  let explanations = [];

  if (amount > 50000 || (isNewDevice && isForeignLocation) || (isUnknownMerchant && amount > 10000)) {
    fraudProb = 0.941;
    anomalyScore = 0.887;
    riskLevel = "CRITICAL";
    prediction = "FRAUD";
    explanations = [
      "Transaction amount is unusually high",
      "Transaction originated from a new device",
      "Transaction location differs from normal activity",
      "Transaction pattern is highly anomalous"
    ];
  } else if (amount > 7000 || isNewDevice || isUnknownMerchant) {
    fraudProb = 0.682;
    anomalyScore = 0.614;
    riskLevel = "HIGH";
    prediction = "FRAUD";
    explanations = [
      "Unusual transaction amount",
      "Unknown merchant",
      "Anomalous device profile"
    ];
  } else if (amount > 3000) {
    fraudProb = 0.320;
    anomalyScore = 0.280;
    riskLevel = "MEDIUM";
    prediction = "LEGITIMATE";
    explanations = [
      "Elevated transaction amount"
    ];
  }

  const riskScore = Number(((fraudProb * 0.6) + (anomalyScore * 0.4)).toFixed(3));

  return {
    transaction_id: `TX-${nextTxId++}`,
    timestamp: new Date().toISOString(),
    amount: amount,
    merchant: input.merchant || "Unknown Merchant",
    location: input.location || "Unknown Location",
    device: input.device || "mobile",
    payment_method: input.payment_method || "CARD",
    fraud_probability: Number(fraudProb.toFixed(3)),
    anomaly_score: Number(anomalyScore.toFixed(3)),
    risk_score: riskScore,
    risk_level: riskLevel,
    is_suspicious: riskLevel === "HIGH" || riskLevel === "CRITICAL",
    prediction: prediction,
    explanation: explanations
  };
}
