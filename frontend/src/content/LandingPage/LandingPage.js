import React, { useState, useEffect, useContext } from "react";
import {
  Grid,
  Column,
  Modal,
  Checkbox,
  Loading,
  InlineNotification
} from "@carbon/react";
import MonteCarloApp from "./monteCarlo/monte";
import HuggingFaceApp from "./huggingFace/hugging";
import ByoApplication from "./byoApp/byo";
import PrestoApp from "./presto/presto";
import { getMetadata, getAllInstances } from "../api/api";
import { useTranslation } from "react-i18next";
import CommonUIContext from "../component/CommonUIContext";
import { useNotification } from "../component/NotificationManager";

function LandingPage() {
  const { t } = useTranslation();
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hideModalChecked, setHideModalChecked] = useState(false);
  const [metaData, setMetaData] = useState({});

  const { setByoState } = useContext(CommonUIContext);
  const addToast = useNotification();

  const handleHideModal = () => {
    if (hideModalChecked) {
      localStorage.setItem("showModal", "false");
    }
    setShowModal(false);
  };

  const handleCheckboxChange = () => {
    setHideModalChecked(!hideModalChecked);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const getMetadataDetails = async () => {
    try {
      const response = await getMetadata();
      setMetaData(response);
    } catch (error) {
      console.log(error);
    }
  };

  const getAllInstance = async () => {
    setIsLoadingPage(true);
    try {
      await getAllInstances();
      setIsLoadingPage(false);
    } catch (error) {
      console.log(error);
      setIsLoadingPage(false);
      showNotificationStatus("error", "getAllInstancesFailed", t('FailedRetrieveAllInstances'));
    }
  };
  function showPollFlagStatus(poolFlagStatus) {
    if(poolFlagStatus !== undefined || poolFlagStatus !== null){
      setByoState(poolFlagStatus);
    }
  };

  function showNotificationStatus(statusKind, status, statusText, errorInfoText) {
    if (statusKind && (statusKind === "error" || statusKind === "success")) {
      addToast({
        id: status,
        ariaLabel: statusKind,
        kind: statusKind,
        role: "alert",
        subtitle: statusText + (errorInfoText ? ` ${errorInfoText}` : ""),
        timeout: (statusKind === "error" ? "" : "10000"),
        title: (statusKind === "error" ? (t('failed')) : (t('success'))),
      });
    }
  };
  useEffect(() => {
    const shouldShowMessage = localStorage.getItem("showModal");
    if ((shouldShowMessage === undefined || shouldShowMessage === null) && !shouldShowMessage) {
      setShowModal(true);
    }
    getMetadataDetails();
    showNotificationStatus();
    getAllInstance();
  }, []);

  return (
    <>
      <Grid className="landing-page" fullWidth>
        <Column lg={16} md={8} sm={4} className="landing-page-title">
        <InlineNotification title={t('disclaimer')} className="error-notification" subtitle={t('disclaimerMessage')} kind="info" role="status" />
          <h2 className="landing-page__subheading common-heading validity-text">
            {t('appTitle')}
          </h2>
          {/* <ToastNotification title="Sandbox usage time expires in 5 days" kind="info" className="validity-notify" timeout= {5000} role="status" /> */}
        </Column>

        <Column lg={16} md={8} sm={4} className="landing-page__r3 show-info-cards">
          <Grid className="info-section">
            <MonteCarloApp metaData={metaData} showToast={showNotificationStatus} />
            <HuggingFaceApp metaData={metaData} showToast={showNotificationStatus} />
            <ByoApplication metaData={metaData} showToast={showNotificationStatus} showPollFlagStatus={showPollFlagStatus} />
            <PrestoApp metaData={metaData} showToast={showNotificationStatus} />
          </Grid>
        </Column>
      </Grid>

      <Modal
        open={showModal}
        size="xs"
        className="info-modal"
        modalHeading={t('welcomeTitle')}
        primaryButtonText={t('ok')}
        secondaryButtonText={t('cancel')}
        onRequestSubmit={handleHideModal}
        onRequestClose={handleCloseModal}
      >
        {t('welcomeText')}
        <div className="hide-msg-cont">
          <Checkbox
            id="hideMessageCheckbox"
            checked={hideModalChecked}
            onChange={handleCheckboxChange}
            helperText={t('helperText')}
            labelText=""
          />
        </div>
      </Modal>
      {isLoadingPage === true && <Loading className="page-loader" withOverlay={true} />}
    </>
  );
}

export default LandingPage;
