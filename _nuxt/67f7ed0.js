(window.webpackJsonp=window.webpackJsonp||[]).push([[31],{648:function(t,e,n){"use strict";n.d(e,"a",(function(){return o})),n.d(e,"h",(function(){return c})),n.d(e,"g",(function(){return l})),n.d(e,"f",(function(){return d})),n.d(e,"b",(function(){return h})),n.d(e,"d",(function(){return m})),n.d(e,"c",(function(){return f})),n.d(e,"e",(function(){return v})),n.d(e,"i",(function(){return _}));var r="home",o="file",c="results",l="pdf",d="payment",h="install",m="lead",f="interaction",v="num_persons";function _(t,label){var e=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"1";window.$nuxt.$gtag.event(label+"_"+t,{event_category:r,event_label:label,value:String(e)})}},789:function(t,e,n){var content=n(790);content.__esModule&&(content=content.default),"string"==typeof content&&(content=[[t.i,content,""]]),content.locals&&(t.exports=content.locals);(0,n(48).default)("a4669b52",content,!0,{sourceMap:!1})},790:function(t,e,n){var r=n(47)((function(i){return i[1]}));r.push([t.i,".top-color{background-color:#21a68d}.only-visible-to-html2canvas{display:none}.cta{background:#f2f2f2;width:100%}.btn-color{background-color:#21a68d!important}.btn-color-dark{background-color:#00535f!important}.link{border:none;color:#069;cursor:pointer;font-family:arial,sans-serif;-webkit-text-decoration:underline;text-decoration:underline}.theme--light.v-image{color:rgba(0,0,0,.87)}.theme--dark.v-image{color:#fff}.v-image{z-index:0}.v-image__image,.v-image__placeholder{height:100%;left:0;position:absolute;top:0;width:100%;z-index:-1}.v-image__image{background-repeat:no-repeat}.v-image__image--preload{filter:blur(2px)}.v-image__image--contain{background-size:contain}.v-image__image--cover{background-size:cover}",""]),r.locals={},t.exports=r},791:function(t,e,n){var content=n(792);content.__esModule&&(content=content.default),"string"==typeof content&&(content=[[t.i,content,""]]),content.locals&&(t.exports=content.locals);(0,n(48).default)("0c396eac",content,!0,{sourceMap:!1})},792:function(t,e,n){var r=n(47)((function(i){return i[1]}));r.push([t.i,".top-color{background-color:#21a68d}.only-visible-to-html2canvas{display:none}.cta{background:#f2f2f2;width:100%}.btn-color{background-color:#21a68d!important}.btn-color-dark{background-color:#00535f!important}.link{border:none;color:#069;cursor:pointer;font-family:arial,sans-serif;-webkit-text-decoration:underline;text-decoration:underline}.v-responsive{display:flex;flex:1 0 auto;max-width:100%;overflow:hidden;position:relative}.v-responsive__content{flex:1 0 0px;max-width:100%}.v-application--is-ltr .v-responsive__sizer~.v-responsive__content{margin-left:-100%}.v-application--is-rtl .v-responsive__sizer~.v-responsive__content{margin-right:-100%}.v-responsive__sizer{flex:1 0 0px;transition:padding-bottom .2s cubic-bezier(.25,.8,.5,1)}",""]),r.locals={},t.exports=r},811:function(t,e,n){t.exports=n.p+"img/my-chat.e8dd029.jpg"},813:function(t,e,n){"use strict";var r=n(36),o=(n(60),n(133),n(327),n(119),n(88),n(789),n(156)),c=(n(791),n(329)),l=n(35),d=n(12),h=Object(l.a)(c.a).extend({name:"v-responsive",props:{aspectRatio:[String,Number],contentClass:String},computed:{computedAspectRatio:function(){return Number(this.aspectRatio)},aspectStyle:function(){return this.computedAspectRatio?{paddingBottom:1/this.computedAspectRatio*100+"%"}:void 0},__cachedSizer:function(){return this.aspectStyle?this.$createElement("div",{style:this.aspectStyle,staticClass:"v-responsive__sizer"}):[]}},methods:{genContent:function(){return this.$createElement("div",{staticClass:"v-responsive__content",class:this.contentClass},Object(d.s)(this))}},render:function(t){return t("div",{staticClass:"v-responsive",style:this.measurableStyles,on:this.$listeners},[this.__cachedSizer,this.genContent()])}}),m=n(53),f=n(120),v=n(40),_="undefined"!=typeof window&&"IntersectionObserver"in window;e.a=Object(l.a)(h,m.a).extend({name:"v-img",directives:{intersect:o.a},props:{alt:String,contain:Boolean,eager:Boolean,gradient:String,lazySrc:String,options:{type:Object,default:function(){return{root:void 0,rootMargin:void 0,threshold:void 0}}},position:{type:String,default:"center center"},sizes:String,src:{type:[String,Object],default:""},srcset:String,transition:{type:[Boolean,String],default:"fade-transition"}},data:function(){return{currentSrc:"",image:null,isLoading:!0,calculatedAspectRatio:void 0,naturalWidth:void 0,hasError:!1}},computed:{computedAspectRatio:function(){return Number(this.normalisedSrc.aspect||this.calculatedAspectRatio)},normalisedSrc:function(){return this.src&&"object"===Object(r.a)(this.src)?{src:this.src.src,srcset:this.srcset||this.src.srcset,lazySrc:this.lazySrc||this.src.lazySrc,aspect:Number(this.aspectRatio||this.src.aspect)}:{src:this.src,srcset:this.srcset,lazySrc:this.lazySrc,aspect:Number(this.aspectRatio||0)}},__cachedImage:function(){if(!(this.normalisedSrc.src||this.normalisedSrc.lazySrc||this.gradient))return[];var t=[],e=this.isLoading?this.normalisedSrc.lazySrc:this.currentSrc;this.gradient&&t.push("linear-gradient(".concat(this.gradient,")")),e&&t.push('url("'.concat(e,'")'));var image=this.$createElement("div",{staticClass:"v-image__image",class:{"v-image__image--preload":this.isLoading,"v-image__image--contain":this.contain,"v-image__image--cover":!this.contain},style:{backgroundImage:t.join(", "),backgroundPosition:this.position},key:+this.isLoading});return this.transition?this.$createElement("transition",{attrs:{name:this.transition,mode:"in-out"}},[image]):image}},watch:{src:function(){this.isLoading?this.loadImage():this.init(void 0,void 0,!0)},"$vuetify.breakpoint.width":"getSrc"},mounted:function(){this.init()},methods:{init:function(t,e,n){if(!_||n||this.eager){if(this.normalisedSrc.lazySrc){var r=new Image;r.src=this.normalisedSrc.lazySrc,this.pollForSize(r,null)}this.normalisedSrc.src&&this.loadImage()}},onLoad:function(){this.getSrc(),this.isLoading=!1,this.$emit("load",this.src),this.image&&(this.normalisedSrc.src.endsWith(".svg")||this.normalisedSrc.src.startsWith("data:image/svg+xml"))&&(this.image.naturalHeight&&this.image.naturalWidth?(this.naturalWidth=this.image.naturalWidth,this.calculatedAspectRatio=this.image.naturalWidth/this.image.naturalHeight):this.calculatedAspectRatio=1)},onError:function(){this.hasError=!0,this.$emit("error",this.src)},getSrc:function(){this.image&&(this.currentSrc=this.image.currentSrc||this.image.src)},loadImage:function(){var t=this,image=new Image;this.image=image,image.onload=function(){image.decode?image.decode().catch((function(e){Object(v.c)("Failed to decode image, trying to render anyway\n\n"+"src: ".concat(t.normalisedSrc.src)+(e.message?"\nOriginal error: ".concat(e.message):""),t)})).then(t.onLoad):t.onLoad()},image.onerror=this.onError,this.hasError=!1,this.sizes&&(image.sizes=this.sizes),this.normalisedSrc.srcset&&(image.srcset=this.normalisedSrc.srcset),image.src=this.normalisedSrc.src,this.$emit("loadstart",this.normalisedSrc.src),this.aspectRatio||this.pollForSize(image),this.getSrc()},pollForSize:function(img){var t=this,e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:100;!function n(){var r=img.naturalHeight,o=img.naturalWidth;r||o?(t.naturalWidth=o,t.calculatedAspectRatio=o/r):img.complete||!t.isLoading||t.hasError||null==e||setTimeout(n,e)}()},genContent:function(){var content=h.options.methods.genContent.call(this);return this.naturalWidth&&this._b(content.data,"div",{style:{width:"".concat(this.naturalWidth,"px")}}),content},__genPlaceholder:function(){var slot=Object(d.s)(this,"placeholder");if(slot){var t=this.isLoading?[this.$createElement("div",{staticClass:"v-image__placeholder"},slot)]:[];return this.transition?this.$createElement("transition",{props:{appear:!0,name:this.transition}},t):t[0]}}},render:function(t){var e=h.options.render.call(this,t),data=Object(f.a)(e.data,{staticClass:"v-image",attrs:{"aria-label":this.alt,role:this.alt?"img":void 0},class:this.themeClasses,directives:_?[{name:"intersect",modifiers:{once:!0},value:{handler:this.init,options:this.options}}]:void 0});return e.children=[this.__cachedSizer,this.__cachedImage,this.__genPlaceholder(),this.genContent()],t(e.tag,data,e.children)}})},868:function(t,e,n){"use strict";n.r(e);var r=n(615),o=n(643),c=n(813),l=n(641),d=n(648),h={props:{showImage:{default:!1,type:Boolean},to:{default:"",type:String},buttonTxt:{default:function(){return"analyzeYourChat"},type:String},text:{default:function(){return"analyzeYourChatLong"},type:String},title:{default:function(){return"analyzeYourChatTitle"},type:String}},data:function(){return{GTAG_INTERACTION:d.c}},methods:{clickHandler:function(){this.to||(Object(d.i)("jump_to_filehandler_cta",d.c,0),this.$vuetify.goTo(".filehandler",{duration:300,offset:300}))},gtagEvent:d.i}},m=n(100),component=Object(m.a)(h,(function(){var t=this,e=t._self._c;return e(o.a,{staticClass:"cta pt-7 my-5 text-center"},[e("div",{staticClass:"text-h2 font-weight-bold mb-7"},[t._v(t._s(t.$t(t.title)))]),t._v(" "),t.showImage?e(l.a,[e(c.a,{staticClass:"ma-auto mt-4 mb-8",attrs:{"lazy-src":n(811),src:n(811),"max-width":"250"}})],1):t._e(),t._v(" "),e("span",{staticClass:"text-body-1"},[t._v(" "+t._s(t.$t(t.text)))]),t._v(" "),e("br"),t._v(" "),e(r.a,{staticClass:"mt-5 text-h6 btn-color",staticStyle:{color:"#ffffff"},attrs:{to:t.to?t.to:null,elevation:"10"},on:{click:t.clickHandler}},[t._v("\n    "+t._s(t.$t(t.buttonTxt))+"\n  ")])],1)}),[],!1,null,null,null);e.default=component.exports}}]);