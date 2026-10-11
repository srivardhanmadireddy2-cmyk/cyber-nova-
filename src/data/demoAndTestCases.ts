import { DemoCase, TestCaseSpec } from '../types/cybernova';

export const LIVE_DEMO_CASES: DemoCase[] = [
  {
    id: 'demo-a',
    code: 'Case A',
    title: 'Fake Bank KYC Suspension & OTP Demand',
    subtitle: 'Impersonates SBI with an urgent 24-hour account block threat and OTP request',
    inputType: 'message',
    channel: 'SMS',
    expectedClassification: 'High Risk',
    expectedScoreRange: '85 – 100',
    category: 'Bank & KYC Fraud',
    payload: {
      text: 'URGENT: Dear Customer, your State Bank of India YONO account and PAN card KYC has expired today. Your account will be blocked within 24 hours. Immediately click http://sbi-kyc-update-online.xyz/verify and share your 6-digit OTP to reactivate services.',
    },
    teachingPoint:
      'Combines 4 high-risk vectors: brand impersonation, 24-hour suspension panic, an unofficial .xyz lookalike URL over HTTP, and an explicit OTP harvesting demand.',
  },
  {
    id: 'demo-b',
    code: 'Case B',
    title: 'Fake Parcel Delivery Small-Payment Trap',
    subtitle: 'Claims an India Post package is held due to address issue and asks for Rs. 25 via link',
    inputType: 'message',
    channel: 'SMS',
    expectedClassification: 'High Risk',
    expectedScoreRange: '75 – 95',
    category: 'Delivery & Logistics Scam',
    payload: {
      text: 'India Post Notice: Your parcel #IP8492011IN has been put on hold at the regional sorting hub due to an incomplete delivery address. Update your address immediately and pay Rs. 25 re-delivery charge within 12 hours at https://indiapost-parcel-claim.top/login or the package will be returned.',
    },
    teachingPoint:
      'Notice how the URL uses HTTPS ("https://indiapost-parcel-claim.top"), proving HTTPS alone does not mean a link is safe. Official India Post uses indiapost.gov.in.',
  },
  {
    id: 'demo-c',
    code: 'Case C',
    title: 'Fake Job Offer Demanding Registration Fee',
    subtitle: 'Shortlists candidate for a remote role and demands a refundable security deposit',
    inputType: 'message',
    channel: 'WhatsApp',
    expectedClassification: 'High Risk',
    expectedScoreRange: '70 – 90',
    category: 'Recruitment & Job Scam',
    payload: {
      text: 'Congratulations! You have been selected for the Part-Time Work From Home Data Analyst role (Earn Rs 4,500 daily, no experience required). To receive your official offer letter and laptop kit from the HR Department, pay Rs 1,499 as a refundable registration fee immediately via UPI.',
    },
    teachingPoint:
      'Legitimate employers never ask job applicants to pay registration fees, security deposits, or laptop shipping charges before onboarding.',
  },
  {
    id: 'demo-d',
    code: 'Case D',
    title: 'Guaranteed-Return VIP Investment Lure',
    subtitle: 'Promises 200% weekly returns and zero-risk institutional stock/crypto signals',
    inputType: 'message',
    channel: 'WhatsApp',
    expectedClassification: 'High Risk',
    expectedScoreRange: '70 – 95',
    category: 'Investment & Crypto Fraud',
    payload: {
      text: 'Join our exclusive VIP Stock & Crypto Trading Group! Guaranteed returns of 200% weekly profit with zero-risk trading signals. Invest Rs. 10,000 today and get Rs. 30,000 return in 48 hours. Limited slots left—register now at https://bit.ly/vip-wealth-double',
    },
    teachingPoint:
      'Flags unrealistic guaranteed return claims ("200% weekly profit", "invest Rs. 10,000 get Rs. 30,000") paired with a masked URL shortener (bit.ly).',
  },
  {
    id: 'demo-e',
    code: 'Case E',
    title: 'Ordinary Meeting Schedule Reminder',
    subtitle: 'Benign workplace coordination message with zero coercion or credential prompts',
    inputType: 'message',
    channel: 'General Message',
    expectedClassification: 'Low Risk',
    expectedScoreRange: '0 – 15',
    category: 'Benign / Legitimate Communication',
    payload: {
      text: 'Your meeting is scheduled for tomorrow at 10 AM in Conference Room B to review the final semester project presentation slides. Please bring your laptop.',
    },
    teachingPoint:
      'Demonstrates low false-positive behavior: routine calendar and workplace messages trigger zero threat indicators and score 0/100.',
  },
  {
    id: 'demo-f',
    code: 'Case F',
    title: 'Legitimate Banking Transaction Alert',
    subtitle: 'Informational debit notification that requests no credentials and warns against sharing OTP',
    inputType: 'message',
    channel: 'SMS',
    expectedClassification: 'Low Risk',
    expectedScoreRange: '0 – 15',
    category: 'Benign / Legitimate Communication',
    payload: {
      text: 'HDFC Bank Alert: Rs. 1,250.00 has been debited from A/c ending XX4821 on 10-Oct-26 via UPI Ref 628391048211. Available balance is Rs. 24,810.50. Never share your OTP, PIN, or CVV with anyone.',
    },
    teachingPoint:
      'Crucial anti-false-positive test: even though "HDFC Bank", "UPI", and "OTP" appear in the text, our context engine recognizes this as a protective informational notice.',
  },
];

