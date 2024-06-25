import React, { useState, useEffect } from "react";
import {
  Column,
  Modal,
  Button,
  Theme,
  TextInput,
  FormLabel,
  Form,
  Select,
  SelectItem,
  InlineLoading,
  Link,
  ButtonSet
} from "@carbon/react";
import { ErrorFilled, CheckmarkFilled } from "@carbon/icons-react";
import { SidePanel } from '@carbon/ibm-products';
import { getHuggingFace, createHuggingInstances, huggingRunBenchmark, getHuggingRunLists, deleteHuggingInstances, resetBenchmark } from "../../api/api";
import { useTranslation } from "react-i18next";
import errorNotification from "../../component/errorNotification";

function HuggingFaceApp(props) {
  const { t } = useTranslation();
  const [showHuggingButtons, setShowHuggingButtons] = useState(false);
  const [showHuggingSidepanel, setShowHuggingSidepanel] = useState(false);
  const [showHuggingDelete, setShowHuggingDelete] = useState(false);
  const [huggingRunLogs, setHuggingRunLogs] = useState({});
  const [huggingRunLists, setHuggingRunLists] = useState([]);
  const [isAiProLoading, setIsAiProLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectAiProfiles, setSelectAiProfiles] = useState("16vCPUs");
  const [huggingInstanceDetails, setHuggingInstanceDetails] = useState([]);
  const [allHuggingInstances, setAllHuggingInstances] = useState({});
  const [huggingLogsShow, setHuggingLogsShow] = useState(false);
  const [isAiDelLoading, setIsAiDelLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [huggingFlagStatus, setHuggingFlagStatus] = useState();
  const [huggingDeleteFlagStatus, setHuggingDeleteFlagStatus] = useState();
  const [huggingRunCreateFlag, setHuggingRunCreateFlag] = useState();
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);

  const sideInstanceHeading = [t('latestLogs'), t('lastLogs')]
  const [huggingInstall, setHuggingInstall] = useState(false);

  const aiProfileChange = (e) => {
    setSelectAiProfiles(e.target.value);
  }

  const handleDelCloseModal = () => {
    setInputValue('');
    setShowHuggingDelete(false);
  }

  /* Ai Application */

  const getHuggingInstance = async () => {
    setIsLoadingInstances(true);
    try {
      const response = await getHuggingFace();
      const aiInstances = response.instances;
      if (aiInstances.length === 0) {
        setShowHuggingButtons(false);
      } else {
        setShowHuggingButtons(true);
      }
      setHuggingInstanceDetails(aiInstances);
      setAllHuggingInstances(response);
      setHuggingFlagStatus(response.createFlag);
      setHuggingDeleteFlagStatus(response.deleteFlag)
      setIsLoadingInstances(false);
    } catch (error) {
      console.log(error);
      setIsLoadingInstances(false);
      errorNotification(error, t('serverError'), "getHugInstancesFailed", props.showToast);
    }
  };

  let aiAmxInstanceFailed = null;
  if (Array.isArray(huggingInstanceDetails)) {
    aiAmxInstanceFailed = huggingInstanceDetails.filter(item => {
      return item.vsiStatus === 'failed';
    })
  }

  const aiBtnClick = () => {
    setShowHuggingSidepanel(true);
    setHuggingLogsShow(true);
  }

  const showAiSidePanel = async (e) => {
    getHuggingBenchmarkLogs();
    setShowHuggingSidepanel(true);
    setHuggingLogsShow(false);
  };

  const createAiBtnClick = async (e) => {
    e.preventDefault();
    setShowHuggingSidepanel(false);
    getHuggingInstance();
    setIsAiProLoading(true);
    setHuggingInstall(true);
    const data = {
      applicationName: "huggingface",
      instanceProfileName: selectAiProfiles,
      vpcID: props.metaData.data.vpc.id,
      subnetID: props.metaData.data.network_interfaces[0].subnet.id,
      networkInterfaceName: props.metaData.data.network_interfaces[0].name,
      zone: props.metaData.data.zone.name,
      resourcegroup: props.metaData.data.resource_group.id

    };
    try {
      await createHuggingInstances(data);
      setIsAiProLoading(false);
      setShowHuggingButtons(true);
      getHuggingInstance();
      setHuggingInstall(false);
      props.showToast("success", "hugCreateSuccess", t('hugging.createSuccessMsg'));
    } catch (error) {
      console.error(error);
      setHuggingInstall(false);
      setIsAiProLoading(false);
      setShowHuggingButtons(false);
      errorNotification(error, t('serverError'), "hugCreateFailed", props.showToast, t('errorLogInfo'));
      getHuggingInstance();
    }
  };

  const handleHuggingrunBenchmark = async (e) => {
    e.preventDefault();
    hideSidepanel();
    getHuggingBenchmarkLogs();
    setIsAiLoading(true);
    const instanceIps = huggingInstanceDetails.map(ips => ips.ipAddress);
    const data = {
      address: instanceIps,
      sshUsername: "ubuntu",
      port: "22"
    };
    try {
      await huggingRunBenchmark(data);
      setIsAiLoading(false);
      props.showToast("success", "hugRunSuccess", t('hugging.benchmarkRunSuccessMsg'));
      getHuggingBenchmarkLogs();
    } catch (error) {
      console.error(error);
      setIsAiLoading(false);
      errorNotification(error, t('serverError'), "hugRunFailed", props.showToast, t('errorLogInfo'));
      getHuggingBenchmarkLogs();
    }
  }

  const getHuggingBenchmarkLogs = async () => {
    const body = {
      count: 4,
      page: 1,
      search: ""
    }
    try {
      const response = await getHuggingRunLists(body);
      setHuggingRunLogs(response);
      setHuggingRunLists(response.ListTest);
      setHuggingRunCreateFlag(response.createFlag)
    } catch (error) {
      console.log(error);
    }
  };

  const aiDelModalShow = () => {
    setShowHuggingDelete(true);
  }

  const handleAiDelSubmit = async (e) => {
    e.preventDefault();
    setInputValue('');
    getHuggingInstance();
    setShowHuggingDelete(false);
    setIsAiDelLoading(true);
    const instanceIds = huggingInstanceDetails.map(ids => ids.id);
    const body = {
      headers: {},
      instanceIDs: instanceIds
    }
    try {
      await deleteHuggingInstances(body);
      setIsAiDelLoading(false);
      setShowHuggingButtons(false);
      getHuggingInstance();
      props.showToast("success", "hugDeleteSuccess", t('hugging.deleteSuccessMsg'));
    } catch (error) {
      console.error(error);
      setIsAiDelLoading(false);
      setShowHuggingButtons(true);
      errorNotification(error, t('serverError'), "hugDeleteFailed", props.showToast, t('errorLogInfo'));
      getHuggingInstance();
    }
  }

  const hanldeResetRun = async (e) => {
    e.preventDefault();
    setIsResetLoading(true);
    const instanceIds = huggingInstanceDetails.map(ids => ids.id);
    const body = {
      headers: {},
      benchmarkName: "HuggingFace inference application",
      instanceIds: instanceIds
    }
    try {
      await resetBenchmark(body);
      setIsResetLoading(false);
      getHuggingBenchmarkLogs();
      props.showToast("success", "hugResetSuccess", t('hugging.resetSuccessMsg'));
    } catch (error) {
      console.error(error);
      setIsResetLoading(false);
      errorNotification(error, t('serverError'), "hugResetFailed", props.showToast, t('errorLogInfo'));
      getHuggingBenchmarkLogs();
    }
  }

  function handleChange(e) {
    setInputValue(e.target.value);
  }

  const hideSidepanel = () => {
    setShowHuggingSidepanel(false);
  }
  useEffect(() => {
    getHuggingInstance();
    getHuggingBenchmarkLogs();
    let interval;
    if (huggingFlagStatus === true) {
      interval = setInterval(() => {
        getHuggingInstance();
      }, 30000);
    } else if (huggingRunCreateFlag === true) {
      interval = setInterval(() => {
        getHuggingBenchmarkLogs();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [showHuggingButtons, selectAiProfiles, huggingFlagStatus, huggingDeleteFlagStatus, huggingRunCreateFlag]);

  return (
    <Column lg={5} md={8} sm={4} className="info-card">
      <h4 className="info-card__heading loading-header">{t('hugging.title')} {(isLoadingInstances === true && huggingFlagStatus === false) && <InlineLoading className="instances-inline-loader" status="active" />}</h4>
      <div className="instance-status-running instance-status-com">
        {(huggingInstanceDetails && huggingInstanceDetails.length === 0) && (huggingInstall === false && huggingFlagStatus === false) && <span>{t('notConfigured')}</span>}
        {Array.isArray(aiAmxInstanceFailed) && aiAmxInstanceFailed.length >= 1 && <span className="instance-run-failed"><ErrorFilled /> {t('failed')}</span>}
        {(huggingInstanceDetails && huggingInstanceDetails.length > 1) &&
          Array.isArray(aiAmxInstanceFailed) && aiAmxInstanceFailed.length === 0 && (huggingInstall === false && huggingFlagStatus === false) && <span className="instance-run-success"><CheckmarkFilled /> {t('running')}</span>
        }
        {(huggingInstall === true || huggingFlagStatus === true) && <span className="install-progress">{t('installProcess')}</span>}
      </div>
      <p className="info-card__body">
        {t('hugging.description')}
      </p>
      <div className="details-btn-cont">
        <Button onClick={showAiSidePanel} kind="ghost" className={(!showHuggingButtons || huggingFlagStatus === true) ? "hide-details-btn" : "details-card-btn"}>
          {t('viewdetails')}
        </Button>
        {(isAiLoading === true || huggingRunCreateFlag === true) && <InlineLoading status='active' description={t('hugging.runBenchmark')} />}
        {(isAiDelLoading === true || huggingDeleteFlagStatus === true) && <InlineLoading status='active' description={t('deletingInstances')} />}
        {(isResetLoading === true) && <InlineLoading status='active' description={t('resetBenchmarkProcess')} />}
      </div>
      {(isAiProLoading === true || huggingFlagStatus === true) &&
        <div className="details-btn-cont">
          <InlineLoading status='active' description={t('createInstances')} />
        </div>
      }
      <div className="buttons-ui-cont">
        <ButtonSet>
          <Button
            kind="primary"
            onClick={aiBtnClick}
            className={showHuggingButtons === true ? "hideSetBtn" : "showSetBtn"}
            disabled={isAiProLoading === true || huggingFlagStatus === true || huggingDeleteFlagStatus === true || isLoadingInstances === true}
          >
            {t('setup')}
          </Button>
          <Button
            kind="primary"
            onClick={handleHuggingrunBenchmark}
            className={showHuggingButtons === true ? "showRunBtn" : "hideRunBtn"}
            disabled={isAiLoading === true || isAiDelLoading === true || huggingFlagStatus === true || huggingDeleteFlagStatus === true || huggingRunCreateFlag === true || isLoadingInstances === true}
          >
            {t('runBenchmark')}
          </Button>
          <Button
            kind="secondary"
            onClick={hanldeResetRun}
            className={showHuggingButtons === true ? "showRunBtn" : "hideRunBtn"}
            disabled={isAiLoading === true || isResetLoading === true || huggingFlagStatus === true || huggingDeleteFlagStatus === true || huggingRunCreateFlag === true || huggingRunLists.length === 0 || isLoadingInstances === true}
          >
            {t('resetBenchmark')}
          </Button>
          <Button kind="danger"
            onClick={aiDelModalShow}
            id="huggingDelete"
            disabled={!showHuggingButtons || isAiDelLoading === true || huggingFlagStatus === true || huggingDeleteFlagStatus === true || huggingRunCreateFlag === true || isAiLoading === true || isLoadingInstances === true}>
            {t('delete')}
          </Button>
        </ButtonSet>
      </div>

      <SidePanel
        includeOverlay={true}
        size="lg"
        open={showHuggingSidepanel}
        onRequestClose={hideSidepanel}
        title={(huggingInstanceDetails.length > 0) ? t('hugging.sidePanelTitle') : t('hugging.setupTitle')}
        className={huggingLogsShow === true ? "carlocreatebtn" : "carlohidebtn"}
        actions={[
          {
            label: t('submit'),
            onClick: createAiBtnClick,
            kind: 'primary',
          },
          {
            label: t('cancel'),
            onClick: hideSidepanel,
            kind: 'secondary',
          },
        ]
        }
      >
        {huggingLogsShow === true && <Theme className="common-card-cont">
          <Form>
            <Select id={`select-1`} labelText="Select profile" value={selectAiProfiles} onChange={aiProfileChange}>
              <SelectItem value="16vCPUs" text="16vCPUs" /></Select>
            {props.metaData && props.metaData.data !== undefined && props.metaData.data !== null &&
              <div className="props.metaData-details">
                <div className="create-subdet"><span className="meta-sunhead">{t('vpcId')}</span> : <span>{props.metaData.data.vpc.id}</span></div>
                <div className="create-subdet"><span className="meta-sunhead">{t('imageId')}</span> : <span>{props.metaData.data.image.id}</span></div>
                <div className="create-subdet"><span className="meta-sunhead">{t('zone')}</span> : <span>{props.metaData.data.zone.name}</span></div>
                <div className="create-subdet"><span className="meta-sunhead">{t('resourceGroup')}</span> : <span>{props.metaData.data.resource_group.id}</span></div>
                <div className="create-subdet"><span className="meta-sunhead">{t('networkInterfaceGroup')}</span> : <span>{props.metaData.data.network_interfaces[0].name}</span></div>
                <div className="create-subdet"><span className="meta-sunhead">{t('subnetId')}</span> : <span>{props.metaData.data.network_interfaces[0].subnet.id}</span></div>
              </div>
            }
          </Form>
        </Theme>
        }

        {(huggingInstanceDetails && huggingInstanceDetails.length > 0) &&
          <Theme className="common-card-cont">
            <div className="app-sidepanel-container">
              <div className="side-status-details">
                {allHuggingInstances && allHuggingInstances !== null && allHuggingInstances !== undefined && <p>{t('hugging.deployedSuccess')}</p>}
              </div>
              <div className="side-instances-details">
                <h4>{t('hugging.instanceHeading')}</h4>
                {huggingInstanceDetails.map((mid) => (
                  <div className="cont-side-details" key={mid.id}>
                    <p><span>{t('vsiName')}:</span> {mid.vsiName}</p>
                    <p><span>{t('vsiType')}:</span> {mid.vsiProfile}</p>
                    <p><span>{t('ipAddress')}:</span> {mid.ipAddress}</p>
                    <p><span>{t('status')}:</span> {mid.vsiStatus}</p>
                  </div>
                ))}
              </div>
              {(huggingRunLogs && huggingRunLogs.ListTest.length === 0) && <p className="no-run-logs">{t('benchmarkNotAvail')}</p>}
              <div class="run-log-details">
                {huggingRunLogs && huggingRunLogs.ListTest.map((mrl, index) => {
                  const subHeadingLogs = Math.floor(index / 2);
                  return (
                    <div className="cont-side-details" key={mrl.ID}>
                      {index % 2 === 0 && (
                        <h4>{sideInstanceHeading[subHeadingLogs]}</h4>
                      )}
                      <p><span>{t('vsiName')}:</span> {mrl.vsiName}</p>
                      <p><span>{t('vsiProfile')}:</span> {mrl.vsiProfile}</p>
                      <p><span>{t('bertType')}:</span> {mrl.bertModelType.shortSentenceArray}</p>
                      <p><span>{t('robertoType')}:</span> {mrl.robertaModelType.shortSentenceArray}</p>
                    </div>
                  )
                })}
                {(huggingRunLogs && huggingRunLogs.ListTest.length > 1) && <p>{t('infoContent')} <Link href="/benchmarklogs">{t('benchmarkLogs')}</Link> & <Link href="/performance-dashboard">{t('performanceDashboard')}</Link>.</p>}
              </div>
            </div>
          </Theme>
        }
      </SidePanel>

      <Modal
        open={showHuggingDelete}
        size="xs"
        danger
        className="info-modal"
        modalHeading={t('deleteInstances')}
        primaryButtonText={t('instanceDelete')}
        secondaryButtonText={t('instanceCancel')}
        onRequestSubmit={handleAiDelSubmit}
        onRequestClose={handleDelCloseModal}
        primaryButtonDisabled={inputValue === 'Delete' ? false : true}
      >
        <div className="mod-content">
          <p>{t('deleteDescription')}</p>
          <FormLabel>{t('deleteConfirm')}</FormLabel>
          <TextInput type="text" id="deleteHuggingId" value={inputValue} labelText="" onChange={handleChange} />
        </div>
      </Modal>
    </Column>
  );
};

export default HuggingFaceApp;
