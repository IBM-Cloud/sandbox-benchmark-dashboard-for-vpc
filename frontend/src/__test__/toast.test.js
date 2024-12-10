import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Notification from '../content/component/toast';
import { ToastNotification } from '@carbon/react';
import { mockToasts } from './utils';

jest.mock('@carbon/react', () => ({
    ToastNotification: jest.fn(({ title, subtitle, kind, className }) => (
        <div className={className}>
            <span>Title: {title}</span>
            <span>Subtitle: {subtitle}</span>
            <span>Kind: {kind}</span>
        </div>
    )),
}));

describe('Notification Component', () => {
    test('renders notification with correct props', () => {
        render(<Notification toasts={mockToasts} />);
        const relevantCalls = ToastNotification.mock.calls.filter(call => call[0]?.id);
        expect(relevantCalls.length).toBe(mockToasts.length);
        mockToasts.forEach((toast, index) => {
            const callArgs = relevantCalls[index][0];
            expect(callArgs).toBeDefined();
            expect(callArgs.className).toBe('notification-ui');
            expect(callArgs.title).toBe(toast.title);
            expect(callArgs.subtitle).toBe(toast.subtitle);
            expect(callArgs.kind).toBe(toast.kind);
        });
    });
    test('does not render notification when showToastContainer is false', () => {
        render(<Notification toasts={[]} />);
        const container = document.querySelector('.generic-toast-container');
        expect(container).toBeEmptyDOMElement();
    });
});