export const VERIFIED_TEST_CASES: TestCaseSpec[] = [
  {
    id: 'TC-01',
    name: 'Fake Bank KYC + OTP Harvesting SMS (Demo Case A)',
    inputType: 'message',
    channel: 'SMS',
    inputSummary: 'SBI YONO KYC expired claim with 24h block threat, .xyz link, and OTP request',
    payload: LIVE_DEMO_CASES[0].payload,
    expectedClassification: 'High Risk',
    expectedMinScore: 80,
    expectedMaxScore: 100,
    keyIndicators: ['Direct OTP Request', '24-Hour Suspension Threat', 'Fake KYC Claim', 'Lookalike .xyz URL'],
  },
  {
    id: 'TC-02',
    name: 'Fake India Post Parcel Fee + HTTPS Phishing Domain (Demo Case B)',
    inputType: 'message',
    channel: 'SMS',
    inputSummary: 'Parcel held notice demanding Rs. 25 re-delivery fee on indiapost-parcel-claim.top',
    payload: LIVE_DEMO_CASES[1].payload,
    expectedClassification: 'High Risk',
    expectedMinScore: 75,
    expectedMaxScore: 100,
    keyIndicators: ['Parcel Interception Lure', 'Small Payment Trap', 'Unofficial Brand Domain (.top)'],
  },
  {
    id: 'TC-03',
    name: 'Work-From-Home Job Registration Fee Scam (Demo Case C)',
    inputType: 'message',
    channel: 'WhatsApp',
    inputSummary: 'Remote role promising Rs 4,500/day asking Rs 1,499 refundable registration deposit',
    payload: LIVE_DEMO_CASES[2].payload,
    expectedClassification: 'High Risk',
    expectedMinScore: 70,
    expectedMaxScore: 100,
    keyIndicators: ['Prepaid Job / Task Lure', 'Upfront Registration Fee Demand', 'Urgency'],
  },
  {
    id: 'TC-04',
    name: 'Guaranteed Return Crypto/Stock VIP Scam (Demo Case D)',
    inputType: 'message',
    channel: 'WhatsApp',
    inputSummary: '200% weekly profit promise with bit.ly shortener link',
    payload: LIVE_DEMO_CASES[3].payload,
    expectedClassification: 'High Risk',
    expectedMinScore: 70,
    expectedMaxScore: 100,
    keyIndicators: ['Guaranteed Return Claim', 'URL Shortener Obfuscation (bit.ly)'],
  },
  {
    id: 'TC-05',
    name: 'Routine Meeting Reminder (Demo Case E — Benign Baseline)',
    inputType: 'message',
    channel: 'General Message',
    inputSummary: 'Your meeting is scheduled for tomorrow at 10 AM in Conference Room B...',
    payload: LIVE_DEMO_CASES[4].payload,
    expectedClassification: 'Low Risk',
    expectedMinScore: 0,
    expectedMaxScore: 15,
    keyIndicators: ['No Threat Signals Triggered'],
  },
  {
    id: 'TC-06',
    name: 'Legitimate Bank Debit Notification with Protective Warning (Demo Case F)',
    inputType: 'message',
    channel: 'SMS',
    inputSummary: 'HDFC Bank debit alert with balance info and "Never share your OTP, PIN, or CVV"',
    payload: LIVE_DEMO_CASES[5].payload,
    expectedClassification: 'Low Risk',
    expectedMinScore: 0,
    expectedMaxScore: 15,
    keyIndicators: ['Protective Context Dampener Active', 'No Actionable Trap'],
  },
  {
    id: 'TC-07',
    name: 'Remote Access Screen-Sharing Tech Support Scam',
    inputType: 'message',
    channel: 'WhatsApp',
    inputSummary: 'Electricity disconnection threat asking user to install AnyDesk APK',
    payload: {
      text: 'Dear Consumer, your electricity connection will be disconnected tonight at 9:30 PM because your previous month bill update failed. Immediately download AnyDesk support app and share your 9-digit remote access code with officer Sharma.',
    },
    expectedClassification: 'High Risk',
    expectedMinScore: 80,
    expectedMaxScore: 100,
    keyIndicators: ['AnyDesk Remote Access Request', 'Utility Disconnection Threat'],
  },
  {
    id: 'TC-08',
    name: 'HTTPS Lookalike Banking Phishing URL (Typosquatting)',
    inputType: 'url',
    inputSummary: 'https://login.secure-hdfcbank-verify.xyz/netbanking/update-kyc',
    payload: {
      url: 'https://login.secure-hdfcbank-verify.xyz/netbanking/update-kyc',
    },
    expectedClassification: 'High Risk',
    expectedMinScore: 75,
    expectedMaxScore: 100,
    keyIndicators: ['HDFC Brand Spoofing', 'High-Abuse .xyz TLD', 'Multiple Hyphens', 'Phishing Path Tokens'],
  },
  {
    id: 'TC-09',
    name: 'Raw IP Address Credential Harvester URL',
    inputType: 'url',
    inputSummary: 'http://45.133.192.18/onlinesbi/login.php?session=verify',
    payload: {
      url: 'http://45.133.192.18/onlinesbi/login.php?session=verify',
    },
    expectedClassification: 'High Risk',
    expectedMinScore: 80,
    expectedMaxScore: 100,
    keyIndicators: ['Unencrypted HTTP', 'Raw IPv4 Hostname', 'SBI Brand Token in Path'],
  },
  {
    id: 'TC-10',
    name: 'Official Institutional HTTPS Domain (Legitimate URL Baseline)',
    inputType: 'url',
    inputSummary: 'https://www.onlinesbi.sbi/sbijava/retail/html/faq.html',
    payload: {
      url: 'https://www.onlinesbi.sbi/sbijava/retail/html/faq.html',
    },
    expectedClassification: 'Low Risk',
    expectedMinScore: 0,
    expectedMaxScore: 20,
    keyIndicators: ['Verified Official SBI Domain (onlinesbi.sbi)', 'HTTPS Transport'],
  },
  {
    id: 'TC-11',
    name: 'Spoofed Display Name & Reply-To Mismatch Phishing Email',
    inputType: 'email',
    inputSummary: 'From: "HDFC Bank Security <alert.verify88@gmail.com>" with urgent KYC link',
    payload: {
      sender: 'HDFC Bank Security <alert.verify88@gmail.com>',
      replyTo: 'collect-credentials@steal-data.xyz',
      subject: 'URGENT: Unauthorized Login Attempt - Verify Account Immediately',
      body: 'Dear Valued Customer, we detected an unauthorized login to your HDFC NetBanking account. Your account has been restricted. Please click https://hdfcbank-verify-portal.top/login within 6 hours and submit your OTP and NetBanking password to restore access.',
    },
    expectedClassification: 'High Risk',
    expectedMinScore: 85,
    expectedMaxScore: 100,
    keyIndicators: [
      'Display Name vs @gmail.com Spoofing',
      'Reply-To Domain Mismatch',
      'Urgent Subject Line',
      'Credential Request + Phishing Link',
    ],
  },
  {
    id: 'TC-12',
    name: 'Legitimate Academic / Corporate Email Communication',
    inputType: 'email',
    inputSummary: 'From: "Prof. R. Subramanian <hod.cse@college.edu.in>" regarding project review',
    payload: {
      sender: 'Prof. R. Subramanian <hod.cse@college.edu.in>',
      replyTo: 'hod.cse@college.edu.in',
      subject: 'Schedule for Open Innovation Track (TRI26158) Final Evaluation',
      body: 'Dear Team Cybernova, please note that the faculty panel evaluation for Track: Open Innovation is scheduled for Friday at 2:00 PM in the Main Auditorium. Ensure your live software prototype and test cases are ready for demonstration.',
    },
    expectedClassification: 'Low Risk',
    expectedMinScore: 0,
    expectedMaxScore: 15,
    keyIndicators: ['Consistent Academic Sender Domain', 'Benign Informational Body'],
  },
];

