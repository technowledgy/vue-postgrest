(window.webpackJsonp=window.webpackJsonp||[]).push([[4],{259:function(e,t,r){},282:function(e,t,r){"use strict";r(259)},287:function(e,t,r){"use strict";r.r(t);r(92);function n(e,t,r){!function(e,t){if(t.has(e))throw new TypeError("Cannot initialize the same private elements twice on an object")}(e,t),t.set(e,r)}function i(e){return(i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function o(e){var t=function(e,t){if("object"!==i(e)||null===e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var n=r.call(e,t||"default");if("object"!==i(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(e,"string");return"symbol"===i(t)?t:String(t)}function a(e,t,r){if(!t.has(e))throw new TypeError("attempted to "+r+" private field on non-instance");return t.get(e)}function s(e,t,r){return function(e,t,r){if(t.set)t.set.call(e,r);else{if(!t.writable)throw new TypeError("attempted to set read only private field");t.value=r}}(e,a(e,t,"set"),r),r}function c(e){return["and","or","not.and","not.or"].includes(e)}function p(e,t,r=""){var n;return(t=null===(n=t)||void 0===n?void 0:n.toString())?`${e}${t}${r}`:""}var l=new WeakMap;class u extends URL{constructor(e,t,r={}){var i,a,c;super(e.replace(/\/$/,"")+"/"+t.replace(/^\//,""),window.location.href),i=this,c={},(a=o(a="subQueries"))in i?Object.defineProperty(i,a,{value:c,enumerable:!0,configurable:!0,writable:!0}):i[a]=c,n(this,l,{writable:!0,value:void 0}),s(this,l,e);const{columns:p,select:u,order:f,limit:d,offset:h,on_conflict:m,...y}=r;m&&this.searchParams.append("on_conflict",m),p&&this.searchParams.append("columns",p),this._appendSelect(u),this._appendOrder(f),this._appendLimit(d),this._appendOffset(h),this._appendConditions(y),this._appendSubQueryParams(this)}_appendSubQueryParams(e,t=""){for(let[r,n]of Object.entries(e.subQueries)){r=p(""+t,r);for(const[e,t]of n.searchParams.entries())["columns","select"].includes(e)||this.searchParams.append(`${r}.${e}`,t);this._appendSubQueryParams(n,r)}}_appendSelect(e){"object"!=typeof e||Array.isArray(e)?e&&this.searchParams.append("select",e.toString()):this.searchParams.append("select",this._parseSelectObject(e))}_parseSelectObject(e,t=[]){return Object.entries(e).map(([e,r])=>{if(!r)return!1;if(null!=r&&r.select){const t=e.split(":",1)[0].split("!",1)[0],i=new u(function(e,t){return t.get?t.get.call(e):t.value}(n=this,a(n,l,"get")),t,r);return this.subQueries[t]=i,`${e}(${i.searchParams.get("select")})`}var n;let i,o="",s="",c=[];if(e.includes(":")?[o,i]=e.split(":"):i=e,"string"==typeof r)s=r;else if("object"==typeof r){let e;if(({"::":s,...e}=r),c=this._parseSelectObject(e,[...t,i]),c.length>0&&!o&&!s)return c}return[p("",o,":")+[...t,i].join("->")+p("::",s),c]}).flat(2).filter(Boolean).join(",")}_appendOrder(e){Array.isArray(e)?this.searchParams.append("order",e.map(e=>Array.isArray(e)?e.join("."):e).join(",")):"object"==typeof e?this.searchParams.append("order",Object.entries(e).map(([e,t])=>t&&"string"==typeof t?`${e}.${t}`:e).join(",")):e&&this.searchParams.append("order",e)}_appendLimit(e){e&&this.searchParams.append("limit",e)}_appendOffset(e){e&&this.searchParams.append("offset",e)}_appendConditions(e){for(const{key:t,value:r}of this._parseConditions(e))this.searchParams.append(t,r)}_parseConditions(e,t=""){return Object.entries(e).map(([e,r])=>{var n;if(void 0===r)return!1;const i=e.split(":");if(c(e=null!==(n=i[1])&&void 0!==n?n:i[0])){if(!r||"object"!=typeof r||Array.isArray(r))throw new Error("no object for logical operator");if(t)throw new Error("logical operators can't be nested with json operators");const n=this._parseConditions(r).map(({key:e,value:t})=>c(e)?`${e}${t}`:`${e}.${t}`).join(",");if(!n)return;return{key:e,value:`(${n})`}}{const[n,...i]=e.split(".");let o;switch(i[i.length-1]){case"in":o=this._valueToString(r,"()");break;case void 0:if(r&&"object"==typeof r)return this._parseConditions(r,p("",t,"->")+n);default:o=this._valueToString(r)}return{key:p("",t,"string"==typeof r?"->>":"->")+n,value:[...i,o].join(".")}}}).flat().filter(Boolean)}_valueToString(e,t="{}"){if(null===e)return"null";if("boolean"==typeof e)return e.toString();if(Array.isArray(e))return t.charAt(0)+e.map(e=>this._valueToString(e)).join(",")+t.charAt(1);if("object"==typeof e){const{lower:t,includeLower:r=!0,upper:n,includeUpper:i=!1}=e;return(r?"[":"(")+t+","+n+(i?"]":")")}return r=(r=e).toString(),[",",".",":","(",")"].find(e=>r.includes(e))||["null","true","false"].includes(r)?`"${r}"`:r;var r}}var f=u,d={props:{content:String},data:()=>({code:void 0}),computed:{query(){if(this.code){const e=Function(`"use strict";${this.code};return query`)();return decodeURIComponent(new f("/","",e).search)}}},mounted(){this.code=this.$refs.wrap.innerText}},h=(r(282),r(10)),m=Object(h.a)(d,(function(){var e=this,t=e._self._c;return t("div",[t("div",{ref:"wrap",staticClass:"slot-wrapper"},[e._t("default")],2),e._v(" "),t("div",{staticClass:"language-none output-wrapper"},[t("pre",{staticClass:"language-none"},[e._v("      "),t("code",[e._v("\n        "),t("span",[e._v(e._s(e.query))]),e._v("\n      ")]),e._v("\n    ")])])])}),[],!1,null,"6fd32615",null);t.default=m.exports}}]);