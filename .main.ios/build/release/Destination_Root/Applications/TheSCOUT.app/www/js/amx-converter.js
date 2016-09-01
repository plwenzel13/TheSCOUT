(function(){function a(a,b,e,g,h){if(!a){var k=null,m=null;h=getLocaleSymbols(h);g||(g="date");if("both"==g||"date"==g)switch(b||(b="default"),b){case "full":k=h.getFullDatePatternString();break;case "long":k=h.getLongDatePatternString();break;default:k=h.getMediumDatePatternString();break;case "default":case "short":k=h.getShortDatePatternString()}if("both"==g||"time"==g)switch(e||(e="default"),e){case "full":m=h.getFullTimePatternString();break;case "long":m=h.getLongTimePatternString();break;default:m=
h.getMediumTimePatternString();break;case "default":case "short":m=h.getShortTimePatternString()}k&&m?a=k+" "+m:k?a=k:m&&(a=m)}return a}function b(a,b){var e=b.getAttribute(a);return null===e?void 0:e}amx.createNumberConverter=function(a,d){if(TrNumberConverter){var e=b("type",a);null==e&&(e="number");var g=adf.mf.locale.getUserLocale(),h=b("integerOnly",a),k=b("groupingUsed",a),m=b("currencyCode",a),n=b("currencySymbol",a),t=b("maxFractionDigits",a),u=b("maxIntegerDigits",a),v=b("minFractionDigits",
a),w=b("minIntegerDigits",a);e||(e="number");h&&(h="true"==h,!0===h&&(v=t="0"));k&&(k="true"==k);var x=new TrNumberConverter(null,e,g,null,h,k,m,n,t,u,v,w);return{getAsString:function(a){var b=adf.mf.internal.perf.startMonitorCall("Convert data/time to string",adf.mf.log.level.FINEST,"amx.createDateTimeConverter.converter.getAsString");try{adf.mf.log.logInfoResource("AMXInfoBundle",adf.mf.log.level.INFO,"getAsString","MSG_CONVERTING",a);var c;c="undefined"===typeof a||null===a||""===a?"":"undefined"!==
typeof a[".null"]&&a[".null"]?"":"[object Array]"!==Object.prototype.toString.call(a)&&0<=a-parseFloat(a)+1?x.getAsString(a,d):a;adf.mf.log.logInfoResource("AMXInfoBundle",adf.mf.log.level.INFO,"getAsString","MSG_CONVERTED",a,c);return c}catch(e){return adf.mf.internal.amx.errorHandlerImpl(null,e),""}finally{b.stop()}},getAsObject:function(a){var b=adf.mf.internal.perf.startMonitorCall("Convert data/time to object",adf.mf.log.level.FINEST,"amx.createDateTimeConverter.converter.getAsObject");try{adf.mf.log.logInfoResource("AMXInfoBundle",
adf.mf.log.level.INFO,"getAsObject","MSG_CONVERTING",a);var c;if("undefined"===typeof a||null===a)c="";else if(c=x.getAsObject(a,d),"undefined"===typeof c||null===c)c="";adf.mf.log.logInfoResource("AMXInfoBundle",adf.mf.log.level.INFO,"getAsObject","MSG_CONVERTED",a,c);return c}catch(e){return adf.mf.internal.amx.errorHandlerImpl(null,e),""}finally{b.stop()}}}}};amx.createDateTimeConverter=function(c,d){if(TrDateTimeConverter){var e=b("pattern",c),g=adf.mf.locale.getUserLocale(),h=b("type",c);null==
h&&(h="date");var k=b("dateStyle",c),m=b("timeStyle",c),e=a(e,k,m,h,g),h=h.toUpperCase(),n;try{n=(new TrDateTimeConverter(e,g,null,h,null)).getAsString(new Date)}catch(t){n=null}var u=new TrDateTimeConverter(e,g,n,h,null);return{getAsString:function(a){var b=adf.mf.internal.perf.startMonitorCall("Convert data/time to string",adf.mf.log.level.FINEST,"amx.createDateTimeConverter.converter.getAsString");try{adf.mf.log.logInfoResource("AMXInfoBundle",adf.mf.log.level.INFO,"getAsString","MSG_CONVERTING",
a);var c;if("undefined"===typeof a||null===a||""===a)c="";else if("undefined"!==typeof a[".null"]&&a[".null"])c="";else if("string"==typeof a){var e=adf.mf.internal.converters.dateParser.parse(a);c=isNaN(e)?a:u.getAsString(new Date(e),d)}else a instanceof Date?c=u.getAsString(a,d):"undefined"!==typeof a[".type"]&&"java.util.Date"==a[".type"]?(a=new Date(a.time),c=u.getAsString(a,d)):c=a;adf.mf.log.logInfoResource("AMXInfoBundle",adf.mf.log.level.INFO,"getAsString","MSG_CONVERTED",a,c);return c}catch(g){return adf.mf.internal.amx.errorHandlerImpl(null,
g),""}finally{b.stop()}},getAsObject:function(a){var b=adf.mf.internal.perf.startMonitorCall("Convert data/time to object",adf.mf.log.level.FINEST,"amx.createDateTimeConverter.converter.getAsObject");try{adf.mf.log.logInfoResource("AMXInfoBundle",adf.mf.log.level.INFO,"getAsObject","MSG_CONVERTING",a);var c;if("undefined"===typeof a||null===a)c="";else if(c=u.getAsObject(a,d),"undefined"===typeof c||null===c)c="";adf.mf.log.logInfoResource("AMXInfoBundle",adf.mf.log.level.INFO,"getAsObject","MSG_CONVERTED",
a,c);return c}catch(e){return adf.mf.internal.amx.errorHandlerImpl(null,e),""}finally{b.stop()}}}}}})();