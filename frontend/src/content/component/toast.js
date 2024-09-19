import React from 'react';
import { ToastNotification } from '@carbon/react';
export default function Notification({ toasts }) {
  return (
    <div className="generic-toast-container">
      {toasts.map(toast => (
        <ToastNotification
          id={toast.id}
          aria-label={toast.ariaLabel}
          caption=""
          kind={toast.kind}
          role={toast.role}
          statusIconDescription="notification"
          subtitle={toast.subtitle}
          timeout={toast.timeout}
          title={toast.title}
          className="notification-ui"
        />
      ))}
    </div>
  );
}
