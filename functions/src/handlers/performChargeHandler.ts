import * as functions from "firebase-functions";
import {getRequestingUserId, getStripeCustomerId, stripe} from "../utils";

export async function performChargeHandler(data: any, context: functions.https.CallableContext) {

    const customerId = await getStripeCustomerId(getRequestingUserId(context));
    const paymentMethodId = data.payment_method_id;
    const amount = data.amount;
    const returnUrl = data.return_url;
    const user_email = "lars.dahl@gmail.com";

    const intent = await stripe.paymentIntents.create({
        customer: customerId,
        payment_method: paymentMethodId,
        confirmation_method: "manual",
        amount: amount,
        application_fee_amount: amount * 0.10,
        return_url: returnUrl,
        confirm: true,
        capture_method: "automatic",
        currency: 'USD',
        receipt_email: user_email,
        payment_method_types: ['card'],
        setup_future_usage: "on_session"
    });
    return {status: intent.status, next_action: intent.next_action, client_secret: intent.client_secret}
}