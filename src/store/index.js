import { createStore } from "vuex";

/**
 * @description 创建仓库
 */
export default createStore({
  state: {
    link: "index",
  },
  getters: {
    format(state) {
      return "/" + state.link
    }
  },
  mutations: {
    EXCHANGE_LINK: (state, val) => {
      state.link = val;
    },
  },
  actions: {},
  modules: {},
});
