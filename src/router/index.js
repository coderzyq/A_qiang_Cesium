/*
 * @Description:
 * @Author: coderqiang
 * @Date: 2023-06-06 21:17:52
 * @LastEditTime: 2023-06-06 21:33:26
 * @LastEditors: coderqiang
 */
/*
 * @Description:
 * @Author: coderqiang
 * @Date: 2023-06-06 21:17:52
 * @LastEditTime: 2023-06-06 21:23:05
 * @LastEditors: coderqiang
 */
import { createRouter, createWebHistory } from "vue-router";
import HelloWorld from "../views/HelloWorld.vue";

const routes = [
  {
    path: "/",
    name: "index",
    component: HelloWorld,
  },
  // {
  //   path: "/about",
  //   name: "about",
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () =>
  //     import(/* webpackChunkName: "about" */ "../views/AboutView.vue"),
  // },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
