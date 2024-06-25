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
import { getMonteCarlo, createMonteCarloInstances, monteCarloRunBenchmark, deleteMonteCarloInstances, getMonteCarloRunLists, resetBenchmark } from "../../api/api";
import { useTranslation } from "react-i18next";
import errorNotification from "../../component/errorNotification";

function MonteCarloApp(props) {
  const { t } = useTranslation();
  const [showMonteButtons, setShowMonteButtons] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [monteInstanceDetails, setMonteInstanceDetails] = useState([]);
  const [monteInstancesLogs, setMonteInstancesLogs] = useState({});
  const [monteFlagStatus, setMonteFlagStatus] = useState();
  const [monteDeleteFlagStatus, setMonteDeleteFlagStatus] = useState();
  const [open, setOpen] = useState(false);
  const [monteSidePanel, setMonteSidePanel] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [monteReports, setMonteReports] = useState({});
  const [monteRunLists, setMonteRunLists] = useState([]);
  const [isProLoading, setIsProLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectProfiles, setSelectProfiles] = useState("8vCPUs");
  const [isDelLoading, setIsDelLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const sideInstanceHeading = [t('latestLogs'), t('lastLogs')]
  const [monteInstall, setMonteInstall] = useState(false);
  const [monteRunCreateFlag, setMonteRunCreateFlag] = useState(false);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);

  const profileChange = (e) => {
    setSelectProfiles(e.target.value);
  }

  const getMonteInstance = async () => {
    setIsLoadingInstances(true);
    try {
      const response = await getMonteCarlo();
      const monteInstances = response.instances;
      if (monteInstances.length === 0) {
        setShowMonteButtons(false);
      } else {
        setShowMonteButtons(true);
      }
      setMonteInstanceDetails(monteInstances);
      setMonteInstancesLogs(response);
      setMonteFlagStatus(response.createFlag);
      setMonteDeleteFlagStatus(response.deleteFlag);
      setIsLoadingInstances(false);
    } catch (error) {
      console.log(error);
      setIsLoadingInstances(false);
      errorNotification(error, t('serverError'), "monteGetInstanceFailed", props.showToast);
    }
  };

  let monteInstanceFailed = null;
  if (Array.isArray(monteInstanceDetails)) {
    monteInstanceFailed = monteInstanceDetails.filter(item => {
      return item.vsiStatus === 'failed';
    })
  }

  const showCarlo = async () => {
    getMonteCarloReports();
    setOpen(true);
    setMonteSidePanel(false);
  };

  const carloSidePanel = () => {
    setOpen(true);
    setMonteSidePanel(true);
  }

  const handleCarloCreate = async (e) => {
    e.preventDefault();
    getMonteInstance();
    setOpen(false);
    setIsProLoading(true);
    setMonteInstall(true);
    const data = {
      applicationName: "montecarlo",
      instanceProfileName: selectProfiles,
      vpcID: props.metaData.data.vpc.id,
      subnetID: props.metaData.data.network_interfaces[0].subnet.id,
      networkInterfaceName: props.metaData.data.network_interfaces[0].name,
      zone: props.metaData.data.zone.name,
      resourcegroup: props.metaData.data.resource_group.id

    };
    try {
      await createMonteCarloInstances(data);
      setIsProLoading(false);
      getMonteInstance();
      setShowMonteButtons(true);
      setMonteInstall(false);
      props.showToast("success", "monteCreateSuccess", t('monte.createSuccessMsg'));
    } catch (error) {
      console.error(error);
      setMonteInstall(false);
      errorNotification(error, t('serverError'), "monteCreateFailed", props.showToast, t('errorLogInfo'));
      getMonteInstance();
      setIsProLoading(false);
    }
  };

  const monteRunClick = async (e, index) => {
    e.preventDefault();
    hideSidepanel();
    setIsLoading(true);
    getMonteCarloReports();
    const instanceIps = monteInstanceDetails.map(ips => ips.ipAddress);
    const data = {
      address: instanceIps,
      sshUsername: "ubuntu",
      port: "22"
    };
    try {
      await monteCarloRunBenchmark(data);
      setIsLoading(false);
      getMonteCarloReports();
      props.showToast("success", "monteRunSuccess", t('monte.benchmarkRunSuccessMsg'));
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      getMonteCarloReports();
      errorNotification(error, t('serverError'), "monteRunFailed", props.showToast, t('errorLogInfo'));
    }
  }

  const handleDelCloseModal = () => {
    setInputValue('');
    setShowDeleteModal(false);
  }

  const handleDelSubmit = async (e) => {
    e.preventDefault();
    setInputValue('');
    getMonteInstance();
    setShowDeleteModal(false);
    setIsDelLoading(true);
    const instanceIds = monteInstanceDetails.map(ids => ids.id);
    const body = {
      headers: {},
      instanceIDs: instanceIds
    }
    try {
      await deleteMonteCarloInstances(body);
      setIsDelLoading(false);
      setShowMonteButtons(false);
      getMonteInstance();
      props.showToast("success", "monteDeleteSuccess", t('monte.deleteSuccessMsg'));
    } catch (error) {
      console.error(error);
      setIsDelLoading(false);
      errorNotification(error, t('serverError'), "monteDeleteFailed", props.showToast, t('errorLogInfo'));
      getMonteInstance();
    }
  }

  const hanldeResetRun = async (e) => {
    e.preventDefault();
    setIsResetLoading(true);
    const instanceIds = monteInstanceDetails.map(ids => ids.id);
    const body = {
      headers: {},
      benchmarkName: "Monte Carlo simulation",
      instanceIds: instanceIds
    }
    try {
      await resetBenchmark(body);
      setIsResetLoading(false);
      getMonteCarloReports();
      props.showToast("success", "monteResetSuccess", t('monte.resetSuccessMsg'));
    } catch (error) {
      console.error(error);
      setIsResetLoading(false);
      errorNotification(error, t('serverError'), "monteResetFailed", props.showToast, t('errorLogInfo'));
      getMonteCarloReports();
    }
  }

  const monteInstanceDelete = () => {
    setInputValue('');
    setShowDeleteModal(true);
  }

  function handleChange(e) {
    setInputValue(e.target.value);
  }

  const hideSidepanel = () => {
    setOpen(false);
  }

  const getMonteCarloReports = async () => {
    const body = {
      count: 4,
      page: 1,
      search: ""
    }
    try {
      const response = await getMonteCarloRunLists(body);
      setMonteReports(response);
      setMonteRunLists(response.ListTest);
      setMonteRunCreateFlag(response.createFlag);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getMonteInstance();
    getMonteCarloReports();
    let interval;
    if (monteFlagStatus === true) {
      interval = setInterval(() => {
        getMonteInstance();
      }, 30000);
    } else if (monteRunCreateFlag === true) {
      interval = setInterval(() => {
        getMonteCarloReports();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [showMonteButtons, selectProfiles, monteFlagStatus, monteDeleteFlagStatus, monteRunCreateFlag]);


  return (
    <Column lg={5} md={8} sm={4} className="info-card">
      <h4 className="info-card__heading loading-header">{t('monte.title')} {(isLoadingInstances === true && monteFlagStatus === false) && <InlineLoading className="instances-inline-loader" status="active" />}</h4>
      <div className="instance-status-running instance-status-com">
        {(monteInstanceDetails && monteInstanceDetails.length === 0) && (monteInstall === false && monteFlagStatus === false) && <span>{t('notConfigured')}</span>}
        {Array.isArray(monteInstanceFailed) && monteInstanceFailed.length >= 1 && <span className="instance-run-failed"><ErrorFilled /> {t('failed')}</span>}
        {(monteInstanceDetails && monteInstanceDetails.length > 0) &&
          Array.isArray(monteInstanceFailed) && monteInstanceFailed.length === 0 && (monteInstall === false && monteFlagStatus === false) && <span className="instance-run-success"><CheckmarkFilled /> {t('running')}</span>}
        {(monteInstall === true || monteFlagStatus === true) && <span className="install-progress">{t('installProcess')}</span>}
      </div>
      <p className="info-card__body">
        {t('monte.description')}
      </p>
      <div className="details-btn-cont">
        <Button onClick={showCarlo} kind="ghost" className={(!showMonteButtons || monteFlagStatus === true) ? "hide-details-btn" : "details-card-btn"}>
          {t('viewdetails')}
        </Button>
        {isLoading === true && <InlineLoading status='active' description={t('monte.runBenchmark')} />}
        {(isDelLoading === true || monteDeleteFlagStatus === true) && <InlineLoading status='active' description={t('deletingInstances')} />}
        {(isResetLoading === true) && <InlineLoading status='active' description={t('resetBenchmarkProcess')} />}
      </div>
      {(isProLoading === true || monteFlagStatus === true) &&
        <div className="details-btn-cont">
          <InlineLoading status='active' description={t('createInstances')} />
        </div>
      }
      <div className="buttons-ui-cont">
        <ButtonSet>
          <Button
            kind="primary"
            onClick={carloSidePanel}
            className={showMonteButtons === true ? "hideSetBtn" : "showSetBtn"}
            disabled={isProLoading === true || monteFlagStatus === true || monteDeleteFlagStatus === true || isLoadingInstances === true}
          >
            {t('setup')}
          </Button>
          <Button
            kind="primary"
            className={showMonteButtons === true ? "showRunBtn" : "hideRunBtn"}
            onClick={monteRunClick}
            disabled={isLoading === true || isDelLoading === true || monteFlagStatus === true || monteDeleteFlagStatus === true || monteRunCreateFlag === true || isLoadingInstances === true}
          >
            {t('runBenchmark')}
          </Button>
          <Button
            kind="secondary"
            className={showMonteButtons === true ? "showRunBtn" : "hideRunBtn"}
            onClick={hanldeResetRun}
            disabled={isLoading === true || isResetLoading === true || monteFlagStatus === true || monteDeleteFlagStatus === true || monteRunLists.length === 0 || monteRunCreateFlag === true || isLoadingInstances === true}
          >
            {t('resetBenchmark')}
          </Button>
          <Button kind="danger"
            onClick={monteInstanceDelete}
            id="monteDelete"
            disabled={!showMonteButtons || isDelLoading === true || monteFlagStatus === true || monteDeleteFlagStatus === true || monteRunCreateFlag === true || isLoading === true || isLoadingInstances === true}>
            {t('delete')}
          </Button>
          </ButtonSet>
      </div>

      <SidePanel
        includeOverlay={true}
        size="lg"
        open={open}
        onRequestClose={hideSidepanel}
        title={(monteInstanceDetails.length > 0) ? t('monte.sidePanelTitle') : t('monte.setupTitle')}
        className={monteSidePanel === true ? "carlocreatebtn" : "carlohidebtn"}
        actions={[
          {
            label: t('submit'),
            onClick: handleCarloCreate,
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
        {monteSidePanel === true && <Theme className="common-card-cont">
          <Form>
            <Select id={`select-1`} labelText="Select profile" value={selectProfiles} onChange={profileChange}>
              <SelectItem value="8vCPUs" text="8vCPUs" />
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
        {(monteInstanceDetails && monteInstanceDetails.length > 0) &&
          <Theme className="common-card-cont">
            <div className="side-status-details">
              {monteInstancesLogs && monteInstancesLogs !== null && monteInstancesLogs !== undefined && <p>{t('monte.deployedSuccess')}</p>}
            </div>
            <div className="side-instances-details">
              <h4>{t('monte.instanceHeading')}</h4>
              {monteInstanceDetails.map((mid) => (
                <div className="cont-side-details" key={mid.id}>
                  <p><span>{t('vsiName')}:</span> {mid.vsiName}</p>
                  <p><span>{t('vsiType')}:</span> {mid.vsiProfile}</p>
                  <p><span>{t('ipAddress')}:</span> {mid.ipAddress}</p>
                  <p><span>{t('status')}:</span> {mid.vsiStatus}</p>
                </div>
              ))}
            </div>

            {(monteReports && monteReports.ListTest.length === 0) && <p className="no-run-logs">{t('benchmarkNotAvail')}</p>}
            <div class="run-log-details">
              {monteReports && monteReports.ListTest !== undefined && monteReports.ListTest.map((mrl, index) => {
                const subHeadingLogs = Math.floor(index / 2);
                return (
                  <div className="cont-side-details" key={mrl.ID}>
                    {index % 2 === 0 && (
                      <h4>{sideInstanceHeading[subHeadingLogs]}</h4>
                    )}
                    <p><span>{t('vsiName')}:</span> {mrl.vsiName}</p>
                    <p><span>{t('vsiProfile')}:</span> {mrl.vsiProfile}</p>
                    <p><span>{t('persec')}:</span> {mrl.performanceMetric1}</p>
                  </div>
                )
              })}
              {(monteReports && monteReports.ListTest.length > 1) && <p>{t('infoContent')} <Link href="/benchmarklogs">{t('benchmarkLogs')}</Link> & <Link href="/performance-dashboard">{t('performanceDashboard')}</Link>.</p>}
            </div>
          </Theme>
        }
      </SidePanel>
      <Modal
        open={showDeleteModal}
        size="xs"
        danger
        className="info-modal"
        modalHeading={t('deleteInstances')}
        primaryButtonText={t('instanceDelete')}
        secondaryButtonText={t('instanceCancel')}
        onRequestSubmit={handleDelSubmit}
        onRequestClose={handleDelCloseModal}
        primaryButtonDisabled={inputValue === 'Delete' ? false : true}
      >
        <div className="mod-content">
          <p>{t('deleteDescription')}</p>
          <FormLabel>{t('deleteConfirm')}</FormLabel>
          <TextInput type="text" id="deleteMonteId" value={inputValue} labelText="" onChange={handleChange} />
        </div>
      </Modal>
    </Column>
  );
};

export default MonteCarloApp;
