# KYC and Documents — Reference

Everything the onboarding assistant needs to answer questions about identity documents, KYC methods, and verification paths in the DBS digiSavings onboarding flow.

---

## Key Identity Documents

### PAN (Permanent Account Number)
A 10-character alphanumeric tax identification number issued by the Income Tax Department of India. Required for most banking relationships. In the onboarding flow, your name and date of birth must match exactly what is recorded on your PAN. Used at Step 7.

### Aadhaar
A 12-digit unique identification number issued by UIDAI (Unique Identification Authority of India). Accepted as proof of identity and address. In the onboarding flow, your address is pulled from your Aadhaar record. Used at Step 8. Your full Aadhaar number is sensitive — only share it through official secure channels (such as the app's input field).

### Aadhaar Virtual ID (VID)
A temporary 16-digit number linked to your Aadhaar number, generated through UIDAI's services. It can be used in place of your full Aadhaar number for authentication, protecting your actual Aadhaar number from unnecessary exposure. You can generate a VID through UIDAI's resident portal or via SMS to UIDAI (use the "Generate Aadhaar Virtual ID" link shown in Step 8 of the app for the current method). Valid for a limited period and can be regenerated.

---

## KYC Methods in the Onboarding Flow

### eKYC (OTP-based, fully digital)
- Uses your Aadhaar number or VID to authenticate your identity through UIDAI
- No physical visit required
- Result: **Virtual debit card** issued (per T&C definitions at Step 18)
- Requires both PAN and Aadhaar
- Available in select cities only

### Biometric KYC (branch visit)
- Identity verified in-person at a DBS branch using fingerprint (biometric) verification
- Required for users without PAN, without Aadhaar, using CKYC, or not wanting a debit card
- Result: **Physical debit card** issued (per T&C definitions at Step 18)

---

## Virtual Debit Card vs Physical Debit Card

Per the T&C definitions shown at Step 18 of the onboarding flow:

- **Virtual debit card:** Issued for e-wallets and Savings Accounts opened via OTP-based eKYC (digital path). Accessible in the digibank app.
- **Physical debit card:** Issued for Savings Accounts opened via biometric verification (branch path). Delivered by mail to the address confirmed at Step 10.

---

## Video KYC — Hours and Process (Step 19)

Video KYC connects you with a DBS agent via video call for identity verification. Estimated time: approximately 5 minutes.

**Availability:**
| Day | Hours |
|-----|-------|
| Monday – Friday | 9:00 am – 7:30 pm |
| 1st, 3rd & 5th Saturday | 9:00 am – 7:30 pm |
| 2nd & 4th Saturday | 9:00 am – 6:00 pm |
| Sunday | Closed |
| Bank holidays | Closed |

---

## Branch Visit Path — What to Bring (Step 20)

If you choose the branch visit path for KYC, bring:
1. **Original PAN card**
2. **Original Aadhaar card** (or printed e-Aadhaar)
3. **Your reference code** — the numeric code displayed in the app at Step 20 (log back in to retrieve it if needed)

The branch will use biometric (fingerprint) verification to complete your KYC.

---

## Special Cases — When Branch Visit is Mandatory

The app's welcome screen (Step 2) explicitly states a branch visit is required if:
- You do not have a PAN
- You do not have Aadhaar
- You are using CKYC (Central KYC Registry) for verification
- You do not wish to receive a debit card

---

## Tax Residency — Indian vs Non-Indian Tax Residents (Step 7)

At Step 7 (PAN details), the app asks about tax residency:

- **Indian resident only:** Tap NEXT to continue through the standard digital flow.
- **US citizen, Green card holder, or tax resident of any country other than India:** Tap the alternative link shown on the screen. This routes you through a different declaration process appropriate for your tax status.

---

## CKYC (Central KYC Registry)

CKYC is a centralised KYC record maintained by the Central Registry of Securitisation Asset Reconstruction and Security Interest of India (CERSAI). If your KYC is already recorded in the CKYC registry, you may be able to use that record instead of repeating full eKYC. However, the DBS digibank digital onboarding flow does not support CKYC inline — users who want to use CKYC must visit a DBS branch.

---

## Definitions Reminder

- **KYC:** Know Your Customer — mandatory identity and address verification required by RBI before opening a bank account.
- **eKYC:** Electronic KYC using Aadhaar-based OTP authentication with UIDAI.
- **UIDAI:** Unique Identification Authority of India — the government body that issues and manages Aadhaar.
