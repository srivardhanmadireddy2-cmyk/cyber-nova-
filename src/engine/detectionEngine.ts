import {
  DetectedSignal,
  EmailBreakdown,
  MessageChannel,
  RiskClassification,
  ScamCategory,
  ScanResult,
  UrlBreakdown,
} from '../types/cybernova';

const DISCLAIMER_TEXT =
  'Decision-Support Notice: Cybernova combines multi-signal heuristic rules with AI semantic analysis. No automated detector achieves 100% accuracy; results may contain false positives or false negatives. Always verify critical requests through official institutional channels.';

const OFFICIAL_BRAND_DOMAINS: Record<string, string[]> = {
  sbi: ['onlinesbi.sbi', 'sbi.co.in', 'sbicard.com'],
  hdfc: ['hdfcbank.com', 'hdfc.com'],
  icici: ['icicibank.com'],
  axis: ['axisbank.com'],
  kotak: ['kotak.com'],
  rbi: ['rbi.org.in'],
  paytm: ['paytm.com'],
  phonepe: ['phonepe.com'],
  paypal: ['paypal.com'],
  amazon: ['amazon.in', 'amazon.com', 'amazonsellerservices.com'],
  flipkart: ['flipkart.com'],
  indiapost: ['indiapost.gov.in'],
  fedex: ['fedex.com'],
  dhl: ['dhl.com'],
  bluedart: ['bluedart.com'],
  microsoft: ['microsoft.com', 'live.com', 'office.com'],
  google: ['google.com', 'gmail.com', 'google.co.in'],
  apple: ['apple.com', 'icloud.com'],
  netflix: ['netflix.com'],
  incometax: ['incometax.gov.in'],
};

const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'is.gd',
  'cutt.ly',
  'rb.gy',
  'ow.ly',
  'shorturl.at',
  'tiny.cc',
  'rebrand.ly',
  'buff.ly',
  'bl.ink',
  's.id',
]);

const SUSPICIOUS_TLDS = new Set([
  'xyz',
  'top',
  'click',
  'loan',
  'work',
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
  'zip',
  'mov',
  'icu',
  'buzz',
  'monster',
  'rest',
  'quest',
  'shop',
  'site',
  'online',
  'live',
  'support',
]);

const FREE_EMAIL_PROVIDERS = new Set([
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'rediffmail.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'yandex.com',
]);

interface PatternRule {
  id: string;
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  weight: number;
  scamCategory: ScamCategory;
  patterns: RegExp[];
  explanation: string;
}

