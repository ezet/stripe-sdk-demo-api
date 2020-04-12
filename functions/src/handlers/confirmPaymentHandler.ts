import * as functions from "firebase-functions";
import { admin, adminVisibilityForState, clientVisibilityForState, intentToStatus, stripe } from "../utils";
import { paymentIntents } from "stripe";

export async function confirmPaymentHandler(data: any, context: functions.https.CallableContext) {
    console.log(data);
    const reservation = await admin.firestore().collection('reservations').doc(data.reservationId).get();
    const paymentIntentId = reservation.get('paymentIntent');
    const paymentData: paymentIntents.IPaymentIntentConfirmOptions = {};
    paymentData.return_url = 'stripesdk://3ds.stripesdk.io';
    if ('paymentMethodId' in data) paymentData.payment_method = data.paymentMethodId
    // todo: confirm on client first
    const intent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        paymentData);
    const status = intentToStatus(intent);
    await reservation.ref.update({
        state: status,
        visibleInApp: clientVisibilityForState(status),
        visibleInAdmin: adminVisibilityForState(status)
    });
    return { status: intent.status, next_action: intent.next_action, client_secret: intent.client_secret }
}