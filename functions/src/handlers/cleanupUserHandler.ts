import {UserRecord} from "firebase-functions/lib/providers/auth";
import {admin, getStripeCustomerIdForUser, stripe} from "../utils";

export async function cleanupUserHandler(user: UserRecord) {
    await admin.firestore().collection('users').doc(user.uid).delete();
    const stripeId = await getStripeCustomerIdForUser(user);
    if (stripeId !== null) {
        await stripe.customers.del(stripeId);
    } else {
        console.error(new Error(`Unable to find and delete stripe ID for user ${user.uid}.}`))
    }
}