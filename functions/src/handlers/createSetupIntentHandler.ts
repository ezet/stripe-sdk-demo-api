import * as functions from "firebase-functions";
import {getRequestingUserId, getStripeCustomerId, stripe} from "../utils";
import Stripe = require("stripe");

export async function createSetupIntentHandler(data: any, context: functions.https.CallableContext) {
    const customerId = await getStripeCustomerId(getRequestingUserId(context));
    if (customerId === null) {
        throw new functions.https.HttpsError('failed-precondition', "User has no Stripe ID");
    }
    const params: Stripe.setupIntents.ISetupIntentCreationOptions = {
        customer: customerId,
        usage: 'on_session',
    };

    if (data.paymentMethod) params.payment_method = data.paymentMethod;
    if (data.returlUrl) params.return_url = data.returnUrl;


    const setupIntent = await stripe.setupIntents.create(params);
    return {status: setupIntent.status, clientSecret: setupIntent.client_secret};
}
