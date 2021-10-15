/* eslint-disable react/prop-types */
import { motion, useCycle } from 'framer-motion';
import React from 'react';
import styles from './updateProgressStyle.module.scss';

const variants = {
  close: {
    width: '150px',
  },
  open: {
    height: '100px',
  },
};

const UpdateModal = (props) => {
  const [open, toggleOpen] = useCycle(false, true);
  const { addProgress } = props;

  return (
    <motion.div
      className={styles.mainContainer}
      variants={variants}
      animate={open ? 'open' : 'close'}
      onClick={open ? () => {} : () => toggleOpen()}
      whileHover={{ scale: 1.05 }}
    >
      {open
        ? (
          <div
            key="updateMenu"
            className={styles.btnContainer}
          >
            <button onClick={() => toggleOpen()} className={styles.close} label="close" type="button">X</button>
            <button onClick={() => addProgress(1)} className={styles.btn} label="add" type="button">Add</button>
            <button onClick={() => addProgress(-1)} className={styles.btn} label="remove" type="button">Remove</button>
          </div>
        )
        : <p>Update progress</p>}
    </motion.div>
  );
};

export default UpdateModal;
