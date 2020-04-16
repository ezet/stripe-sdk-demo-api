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


export const createAutomaticPaymentIntent = onCall(createAutomaticPaymentIntentHandler);

export const createManualPaymentIntent = onCall(createManualPaymentIntentHandler);

