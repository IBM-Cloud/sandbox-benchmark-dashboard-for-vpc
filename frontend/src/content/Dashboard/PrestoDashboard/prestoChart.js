import React from "react";
import { SimpleBarChart } from '@carbon/charts-react';
import { useTranslation } from "react-i18next";

const PrestoChart = (props) => {
  const { t } = useTranslation();
  const bx2Value = parseFloat(props.bx2);
  const bx3Value = parseFloat(props.bx3);

  const data = [
    {
      group: 'bx2d',
      key: 'bx2d',
      value: bx2Value
    },
    {
      group: 'bx3d',
      key: 'bx3d',
      value: bx3Value
    }
  ];

  const Options = {
    title: props.chartType === "compared" ? t('presto.chart1Title') : t('presto.chart2Title'),
    theme: props.isDarkTheme ? 'g90' : 'white',
    axes: {
      left: {
        title: props.chartType === "compared" ? t('presto.chart1SecTitle') : t('presto.chart2SecTitle'),
        mapsTo: 'value'
      },
      bottom: {
        mapsTo: 'key',
        scaleType: 'labels',
      }
    },
    bars: {
      width: 30,
      maxWidth: 50,
    },
    color: {
      scale: {
        "bx2d": props.isDarkTheme ? `var(--cds-charts-2-5-2)` : `var(--cds-charts-2-2-1)`,
        "bx3d": props.isDarkTheme ? `var(--cds-charts-2-4-1)` : `var(--cds-charts-2-2-2)`,
      }
    },
    height: '400px'
  };

  return (
    <SimpleBarChart
      data={data}
      options={Options}
      id={props.chartType === "compared" ? "compchart" : "cpuschart"}
    />
  );
};

export default PrestoChart;
