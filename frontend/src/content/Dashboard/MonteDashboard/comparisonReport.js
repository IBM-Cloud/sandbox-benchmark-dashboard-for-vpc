import React from "react";
import { SimpleBarChart } from '@carbon/charts-react';
import { useTranslation } from "react-i18next";
const MontoComparedReport = (props) => {
  const { t } = useTranslation();
  const data = [
    {
      group: 'bx2d',
      key: 'bx2d',
      value: props.bx2
    },
    {
      group: 'bx3d',
      key: 'bx3d',
      value: props.bx3
    }
  ];

  const Options = {
    title: t('monte.chart1Title'),
    theme: props.isDarkTheme ? 'g90' : "white",
    axes: {
      left: {
        title: t('monte.chart1SecTitle'),
        mapsTo: 'value'
      },
      bottom: {
        mapsTo: 'key',
        scaleType: 'labels'
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
    <>
      <SimpleBarChart
        data={data}
        options={Options}
        id="compchart"
      ></ SimpleBarChart>
    </>
  );
};

export default MontoComparedReport;
