# Stripe SDK Demo API

This is a sample API to demonstrate use and functionality of [Stripe SDK for Flutter](https://github.com/ezet/stripe-sdk).

## Overview

The API is build for Firebase Cloud Functions.

## Deploy
Deploy it like any regular firebase project.

* https://firebase.google.com/docs/functions/manage-functions

### Quick start

1. `firebase login`
2. `firebase init functions` # Select 'no' when asked to overwrite files:
   * Select *no* when asked to overwrite files.  
3. `firebase functions:config:set stripe.secret_key="<sk_...>"`
   * Use Stripe *secret key*.
4. `firebase deploy`



