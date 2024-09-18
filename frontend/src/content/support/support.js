import React from "react";
import { Grid, Column, Theme } from "@carbon/react";
import { useTranslation } from "react-i18next";

const Supportpage = () => {
  const { t } = useTranslation();
  return (
    <Grid className="benchmark-page">
      <Column lg={16} md={8} sm={4}>
        <h2 className="landing-page__heading common-heading">
          {t('programSupport')}
        </h2>
      </Column>
      <Column lg={16} md={8} sm={4} className="support-page__r1">
        <Theme className="support-theme">
          <h3 className="landing-page__subheading">{t('support.ibmExpHeading')}</h3>
          <p>
            {t('support.ibmExpText')}
          </p>
          <h5 className="">
            {t('support.ibmUserExplore')}
          </h5>
          <ul className="support-list">
            <li>{t('support.exploreListt1')}</li>
            <li>{t('support.exploreListt2')}</li>
            <li>{t('support.exploreListt3')}</li>
            <li>{t('support.exploreListt4')}</li>
          </ul>
          <p>{t('support.exploreContent')}</p>
          <h5>{t('support.supportHeading')}</h5>
          <p>
            {t('support.supportList1')} <a href="https://github.ibm.com/workload-eng-services/sandbox/issues" target="blank">https://github.ibm.com/workload-eng-services/sandbox/issues</a>. <span>{t('support.supportList2')}</span>
          </p>
          <p>{t('support.supportList3')}</p>
        </Theme>
      </Column>
    </Grid>
  );
};
export default Supportpage;
