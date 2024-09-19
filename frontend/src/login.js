import React, { useState } from 'react';
import {
    Button,
    Form,
    FormGroup,
    TextInput,
    Theme,
    FlexGrid,
    Row,
    Column,
    Header,
    HeaderName,
    Link
} from "@carbon/react";
import useThemeDetector from './components/theme';
import { LoginApi } from './content/api/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import errorNotification from './content/component/errorNotification';
import InlineToastNotification from './content/component/inlineToast';

function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isDarkTheme = useThemeDetector();
    const [password, setPassword] = useState('');
    const [showAppStatus, setShowAppStatus] = useState('');
    const [showNotification, setShowNotification] = useState('');
    const [showNotificationMsg, setShowNotificationMsg] = useState({});
    const [showToastContainer, setShowToastContainer] = useState(false);

    const userName = "admin";
    const handlePasswordChange = (e) => {
        setPassword(e.target.value)
    }
    function showNotificationStatus(statusKind, status, statusText) {
        if (statusKind !== undefined) {
            setShowAppStatus(statusKind);
        }
        if (status !== undefined) {
            setShowNotification(status);
        }
        if (statusText !== undefined) {
            setShowNotificationMsg(statusText);
        }
        if ((statusKind !== undefined && statusKind === "error")) {
            setShowToastContainer(true);
        }
    };

    const resetShowNotification = () => {
        setShowNotification(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (password === '') {
            showNotificationStatus("error", "emptyPassword", t('emptyPassword'));
        } else {
            const data = {
                username: userName,
                password: password,
            };
            try {
                const response = await LoginApi(data);
                localStorage.setItem('token', response.token);
                localStorage.setItem('userName', response.username);
                navigate("/home");
                setShowToastContainer(false);
            } catch (error) {
                console.error(error);
                errorNotification(error, t('serverError'), "loginFailed", showNotificationStatus);
            }
        }
    };
    return (
        <Theme theme={isDarkTheme ? "g100" : "g10"} className='login-container'>
            <Header aria-label={t('appTitle')}>
                <HeaderName href="/login" prefix="">
                    {t('appTitle')}
                </HeaderName>
            </Header>
            <FlexGrid>
                <Row>
                    <Column lg={5} md={8} sm={4} className="login-col-container">
                        <div className="login-subcontainer">
                            <div className="login-form-cont">
                                <h3>{t('loginIbmTitle')}</h3>
                                <Form onSubmit={handleLogin}>
                                    <InlineToastNotification
                                        aria-label={t('loginFailed')}
                                        key={showNotification}
                                        kind={showAppStatus}
                                        iconDescription={t('errorNotification')}
                                        subtitle={showNotificationMsg}
                                        title={t('error')}
                                        className="error-notification"
                                        showToastContainer={showToastContainer}
                                        resetShowNotification={resetShowNotification} />

                                    <FormGroup legendText={t('userName')}>
                                        <TextInput id="username-input" value={userName} labelText="" placeholder={t('userName')} disabled />
                                    </FormGroup>

                                    <FormGroup legendText={t('Password')}>
                                        <TextInput id="password-input" type="password" labelText="" value={password} onChange={handlePasswordChange} placeholder={t('password')} />
                                    </FormGroup>

                                    <Button type="submit">{t('Login')}</Button>
                                </Form>
                                <div className='login-footer'>
                                    <p>{t('needHelp')}</p>
                                    <Link href="https://github.ibm.com/workload-eng-services/sandbox/blob/master/user-guide/sandbox-user-guide.md">{t('contactIbm')}</Link>
                                </div>
                            </div>
                        </div>
                    </Column>
                </Row>
            </FlexGrid>
        </Theme>
    );
}

export default LoginPage;