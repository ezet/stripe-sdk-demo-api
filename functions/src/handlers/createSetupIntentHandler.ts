import * as functions from "firebase-functions";
import {getRequestingUserId, getStripeCustomerId, stripe} from "../utils";

export async function createSetupIntentHandler(data: any, context: functions.https.CallableContext) {
    const customerId = await getStripeCustomerId(getRequestingUserId(context));
    if (customerId === null) {
        throw new functions.https.HttpsError('failed-precondition', "User has no Stripe ID");
    }
    const setupIntent = await stripe.setupIntents.create({
        confirm: true,
        customer: customerId,
        payment_method: data.paymentMethod,
        usage: 'on_session',
        return_url: data.return_url,
        payment_method_types: ["card"],
    });
    return {status: setupIntent.status, clientSecret: setupIntent.client_secret};
}
