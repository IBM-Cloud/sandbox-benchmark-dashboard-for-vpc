import React, { useState, useEffect } from "react";
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbarSearch,
  TableToolbarContent,
  TableToolbar,
  Button,
  Modal,
  RadioButton,
  RadioButtonGroup,
  Pagination,
  Loading
} from "@carbon/react";
import { Download, Renew } from "@carbon/react/icons";
import { getInstanceStatus, getBenchmarkRunLogs, downloadLogsApi } from "../api/api";
import Notification from "../component/toast";
import { useTranslation } from "react-i18next";

const ConfigurationDetails = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [subLogsList, setSubLogsList] = useState([]);
  const [logsDet, setLogsDet] = useState({ totalEntry: 0 });
  const [logsText, setLogsText] = useState({});
  const [pageValue, setPageValue] = useState(1);
  const [pageSizeValue, setPageSizeValue] = useState(10);
  const [searchTexts, setSearchTexts] = useState("");
  const [showAppStatus, setShowAppStatus] = useState("");
  const [showNotification, setShowNotification] = useState("");
  const [showNotificationMsg, setShowNotificationMsg] = useState({});
  const [showToastContainer, setShowToastContainer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const headers = [
    {
      header: t('name'),
      key: "name",
    },
    {
      header: t('vsiName'),
      key: "vsiName",
    },
    {
      header: t('benchmark'),
      key: "benchMark",
    },
    {
      header: t('category'),
      key: "category",
    },
    {
      header: t('startDate'),
      key: "date",
    },
    {
      header: t('status'),
      key: "status",
    },
    {
      header: "",
      key: "attachments",
    },
  ];

  const refreshPage = async () => {
    setSearchTexts("");
    benchmarkLogsList();
    try {
      await getInstanceStatus();
    } catch (error) {
      console.log(error);
      showNotificationStatus("error", "getStatusFailed", t('failedRetrieveStatus'))
    }
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
    if ((statusKind !== undefined && statusKind === "error") || (statusKind !== undefined && statusKind === "success")) {
      setShowToastContainer(true);
    }
  };
  const resetShowNotification = () => {
    setShowNotification(false);
  };

  const benchmarkLogsList = async (pageNum, searchtxt) => {
    setIsLoading(true);
    const _pageNum = pageNum === undefined ? 1 : pageNum.page;
    const _pageSizeNum = pageNum === undefined ? 10 : pageNum.pageSize;
    const _search = searchtxt === undefined ? "" : searchtxt;
    const data = {
      count: _pageSizeNum,
      page: _pageNum,
      search: _search,
      logsFilter: {
        benchmark: "",
        category: "",
        vsiStatus: "",
        startDate: "",
        startDateRange: {
          from: "",
          to: ""
        }
      },
      sort: {
        orderBy: "id",
        order: 1
      }
    };
    try {
      const response = await getBenchmarkRunLogs(data);
      setLogsDet(response);
      if (response.data !== null) {
        setSubLogsList(response.data);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      showNotificationStatus("error", "getAllLogsFailed", t('failedRetrieveLogs'))
    }
  };

  function handleLogsPagination(e) {
    setSearchTexts("");
    setPageValue(e.page);
    setPageSizeValue(e.pageSize);
    benchmarkLogsList(e);
  }

  const onInputChange = async (e, pageNum) => {
    const text = e.target.value;
    setSearchTexts(e.target.value);
    await benchmarkLogsList(pageNum, text);
  }

  const handleDownloadOpen = async logs => {
    try {
      const response = await downloadLogsApi(logs);
      setLogsText(response.FileContent);
      setOpen(true);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDownloadClose = () => {
    setOpen(false);
  }
  const handleDownloadFile = () => {
    try {
      const logsTextString = typeof logsText === 'string' ? logsText : JSON.stringify(logsText);
      const blob = new Blob([logsTextString], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', 'logs.txt');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (error) {
      console.error(error);
      setOpen(false);
      showNotificationStatus("error", "downloadFailed", t('downloadFailed'));
    }
  }

  useEffect(() => {
    benchmarkLogsList();
  }, [showToastContainer]);

  return (
    <>
      <Notification key={showNotification} role="alert" timeout="" kind={showAppStatus} subtitle={showNotificationMsg} title={t('failed')} showToastContainer={showToastContainer} resetShowNotification={resetShowNotification} />
      <DataTable rows={subLogsList} headers={headers} isSortable>
        {({
          rows,
          headers,
          getTableProps,
          getHeaderProps,
          getRowProps,
          getTableContainerProps,
          getToolbarProps
        }) => (
          <TableContainer {...getTableContainerProps()}>
            <TableToolbar {...getToolbarProps}>
              <TableToolbarContent>
                <TableToolbarSearch
                  expanded
                  placeholder={t('find')}
                  onChange={onInputChange}
                  value={searchTexts}
                />
                <Button
                  kind="ghost"
                  hasIconOnly
                  renderIcon={Renew}
                  iconDescription={t('renew')}
                  onClick={refreshPage}
                ></Button>
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    header.key === "attachments" ? (
                      <TableHeader isSortHeader={false} isSortable={false}></TableHeader>
                    ) : (
                      <TableHeader {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    )
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows && (rows === null || rows === undefined || rows.length === 0) ? (<TableRow><TableCell colSpan={7}>{t('noRecords')}</TableCell></TableRow>) :
                  ((rows && rows !== undefined && rows !== null) && rows.map((row, index) => (
                    <TableRow key={index} {...getRowProps({ row })}>
                      {row.cells.map((cell) => (
                        cell.info.header === "attachments" ? (
                          <TableCell key={cell.id}>
                            <Button
                              kind="ghost"
                              hasIconOnly
                              renderIcon={Download}
                              iconDescription={t('download')}
                              onClick={() => handleDownloadOpen(cell.value)}
                              id={row.Attachments}
                            ></Button>
                          </TableCell>
                        ) : (
                          <TableCell key={cell.id}>{cell.value}</TableCell>)
                      ))}
                    </TableRow>
                  )))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
      <Modal
        open={open}
        onRequestClose={handleDownloadClose}
        modalHeading={t('downloadReport')}
        primaryButtonText={t('download')}
        secondaryButtonText={t('cancel')}
        onRequestSubmit={handleDownloadFile}
        size="xs"
        className="download-modal"
      >
        <h6>{t('downloadLog')}</h6>
        <div>
          <RadioButtonGroup
            legendText={t('chooseFormat')}
            name="radio-button-group"
            defaultSelected="txt"
          >
            <RadioButton
              labelText={t('textFile')}
              value="txt"
              id="radio-1"
            />
          </RadioButtonGroup>
        </div>
      </Modal>
      <Pagination
        backwardText={t('prevPage')}
        forwardText={t('nextPage')}
        itemsPerPageText={t('itemsPerPage')}
        onChange={handleLogsPagination}
        page={pageValue}
        pageSize={pageSizeValue}
        pageSizes={[10, 20, 30, 40, 50]}
        size="md"
        totalItems={logsDet ? logsDet.totalEntry : 0}
      />
      {isLoading === true && <Loading className="page-loader" withOverlay={true} />}
    </>
  );
};

export default ConfigurationDetails;
