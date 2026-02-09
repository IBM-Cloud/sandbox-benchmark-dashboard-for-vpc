
import i18n from '../translation/i18n';
import { initReactI18next } from 'react-i18next';

// i18n is a singleton, so we are testing the configuration indirectly or methods exposed.
// Since i18n.js initializes global instance, we can import it and check its state or output.

describe('i18n Configuration', () => {
    it('should be initialized with correct fallback language', () => {
        expect(i18n.options.fallbackLng[0]).toBe('en');
    });

    it('should have custom formatting for numbers', () => {
        const formatNumber = i18n.options.interpolation.format;
        expect(formatNumber(1000, 'number', 'en')).toBe('1,000');
    });

    it('should have custom formatting for dates', () => {
        const formatDate = i18n.options.interpolation.format;
        const date = new Date('2023-01-01T00:00:00.000Z');
        // DateTimeFormat specific to locale, simplified check
        expect(formatDate(date, 'date', 'en')).toBe(new Intl.DateTimeFormat('en').format(date));
    });

    it('should have custom formatting for currency', () => {
        const formatCurrency = i18n.options.interpolation.format;
        expect(formatCurrency(100, 'currency', 'en')).toContain('100.00');
        expect(formatCurrency(100, 'currency', 'en')).toContain('$');
    });

    it('should return undefined for unknown format', () => {
        const formatUnknown = i18n.options.interpolation.format;
        expect(formatUnknown('test', 'unknown', 'en')).toBeUndefined();
    });
});
