import * as functions from "firebase-functions";
import {adminVisibilityForState, clientVisibilityForState, db, ReservationState} from "../utils";
import {FieldValue} from "@google-cloud/firestore";

// noinspection JSUnusedLocalSymbols
export async function requestCheckOutHandler(data: any, context: functions.https.CallableContext) {
    const ref = db.doc(`reservations/${data.reservationId}`);

    const newState = ReservationState.CHECKING_OUT;
    const newData = {
        state: newState,
        visibleInApp: clientVisibilityForState(newState),
        visibleInAdmin: adminVisibilityForState(newState),
        stateUpdated: FieldValue.serverTimestamp()
    };
    return ref.update(newData);
}