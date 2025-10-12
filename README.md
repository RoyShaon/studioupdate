# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

---

## Firebase Configuration

Your application's Firebase configuration has been automatically set up for you. However, you still need to enable the correct authentication methods in your Firebase project for the login system to work.

### Enable Authentication Providers

This application is configured to use Email/Password and Anonymous authentication. You must enable them in the Firebase console for the app to function correctly.

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and select your project (`studio-8025684314-1fc15`).
2.  In the left-hand menu, go to **Build > Authentication**.
3.  Click the **Sign-in method** tab.
4.  Enable the following providers:
    *   **Email/Password**
    *   **Anonymous**

After completing these steps, your application will be able to authenticate users and connect to Firebase services without errors.
