const NAME_PATTERN = /^[a-zA-ZÀ-ÿ.' -]+$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;
const PIN_PATTERN = /^\d{6}$/;

const validateAddress = (req, res, next) => {
    const {
        street,
        city,
        state,
        zip,
        country,
        phone
    } = req.body;

    const cleanedAddress = {
        street:
            typeof street === 'string'
                ? street.trim().replace(/\s+/g, ' ')
                : '',

        city:
            typeof city === 'string'
                ? city.trim().replace(/\s+/g, ' ')
                : '',

        state:
            typeof state === 'string'
                ? state.trim().replace(/\s+/g, ' ')
                : '',

        zip:
            typeof zip === 'string'
                ? zip.trim()
                : String(zip || '').trim(),

        country:
            typeof country === 'string'
                ? country.trim().replace(/\s+/g, ' ')
                : '',

        phone:
            typeof phone === 'string'
                ? phone.replace(/\D/g, '')
                : String(phone || '').replace(/\D/g, '')
    };

    const errors = {};

    if (!cleanedAddress.street) {
        errors.street =
            'Street address is required.';
    } else if (
        cleanedAddress.street.length < 5
    ) {
        errors.street =
            'Street address must contain at least 5 characters.';
    } else if (
        cleanedAddress.street.length > 150
    ) {
        errors.street =
            'Street address cannot exceed 150 characters.';
    }

    if (!cleanedAddress.city) {
        errors.city = 'City is required.';
    } else if (
        cleanedAddress.city.length < 2 ||
        cleanedAddress.city.length > 50
    ) {
        errors.city =
            'City must contain between 2 and 50 characters.';
    } else if (
        !NAME_PATTERN.test(cleanedAddress.city)
    ) {
        errors.city =
            'City can contain only letters, spaces, periods, apostrophes, and hyphens.';
    }

    if (!cleanedAddress.state) {
        errors.state = 'State is required.';
    } else if (
        cleanedAddress.state.length < 2 ||
        cleanedAddress.state.length > 50
    ) {
        errors.state =
            'State must contain between 2 and 50 characters.';
    } else if (
        !NAME_PATTERN.test(cleanedAddress.state)
    ) {
        errors.state =
            'State can contain only letters, spaces, periods, apostrophes, and hyphens.';
    }

    if (!cleanedAddress.country) {
        errors.country = 'Country is required.';
    } else if (
        cleanedAddress.country.length < 2 ||
        cleanedAddress.country.length > 50
    ) {
        errors.country =
            'Country must contain between 2 and 50 characters.';
    } else if (
        !NAME_PATTERN.test(cleanedAddress.country)
    ) {
        errors.country =
            'Country can contain only letters, spaces, periods, apostrophes, and hyphens.';
    }

    if (!cleanedAddress.zip) {
        errors.zip = 'PIN code is required.';
    } else if (
        !PIN_PATTERN.test(cleanedAddress.zip)
    ) {
        errors.zip =
            'Enter a valid 6-digit PIN code.';
    }

    if (!cleanedAddress.phone) {
        errors.phone =
            'Phone number is required.';
    } else if (
        !PHONE_PATTERN.test(cleanedAddress.phone)
    ) {
        errors.phone =
            'Enter a valid 10-digit Indian mobile number beginning with 6, 7, 8, or 9.';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message:
                'Please correct the invalid address details.',
            errors
        });
    }

    req.body = cleanedAddress;

    next();
};

module.exports = validateAddress;