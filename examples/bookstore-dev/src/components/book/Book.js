/* eslint-disable react/prop-types */
import { useDispatch } from 'react-redux';
import { AnimatePresence, motion, useCycle } from 'framer-motion';
import { React, useState } from 'react';
import { deleteBook } from '../../redux/books/bookSlice';
import ProgressCircle from '../progressCircle/ProgressCircle';
import Chapter from '../chapter/Chapter';
import styles from './bookStyle.module.scss';

const containerA = {
  initial: {},
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.5,
    },
  },
  exit: {
    x: 200,
    opacity: 0,
  },
};

const containerB = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.8,
    },
  },
};

const childVariantA = {
  initial: {
    x: 50,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 10,
      mass: 0.75,
      stiffness: 100,
    },
  },
};

const childVariantB = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 10,
      mass: 0.75,
      stiffness: 200,
    },
  },
};

const Book = (props) => {
  const dispatch = useDispatch();
  const [percent, setPercent] = useState(0);
  const [remove, toggleRemove] = useCycle(true, false);
  const {
    id, title, category, variants, author,
  } = props;
  const handleRemove = () => {
    toggleRemove();
    dispatch(deleteBook({ id }));
  };

  const addProgress = (mod) => {
    const temp = (percent * 100) + (10 * mod);
    if (temp >= 0 && temp <= 100) {
      setPercent((temp / 100));
    }
  };

  return (
    <AnimatePresence initial="false">
      <motion.li
        key="book"
        positionTransition
        className={styles.list}
        variants={variants}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      >
        <motion.div
          className={styles.mainContainer}
          variants={containerA}
          initial="initial"
          animate={remove ? 'animate' : 'exit'}
        >
          <motion.div
            variants={childVariantA}
            className={styles.dataContainer}
          >
            <p className={styles.category}>
              {category}
            </p>
            <p className={styles.title}>
              {title}
            </p>
            <p className={styles.author}>
              {author}
            </p>
            <motion.div
              variants={containerB}
              className={styles.optionsContainer}
            >
              <motion.div
                variants={childVariantB}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={styles.btn}
                  type="button"
                >
                  Comments
                </motion.button>
              </motion.div>
              <motion.div
                variants={childVariantB}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={styles.btn}
                  onClick={handleRemove}
                  type="motion.button"
                >
                  Remove
                </motion.button>
              </motion.div>
              <motion.div
                variants={childVariantB}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={styles.btn}
                  type="button"
                >
                  Edit
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
          <ProgressCircle
            percent={percent}
          />
          <Chapter
            addProgress={addProgress}
          />
        </motion.div>
      </motion.li>
    </AnimatePresence>
  );
};
export default Book;
