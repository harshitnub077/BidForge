import resend
from core.config import settings

class EmailService:
    def __init__(self):
        if settings.RESEND_API_KEY:
            resend.api_key = settings.RESEND_API_KEY
            self.enabled = True
            print("Resend Email client initialized.")
        else:
            self.enabled = False
            print("WARNING: Resend API Key missing. Email service disabled.")

    def send_proposal_ready_email(self, to_email: str, org_id: str, proposal_name: str, download_link: str):
        if not self.enabled:
            print(f"MOCK EMAIL: Sent to {to_email} - Proposal {proposal_name} is ready.")
            return {"status": "mocked", "message": "Email service not configured"}
            
        try:
            r = resend.Emails.send({
                "from": "notifications@proposalai.com",
                "to": to_email,
                "subject": f"Your Proposal '{proposal_name}' is Ready",
                "html": f"<p>Great news! Your proposal is ready to review and download.</p><p><a href='{download_link}'>Download Proposal</a></p>"
            })
            return r
        except Exception as e:
            print(f"Error sending email: {e}")
            return {"error": str(e)}

email_service = EmailService()
