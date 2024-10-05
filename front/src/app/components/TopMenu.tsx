"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import React from "react";
import styles from "../../styles/TopMenu.module.css";

const TopMenu: React.FC = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">
          MyApp
        </Link>
      </div>
      <div className={styles.menu}>
        <ul className={styles.menuList}>
        <li className={styles.menuItem}>
            <Link href="/tombola">Raffle</Link>
          </li>
          <li className={styles.menuItem}>
            <Link href="/mint">Mint</Link>
          </li>
        </ul>
      </div>
      <div className={styles.connectButton}>
        <ConnectButton />
      </div>
    </nav>
  );
};

export default TopMenu;
