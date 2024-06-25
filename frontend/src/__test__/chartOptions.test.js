import React from "react";
import '@testing-library/jest-dom';
import getChartOptions from "../content/Dashboard/chartOptions";
import { mockedOptions } from "./utils";
const title = 'Test Title';
const axesTitle = 'Test Axes Title';
const isDark = true; 
describe('getChartOptions', () => {
    it('returns correct options with provided values', () => {
        expect(getChartOptions(title, axesTitle, isDark)).toEqual(mockedOptions);
    });
});
