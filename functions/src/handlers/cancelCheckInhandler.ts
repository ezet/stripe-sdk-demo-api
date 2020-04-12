import * as functions from "firebase-functions";
import {db, HangerState, stripe} from "../utils";
import {FieldValue} from "@google-cloud/firestore";
import DocumentReference = FirebaseFirestore.DocumentReference;

// noinspection JSUnusedLocalSymbols
export async function cancelCheckInHandler(data: any, context: functions.https.CallableContext) {
    const reservationId: string = data.reservationId;
    const reservationRef = db.doc(`reservations/${reservationId}`);
    const reservation = await reservationRef.get();
    const paymentIntentId = reservation.get('paymentIntent');
    const hangerRef: DocumentReference = reservation.get('hanger');

    // TODO: handle errors
    // @ts-ignore
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId, {'cancellation_reason': 'requested_by_customer'});

    const batch = db.batch();


    batch.update(reservationRef, {
        cancelled: true,
        visibleInApp: false,
        visibleInAdmin: false,
        eligibleForTimeout: false,
        stateUpdated: FieldValue.serverTimestamp()
    });

    batch.update(hangerRef, {state: HangerState.AVAILABLE});
    return batch.commit();
}