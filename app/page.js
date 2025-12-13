import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
       
        <div className={styles.intro}>
          <h1>Digital Mapping & Land Record Management System</h1>
          <p>
            A web-based platform to automate land record digitization, GPS-based mapping,
and integration with Punjab's PULSE/PLRA systems, replacing manual
processes with accurate, tamper-proof digital records.{" "}
           </p>
           
           </div>
      </main>
    </div>
  );
}
