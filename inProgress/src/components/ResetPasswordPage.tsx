import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

interface ResetPasswordForm {
  newPassword: string;
  rePassword: string;
}

const ResetPasswordPage: React.FC = () => {
  const [form, setForm] = useState<ResetPasswordForm>({
    newPassword: "",
    rePassword: ""
  });
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";

  const handleChange = (field: keyof ResetPasswordForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!form.newPassword || !form.rePassword) {
      setMessage("⚠️ Both password fields are required.");
      return;
    }
    if (form.newPassword !== form.rePassword) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: form.newPassword, rePassword: form.rePassword })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Password successfully reset! Redirecting to login...");
        setTimeout(() => navigate("/auth"), 2000);
      } else {
        setMessage(`❌ ${data.message || "Something went wrong."}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Network error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="password"
          placeholder="New password"
          value={form.newPassword}
          onChange={(e) => handleChange("newPassword", e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={form.rePassword}
          onChange={(e) => handleChange("rePassword", e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "20px",
    textAlign: "center",
    border: "1px solid #ccc",
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
  },
  form: {
    display: "flex",
    flexDirection: "column"
  },
  input: {
    padding: "10px",
    margin: "10px 0",
    borderRadius: "6px",
    border: "1px solid #ccc"
  },
  button: {
    padding: "10px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  }
};

export default ResetPasswordPage;
