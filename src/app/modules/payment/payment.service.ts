import { PaymentStatus } from "@prisma/client";
import { prisma } from "../../shared/pirsmaConfig";
import Stripe from "stripe";
import { SSLService } from "../SSL/ssl.service";

const initPayment = async (appointmentId: string) => {
    const paymentData = await prisma.payment.findFirstOrThrow({
        where: {
            appoinmentId:appointmentId
        },
        include: {
            appointment: {
                include: {
                    patient: true
                }
            }
        }
    });

    const initPaymentData = {
        amount: paymentData.amount,
        transactionId: paymentData.transactionId,
        name: paymentData.appointment.patient.name,
        email: paymentData.appointment.patient.email,
        address: paymentData.appointment.patient.address,
        phoneNumber: paymentData.appointment.patient.contactNumber
    }

    const result = await SSLService.initPayment(initPaymentData);
    return {
        paymentUrl: result.GatewayPageURL
    };

};

// ssl commerz ipn listener query
// amount=1150.00&bank_tran_id=151114130739MqCBNx5&card_brand=VISA&card_issuer=BRAC+BANK%2C+LTD.&card_issuer_country=Bangladesh&card_issuer_country_code=BD&card_no=432149XXXXXX0667&card_type=VISA-Brac+bank¤cy=BDT&status=VALID&store_amount=1104.00&store_id=progr6606bdd704623&tran_date=2015-11-14+13%3A07%3A12&tran_id=5646dd9d4b484&val_id=151114130742Bj94IBUk4uE5GRj&verify_sign=490d86b8ac5faa016f695b60972a7fac&verify_key=amount%2Cbank_tran_id%2Ccard_brand%2Ccard_issuer%2Ccard_issuer_country%2Ccard_issuer_country_code%2Ccard_no%2Ccard_type%2Ccurrency%2Cstatus%2Cstore_amount%2Cstore_id%2Ctran_date%2Ctran_id%2Cval_id

const validatePayment = async (payload: any) => {
    const response = payload;

   await prisma.$transaction(async (tx) => {
  const updatedPaymentData = await tx.payment.update({
    where: {
      transactionId: response.tran_id,
    },
    data: {
      status: PaymentStatus.PAID,
      paymentGatewayData: response,
    },
  });

  await tx.appointment.update({
    where: {
      id: updatedPaymentData.appoinmentId,
    },
    data: {
      paymentStatus: PaymentStatus.PAID,
    },
  });
});

return {
  message: "Payment success!",
};
}


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
  validatePayment,
  initPayment,
};
