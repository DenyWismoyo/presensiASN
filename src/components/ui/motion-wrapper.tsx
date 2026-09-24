"use client";

import React from "react";
import { motion, HTMLMotionProps, Variants } from "framer-motion";

export const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 24 
    } 
  }
};

export const staggerContainerVariant: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

export const scaleInVariant: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 20 
    } 
  }
};

export const tapHoverVariant = {
  whileHover: { scale: 1.015 },
  whileTap: { scale: 0.97 }
};

interface MotionProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export function MotionFadeUp({ children, className, ...props }: MotionProps) {
  return (
    <motion.div variants={fadeUpVariant} className={className} {...props}>
      {children}
    </motion.div>
  );
}

export function MotionStaggerContainer({ children, className, ...props }: MotionProps) {
  return (
    <motion.div 
      variants={staggerContainerVariant} 
      initial="hidden" 
      animate="show" 
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionScaleIn({ children, className, ...props }: MotionProps) {
  return (
    <motion.div variants={scaleInVariant} className={className} {...props}>
      {children}
    </motion.div>
  );
}

export function MotionCard({ children, className, ...props }: MotionProps) {
  return (
    <motion.div 
      variants={fadeUpVariant}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
