import React, { useState, useEffect } from 'react';
import { ToastNotification } from '@carbon/react';
import { useTranslation } from "react-i18next";

export default function Notification(props) {
    const { t } = useTranslation();
    const [notification, setNotification] = useState(null);
    const [shownMessages, setShownMessages] = useState(new Set());
    const errorMessage = t('serverError');
    const tokenExpiredMessage = "This session has expired. Refresh the session by logging in.";

    useEffect(() => {
        if (props.showToastContainer) {
            if ((props.subtitle.includes(errorMessage) && shownMessages.has(errorMessage)) || 
                (props.subtitle.includes(tokenExpiredMessage) && shownMessages.has(tokenExpiredMessage))) {
                return;
            } else {
                showNotification();
                if (props.subtitle.includes(errorMessage)) {
                    setShownMessages(prev => new Set(prev).add(errorMessage));
                }
                if (props.subtitle.includes(tokenExpiredMessage)) {
                    setShownMessages(prev => new Set(prev).add(tokenExpiredMessage));
                }
                props.resetShowNotification();
            }
        }
    }, [props.showToastContainer, props.subtitle, props.resetShowNotification, errorMessage, tokenExpiredMessage, shownMessages]);

    const showNotification = () => {
        const newNotification = (
            <ToastNotification
                aria-label={props.ariaLabel}
                caption=""
                kind={props.kind}
                role={props.role}
                statusIconDescription="notification"
                subtitle={props.subtitle}
                timeout={props.timeout}
                title={props.title}
                key={props.key}
                className="notification-ui"
            />
        );
        setNotification(newNotification);
    };

    return notification;
}