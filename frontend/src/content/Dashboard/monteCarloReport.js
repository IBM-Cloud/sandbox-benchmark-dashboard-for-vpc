import React, { useState, useEffect } from "react";
import MontoCPUReport from "./MonteDashboard/CpuReport";
import MontoComparedReport from "./MonteDashboard/comparisonReport";
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
import { getMonteCarloRunLists } from "../api/api";
import useThemeDetector from "../../components/theme";
import { useTranslation } from "react-i18next";
import { useNotification } from "../component/NotificationManager";

const MonteCarloReport = () => {
  const { t } = useTranslation();
  const [monteReports, setMonteReports] = useState({});
  const [monteListsValues, setMonteListsValues] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const getMonteCarloReports = async () => {
    setLoading(true);
    const body = {
      count: 2,
      page: 1,
      search: ""
    }
    try {
      const response = await getMonteCarloRunLists(body);
      setMonteReports(response);
      setMonteListsValues(response.ListTest);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      showNotificationStatus("error", "getMonteRunLogsFailed", t('failedRetrieveMonteLogs'));
    }
  };
  const getBx2Value = vsiProfile => {
    const bxVal = monteReports && monteReports.ListTest !== undefined && monteReports.ListTest.find(f => f.vsiProfile === vsiProfile);
    return bxVal ? bxVal.performanceMetric1 : null;
  };
  const bx2Values = (getBx2Value('bx2d-8x32') || getBx2Value('bx2d-16x64'));

  const getBx3Value = vsiProfile => {
    const bxVal = monteReports && monteReports.ListTest !== undefined && monteReports.ListTest.find(f => f.vsiProfile === vsiProfile);
    return bxVal ? bxVal.performanceMetric1 : null;
  };
  const bx3Values = (getBx3Value('bx3d-8x40') || getBx3Value('bx3d-16x80'));

  let finalbx2val = (bx2Values / bx2Values);
  let finalbx3val = (bx3Values / bx2Values);

  let opsbx2val = bx2Values;
  let opsbx3val = bx3Values;

  const headers = [
    t('vsiName'),
    t('vsiProfile'),
    t('opsPerSec'),
    t('cpuUtilization'),
    t('memoryUtilization'),
  ];

  const isDarkTheme = useThemeDetector();
  useEffect(() => {
    getMonteCarloReports();
  }, []);

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
            {(monteListsValues && monteListsValues.length === 0) && <TableRow><TableCell colSpan={5}>{t('noRunRecords')}</TableCell></TableRow>}
            {monteReports && monteReports.ListTest !== undefined && monteReports.ListTest.map((mrl) => (
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
      {(monteListsValues !== null && monteListsValues.length > 0 && monteListsValues !== undefined) &&
        <Column lg={8} md={8} sm={4} className="charts-common-cont">
          <div className="theme-padding-size">
            <MontoComparedReport isDarkTheme={isDarkTheme} bx2={finalbx2val} bx3={finalbx3val} />
          </div>
        </Column>
      }
      {(monteListsValues !== null && monteListsValues.length > 0 && monteListsValues !== undefined) &&
        <Column lg={8} md={8} sm={4} className="charts-common-cont">
          <div className="theme-padding-size">
            <MontoCPUReport isDarkTheme={isDarkTheme} bx2={opsbx2val} bx3={opsbx3val} />
          </div>
        </Column>
      }
      {loading === true && <Loading className="page-loader" withOverlay={true} description={t('loading')} />}
    </>
  );
};

export default MonteCarloReport;
