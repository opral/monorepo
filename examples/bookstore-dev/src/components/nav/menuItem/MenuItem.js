/* eslint-disable react/prop-types */
import { motion } from 'framer-motion';
import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './menuItemStyle.module.scss';

const MenuItem = ({
  index, to, text,
}) => (
  <li
    className={styles.item}
    key={index}
  >
    <NavLink
      to={to}
      exact
    >
      <motion.button
        type="button"
        className={styles.btn}
        whileHover={styles.hover}
      >
        {text}
      </motion.button>
    </NavLink>
  </li>
);

export default MenuItem;
