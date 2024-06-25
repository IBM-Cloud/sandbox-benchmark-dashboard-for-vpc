export default function errorNotification(error, serverError, errorKey, showNotificationStatus, errorLog) {
    if (error.response === undefined) {
        showNotificationStatus("error", errorKey, serverError, errorLog);
    } else {
        showNotificationStatus("error", errorKey, error.response.data.message, errorLog);
    }
}