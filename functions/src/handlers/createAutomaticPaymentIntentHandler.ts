import * as functions from "firebase-functions";
import {getRequestingUserId, getStripeCustomerId, stripe} from "../utils";

export async function createAutomaticPaymentIntentHandler(data: any, context: functions.https.CallableContext) {

    // @ts-ignore
    const customerId = await getStripeCustomerId(getRequestingUserId(context));
    const amount = data.amount;

    const intent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'USD',
    });
    return {status: intent.status, clientSecret: intent.client_secret}
}