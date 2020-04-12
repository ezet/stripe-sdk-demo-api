import {UserRecord} from "firebase-functions/lib/providers/auth";
import {admin, stripe} from "../utils";

export async function setupUserHandler(user: UserRecord) {
    if (user.customClaims && user.customClaims.hasOwnProperty('stripeId')) {
        console.log("User is already connected to a stripe customer. Exiting.");
        return
    }
    const customer = await stripe.customers.create({
        name: user.displayName,
        email: user.email,
        phone: user.phoneNumber,
        metadata: {uid: user.uid}
    });

    await admin.auth().setCustomUserClaims(user.uid, {stripeId: customer.id});
    // TODO: use data from login provider
    return admin.firestore().collection('users').doc(user.uid).set({
        stripeId: customer.id,
        name: user.displayName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        photoUrl: user.photoURL
    }, {merge: true});
}