import * as functions from "firebase-functions";
import {adminVisibilityForState, clientVisibilityForState, db, ReservationState, stripe} from "../utils";
import {FieldValue} from "@google-cloud/firestore";

export async function confirmCheckInHandler(data: any, context: functions.https.CallableContext) {
    const reservationRef = db.doc(`reservations/${data.reservationId}`);
    const reservation = await reservationRef.get();
    const paymentIntentId = reservation.get('paymentIntent');

    await stripe.paymentIntents.capture(paymentIntentId);

    const newState = ReservationState.CHECKED_IN;
    const payload = {
        checkedIn: FieldValue.serverTimestamp(),
        stateUpdated: FieldValue.serverTimestamp(),
        state: newState,
        eligibleForTimeout: false,
        visibleInApp: clientVisibilityForState(newState),
        visibleInAdmin: adminVisibilityForState(newState)
    };
    await reservationRef.update(payload);
    return {}
}