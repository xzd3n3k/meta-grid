import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import {browserSessionPersistence, getAuth, setPersistence} from '@angular/fire/auth';

bootstrapApplication(App, appConfig)
  .then(() => {
    const auth = getAuth();
    return setPersistence(auth, browserSessionPersistence);
  })
  .catch((err) => console.error(err));
