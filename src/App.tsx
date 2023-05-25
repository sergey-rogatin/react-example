import React from "react";
import { Button } from "./components/Button/Button";
import { ConfettiAnimation } from "./components/ConfettiAnimation";
import styles from "./App.module.css";

export const App = () => {
  return (
    <div>
      <ConfettiAnimation isLooping={true} className={styles.confetti} />
    </div>
  );
};
