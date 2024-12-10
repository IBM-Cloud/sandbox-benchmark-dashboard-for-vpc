import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationProvider, useNotification } from '../content/component/NotificationManager';
import Notification from '../content/component/toast';
import { useLocation } from 'react-router-dom';

jest.mock('../content/component/toast', () => ({
    __esModule: true,
    default: jest.fn(({ toasts }) => (
        <div>
            {toasts.map(toast => (
                <div key={toast.id}>
                    <span>{toast.title}</span>
                </div>
            ))}
        </div>
    )),
}));

jest.mock('react-router-dom', () => ({
    useLocation: jest.fn(),
}));

describe('NotificationProvider Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders children correctly', () => {
        render(
            <NotificationProvider>
                <div>Child Component</div>
            </NotificationProvider>
        );
        expect(screen.getByText('Child Component')).toBeInTheDocument();
    });

    test('provides notification context and adds toast', () => {
        const TestComponent = () => {
            const addToast = useNotification();
            return (
                <button onClick={() => addToast({ id: '1', title: 'Test Toast' })}>
                    Add Toast
                </button>
            );
        };

        render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );

        fireEvent.click(screen.getByText('Add Toast'));
        expect(Notification).toHaveBeenCalledWith(
            expect.objectContaining({
                toasts: expect.arrayContaining([
                    expect.objectContaining({ id: '1', title: 'Test Toast' })
                ]),
            }),
            expect.any(Object)
        );
    });
    test('renders with empty toasts correctly', () => {
        render(
            <NotificationProvider>
                <Notification toasts={[]} />
            </NotificationProvider>
        );

        expect(screen.queryByText('Test Toast')).not.toBeInTheDocument();
    });
    
});
