const express = require('express');
const cors = require('cors'); 
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json()); 
app.use(cors());

// --- VALIDATION FUNCTIONS ---

const validateSignupData = (data) => {
    const errors = {};
    const { fullName, username, cpuEmail, password, rePassword } = data;

    // Validate if all fields are filled
    if (!fullName) errors.fullName = "Full name is required.";
    if (!username) errors.username = "Username is required.";
    if (!cpuEmail) errors.cpuEmail = "CPU email is required.";
    if (!password) errors.password = "Password is required.";
    if (!rePassword) errors.rePassword = "Re-enter password is required.";

    // Validate CPU Email domain
    const emailRegex = /@cpu\.edu\.ph$/;
    if (cpuEmail && !emailRegex.test(cpuEmail)) {
        errors.cpuEmail = "Must use CPU email address!";
    }

    // Validate Password Match
    if (password && rePassword && password !== rePassword) {
        errors.rePassword = "Does not match password!";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

const validateLoginDataSimple = (data) => {
    const errors = {};
    // Assuming frontend sends 'email' and 'password' fields
    if (!data.email) {
        errors.email = "Email is required.";
    }
    if (!data.password) {
        errors.password = "Password is required.";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};


// --- ROUTES ---

// SIGNUP ROUTE (Unchanged)
app.post('/api/signup', (req, res) => {
    const data = req.body;
    const { isValid, errors } = validateSignupData(data);

    if (!isValid) {
        return res.status(400).json({ 
            message: 'Validation failed.',
            errors: errors 
        });
    }

    // Temporary. Replace with actual DB logic later.
    console.log('New user signed up (simulated):', { username: data.username, email: data.cpuEmail }); 

    res.status(201).json({ 
        message: 'Sign-up successful! Redirecting to login.',
        user: { username: data.username, email: data.cpuEmail }
    });
});


// LOGIN ROUTE (Simple Validation)
app.post('/api/login', (req, res) => {
    const data = req.body;
    const { isValid, errors } = validateLoginDataSimple(data);

    if (!isValid) {
        // Validation failed: Send a 400 Bad Request status with the errors
        return res.status(400).json({ 
            message: 'Validation failed.',
            errors: errors 
        });
    }

    // TEMPORARY LOGIC: Simulate successful login
    console.log('Attempting login for (simulated):', data.email); 

    res.status(200).json({ 
        message: 'Login successful!',
        token: 'temp_jwt_token_12345'
    });
});


// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
});