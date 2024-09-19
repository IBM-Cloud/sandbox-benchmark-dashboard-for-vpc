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
import { useTranslation } from "react-i18next";
import { useNotification } from "../component/NotificationManager";

const BenchmarkTable = () => {
  const { t } = useTranslation();
  const [instanceDetails, setInstanceDetails] = useState([]);
  const [instanceStatus, setInstanceStatus] = useState({});
  const [isLoading, setisLoading] = useState(false);

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
  }, []);
  return (
    <>
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

