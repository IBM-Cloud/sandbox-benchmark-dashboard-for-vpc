import React, { useState, useEffect } from 'react';
import { InlineNotification } from '@carbon/react';

export default function InlineToastNotification(props) {
    const [notification, setNotification] = useState(null);
    const { showToastContainer, resetShowNotification, ariaLabel, kind, subtitle, title, key, className, iconDescription } = props;
    useEffect(() => {
        if (showToastContainer) {
            setNotification(prevNotification => {
                const newNotification = (
                    <InlineNotification
                        aria-label={ariaLabel}
                        className={className}
                        key={key}
                        kind={kind}
                        statusIconDescription={iconDescription}
                        subtitle={subtitle}
                        title={title} />
                );
                return newNotification;
            });
            resetShowNotification();
        }
    }, [showToastContainer, resetShowNotification, ariaLabel, kind, subtitle, title, key, className]);
    return notification;
};