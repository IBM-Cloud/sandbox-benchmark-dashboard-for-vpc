import React from "react";
import { SimpleBarChart } from '@carbon/charts-react';
import { useTranslation } from "react-i18next";

const AiAmxCPUReport = (props) => {
  const { t } = useTranslation();
  const bx1min = parseFloat(props.bx2);
  const bx2min = parseFloat(props.bx3);

  const data = [
    {
      group: 'bx2d, Transformers Pipeline',
      key: 'bx2d ',
      value: bx1min
    },
    {
      group: 'bx3d, Optimum Pipeline',
      key: 'bx3d',
      value: bx2min
    }
  ];

  const Options = {
    title: t('hugging.chart2Title'),
    theme: props.isDarkTheme ? 'g90' : "white",
    axes: {
      left: {
        mapsTo: 'key',
        scaleType: 'labels'
      },
      bottom: {
        title: t('hugging.chart2SecTitle'),
        mapsTo: 'value'
      }
    },
    bars: {
      width: 30,
      maxWidth: 50,
    },
    color: {
      scale: {
        "bx2d, Transformers Pipeline": props.isDarkTheme ? `var(--cds-charts-2-5-2)` : `var(--cds-charts-2-2-1)`,
        "bx3d, Optimum Pipeline": props.isDarkTheme ? `var(--cds-charts-2-4-1)` : `var(--cds-charts-2-2-2)`,
      }
    },
    height: '400px'
  };

  return (
    <>
      <SimpleBarChart
        data={data}
        options={Options}
        id="cpuschart"
      ></ SimpleBarChart>
    </>
  );
};

export default AiAmxCPUReport;
