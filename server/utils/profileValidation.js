const NAME_PATTERN = /^[a-zA-ZÀ-ÿ.'-]+(?:\s[a-zA-ZÀ-ÿ.'-]+)*$/;
const CITY_PATTERN = /^[a-zA-ZÀ-ÿ.'-]+(?:\s[a-zA-ZÀ-ÿ.'-]+)*$/;
const PHONE_PATTERN = /^(?:\+91)?[6-9]\d{9}$/;
const PIN_PATTERN = /^[1-9]\d{5}$/;
const STREET_PATTERN = /^[a-zA-Z0-9À-ÿ.,'\-/#()\s]+$/;

const cleanText = (value = '') =>
    typeof value === 'string'
        ? value.trim().replace(/\s+/g, ' ')
        : '';

const normalizePhone = (value = '') => {
    const digits = String(value).replace(/\D/g, '');

    if (digits.length === 12 && digits.startsWith('91')) {
        return `+${digits}`;
    }

    if (digits.length === 10) {
        return `+91${digits}`;
    }

    return String(value).trim();
};

const validateName = (value) => {
    const name = cleanText(value);

    if (!name) {
        return { value: name, error: 'Full name is required.' };
    }

    if (name.length < 2 || name.length > 50) {
        return {
            value: name,
            error: 'Full name must contain between 2 and 50 characters.'
        };
    }

    if (!NAME_PATTERN.test(name)) {
        return {
            value: name,
            error: "Full name can contain only letters, spaces, periods, apostrophes, and hyphens."
        };
    }

    return { value: name };
};

const validateDefaultAddress = (address) => {
    const source = address && typeof address === 'object' ? address : {};

    const cleaned = {
        street: cleanText(source.street),
        city: cleanText(source.city),
        state: cleanText(source.state),
        zip: String(source.zip || '').trim(),
        country: cleanText(source.country || 'India'),
        phone: normalizePhone(source.phone)
    };

    const errors = {};

    if (!cleaned.street) {
        errors.street = 'Street address is required.';
    } else if (cleaned.street.length < 5 || cleaned.street.length > 150) {
        errors.street = 'Street address must contain between 5 and 150 characters.';
    } else if (!STREET_PATTERN.test(cleaned.street) || !/[a-zA-Z0-9À-ÿ]/.test(cleaned.street)) {
        errors.street = 'Street address contains invalid characters.';
    }

    if (!cleaned.city) {
        errors.city = 'City is required.';
    } else if (cleaned.city.length < 2 || cleaned.city.length > 60) {
        errors.city = 'City must contain between 2 and 60 characters.';
    } else if (!CITY_PATTERN.test(cleaned.city)) {
        errors.city = "City can contain only letters, spaces, periods, apostrophes, and hyphens.";
    }

    if (!cleaned.state) {
        errors.state = 'State is required.';
    } else if (cleaned.state.length < 2 || cleaned.state.length > 60) {
        errors.state = 'State must contain between 2 and 60 characters.';
    } else if (!CITY_PATTERN.test(cleaned.state)) {
        errors.state = "State can contain only letters, spaces, periods, apostrophes, and hyphens.";
    }

    if (cleaned.country !== 'India') {
        errors.country = 'Country must be India for the current checkout flow.';
    }

    if (!PIN_PATTERN.test(cleaned.zip)) {
        errors.zip = 'Enter a valid 6-digit Indian PIN code.';
    }

    if (!PHONE_PATTERN.test(cleaned.phone)) {
        errors.phone = 'Enter a valid Indian mobile number beginning with 6, 7, 8, or 9.';
    }

    return {
        value: cleaned,
        errors,
        isValid: Object.keys(errors).length === 0
    };
};

module.exports = {
    cleanText,
    normalizePhone,
    validateName,
    validateDefaultAddress
};