import React, { useState, useEffect } from "react";
import PrestoChart from "./PrestoDashboard/prestoChart";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Column,
  Loading,
} from "@carbon/react";
import { getPrestoRunLists } from "../api/api";
import useThemeDetector from "../../components/theme";
import { useTranslation } from "react-i18next";
import Notification from "../component/toast";

const PrestoReport = () => {
  const { t } = useTranslation();
  const [prestoReports, setPrestoReports] = useState({});
  const [prestoListsValues, setPrestoListsValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAppStatus, setShowAppStatus] = useState("");
  const [showNotification, setShowNotification] = useState("");
  const [showNotificationMsg, setShowNotificationMsg] = useState({});
  const [showToastContainer, setShowToastContainer] = useState(false);

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

  const getPrestoReports = async () => {
    setLoading(true);
    const body = {
      count: 2,
      page: 1
    }
    try {
      const response = await getPrestoRunLists(body);
      setPrestoReports(response);
      setPrestoListsValues(response.ListTest);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      showNotificationStatus("error", "getPrestoRunLogsFailed", t('failedRetrievePrestoLogs'));
    }
  };
  const getBx2Value = vsiProfile => {
    const bxVal = prestoReports && prestoReports.ListTest !== undefined && prestoReports.ListTest.find(f => f.vsiProfile === vsiProfile);
    return bxVal ? bxVal.performanceMetric1 : null;
  };
  const bx2Values = (getBx2Value('bx2d-8x32') || getBx2Value('bx2d-16x64'));

  const getBx3Value = vsiProfile => {
    const bxVal = prestoReports && prestoReports.ListTest !== undefined && prestoReports.ListTest.find(f => f.vsiProfile === vsiProfile);
    return bxVal ? bxVal.performanceMetric1 : null;
  };
  const bx3Values = (getBx3Value('bx3d-8x40') || getBx3Value('bx3d-16x80'));

  const parseBx2Values = parseFloat(bx2Values);
  const parseBx3Values = parseFloat(bx3Values);

  let finalbx2val = (parseBx2Values / parseBx2Values);
  let finalbx3val = (parseBx2Values / parseBx3Values);

  let opsbx2val = bx2Values;
  let opsbx3val = bx3Values;

  const headers = [
    t('vsiName'),
    t('vsiProfile'),
    t('presto.executionTime'),
    t('cpuUtilization'),
    t('memoryUtilization'),
  ];

  const isDarkTheme = useThemeDetector();
  useEffect(() => {
    getPrestoReports();
  }, [showToastContainer]);

  return (
    <>
      <Notification key={showNotification} role="alert" timeout="" kind={showAppStatus} subtitle={showNotificationMsg} title={t('failed')} showToastContainer={showToastContainer} resetShowNotification={resetShowNotification} />
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
            {(prestoListsValues && prestoListsValues.length === 0) && <TableRow><TableCell colSpan={5}>{t('noRunRecords')}</TableCell></TableRow>}
            {prestoReports && prestoListsValues.length > 0 && prestoListsValues.map((mrl) => (
              <TableRow key={mrl.ID}>
                <TableCell>{mrl.vsiName}</TableCell>
                <TableCell>{mrl.vsiProfile}</TableCell>
                <TableCell>{mrl.performanceMetric1}</TableCell>
                <TableCell>{mrl.cpuUtilization}</TableCell>
                <TableCell>{mrl.memoryUtilization}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Column>
      {(prestoListsValues && prestoListsValues.length > 0) &&
        <>
          <Column lg={8} md={8} sm={4} className="charts-common-cont">
            <div className="theme-padding-size">
              <PrestoChart isDarkTheme={isDarkTheme} bx2={finalbx2val} bx3={finalbx3val} chartType="compared" />
            </div>
          </Column>
          <Column lg={8} md={8} sm={4} className="charts-common-cont">
            <div className="theme-padding-size">
              <PrestoChart isDarkTheme={isDarkTheme} bx2={opsbx2val} bx3={opsbx3val} chartType="cpu" />
            </div>
          </Column>
        </>
      }
      {loading === true && <Loading className="test" withOverlay={true} description={t('loading')} />}
    </>
  );
};

export default PrestoReport;