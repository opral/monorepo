import { useDispatch } from 'react-redux';
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { createBook } from '../../redux/books/bookSlice';
import styles from './createNewBookStyle.module.scss';

const options = [
  'None',
  'Adventure',
  'Comic',
  'Crime',
  'Docufiction',
  'Epistolary',
  'Erotic',
  'Fiction',
  'Fantasy',
  'Historical',
  'Horror',
  'Magic',
  'Realism',
  'Mystery',
  'Paranoid',
  'Philosophical',
  'Political',
  'Romance',
  'Saga',
  'Satire',
  'Science',
  'Speculative',
  'Superhero',
  'Thriller',
  'Urban',
  'Western',
];

const CreateNewBook = () => {
  const dispatch = useDispatch();
  const titleInput = useRef(null);
  const authorInput = useRef(null);
  const categoryInput = useRef(null);

  const submitBookToStore = () => {
    const newBook = {
      item_id: uuidv4(),
      title: titleInput?.current?.value,
      author: authorInput?.current?.value,
      category: options[categoryInput?.current?.value],
    };
    dispatch(createBook(newBook));
  };

  const clearInputs = () => {
    titleInput.current.value = '';
    categoryInput.current.value = '';
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitBookToStore();
    clearInputs();
  };

  const allCategories = options.map((categorie, index) => (
    <option key={categorie} value={index}>
      {categorie}
    </option>
  ));

  return (
    <section
      className={styles.mainContainer}
    >
      <h1>
        ADD NEW BOOK
      </h1>
      <form onSubmit={handleSubmit}>
        <input required className={styles.title} ref={titleInput} type="text" name="title" placeholder="Title" />
        <input required className={styles.title} ref={authorInput} type="text" name="author" placeholder="Author" />
        <select
          name="category"
          id="category"
          className={styles.category}
          ref={categoryInput}
          required
        >
          <option value="" disabled selected>Category</option>
          <option value="0">
            Category
          </option>
          {allCategories}
        </select>
        <motion.input
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={styles.btn}
          label="Create"
          type="submit"
          name="create"
          value="ADD BOOK"
        />
      </form>
    </section>
  );
};

export default CreateNewBook;
