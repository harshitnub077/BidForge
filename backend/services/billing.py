import stripe
from core.config import settings

class BillingService:
    def __init__(self):
        if settings.STRIPE_SECRET_KEY:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            self.enabled = True
            print("Stripe client initialized.")
        else:
            self.enabled = False
            print("WARNING: Stripe Secret Key missing. Billing service disabled.")

    def create_checkout_session(self, org_id: str, plan: str):
        if not self.enabled:
            return {"status": "mocked", "url": "https://stripe.com/mock-checkout"}
            
        try:
            # Setup Stripe checkout logic
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'ProposalAI {plan} Plan',
                        },
                        'unit_amount': 2000, # $20.00
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url='https://proposalai.com/success',
                cancel_url='https://proposalai.com/cancel',
                client_reference_id=org_id
            )
            return {"url": session.url}
        except Exception as e:
            print(f"Error creating checkout session: {e}")
            return {"error": str(e)}

billing_service = BillingService()
