function validateEnv() {
    const missing = [];

    if (!process.env.MONGO_URI) {
        missing.push("MONGO_URI");
    }
    if (!process.env.JWT_SECRET) {
        missing.push("JWT_SECRET");
    }
    if (!process.env.EMAIL_USER && !process.env.MAIL_USER) {
        missing.push("EMAIL_USER");
    }
    if (!process.env.EMAIL_PASS && !process.env.MAIL_PASS) {
        missing.push("EMAIL_PASS");
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}`
        );
    }
}

module.exports = { validateEnv };
