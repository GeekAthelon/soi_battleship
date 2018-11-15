import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";

export function doThing() {
    const app: firebase.app.App = firebase.initializeApp({
        apiKey: "AIzaSyD1jhj1QQOCcyjdj1TeyRjfq6MlFsrXU5M",
        authDomain: "soi-battlehip.firebaseapp.com",
        databaseURL: "https://soi-battlehip.firebaseio.com/",
        messagingSenderId: "741547557143",
        projectId: "soi-battlehip",
        storageBucket: "soi-battlehip.appspot.com",
    });

    firebase.auth().signInAnonymously().catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        throw error;
    });

    firebase.auth().onAuthStateChanged((user) => {
        // Once authenticated, instantiate Firechat with the logged in user
        if (user) {
            // Access the real-time database in the initialized application.
            const db: firebase.database.Database = app.database();

            // Try to write to and read back from Firebase.
            try {
                const dbReferenceObject = db.ref().child("jjs");

                const testVal = (snap: any) => {
                    if (snap) {
                        // tslint:disable-next-line:no-console
                        console.log(snap.val());
                    }
                };

                dbReferenceObject.once("value", testVal);
                dbReferenceObject.set(new Date().getTime());
            } catch (error) {
                // tslint:disable-next-line:no-console
                console.log(error);
            }
        }
    });
}
