import React, {
    useContext,
    useEffect,
    useState
} from 'react';

import {
    Link,
    useNavigate
} from 'react-router-dom';

import {
    FaArrowLeft,
    FaCheckCircle,
    FaMapMarkerAlt,
    FaSave,
    FaUserCircle,
    FaUserEdit
} from 'react-icons/fa';

import {
    AuthContext
} from '../context/AuthContext';

import api from '../utils/axios';
import avatarOptions, { DEFAULT_AVATAR_ID, getAvatarSrc } from '../data/avatarOptions';

const INDIA_STATES = [
    'Andaman and Nicobar Islands',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chandigarh',
    'Chhattisgarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jammu and Kashmir',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Ladakh',
    'Lakshadweep',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Puducherry',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal'
];

const EMPTY_ADDRESS = {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
    phone: ''
};

const NAME_PATTERN =
    /^[a-zA-ZÀ-ÿ.'-]+(?:\s[a-zA-ZÀ-ÿ.'-]+)*$/;

const CITY_PATTERN = NAME_PATTERN;
const PHONE_PATTERN = /^(?:\+91)?[6-9]\d{9}$/;
const PIN_PATTERN = /^[1-9]\d{5}$/;
const STREET_PATTERN = /^[a-zA-Z0-9À-ÿ.,'\-/#()\s]+$/;

const ProfileDetails = () => {
    const {
        user,
        updateStoredUser
    } = useContext(AuthContext);

    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        avatar: DEFAULT_AVATAR_ID,
        defaultAddress: EMPTY_ADDRESS
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const loadProfile = async () => {
            try {
                const { data } = await api.get('/auth/profile');

                setForm({
                    name: data.name || '',
                    avatar: data.avatar || DEFAULT_AVATAR_ID,
                    defaultAddress: {
                        ...EMPTY_ADDRESS,
                        ...(data.defaultAddress || {})
                    }
                });
            } catch (requestError) {
                setError(
                    requestError.response?.data?.message ||
                        'Unable to load your profile details.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [user, navigate]);

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

    const validate = () => {
        const cleaned = {
            name: cleanText(form.name),
            avatar: form.avatar || DEFAULT_AVATAR_ID,
            defaultAddress: {
                street: cleanText(form.defaultAddress.street),
                city: cleanText(form.defaultAddress.city),
                state: cleanText(form.defaultAddress.state),
                zip: form.defaultAddress.zip.trim(),
                country: 'India',
                phone: normalizePhone(form.defaultAddress.phone)
            }
        };

        const errors = {};
        const addressErrors = {};

        if (!cleaned.name) {
            errors.name = 'Full name is required.';
        } else if (cleaned.name.length < 2 || cleaned.name.length > 50) {
            errors.name = 'Full name must contain between 2 and 50 characters.';
        } else if (!NAME_PATTERN.test(cleaned.name)) {
            errors.name = "Full name can contain only letters, spaces, periods, apostrophes, and hyphens.";
        }

        const address = cleaned.defaultAddress;

        if (!address.street) {
            addressErrors.street = 'Street address is required.';
        } else if (address.street.length < 5 || address.street.length > 150) {
            addressErrors.street = 'Street address must contain between 5 and 150 characters.';
        } else if (!STREET_PATTERN.test(address.street) || !/[a-zA-Z0-9À-ÿ]/.test(address.street)) {
            addressErrors.street = 'Street address contains invalid characters.';
        }

        if (!address.city) {
            addressErrors.city = 'City is required.';
        } else if (address.city.length < 2 || address.city.length > 60) {
            addressErrors.city = 'City must contain between 2 and 60 characters.';
        } else if (!CITY_PATTERN.test(address.city)) {
            addressErrors.city = "City can contain only letters, spaces, periods, apostrophes, and hyphens.";
        }

        if (!address.state) {
            addressErrors.state = 'State is required.';
        }

        if (!PIN_PATTERN.test(address.zip)) {
            addressErrors.zip = 'Enter a valid 6-digit Indian PIN code.';
        }

        if (!PHONE_PATTERN.test(address.phone)) {
            addressErrors.phone = 'Enter a valid Indian mobile number beginning with 6, 7, 8, or 9.';
        }

        if (Object.keys(addressErrors).length > 0) {
            errors.defaultAddress = addressErrors;
        }

        setFieldErrors(errors);

        return {
            isValid: Object.keys(errors).length === 0,
            cleaned
        };
    };

    const handleNameChange = (event) => {
        setForm((current) => ({
            ...current,
            name: event.target.value
        }));

        setFieldErrors((current) => ({
            ...current,
            name: ''
        }));
        setError('');
        setSuccess('');
    };

    const handleAddressChange = (event) => {
        const { name, value } = event.target;
        let nextValue = value;

        if (name === 'phone') {
            nextValue = value.replace(/[^\d+\s-]/g, '').slice(0, 15);
        }

        if (name === 'zip') {
            nextValue = value.replace(/\D/g, '').slice(0, 6);
        }

        setForm((current) => ({
            ...current,
            defaultAddress: {
                ...current.defaultAddress,
                [name]: nextValue
            }
        }));

        setFieldErrors((current) => ({
            ...current,
            defaultAddress: {
                ...(current.defaultAddress || {}),
                [name]: ''
            }
        }));
        setError('');
        setSuccess('');
    };

    const handleAvatarChange = (avatarId) => {
        setForm((current) => ({
            ...current,
            avatar: avatarId
        }));
        setFieldErrors((current) => ({
            ...current,
            avatar: ''
        }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        const { isValid, cleaned } = validate();

        if (!isValid) {
            setError('Please correct the highlighted fields before saving.');
            return;
        }

        try {
            setSaving(true);
            const { data } = await api.put('/auth/profile', cleaned);

            updateStoredUser(data.user);
            setForm({
                name: data.user.name,
                avatar: data.user.avatar || DEFAULT_AVATAR_ID,
                defaultAddress: {
                    ...EMPTY_ADDRESS,
                    ...(data.user.defaultAddress || {})
                }
            });
            setSuccess(data.message || 'Profile updated successfully.');
        } catch (requestError) {
            const backendErrors = requestError.response?.data?.errors;

            if (backendErrors) {
                setFieldErrors(backendErrors);
            }

            setError(
                requestError.response?.data?.message ||
                    'Unable to update your profile details.'
            );
        } finally {
            setSaving(false);
        }
    };

    const inputClass = (hasError) =>
        `mt-2 block w-full rounded-xl border bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-gray-100 outline-none transition ${
            hasError
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950'
                : 'border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950'
        }`;

    const FieldError = ({ message }) =>
        message ? (
            <span className="mt-2 block text-sm font-medium text-red-600 dark:text-red-400">
                {message}
            </span>
        ) : null;

    if (loading) {
        return (
            <div className="py-20 text-center text-xl font-semibold">
                Loading profile...
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl">
            <Link
                to="/dashboard"
                className="mb-6 inline-flex items-center gap-2 font-semibold text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400"
            >
                <FaArrowLeft />
                Back to dashboard
            </Link>

            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
                <div className="border-b border-gray-200 px-6 py-6 dark:border-gray-800 sm:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                            <FaUserEdit />
                        </div>

                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
                                Edit Details
                            </h1>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">
                                Update your account name and saved default address.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-8 p-6 sm:p-8">
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
                            <FaCheckCircle />
                            {success}
                        </div>
                    )}

                    <section>
                        <div className="flex items-center gap-2">
                            <FaUserCircle className="text-blue-600 dark:text-cyan-400" />
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Profile Avatar
                            </h2>
                        </div>

                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Choose one of the predefined EventiQ avatars. No image upload is required.
                        </p>

                        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start">
                            <div className="mx-auto shrink-0 lg:mx-0">
                                <img
                                    src={getAvatarSrc(form.avatar)}
                                    alt="Selected profile avatar"
                                    className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-xl ring-4 ring-blue-500/20 dark:border-gray-800 dark:ring-cyan-400/20"
                                />
                                <p className="mt-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    Current selection
                                </p>
                            </div>

                            <div className="grid flex-1 grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                                {avatarOptions.map((avatar) => {
                                    const isSelected = form.avatar === avatar.id;

                                    return (
                                        <button
                                            key={avatar.id}
                                            type="button"
                                            onClick={() => handleAvatarChange(avatar.id)}
                                            aria-label={`Select ${avatar.label}`}
                                            aria-pressed={isSelected}
                                            className={`group relative rounded-2xl border-2 p-1.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                                                isSelected
                                                    ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-200 dark:border-cyan-400 dark:bg-cyan-950/30 dark:ring-cyan-500/20'
                                                    : 'border-gray-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-cyan-500'
                                            }`}
                                        >
                                            <img
                                                src={avatar.src}
                                                alt=""
                                                className="aspect-square w-full rounded-xl object-cover"
                                            />
                                            {isSelected && (
                                                <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-xs text-white shadow-md">
                                                    <FaCheckCircle />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <FieldError message={fieldErrors.avatar} />
                    </section>

                    <section className="border-t border-gray-200 pt-8 dark:border-gray-800">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Personal Details
                        </h2>

                        <div className="mt-4 grid gap-5 md:grid-cols-2">
                            <label className="block">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Full Name
                                </span>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={handleNameChange}
                                    maxLength={50}
                                    autoComplete="name"
                                    className={inputClass(fieldErrors.name)}
                                />
                                <FieldError message={fieldErrors.name} />
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Email Address
                                </span>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    readOnly
                                    className="mt-2 block w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-400"
                                />
                                <span className="mt-2 block text-xs text-gray-500 dark:text-gray-400">
                                    Email editing is not included in this version.
                                </span>
                            </label>
                        </div>
                    </section>

                    <section className="border-t border-gray-200 pt-8 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="text-blue-600 dark:text-blue-400" />
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Default Address
                            </h2>
                        </div>

                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            This address will be offered as a selectable option before payment.
                        </p>

                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                            <label className="block md:col-span-2">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Street Address
                                </span>
                                <input
                                    name="street"
                                    value={form.defaultAddress.street}
                                    onChange={handleAddressChange}
                                    maxLength={150}
                                    autoComplete="street-address"
                                    className={inputClass(fieldErrors.defaultAddress?.street)}
                                />
                                <FieldError message={fieldErrors.defaultAddress?.street} />
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    City
                                </span>
                                <input
                                    name="city"
                                    value={form.defaultAddress.city}
                                    onChange={handleAddressChange}
                                    maxLength={60}
                                    autoComplete="address-level2"
                                    className={inputClass(fieldErrors.defaultAddress?.city)}
                                />
                                <FieldError message={fieldErrors.defaultAddress?.city} />
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    State / Union Territory
                                </span>
                                <select
                                    name="state"
                                    value={form.defaultAddress.state}
                                    onChange={handleAddressChange}
                                    className={inputClass(fieldErrors.defaultAddress?.state)}
                                >
                                    <option value="">Select state</option>
                                    {INDIA_STATES.map((state) => (
                                        <option key={state} value={state}>
                                            {state}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={fieldErrors.defaultAddress?.state} />
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    PIN Code
                                </span>
                                <input
                                    name="zip"
                                    inputMode="numeric"
                                    value={form.defaultAddress.zip}
                                    onChange={handleAddressChange}
                                    maxLength={6}
                                    autoComplete="postal-code"
                                    className={inputClass(fieldErrors.defaultAddress?.zip)}
                                />
                                <FieldError message={fieldErrors.defaultAddress?.zip} />
                            </label>

                            <label className="block">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Phone Number
                                </span>
                                <input
                                    name="phone"
                                    inputMode="tel"
                                    value={form.defaultAddress.phone}
                                    onChange={handleAddressChange}
                                    maxLength={15}
                                    placeholder="+91 98765 43210"
                                    autoComplete="tel"
                                    className={inputClass(fieldErrors.defaultAddress?.phone)}
                                />
                                <FieldError message={fieldErrors.defaultAddress?.phone} />
                            </label>

                            <label className="block md:col-span-2">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Country
                                </span>
                                <input
                                    name="country"
                                    value="India"
                                    readOnly
                                    className="mt-2 block w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-600 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-300"
                                />
                            </label>
                        </div>
                    </section>

                    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 dark:border-gray-800 sm:flex-row sm:justify-end">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FaSave />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileDetails;