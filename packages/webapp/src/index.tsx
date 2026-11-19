// @ts-nocheck
import 'regenerator-runtime/runtime';
import './wdyr';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import '@/services/yup';
// NBooks : polices des 4 thèmes, servies par l'app (aucun appel à Google Fonts).
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource/instrument-serif/400.css';
import '@fontsource-variable/bricolage-grotesque';
import App from '@/components/App';
import * as serviceWorker from '@/serviceWorker';
import { store, persistor } from '@/store/create-store';

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PersistGate>
  </Provider>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
