import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Supportpage from '../content/support/support';
import '@testing-library/jest-dom/extend-expect';

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: key => key })
}));

describe('Supportpage Component', () => {

  it('renders without crashing', async() => {
    render(<Supportpage />);
    const heading = await screen.findByText('programSupport');
    expect(heading).toBeVisible();
  });

  it('displays translated text for header and subheading', () => {
    render(<Supportpage />);
    expect(screen.getByText('programSupport')).toBeInTheDocument();
    expect(screen.getByText('support.ibmExpHeading')).toBeInTheDocument();
  });

  it('renders correct number of list items', () => {
    render(<Supportpage />);
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBe(4);
  });

  it('displays correct content in list items', async() => {
    render(<Supportpage />);
    expect(await screen.getByText('support.exploreListt1')).toBeVisible();
    expect(await screen.getByText('support.exploreListt4')).toBeVisible();
  });

  it('displays valid support link', () => {
    render(<Supportpage />);
    const supportLinks = screen.getAllByRole('link', { name: /https:\/\/github.com\/IBM-Cloud\/sandbox-benchmark-for-vpc\/issues/ });
    supportLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', 'https://github.com/IBM-Cloud/sandbox-benchmark-for-vpc/issues');
    });
  });
});
