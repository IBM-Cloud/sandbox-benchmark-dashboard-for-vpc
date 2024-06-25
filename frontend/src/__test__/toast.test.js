import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Notification from '../content/component/toast';
import { ToastNotification } from '@carbon/react';

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
        render(
            <Notification
                showToastContainer={true}
                resetShowNotification={() => {}}
                ariaLabel="Notification"
                kind="success"
                role="status"
                subtitle="Notification subtitle"
                timeout={5000}
                title="Notification Title"
                key="notification-key"
            />
        );
        expect(ToastNotification).toHaveBeenCalled();
        const [[{ className }]] = ToastNotification.mock.calls;
        expect(className).toBe('notification-ui');
    });
    test('does not render notification when showToastContainer is false', () => {
        render(
            <Notification
                showToastContainer={false}
                resetShowNotification={() => {}}
                ariaLabel="Notification"
                kind="success"
                role="status"
                subtitle="Notification subtitle"
                timeout={5000}
                title="Notification Title"
                key="notification-key"
            />
        );
        const elements = document.getElementsByClassName('notification-ui');
        expect(elements.length).toBe(0);
    });
});