export const CYBER_SAFETY_GUIDES = [
  {
    category: 'Banking, KYC & UPI Protection',
    summary: 'How to defend against OTP harvesting, fake KYC suspension alerts, and QR/UPI collect traps.',
    rules: [
      {
        title: 'UPI PIN is Only for Sending Money—Never Receiving',
        detail:
          'If someone asks you to scan a QR code or enter your 4/6-digit UPI PIN to "receive a refund, cashback, or buyer payment," it is 100% a scam.',
      },
      {
        title: 'Never Click SMS Links for PAN / KYC Updates',
        detail:
          'Banks never threaten 24-hour account disconnection via public URL shorteners (bit.ly) or unofficial domains (.xyz, .top). Always open your official banking app directly.',
      },
      {
        title: 'Guard Your OTP, CVV, and MPIN Absolutely',
        detail:
          'No bank official, RBI representative, or customer care agent will ever ask you to read out an OTP or install a screen-sharing app.',
      },
    ],
  },
  {
    category: 'URL, Domain & Phishing Verification',
    summary: 'How to read a URL right-to-left before entering any password or financial detail.',
    rules: [
      {
        title: 'The Padlock (HTTPS) Does Not Mean a Website is Legitimate',
        detail:
          'HTTPS only means traffic between your browser and that server is encrypted. Over 80% of phishing sites today use free Let’s Encrypt SSL certificates.',
      },
      {
        title: 'Inspect the Root Domain Before the First Single Slash "/"',
        detail:
          'In "https://onlinesbi.com.account-verify.xyz/login", the real website is "account-verify.xyz"—not onlinesbi.com. Always read the two words right before the first single "/".',
      },
      {
        title: 'Watch for Homoglyphs and Leetspeak Substitutions',
        detail:
          'Attackers replace "o" with "0", "l" with "1", or "m" with "rn" (e.g., "paypa1.com" or "rnicrosoft.com") to fool quick visual glances on mobile screens.',
      },
    ],
  },
  {
    category: 'Remote Access, Job & Investment Scams',
    summary: 'Recognizing psychological manipulation in work-from-home offers and trading groups.',
    rules: [
      {
        title: 'Never Install AnyDesk, TeamViewer, or RustDesk for "Support"',
        detail:
          'Remote desktop apps allow scammers to watch your screen in real time, steal incoming SMS OTPs, and empty your bank accounts within seconds.',
      },
      {
        title: 'Real Jobs Pay You—They Never Charge Registration or Laptop Fees',
        detail:
          'Any recruiter demanding a "refundable security deposit", "training fee", or "Telegram prepaid task recharge" is running an advance-fee fraud.',
      },
      {
        title: 'Guaranteed High Returns Do Not Exist',
        detail:
          'WhatsApp and Telegram groups promising 100%–300% weekly returns or "institutional VIP allotments" use fake dashboard apps that block withdrawals once you deposit larger sums.',
      },
    ],
  },
];
