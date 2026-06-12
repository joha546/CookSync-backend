class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}

function parseJsonField(value, fieldName) {
    if (value === undefined || value === null || value === "") {
        throw new ValidationError(`${fieldName} is required`);
    }

    try {
        return JSON.parse(value);
    } catch {
        throw new ValidationError(`${fieldName} must be valid JSON`);
    }
}

module.exports = { parseJsonField, ValidationError };
