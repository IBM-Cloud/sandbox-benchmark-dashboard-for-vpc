import React from 'react';
import { InlineNotification } from '@carbon/react';
import { useTranslation } from "react-i18next";

function NotFound() {
    const { t } = useTranslation();
    return (
        <InlineNotification
            title='404'
            subtitle={t('notFound')}
        />
    );
};

export default NotFound;
