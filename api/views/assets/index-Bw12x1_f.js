import{d as r,c as t,u as h,e as p,j as s,B as x}from"./index-DnER2C_7.js";import{c as a}from"./createLucideIcon-Bn_rYMf8.js";import{S as j}from"./shield-check-PFGRMUPJ.js";/**
 * @license lucide-react v1.27.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]],_=a("log-out",m);/**
 * @license lucide-react v1.27.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["path",{d:"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",key:"132q7q"}],["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}]],g=a("mail",f);/**
 * @license lucide-react v1.27.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["circle",{cx:"12",cy:"8",r:"5",key:"1hypcn"}],["path",{d:"M20 21a8 8 0 0 0-16 0",key:"rfgkzh"}]],N=a("user-round",u);r.injectEndpoints({endpoints:()=>({})});const S=()=>{const c=t(),e=h(i=>i.auth.user),[d,{isLoading:n}]=p(),l=((e==null?void 0:e.name)??"User").split(" ").map(i=>i[0]).join("").slice(0,2).toUpperCase(),o=async()=>{await d().unwrap().catch(()=>{}),c("/",{replace:!0})};return s.jsxs("section",{className:"profile-page",children:[s.jsxs("header",{className:"profile-page__header",children:[s.jsx("p",{className:"eyebrow",children:"Profile"}),s.jsx("h1",{children:(e==null?void 0:e.name)??"User profile"}),s.jsx("p",{children:"Manage your Cubid identity, account role, and active session."})]}),s.jsxs("div",{className:"profile-card",children:[s.jsxs("div",{className:"profile-card__hero",children:[s.jsxs("div",{className:"profile-card__avatar",children:[s.jsx("span",{children:l}),s.jsx(N,{size:22})]}),s.jsxs("div",{children:[s.jsx("span",{className:"profile-card__label",children:"Signed in as"}),s.jsx("strong",{children:(e==null?void 0:e.name)??"User"}),s.jsx("p",{children:(e==null?void 0:e.email)??"--"})]}),s.jsx("span",{className:"profile-card__status",children:(e==null?void 0:e.status)??"ACTIVE"})]}),s.jsxs("dl",{className:"profile-card__details",children:[s.jsxs("div",{className:"profile-card__detail",children:[s.jsxs("dt",{children:[s.jsx(g,{size:16}),"Email"]}),s.jsx("dd",{children:(e==null?void 0:e.email)??"--"})]}),s.jsxs("div",{className:"profile-card__detail",children:[s.jsxs("dt",{children:[s.jsx(j,{size:16}),"Role"]}),s.jsx("dd",{children:(e==null?void 0:e.role)??"USER"})]}),s.jsxs("div",{className:"profile-card__detail",children:[s.jsx("dt",{children:"Status"}),s.jsx("dd",{children:(e==null?void 0:e.status)??"--"})]})]}),s.jsxs("div",{className:"profile-card__actions",children:[s.jsxs("div",{children:[s.jsx("strong",{children:"Session controls"}),s.jsx("span",{children:"Sign out from this browser session."})]}),s.jsx(x,{disabled:n,icon:s.jsx(_,{size:16}),onClick:()=>void o(),variant:"secondary",children:"Sign out"})]})]})]})};export{S as default};
