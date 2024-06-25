import React, { useContext } from "react";
import MonteCarloReport from "./monteCarloReport";
import AiAmxReport from "./huggingReport";
import BYOReport from "./byoReport";
import PrestoReport from "./prestoReport";
import CommonUIContext from "../component/CommonUIContext";
import {
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  Grid,
  Column,
} from "@carbon/react";
import { useTranslation } from "react-i18next";

const RepoPage = () => {
  const { t } = useTranslation();
  const { setByoState } = useContext(CommonUIContext);
  function showPollFlagStatus(poolFlagStatus) {
    if (poolFlagStatus !== undefined || poolFlagStatus !== null) {
      setByoState(poolFlagStatus);
    }
  };
  return (
    <>
      <Grid className="repo-page">
        <Column lg={16} md={8} sm={4}>
          <h2 className="landing-page__heading common-heading">
            {t('performanceDashboard')}
          </h2>
        </Column>
        <Column lg={16} md={8} sm={4} className="landing-page__r2">
          <Tabs defaultSelectedIndex={0}>
            <TabList className="tabs-group" aria-label="Tab navigation">
              <Tab>{t('monte.title')}</Tab>
              <Tab>{t('hugging.title')}</Tab>
              <Tab>{t('byoApp')}</Tab>
              <Tab>{t('presto.title')}</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Grid className="tabs-group-content">
                  <Column lg={16} md={8} sm={4} className="tabs-sub-containers">
                    <h2 className="landing-page__subheading">
                      {t('vsiPerformResult')}
                    </h2>
                  </Column>
                  <MonteCarloReport />
                </Grid>
              </TabPanel>
              <TabPanel>
                <Grid className="tabs-group-content">
                  <Column lg={16} md={8} sm={4} className="tabs-sub-containers">
                    <h2 className="landing-page__subheading">
                      {t('vsiPerformResult')}
                    </h2>
                  </Column>
                  <AiAmxReport />
                </Grid>
              </TabPanel>
              <TabPanel>
                <Grid className="tabs-group-content">
                  <Column lg={16} md={8} sm={4} className="tabs-sub-containers">
                    <h2 className="landing-page__subheading">
                      {t('vsiPerformResult')}
                    </h2>
                  </Column>
                  <BYOReport showPollFlagStatus={showPollFlagStatus} />
                </Grid>
              </TabPanel>
              <TabPanel>
                <Grid className="tabs-group-content">
                  <Column lg={16} md={8} sm={4} className="tabs-sub-containers">
                    <h2 className="landing-page__subheading">
                      {t('vsiPerformResult')}
                    </h2>
                    <p className="tab-app-desc">
                      {t('normalizedDescription')}
                    </p>
                  </Column>
                  <PrestoReport />
                </Grid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Column>
      </Grid>
    </>
  );
};
export default RepoPage;
