import InfoPageShell from '@/components/ui/info-page-shell'
import { MarkdownContent } from '@/components/info/markdown-content'

const privacyMarkdown = `
# Privacy Policy for SquarePicks

**Last Updated:** 4/10/2025

SquarePicks LLC ("Company", "we", "us", or "our") operates the SquarePicks application and related services (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.

We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy.

## 1. Information Collection and Use

We collect several different types of information for various purposes to provide and improve our Service to you.

**Types of Data Collected:**

*   **Personal Data:** While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This may include, but is not limited to:
    *   Email address
    *   First name and last name
    *   Date of Birth (for eligibility verification)
    *   Username
    *   Usage Data
    *   Cookies Data
    *   Geolocation (to ensure compliance with state-specific eligibility rules)
    *   Government-issued ID (only if required for tax documentation)
*   **Usage Data:** We may also collect information on how the Service is accessed and used ("Usage Data"). This may include information such as your computer's Internet Protocol address (e.g., IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers, and other diagnostic data.
*   **Tracking & Cookies Data:** We use cookies and similar tracking technologies to track the activity on our Service and hold certain information.

## 2. Use of Data

SquarePicks LLC uses the collected data for various purposes:

*   To provide and maintain the Service
*   To notify you about changes to our Service
*   To allow you to participate in interactive features of our Service when you choose to do so
*   To provide customer care and support
*   To provide analysis or valuable information so that we can improve the Service
*   To monitor the usage of the Service
*   To detect, prevent and address technical issues
*   To verify eligibility for sweepstakes entry and prize fulfillment
*   To process payments and manage account balances
*   To comply with tax reporting obligations (e.g., issuing 1099 forms)
*   To comply with applicable legal requirements and prevent fraudulent activity

## 3. Data Transfer

Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction.

We take reasonable steps to ensure that your data is treated securely and in accordance with this Privacy Policy.

## 4. Data Disclosure

**Legal Requirements:** SquarePicks LLC may disclose your Personal Data in the good faith belief that such action is necessary to:

*   To comply with a legal obligation
*   To protect and defend the rights or property of SquarePicks LLC
*   To prevent or investigate possible wrongdoing in connection with the Service
*   To protect the personal safety of users of the Service or the public
*   To protect against legal liability

## 5. Data Security

The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.

We employ encryption, access control protocols, and regular monitoring to safeguard your information.

## 6. Service Providers

We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), provide the Service on our behalf, perform Service-related services, or assist us in analyzing how our Service is used. (e.g., Payment Processors, Analytics Providers, Cloud Hosting). These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.

## 7. Links to Other Sites

Our Service may contain links to other sites that are not operated by us. If you click a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We are not responsible for the content, privacy policies, or practices of any third-party sites or services.

## 8. Children's Privacy

Our Service does not address anyone under the age of 21 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 21. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.

## 9. Your Data Protection Rights

Depending on your location, you may have certain data protection rights, such as:

*   The right to access, update, or delete the information we have on you
*   The right of rectification
*   The right to object
*   The right of restriction
*   The right to data portability
*   The right to withdraw consent

To exercise these rights, please contact us using the details provided below.

## 10. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. Changes are effective when they are posted.

## 11. Contact Us

If you have any questions about this Privacy Policy or wish to exercise any of your data protection rights, please contact us at: contact@squarpicks.com

---
`

export default function PrivacyPage() {
  return (
    <InfoPageShell canvasId="privacy-constellation-canvas">
      <MarkdownContent content={privacyMarkdown} />
    </InfoPageShell>
  )
}