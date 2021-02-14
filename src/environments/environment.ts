// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyCHglyjCXmud77q9x00_Q_G_36LsnNx3rM",
    // databaseURL: 'https://jb-chess-default-rtdb.firebaseio.com/',    // RealTime DB
    authDomain: "jb-chess.firebaseapp.com",
    projectId: "jb-chess",
    storageBucket: "jb-chess.appspot.com",
    messagingSenderId: "230963432377",
    appId: "1:230963432377:web:c26e6ad8a28380d0d70468"
  },
  url: 'http://127.0.0.1:4200',  // Defines the sign in email verification link
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
