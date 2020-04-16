import * as functions from "firebase-functions";
import {getRequestingUserId, getStripeCustomerId, stripe} from "../utils";

export async function createManualPaymentIntentHandler(data: any, context: functions.https.CallableContext) {

    const customerId = await getStripeCustomerId(getRequestingUserId(context));
    const paymentMethod = data.paymentMethod;
    const amount = data.amount;
    const returnUrl = data.return_url;
    const user_email = "lars.dahl@gmail.com";

    const intent = await stripe.paymentIntents.create({
        customer: customerId,
        payment_method: paymentMethod,
        confirmation_method: "manual",
        amount: amount,
        return_url: returnUrl,
        confirm: true,
        currency: 'USD',
        receipt_email: user_email,
        setup_future_usage: "on_session"
    });
    return {status: intent.status, clientSecret: intent.client_secret, nextAction: intent.next_action}
}