export type ScanInputType = 'message' | 'url' | 'email';

export type MessageChannel =
  | 'SMS'
  | 'WhatsApp'
  | 'Social Media'
  | 'Payment / UPI Request'
  | 'General Message';

export type RiskClassification = 'Low Risk' | 'Suspicious' | 'High Risk';

export type ScamCategory =
  | 'Bank & KYC Fraud'
  | 'Phishing & Credential Harvesting'
  | 'Delivery & Logistics Scam'
  | 'Recruitment & Job Scam'
  | 'Investment & Crypto Fraud'
  | 'UPI & Payment Refund Scam'
  | 'Lottery & Prize Lure'
  | 'Tech Support & Remote Access'
  | 'Executive / Brand Impersonation'
  | 'Benign / Legitimate Communication';

export interface DetectedSignal {
  id: string;
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  weight: number;
  explanation: string;
  matchedExcerpts: string[];
}

export interface UrlBreakdown {
  rawUrl: string;
  normalizedUrl: string;
  protocol: string;
  isHttps: boolean;
  httpsNote: string;
  hostname: string;
  domain: string;
  subdomain: string;
  tld: string;
  pathAndQuery: string;
  isIpAddress: boolean;
  isShortener: boolean;
  impersonatedBrand: string | null;
  hasSuspiciousCharacters: boolean;
  entropyScore: number;
  assessmentBasis: string;
}

export interface EmailBreakdown {
  senderRaw: string;
  senderDisplayName: string;
  senderEmail: string;
  senderDomain: string;
  replyToEmail?: string;
  subject: string;
  displayNameSpoofingDetected: boolean;
  freeWebmailOfficialClaim: boolean;
  extractedLinks: string[];
}

export interface ScanResult {
  id: string;
  timestamp: string;
  inputType: ScanInputType;
  channel?: MessageChannel;
  rawInputSummary: string;
  fullInput: {
    text?: string;
    url?: string;
    sender?: string;
    replyTo?: string;
    subject?: string;
    body?: string;
  };
  riskScore: number;
  classification: RiskClassification;
  primaryCategory: ScamCategory;
  summaryVerdict: string;
  whatWasDetected: string;
  whyItWasFlagged: string;
  flaggedExcerpts: string[];
  signals: DetectedSignal[];
  recommendedSteps: string[];
  urlBreakdown?: UrlBreakdown;
  emailBreakdown?: EmailBreakdown;
  analysisEngine: 'Hybrid AI + Multi-Signal Heuristics' | 'Deterministic Multi-Signal Heuristics';
  aiForensicNote?: string;
  isDemoCase?: boolean;
  demoCaseId?: string;
  disclaimer: string;
}

export interface DemoCase {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  inputType: ScanInputType;
  channel?: MessageChannel;
  expectedClassification: RiskClassification;
  expectedScoreRange: string;
  category: ScamCategory;
  payload: {
    text?: string;
    url?: string;
    sender?: string;
    replyTo?: string;
    subject?: string;
    body?: string;
  };
  teachingPoint: string;
}

export interface TestCaseSpec {
  id: string;
  name: string;
  inputType: ScanInputType;
  channel?: MessageChannel;
  inputSummary: string;
  payload: {
    text?: string;
    url?: string;
    sender?: string;
    replyTo?: string;
    subject?: string;
    body?: string;
  };
  expectedClassification: RiskClassification;
  expectedMinScore: number;
  expectedMaxScore: number;
  keyIndicators: string[];
}

export interface DashboardStats {
  totalScans: number;
  lowRiskCount: number;
  suspiciousCount: number;
  highRiskCount: number;
  averageRiskScore: number;
  categoryCounts: Record<string, number>;
  inputTypeCounts: {
    message: number;
    url: number;
    email: number;
  };
}
