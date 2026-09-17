import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const faqs = [
  {
    q: 'Is patient data POPIA compliant?',
    a: [
      'Consent is built in: every patient must explicitly agree to a POPIA-worded consent statement before they can use the app, and that consent is timestamped and versioned.',
      'One open item, addressed honestly: the database is currently hosted outside South Africa. POPIA has specific conditions for transferring personal information across borders — this is a known area of ongoing work, not something we consider settled.',
    ],
  },
  {
    q: 'Who can actually see a patient\u2019s data?',
    a: [
      'A clinician can only see patients they\u2019ve personally had a consultation with — not every patient in the system.',
      'Patients can only see their own record, authenticated via login, not a guessable link.',
      'If multiple clinicians have separately treated the same patient, each can see that patient\u2019s full care history — this is intentional, so continuity of care means shared visibility across providers treating the same person.',
    ],
  },
  {
    q: 'What does the AI assistant have access to, and is it safe?',
    a: [
      'The AI only receives what\u2019s needed to answer a patient\u2019s question: their name, consent status, and their own consultation/task history — never login credentials or contact details.',
      'Every message is screened before it reaches the AI. Anything resembling a possible emergency, a medication-change request, or a request for a diagnosis is intercepted and redirected to "contact your healthcare professional" automatically.',
      'The AI is explicitly instructed never to diagnose, prescribe, or claim to have examined the patient.',
    ],
  },
  {
    q: 'What about WhatsApp reminders — is a third party seeing patient data?',
    a: [
      'Sending a WhatsApp reminder means a patient\u2019s phone number and the reminder text pass through our messaging provider (Twilio) to deliver it — a standard third-party processor relationship, the same as any practice using WhatsApp Business tools.',
    ],
  },
  {
    q: 'Can a patient withdraw consent or request their data be deleted?',
    a: [
      'Not yet as a self-service feature. This would currently need to be handled manually on request. Building a proper mechanism for this is a known priority, not an oversight we\u2019re unaware of.',
    ],
  },
  {
    q: 'Is data encrypted?',
    a: [
      'The database connection uses SSL. Passwords are hashed, never stored in plain text. Authentication uses signed, expiring tokens.',
    ],
  },
]

export default function PrivacyEthicsFAQ() {
  return (
    <div className="faq-page">
      <div className="faq-page-inner">
        <Link to="/login" className="faq-back-link">
          <ArrowLeft size={16} />
          Back to sign in
        </Link>

        <h1>Confidentiality &amp; Ethics</h1>
        <p className="faq-page-intro">
          Honest answers based on how FollowApp is actually built today. Where
          something is a genuine open question, it's flagged as one rather
          than glossed over.
        </p>

        {faqs.map((item, i) => (
          <div className="faq-item" key={i}>
            <h2>{item.q}</h2>
            {item.a.map((para, j) => (
              <p key={j}>{para}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
