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
    ButtonSet,
    FileUploaderDropContainer,
    FormItem,
    TextArea
} from "@carbon/react";
import { ErrorFilled, CheckmarkFilled } from "@carbon/icons-react";
import { SidePanel } from '@carbon/ibm-products';
import { getByo, createByoInstances, deleteByoInstances, runByoApi, getByoLists, resetBenchmark } from "../../api/api";
import { useTranslation } from "react-i18next";
import errorNotification from "../../component/errorNotification";
import InlineToastNotification from "../../component/inlineToast";

function ByoApplication(props) {
    const { t } = useTranslation();
    const [showByoButtons, setShowByoButtons] = useState(false);
    const [byoOpen, setByoOpen] = useState(false);
    const [showByoSidepanel, setShowByoSidepanel] = useState(false);
    const [runByoOpen, setRunByoOpen] = useState(false);
    const [showByoDelete, setShowByoDelete] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectByoProfiles, setSelectByoProfiles] = useState("8vCPUs");
    const [byoInstanceDetails, setByoInstanceDetails] = useState([]);
    const [wholeByoInstances, setWholeByoInstances] = useState({});
    const [isByoCreateLoading, setIsByoCreateLoading] = useState(false);
    const [isByoDelLoading, setIsByoDelLoading] = useState(false);
    const [byoFlagStatus, setByoFlagStatus] = useState();
    const [byoDeleteFlagStatus, setByoDeleteFlagStatus] = useState();
    const [byoRunLoading, setByoRunLoading] = useState(false);
    const [fileContent, setFileContent] = useState('');
    const [isResetLoading, setIsResetLoading] = useState(false);
    const [byoRunLists, setByoRunLists] = useState([]);
    const [scriptError, setScriptError] = useState(false);
    const [byoInstall, setByoInstall] = useState(false);
    const [showAppStatus, setShowAppStatus] = useState("");
    const [showNotification, setShowNotification] = useState("");
    const [showToastContainer, setShowToastContainer] = useState(false);
    const [byoRunCreateFlag, setByoRunCreateFlag] = useState();
    const [isLoadingInstances, setIsLoadingInstances] = useState(false);

    const ByoProfileChange = (e) => {
        setSelectByoProfiles(e.target.value);
    }

    const byoBtnClick = () => {
        setByoOpen(true);
        setShowByoSidepanel(true);
    };

    const showByoInfo = async () => {
        setByoOpen(true);
        setShowByoSidepanel(false);
    };
    function showNotificationStatus(statusKind, status) {
        if (statusKind !== undefined) {
            setShowAppStatus(statusKind);
        }
        if (status !== undefined) {
            setShowNotification(status);
        }
        if ((statusKind !== undefined && statusKind === "error")) {
            setShowToastContainer(true);
        }
    };
    const resetShowNotification = () => {
        setShowNotification(false);
    };

    const getByoInstance = async () => {
        setIsLoadingInstances(true);
        try {
            const response = await getByo();
            const byoInstances = response.instances;
            if (byoInstances.length === 0) {
                setShowByoButtons(false);
            } else {
                setShowByoButtons(true);
            }
            setByoInstanceDetails(byoInstances);
            setWholeByoInstances(response);
            setByoFlagStatus(response.createFlag)
            props.showPollFlagStatus(response.byoPollingFlag)
            setByoDeleteFlagStatus(response.deleteFlag);
            setIsLoadingInstances(false);
        } catch (error) {
            console.log(error);
            setIsLoadingInstances(false);
            errorNotification(error, t('serverError'), "byoGetInstanceFailed", props.showToast);
        }
    };

    const handleUserDataChange = async (e) => {
        setFileContent(e.target.value);
    }

    const validateShellScript = (text) => {
        return text.trim().startsWith('#!/bin/bash');
    };

    const byoCreateBtnClick = async (e) => {
        e.preventDefault();
        const isShellScript = validateShellScript(fileContent);
        let data;
        if (isShellScript === true) {
            setShowToastContainer(false);
            setScriptError(false);
            getByoInstance();
            setByoOpen(false);
            setIsByoCreateLoading(true);
            setFileContent("");
            setByoInstall(true);
            data = {
                applicationName: "byo",
                instanceProfileName: selectByoProfiles,
                vpcID: props.metaData.data.vpc.id,
                subnetID: props.metaData.data.network_interfaces[0].subnet.id,
                networkInterfaceName: props.metaData.data.network_interfaces[0].name,
                zone: props.metaData.data.zone.name,
                resourcegroup: props.metaData.data.resource_group.id,
                userData: fileContent
            };
            try {
                await createByoInstances(data);
                getByoInstance();
                setIsByoCreateLoading(false);
                setShowByoButtons(true);
                setByoInstall(false);
                props.showToast("success", "byoCreateSuccess", t('byo.createSuccessMsg'));
            } catch (error) {
                console.error(error);
                setByoInstall(false);
                setIsByoCreateLoading(false);
                errorNotification(error, t('serverError'), "byoCreateFailed", props.showToast, t('errorLogInfo'));
                getByoInstance();
            }
        } else {
            setScriptError(true);
            setFileContent("");
            showNotificationStatus("error", "scriptCreateError");
        }
    };

    let byoInstanceFailed = null;
    if (Array.isArray(byoInstanceDetails)) {
        byoInstanceFailed = byoInstanceDetails.filter(item => {
            return item.vsiStatus === 'failed';
        })
    }

    const byoRunClick = async () => {
        setRunByoOpen(true);
    }

    const byoRunBtnClick = async (e) => {
        const isShellScript = validateShellScript(fileContent);
        let data;
        getByoReports();
        if (isShellScript === true) {
            setShowToastContainer(false);
            setRunByoOpen(false);
            setScriptError(false);
            setFileContent("");
            e.preventDefault();
            setByoRunLoading(true);
            const instanceIps = byoInstanceDetails.map(ips => ips.ipAddress);
            data = {
                address: instanceIps,
                sshUsername: "ubuntu",
                port: "22",
                byoScript: fileContent
            };
            try {
                await runByoApi(data);
                setByoRunLoading(false);
                getByoReports();
                props.showToast("success", "byoRunSuccess", t('byo.benchmarkRunSuccessMsg'));
            } catch (error) {
                console.error(error);
                setByoRunLoading(false);
                getByoReports();
                errorNotification(error, t('serverError'), "byoRunFailed", props.showToast, t('errorLogInfo'));
            }
        } else {
            setScriptError(true);
            setFileContent("");
            showNotificationStatus("error", "scriptRunError");
        }
    }

    const handleByoDelSubmit = async (e) => {
        e.preventDefault();
        setInputValue('');
        setShowByoDelete(false);
        setIsByoDelLoading(true);
        const instanceIds = byoInstanceDetails.map(ids => ids.id);
        const body = {
            headers: {},
            instanceIDs: instanceIds
        }
        try {
            await deleteByoInstances(body);
            getByoInstance();
            setIsByoDelLoading(false);
            setShowByoButtons(false);
            props.showToast("success", "byoDeleteSuccess", t('byo.deleteSuccessMsg'));
        } catch (error) {
            console.error(error);
            setIsByoDelLoading(false);
            getByoInstance();
            errorNotification(error, t('serverError'), "byoDeleteFailed", props.showToast, t('errorLogInfo'));
        }
    }

    const byoDelModal = () => {
        setShowByoDelete(true);
    }

    function handleChange(e) {
        setInputValue(e.target.value);
    }

    const hideSidepanel = () => {
        setByoOpen(false);
        setRunByoOpen(false);
        setFileContent("");
        setScriptError(false);
    }

    const handleDelCloseModal = () => {
        setInputValue('');
        setShowByoDelete(false);
    }

    const handleDrop = async (e) => {
        setFileContent("");
        if (e.target.files === undefined) {
            const file = e.dataTransfer.files[0];
            const text = await file.text();
            if (text.startsWith('#!')) {
                setScriptError(false);
                setFileContent(text);
                setShowToastContainer(false);
            } else {
                setScriptError(true);
                showNotificationStatus("error", "scriptDargFileError");
            }
        } else {
            const file = e.target.files[0];
            const text = await file.text();
            if (text.startsWith('#!')) {
                setScriptError(false);
                setFileContent(text);
                setShowToastContainer(false);
            } else {
                setScriptError(true);
                showNotificationStatus("error", "scriptUploadFileError");
            }
        }
    }
    const onDrop = async (e) => {
        setFileContent("");
        if (e.target.files === undefined) {
            const file = e.dataTransfer.files[0];
            const text = await file.text();
            if (text.startsWith('#!')) {
                setScriptError(false);
                setFileContent(text);
                setShowToastContainer(false);
            } else {
                setScriptError(true);
                showNotificationStatus("error", "scriptDargFileError");
            }
        } else {
            const file = e.target.files[0];
            const text = await file.text();
            if (text.startsWith('#!')) {
                setScriptError(false);
                setFileContent(text);
                setShowToastContainer(false);
            } else {
                setScriptError(true);
                showNotificationStatus("error", "scriptUploadFileError");
            }
        }
    }
    const hanldeResetRun = async (e) => {
        e.preventDefault();
        setIsResetLoading(true);
        const instanceIds = byoInstanceDetails.map(ids => ids.id);
        const body = {
            headers: {},
            benchmarkName: "BYO application",
            instanceIds: instanceIds
        }
        try {
            await resetBenchmark(body);
            setIsResetLoading(false);
            getByoReports();
            props.showToast("success", "byoResetSuccess", t('byo.resetSuccessMsg'));
        } catch (error) {
            console.error(error);
            setIsResetLoading(false);
            errorNotification(error, t('serverError'), "byoResetFailed", props.showToast, t('errorLogInfo'));
            getByoReports();
        }
    }

    const getByoReports = async () => {
        const body = {
            count: 2,
            page: 1,
            search: ""
        }
        try {
            const response = await getByoLists(body);
            if (response.ListTest === null || response.ListTest === undefined) {
                setByoRunLists([]);
            } else {
                setByoRunLists(response.ListTest);
            }
            setByoRunCreateFlag(response.createFlag);
        } catch (error) {
            console.log(error);
            errorNotification(error, t('serverError'), "byoListFailed", props.showToast, t('errorLogInfo'));
        }
    };
    useEffect(() => {
        getByoInstance();
        getByoReports();
        let interval;
        if (byoFlagStatus === true) {
            interval = setInterval(() => {
                getByoInstance();
            }, 30000);
        } else if (byoRunCreateFlag === true) {
            interval = setInterval(() => {
                getByoReports();
            }, 30000);
        }
        return () => clearInterval(interval);
    }, [selectByoProfiles, showByoButtons, byoFlagStatus, byoDeleteFlagStatus, fileContent, byoRunCreateFlag]);

    return (
        <Column lg={5} md={8} sm={4} className="info-card">
            <h4 className="info-card__heading loading-header">{t('byo.title')} <InlineLoading className="instances-inline-loader" status={(isLoadingInstances === true && byoFlagStatus === false) && "active"}/></h4>
            <div className="instance-status-running instance-status-com">
                {(byoInstanceDetails && byoInstanceDetails.length === 0) && (byoInstall === false && byoFlagStatus === false) && <span>{t('notConfigured')}</span>}
                {Array.isArray(byoInstanceFailed) && byoInstanceFailed.length >= 1 && <span className="instance-run-failed"><ErrorFilled /> {t('failed')}</span>}
                {(byoInstanceDetails && byoInstanceDetails.length > 1) &&
                    Array.isArray(byoInstanceFailed) && byoInstanceFailed.length === 0 && (byoInstall === false && byoFlagStatus === false) && <span className="instance-run-success"><CheckmarkFilled /> {t('running')}</span>}
                {(byoInstall === true || byoFlagStatus === true) && <span className="install-progress">{t('installProcess')}</span>}
            </div>
            <p className="info-card__body">
                {t('byo.description')}
            </p>
            <div className="details-btn-cont">
                <Button onClick={showByoInfo} kind="ghost" className={(!showByoButtons || byoFlagStatus === true) ? "hide-details-btn" : "details-card-btn"}>
                    {t('viewdetails')}
                </Button>
                {(byoRunLoading === true || byoRunCreateFlag === true) && <InlineLoading status='active' description={t('byo.runBenchmark')} />}
                {(isByoDelLoading === true || byoDeleteFlagStatus === true) && <InlineLoading status='active' description={t('deletingInstances')} />}
                {(isResetLoading === true) && <InlineLoading status='active' description={t('resetBenchmarkProcess')} />}
            </div>
            {(isByoCreateLoading === true || byoFlagStatus === true) &&
                <div className="details-btn-cont">
                    <InlineLoading status='active' description={t('byo.createInstances')} />
                </div>
            }
            <div className="buttons-ui-cont">
                <ButtonSet>
                    <Button
                        kind="primary"
                        className={showByoButtons === true ? "hideByoBtn" : "showByoBtn"}
                        onClick={byoBtnClick}
                        disabled={isByoCreateLoading === true || showByoButtons === true || byoFlagStatus === true || byoDeleteFlagStatus === true || isLoadingInstances === true}>
                        {t('setup')}
                    </Button>
                    <Button
                        kind="primary"
                        className={showByoButtons === true ? "showByoBtn" : "hideByoBtn"}
                        onClick={byoRunClick}
                        disabled={isByoCreateLoading === true || byoRunLoading === true || isByoDelLoading === true || byoFlagStatus === true || byoRunCreateFlag === true || isLoadingInstances === true}>
                        {t('runApplication')}
                    </Button>
                    <Button
                        kind="secondary"
                        className={showByoButtons === true ? "showRunBtn" : "hideRunBtn"}
                        onClick={hanldeResetRun}
                        disabled={isByoCreateLoading === true || byoRunLoading === true || isResetLoading === true || byoFlagStatus === true || byoDeleteFlagStatus === true || byoRunLists.length === 0 || byoRunCreateFlag === true || isLoadingInstances === true}
                    >
                        {t('resetResults')}
                    </Button>
                    <Button
                        kind="danger"
                        onClick={byoDelModal}
                        id="byoDelete"
                        disabled={!showByoButtons || isByoDelLoading === true || byoFlagStatus === true || byoDeleteFlagStatus === true || byoRunCreateFlag === true || byoRunLoading === true || isLoadingInstances === true}>
                        {t('delete')}
                    </Button>
                </ButtonSet>
            </div>
            <SidePanel
                includeOverlay={true}
                size="lg"
                open={byoOpen}
                onRequestClose={hideSidepanel}
                title={(byoInstanceDetails.length > 0) ? t('byo.sidePanelTitle') : t('byo.setupTitle')}
                className={showByoSidepanel === true ? "carlocreatebtn" : "carlohidebtn"}
                actions={[
                    {
                        label: t('submit'),
                        onClick: byoCreateBtnClick,
                        kind: 'primary',
                        disabled: fileContent === ""
                    },
                    {
                        label: t('cancel'),
                        onClick: hideSidepanel,
                        kind: 'secondary',
                    },
                ]
                }
            >
                {showByoSidepanel === true && <Theme className="common-card-cont">
                    <Form>
                        <Select id={`select-1`} labelText="Select profile" value={selectByoProfiles} onChange={ByoProfileChange}>
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
                        <FormItem>
                            <h5>{t('byo.userData')}</h5>
                            <p className="user-description">{t('byo.userDataDescription')}</p>
                            <TextArea placeholder={t('byo.pasterYourData')} rows={4} value={fileContent} id="text-area-1" onChange={handleUserDataChange} className="textarea-script" labelText="" />
                            <p className="cds--file--label">
                                {t('byo.uploadFiles')}
                            </p>
                            <p className="cds--label-description">
                                {t('byo.supportedFile')}
                            </p>
                            <FileUploaderDropContainer
                                accept={['.sh']}
                                innerRef={{
                                    current: '[Circular]'
                                }}
                                labelText={t('byo.dragAndDrop')}
                                multiple={false}
                                name="Create"
                                onAddFiles={onDrop}
                                onChange={handleDrop}
                            />
                            <div className="cds--file-container cds--file-container--drop" />
                            <InlineToastNotification
                                ariaLabel={t('failed')}
                                className="script-error-notification"
                                key={showNotification}
                                kind={showAppStatus}
                                iconDescription={t('errorNotification')}
                                subtitle={t('scriptError')}
                                title={t('error')}
                                showToastContainer={showToastContainer}
                                resetShowNotification={resetShowNotification}
                                scriptError={scriptError} />
                        </FormItem>
                    </Form>
                </Theme>
                }
                {(byoInstanceDetails && byoInstanceDetails.length > 0) && <Theme className="common-card-cont">
                    <div className="side-instances-details">
                        <h4>{t('byo.instanceHeading')}</h4>
                        {byoInstanceDetails.map((mid) => (
                            <div className="cont-side-details" key={mid.id}>
                                <p><span>{t('vsiName')}:</span> {mid.vsiName}</p>
                                <p><span>{t('vsiType')}:</span> {mid.vsiProfile}</p>
                                <p><span>{t('ipAddress')}:</span> {mid.ipAddress}</p>
                                <p><span>{t('status')}:</span> {mid.vsiStatus}</p>
                            </div>
                        ))}
                    </div>
                </Theme>
                }
            </SidePanel>

            <SidePanel
                includeOverlay={true}
                size="lg"
                open={runByoOpen}
                onRequestClose={hideSidepanel}
                title={t('byo.title')}
                className=""
                actions={[
                    {
                        label: t('run'),
                        onClick: byoRunBtnClick,
                        kind: 'primary',
                        disabled: fileContent === ""
                    },
                    {
                        label: t('cancel'),
                        onClick: hideSidepanel,
                        kind: 'secondary',
                    },
                ]
                }
            >

                <Form>
                    <FormItem>
                        <h5>{t('byo.userData')}</h5>
                        <p className="user-description">{t('byo.userDataRunDescription')}</p>
                        <TextArea placeholder={t('byo.pasterYourData')} labelText="" rows={4} value={fileContent} onChange={handleUserDataChange} id="text-area-1" className="textarea-script" />
                        <p className="cds--file--label">
                            {t('byo.uploadFiles')}
                        </p>
                        <p className="cds--label-description">
                            {t('byo.supportedFile')}
                        </p>
                        <FileUploaderDropContainer
                            accept={['.sh']}
                            innerRef={{
                                current: '[Circular]'
                            }}
                            labelText={t('byo.dragAndDrop')}
                            multiple={false}
                            name="Runner"
                            onAddFiles={onDrop}
                            onChange={handleDrop}
                        />
                        <div className="cds--file-container cds--file-container--drop" />
                        <InlineToastNotification
                            ariaLabel={t('failed')}
                            className="script-error-notification"
                            key={showNotification}
                            kind={showAppStatus}
                            iconDescription={t('errorNotification')}
                            subtitle={t('scriptError')}
                            title={t('error')}
                            showToastContainer={showToastContainer}
                            resetShowNotification={resetShowNotification} />
                    </FormItem>
                </Form>
            </SidePanel>
            <Modal
                open={showByoDelete}
                size="xs"
                danger
                className="info-modal"
                modalHeading={t('deleteInstances')}
                primaryButtonText={t('instanceDelete')}
                secondaryButtonText={t('instanceCancel')}
                onRequestSubmit={handleByoDelSubmit}
                onRequestClose={handleDelCloseModal}
                primaryButtonDisabled={inputValue === 'Delete' ? false : true}
            >
                <div className="mod-content">
                    <p>{t('deleteDescription')}</p>
                    <FormLabel>{t('deleteConfirm')}</FormLabel>
                    <TextInput type="text" id="deleteByoId" labelText="" value={inputValue} onChange={handleChange} />
                </div>
            </Modal>
        </Column>
    );
};

export default ByoApplication;
