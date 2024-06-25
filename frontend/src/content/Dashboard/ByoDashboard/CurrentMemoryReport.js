import React from "react";
import { GroupedBarChart } from '@carbon/charts-react';
import { useTranslation } from "react-i18next";
import getChartOptions from "../chartOptions";

const CurrentMemoryReport = (props) => {
  const { t } = useTranslation();

  const getBx2Value = vsiuProfile => {
    const bxVal = props.byoReportLists.find(f => f.vsiuProfile === vsiuProfile);
    return bxVal ? bxVal.currentMemoryUtilization : null;
  };
  const bx2Values = (getBx2Value('bx2d-8x32') || getBx2Value('bx2d-16x64'));

  const getBx3Value = vsiuProfile => {
    const bxVal = props.byoReportLists.find(f => f.vsiuProfile === vsiuProfile);
    return bxVal ? bxVal.currentMemoryUtilization : null;
  };
  const bx3Values = (getBx3Value('bx3d-8x40') || getBx3Value('bx3d-16x80'));

  const finalBx2 = parseFloat(bx2Values);
  const finalBx3 = parseFloat(bx3Values);

  const getMaxBx2Value = vsiuProfile => {
    const bxVal = props.byoReportLists.find(f => f.vsiuProfile === vsiuProfile);
    return bxVal ? bxVal.maxMemoryUtilization : null;
  };
  const maxBx2Values = (getMaxBx2Value('bx2d-8x32') || getMaxBx2Value('bx2d-16x64'));

  const getMaxBx3Value = vsiuProfile => {
    const bxVal = props.byoReportLists.find(f => f.vsiuProfile === vsiuProfile);
    return bxVal ? bxVal.maxMemoryUtilization : null;
  };
  const maxBx3Values = (getMaxBx3Value('bx3d-8x40') || getMaxBx3Value('bx3d-16x80'));

  const finalMaxBx2 = parseFloat(maxBx2Values);
  const finalMaxBx3 = parseFloat(maxBx3Values);

  const data = [
    {
      title: t('current'),
      group: 'bx2d(Current)',
      key: 'bx2d(Current)',
      value: finalBx2
    },
    {
      title: t('current'),
      group: 'bx3d(Current)',
      key: 'bx3d(Current)',
      value: finalBx3
    },
    {
      title: t('max'),
      group: 'bx2d(Max)',
      key: 'bx2d(Max)',
      value: finalMaxBx2
    },
    {
      title: t('max'),
      group: 'bx3d(Max)',
      key: 'bx3d(Max)',
      value: finalMaxBx3
    }
  ];

  let primaryTitle = t('byo.currentMemoryPrimaryTitle');
  let axesTitle= t('byo.currentMemoryAxesTitle');

  const Options = getChartOptions(primaryTitle, axesTitle, props.isDarkTheme);
  return (
    <GroupedBarChart
      data={data}
      options={Options}
      id="cpuschart"
    ></ GroupedBarChart>
  );
};

export default CurrentMemoryReport;
