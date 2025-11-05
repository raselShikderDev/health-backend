import { PaymentStatus } from "@prisma/client";
import { prisma } from "../../shared/pirsmaConfig";
import Stripe from "stripe";

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  console.log("hit on handleStripeWebhookEvent");

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;

      const appointmentId = session.metadata?.appointmentId;
      const paymentId = session.metadata?.paymentId;
      console.log("session.payment_status", session.payment_status);

      await prisma.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          paymentStatus:
            session.payment_status === "paid"
              ? PaymentStatus.PAID
              : PaymentStatus.UNPAID,
        },
      });

      await prisma.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          status:
            session.payment_status === "paid"
              ? PaymentStatus.PAID
              : PaymentStatus.UNPAID,
          paymentGatewayData: session,
        },
      });

      break;
    }

    default:
      console.log(` Unhandled event type: ${event.type}`);
  }
};

export const paymentService = {
  handleStripeWebhookEvent,
};
