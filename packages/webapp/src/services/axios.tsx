// @ts-nocheck
import axios from 'axios';
import jsCookie from 'js-cookie';
import { store } from '@/store/create-store';
const http = axios.create();

http.interceptors.request.use(
  (request) => {
    const state = store.getState();
    const { token, organization } = state.authentication;
    // NBooks: send the UI language (cookie synced with the organization language).
    const locale = jsCookie.get('locale') || 'en';

    if (token) {
      request.headers.common['x-access-token'] = token;
    }
    if (organization) {
      request.headers.common['organization-id'] = organization;
    }
    if (locale) {
      request.headers.common['Accept-Language'] = locale;
    }

    return request;
  },
  (error) => {
    return Promise.reject(error);
  },
);

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status } = error.response;

    // if (status >= 500) {
    //   store.dispatch(setGlobalErrors({ something_wrong: true }));
    // }
    // if (status === 401) {
    //   // store.dispatch(setGlobalErrors({ session_expired: true }));
    //   // store.dispatch(logout());
    // }
    return Promise.reject(error);
  },
);

export default http;
