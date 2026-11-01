import { KBArticle } from '@/types';

export const kbArticles: KBArticle[] = [
  {
    id: 'kb-001',
    title: 'Refund Policy & Process',
    category: 'Refund/Return',
    keywords: [
      'refund',
      'return',
      'money back',
      'cancel',
      'reimburse',
      'policy',
      'how long',
      'days',
      'process',
      'processing time',
      'timing',
      'timeframe',
      'paid by card',
      'credit card',
      'debit card',
      'card refund',
      'original payment method',
      'refund status',
    ],
    approved: true,
    content: `Our refund policy allows returns within 30 days of purchase for most items. To initiate a refund:
1. Log into your account and navigate to Order History.
2. Select the order and click "Request Refund."
3. Choose a reason and submit.
Refunds take 5–7 business days to process to your original payment method. If you paid by credit or debit card, the refund will be credited directly back to that card; your bank or card issuer may take an additional 2–3 business days to post the credit to your statement. Digital products are non-refundable unless defective. Shipping costs are non-refundable unless the return is due to our error.`,
  },
  {
    id: 'kb-002',
    title: 'How to Reset Your Password & Login Help',
    category: 'Account & Login',
    keywords: [
      'password',
      'reset',
      'forgot',
      'login',
      'log in',
      'access',
      'account',
      'locked',
      'sign in',
      'cant sign in',
      'cannot sign in',
      'cant log in',
      'cannot log in',
      'reset email',
      'didnt receive',
      'did not receive',
      'verification code',
    ],
    approved: true,
    content: `If you cannot log in or forgot your password, follow these reset steps:
1. Go to the login page and click "Forgot Password."
2. Enter your registered account email address.
3. Check your email for a reset link (valid for 24 hours). Click the link and enter your new password.
If you didn't receive the reset email:
• Check your spam, junk, or promotions folder.
• Wait 5–10 minutes as email delivery can occasionally be delayed.
• Verify that you entered the exact email address associated with your NovaShop account.
• Add support@novashop.com to your safe sender list.
For accounts with two-factor authentication (2FA) enabled, you will also need your authenticator app code to complete login.`,
  },
  {
    id: 'kb-003',
    title: 'Billing Cycle & Invoice Dates',
    category: 'Billing',
    keywords: ['billing', 'invoice', 'charge', 'payment', 'subscription', 'cycle', 'bill', 'receipt'],
    approved: true,
    content: `Your billing cycle starts on the date you first subscribed. Invoices are generated on the same day each month and sent to your registered email. You can view and download all invoices in Account → Billing → Invoice History. Payment methods accepted: Visa, Mastercard, Amex, PayPal, and bank transfer for annual plans. If a payment fails, we retry after 3 and 7 days before suspending the account.`,
  },
  {
    id: 'kb-004',
    title: 'Shipping Times & Carriers',
    category: 'Shipping/Delivery',
    keywords: ['shipping', 'delivery', 'track', 'package', 'carrier', 'order', 'dispatch', 'arrive', 'transit'],
    approved: true,
    content: `Standard shipping takes 5–7 business days. Express shipping (2–3 business days) is available at checkout. International orders typically arrive in 10–15 business days. Once your order is dispatched, a tracking number will be emailed to you within 24 hours. Carriers used: FedEx (domestic), DHL (international), USPS for PO boxes. Orders placed before 2 PM EST are dispatched same day on business days.`,
  },
  {
    id: 'kb-005',
    title: 'How to Cancel a Subscription',
    category: 'Billing',
    keywords: ['cancel', 'subscription', 'unsubscribe', 'stop', 'end', 'terminate'],
    approved: true,
    content: `To cancel your subscription:
1. Go to Account → Settings → Subscription.
2. Click "Cancel Plan" and follow the prompts.
3. You'll retain access until the end of your current billing period.
Cancelling does not trigger a refund for the current period. If you cancel within 14 days of first subscribing, you're eligible for a full refund under our trial policy. You can re-subscribe at any time.`,
  },
  {
    id: 'kb-006',
    title: 'Two-Factor Authentication (2FA) Setup',
    category: 'Account & Login',
    keywords: ['2fa', 'two factor', 'authentication', 'security', 'otp', 'authenticator', 'google authenticator'],
    approved: true,
    content: `Enable 2FA for extra security:
1. Go to Account → Security → Two-Factor Authentication.
2. Choose your method: Authenticator App (recommended) or SMS.
3. Scan the QR code with Google Authenticator or Authy.
4. Enter the 6-digit code to verify.
Save your backup codes in a secure location — these can restore access if you lose your device. To disable 2FA, verify your identity via email first.`,
  },
  {
    id: 'kb-007',
    title: 'Product Warranty Information',
    category: 'Product Info',
    keywords: ['warranty', 'guarantee', 'defective', 'broken', 'damaged', 'product', 'replacement'],
    approved: true,
    content: `All physical products come with a 12-month manufacturer's warranty covering defects in materials and workmanship. The warranty does not cover: accidental damage, water damage, normal wear and tear, or modifications. To make a warranty claim, contact support with your order number and photos of the defect. We'll arrange a replacement or repair within 10 business days. Extended warranty (24 months) is available at checkout for select products.`,
  },
  {
    id: 'kb-008',
    title: 'Changing Your Email Address',
    category: 'Account & Login',
    keywords: ['email', 'change', 'update', 'account', 'address', 'new email'],
    approved: true,
    content: `To change your email address:
1. Log in and go to Account → Profile → Edit.
2. Click "Change Email" and enter your new email.
3. We'll send a verification link to the new address.
4. Click the link to confirm the change.
Your old email remains active for login until you verify the new one. If you've lost access to your old email and need to change it, contact support with proof of identity.`,
  },
  {
    id: 'kb-009',
    title: 'Tracking Your Order',
    category: 'Shipping/Delivery',
    keywords: ['track', 'tracking', 'order status', 'where', 'shipment', 'locate', 'package'],
    approved: true,
    content: `To track your order:
1. Log in and go to Order History.
2. Click on the order you want to track.
3. Click "Track Package" to see real-time updates.
Alternatively, use the tracking number emailed to you directly on the carrier's website. Tracking information updates every 4–8 hours. If tracking shows "delivered" but you haven't received the package, wait 24 hours (it may be with a neighbour) then contact support.`,
  },
  {
    id: 'kb-010',
    title: 'Payment Failed – What to Do',
    category: 'Billing',
    keywords: ['payment failed', 'declined', 'card', 'payment error', 'charge failed', 'unable to pay'],
    approved: true,
    content: `If your payment fails:
1. Check that your card details are correct and not expired.
2. Ensure you have sufficient funds or credit.
3. Check if your bank has flagged the transaction — call them to authorise it.
4. Try an alternative payment method in Account → Billing.
5. If issues persist, contact your bank or use PayPal as an alternative.
We retry failed payments after 3 and 7 days. After 3 failed retries, your account may be suspended until payment is updated.`,
  },
  {
    id: 'kb-011',
    title: 'Return Process for Physical Products',
    category: 'Refund/Return',
    keywords: ['return', 'send back', 'exchange', 'wrong item', 'damaged item', 'return label'],
    approved: true,
    content: `To return a physical product:
1. Request a return in Order History within 30 days of delivery.
2. We'll email a prepaid return label within 24 hours.
3. Pack the item securely in original packaging if possible.
4. Drop it off at any FedEx or UPS location.
5. Refund is processed within 5–7 days of us receiving the item.
Items must be in original condition. Opened software, perishables, and customised items are non-returnable.`,
  },
  {
    id: 'kb-012',
    title: 'Pricing & Plan Comparison',
    category: 'Product Info',
    keywords: ['price', 'pricing', 'plan', 'cost', 'upgrade', 'tier', 'features', 'compare'],
    approved: true,
    content: `We offer three plans:
• Starter (\$29/month): Up to 3 users, 10 GB storage, email support.
• Pro (\$79/month): Up to 15 users, 100 GB storage, priority chat support, API access.
• Enterprise (custom): Unlimited users, unlimited storage, dedicated support, SLA guarantee.
Annual billing saves 20%. You can upgrade or downgrade at any time — changes take effect at the next billing cycle. Contact sales@supportpilot.com for Enterprise pricing.`,
  },
  {
    id: 'kb-013',
    title: 'How to Submit a Complaint or Feedback',
    category: 'Feedback/Complaint',
    keywords: ['complaint', 'feedback', 'unhappy', 'dissatisfied', 'escalate', 'review', 'issue', 'problem'],
    approved: true,
    content: `We take all feedback seriously. To submit a complaint or feedback:
1. Use the in-app feedback form (Help → Submit Feedback).
2. Email feedback@supportpilot.com with subject "Feedback" or "Complaint."
3. Complaints are reviewed within 2 business days and you'll receive a formal response.
For urgent issues, our support chat (available 9 AM – 6 PM EST, Mon–Fri) gets the fastest response. All feedback is reviewed monthly by our product team.`,
  },
  {
    id: 'kb-014',
    title: 'API & Integration Documentation',
    category: 'Technical Support',
    keywords: ['api', 'integration', 'webhook', 'developer', 'sdk', 'connect', 'technical', 'endpoint'],
    approved: true,
    content: `Our REST API is available on Pro and Enterprise plans. Base URL: api.supportpilot.com/v1. Authentication uses Bearer tokens generated in Account → Developer → API Keys. Key endpoints: /tickets, /messages, /agents, /kb. Rate limits: 1000 requests/hour (Pro), 10,000 requests/hour (Enterprise). Full documentation at docs.supportpilot.com. Webhooks can be configured in Account → Developer → Webhooks for real-time event notifications.`,
  },
  {
    id: 'kb-015',
    title: 'App Not Loading or Crashing',
    category: 'Technical Support',
    keywords: ['crash', 'not loading', 'error', 'broken', 'bug', 'slow', 'glitch', 'freeze', 'technical'],
    approved: true,
    content: `If the app is not loading or crashing:
1. Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R).
2. Clear browser cache and cookies.
3. Try an incognito/private window.
4. Disable browser extensions one by one.
5. Try a different browser (Chrome, Firefox, Edge, Safari).
6. Check status.supportpilot.com for any ongoing incidents.
If the issue persists, contact support with your browser version, OS, and a screenshot of any error message.`,
  },
];

