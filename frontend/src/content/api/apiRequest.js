import axios from 'axios';

export default function apiRequest(method, url, data = null, headers = {}) {
  return axios({
    method,
    url,
    data,
    headers
  }).then(response => {
    return response.data;
  })
    .catch(error => {
      throw (error);
    });
}