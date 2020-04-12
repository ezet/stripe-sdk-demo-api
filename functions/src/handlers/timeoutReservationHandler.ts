import { EventContext } from "firebase-functions";
import { DocumentReference, Timestamp } from "@google-cloud/firestore";
import { admin, db, HangerState, stripe } from "../utils";
import { DocumentSnapshot } from "firebase-functions/lib/providers/firestore";
import Stripe = require("stripe");
import StripeError = Stripe.errors.StripeError;

/**
 * Minimum time passed before a reservation is timed out
 * Maximum duration is defined by `timeoutIntervalMinutes` + `timeoutDelayMinutes`
 */
const timeoutDelayMinutes = 5;

/**
 * Interval between each run of timeoutReservationTask
 */
export const timeoutIntervalMinutes = 5;


function cleanupReservation(item: DocumentSnapshot, promiseArray: Promise<any>[]) {
    const batch = db.batch();
    const hanger = item.get('hanger');
    if (hanger instanceof DocumentReference) {
        batch.update(hanger, 'state', HangerState.AVAILABLE);
    }

    batch.update(item.ref, {
        timeout: true, visibleInApp: false, visibleInAdmin: false, eligibleForTimeout: false
    }
    );
    promiseArray.push(batch.commit());
}

// noinspection JSUnusedLocalSymbols
export async function timeoutReservationsHandler(context: EventContext) {

    const timeoutDelayMs = timeoutDelayMinutes * 60 * 1000;
    const fiveMinutesAgo = Timestamp.fromMillis(Timestamp.now().toMillis() - timeoutDelayMs);
    const reservations = await admin.firestore()
        .collection('reservations')
        .where('reservationTime', "<", fiveMinutesAgo)
        .where('eligibleForTimeout', '==', true).get();
    const promiseArray: Promise<any>[] = [];
    console.log(`Cleaning up ${reservations.docs.length} reservations...`);
    for (const item of reservations.docs) {
        const paymentIntentId = item.get('paymentIntent');
        stripe.paymentIntents.cancel(paymentIntentId).then((pi) => {
            cleanupReservation(item, promiseArray);
        }, (e) => {
            console.log(e);
            if (e instanceof StripeError) {
                console.log(e.type);
                console.log(e.message);
                console.log(e.code);
                console.log(e.detail);
            }
        }).catch((e) => {
            console.log(e);
            if (e instanceof StripeError) {
                console.log(e.type);
                console.log(e.message);
                console.log(e.code);
                console.log(e.detail);
            }
        })
    }
    return Promise.all(promiseArray);
}