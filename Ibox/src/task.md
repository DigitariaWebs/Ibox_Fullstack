# Sign-Up Flow Blueprint for iBox

Below is a detailed, screen-by-screen specification for the multi-step sign-up process, covering both **customer** and **transporter** onboarding paths.

---

## 0. On-boarding Entry

| Purpose | UI Elements | Validation | State Keys |
|---|---|---|---|
| Introduce the sign-up journey | • **Title:** "Create your iBox account"  <br/>• **Subtitle:** "It only takes a minute."  <br/>• **CTA:** Primary button "Let's start" | None | — |

---

## 1. Account-Type Screen

| Purpose | UI Elements | Validation / Interactions | State Keys |
|---|---|---|---|
| Branch flow (customer vs. transporter) | • **Title:** "What describes you best?"<br/>• Radio / segmented control:<br/>  ▫ "I need something transported" → `accountType = 'customer'`<br/>  ▫ "I am a transporter" → `accountType = 'transporter'`<br/>• Primary button "Next" (disabled until selection) | Require selection → Save `accountType`  | `accountType` |

---

## 2. Identity Screen (Common)

| Purpose | UI Elements | Validation | State Keys |
|---|---|---|---|
| Collect personal basics & credentials | • First name, Last name<br/>• Email (with regex)<br/>• Mobile phone (intl. mask)<br/>• Password + strength meter<br/>• Confirm password<br/>• Terms & Privacy checkbox (`legalAccepted`)<br/>• Primary button "Send verification code" | All fields required; e-mail, phone & passwords validated; CTA disabled until valid | `firstName`, `lastName`, `email`, `phone`, `password`, `legalAccepted` |

### 2-b. Verification Screen (OTP)

| UI Elements | Validation / Interactions | State Keys |
|---|---|---|
| • Title: "Check your messages"<br/>• 6-digit OTP input (`otp`)<br/>• Resend timer/link<br/>• Secondary "Back"; Primary "Verify" | Require 6 digits → verify → proceed | `otp` |

---

## 3. Address & Locale Screen (Common)

| UI Elements | Validation | State Keys |
|---|---|---|
| • Address autocomplete (`defaultAddress`)<br/>• Optional second address (`secondaryAddress`)<br/>• Language picker (`language`)<br/>• Primary "Next" | Require defaultAddress | `defaultAddress`, `secondaryAddress`, `language` |

---

## 4-a. Customer Extras *(if `accountType === 'customer')*

| UI Elements | Validation | State Keys |
|---|---|---|
| • Payment method input (`paymentToken`) – **Skip** allowed<br/>• Switch "Business account" (`isBusiness`)<br/>  ▫ If **ON**: Company name (`companyName`), VAT/Tax ID (`taxId`)<br/>• Primary "Continue" | If business, require company & tax; payment optional | `paymentToken`, `isBusiness`, `companyName`, `taxId` |

### Navigation → Confirmation (Step 7)

---

## 4-b. Transporter Vehicle *(if `accountType === 'transporter')*

| UI Elements | Validation | State Keys |
|---|---|---|
| • Vehicle type dropdown (`vehicleType`)<br/>• License plate (`plate`)<br/>• Payload kg (`payloadKg`)<br/>• Photo uploader (`vehiclePhotos[]`)<br/>• Primary "Next" | Require all but photos (≥1 recommended) | `vehicleType`, `plate`, `payloadKg`, `vehiclePhotos` |

## 5-b. Transporter Identity & Compliance

| UI Elements | Validation | State Keys |
|---|---|---|
| • Driver's license upload (`licenseImages`)<br/>• Expiry date (`licenseExpiry`)<br/>• Insurance document (`insuranceDoc`)<br/>• Checkbox background-check consent (`bgCheckConsent`)<br/>• Primary "Next" | Require docs, expiry in future, consent true | `licenseImages`, `licenseExpiry`, `insuranceDoc`, `bgCheckConsent` |

## 6-b. Transporter Banking Details

| UI Elements | Validation | State Keys |
|---|---|---|
| • IBAN / Routing + Account no.<br/>• Account holder name (`bankHolder` – prefilled)<br/>• Primary "Continue" | Basic IBAN or ABA validation | `bankIban`, `bankRouting`, `bankAccount`, `bankHolder` |

---

## 7. Confirmation Screen (Both Flows)

| UI Elements | Validation / API | State Keys |
|---|---|---|
| • Summaries of previous steps with **Edit** links<br/>• Checkbox "Everything is correct" (`confirmAll`)<br/>• Primary "Create my account"<br/>• Success animation → main app | Disable CTA until `confirmAll`; on press call `/api/v1/signup`; handle success/failure | `confirmAll` |

---

### Global Implementation Notes

* Central `signUpData` object
* Persist each step to `AsyncStorage` to restore progress
* Yup or similar per-screen validation schemas
* Navigation via `SignUpStack` (`react-navigation`)
* Leverage your existing `Input`, `Button`, `Text`, and translation utilities.

---

> **Deliverable**: This markdown acts as the master task file (`src/task.md`). Design, dev, and QA teams can reference it for feature parity.
