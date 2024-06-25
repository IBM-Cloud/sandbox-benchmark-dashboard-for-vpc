import apiRequest from "../content/api/apiRequest";
const mockToken = "mockedToken";

export const metadatajson = async () => {
  try {
    const response = await apiRequest('get', './mockMetadata.json', null, {
      Authorization: mockToken,
    });
    return response;
  } catch (error) {
    throw new Error('Failed to fetch metadata');
  }
};
