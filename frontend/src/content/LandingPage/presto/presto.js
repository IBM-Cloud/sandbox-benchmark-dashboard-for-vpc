import React, { useState, useEffect, useCallback } from "react";
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
  ButtonSet,
} from "@carbon/react";
import { ErrorFilled, CheckmarkFilled } from "@carbon/icons-react";
import { SidePanel } from "@carbon/ibm-products";
import {
  getPrestoInstances,
  createPrestoInstances,
  prestoRunBenchmark,
  deletePrestoInstances,
  getPrestoRunLists,
  resetBenchmark,
  getPrestoBenchmarkStatus,
} from "../../api/api";
import { useTranslation } from "react-i18next";
import errorNotification from "../../component/errorNotification";

function PrestoApp(props) {
  const { t } = useTranslation();
  const [showPrestoButtons, setShowPrestoButtons] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prestoInstanceDetails, setPrestoInstanceDetails] = useState([]);
  const [prestoInstancesLogs, setPrestoInstancesLogs] = useState({});
  const [prestoFlagStatus, setPrestoFlagStatus] = useState(false);
  const [prestoDeleteFlagStatus, setPrestoDeleteFlagStatus] = useState(false);
  const [open, setOpen] = useState(false);
  const [prestoSidePanel, setPrestoSidePanel] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [prestoReports, setPrestoReports] = useState({});
  const [prestoRunLists, setPrestoRunLists] = useState([]);
  const [isProLoading, setIsProLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectProfiles, setSelectProfiles] = useState("16vCPUs");
  const [isDelLoading, setIsDelLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [prestoInstall, setPrestoInstall] = useState(false);
  const [runPrestoOpen, setRunPrestoOpen] = useState(false);
  const [selectQuery, setSelectQuery] = useState("q21");
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  const [prestoRunCreateFlag, setPrestoRunCreateFlag] = useState(false);
  const sideInstanceHeading = [t("latestLogs"), t("lastLogs")];

  const profileChange = (e) => {
    setSelectProfiles(e.target.value);
  };

  const handleSelectQuery = (e) => {
    setSelectQuery(e.target.value);
  };

  const getPrestoInstance = useCallback(async () => {
    setIsLoadingInstances(true);
    try {
      const response = await getPrestoInstances();
      const prestoInstances = response.instances || [];
      setShowPrestoButtons(prestoInstances.length > 0);
      setPrestoInstanceDetails(prestoInstances);
      setPrestoInstancesLogs(response);
      setPrestoFlagStatus(response.createFlag || false);
      setPrestoDeleteFlagStatus(response.deleteFlag || false);
    } catch (error) {
      console.log(error);
      errorNotification(error, t("serverError"), "prestoGetInstanceFailed", props.showToast);
    } finally {
      setIsLoadingInstances(false);
    }
  }, [t, props.showToast]);

  const getPrestoReports = useCallback(async () => {
    const body = { count: 4, page: 1 };
    try {
      const response = await getPrestoRunLists(body);
      setPrestoReports(response);
      setPrestoRunLists(response.ListTest || []);
      setPrestoRunCreateFlag(response.createFlag || false);
    } catch (error) {
      console.log(error);
    }
  }, []);

  let prestoInstanceFailed = null;
  if (Array.isArray(prestoInstanceDetails)) {
    prestoInstanceFailed = prestoInstanceDetails.filter(item => {
      return item.vsiStatus === 'failed';
    })
  }
  const { showToast } = props;
  const getPrestoBenchmark = useCallback(async () => {
    try {
      const response = await getPrestoBenchmarkStatus();
      if (response.success) {
        showToast("success", "prestoStatusSuccess", t("presto.benchmarkRunSuccessMsg"));
      }
    } catch (error) {
      console.log(error);
      errorNotification(error, t("serverError"), "prestoGetBenchmarkStatusFailed", showToast);
    }
  }, [t, showToast]);

  const showPresto = () => {
    getPrestoReports();
    setOpen(true);
    setPrestoSidePanel(false);
  };

  const prestoSidePanelShow = () => {
    setOpen(true);
    setPrestoSidePanel(true);
  };

  const handlePrestoRunSidePanel = () => {
    setRunPrestoOpen(true);
  };

  const handlePrestoCreate = async (e) => {
    e.preventDefault();
    getPrestoInstance();
    setOpen(false);
    setIsProLoading(true);
    setPrestoInstall(true);
    const data = {
      applicationName: "presto",
      instanceProfileName: selectProfiles,
      vpcID: props.metaData.data.vpc.id,
      subnetID: props.metaData.data.network_interfaces[0].subnet.id,
      zone: props.metaData.data.zone.name,
      resourcegroup: props.metaData.data.resource_group.id,
    };
    try {
      await createPrestoInstances(data);
      props.showToast("success", "prestoCreateSuccess", t("presto.createSuccessMsg"));
    } catch (error) {
      console.error(error);
      errorNotification(error, t("serverError"), "prestoCreateFailed", props.showToast, t("errorLogInfo"));
    } finally {
      setIsProLoading(false);
      setPrestoInstall(false);
      getPrestoInstance();
      setShowPrestoButtons(true);
    }
  };

  const handlePrestoRun = async (e) => {
    e.preventDefault();
    hideSidePanel();
    setIsLoading(true);
    const instanceIps = prestoInstanceDetails.map((ips) => ips.ipAddress);
    const data = {
      address: instanceIps,
      sshUsername: "ubuntu",
      port: "22",
      prestoQuery: selectQuery,
    };
    try {
      await prestoRunBenchmark(data);
      props.showToast("success", "prestoRunSuccess", t("presto.runIntiatedMessage"));
      getPrestoReports();
      setSelectQuery("q21");
    } catch (error) {
      console.error(error);
      errorNotification(error, t("serverError"), "prestoRunFailed", props.showToast, t("errorLogInfo"));
    } finally {
      setIsLoading(false);
      getPrestoReports();
      setSelectQuery("q21");
    }
  };

  const handleDelCloseModal = () => {
    setInputValue("");
    setShowDeleteModal(false);
  };

  const handlePrestoDelete = async (e) => {
    e.preventDefault();
    setInputValue("");
    getPrestoInstance();
    setShowDeleteModal(false);
    setIsDelLoading(true);
    const instanceIds = prestoInstanceDetails.map((ids) => ids.id);
    const body = { headers: {}, instanceIDs: instanceIds };
    try {
      await deletePrestoInstances(body);
      props.showToast("success", "prestoDeleteSuccess", t("presto.deleteSuccessMsg"));
    } catch (error) {
      console.error(error);
      errorNotification(error, t("serverError"), "prestoDeleteFailed", props.showToast, t("errorLogInfo"));
    } finally {
      setIsDelLoading(false);
      setShowPrestoButtons(false);
      getPrestoInstance();
    }
  };

  const hanldeResetRun = async (e) => {
    e.preventDefault();
    setIsResetLoading(true);
    getPrestoInstance();
    const instanceIds = prestoInstanceDetails.map(ids => ids.id);
    const body = {
      headers: {},
      benchmarkName: "Presto TPC-H Benchmark",
      instanceIds: instanceIds
    }
    try {
      await resetBenchmark(body);
      setIsResetLoading(false);
      getPrestoReports();
      props.showToast("success", "prestoResetSuccess", t('presto.resetSuccessMsg'));
    } catch (error) {
      console.error(error);
      setIsResetLoading(false);
      errorNotification(error, t('serverError'), "prestoResetFailed", props.showToast, t('errorLogInfo'));
      getPrestoReports();
    }
  }

  const prestoInstanceDelete = () => {
    setInputValue("");
    setShowDeleteModal(true);
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const hideSidePanel = () => {
    setOpen(false);
    setRunPrestoOpen(false);
  };

  useEffect(() => {
    getPrestoInstance();
    getPrestoReports();
    let interval;
    if (prestoFlagStatus === true || prestoDeleteFlagStatus === true) {
      interval = setInterval(() => {
        getPrestoInstance();
      }, 60000);
    } else if (prestoRunCreateFlag === true) {
      interval = setInterval(() => {
        getPrestoReports();
        getPrestoBenchmark();
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [showPrestoButtons, selectProfiles, prestoFlagStatus, prestoDeleteFlagStatus, prestoRunCreateFlag]);

  return (
    <Column lg={5} md={8} sm={4} className="info-card">
      <h4 className="info-card__heading loading-header">{t('presto.title')} {(isLoadingInstances === true && prestoFlagStatus === false) && <InlineLoading className="instances-inline-loader" status="active" />}</h4>
      <div className="instance-status-running instance-status-com">
        {(prestoInstanceDetails && prestoInstanceDetails.length === 0) && (prestoInstall === false && prestoFlagStatus === false) && <span>{t('notConfigured')}</span>}
        {Array.isArray(prestoInstanceFailed) && prestoInstanceFailed.length >= 1 && <span className="instance-run-failed"><ErrorFilled /> {t('failed')}</span>}
        {(prestoInstanceDetails && prestoInstanceDetails.length > 0) &&
          Array.isArray(prestoInstanceFailed) && prestoInstanceFailed.length === 0 && (prestoInstall === false && prestoFlagStatus === false) && <span className="instance-run-success"><CheckmarkFilled /> {t('running')}</span>}
        {(prestoInstall === true || prestoFlagStatus === true) && <span className="install-progress">{t('installProcess')}</span>}
      </div>
      <p className="info-card__body">
        {t('presto.description')}
      </p>
      <div className="details-btn-cont">
        <Button onClick={showPresto} kind="ghost" className={(!showPrestoButtons || prestoFlagStatus === true) ? "hide-details-btn" : "details-card-btn"}>
          {t('viewdetails')}
        </Button>
        {(isLoading === true || prestoRunCreateFlag === true) && <InlineLoading status='active' description={t('presto.runBenchmark')} />}
        {(isDelLoading === true || prestoDeleteFlagStatus === true) && <InlineLoading status='active' description={t('deletingInstances')} />}
        {(isResetLoading === true) && <InlineLoading status='active' description={t('resetBenchmarkProcess')} />}
      </div>
      {(isProLoading === true || prestoFlagStatus === true) &&
        <div className="details-btn-cont">
          <InlineLoading status='active' description={t('presto.createInstances')} />
        </div>
      }
      <div className="buttons-ui-cont">
        <ButtonSet>
          <Button
            id="prestoSetup"
            kind="primary"
            onClick={prestoSidePanelShow}
            className={showPrestoButtons === true ? "hideSetBtn" : "showSetBtn"}
            disabled={isProLoading === true || prestoFlagStatus === true || prestoDeleteFlagStatus === true || isLoadingInstances === true}
          >
            {t('setup')}
          </Button>
          <Button
            id="prestoRun"
            kind="primary"
            className={showPrestoButtons === true ? "showRunBtn" : "hideRunBtn"}
            onClick={handlePrestoRunSidePanel}
            disabled={isLoading === true || isDelLoading === true || prestoFlagStatus === true || prestoDeleteFlagStatus === true || prestoRunCreateFlag === true || isLoadingInstances === true}
          >
            {t('runBenchmark')}
          </Button>
          <Button
            id="prestoReset"
            kind="secondary"
            className={showPrestoButtons === true ? "showRunBtn" : "hideRunBtn"}
            onClick={hanldeResetRun}
            disabled={isLoading === true || isResetLoading === true || prestoFlagStatus === true || prestoDeleteFlagStatus === true || prestoRunLists.length === 0 || prestoRunCreateFlag === true || isLoadingInstances === true}
          >
            {t('resetBenchmark')}
          </Button>
          <Button kind="danger" id="prestoDelete" onClick={prestoInstanceDelete} disabled={!showPrestoButtons || isDelLoading === true || prestoFlagStatus === true || prestoDeleteFlagStatus === true || isLoadingInstances === true || prestoRunCreateFlag === true}>
            {t('delete')}
          </Button>
        </ButtonSet>
      </div>

      <SidePanel
        includeOverlay={true}
        size="lg"
        open={open}
        onRequestClose={hideSidePanel}
        title={(prestoInstanceDetails.length > 0) ? t('presto.sidePanelTitle') : t('presto.setupTitle')}
        className={prestoSidePanel === true ? "carlocreatebtn" : "carlohidebtn"}
        actions={[
          {
            label: t('submit'),
            onClick: handlePrestoCreate,
            kind: 'primary',
          },
          {
            label: t('cancel'),
            onClick: hideSidePanel,
            kind: 'secondary',
          },
        ]
        }
      >
        {prestoSidePanel === true && <Theme className="common-card-cont">
          <Form>
            <Select id={`select-1`} labelText="Select profile" value={selectProfiles} onChange={profileChange}>
              <SelectItem value="16vCPUs" text="16vCPUs" /></Select>
            {props.metaData && props.metaData.data !== undefined && props.metaData.data !== null &&
              <div className="props.metaData-details">
                <div className="create-subdet"><span className="meta-sunhead">{t('vpcId')}</span> : <span>{props.metaData.data.vpc.id}</span></div>
                <div className="create-subdet"><span className="meta-sunhead">{t('imageId')}</span> : <span>{props.metaData.data.image.id}</span></div>
                <div className="create-subdet"><span className="meta-sunhead">{t('zone')}</span> : <span>{props.metaData.data.zone.name}</span></div>
                <div className="create-subdet"><span className="meta-sunhead">{t('resourceGroup')}</span> : <span>{props.metaData.data.resource_group.id}</span></div>
                <div className="create-subdet"><span className="meta-sunhead">{t('subnetId')}</span> : <span>{props.metaData.data.network_interfaces[0].subnet.id}</span></div>
              </div>
            }
          </Form>
        </Theme>
        }
        {(prestoInstanceDetails && prestoInstanceDetails !== null && prestoInstanceDetails !== undefined && prestoInstanceDetails.length > 0) &&
          <Theme className="common-card-cont">
            <div className="side-status-details">
              {prestoInstancesLogs && prestoInstancesLogs !== null && prestoInstancesLogs !== undefined && <p>{t('presto.deployedSuccess')}</p>}
            </div>
            <div className="side-instances-details">
              <h4>{t('presto.instanceHeading')}</h4>
              {prestoInstanceDetails && prestoInstanceDetails !== undefined && prestoInstanceDetails.map((mid) => (
                <div className="cont-side-details" key={mid.id}>
                  <p><span>{t('vsiName')}:</span> {mid.vsiName}</p>
                  <p><span>{t('vsiType')}:</span> {mid.vsiProfile}</p>
                  <p><span>{t('ipAddress')}:</span> {mid.ipAddress}</p>
                  <p><span>{t('status')}:</span> {mid.vsiStatus}</p>
                </div>
              ))}
            </div>

            {(prestoReports && prestoRunLists && prestoRunLists.length === 0) && <p className="no-run-logs">{t('benchmarkNotAvail')}</p>}
            {prestoReports && prestoReports.ListTest !== undefined && prestoReports.ListTest.map((mrl, index) => {
              const subHeadingLogs = Math.floor(index / 2);
              return (
                <div className="cont-side-details" key={mrl.ID}>
                  {index % 2 === 0 && (
                    <h4>{sideInstanceHeading[subHeadingLogs]}</h4>
                  )}
                  <p><span>{t('vsiName')}:</span> {mrl.vsiName}</p>
                  <p><span>{t('vsiProfile')}:</span> {mrl.vsiProfile}</p>
                  <p><span>{t('presto.executionTime')}:</span> {mrl.performanceMetric1}</p>
                </div>
              )
            })}
            {(prestoReports && prestoRunLists && prestoRunLists.length > 1) && <p>{t('infoContent')} <Link href="/benchmarklogs">{t('benchmarkLogs')}</Link> & <Link href="/performance-dashboard">{t('performanceDashboard')}</Link>.</p>}
          </Theme>
        }
      </SidePanel>

      <SidePanel
        includeOverlay={true}
        size="lg"
        open={runPrestoOpen}
        onRequestClose={hideSidePanel}
        title={t('presto.runTitle')}
        className=""
        actions={[
          {
            label: t('run'),
            onClick: handlePrestoRun,
            kind: 'primary',
            id: "PrestoRun"
          },
          {
            label: t('cancel'),
            onClick: hideSidePanel,
            kind: 'secondary',
            id: "PrestoCancel"
          },
        ]
        }
      >

        <Form>
          <Select id="SelectQueryId" labelText={t('presto.selectQuery')} className="select-query" value={selectQuery} onChange={handleSelectQuery} defaultValue="q21">
            <SelectItem value="q21" text={t('presto.query21')} />
            <SelectItem value="q01" text={t('presto.query1')} />
            <SelectItem value="q02" text={t('presto.query2')} />
            <SelectItem value="q03" text={t('presto.query3')} />
            <SelectItem value="q04" text={t('presto.query4')} />
            <SelectItem value="q05" text={t('presto.query5')} />
            <SelectItem value="q06" text={t('presto.query6')} />
            <SelectItem value="q07" text={t('presto.query7')} />
            <SelectItem value="q08" text={t('presto.query8')} />
            <SelectItem value="q09" text={t('presto.query9')} />
            <SelectItem value="q10" text={t('presto.query10')} />
            <SelectItem value="q11" text={t('presto.query11')} />
            <SelectItem value="q12" text={t('presto.query12')} />
            <SelectItem value="q13" text={t('presto.query13')} />
            <SelectItem value="q14" text={t('presto.query14')} />
            <SelectItem value="q15" text={t('presto.query15')} />
            <SelectItem value="q16" text={t('presto.query16')} />
            <SelectItem value="q17" text={t('presto.query17')} />
            <SelectItem value="q18" text={t('presto.query18')} />
            <SelectItem value="q19" text={t('presto.query19')} />
            <SelectItem value="q20" text={t('presto.query20')} />
            <SelectItem value="q22" text={t('presto.query22')} />
            <SelectItem value="ALL" text={t('all')} />
          </Select>
        </Form>
      </SidePanel>

      <Modal
        open={showDeleteModal}
        size="xs"
        danger
        className="info-modal"
        modalHeading={t('deleteInstances')}
        primaryButtonText={t('instanceDelete')}
        secondaryButtonText={t('instanceCancel')}
        onRequestSubmit={handlePrestoDelete}
        onRequestClose={handleDelCloseModal}
        primaryButtonDisabled={inputValue === 'Delete' ? false : true}
      >
        <div className="mod-content">
          <p>{t('deleteDescription')}</p>
          <FormLabel>{t('deleteConfirm')}</FormLabel>
          <TextInput type="text" id="deletePrestoId" value={inputValue} labelText="" onChange={handleChange} />
        </div>
      </Modal>
    </Column>
  );
};

export default PrestoApp;