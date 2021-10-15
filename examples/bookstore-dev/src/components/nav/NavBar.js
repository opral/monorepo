import React from 'react';
import { motion } from 'framer-motion';
import { FaUser } from 'react-icons/fa';
import MenuItem from './menuItem/MenuItem';
import styles from './navBarStyle.module.scss';
import Logo from '../logo/Logo';

const NavBar = () => {
  const links = [
    {
      id: 1,
      path: '/',
      text: 'Books',
    },
    {
      id: 2,
      path: '/categories',
      text: 'Categories',
    },
  ];

  const createLinks = (linkCollection) => linkCollection.map((link) => (
    <MenuItem
      key={link.id}
      index={link.id}
      to={link.path}
      text={link.text}
    />
  ));

  return (
    <nav className={styles.navBar}>
      <div className={styles.mainContainer}>
        <div className={styles.logo}>
          <h1>
            <Logo message="Bookstore" />
          </h1>
        </div>
        <ul>
          {createLinks(links)}
        </ul>
        <motion.button
          whileHover={{
            scale: 1.3,
            rotate: 360,
          }}
          whileTap={{
            scale: 0.9,
          }}
          className={styles.btn}
          type="button"
        >
          <FaUser className={styles.userIcon} />
        </motion.button>
      </div>
    </nav>
  );
};

export { NavBar as default };