const MESSAGE_RULES: PatternRule[] = [
  {
    id: 'cred-otp-request',
    title: 'Direct Request for OTP, PIN, or Secret Credentials',
    category: 'Credential Harvesting',
    severity: 'critical',
    weight: 42,
    scamCategory: 'Phishing & Credential Harvesting',
    patterns: [
      /\b(?:share|send|enter|provide|reply\s+with|verify\s+your|confirm\s+your|submit)\b[^.!?\n]{0,40}\b(?:otp|one[\s-]?time\s+password|mpin|upi\s+pin|atm\s+pin|cvv|password|passcode|netbanking\s+login|seed\s+phrase)\b/gi,
      /\b(?:otp|upi\s+pin|cvv|atm\s+pin)\b[^.!?\n]{0,35}\b(?:to\s+verify|to\s+unblock|to\s+complete|to\s+receive|to\s+claim|is\s+required)\b/gi,
    ],
    explanation:
      'Legitimate banks, payment apps, and government agencies never ask you to share an OTP, PIN, CVV, or password via message, call, or untrusted form.',
  },
  {
    id: 'urgency-coercion',
    title: 'Artificial Urgency & Account Suspension Threat',
    category: 'Urgency & Coercion',
    severity: 'high',
    weight: 26,
    scamCategory: 'Bank & KYC Fraud',
    patterns: [
      /\b(?:within\s+\d+\s*(?:hours?|hrs?|minutes?|mins?)|immediately|urgent(?:ly)?|today\s+itself|tonight\s+at\s+\d+|final\s+warning|final\s+notice|last\s+chance|action\s+required\s+immediately)\b/gi,
      /\b(?:account|sim\s+card|bank\s+account|electricity\s+connection|services?|netbanking|cards?)\b[^.!?\n]{0,40}\b(?:will\s+be\s+(?:blocked|suspended|deactivated|disconnected|frozen|terminated)|has\s+been\s+(?:suspended|frozen|blocked|restricted))\b/gi,
    ],
    explanation:
      'Scammers manufacture panic (such as imminent account freezing or utility disconnection) to force victims into acting before verifying the claim.',
  },
  {
    id: 'fake-kyc-pan',
    title: 'Deceptive KYC / PAN Re-Verification Demand',
    category: 'Fake KYC Claim',
    severity: 'high',
    weight: 30,
    scamCategory: 'Bank & KYC Fraud',
    patterns: [
      /\b(?:kyc|pan\s+card|aadhaar)\b[^.!?\n]{0,45}\b(?:expired|incomplete|pending|update\s+immediately|verify\s+now|re-?verification|suspended|link\s+immediately)\b/gi,
      /\b(?:update|complete|verify)\s+(?:your\s+)?(?:kyc|pan\s+details|account\s+kyc)\b/gi,
    ],
    explanation:
      'Fraudulent KYC messages trick users into clicking external links or installing fake banking apps under the guise of regulatory compliance.',
  },
  {
    id: 'payment-refund-trap',
    title: 'Suspicious Payment, Fee, or UPI Collect Trap',
    category: 'Financial Extraction',
    severity: 'high',
    weight: 32,
    scamCategory: 'UPI & Payment Refund Scam',
    patterns: [
      /\b(?:pay|send|transfer|deposit)\b[^.!?\n]{0,40}\b(?:registration\s+fee|processing\s+fee|security\s+deposit|customs?\s+duty|clearance\s+charge|delivery\s+fee|re-?delivery\s+charge|onboarding\s+fee|verification\s+charge)\b/gi,
      /\b(?:scan\s+(?:this\s+)?qr|enter\s+(?:your\s+)?upi\s+pin|approve\s+collect\s+request)\b[^.!?\n]{0,40}\b(?:to\s+receive|to\s+claim|for\s+refund|cashback|credit)\b/gi,
      /\b(?:small\s+payment|nominal\s+fee|rs\.?\s*\d+|inr\s*\d+|\$\d+)\b[^.!?\n]{0,45}\b(?:to\s+release|to\s+reschedule|to\s+confirm\s+delivery|for\s+address\s+update|refundable\s+deposit)\b/gi,
    ],
    explanation:
      'Demanding small upfront fees for parcel delivery, job onboarding, or asking users to enter a UPI PIN to "receive" money is a classic financial scam indicator.',
  },
  {
    id: 'delivery-parcel-lure',
    title: 'Fake Parcel / Customs Delivery Interception',
    category: 'Authority & Service Impersonation',
    severity: 'medium',
    weight: 24,
    scamCategory: 'Delivery & Logistics Scam',
    patterns: [
      /\b(?:india\s*post|fedex|dhl|blue\s*dart|delhivery|ekart|customs\s+department|parcel|shipment|package)\b[^.!?\n]{0,55}\b(?:held|on\s+hold|returned|incomplete\s+address|delivery\s+failed|unable\s+to\s+deliver|seized|pending\s+customs)\b/gi,
      /\b(?:update\s+delivery\s+address|confirm\s+shipping\s+details|reschedule\s+your\s+parcel)\b[^.!?\n]{0,40}\b(?:within\s+\d+|via\s+link|click\s+below)\b/gi,
    ],
    explanation:
      'Phishers impersonate courier services claiming a package is stuck due to an incomplete address, luring victims to fake payment portals.',
  },
  {
    id: 'job-task-scam',
    title: 'Fraudulent Recruitment or Prepaid Task Scheme',
    category: 'Job & Task Scam',
    severity: 'high',
    weight: 30,
    scamCategory: 'Recruitment & Job Scam',
    patterns: [
      /\b(?:part[\s-]?time\s+job|work\s+from\s+home|online\s+task|telegram\s+task|rate\s+hotels|like\s+youtube\s+videos|google\s+map\s+reviews)\b[^.!?\n]{0,60}\b(?:earn|daily\s+income|rs\.?\s*\d+|per\s+day|no\s+experience)\b/gi,
      /\b(?:selected\s+for\s+(?:the\s+)?job|offer\s+letter|hr\s+department|shortlisted)\b[^.!?\n]{0,65}\b(?:registration\s+fee|training\s+fee|security\s+deposit|laptop\s+deposit|medical\s+fee|pay\s+rs)\b/gi,
    ],
    explanation:
      'Genuine employers never charge candidates registration fees, security deposits, or equipment charges before issuing an offer or starting work.',
  },
  {
    id: 'investment-guaranteed-returns',
    title: 'Unrealistic Guaranteed Return / Investment Lure',
    category: 'Investment Fraud',
    severity: 'high',
    weight: 34,
    scamCategory: 'Investment & Crypto Fraud',
    patterns: [
      /\b(?:guaranteed\s+(?:returns?|profit)|100%\s+profit|double\s+your\s+(?:money|capital|investment)|zero[\s-]?risk\s+trading|vip\s+(?:stock|crypto|trading)\s+group|institutional\s+insider\s+signals)\b/gi,
      /\b(?:invest\s+(?:rs\.?|inr|\$)?\s*\d+)\b[^.!?\n]{0,45}\b(?:get\s+(?:rs\.?|inr|\$)?\s*\d+|return\s+in\s+\d+\s*(?:days?|hours?))\b/gi,
      /\b(?:200%|300%|500%|\d{2,3}%\s+(?:weekly|monthly|daily)\s+(?:returns?|profit|roi))\b/gi,
    ],
    explanation:
      'Promises of guaranteed high returns, doubling capital in days, or "insider VIP trading groups" are hallmarks of Ponzi and pig-butchering investment scams.',
  },
  {
    id: 'lottery-prize-scam',
    title: 'Unclaimed Lottery, Lucky Draw, or Government Grant Lure',
    category: 'Prize & Lottery Scam',
    severity: 'high',
    weight: 30,
    scamCategory: 'Lottery & Prize Lure',
    patterns: [
      /\b(?:congratulations!?\s+you\s+have\s+won|lucky\s+draw\s+winner|kbc\s+lottery|unclaimed\s+(?:prize|reward|cash\s+grant)|won\s+a\s+cash\s+prize)\b/gi,
      /\b(?:claim\s+your\s+(?:prize|reward|bonus|gift\s+voucher))\b[^.!?\n]{0,40}\b(?:click|pay\s+tax|processing\s+charge|contact\s+whatsapp)\b/gi,
    ],
    explanation:
      'Unsolicited notifications claiming you won a lottery or prize you never entered are designed to harvest personal data or advance-fee payments.',
  },
  {
    id: 'remote-access-apk',
    title: 'Remote Screen-Sharing or Untrusted APK Installation Request',
    category: 'Malware & Remote Access',
    severity: 'critical',
    weight: 45,
    scamCategory: 'Tech Support & Remote Access',
    patterns: [
      /\b(?:install|download)\b[^.!?\n]{0,40}\b(?:anydesk|teamviewer|rustdesk|quicksupport|airmirror|\.apk|support\s+app|kyc\s+app)\b/gi,
      /\b(?:share\s+(?:your\s+)?screen|remote\s+access\s+code|9[\s-]?digit\s+anydesk)\b/gi,
    ],
    explanation:
      'Attackers ask victims to install remote desktop tools (AnyDesk, TeamViewer) or sideload `.apk` files to silently view OTPs and drain bank accounts.',
  },
  {
    id: 'authority-impersonation',
    title: 'High-Trust Institution or Authority Reference',
    category: 'Brand / Authority Mention',
    severity: 'medium',
    weight: 14,
    scamCategory: 'Executive / Brand Impersonation',
    patterns: [
      /\b(?:state\s+bank\s+of\s+india|sbi\s+bank|hdfc\s+bank|icici\s+bank|axis\s+bank|reserve\s+bank|rbi|income\s+tax\s+department|customs\s+office|cyber\s+crime\s+cell|trai|electricity\s+board)\b/gi,
    ],
    explanation:
      'The message references a trusted financial institution or government body. While legitimate alerts also mention brand names, combining this with external links, urgency, or credential requests indicates impersonation.',
  },
];

