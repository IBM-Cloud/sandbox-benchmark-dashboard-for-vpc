import React, { useState, useEffect, useMemo } from "react";
import AiAmxComparedReport from "./HuggingDashboard/comparisonReport";
import AiAmxCPUReport from "./HuggingDashboard/CpuReport";
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
import { getHuggingRunLists } from "../api/api";
import useThemeDetector from "../../components/theme";
import { useTranslation } from "react-i18next";
import { useNotification } from "../component/NotificationManager";

const AiAmxReport = () => {
  const { t } = useTranslation();
  const [aiAmxReports, setAiAmxReports] = useState({});
  const [huggingListsValues, setHuggingListsValues] = useState([]);
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

  const getAiAmxReports = async () => {
    setLoading(true);
    const body = {
      count: 2,
      page: 1,
      search: ""
    }
    try {
      const response = await getHuggingRunLists(body);
      setAiAmxReports(response);
      setHuggingListsValues(response.ListTest);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      showNotificationStatus("error", "getRunLogsFailed", t('failedretrieveHuggingLogs'));
    }
  };


  const findByProfile = (listTest, vsiProfile) =>
    listTest && listTest.find(f => f.vsiProfile === vsiProfile);

  const bx2Values = useMemo(() => {
    const list = aiAmxReports.ListTest;
    if (!list) return null;
    const entry = findByProfile(list, 'bx2d-8x32') || findByProfile(list, 'bx2d-16x64');
    return entry ? entry.bertModelType.shortSentenceArray : null;
  }, [aiAmxReports]);

  const bx3Values = useMemo(() => {
    const list = aiAmxReports.ListTest;
    if (!list) return null;
    const entry = findByProfile(list, 'bx3d-8x40') || findByProfile(list, 'bx3d-16x80');
    return entry ? entry.bertModelType.shortSentenceArray : null;
  }, [aiAmxReports]);

  const bx2RValues = useMemo(() => {
    const list = aiAmxReports.ListTest;
    if (!list) return null;
    const entry = findByProfile(list, 'bx2d-8x32') || findByProfile(list, 'bx2d-16x64');
    return entry ? entry.robertaModelType.shortSentenceArray : null;
  }, [aiAmxReports]);

  const bx3RValues = useMemo(() => {
    const list = aiAmxReports.ListTest;
    if (!list) return null;
    const entry = findByProfile(list, 'bx3d-8x40') || findByProfile(list, 'bx3d-16x80');
    return entry ? entry.robertaModelType.shortSentenceArray : null;
  }, [aiAmxReports]);

  const headers = [
    t('vsiName'),
    t('vsiProfile'),
    t('bertType'),
    t('robertoType'),
    t('cpuUtilization'),
    t('memoryUtilization'),
  ];
  const isDarkTheme = useThemeDetector();
  useEffect(() => {
    getAiAmxReports();
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
            {(huggingListsValues && huggingListsValues.length === 0) && <TableRow><TableCell colSpan={6}>{t('noRunRecords')}</TableCell></TableRow>}
            {aiAmxReports && aiAmxReports.ListTest !== undefined && aiAmxReports.ListTest.map((ail) => (
              <TableRow key={ail.ID}>
                <TableCell>{ail.vsiName}</TableCell>
                <TableCell>{ail.vsiProfile}</TableCell>
                <TableCell>{ail.bertModelType.shortSentenceArray}</TableCell>
                <TableCell>{ail.robertaModelType.shortSentenceArray}</TableCell>
                <TableCell>{ail.cpuUtilization}</TableCell>
                <TableCell>{ail.memoryUtilization}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Column>
      {(huggingListsValues !== null && huggingListsValues !== undefined && huggingListsValues.length > 0) &&
        <Column lg={8} md={8} sm={4} className="charts-common-cont">
          <div className="theme-padding-size">
            <AiAmxComparedReport isDarkTheme={isDarkTheme} bx2={bx2Values} bx3={bx3Values} />
          </div>
        </Column>
      }
      {(huggingListsValues !== null && huggingListsValues !== undefined && huggingListsValues.length > 0) &&
        <Column lg={8} md={8} sm={4} className="charts-common-cont">
          <div className="theme-padding-size">
            <AiAmxCPUReport isDarkTheme={isDarkTheme} bx2={bx2RValues} bx3={bx3RValues} />
          </div>
        </Column>
      }
      {loading === true && <Loading className="page-loader" withOverlay={true} description={t('loading')} />}
    </>
  );
};

export default AiAmxReport;
