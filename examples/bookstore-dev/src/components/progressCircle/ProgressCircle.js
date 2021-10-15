/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { motion } from 'framer-motion';
import { React, useState, useEffect } from 'react';
import styles from './progressCircleStyle.module.scss';

const containerA = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.5,
      delayChildren: 1.5,
    },
  },
};

const childVariantA = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 10,
      mass: 0.75,
      stiffness: 100,
    },
  },
};

const ProgressCircle = (props) => {
  // const { percent } = props;
  const [endPoint, setEnd] = useState(0);

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const { percent } = props;
  const sW = 4;
  const radius = 40;
  const normalizedRadius = radius - (sW * 2);
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - percent * circumference;

  const start = 0;

  const [startX, startY] = getCoordinatesForPercent(start);
  const [endX, endY] = getCoordinatesForPercent(endPoint);

  const largeArcFlag = endPoint > 0.5 ? 1 : 0;

  const pathData = [
    `M ${startX} ${startY}`,
    `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    'L 0 0',
  ].join(' ');

  const style = {
    color: `rgb( 0 0 ${percent * 100 + 150} )`,
  };

  useEffect(() => {
    setEnd(percent);
  }, [percent]);

  return (
    <motion.div className={styles.mainContainer}>
      <motion.div
        className={styles.percentContainer}
        variants={containerA}
        initial="initial"
        animate="animate"
      >
        <motion.svg
          height={radius * 2}
          width={radius * 2}
          variants={childVariantA}
        >
          <circle
            className={styles.percentCircle}
            stroke="#eeeeee"
            fill="transparent"
            strokeWidth={sW}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            className={styles.percentCircle}
            stroke={`rgb( ${(50 / percent)} ${percent * 150} ${percent * 500} )`}
            fill="transparent"
            strokeWidth={sW}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </motion.svg>
        <motion.div
          className={styles.textContainer}
          variants={childVariantA}
        >
          <p className={styles.number}>{`${percent * 100}%`}</p>
          <p className={styles.text}>Completed</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
export default ProgressCircle;