// Protective / Benign patterns that reduce false positives on real notifications
const PROTECTIVE_PATTERNS: RegExp[] = [
  /\b(?:never|do\s+not|don't)\s+share\s+(?:your\s+)?(?:otp|pin|password|cvv|card\s+details)\b/i,
  /\b(?:bank|we)\s+never\s+ask(?:s)?\s+for\s+(?:your\s+)?(?:otp|pin|password)\b/i,
  /\bcall\s+(?:the\s+)?official\s+toll[\s-]?free\s+number\b/i,
];

function extractMatchedExcerpts(text: string, patterns: RegExp[]): string[] {
  const matches = new Set<string>();
  for (const regex of patterns) {
    const flags = regex.flags.includes('g') ? regex.flags : regex.flags + 'g';
    const re = new RegExp(regex.source, flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const cleaned = match[0].trim();
      if (cleaned.length > 0) {
        matches.add(cleaned);
      }
      if (matches.size >= 4) break;
    }
  }
  return Array.from(matches);
}

function extractUrlsFromText(text: string): string[] {
  const urlRegex =
    /(?:https?:\/\/|www\.)[^\s<>"{}|\\^`[\]]+|\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|in|org|net|edu|gov|io|co|xyz|top|click|loan|work|tk|ml|ga|cf|gq|zip|mov|icu|buzz|monster|rest|ly|gd|at|cc|gy|id|shop|site|online|live|support)(?:\/[^\s<>"{}|\\^`[\]]*)?/gi;
  const rawMatches = text.match(urlRegex) || [];
  return Array.from(
    new Set(
      rawMatches.map((u) => u.replace(/[.,;:!?)]+$/, '').trim()).filter((u) => u.length >= 4)
    )
  );
}

function computeShannonEntropy(str: string): number {
  if (!str) return 0;
  const freq: Record<string, number> = {};
  for (const ch of str) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const ch in freq) {
    const p = freq[ch] / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(2));
}

function normalizeLeetSpeak(input: string): string {
  return input
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/8/g, 'b')
    .replace(/rn/g, 'm');
}

export function inspectUrlStructure(rawUrlInput: string): {
  breakdown: UrlBreakdown;
  signals: DetectedSignal[];
  score: number;
  primaryCategory: ScamCategory;
} {
  const trimmed = rawUrlInput.trim();
  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
  const normalizedUrl = hasProtocol ? trimmed : `http://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(normalizedUrl);
  } catch {
    // Fallback for malformed URL strings
    const fallbackBreakdown: UrlBreakdown = {
      rawUrl: trimmed,
      normalizedUrl,
      protocol: 'unknown',
      isHttps: false,
      httpsNote: 'Malformed URL syntax prevented standard RFC protocol verification.',
      hostname: trimmed.split('/')[0] || trimmed,
      domain: trimmed,
      subdomain: '',
      tld: '',
      pathAndQuery: '',
      isIpAddress: false,
      isShortener: false,
      impersonatedBrand: null,
      hasSuspiciousCharacters: true,
      entropyScore: computeShannonEntropy(trimmed),
      assessmentBasis: 'Preliminary Heuristic & Structural Assessment',
    };
    return {
      breakdown: fallbackBreakdown,
      signals: [
        {
          id: 'url-malformed',
          title: 'Malformed or Obfuscated URL Structure',
          category: 'URL Syntax Anomaly',
          severity: 'medium',
          weight: 35,
          explanation:
            'The submitted string does not conform to standard URL formatting, which can indicate broken obfuscation or non-standard URI schemes.',
          matchedExcerpts: [trimmed],
        },
      ],
      score: 40,
      primaryCategory: 'Phishing & Credential Harvesting',
    };
  }

  const protocol = parsed.protocol.replace(':', '').toLowerCase();
  const isHttps = protocol === 'https';
  const hostname = parsed.hostname.toLowerCase();
  const hostParts = hostname.split('.').filter(Boolean);
  const tld = hostParts.length > 1 ? hostParts[hostParts.length - 1] : '';

  // Handle two-part country TLDs like .co.in, .gov.in, .org.in
  let registrableDomain = hostname;
  let subdomain = '';
  if (hostParts.length >= 3 && ['co', 'gov', 'org', 'ac', 'net', 'com'].includes(hostParts[hostParts.length - 2])) {
    registrableDomain = hostParts.slice(-3).join('.');
    subdomain = hostParts.slice(0, -3).join('.');
  } else if (hostParts.length >= 2) {
    registrableDomain = hostParts.slice(-2).join('.');
    subdomain = hostParts.slice(0, -2).join('.');
  }

  const pathAndQuery = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  const isIpAddress =
    /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith('[');
  const isShortener = URL_SHORTENERS.has(registrableDomain) || URL_SHORTENERS.has(hostname);
  const entropyScore = computeShannonEntropy(hostname);

  const signals: DetectedSignal[] = [];
  let score = 0;
  let primaryCategory: ScamCategory = 'Benign / Legitimate Communication';

  // 1. Check protocol (HTTP vs HTTPS)
  if (!isHttps) {
    signals.push({
      id: 'url-no-https',
      title: 'Unencrypted HTTP Protocol',
      category: 'Transport Security',
      severity: 'medium',
      weight: 18,
      explanation:
        'This URL uses unencrypted HTTP (`http://`) instead of HTTPS. Any credentials or data submitted over HTTP can be intercepted in plaintext.',
      matchedExcerpts: [`${protocol}://${hostname}`],
    });
    score += 18;
  }

  // 2. Check IP address used as domain
  if (isIpAddress) {
    signals.push({
      id: 'url-ip-host',
      title: 'Raw IP Address Used Instead of Registered Domain',
      category: 'Host Obfuscation',
      severity: 'critical',
      weight: 45,
      explanation:
        'Legitimate banking, e-commerce, and enterprise portals use registered domain names—never raw numerical IP addresses—to host user login pages.',
      matchedExcerpts: [hostname],
    });
    score += 45;
    primaryCategory = 'Phishing & Credential Harvesting';
  }

  // 3. Check URL shortener
  if (isShortener) {
    signals.push({
      id: 'url-shortener',
      title: 'URL Shortener Hiding True Destination',
      category: 'Destination Obfuscation',
      severity: 'high',
      weight: 30,
      explanation:
        'URL shorteners mask the final destination domain. Attackers frequently use them in SMS and WhatsApp phishing to bypass spam filters.',
      matchedExcerpts: [hostname],
    });
    score += 30;
    primaryCategory = 'Phishing & Credential Harvesting';
  }

  // 4. Check '@' credential redirect trick in raw URL
  if (trimmed.includes('@')) {
    signals.push({
      id: 'url-at-symbol',
      title: 'Deceptive "@" Symbol Credential Prefix in URL',
      category: 'URI Obfuscation',
      severity: 'critical',
      weight: 45,
      explanation:
        'Browsers ignore everything before the "@" symbol in a URL host and navigate to the domain after it—a classic trick to disguise malicious links.',
      matchedExcerpts: [trimmed],
    });
    score += 45;
    primaryCategory = 'Phishing & Credential Harvesting';
  }

  // 5. Check Punycode / IDN homograph (`xn--`)
  if (hostname.includes('xn--')) {
    signals.push({
      id: 'url-punycode',
      title: 'Punycode (IDN Homograph) Domain Encoding Detected',
      category: 'Lookalike Domain',
      severity: 'critical',
      weight: 44,
      explanation:
        'The hostname contains `xn--` Punycode encoding, often used to substitute visually identical non-Latin characters to impersonate trusted brands.',
      matchedExcerpts: [hostname],
    });
    score += 44;
    primaryCategory = 'Phishing & Credential Harvesting';
  }

  // 6. Check Brand Impersonation / Typosquatting / Leetspeak
  let impersonatedBrand: string | null = null;
  const normalizedHostForBrand = normalizeLeetSpeak(hostname);
  const fullUrlLower = normalizeLeetSpeak( hostname + pathAndQuery );

  for (const [brandKey, officialDomains] of Object.entries(OFFICIAL_BRAND_DOMAINS)) {
    const isOfficial = officialDomains.some(
      (off) => hostname === off || hostname.endsWith(`.${off}`)
    );

    if (!isOfficial) {
      const brandInHost =
        hostname.includes(brandKey) || normalizedHostForBrand.includes(brandKey);
      const brandInPath = fullUrlLower.includes(brandKey);

      if (brandInHost || (brandInPath && subdomain.length > 0)) {
        impersonatedBrand = brandKey.toUpperCase();
        const isLeetspeak =
          !hostname.includes(brandKey) && normalizedHostForBrand.includes(brandKey);

        signals.push({
          id: `url-brand-spoof-${brandKey}`,
          title: isLeetspeak
            ? `Typosquatted / Lookalike Brand Domain (${impersonatedBrand})`
            : `Deceptive Brand Impersonation (${impersonatedBrand}) on Unofficial Domain`,
          category: 'Lookalike & Brand Spoofing',
          severity: 'critical',
          weight: 46,
          explanation: isLeetspeak
            ? `The domain uses character substitution (such as '0' for 'o' or '1' for 'l') to mimic ${impersonatedBrand} while actually resolving to "${registrableDomain}".`
            : `The URL references "${impersonatedBrand}" to appear trustworthy, but the actual registered domain is "${registrableDomain}", which is not an official ${impersonatedBrand} domain (${officialDomains.join(', ')}).`,
          matchedExcerpts: [hostname],
        });
        score += 46;
        primaryCategory =
          brandKey === 'indiapost' || brandKey === 'fedex' || brandKey === 'dhl'
            ? 'Delivery & Logistics Scam'
            : brandKey === 'sbi' || brandKey === 'hdfc' || brandKey === 'icici' || brandKey === 'axis'
            ? 'Bank & KYC Fraud'
            : 'Phishing & Credential Harvesting';
        break;
      }
    }
  }

  // 7. Check Suspicious / Abused TLDs
  if (SUSPICIOUS_TLDS.has(tld)) {
    signals.push({
      id: 'url-suspicious-tld',
      title: `High-Abuse Top-Level Domain (.${tld})`,
      category: 'Domain Reputation Heuristic',
      severity: 'medium',
      weight: 22,
      explanation: `The ".${tld}" top-level domain has a disproportionately high abuse rate in disposable phishing campaigns and automated scam infrastructure.`,
      matchedExcerpts: [`.${tld}`],
    });
    score += 22;
    if (primaryCategory === 'Benign / Legitimate Communication') {
      primaryCategory = 'Phishing & Credential Harvesting';
    }
  }

  // 8. Check Excessive Subdomains or Hyphens
  const hyphenCount = (registrableDomain.match(/-/g) || []).length;
  const subdomainLevels = subdomain ? subdomain.split('.').length : 0;

  if (hyphenCount >= 2 || subdomainLevels >= 3) {
    signals.push({
      id: 'url-structural-complexity',
      title: 'Multiple Hyphens or Deep Subdomain Nesting',
      category: 'Structural Anomaly',
      severity: 'medium',
      weight: 20,
      explanation:
        hyphenCount >= 2
          ? `The domain "${registrableDomain}" chains ${hyphenCount} hyphens, a common pattern in Newly Registered Domains (NRDs) created for phishing.`
          : `The URL nests ${subdomainLevels} subdomain levels ("${subdomain}") before the actual root domain "${registrableDomain}" to hide the true host on mobile address bars.`,
      matchedExcerpts: [hostname],
    });
    score += 20;
  }

  // 9. Check Phishing Path / Query Keywords (when not on an official brand domain)
  const isKnownOfficialDomain = Object.values(OFFICIAL_BRAND_DOMAINS)
    .flat()
    .some((off) => hostname === off || hostname.endsWith(`.${off}`));

  const phishingKeywordsMatch = (hostname + pathAndQuery).match(
    /\b(?:kyc|verify|login|signin|update-pan|unblock|secure-account|claim-refund|lucky-draw|free-gift|wallet-connect|recovery-seed|\.apk|\.exe)\b/gi
  );

  if (phishingKeywordsMatch && !isKnownOfficialDomain) {
    const uniqueTokens = Array.from(new Set(phishingKeywordsMatch.map((m) => m.toLowerCase())));
    signals.push({
      id: 'url-phishing-tokens',
      title: 'High-Risk Credential / Action Tokens in URL',
      category: 'Lexical URL Indicator',
      severity: 'high',
      weight: 25,
      explanation: `The URL contains sensitive action lures (${uniqueTokens.join(', ')}) hosted on an unverified domain ("${registrableDomain}").`,
      matchedExcerpts: uniqueTokens,
    });
    score += 25;
    if (primaryCategory === 'Benign / Legitimate Communication') {
      primaryCategory = 'Phishing & Credential Harvesting';
    }
  }

  // 10. High hostname character entropy / suspicious encoding
  const hasSuspiciousEncoding = /%[0-9a-fA-F]{2}/.test(hostname) || entropyScore > 4.05;
  if (hasSuspiciousEncoding) {
    signals.push({
      id: 'url-entropy-encoding',
      title: 'High Character Entropy or URL Encoding Anomaly',
      category: 'Algorithmic Domain Heuristic',
      severity: 'low',
      weight: 14,
      explanation: `The hostname exhibits elevated randomness (Shannon entropy: ${entropyScore} bits/char) or percent-encoded characters often generated by Domain Generation Algorithms (DGAs).`,
      matchedExcerpts: [hostname],
    });
    score += 14;
  }

  const clampedScore = Math.min(100, Math.max(0, score));

  const httpsNote = isHttps
    ? 'Uses HTTPS transport encryption. Important: HTTPS only encrypts traffic in transit—over 80% of phishing sites today use free SSL certificates. HTTPS alone NEVER means a website is trustworthy.'
    : 'Does NOT use HTTPS encryption (`http://`). Any sensitive data entered on this page is transmitted in unencrypted plaintext.';

  const breakdown: UrlBreakdown = {
    rawUrl: trimmed,
    normalizedUrl: parsed.href,
    protocol: protocol.toUpperCase(),
    isHttps,
    httpsNote,
    hostname,
    domain: registrableDomain,
    subdomain: subdomain || '(none)',
    tld: tld ? `.${tld}` : '(none)',
    pathAndQuery: pathAndQuery === '/' ? '(root /)' : pathAndQuery,
    isIpAddress,
    isShortener,
    impersonatedBrand,
    hasSuspiciousCharacters:
      trimmed.includes('@') || hostname.includes('xn--') || hyphenCount >= 2,
    entropyScore,
    assessmentBasis: 'Preliminary Heuristic & Structural Assessment (Non-Visiting Safe Inspection)',
  };

  return {
    breakdown,
    signals,
    score: clampedScore,
    primaryCategory,
  };
}

function classifyScore(score: number): RiskClassification {
  if (score >= 60) return 'High Risk';
  if (score >= 28) return 'Suspicious';
  return 'Low Risk';
}

function buildRecommendedSteps(
  classification: RiskClassification,
  primaryCategory: ScamCategory,
  inputType: 'message' | 'url' | 'email'
): string[] {
  if (classification === 'Low Risk') {
    return [
      'No immediate fraud indicators were triggered, but continue practicing standard digital hygiene.',
      'Even in legitimate notifications, never share your OTP, UPI PIN, or password with anyone.',
      inputType === 'url'
        ? 'Remember that this is a structural heuristic check: always verify you are on the exact official domain before entering credentials.'
        : 'If this message relates to a financial transaction you do not recognize, contact your bank using the number printed on the back of your debit/credit card.',
    ];
  }

  const steps: string[] = [
    'Do NOT click any links, scan QR codes, or reply to the sender or phone number in this message.',
    'Never share your OTP, UPI PIN, ATM PIN, CVV, or netbanking password—no legitimate institution ever requests them.',
  ];

  if (primaryCategory === 'Bank & KYC Fraud') {
    steps.push(
      'Check your account status exclusively by opening your bank’s official mobile app or typing the official bank URL directly into your browser.'
    );
  } else if (primaryCategory === 'Delivery & Logistics Scam') {
    steps.push(
      'Verify parcel tracking numbers directly on the official courier website (e.g., indiapost.gov.in, fedex.com) rather than clicking SMS tracking links.'
    );
  } else if (primaryCategory === 'Recruitment & Job Scam') {
    steps.push(
      'Refuse any request for registration fees, security deposits, or prepaid tasks. Verify job openings on the company’s official careers portal.'
    );
  } else if (primaryCategory === 'Investment & Crypto Fraud') {
    steps.push(
      'Exit any unsolicited WhatsApp/Telegram trading groups immediately and verify investment advisors via the official SEBI / regulatory registry.'
    );
  } else if (primaryCategory === 'Tech Support & Remote Access') {
    steps.push(
      'Never install AnyDesk, TeamViewer, RustDesk, or unknown `.apk` files at the request of a caller or support message.'
    );
  }

  steps.push(
    'Report suspected cyber fraud immediately to the National Cyber Crime Helpline (Dial 1930 or visit cybercrime.gov.in) and block the sender.'
  );

  return steps;
}

export function analyzeMessageInput(params: {
  text: string;
  channel?: MessageChannel;
  isDemoCase?: boolean;
  demoCaseId?: string;
}): ScanResult {
  const text = params.text.trim();
  const channel = params.channel || 'SMS';
  const signals: DetectedSignal[] = [];
  const flaggedExcerptsSet = new Set<string>();
  const categoryWeights: Record<string, number> = {};

  // 1. Evaluate all multi-signal message rules
  for (const rule of MESSAGE_RULES) {
    const excerpts = extractMatchedExcerpts(text, rule.patterns);
    if (excerpts.length > 0) {
      signals.push({
        id: rule.id,
        title: rule.title,
        category: rule.category,
        severity: rule.severity,
        weight: rule.weight,
        explanation: rule.explanation,
        matchedExcerpts: excerpts,
      });
      excerpts.forEach((ex) => flaggedExcerptsSet.add(ex));
      categoryWeights[rule.scamCategory] =
        (categoryWeights[rule.scamCategory] || 0) + rule.weight;
    }
  }

  // 2. Inspect any embedded URLs inside the message
  const embeddedUrls = extractUrlsFromText(text);
  let urlBreakdown: UrlBreakdown | undefined;

  if (embeddedUrls.length > 0) {
    const primaryUrlInspection = inspectUrlStructure(embeddedUrls[0]);
    urlBreakdown = primaryUrlInspection.breakdown;

    if (primaryUrlInspection.score >= 20) {
      signals.push({
        id: 'embedded-suspicious-url',
        title: `Suspicious Embedded Link Detected (${primaryUrlInspection.breakdown.hostname})`,
        category: 'Malicious / Obfuscated Link',
        severity: primaryUrlInspection.score >= 50 ? 'critical' : 'high',
        weight: Math.min(40, Math.round(primaryUrlInspection.score * 0.65)),
        explanation:
          primaryUrlInspection.signals.map((s) => s.explanation).join(' ') ||
          `The message contains a suspicious link (${embeddedUrls[0]}) that exhibits phishing characteristics.`,
        matchedExcerpts: [embeddedUrls[0]],
      });
      flaggedExcerptsSet.add(embeddedUrls[0]);
      categoryWeights[primaryUrlInspection.primaryCategory] =
        (categoryWeights[primaryUrlInspection.primaryCategory] || 0) + 30;
    }
  }

  // 3. Evaluate protective / legitimate context dampeners
  const hasProtectiveNotice = PROTECTIVE_PATTERNS.some((re) => re.test(text));
  const hasHardThreatSignal = signals.some(
    (s) => s.id !== 'authority-impersonation' && s.weight >= 20
  );

  // If only an institution name was mentioned (e.g. "HDFC Bank Alert: Rs 1,200 debited...")
  // with NO threats, NO suspicious links, and/or an explicit protective warning ("Never share OTP"):
  if (!hasHardThreatSignal) {
    const authIndex = signals.findIndex((s) => s.id === 'authority-impersonation');
    if (authIndex !== -1) {
      // Remove isolated brand mention from being flagged as an attack when context is purely informational
      signals.splice(authIndex, 1);
      flaggedExcerptsSet.clear();
    }
  }

  // Calculate multi-signal composite risk score
  let rawScore = signals.reduce((acc, s) => acc + s.weight, 0);

  // Multi-signal correlation bonus (combining independent fraud vectors)
  const distinctCategories = new Set(signals.map((s) => s.category)).size;
  if (distinctCategories >= 3) {
    rawScore += 18;
  } else if (distinctCategories === 2) {
    rawScore += 10;
  }

  if (hasProtectiveNotice && !hasHardThreatSignal) {
    rawScore = Math.min(rawScore, 10);
  }

  const riskScore = Math.min(100, Math.max(0, rawScore));
  const classification = classifyScore(riskScore);

  // Determine primary scam category
  let primaryCategory: ScamCategory = 'Benign / Legitimate Communication';
  if (classification !== 'Low Risk' && Object.keys(categoryWeights).length > 0) {
    primaryCategory = Object.entries(categoryWeights).sort(
      (a, b) => b[1] - a[1]
    )[0][0] as ScamCategory;
  }

  const flaggedExcerpts = Array.from(flaggedExcerptsSet);

  const whatWasDetected =
    signals.length === 0
      ? `No known social-engineering, phishing, or financial extortion patterns were detected in this ${channel} message.`
      : `Detected ${signals.length} correlated risk indicator${signals.length > 1 ? 's' : ''} aligned with ${primaryCategory} (${signals.map((s) => s.category).join(', ')}).`;

  const whyItWasFlagged =
    signals.length === 0
      ? hasProtectiveNotice
        ? 'The message resembles a standard informational alert and explicitly advises against sharing sensitive credentials.'
        : 'The message uses routine conversational or informational language without coercion, suspicious links, or credential/payment demands.'
      : `Cybernova's multi-signal engine correlated ${distinctCategories} distinct threat vector${distinctCategories > 1 ? 's' : ''}: ${signals
          .map((s) => s.title.toLowerCase())
          .join('; ')}. Combining psychological pressure or impersonation with an actionable trap significantly elevates fraud probability.`;

  const summaryVerdict =
    classification === 'High Risk'
      ? `High-Risk ${primaryCategory} Attempt Detected`
      : classification === 'Suspicious'
      ? `Suspicious Message — Potential ${primaryCategory}`
      : 'Low Risk — No Active Scam Indicators Found';

  return {
    id: `SCAN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    inputType: 'message',
    channel,
    rawInputSummary: text.length > 110 ? `${text.slice(0, 110)}...` : text,
    fullInput: { text },
    riskScore,
    classification,
    primaryCategory,
    summaryVerdict,
    whatWasDetected,
    whyItWasFlagged,
    flaggedExcerpts,
    signals,
    recommendedSteps: buildRecommendedSteps(classification, primaryCategory, 'message'),
    urlBreakdown,
    analysisEngine: 'Deterministic Multi-Signal Heuristics',
    isDemoCase: params.isDemoCase,
    demoCaseId: params.demoCaseId,
    disclaimer: DISCLAIMER_TEXT,
  };
}

export function analyzeUrlInput(params: {
  url: string;
  isDemoCase?: boolean;
  demoCaseId?: string;
}): ScanResult {
  const { breakdown, signals, score, primaryCategory } = inspectUrlStructure(params.url);
  const classification = classifyScore(score);
  const flaggedExcerpts = Array.from(
    new Set(signals.flatMap((s) => s.matchedExcerpts))
  );

  const whatWasDetected =
    signals.length === 0
      ? `Preliminary structural analysis of "${breakdown.hostname}" found standard HTTPS configuration and no obvious typosquatting, IP obfuscation, or suspicious TLD indicators.`
      : `Identified ${signals.length} structural & lexical phishing indicator${signals.length > 1 ? 's' : ''} on host "${breakdown.hostname}".`;

  const whyItWasFlagged =
    signals.length === 0
      ? `The domain "${breakdown.domain}" uses standard formatting and does not mimic protected banking or courier brands. Note: ${breakdown.httpsNote}`
      : `The URL was flagged during safe non-visiting inspection due to: ${signals
          .map((s) => s.title)
          .join(', ')}. ${breakdown.httpsNote}`;

  const summaryVerdict =
    classification === 'High Risk'
      ? `High-Risk Phishing / Deceptive URL (${breakdown.hostname})`
      : classification === 'Suspicious'
      ? `Suspicious URL — Structural Anomalies Detected`
      : `Preliminary Heuristic Assessment: Low Structural Risk`;

  return {
    id: `SCAN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    inputType: 'url',
    rawInputSummary: params.url.trim(),
    fullInput: { url: params.url.trim() },
    riskScore: score,
    classification,
    primaryCategory: classification === 'Low Risk' ? 'Benign / Legitimate Communication' : primaryCategory,
    summaryVerdict,
    whatWasDetected,
    whyItWasFlagged,
    flaggedExcerpts,
    signals,
    recommendedSteps: buildRecommendedSteps(classification, primaryCategory, 'url'),
    urlBreakdown: breakdown,
    analysisEngine: 'Deterministic Multi-Signal Heuristics',
    isDemoCase: params.isDemoCase,
    demoCaseId: params.demoCaseId,
    disclaimer: DISCLAIMER_TEXT,
  };
}

export function analyzeEmailInput(params: {
  sender: string;
  replyTo?: string;
  subject: string;
  body: string;
  isDemoCase?: boolean;
  demoCaseId?: string;
}): ScanResult {
  const senderRaw = params.sender.trim();
  const replyToRaw = (params.replyTo || '').trim();
  const subject = params.subject.trim();
  const body = params.body.trim();

  // Parse Display Name <email@domain>
  let senderDisplayName = '';
  let senderEmail = senderRaw;
  const angleMatch = senderRaw.match(/^(.*?)<([^>]+)>$/);
  if (angleMatch) {
    senderDisplayName = angleMatch[1].replace(/["']/g, '').trim();
    senderEmail = angleMatch[2].trim().toLowerCase();
  } else if (senderRaw.includes('@')) {
    senderEmail = senderRaw.toLowerCase();
  }

  const senderDomain = senderEmail.includes('@')
    ? senderEmail.split('@')[1].trim().toLowerCase()
    : '';

  const replyToEmail = replyToRaw.includes('<')
    ? (replyToRaw.match(/<([^>]+)>/)?.[1] || replyToRaw).toLowerCase()
    : replyToRaw.toLowerCase();
  const replyToDomain = replyToEmail.includes('@')
    ? replyToEmail.split('@')[1].trim().toLowerCase()
    : '';

  // First analyze combined subject + body using the message engine
  const baseMessageAnalysis = analyzeMessageInput({
    text: `${subject}\n\n${body}`,
    channel: 'General Message',
  });

  const signals: DetectedSignal[] = [...baseMessageAnalysis.signals];
  const flaggedExcerptsSet = new Set<string>(baseMessageAnalysis.flaggedExcerpts);
  let extraEmailScore = 0;

  // Check Display Name Spoofing vs Actual Sender Domain
  let displayNameSpoofingDetected = false;
  let freeWebmailOfficialClaim = false;

  const combinedSenderAndSubject = `${senderDisplayName} ${subject}`.toLowerCase();

  for (const [brandKey, officialDomains] of Object.entries(OFFICIAL_BRAND_DOMAINS)) {
    const mentionsBrand =
      senderDisplayName.toLowerCase().includes(brandKey) ||
      senderEmail.includes(brandKey);
    const isOfficialSender = officialDomains.some(
      (off) => senderDomain === off || senderDomain.endsWith(`.${off}`)
    );

    if (mentionsBrand && senderDomain && !isOfficialSender) {
      displayNameSpoofingDetected = true;
      signals.unshift({
        id: 'email-sender-spoofing',
        title: `Sender Display Name / Domain Mismatch (${brandKey.toUpperCase()})`,
        category: 'Email Header Spoofing',
        severity: 'critical',
        weight: 42,
        explanation: `The sender claims to represent "${senderDisplayName || brandKey.toUpperCase()}", but the actual originating email domain is "${senderDomain}", not an official domain (${officialDomains.join(', ')}).`,
        matchedExcerpts: [senderRaw],
      });
      flaggedExcerptsSet.add(senderRaw);
      extraEmailScore += 42;
      break;
    }
  }

  // Check Free Webmail used for Corporate / Bank / Authority claims
  const claimsOfficialAuthority =
    /\b(?:bank|support|security|compliance|kyc|customs|payroll|hr\s+desk|helpdesk|refund|billing|administration|verify)\b/i.test(
      combinedSenderAndSubject
    );

  if (senderDomain && FREE_EMAIL_PROVIDERS.has(senderDomain) && claimsOfficialAuthority) {
    freeWebmailOfficialClaim = true;
    signals.unshift({
      id: 'email-free-webmail-authority',
      title: `Official / Institutional Claim Sent from Free Webmail (@${senderDomain})`,
      category: 'Sender Authenticity',
      severity: 'high',
      weight: 32,
      explanation: `Banks, corporate security teams, and government agencies do not send official compliance or billing notices from personal "@${senderDomain}" accounts.`,
      matchedExcerpts: [senderRaw],
    });
    flaggedExcerptsSet.add(senderRaw);
    extraEmailScore += 32;
  }

  // Check Reply-To Domain Mismatch
  if (replyToDomain && senderDomain && replyToDomain !== senderDomain) {
    signals.unshift({
      id: 'email-reply-to-mismatch',
      title: `Deceptive Reply-To Address Mismatch (@${replyToDomain})`,
      category: 'Business Email Compromise (BEC)',
      severity: 'high',
      weight: 30,
      explanation: `The sender domain is "@${senderDomain}", but replies are silently redirected to "@${replyToDomain}"—a common technique in invoice fraud and phishing.`,
      matchedExcerpts: [`From: ${senderEmail}`, `Reply-To: ${replyToEmail}`],
    });
    flaggedExcerptsSet.add(replyToRaw);
    extraEmailScore += 30;
  }

  // Check Subject Line High-Pressure Manipulation
  if (
    /\b(?:urgent|immediate\s+action|suspended|final\s+notice|unauthorized\s+login|account\s+locked|overdue\s+invoice|security\s+alert)\b/i.test(
      subject
    )
  ) {
    signals.push({
      id: 'email-subject-pressure',
      title: 'High-Pressure Subject Line Engineering',
      category: 'Psychological Trigger',
      severity: 'medium',
      weight: 16,
      explanation: `The subject line ("${subject}") uses alarmist urgency triggers designed to bypass critical evaluation.`,
      matchedExcerpts: [subject],
    });
    flaggedExcerptsSet.add(subject);
    extraEmailScore += 16;
  }

  const extractedLinks = extractUrlsFromText(body);
  const totalScore = Math.min(100, baseMessageAnalysis.riskScore + extraEmailScore);
  const classification = classifyScore(totalScore);

  const primaryCategory: ScamCategory =
    classification === 'Low Risk'
      ? 'Benign / Legitimate Communication'
      : baseMessageAnalysis.primaryCategory !== 'Benign / Legitimate Communication'
      ? baseMessageAnalysis.primaryCategory
      : displayNameSpoofingDetected
      ? 'Executive / Brand Impersonation'
      : 'Phishing & Credential Harvesting';

  const emailBreakdown: EmailBreakdown = {
    senderRaw,
    senderDisplayName: senderDisplayName || '(No Display Name)',
    senderEmail,
    senderDomain: senderDomain || '(Unknown Domain)',
    replyToEmail: replyToEmail || undefined,
    subject,
    displayNameSpoofingDetected,
    freeWebmailOfficialClaim,
    extractedLinks,
  };

  const whatWasDetected =
    signals.length === 0
      ? `Email header and body inspection found no sender spoofing, coercive language, or malicious links.`
      : `Detected ${signals.length} email forensic warning sign${signals.length > 1 ? 's' : ''} across sender identity ("${senderDomain || senderRaw}"), subject line, and message body.`;

  const whyItWasFlagged =
    signals.length === 0
      ? 'The sender address aligns with the message context, and the body contains no credential harvesting or payment diversion requests.'
      : `Flagged due to combined email indicators: ${signals.map((s) => s.title).join('; ')}.`;

  const summaryVerdict =
    classification === 'High Risk'
      ? `High-Risk Phishing / Spoofed Email Detected`
      : classification === 'Suspicious'
      ? `Suspicious Email — Verify Sender Authenticity`
      : `Low Risk — Standard Email Communication`;

  return {
    id: `SCAN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    inputType: 'email',
    rawInputSummary: `From: ${senderRaw} | Subject: ${subject}`,
    fullInput: {
      sender: senderRaw,
      replyTo: replyToRaw || undefined,
      subject,
      body,
    },
    riskScore: totalScore,
    classification,
    primaryCategory,
    summaryVerdict,
    whatWasDetected,
    whyItWasFlagged,
    flaggedExcerpts: Array.from(flaggedExcerptsSet),
    signals,
    recommendedSteps: buildRecommendedSteps(classification, primaryCategory, 'email'),
    urlBreakdown: baseMessageAnalysis.urlBreakdown,
    emailBreakdown,
    analysisEngine: 'Deterministic Multi-Signal Heuristics',
    isDemoCase: params.isDemoCase,
    demoCaseId: params.demoCaseId,
    disclaimer: DISCLAIMER_TEXT,
  };
}
