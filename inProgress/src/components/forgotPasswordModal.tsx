// forgotPasswordModal.tsx
import { useState } from "react";

const API_URL = "http://localhost:5000/api";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ cpuEmail: email }), // match backend
      });

      const data: { message?: string; resetToken?: string } = await response.json();

      if (response.ok) {
        setMessage("✅ Password reset link sent! Check your email.");
        setEmail("");
      } else {
        setMessage(`❌ ${data.message || "Something went wrong."}`);
      }
    } catch (error) {
      console.error(error);
      setMessage("⚠️ Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        {message && <p>{message}</p>}
        <button onClick={onClose} style={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    width: "320px",
    textAlign: "center",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  },
  input: {
    width: "100%",
    padding: "8px",
    margin: "10px 0",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  button: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  closeButton: {
    marginTop: "10px",
    backgroundColor: "#ccc",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default ForgotPasswordModal;
