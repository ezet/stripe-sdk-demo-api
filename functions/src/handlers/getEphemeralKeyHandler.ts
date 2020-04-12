import * as functions from "firebase-functions";
import {getRequestingUserId, getStripeCustomerId, stripe} from "../utils";

export async function getEphemeralKeyHandler(data: any, context: functions.https.CallableContext) {
    const apiVersion = data.stripeversion;
    const customerId = await getStripeCustomerId(getRequestingUserId(context));
    if (customerId === null) {
        throw new functions.https.HttpsError('failed-precondition', "User has no Stripe ID");
    }
    if (apiVersion === undefined) {
        throw new functions.https.HttpsError('invalid-argument', "stripe_version must be specified to create an ephemeral key");
    }
    const key = await stripe.ephemeralKeys.create(
        {customer: customerId},
        {stripe_version: apiVersion});
    return {key: key}
}