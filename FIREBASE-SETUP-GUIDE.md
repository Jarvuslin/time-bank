# Firebase Authentication Setup Guide

## Issue Diagnosis

You're encountering the following errors when trying to use Firebase Authentication:

- `auth/configuration-not-found` (in web app)
- `auth/admin-restricted-operation` (in test script)

Both errors indicate that your Firebase project doesn't have the necessary authentication methods enabled.

## Solution Steps

### 1. Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **time-bank-475ff**

### 2. Enable Authentication Methods

1. In the left sidebar, click on **Authentication**
2. Click on the **Sign-in method** tab
3. You'll see a list of sign-in providers (Email/Password, Google, Facebook, etc.)
4. Click on **Email/Password** (the first option)
5. Toggle the **Enable** switch to ON
6. Click **Save**
7. (Optional) You may also want to enable **Anonymous** authentication for testing

![Firebase Authentication Setup](https://firebasestorage.googleapis.com/v0/b/erik-kessler.appspot.com/o/firebase-auth-setup.png?alt=media&token=4c304825-a3e3-4dd5-8a19-5f0cf75db3bc)

### 3. Verify Your API Key

Your API key appears to be correctly formatted:
```
AIzaSyCUE-rUSwsyoqo4vmczI9kdxU5gJJMgU-I
```

However, if you continue to have issues after enabling authentication methods, you may want to:

1. Go to **Project Settings** (gear icon in top left)
2. Scroll down to **Your apps** section
3. Check that your Web App is registered
4. Verify the API key matches what you're using in your code

### 4. Test Your Authentication

After making these changes:

1. Return to your debug page at: http://localhost:3000/debug
2. Click **Test Firebase Connection**
3. The authentication should now work correctly

### 5. Security Considerations

For a production application, remember to:

1. Set up [Firebase Security Rules](https://firebase.google.com/docs/rules) for Firestore and Storage
2. Configure [Authentication Providers](https://firebase.google.com/docs/auth/web/start) properly
3. Add [Domain Verification](https://firebase.google.com/docs/auth/web/authorized-domains) to restrict where your app can authenticate from

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Web SDK Setup Guide](https://firebase.google.com/docs/web/setup)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)

If you continue to have issues after following these steps, please check the Firebase console for any specific error messages or contact Firebase support. 