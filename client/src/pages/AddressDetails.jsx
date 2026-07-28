import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    Link,
    useNavigate,
    useParams
} from 'react-router-dom';

import {
    FaCheckCircle,
    FaEdit,
    FaMapMarkerAlt
} from 'react-icons/fa';

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
    /^[a-zA-ZÀ-ÿ.'-]+(?:\s[a-zA-ZÀ-ÿ.'-]+)*$/;

const PHONE_PATTERN =
    /^(?:\+91)?[6-9]\d{9}$/;

const PIN_PATTERN =
    /^[1-9]\d{5}$/;

const STREET_PATTERN =
    /^[a-zA-Z0-9À-ÿ.,'\-/#()\s]+$/;

const AddressDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [form, setForm] = useState(INITIAL_FORM);
    const [addressMode, setAddressMode] = useState('new');

    const hasSavedAddress = useMemo(() => {
        const address = profile?.defaultAddress;

        return Boolean(
            address?.street &&
            address?.city &&
            address?.state &&
            address?.zip &&
            address?.phone
        );
    }, [profile]);

    useEffect(() => {
        const loadPage = async () => {
            try {
                const [bookingResponse, profileResponse] = await Promise.all([
                    api.get(`/bookings/${id}`),
                    api.get('/auth/profile')
                ]);

                const bookingData = bookingResponse.data;
                const profileData = profileResponse.data;

                setBooking(bookingData);
                setProfile(profileData);

                if (bookingData.address?.street) {
                    setForm({
                        ...INITIAL_FORM,
                        ...bookingData.address
                    });
                    setAddressMode('new');
                } else if (profileData.defaultAddress?.street) {
                    setAddressMode('saved');
                }
            } catch (requestError) {
                setError(
                    requestError.response?.data?.message ||
                        'Unable to load address details.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [id]);

    const cleanText = (value = '') =>
        value.trim().replace(/\s+/g, ' ');

    const normalizePhone = (value = '') => {
        const digits = value.replace(/\D/g, '');

        if (digits.length === 12 && digits.startsWith('91')) {
            return `+${digits}`;
        }

        return digits.length === 10
            ? `+91${digits}`
            : value.trim();
    };

    const getCleanedAddress = (source) => ({
        street: cleanText(source.street),
        city: cleanText(source.city),
        state: cleanText(source.state),
        zip: String(source.zip || '').trim(),
        country: 'India',
        phone: normalizePhone(source.phone)
    });

    const validateAddress = (source) => {
        const cleanedAddress = getCleanedAddress(source);
        const errors = {};

        if (!cleanedAddress.street) {
            errors.street = 'Street address is required.';
        } else if (
            cleanedAddress.street.length < 5 ||
            cleanedAddress.street.length > 150
        ) {
            errors.street = 'Street address must contain between 5 and 150 characters.';
        } else if (
            !STREET_PATTERN.test(cleanedAddress.street) ||
            !/[a-zA-Z0-9À-ÿ]/.test(cleanedAddress.street)
        ) {
            errors.street = 'Street address contains invalid characters.';
        }

        if (!cleanedAddress.city) {
            errors.city = 'City is required.';
        } else if (
            cleanedAddress.city.length < 2 ||
            cleanedAddress.city.length > 60
        ) {
            errors.city = 'City must contain between 2 and 60 characters.';
        } else if (!NAME_PATTERN.test(cleanedAddress.city)) {
            errors.city = "City can contain only letters, spaces, periods, apostrophes, and hyphens.";
        }

        if (!cleanedAddress.state) {
            errors.state = 'State is required.';
        } else if (
            cleanedAddress.state.length < 2 ||
            cleanedAddress.state.length > 60
        ) {
            errors.state = 'State must contain between 2 and 60 characters.';
        } else if (!NAME_PATTERN.test(cleanedAddress.state)) {
            errors.state = "State can contain only letters, spaces, periods, apostrophes, and hyphens.";
        }

        if (!PIN_PATTERN.test(cleanedAddress.zip)) {
            errors.zip = 'Enter a valid 6-digit Indian PIN code.';
        }

        if (!PHONE_PATTERN.test(cleanedAddress.phone)) {
            errors.phone = 'Enter a valid Indian mobile number beginning with 6, 7, 8, or 9.';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            cleanedAddress,
            errors
        };
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        let updatedValue = value;

        if (name === 'phone') {
            updatedValue = value.replace(/[^\d+\s-]/g, '').slice(0, 15);
        }

        if (name === 'zip') {
            updatedValue = value.replace(/\D/g, '').slice(0, 6);
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

    const selectAddressMode = (mode) => {
        setAddressMode(mode);
        setFieldErrors({});
        setError('');
    };

    const handleSaveAddress = async (event) => {
        event.preventDefault();
        setError('');

        const source = addressMode === 'saved'
            ? profile?.defaultAddress || {}
            : form;

        const {
            isValid,
            cleanedAddress,
            errors
        } = validateAddress(source);

        if (!isValid) {
            setFieldErrors(errors);
            setError(
                addressMode === 'saved'
                    ? 'Your saved address is incomplete. Edit it from your profile or enter a new address.'
                    : 'Please correct the highlighted fields before continuing.'
            );
            return;
        }

        try {
            setSaving(true);

            await api.put(
                `/bookings/${id}/address`,
                cleanedAddress
            );

            navigate(`/booking/${id}/payment`);
        } catch (requestError) {
            const backendErrors = requestError.response?.data?.errors;

            if (backendErrors && typeof backendErrors === 'object') {
                setFieldErrors(backendErrors);
            }

            setError(
                requestError.response?.data?.message ||
                    'Unable to save address.'
            );
        } finally {
            setSaving(false);
        }
    };

    const inputClass = (fieldName) =>
        `mt-2 block w-full rounded-2xl border bg-gray-50 px-4 py-3 text-gray-900 outline-none transition dark:bg-gray-800 dark:text-gray-100 ${
            fieldErrors[fieldName]
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950'
                : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950'
        }`;

    const renderFieldError = (fieldName) =>
        fieldErrors[fieldName] ? (
            <span className="mt-2 block text-sm font-medium text-red-600 dark:text-red-400">
                {fieldErrors[fieldName]}
            </span>
        ) : null;

    if (loading) {
        return (
            <div className="py-20 text-center text-xl font-semibold">
                Loading booking...
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="py-20 text-center text-xl font-semibold text-red-500">
                Booking not found.
            </div>
        );
    }

    return (
        <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                    Choose Your Address
                </h1>

                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    Select your saved address or enter a different address for this booking.
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                >
                    {error}
                </div>
            )}

            <form onSubmit={handleSaveAddress} noValidate>
                <div className="mb-8 grid gap-4 sm:grid-cols-2">
                    <button
                        type="button"
                        disabled={!hasSavedAddress}
                        onClick={() => selectAddressMode('saved')}
                        className={`rounded-2xl border p-5 text-left transition ${
                            addressMode === 'saved'
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:bg-blue-950/30 dark:ring-blue-950'
                                : 'border-gray-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900'
                        } ${
                            !hasSavedAddress
                                ? 'cursor-not-allowed opacity-50'
                                : ''
                        }`}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                                <FaMapMarkerAlt className="text-blue-600 dark:text-blue-400" />
                                Saved Default Address
                            </div>
                            {addressMode === 'saved' && (
                                <FaCheckCircle className="text-blue-600" />
                            )}
                        </div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {hasSavedAddress
                                ? 'Use the address saved in your profile.'
                                : 'No default address has been saved yet.'}
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => selectAddressMode('new')}
                        className={`rounded-2xl border p-5 text-left transition ${
                            addressMode === 'new'
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:bg-blue-950/30 dark:ring-blue-950'
                                : 'border-gray-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                                <FaEdit className="text-blue-600 dark:text-blue-400" />
                                Enter a New Address
                            </div>
                            {addressMode === 'new' && (
                                <FaCheckCircle className="text-blue-600" />
                            )}
                        </div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Use a different address only for this booking.
                        </p>
                    </button>
                </div>

                {addressMode === 'saved' && hasSavedAddress ? (
                    <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/60">
                        <div className="flex flex-col gap-1 text-gray-700 dark:text-gray-200">
                            <strong className="text-lg text-gray-900 dark:text-white">
                                {profile?.name}
                            </strong>
                            <span>{profile.defaultAddress.street}</span>
                            <span>
                                {profile.defaultAddress.city}, {profile.defaultAddress.state} {profile.defaultAddress.zip}
                            </span>
                            <span>{profile.defaultAddress.country}</span>
                            <span className="mt-2 font-medium">
                                Phone: {profile.defaultAddress.phone}
                            </span>
                        </div>

                        <Link
                            to="/profile"
                            className="mt-4 inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                            <FaEdit />
                            Edit saved address
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <label className="block md:col-span-2">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Street Address
                                </span>
                                <input
                                    name="street"
                                    value={form.street}
                                    onChange={handleInputChange}
                                    maxLength={150}
                                    autoComplete="street-address"
                                    className={inputClass('street')}
                                />
                                {renderFieldError('street')}
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    City
                                </span>
                                <input
                                    name="city"
                                    value={form.city}
                                    onChange={handleInputChange}
                                    maxLength={60}
                                    autoComplete="address-level2"
                                    className={inputClass('city')}
                                />
                                {renderFieldError('city')}
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    State
                                </span>
                                <input
                                    name="state"
                                    value={form.state}
                                    onChange={handleInputChange}
                                    maxLength={60}
                                    autoComplete="address-level1"
                                    className={inputClass('state')}
                                />
                                {renderFieldError('state')}
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    PIN Code
                                </span>
                                <input
                                    name="zip"
                                    value={form.zip}
                                    onChange={handleInputChange}
                                    inputMode="numeric"
                                    maxLength={6}
                                    autoComplete="postal-code"
                                    className={inputClass('zip')}
                                />
                                {renderFieldError('zip')}
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Phone Number
                                </span>
                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleInputChange}
                                    inputMode="tel"
                                    maxLength={15}
                                    placeholder="+91 98765 43210"
                                    autoComplete="tel"
                                    className={inputClass('phone')}
                                />
                                {renderFieldError('phone')}
                            </label>

                            <label className="block md:col-span-2">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Country
                                </span>
                                <input
                                    value="India"
                                    readOnly
                                    className="mt-2 block w-full cursor-not-allowed rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-600 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-300"
                                />
                            </label>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={saving || (addressMode === 'saved' && !hasSavedAddress)}
                    className="mt-8 w-full rounded-2xl border border-blue-500/70 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-500 hover:shadow-xl hover:shadow-blue-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none disabled:shadow-none dark:border-cyan-400/40 dark:focus-visible:ring-offset-gray-900"
                >
                    {saving
                        ? 'Saving Address...'
                        : addressMode === 'saved'
                            ? 'Use Saved Address and Continue'
                            : 'Save Address and Continue'}
                </button>
            </form>
        </div>
    );
};

export default AddressDetails;