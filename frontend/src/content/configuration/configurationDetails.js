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
  TableToolbarContent,
  TableToolbar,
  Button,
  Loading,
} from "@carbon/react";
import { Renew } from "@carbon/icons-react";
import { getAllInstances } from "../api/api";
import Notification from "../component/toast";
import { useTranslation } from "react-i18next";

const BenchmarkTable = () => {
  const { t } = useTranslation();
  const [instanceDetails, setInstanceDetails] = useState([]);
  const [instanceStatus, setInstanceStatus] = useState({});
  const [isLoading, setisLoading] = useState(false);
  const [showAppStatus, setShowAppStatus] = useState("");
  const [showNotification, setShowNotification] = useState("");
  const [showNotificationMsg, setShowNotificationMsg] = useState({});
  const [showToastContainer, setShowToastContainer] = useState(false);

  const headers = [
    {
      header: t('vsiName'),
      key: "vsiName",
    },
    {
      header: t('applicationName'),
      key: "appName",
    },
    {
      header: t('profile'),
      key: "vsiProfile",
    },
    {
      header: t('reservedIp'),
      key: "ipAddress",
    },
    {
      header: t('status'),
      key: "vsiStatus",
    },
  ];

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

  const getAllInstance = async () => {
    setisLoading(true);
    try {
      const response = await getAllInstances();
      setInstanceStatus(response);
      if (response.instances === null) {
        setInstanceDetails([]);
      } else {
        setInstanceDetails(response.instances);
      }
      setisLoading(false);
    } catch (error) {
      console.log(error);
      showNotificationStatus("error", "allInstancesFailed", t('failedRetrieveInstances'))
      setisLoading(false);
    }
  };

  function refreshPage() {
    getAllInstance();
  }

  useEffect(() => {
    getAllInstance();
  }, [showToastContainer]);
  return (
    <>
      <Notification key={showNotification} role="alert" timeout="" kind={showAppStatus} subtitle={showNotificationMsg} title={t('failed')} showToastContainer={showToastContainer} resetShowNotification={resetShowNotification} />
      <DataTable rows={instanceDetails} headers={headers} isSortable>
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
                <Button
                  kind="ghost"
                  hasIconOnly
                  renderIcon={Renew}
                  iconDescription="Renew"
                  onClick={refreshPage}
                ></Button>
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableHeader {...getHeaderProps({ header })}>
                      {header.header}
                    </TableHeader>
                  ))}
                  <TableHeader></TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {instanceDetails && instanceDetails.length === 0 && <TableRow><TableCell colSpan={5}>{t('noRecords')}</TableCell></TableRow>}
                {instanceStatus && rows !== null && rows !== undefined && rows.map((row, index) => (
                  <TableRow key={index}  {...getRowProps({ row })}>
                    {row.cells.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell.value}</TableCell>
                    ))}
                  </TableRow>
                ))}

              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
      {isLoading === true && <Loading className="page-loader" withOverlay={true} />}
    </>
  );
};

export default BenchmarkTable;

