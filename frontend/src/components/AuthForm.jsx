import { useState } from "react";
import loadingImg from "../assets/loading.svg";

function AuthForm({ onSubmit, isLoading }) {
    const [mode, setMode] = useState("login");
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        displayName: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(mode, form);
        setForm({ username: "", email: "", password: "", displayName: "" });
    };

    return (
        <section className="card form-card" style={{ width: "400px", margin: "10px auto" }}>
            <h2>{mode === "login" ? "Login" : "Create account"}</h2>
            <form onSubmit={handleSubmit}>
                {mode === "register" && (
                    <>
                        <label>
                            Username
                            <input
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                required
                            />
                        </label>
                        <label>
                            Display name
                            <input
                                name="displayName"
                                value={form.displayName}
                                onChange={handleChange}
                            />
                        </label>
                    </>
                )}
                <label>
                    Email
                    <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label>
                    Password
                    <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                </label>
                <button className="btn primary" type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <img src={loadingImg} alt="Loading..." style={{ width: "20px", height: "20px" }} />
                    ) : mode === "login" ? (
                        "Login"
                    ) : (
                        "Register"
                    )}
                </button>
            </form>
            <button
                className="link"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
                {mode === "login"
                    ? "Need an account? Register"
                    : "Have an account? Login"}
            </button>
        </section>
    );
}

export default AuthForm;
