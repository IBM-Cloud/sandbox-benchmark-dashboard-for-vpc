import React, { useEffect, createContext, useContext, useState } from 'react';
import Notification from './toast';
import { useLocation } from 'react-router-dom';

const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const location = useLocation();

  const addToast = (toast) => {
    setToasts((prevToasts) => [...prevToasts, toast]);
  };

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    setToasts([]);
  }, [location]);

  return (
    <NotificationContext.Provider value={addToast}>
      {children}
      <Notification toasts={toasts} removeToast={removeToast} />
    </NotificationContext.Provider>
  );
};
