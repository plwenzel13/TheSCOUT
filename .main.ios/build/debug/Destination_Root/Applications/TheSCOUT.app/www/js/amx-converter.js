/* Copyright (c) 2011, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------------------- amx-converter.js ----------------- */
/* ------------------------------------------------------ */

(function()
{
// TODO finish the migration from "amx.*" to "adf.mf.api.amx.*" and "adf.mf.internal.amx.*"
  function getJSPattern(pattern, dateStyle, timeStyle, type, locale)
  {
    if (pattern)
    {
      return pattern;
    }
    else
    {
      var datePattern = null, timePattern = null;
      var localeSymbols = getLocaleSymbols(locale);
      if (!type)
      {
        type = "date";
      }
      if (type == "both" || type == "date")
      {
        if (!dateStyle)
        {
          dateStyle = "default";
        }
        switch (dateStyle)
        {
          case "full":
            datePattern = localeSymbols.getFullDatePatternString();
            break;
          case "long":
            datePattern = localeSymbols.getLongDatePatternString();
            break;
          case "medium":
          default:
            datePattern = localeSymbols.getMediumDatePatternString();
            break;
          case "default":
          case "short":
            datePattern = localeSymbols.getShortDatePatternString();
            break;
        }
      }
      if (type == "both" || type == "time")
      {
        if (!timeStyle)
        {
          timeStyle = "default";
        }
        switch (timeStyle)
        {
          case "full":
            timePattern = localeSymbols.getFullTimePatternString();
            break;
          case "long":
            timePattern = localeSymbols.getLongTimePatternString();
            break;
          case "medium":
          default:
            timePattern = localeSymbols.getMediumTimePatternString();
            break;
          case "default":
          case "short":
            timePattern = localeSymbols.getShortTimePatternString();
            break;
        }
      }
      if (datePattern && timePattern)
      {
        pattern = datePattern + " " + timePattern;
      }
      else if (datePattern)
      {
        pattern = datePattern;
      }
      else if (timePattern)
      {
        pattern = timePattern;
      }
      return pattern;
    }
  }

  function _getAttribute(attrName, tagInstance)
  {
    var attrValue = tagInstance.getAttribute(attrName);

    if (attrValue === null)
    {
      return undefined; // the convert utilities can't handle null
    }

    return attrValue;
  }

  amx.createNumberConverter = function(tagInstance, label)
  {
    if (TrNumberConverter)
    {
      var pattern = null;
      var type = _getAttribute("type", tagInstance);
      if (type == null)
        type = "number";
      var locale = adf.mf.locale.getUserLocale();
      var messages = null;
      var integerOnly = _getAttribute("integerOnly", tagInstance);
      var groupingUsed = _getAttribute("groupingUsed", tagInstance);
      var currencyCode = _getAttribute("currencyCode", tagInstance);
      var currencySymbol = _getAttribute("currencySymbol", tagInstance);
      var maxFractionDigits = _getAttribute("maxFractionDigits", tagInstance);
      var maxIntegerDigits = _getAttribute("maxIntegerDigits", tagInstance);
      var minFractionDigits = _getAttribute("minFractionDigits", tagInstance);
      var minIntegerDigits = _getAttribute("minIntegerDigits", tagInstance);

      if (!type)
      {
        type = "number";
      }
      if (integerOnly)
      {
        integerOnly = (integerOnly == "true");

        // Bug 13716034: Trinidad client-side support has a hole in its display
        // formatting, as it doesn't do anything when integerOnly is set to
        // true. integerOnly is utilized in getAsObject(), for parsing, but
        // doesn't get utilized in getAsString(), for display formatting.
        // Conceptually, integerOnly = "true" is the same as maxFractionDigits
        // = "0", so Trinidad can be made to format like integerOnly is set to
        // true, by setting maxFractionDigits = "0".
        // Bug 14456421: Building on the above cited hole in the Trinidad client-
        // side integerOnly support, apparently if minFractionDigits is specified
        // with integerOnly, it will negate the effect of maxFractionDigits = 0, and
        // display the minFractionDigits digits anyway. Setting minFractionDigits
        // = "0" also, should prevent further overriding of integerOnly.
        if (integerOnly === true)
        {
          maxFractionDigits = "0";
          minFractionDigits = "0";
        }
      }
      if (groupingUsed)
      {
        groupingUsed = (groupingUsed == "true");
      }
      var numberConverter = new TrNumberConverter(pattern, type, locale, messages,
        integerOnly, groupingUsed, currencyCode, currencySymbol, maxFractionDigits,
        maxIntegerDigits, minFractionDigits, minIntegerDigits);
      var converter = {};

      converter.getAsString = function(obj)
      {
        var perf = adf.mf.internal.perf.startMonitorCall("Convert data/time to string", adf.mf.log.level.FINEST,
          "amx.createDateTimeConverter.converter.getAsString");
        try
        {
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.INFO, "getAsString",
            "MSG_CONVERTING", obj);
          var str;
          if (typeof obj === "undefined" || obj === null || obj === "")
          {
            str = "";
          }
          else if (typeof obj[".null"] !== "undefined" && obj[".null"])
          {
            str = "";
          }
          else if (!(Object.prototype.toString.call(obj) === "[object Array]") &&
            (obj - parseFloat(obj) + 1) >= 0) // is a numeric value
          {
            str = numberConverter.getAsString(obj, label);
          }
          else
          {
            str = obj;
          }
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.INFO, "getAsString",
            "MSG_CONVERTED", obj, str);
          return str;
        }
        catch(e)
        {
          // do not rethrow the exception - this will cause automated tests to fail
          // just show the exception to the user
          adf.mf.internal.amx.errorHandlerImpl(null, e);
          return "";
        }
        finally
        {
          perf.stop();
        }
      };

      converter.getAsObject = function(str)
      {
        var perf = adf.mf.internal.perf.startMonitorCall("Convert data/time to object", adf.mf.log.level.FINEST,
          "amx.createDateTimeConverter.converter.getAsObject");
        try
        {
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.INFO, "getAsObject",
            "MSG_CONVERTING", str);
          var obj;
          if (typeof str === "undefined" || str === null)
          {
            obj = "";
          }
          else
          {
            obj = numberConverter.getAsObject(str, label);
            if (typeof obj === "undefined" || obj === null)
            {
              obj = "";
            }
          }
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.INFO, "getAsObject",
            "MSG_CONVERTED", str, obj);
          return obj;
        }
        catch(e)
        {
          // do not rethrow the exception - this will cause automated tests to fail
          // just show the exception to the user
          adf.mf.internal.amx.errorHandlerImpl(null, e);
          return "";
        }
        finally
        {
          perf.stop();
        }
      };
      return converter;
    }
    else
    {
      return undefined;
    }
  };

  function buildDateTimeExampleString(pattern, locale, type)
  {
    try
    {
      var converter = new TrDateTimeConverter(pattern, locale, null,
        type, null);

      return converter.getAsString(new Date());
    }
    catch (e)
    {
      return null;
    }
  }

  amx.createDateTimeConverter = function(tagInstance, label)
  {
    if (TrDateTimeConverter)
    {
      var pattern = _getAttribute("pattern", tagInstance);
      var locale = adf.mf.locale.getUserLocale();
      var type = _getAttribute("type", tagInstance);
      if (type == null)
        type = "date";
      var messages = null;
      var dateStyle = _getAttribute("dateStyle", tagInstance);
      var timeStyle = _getAttribute("timeStyle", tagInstance);

      pattern = getJSPattern(pattern, dateStyle, timeStyle, type, locale);

      var typeForTrConstructor = type.toUpperCase();
      var exampleString = buildDateTimeExampleString(pattern, locale, typeForTrConstructor);
      var dateTimeConverter = new TrDateTimeConverter(pattern, locale, exampleString,
        typeForTrConstructor, messages);
      var converter = {};

      converter.getAsString = function(obj)
      {
        var perf = adf.mf.internal.perf.startMonitorCall("Convert data/time to string", adf.mf.log.level.FINEST,
          "amx.createDateTimeConverter.converter.getAsString");
        try
        {
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.INFO, "getAsString", "MSG_CONVERTING", obj);
          var str;
          if (typeof obj === "undefined" || obj === null || obj === "")
          {
            str = "";
          }
          else if (typeof obj[".null"] !== "undefined" && obj[".null"])
          {
            str = "";
          }
          else if (typeof obj == "string")
          {
            // call our date parser that attempts both native and ISO-8601 parsing
            var dateParse = adf.mf.internal.converters.dateParser.parse(obj);

            if (isNaN(dateParse))
            {
              str = obj;
            }
            else
            {
              var newDate = new Date(dateParse);
              str = dateTimeConverter.getAsString(newDate, label);
            }
          }
          else if (obj instanceof Date)
          {
            str = dateTimeConverter.getAsString(obj, label);
          }
          else if (typeof obj[".type"] !== "undefined" && obj[".type"] == "java.util.Date")
          {
            obj = new Date(obj["time"]);
            str = dateTimeConverter.getAsString(obj, label);
          }
          else
          {
            str = obj;
          }
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.INFO, "getAsString", "MSG_CONVERTED", obj, str);
          return str;
        }
        catch(e)
        {
          // do not rethrow the exception - this will cause automated tests to fail
          // just show the exception to the user
          adf.mf.internal.amx.errorHandlerImpl(null, e);
          return "";
        }
        finally
        {
          perf.stop();
        }
      };

      converter.getAsObject = function(str)
      {
        var perf = adf.mf.internal.perf.startMonitorCall("Convert data/time to object", adf.mf.log.level.FINEST,
          "amx.createDateTimeConverter.converter.getAsObject");
        try
        {
          adf.mf.log.logInfoResource("AMXInfoBundle", adf.mf.log.level.INFO, "getAsObject", "MSG_CONVERTING", str);
          var obj;
          if (typeof str === "undefined" || str === null)
          {
            obj = "";
          }
          else
          {
            obj = dateTimeConverter.getAsObject(str, label);
            if (typeof obj === "undefined" || obj === null)
            {
              obj = "";
            }
          }
          adf.mf.log.logInfoResource("AMXInfoBundle",adf.mf.log.level.INFO, "getAsObject", "MSG_CONVERTED", str, obj);
          return obj;
        }
        catch(e)
        {
          // do not rethrow the exception - this will cause automated tests to fail
          // just show the exception to the user
          adf.mf.internal.amx.errorHandlerImpl(null, e);
          return "";
        }
        finally
        {
          perf.stop();
        }
      };
      return converter;
    }
    else
    {
      return undefined;
    }
  };
})();
