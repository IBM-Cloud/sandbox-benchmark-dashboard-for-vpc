import React, { useState, useEffect } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Column,
} from "@carbon/react";
import { getByoLists, getByo } from "../api/api";
import { useTranslation } from "react-i18next";
import CurrentCpuReport from "./ByoDashboard/CurrentCpuReport";
import CurrentMemoryReport from "./ByoDashboard/CurrentMemoryReport";
import useThemeDetector from "../../components/theme";
import errorNotification from "../component/errorNotification";
import { useNotification } from "../component/NotificationManager";

const BYOReport = (props) => {
  const { t } = useTranslation();
  const [byoReports, setByoReports] = useState({});
  const [byoReportLists, setByoReportLists] = useState({});
  const [byoInstanceDetails, setByoInstanceDetails] = useState([]);

  const addToast = useNotification();

  function showNotificationStatus(statusKind, status, statusText) {
    if (statusKind && (statusKind === "error" || statusKind === "success")) {
      addToast({
        id: status,
        ariaLabel: statusKind,
        kind: statusKind,
        role: "alert",
        subtitle: statusText,
        timeout: "",
        title: (statusKind === "error" ? (t('failed')) : (t('success'))),
      });
    }
  };

  const getByoInstance = async () => {
    try {
      const response = await getByo();
      setByoInstanceDetails(response.instances);
      props.showPollFlagStatus(response.byoPollingFlag);
    } catch (error) {
      console.log(error);
      errorNotification(error, t('serverError'), "byoGetInstanceFailed", showNotificationStatus);
    }
  };

  const getByoReports = async () => {
    const body = {
      count: 4,
      page: 1,
      search: ""
    }
    try {
      const response = await getByoLists(body);
      setByoReports(response);
      if (response.ListTest === null || response.ListTest === undefined) {
        setByoReportLists([]);
      } else {
        setByoReportLists(response.ListTest);
      }
    } catch (error) {
      console.log(error);
      errorNotification(error, t('serverError'), "byoReportFailed", showNotificationStatus);
    }
  };

  const headers = [
    t('vsiName'),
    t('vsiProfile'),
    t('averageCpuUtilization'),
    t('averageMemoryUtilization'),
    t('averageNetworkUtilization'),
    t('averageIoUtilization')
  ];
  const isDarkTheme = useThemeDetector();
  useEffect(() => {
    getByoInstance();
    let interval;
    if (byoInstanceDetails !== null && byoInstanceDetails !== undefined) {
      getByoReports();
      interval = setInterval(getByoReports, 10000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [byoInstanceDetails]);

  return (
    <>
      <Column lg={16} md={8} sm={4} className="landing-page__tab-content">
        <Table>
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableHeader id={header.key} key={header}>
                  {header}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(byoReportLists && byoReportLists.length === 0) && <TableRow><TableCell colSpan={6}>{t('noRunRecords')}</TableCell></TableRow>}
            {byoReports && byoReports.ListTest !== undefined && byoReports.ListTest.map((mrl) => (
              <TableRow key={mrl.ID}>
                <TableCell>{mrl.vsiName}</TableCell>
                <TableCell>{mrl.vsiuProfile}</TableCell>
                <TableCell>{mrl.averageCpuUtilization}</TableCell>
                <TableCell>{mrl.averageMemoryUtilization}</TableCell>
                <TableCell>{mrl.currentNetworkRxUtilization} | {mrl.currentNetworkTxUtilization}</TableCell>
                <TableCell>{mrl.averageIoUtilization}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Column>
      {(byoReportLists !== null && byoReportLists.length > 0 && byoReportLists !== undefined) &&
        <>
          <Column lg={8} md={8} sm={4} className="charts-common-cont">
            <div className="theme-padding-size">
              <CurrentCpuReport isDarkTheme={isDarkTheme} byoReportLists={byoReportLists} />
            </div>
          </Column>
          <Column lg={8} md={8} sm={4} className="charts-common-cont">
            <div className="theme-padding-size">
              <CurrentMemoryReport isDarkTheme={isDarkTheme} byoReportLists={byoReportLists} />
            </div>
          </Column>
        </>
      }
    </>
  );
};

export default BYOReport;
