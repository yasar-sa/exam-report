import Navbar from "./Navbar";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1, padding: "24px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="container-fluid" style={{ maxWidth: "1400px", margin: "0 auto" }}>
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
      
      <footer style={{ 
        padding: "24px", 
        textAlign: "center", 
        fontSize: "12px", 
        color: "var(--text-soft)",
        borderTop: "1px solid #e2e8f0",
        marginTop: "40px"
      }}>
        &copy; {new Date().getFullYear()} ExamSoft Analytics. All rights reserved.
      </footer>
    </div>
  );
}
