import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8529/_db/_system',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default {
  fetchModelData(payload) {
    return apiClient.post('/model-lifecycle/fetch', payload);
  },
  updateEntity(payload) {
    return apiClient.put('/entity-management/update', payload);
  },
  // Add more API calls as needed
};
