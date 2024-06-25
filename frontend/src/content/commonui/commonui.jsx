import React, { useState, useEffect, useCallback } from "react";
import {
  HeaderContainer,
  Header,
  SkipToContent,
  HeaderMenuButton,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SideNav,
  SideNavItems,
  Content,
  Theme,
  SideNavLink,
  OverflowMenu,
  OverflowMenuItem,
  Modal
} from "@carbon/react";
import { Notification, User, IbmCloud } from "@carbon/react/icons";
import { Outlet, useNavigate } from "react-router-dom";
import '@carbon/charts-react/styles.css'
import { jwtDecode } from "jwt-decode";
import { getByoPolling } from "../api/api";
import ErrorBoundary from "../../components/ErrorBoundary";
import useThemeDetector from "../../components/theme";
import { useTranslation } from "react-i18next";
import CommonUIContext from "../component/CommonUIContext";

function CommonUI() {
  const { t } = useTranslation();
  const isDarkTheme = useThemeDetector();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userName, setUserName] = useState(localStorage.getItem('userName'));
  const [byoPollFlagStatus, setByoPollFlagStatus] = useState();
  const [activeMenu, setActiveMenu] = useState(window.location.pathname);
  const [modalOpen, setModalOpen] = useState(false);
  const decodeToken = (token) => {
    return jwtDecode(token);
  }

  const getByoInstanceDetails = async () => {
    try {
      await getByoPolling();
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUserName(null);
    navigate("/login");
  }, [navigate, setToken]);

  const setByoState = (value) => {
    setByoPollFlagStatus(value);
  }

  const handleSideNavLinkClick = (e, href) => {
    e.preventDefault();
    if (activeMenu !== href) {
      setActiveMenu(href);
      navigate(href);
    } else {
      e.preventDefault();
    }
  };
  const closeModal = () => {
    setModalOpen(false);
    navigate("/login");
  };

  const validateToken = useCallback(() => {
    if (token) {
      const expiration = decodeToken(token).exp;
      const isExpired = expiration < new Date().getTime() / 1000;
      if (isExpired) {
        setModalOpen(true);
      } else {
        setToken(token);
      }
    } else if (!token) {
      setModalOpen(true);
    }
  }, [token]);

  useEffect(() => {
    validateToken();
    let interval;
    if (byoPollFlagStatus !== undefined && byoPollFlagStatus === true) {
      getByoInstanceDetails();
      interval = setInterval(getByoInstanceDetails, 10000);
    }
    const handleUserInteraction = () => {
      validateToken();
    };
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keypress', handleUserInteraction);
    return () => {
      clearInterval(interval);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keypress', handleUserInteraction);
    };
  }, [byoPollFlagStatus, validateToken]);

  useEffect(() => {
    if (token) {
      const timeout = setTimeout(() => {
        setModalOpen(true);
      }, 89 * 60 * 1000);
      const resetTimeout = () => {
        clearTimeout(timeout);
        setTimeout(() => {
          setModalOpen(true);
        }, 89 * 60 * 1000);
      };

      window.addEventListener('mousemove', resetTimeout);
      window.addEventListener('keydown', resetTimeout);
      window.addEventListener('click', resetTimeout);
      window.addEventListener('scroll', resetTimeout);

      return () => {
        clearTimeout(timeout);
        window.removeEventListener('mousemove', resetTimeout);
        window.removeEventListener('keydown', resetTimeout);
        window.removeEventListener('click', resetTimeout);
        window.removeEventListener('scroll', resetTimeout);
      };
    }
  }, [token]);
  return (
    <CommonUIContext.Provider value={{ setByoState }}>
      <Theme theme={isDarkTheme ? "g100" : "g10"} className={modalOpen ? "whole-theme-cont hide-notification" : "whole-theme-cont"}>
        <HeaderContainer
          render={({ isSideNavExpanded, onClickSideNavExpand }) => (
            <div>
              <Header aria-label={t('appTitle')}>
                <SkipToContent />
                <HeaderMenuButton
                  aria-label="Open menu"
                  onClick={onClickSideNavExpand}
                  isActive={isSideNavExpanded}
                />
                <HeaderName onClick={(e) => handleSideNavLinkClick(e, "/")} prefix="">
                  {t('appTitle')}
                </HeaderName>
                <HeaderGlobalBar className="right-header-gbl">
                  <HeaderGlobalAction
                    aria-label="Notifications"
                    tooltipAlignment="end"
                  >
                    <Notification size={20} />
                  </HeaderGlobalAction>
                  <OverflowMenu renderIcon={User} flipped={true} className="custom-profile-menu">
                    <OverflowMenuItem disabled itemText={userName} />
                    <OverflowMenuItem onClick={handleLogout} itemText="Logout" />
                  </OverflowMenu>
                </HeaderGlobalBar>
                <Theme theme={isDarkTheme ? "g90" : "g10"} className="sidenav-theme">
                  <ErrorBoundary t={t}>
                    <SideNav
                      aria-label="Side navigation"
                      expanded={isSideNavExpanded}
                      className="sandbox-sidebar"
                    >
                      <SideNavItems>
                        <SideNavLink isActive={activeMenu === "/home"} onClick={(e) => handleSideNavLinkClick(e, "/home")} className="nav-top-list">
                          <IbmCloud />
                          {t('appTitle')}
                        </SideNavLink>
                        <SideNavLink onClick={(e) => handleSideNavLinkClick(e, "/configuration-details")} isActive={activeMenu === "/configuration-details"}>
                          {t('configurationDetails')}
                        </SideNavLink>
                        <SideNavLink onClick={(e) => handleSideNavLinkClick(e, "/performance-dashboard")} isActive={activeMenu === "/performance-dashboard"}>
                          {t('performanceDashboard')}
                        </SideNavLink>
                        <SideNavLink onClick={(e) => handleSideNavLinkClick(e, "/benchmarklogs")} isActive={activeMenu === "/benchmarklogs"}>
                          {t('benchmarkLogs')}
                        </SideNavLink>
                        <SideNavLink onClick={(e) => handleSideNavLinkClick(e, "/support")} isActive={activeMenu === "/support"}>
                          {t('programSupport')}
                        </SideNavLink>
                      </SideNavItems>
                    </SideNav>
                  </ErrorBoundary>
                </Theme>
              </Header>
            </div>
          )}
        />
        <Content className="content">
          <Outlet />
        </Content>
      </Theme>
      <Modal
        open={modalOpen}
        size="xs"
        className="info-modal session-modal"
        modalHeading={t('sessionExpired')}
        primaryButtonText={t('Login')}
        onRequestSubmit={closeModal}
        preventCloseOnClickOutside={true}
      >
        <div className="mod-content">
          <p>{t('sessionMessage')}</p>
          <p>{t('loginAgain')}</p>
        </div>
      </Modal>
    </CommonUIContext.Provider>
  );
}

export default CommonUI;
