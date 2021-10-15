/* eslint-disable camelcase */
import { access } from '../../api/api-access';
import routes from '../../api/api-routes';

const ADD_BOOK = 'bookStore/books/ADD_BOOK';
const REMOVE_BOOK = 'bookStore/books/REMOVE_BOOK';

const initialState = [];

export const addBook = (payload) => ({
  type: ADD_BOOK,
  payload,
});

export const removeBook = (payload) => ({
  type: REMOVE_BOOK,
  payload,
});

const errorHandle = () => {

};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_BOOK:
      return [...state, action.payload];

    case REMOVE_BOOK:
      return state.filter((book) => book.item_id !== action.payload);

    default:
      return state;
  }
};

export const getBooksFromApi = () => async (dispatch) => {
  try {
    const response = await access.getApi(routes.MAIN);
    Object.entries(response).forEach((book) => {
      const { category, title } = book[1][0];
      const newBook = {
        item_id: book[0],
        title,
        category,
      };
      dispatch(addBook(newBook));
    });
  } catch (error) {
    dispatch(errorHandle(error));
  }

  return 'done';
};

export const postBookToApi = ({ item_id, category, title }) => async (dispatch) => {
  const response = await access.postApi(routes.MAIN, { item_id, category, title });
  if (response.ok) {
    dispatch(addBook({ item_id, category, title }));
  }
};

export const deleteBookFromApi = ({ id }) => async (dispatch) => {
  const response = await access.deleteApi(routes.MAIN, { item_id: id });
  if (response.ok) {
    dispatch(removeBook(id));
  }
};

export default reducer;
