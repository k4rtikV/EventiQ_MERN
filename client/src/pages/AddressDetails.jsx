import React, {
    useEffect,
    useState
} from 'react';

import {
    useNavigate,
    useParams
} from 'react-router-dom';

import api from '../utils/axios';

const INITIAL_FORM = {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
    phone: ''
};

const NAME_PATTERN =
    /^[a-zA-ZÀ-ÿ.' -]+$/;

const PHONE_PATTERN =
    /^[6-9]\d{9}$/;

const PIN_PATTERN =
    /^\d{6}$/;

const AddressDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState('');

    const [fieldErrors, setFieldErrors] =
        useState({});

    const [form, setForm] =
        useState(INITIAL_FORM);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const { data } = await api.get(
                    `/bookings/${id}`
                );

                setBooking(data);

                if (data.address) {
                    setForm({
                        street:
                            data.address.street || '',

                        city:
                            data.address.city || '',

                        state:
                            data.address.state || '',

                        zip:
                            data.address.zip || '',

                        country:
                            data.address.country ||
                            'India',

                        phone:
                            data.address.phone || ''
                    });
                }
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                        'Unable to load booking details.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [id]);

    const cleanText = (value) =>
        value.trim().replace(/\s+/g, ' ');

    const getCleanedForm = () => ({
        street: cleanText(form.street),
        city: cleanText(form.city),
        state: cleanText(form.state),
        zip: form.zip.trim(),
        country: cleanText(form.country),
        phone: form.phone.replace(/\D/g, '')
    });

    const validateForm = () => {
        const cleanedForm = getCleanedForm();
        const errors = {};

        if (!cleanedForm.street) {
            errors.street =
                'Street address is required.';
        } else if (
            cleanedForm.street.length < 5
        ) {
            errors.street =
                'Street address must contain at least 5 characters.';
        } else if (
            cleanedForm.street.length > 150
        ) {
            errors.street =
                'Street address cannot exceed 150 characters.';
        }

        if (!cleanedForm.city) {
            errors.city =
                'City is required.';
        } else if (
            cleanedForm.city.length < 2 ||
            cleanedForm.city.length > 50
        ) {
            errors.city =
                'City must contain between 2 and 50 characters.';
        } else if (
            !NAME_PATTERN.test(
                cleanedForm.city
            )
        ) {
            errors.city =
                'City can contain only letters, spaces, periods, apostrophes, and hyphens.';
        }

        if (!cleanedForm.state) {
            errors.state =
                'State is required.';
        } else if (
            cleanedForm.state.length < 2 ||
            cleanedForm.state.length > 50
        ) {
            errors.state =
                'State must contain between 2 and 50 characters.';
        } else if (
            !NAME_PATTERN.test(
                cleanedForm.state
            )
        ) {
            errors.state =
                'State can contain only letters, spaces, periods, apostrophes, and hyphens.';
        }

        if (!cleanedForm.country) {
            errors.country =
                'Country is required.';
        } else if (
            cleanedForm.country.length < 2 ||
            cleanedForm.country.length > 50
        ) {
            errors.country =
                'Country must contain between 2 and 50 characters.';
        } else if (
            !NAME_PATTERN.test(
                cleanedForm.country
            )
        ) {
            errors.country =
                'Country can contain only letters, spaces, periods, apostrophes, and hyphens.';
        }

        if (!cleanedForm.zip) {
            errors.zip =
                'PIN code is required.';
        } else if (
            !PIN_PATTERN.test(cleanedForm.zip)
        ) {
            errors.zip =
                'Enter a valid 6-digit PIN code.';
        }

        if (!cleanedForm.phone) {
            errors.phone =
                'Phone number is required.';
        } else if (
            !PHONE_PATTERN.test(
                cleanedForm.phone
            )
        ) {
            errors.phone =
                'Enter a valid 10-digit Indian mobile number beginning with 6, 7, 8, or 9.';
        }

        setFieldErrors(errors);

        return {
            isValid:
                Object.keys(errors).length === 0,
            cleanedForm
        };
    };

    const handleInputChange = (event) => {
        const {
            name,
            value
        } = event.target;

        let updatedValue = value;

        if (name === 'phone') {
            updatedValue = value
                .replace(/\D/g, '')
                .slice(0, 10);
        }

        if (name === 'zip') {
            updatedValue = value
                .replace(/\D/g, '')
                .slice(0, 6);
        }

        setForm((currentForm) => ({
            ...currentForm,
            [name]: updatedValue
        }));

        setFieldErrors((currentErrors) => ({
            ...currentErrors,
            [name]: ''
        }));

        setError('');
    };

    const handleBlur = (event) => {
        const {
            name
        } = event.target;

        if (
            [
                'street',
                'city',
                'state',
                'country'
            ].includes(name)
        ) {
            setForm((currentForm) => ({
                ...currentForm,
                [name]: cleanText(
                    currentForm[name]
                )
            }));
        }
    };

    const handleSaveAddress = async (
        event
    ) => {
        event.preventDefault();

        setError('');

        const {
            isValid,
            cleanedForm
        } = validateForm();

        if (!isValid) {
            setError(
                'Please correct the highlighted fields before continuing.'
            );

            return;
        }

        try {
            setSaving(true);

            await api.put(
                `/bookings/${id}/address`,
                cleanedForm
            );

            navigate(
                `/booking/${id}/payment`
            );
        } catch (err) {
            const backendErrors =
                err.response?.data?.errors;

            if (
                backendErrors &&
                typeof backendErrors === 'object'
            ) {
                setFieldErrors(
                    backendErrors
                );
            }

            setError(
                err.response?.data?.message ||
                    'Unable to save address.'
            );
        } finally {
            setSaving(false);
        }
    };

    const inputClass = (fieldName) =>
        `mt-2 block w-full rounded-2xl border bg-gray-50 px-4 py-3 outline-none transition ${
            fieldErrors[fieldName]
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-200'
        }`;

    const renderFieldError = (fieldName) =>
        fieldErrors[fieldName] ? (
            <span className="block mt-2 text-sm font-medium text-red-600">
                {fieldErrors[fieldName]}
            </span>
        ) : null;

    if (loading) {
        return (
            <div className="text-center py-20 text-xl font-semibold">
                Loading booking...
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="text-center py-20 text-xl font-semibold text-red-500">
                Booking not found.
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-8 mt-10 border border-gray-100">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900">
                    Enter Your Address
                </h1>

                <p className="text-gray-500 mt-2">
                    One more step before payment.
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-100"
                >
                    {error}
                </div>
            )}

            <form
                onSubmit={handleSaveAddress}
                noValidate
                className="grid gap-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="block">
                        <span className="text-sm font-semibold text-gray-700">
                            Street Address
                        </span>

                        <input
                            type="text"
                            name="street"
                            value={form.street}
                            onChange={
                                handleInputChange
                            }
                            onBlur={handleBlur}
                            minLength={5}
                            maxLength={150}
                            autoComplete="street-address"
                            placeholder="Flat, building and street"
                            aria-invalid={
                                Boolean(
                                    fieldErrors.street
                                )
                            }
                            className={inputClass(
                                'street'
                            )}
                        />

                        {renderFieldError(
                            'street'
                        )}
                    </label>

                    <label className="block">
                        <span className="text-sm font-semibold text-gray-700">
                            City
                        </span>

                        <input
                            type="text"
                            name="city"
                            value={form.city}
                            onChange={
                                handleInputChange
                            }
                            onBlur={handleBlur}
                            minLength={2}
                            maxLength={50}
                            autoComplete="address-level2"
                            placeholder="Mumbai"
                            aria-invalid={
                                Boolean(
                                    fieldErrors.city
                                )
                            }
                            className={inputClass(
                                'city'
                            )}
                        />

                        {renderFieldError(
                            'city'
                        )}
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="block">
                        <span className="text-sm font-semibold text-gray-700">
                            State
                        </span>

                        <input
                            type="text"
                            name="state"
                            value={form.state}
                            onChange={
                                handleInputChange
                            }
                            onBlur={handleBlur}
                            minLength={2}
                            maxLength={50}
                            autoComplete="address-level1"
                            placeholder="Maharashtra"
                            aria-invalid={
                                Boolean(
                                    fieldErrors.state
                                )
                            }
                            className={inputClass(
                                'state'
                            )}
                        />

                        {renderFieldError(
                            'state'
                        )}
                    </label>

                    <label className="block">
                        <span className="text-sm font-semibold text-gray-700">
                            PIN Code
                        </span>

                        <input
                            type="text"
                            name="zip"
                            value={form.zip}
                            onChange={
                                handleInputChange
                            }
                            inputMode="numeric"
                            autoComplete="postal-code"
                            maxLength={6}
                            placeholder="400001"
                            aria-invalid={
                                Boolean(
                                    fieldErrors.zip
                                )
                            }
                            className={inputClass(
                                'zip'
                            )}
                        />

                        <span className="block mt-2 text-xs text-gray-500">
                            Enter a 6-digit Indian
                            PIN code.
                        </span>

                        {renderFieldError(
                            'zip'
                        )}
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="block">
                        <span className="text-sm font-semibold text-gray-700">
                            Country
                        </span>

                        <input
                            type="text"
                            name="country"
                            value={form.country}
                            onChange={
                                handleInputChange
                            }
                            onBlur={handleBlur}
                            minLength={2}
                            maxLength={50}
                            autoComplete="country-name"
                            placeholder="India"
                            aria-invalid={
                                Boolean(
                                    fieldErrors.country
                                )
                            }
                            className={inputClass(
                                'country'
                            )}
                        />

                        {renderFieldError(
                            'country'
                        )}
                    </label>

                    <label className="block">
                        <span className="text-sm font-semibold text-gray-700">
                            Mobile Number
                        </span>

                        <div className="relative mt-2">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 font-semibold pointer-events-none">
                                +91
                            </span>

                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={
                                    handleInputChange
                                }
                                inputMode="numeric"
                                autoComplete="tel-national"
                                maxLength={10}
                                placeholder="9876543210"
                                aria-invalid={
                                    Boolean(
                                        fieldErrors.phone
                                    )
                                }
                                className={`${inputClass(
                                    'phone'
                                )} mt-0 pl-14`}
                            />
                        </div>

                        <span className="block mt-2 text-xs text-gray-500">
                            Enter 10 digits without
                            `+91` or a leading zero.
                        </span>

                        {renderFieldError(
                            'phone'
                        )}
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gray-900 text-white rounded-2xl py-4 text-lg font-bold hover:bg-black transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {saving
                        ? 'Saving...'
                        : 'Continue to Payment'}
                </button>
            </form>
        </div>
    );
};

export default AddressDetails;