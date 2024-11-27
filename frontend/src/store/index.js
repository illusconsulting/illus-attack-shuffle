import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    gridData: [],
  },
  mutations: {
    setGridData(state, payload) {
      state.gridData = payload;
    },
  },
  actions: {
    async fetchGridData({ commit }) {
      const data = await apiClient.fetchModelData();
      commit('setGridData', data);
    },
  },
});
