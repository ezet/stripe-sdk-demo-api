import * as functions from 'firebase-functions';
import {onCall} from "./utils";
import {getEphemeralKeyHandler} from "./handlers/getEphemeralKeyHandler";
import {setupUserHandler} from "./handlers/setupUserHandler";
import {cleanupUserHandler} from "./handlers/cleanupUserHandler";

import {createSetupIntentHandler} from './handlers/createSetupIntentHandler';
import {createAutomaticPaymentIntentHandler} from "./handlers/createAutomaticPaymentIntentHandler";
import {createManualPaymentIntentHandler} from "./handlers/createManualPaymentIntentHandler";


const region = "europe-west2";
const memory = "128MB";


/**
 * When a new user is created, create and attach a stripe customer
 */
export const setupUser = functions.runWith({memory: memory}).region(region).auth.user().onCreate(setupUserHandler);

/**
 * When a user is deleted, delete any attaches stripe customers
 */
export const cleanupUser = functions.runWith({memory: memory}).region(region).auth.user().onDelete(cleanupUserHandler);

/**
 * Add payment method
 */
export const createSetupIntent = onCall(createSetupIntentHandler);

/**
 * Create ephemeral key
 */
export const getEphemeralKey = onCall(getEphemeralKeyHandler);


/**
 * Create a Payment Intent with automatic confirmation.
 * This supports the *standard flow* as described by Stripe.
 * https://stripe.com/docs/payments/accept-a-payment#android-create-payment-intent
 */
export const createAutomaticPaymentIntent = onCall(createAutomaticPaymentIntentHandler);

/**
 * Create a Payment Intent with manual confirmation.
 * This supports the synchronous flow as described by stripe.
 * https://stripe.com/docs/payments/accept-a-payment-synchronously#android-create-payment-intent
 */
export const createManualPaymentIntent = onCall(createManualPaymentIntentHandler);

