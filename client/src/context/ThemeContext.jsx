import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';

const ThemeContext = createContext(null);

const getInitialTheme = () => {
    const savedTheme =
        localStorage.getItem('eventiq-theme');

    if (
        savedTheme === 'dark' ||
        savedTheme === 'light'
    ) {
        return savedTheme;
    }

    const prefersDark =
        window.matchMedia?.(
            '(prefers-color-scheme: dark)'
        ).matches;

    return prefersDark ? 'dark' : 'light';
};

export const ThemeProvider = ({
    children
}) => {
    const [theme, setTheme] =
        useState(getInitialTheme);

    useEffect(() => {
        const root =
            document.documentElement;

        root.classList.toggle(
            'dark',
            theme === 'dark'
        );

        root.style.colorScheme = theme;

        localStorage.setItem(
            'eventiq-theme',
            theme
        );
    }, [theme]);

    const toggleTheme = () => {
        setTheme((currentTheme) =>
            currentTheme === 'dark'
                ? 'light'
                : 'dark'
        );
    };

    const value = useMemo(
        () => ({
            theme,
            isDark: theme === 'dark',
            toggleTheme
        }),
        [theme]
    );

    return (
        <ThemeContext.Provider
            value={value}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context =
        useContext(ThemeContext);

    if (!context) {
        throw new Error(
            'useTheme must be used inside ThemeProvider'
        );
    }

    return context;
};