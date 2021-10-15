/* eslint-disable no-unused-vars */
// /* eslint-disable no-unused-vars */
// import { createStore, combineReducers, applyMiddleware } from 'redux';
// import logger from 'redux-logger';
// import booksReducer from './books/books';

// const reducer = combineReducers({
//   booksReducer,
// });

// const store = createStore(
//   reducer,
//   applyMiddleware(thunk),
// );

import { configureStore } from '@reduxjs/toolkit';
import thunk from 'redux-thunk';
import logger from 'redux-logger';
import bookReducer from './books/bookSlice';

export default configureStore({
  reducer: {
    books: bookReducer,
  },
  middleware: [thunk],
});
