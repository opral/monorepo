/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { access } from '../../api/api-access';
import routes from '../../api/api-routes';

export const fetchAllBooks = createAsyncThunk('books/fetchAllBooks', async () => {
  const response = await access.getApi(routes.MAIN);
  const books = Object.entries(response).map((book) => ({
    item_id: book[0],
    title: book[1][0].title.split('/')[0],
    author: book[1][0].title.split('/')[1],
    category: book[1][0].category,
  }));
  return books;
});

export const createBook = createAsyncThunk('books/createBook', async ({
  item_id, author, category, title,
}) => {
  title = title.concat(`/${author}`);
  await access.postApi(routes.MAIN, { item_id, category, title });
});

export const deleteBook = createAsyncThunk('books/deleteBook', async ({ id }) => {
  await access.deleteApi(routes.MAIN, { item_id: id });
});

export const bookSlice = createSlice({
  name: 'books',
  initialState: { entities: [], loading: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllBooks.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(fetchAllBooks.fulfilled, (state, action) => {
        state.entities = [...action.payload];
        state.loading = 'idle';
      });
    builder
      .addCase(createBook.fulfilled, (state, action) => {
        state.loading = 'idle';
        state.entities = [...state.entities, action.meta.arg];
      })
      .addCase(createBook.pending, (state) => {
        state.loading = 'pending';
      });
    builder
      .addCase(deleteBook.fulfilled, (state, action) => {
        state.loading = 'idle';
        const filterArr = state.entities.filter((book) => book.item_id !== action.meta.arg.id);
        state.entities = filterArr;
      })
      .addCase(deleteBook.pending, (state) => {
        state.loading = 'pending';
      });
  },
});
export default bookSlice.reducer;
