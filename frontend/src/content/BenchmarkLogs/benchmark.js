import React from "react";
import BenchmarkTable from "./BenchmarkTable";
import {
  Grid,
  Column,
} from "@carbon/react";
import { useTranslation } from "react-i18next";

const BenchmarkPage = () => {
  const { t } = useTranslation();
    return (
      <Grid className="benchmark-page">
      <Column lg={16} md={8} sm={4}>
      <h2 className="landing-page__heading common-heading">{t('benchmarkLogs')}</h2>
      </Column>
        <Column lg={16} md={8} sm={4} className="benchmark-page__r1">
          <BenchmarkTable />
        </Column>
      </Grid>
    );
  }
export default BenchmarkPage;
