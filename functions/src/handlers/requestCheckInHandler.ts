// noinspection JSUnusedGlobalSymbols
import { CallableContext, HttpsError } from "firebase-functions/lib/providers/https";
import * as functions from "firebase-functions";
import {
    admin,
    adminVisibilityForState,
    clientVisibilityForState,
    db,
    getRequestingUserId,
    HangerState,
    intentToStatus,
    stripe
} from "../utils";
import { FieldValue } from "@google-cloud/firestore";
// @ts-ignore
import Stripe = require("stripe");

/**
 * Requests a check-in.
 * Finds and available hanger, reserves it and creates a new reservation entry.
 *
 * Returns 'resource-exhausted' if there are no available hangers.
 */
export async function requestCheckInHandler(data: any, context: functions.https.CallableContext) {
    // TODO: validate input
    const code = tokenize(data.code);
    const returnUrl = data.return_url;
    const paymentMethodId = data.payment_method_id;
    const numTickets = data.tickets;
    const userId = getRequestingUserId(context);

    const venueRef = db.doc(`/venues/${code.venueId}`);
    const wardrobeRef = db.doc(venueRef.path + `/wardrobes/${code.wardrobeId}`);
    const sectionRef = db.doc(wardrobeRef.path + `/sections/${code.sectionId}`);

    // TODO: BEGIN transaction
    const hanger = await findAvailableHanger(sectionRef);
    if (hanger === null) throw new HttpsError("resource-exhausted", "no hangers available", sectionRef.path);
    await reserveHanger(hanger.ref);
    // END transaction

    const user = await admin.firestore().collection('users').doc(userId).get();
    const customer_id = user.get('stripeId');
    const user_email = user.get('email');

    const price = 2500;

    // TODO: get amount from section
    // TODO: add statement descriptor
    // TODO: set description
    // TODO: set metadata to reservation ID
    // TODO: set transfer_data and application_fee
    const intent = await stripe.paymentIntents.create({
        customer: customer_id,
        payment_method: paymentMethodId,
        confirmation_method: "manual",
        amount: price * numTickets,
        // application_fee_amount: 250,
        return_url: returnUrl,
        confirm: true,
        capture_method: "manual",
        currency: 'NOK',
        receipt_email: user_email,
        payment_method_types: ['card'],
        setup_future_usage: "on_session"
    });

    // const paymentStatus = intentToStatus(intent);
    const ref = await createReservation(hanger, venueRef, context, sectionRef, wardrobeRef, intent);
    return { status: intent.status, next_action: intent.next_action, client_secret: intent.client_secret, id: ref.id }
}

async function createReservation(hanger: FirebaseFirestore.QueryDocumentSnapshot,
    venueRef: FirebaseFirestore.DocumentReference,
    context: CallableContext,
    sectionRef: FirebaseFirestore.DocumentReference,
    wardrobeRef: FirebaseFirestore.DocumentReference,
    paymentIntent: Stripe.paymentIntents.IPaymentIntent) {
    const hangerName: string = await hanger.get('id');
    const venueName = (await venueRef.get()).get('name');
    const userId = getRequestingUserId(context);
    const userRef = db.doc(`users/${userId}`);
    const userName = (await userRef.get()).get('name');
    const wardrobe = await wardrobeRef.get();
    const wardrobeName = (wardrobe).get('name');
    const color = (wardrobe).get('color');

    const state = intentToStatus(paymentIntent);
    const reservationData = {
        section: sectionRef,
        hanger: hanger.ref,
        hangerName: hangerName,
        user: userRef,
        userName: userName,
        venue: venueRef,
        venueName: venueName,
        wardrobe: wardrobeRef,
        wardrobeName: wardrobeName,
        color: color,
        state: state,
        stateUpdated: FieldValue.serverTimestamp(),
        eligibleForTimeout: true,
        visibleInApp: clientVisibilityForState(state),
        visibleInAdmin: adminVisibilityForState(state),
        reservationTime: FieldValue.serverTimestamp(),
        paymentIntent: paymentIntent.id
    };
    return await db.collection('reservations').add(reservationData)
}

/**
 * Reserves a hanger.
 * @param ref Reference to the hanger that should be reserved.
 */
function reserveHanger(ref: FirebaseFirestore.DocumentReference): Promise<FirebaseFirestore.WriteResult> {
    const data = { 'state': HangerState.TAKEN };
    return ref.update(data)
}

/**
 * Finds an available hanger, if any.
 * Returns an available hanger, or null if no hanger was found.
 * @param sectionRef The wardrobe section to search through.
 */
async function findAvailableHanger(sectionRef: FirebaseFirestore.DocumentReference): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
    const hangers = await db.collection(sectionRef.path + `/hangers`)
        .where('state', "==", HangerState.AVAILABLE)
        .limit(1)
        .get();
    return hangers.empty ? null : hangers.docs[0];
}


class QrCode {
    constructor(public venueId: string, public wardrobeId: string, public sectionId: string) {
    }

}

function tokenize(code: string): QrCode {
    // TODO: return the real values
    return new QrCode("aaXt3hxtb5tf8aTz1BNp", "E8blVz5KBFZoLOTLJGf1", "vnEpTisjoygX3UJFaMy2");
}