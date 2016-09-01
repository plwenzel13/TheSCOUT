/* Copyright (c) 2011, 2015, Oracle and/or its affiliates. All rights reserved. */
/* ------------------------------------------------------ */
/* ------------------- amx-inputDate.js ----------------- */
/* ------------------------------------------------------ */
(function()
{
  var forceCustomInputDate = false; // use true for testing it on iOS/desktop
  if (!adf.mf.environment.profile.dtMode)
  {
    // When using a non-DT, browser-based presentation mode that indicates the
    // skin is for Android, then force use of the custom Android date picker:
    if (adf._bootstrapMode == "dev" || adf._bootstrapMode == "hosted")
    {
      var qs = adf.mf.api.getQueryString();
      var skinFolderOverride = adf.mf.api.getQueryStringParamValue(qs, "amx_skin_folder_override");
      var skinOverride = adf.mf.api.getQueryStringParamValue(qs, "amx_skin_override");
      var agentType = adf.mf.internal.amx.agent["type"];
      if (skinFolderOverride != null && skinFolderOverride.indexOf("android") != -1)
        forceCustomInputDate = true;
      else if (skinOverride != null && skinOverride.indexOf("android") != -1)
        forceCustomInputDate = true;
      else if (agentType == "gecko" || agentType == "trident" || agentType == "webkit")
        forceCustomInputDate = true;
    }
  }

  var inputDate = adf.mf.api.amx.TypeHandler.register(adf.mf.api.amx.AmxTag.NAMESPACE_AMX, "inputDate");

  inputDate.prototype.getInputValueAttribute = function()
  {
    return "value";
  };

  inputDate.prototype.render = function(amxNode, id)
  {
    inputDate._oneTimeSetup();

    // MDO - converters support is deprecated; remove any converters added by old apps
    amxNode.setConverter(null);

    var forId = id + "_trigger";
    var field = amx.createField(amxNode, forId); // generate the fieldRoot/fieldLabel/fieldValue structure
    field.fieldLabel.setAttribute("id", id + "__fieldLabel");
    var rootDomNode = field.fieldRoot;

    // Initialize the value for this instance:
    var dateObject = null;
    var value = amxNode.getAttribute("value");
    if (value == null)
    {
      dateObject = {};
      dateObject[".null"] = true;
      value = "";
    }
    else
    {
      // call our date parser that attempts both native and ISO-8601 parsing
      var dateParse = adf.mf.internal.converters.dateParser.parse(value);

      if (!isNaN(dateParse))
      {
        dateObject = new Date(dateParse);
      }
    }
    if (dateObject == null && !adf.mf.environment.profile.dtMode)
    {
      dateObject = {};
      dateObject[".null"] = true;
      value = "";
    }

    // Check to Extract the date, time, and datetime values only when DT Mode is false
    var inputType = amxNode.getAttribute("inputType");
    if (adf.mf.environment.profile.dtMode == false)
    {
      if (inputType === "time")
      {
        // only extract the time if the value is not null
        if (amxNode.getAttribute("value") != null)
        {
          if (dateObject.getHours != null)
            value = adf.mf.internal.amx.extractTimeFromDateObject(dateObject);
        }
      }
      else if (inputType === "datetime")
      {
        value = amxNode.getAttribute("value");
      }
      else
      {
        inputType = "date";
        // only extract the date if the value is not null
        if (amxNode.getAttribute("value") != null)
        {
          if (dateObject.getFullYear != null)
            value = adf.mf.internal.amx.extractDateFromDateObject(dateObject);
        }
      }
    }
    else // DT mode
    {
      // we are in DT mode, so handle the inputType differently based on iOS/Android
      if (adf.mf.internal.amx.agent["type"] == "Android" ||
        adf.mf.internal.amx.agent["type"] == "UWP" ||
        forceCustomInputDate)
      {
        if (inputType !== "time" && inputType !== "datetime")
        {
          // make sure invalid/unset values get defaulted to "date"
          inputType = "date";
        }
      }
      else
      {
        // on iOS, we must force the input type to be text
        // in order for the displaying of the EL to work
        inputType = "text";
      }
    }

    // since readOnly is not required and it defaults to false if unspecified,
    // then we must use the adf.mf.api.amx.isValueTrue() helper method. This will return
    // false unless the attribute is explicitly set to true
    var readOnly = adf.mf.api.amx.isValueTrue(amxNode.getAttribute("readOnly"));

    // We may not yet have formatting information yet (it comes asynchronously
    // from Cordova) so we need to use a placeholder until we get the format
    // information. (It is used for read-only display and for the non-HTML5
    // version of the component.)
    var completed = false;
    inputDate._loadDateTimePatterns().then(
      function() // It is safe to finish rendering this component:
      {
        if (!completed)
        {
          completed = true;

          // if readOnly is set to true
          if (readOnly == true)
          {
            // Create the read-only inputDate:
            var dateLabel = document.createElement("span");
            dateLabel.setAttribute("id", id + "_triggerText");
            field.fieldValue.appendChild(dateLabel);
            var rawValue = inputDate._getRawValueFromDateObject(dateObject);
            dateLabel.textContent = inputDate._getTriggerText(inputType, rawValue);
            dateLabel.setAttribute("readOnly", readOnly);
            // Adding WAI-ARIA Attribute for the readonly state
            dateLabel.setAttribute("aria-readonly", readOnly);
            adf.mf.internal.amx._setNonPrimitiveElementData(dateLabel, "value", dateObject);
          }
          else
          {
            var useHtml5 = true;
            if (adf.mf.internal.amx.agent["type"] == "UWP")
            {
              if (inputType == "datetime" &&
                adf.mf.internal.amx.agent["version"] < 12.10565)
              {
                useHtml5 = false; // not yet supported on UWP
              }
              else if (inputType == "time" &&
                adf.mf.internal.amx.agent["version"] < 12.10532)
              {
                useHtml5 = false; // old versions of Edge didn't support it
              }
            }
            else if (adf.mf.internal.amx.agent["type"] == "Android" || forceCustomInputDate)
            {
              useHtml5 = false;
            }

            if (useHtml5)
              inputDate._createHtml5InputDate(amxNode, field, value, inputType, dateObject);
            else
              inputDate._createCustomInputDate(amxNode, field, value, inputType, id);
          }
        }
      },
      function(problem)
      {
        // should never get here
        console.log("inputDate promise-then problem: " + problem); // TODO add log message
      })["catch"](
        function(error)
        {
          console.log("inputDate promise-catch error: " + error); // TODO add log message
        });

    // calls applyRequiredMarker in amx-core.js to determine and implement required/showRequired style
    adf.mf.api.amx.applyRequiredMarker(amxNode, field);

    return rootDomNode;
  };

  inputDate.prototype.destroy = function(rootElement, amxNode)
  {
    // Clean up any elements that aren't inside the rootElement:
    var id = amxNode.getId();
    var dateTimePicker = document.getElementById(id + "_picker");
    var overlayElement = document.getElementById(id + "_overlay");
    adf.mf.api.amx.removeDomNode(dateTimePicker);
    adf.mf.api.amx.removeDomNode(overlayElement);
  };

  inputDate.prototype.__getTestJavaScriptURI = function(amxTag)
  {
    return "js/testing/amx-inputDate.js";
  };

  inputDate._getTriggerText = function(inputType, rawValue)
  {
    // The inputType value is undefined for the case where inputType is not
    // declared in the amx page, thus default type is "date".
    if (inputType == "time")
      return inputDate._getLocalizedTimeTextFromRawValue(rawValue);
    else if (inputType == "datetime")
      return inputDate._getLocalizedDateTimeTextFromRawValue(rawValue);
    else // "date" or not specified
      return inputDate._getLocalizedDateTextFromRawValue(rawValue);
  };

  inputDate._oneTimeSetup = function()
  {
    if (inputDate._LOCALIZED_MONTH_ARRAY == null)
    {
      // If we are presenting a month name to a user, we cannot show the parsable month,
      // instead we have to show a name from the user's selected resource bundle:
      var LOCALIZED_MONTH_ARRAY = new Array(12);
      if (adf.mf.environment.profile.dtMode == false)
      {
        LOCALIZED_MONTH_ARRAY[0] = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_JANUARY_ABBREVIATION");
        LOCALIZED_MONTH_ARRAY[1] = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_FEBRUARY_ABBREVIATION");
        LOCALIZED_MONTH_ARRAY[2] = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_MARCH_ABBREVIATION");
        LOCALIZED_MONTH_ARRAY[3] = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_APRIL_ABBREVIATION");
        LOCALIZED_MONTH_ARRAY[4] = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_MAY_ABBREVIATION");
        LOCALIZED_MONTH_ARRAY[5] = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_JUNE_ABBREVIATION");
        LOCALIZED_MONTH_ARRAY[6] = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_JULY_ABBREVIATION");
        LOCALIZED_MONTH_ARRAY[7] = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_AUGUST_ABBREVIATION");
        LOCALIZED_MONTH_ARRAY[8] = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_SEPTEMBER_ABBREVIATION");
        LOCALIZED_MONTH_ARRAY[9] = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_OCTOBER_ABBREVIATION");
        LOCALIZED_MONTH_ARRAY[10] = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_NOVEMBER_ABBREVIATION");
        LOCALIZED_MONTH_ARRAY[11] = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_DECEMBER_ABBREVIATION");
        inputDate._LOCALIZED_TIME_AM = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_TIME_AM_ABBREVIATION");
        inputDate._LOCALIZED_TIME_PM = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_TIME_PM_ABBREVIATION");
      }
      else
      {
        LOCALIZED_MONTH_ARRAY[0] = "JAN";
        LOCALIZED_MONTH_ARRAY[1] = "FEB";
        LOCALIZED_MONTH_ARRAY[2] = "MAR";
        LOCALIZED_MONTH_ARRAY[3] = "APR";
        LOCALIZED_MONTH_ARRAY[4] = "MAY";
        LOCALIZED_MONTH_ARRAY[5] = "JUN";
        LOCALIZED_MONTH_ARRAY[6] = "JUL";
        LOCALIZED_MONTH_ARRAY[7] = "AUG";
        LOCALIZED_MONTH_ARRAY[8] = "SEP";
        LOCALIZED_MONTH_ARRAY[9] = "OCT";
        LOCALIZED_MONTH_ARRAY[10] = "NOV";
        LOCALIZED_MONTH_ARRAY[11] = "DEC";
        inputDate._LOCALIZED_TIME_AM = "AM";
        inputDate._LOCALIZED_TIME_PM = "PM";
      }
      inputDate._LOCALIZED_MONTH_ARRAY = LOCALIZED_MONTH_ARRAY;

      inputDate._tapEvents = amx.hasTouch() ? { start: "touchstart", end: "touchend" } : { start: "mousedown", end: "mouseup" };
    }
  };

  inputDate._capitalizeFirstLetter = function(monthText)
  {
    return monthText.slice(0,1).toUpperCase() + monthText.slice(1).toLowerCase();
  };

  inputDate._getLocalizedDateTimeTextFromRawValue = function(rawValue)
  {
    if (rawValue["monthIndex"] == null)
      return "";
    var result =
      inputDate._getLocalizedDateTextFromRawValue(rawValue) +
      " " +
      inputDate._getLocalizedTimeTextFromRawValue(rawValue);
    return result;
  };

  /**
   * Load the date and time patterns. This might require an asynchronous call so
   * instead of immediately using those patterns after calling this function,
   * you need to instead use them in the returned promise's "then" function.
   * @return {adf.mf.internal.BasePromise} the promise object whose then
   *   function is where the patterns can safely be used.
   */
  inputDate._loadDateTimePatterns = function()
  {
    // Callee should use the then function on the returned promise to perform
    // any actions that depend on the patters being loaded.
    var basePromise = new adf.mf.internal.BasePromise(
      function(resolveCallback, rejectCallback)
      {
        if (inputDate._datePatternFetched && inputDate._timePatternFetched)
        {
          resolveCallback(); // invoke the callback, no need to wait
        }
        else // at least one thing hasn't been loaded yet
        {
          // Only look up once per WebView.
          // Since this Cordova API uses a callback, we can't code synchronously.

          // If the Cordova globalization plugin is installed, try to get the date and time pattern
          // See details at http://plugins.cordova.io/#/package/org.apache.cordova.globalization
          if (navigator.globalization && navigator.globalization.getDatePattern)
          {
            navigator.globalization.getDatePattern(
              function(dateDetail)
              {
                // Make sure we got a date and not a time or datetime:
                var datePattern = dateDetail.pattern;
                var noLiteralPattern = inputDate._removePatternLiterals(datePattern);
                if (noLiteralPattern != null &&
                    noLiteralPattern.indexOf("y") != -1 && // year
                    noLiteralPattern.indexOf("m") == -1)   // minute
                {
                  inputDate._datePattern = datePattern;
                  inputDate._datePatternFetched = true;

                  // reset things so they will be recomputed
                  inputDate._dateFormatOrder = null;

                  if (inputDate._timePatternFetched)
                    resolveCallback(); // invoke the callback since we are ready
                }
              },
              function(error)
              {
                console.log("inputDate date pattern fetch error: " + error); // TODO add log message
              },
              {
                "formatLength": "short",
                "selector": "date"
              });

            navigator.globalization.getDatePattern(
              function(timeDetail)
              {
                // Make sure we got a time and not a date or datetime:
                var timePattern = timeDetail.pattern;
                var noLiteralPattern = inputDate._removePatternLiterals(timePattern);
                if (noLiteralPattern != null &&
                    noLiteralPattern.indexOf("y") == -1 && // year
                    noLiteralPattern.indexOf("m") != -1)   // minute
                {
                  inputDate._timePattern = timePattern;

                  // reset things so they will be recomputed
                  inputDate._timePatternFetched = true;

                  if (inputDate._datePatternFetched)
                    resolveCallback(); // invoke the callback since we are ready
                }
              },
              function(error)
              {
                console.log("inputDate time pattern fetch error: " + error); // TODO add log message
              },
              {
                "formatLength": "short",
                "selector": "time"
              });
          }
          else // the globalization plugin is not installed or available
          {
            // Stick with the US English patterns because the Cordova plug-in either
            // wasn't installed by the app developer or it isn't available.
            // Examples of other patterns:
            //  - yyyy/MM/dd (year, 2-digit month, 2-digit day)
            //  - HH:mm (24-hour clock)
            inputDate._datePattern = "MMM d, yyyy"; // use US English as a default
            inputDate._timePattern = "h:mm a"; // use US English as a default
            inputDate._datePatternFetched = true;
            inputDate._timePatternFetched = true;
            resolveCallback(); // invoke the callback since we are ready
          }
        }
      });
    return basePromise;
  };

  /**
   * Sort comparator for the date format components.
   * @param {Array.<Object>} x the first entry whose 1st member is the name, and the 2nd member is the pattern index
   * @param {Array.<Object>} y the second entry whose 1st member is the name, and the 2nd member is the pattern index
   * @return {Number} 1 if x is before y, -1 if x is after y, 0 if they are equal
   */
  inputDate._formatComparator = function(x, y)
  {
    /* use the cell index being sorted upon */
    var patternIndexA = x[1];
    var patternIndexB = y[1];

    if (patternIndexA > patternIndexB)
    {
      return 1; /* x is before y */
    }
    if (patternIndexA < patternIndexB)
    {
      return -1; /* x is after y */
    }

    return 0; /* they are equal */
  };

  /**
   * Get a 3-member array whose members are the name of the date data, sorted per the date format.
   * Entry names include: "year", "month", "day".
   * This is for the spinner positioning.
   * @return {Array.<String>} an array of names of date data, sorted per the date format
   */
  inputDate._getDateFormatOrderObject = function()
  {
    if (inputDate._dateFormatOrder == null)
    {
      var datePattern = inputDate._removePatternLiterals(inputDate._datePattern);
      var yearIndex = datePattern.indexOf("y");
      var monthIndex = datePattern.indexOf("M");
      var dayIndex = datePattern.indexOf("d");
      var orderObject =
        [
          [ "month", monthIndex ],
          [ "day", dayIndex ],
          [ "year", yearIndex ]
        ];

      // When dealing with number values in RTL mode, the spinners should appear
      // using big-endian ordering instead:
      if (document.documentElement.dir == "rtl")
      {
        // Make the order big-endian (reversed due to cell swapping):
        orderObject[0][1] = 1;
        orderObject[1][1] = 0;
        orderObject[2][1] = 2;
      }

      orderObject = orderObject.sort(inputDate._formatComparator);

      // Extract out just the names of the data to a simpler list:
      inputDate._dateFormatOrder = [ orderObject[0][0], orderObject[1][0], orderObject[2][0] ];
    }
    return inputDate._dateFormatOrder;
  };

  inputDate._getLocalizedDateTextFromRawValue = function(rawValue)
  {
    if (rawValue["monthIndex"] == null)
      return "";

    var year = inputDate._getLocalizedYearFromRawValue(rawValue);
    var monthAbbr = inputDate._capitalizeFirstLetter(inputDate._getLocalizedMonthFromRawValue(rawValue));
    var dayOfMonth = inputDate._getLocalizedDayFromRawValue(rawValue);
    var datePattern = inputDate._datePattern;
    var noLiteralPattern = inputDate._removePatternLiterals(datePattern);
    var yearIndex = noLiteralPattern.indexOf("y");
    var monthIndex = noLiteralPattern.indexOf("M");
    var dayIndex = noLiteralPattern.indexOf("d");

    var result;
    if (yearIndex == -1 || monthIndex == -1 || dayIndex == -1)
    {
      result = monthAbbr + " " + dayOfMonth + ", " + year; // the given date format was unusable
    }
    else
    {
      // insert pieces into the given date format
      var dayOfMonthPadded = dayOfMonth < 10 ? "0"+dayOfMonth : dayOfMonth;
      var monthNumber = 1 + rawValue["monthIndex"];
      var monthNumberPadded = monthNumber < 10 ? "0"+monthNumber : monthNumber;

      result = inputDate._applyReplacementsToUnquotedParts(
        datePattern,
        function(patternPart)
        {
          // See http://unicode.org/reports/tr35/tr35-4.html#Date_Format_Patterns
          patternPart = patternPart.replace(/[A-LN-Za-ce-xz]/g, "?"); // unsupported letters = ?; we support Mdy & non-alpha chars
          patternPart = patternPart.replace(/y+/g, year); // TODO y is regular number, yy, yyy, yyyyy, etc. represent truncation/padding
          patternPart = patternPart.replace(/d{2,2}/g, dayOfMonthPadded); // "dd" means use a padded day
          patternPart = patternPart.replace(/d{1,1}/g, dayOfMonth); // "d" mean use an unpadded day
          patternPart = patternPart.replace(/M{5,5}/g, "ooo"); // Use "ooo" as a temporary placeholder since we can't put in a name yet
          patternPart = patternPart.replace(/M{4,}/g, "oo"); // Use "oo" as a temporary placeholder since we can't put in a name yet
          patternPart = patternPart.replace(/M{3,3}/g, "o"); // Use "o" as a temporary placeholder since we can't put in a name yet
          patternPart = patternPart.replace(/M{2,2}/g, monthNumberPadded); // "MM" means use a padded month number, not text
          patternPart = patternPart.replace(/M{1,1}/g, monthNumber); // "M" means use an unpadded month number, not text
          patternPart = inputDate._replacePartsConcurrently(
            patternPart,
            [
              ["ooo", monthAbbr.charAt(0)], // "MMMMM" means use the first letter of the month name
              ["oo", monthAbbr],            // "MMMM" means use the full month name; we only have abbreviations
              ["o", monthAbbr]              // "MMM" means use an abbreviated month name
            ]);
          return patternPart;
        });
    }

    return result;
  };

  /**
   * Get a 3-member array whose members are the name of the time data, sorted per the time format.
   * Entry names include: "year", "month", "day".
   * This is for the spinner positioning.
   * @return {Array.<String>} an array of names of time data, sorted per the time format
   */
  inputDate._getTimeFormatOrderObject = function()
  {
    if (inputDate._timeFormatOrder == null)
    {
      var timePattern = inputDate._removePatternLiterals(inputDate._timePattern);
      var littleHIndex = timePattern.indexOf("h");
      var bigHIndex = timePattern.indexOf("H");
      var littleKIndex = timePattern.indexOf("k");
      var bigKIndex = timePattern.indexOf("K");
      var hoursIndex = littleHIndex;
      if (hoursIndex == -1)
        hoursIndex = bigHIndex;
      if (hoursIndex == -1)
        hoursIndex = littleKIndex;
      if (hoursIndex == -1)
        hoursIndex = bigKIndex;

      var minIndex = timePattern.indexOf("m");
      var amPmIndex = timePattern.indexOf("a");

      var orderObject =
        [
          [ "hours", hoursIndex ],
          [ "min", minIndex ],
          [ "amPm", amPmIndex == -1 ? Number.MAX_VALUE : amPmIndex ]
        ];

      // When dealing with number values in RTL mode, the spinners should appear
      // using big-endian ordering instead:
      if (document.documentElement.dir == "rtl")
      {
        // Make the order big-endian (reversed due to cell swapping):
        orderObject[0][1] = 1;
        orderObject[1][1] = 0;
        orderObject[2][1] = amPmIndex == -1 ? Number.MAX_VALUE : 2;
      }

      orderObject = orderObject.sort(inputDate._formatComparator);

      // Extract out just the names of the data to a simpler list:
      inputDate._timeFormatOrder = [ orderObject[0][0], orderObject[1][0], orderObject[2][0] ];
    }
    return inputDate._timeFormatOrder;
  };

  inputDate._getLocalizedTimeTextFromRawValue = function(rawValue)
  {
    if (rawValue["hour1to12"] == null)
      return "";

    var hours = parseInt(inputDate._getLocalizedHourFromRawValue(rawValue), 10);
    var minText = inputDate._getLocalizedMinutesFromRawValue(rawValue);
    var amPmText = inputDate._getLocalizedAmPmFromRawValue(rawValue);
    var isPm = rawValue["isPm"];
    var timePattern = inputDate._timePattern;
    var noLiteralPattern = inputDate._removePatternLiterals(timePattern);
    var littleHIndex = noLiteralPattern.indexOf("h");
    var bigHIndex = noLiteralPattern.indexOf("H");
    var littleKIndex = noLiteralPattern.indexOf("k");
    var bigKIndex = noLiteralPattern.indexOf("K");
    var hoursIndex = littleHIndex;
    if (hoursIndex == -1)
      hoursIndex = bigHIndex;
    if (hoursIndex == -1)
      hoursIndex = littleKIndex;
    if (hoursIndex == -1)
      hoursIndex = bigKIndex;
    var minIndex = noLiteralPattern.indexOf("m");
    var amPmIndex = noLiteralPattern.indexOf("a");

    var result;
    if (hoursIndex == -1 || minIndex == -1)
    {
      // the given date format was unusable
      result =
        hours +
        ":" +
        minText +
        " " +
        amPmText;
    }
    else
    {
      // insert pieces into the given time format
      var adjustedHours;
      var paddedAdjustedHours;

      result = inputDate._applyReplacementsToUnquotedParts(
        timePattern,
        function(patternPart)
        {
          // See http://unicode.org/reports/tr35/tr35-4.html#Date_Format_Patterns
          patternPart = patternPart.replace(/[A-GIJL-Zb-gijln-z]/g, "?"); // unsupported letters = ?; we support HKahkm & non-alpha chars

          if (littleHIndex != -1) // 1-12 hours (midnight = 12)
          {
            paddedAdjustedHours = hours;
            if (paddedAdjustedHours < 10)
              paddedAdjustedHours = "0" + paddedAdjustedHours; // pad with a zero

            patternPart = patternPart.replace(/h{2,2}/g, paddedAdjustedHours);
            patternPart = patternPart.replace(/h{1,1}/g, hours);
          }

          if (bigHIndex != -1) // 0-23 hours (midnight = 0)
          {
            adjustedHours = hours;
            if (isPm)
            {
              if (adjustedHours != 12) // PM but not 12 PM
                adjustedHours += 12;
            }
            else // is AM
            {
              if (hours == 12) // 12 AM
                adjustedHours = 0;
            }

            paddedAdjustedHours = adjustedHours;
            if (paddedAdjustedHours < 10)
              paddedAdjustedHours = "0" + paddedAdjustedHours; // pad with a zero

            patternPart = patternPart.replace(/H{2,2}/g, paddedAdjustedHours);
            patternPart = patternPart.replace(/H{1,1}/g, adjustedHours);
          }

          if (littleKIndex != -1) // 1-24 hours (midnight = 24)
          {
            adjustedHours = hours;
            if (isPm)
            {
              adjustedHours += 12;
            }
            else if (hours == 12)
            {
              adjustedHours = 24;
            }

            paddedAdjustedHours = adjustedHours;
            if (paddedAdjustedHours < 10)
              paddedAdjustedHours = "0" + paddedAdjustedHours; // pad with a zero

            patternPart = patternPart.replace(/k{2,2}/g, paddedAdjustedHours);
            patternPart = patternPart.replace(/k{1,1}/g, adjustedHours);
          }

          if (bigKIndex != -1) // 0-11 hours (midnight = 0)
          {
            adjustedHours = hours;
            if (hours == 12) // 12 AM or 12 PM
              adjustedHours = 0;

            paddedAdjustedHours = adjustedHours;
            if (paddedAdjustedHours < 10)
              paddedAdjustedHours = "0" + paddedAdjustedHours; // pad with a zero

            patternPart = patternPart.replace(/K{2,2}/g, paddedAdjustedHours);
            patternPart = patternPart.replace(/K{1,1}/g, adjustedHours);
          }

          patternPart = patternPart.replace(/m{2,}/g, minText);
          patternPart = patternPart.replace(/m{1,1}/g, parseInt(minText, 10));
          patternPart = patternPart.replace(/a+/g, amPmText);
          return patternPart;
        });
    }

    return result;
  };

  /**
   * Replace parts of the given string without applying further replacements
   * on the previously-replaced portions.
   * @param {string} rawValue the raw string to do replacements on
   * @param {Array.<Array.<string>>} replacements array of tokens and replacement text
   * @param {number} r the replacement index currently examining
   * @return {string} the result with replacements applied
   */
  inputDate._replacePartsConcurrently = function(rawValue, replacements, r)
  {
    if (r == undefined)
      r = -1;
    else if (r == replacements.length - 1)
      return rawValue;
    ++r;

    if (rawValue == null || rawValue.length == 0)
      return inputDate._replacePartsConcurrently(part, replacements, r);

    var token = replacements[r][0];
    var replacement = replacements[r][1];
    var splits = rawValue.split(token);

    for (var s=0, splitCount = splits.length; s<splitCount; ++s)
    {
      var part = splits[s];
      splits[s] = inputDate._replacePartsConcurrently(part, replacements, r);
    }

    return splits.join(replacement);
  };

  /**
   * Replace parts of the given string without applying further replacements
   * on the previously-replaced portions.
   * @param {string} rawValue the raw string to do replacements on
   * @param {Function} replacer the function responsible for applying replacements to the unquoted parts and returning its results
   * @return {string} the fully replaced result
   */
  inputDate._applyReplacementsToUnquotedParts = function(rawValue, replacer)
  {
    var result = rawValue;
    if (result != null)
    {
      // Leave in apostrophe-surrounded strings and convert double apostrophe to single apostrophe
      result = result.replace(/''/g, "$_*!"); // Use "ooo" as a temporary placeholder
      var splits = result.split("'");
      var parts = [];
      for (var i=0, count=splits.length; i<count; ++i)
      {
        var split = splits[i];
        split = split.replace(/\$_\*\!/g, "'"); // Insert the apostrophes
        if (i % 2 == 0) // i was even meaning this split needs replacements
          parts.push(replacer(split));
        else // i was odd meaning this split only has literal text
          parts.push(split);
      }
      result = parts.join(""); // assemble the parts back together
    }
    return result;
  };

  /**
   * If all we care about is token order, we need to remove all string literals
   * from the pattern and look at order within that result instead.
   * This function removes the alphabetical literal text from the pattern (the
   * apostrophe-surrounded parts).
   * @param {string} rawValue the raw pattern
   * @return {string} the pattern with alphabetical literal text removed
   */
  inputDate._removePatternLiterals = function(rawValue)
  {
    var result = rawValue;
    if (result != null)
    {
      // First get rid of the apostrophe characters
      result = result.replace(/''/g, ""); // '' means a ' character

      // Then strip out the blocks of text that are surrounded by ' chars:
      var splits = result.split("'");
      var keep = [];
      for (var i=0, count=splits.length; i<count; i=i+2)
      {
        keep.push(splits[i]);
      }
      result = keep.join("");
    }
    return result;
  };

  inputDate._getLocalizedMonthFromRawValue = function(rawValue)
  {
    if (rawValue["monthIndex"] == null)
      return "";
    return inputDate._LOCALIZED_MONTH_ARRAY[rawValue["monthIndex"]];
  };

  inputDate._getLocalizedDayFromRawValue = function(rawValue)
  {
    if (rawValue["dayNumber"] == null)
      return "";
    return rawValue["dayNumber"];
  };

  inputDate._getLocalizedYearFromRawValue = function(rawValue)
  {
    if (rawValue["year"] == null)
      return "";
    return rawValue["year"];
  };

  inputDate._getLocalizedHourFromRawValue = function(rawValue)
  {
    if (rawValue["hour1to12"] == null)
      return "";
    return rawValue["hour1to12"];
  };

  inputDate._getLocalizedMinutesFromRawValue = function(rawValue)
  {
    if (rawValue["min"] == null)
      return "";

    var displayMinutes = rawValue["min"];
    if (displayMinutes < 10)
    {
      displayMinutes = "0" + displayMinutes;
    }
    return displayMinutes;
  };

  inputDate._getLocalizedAmPmFromRawValue = function(rawValue)
  {
    if (rawValue["isPm"] == null)
      return "";
    return (rawValue["isPm"] ? inputDate._LOCALIZED_TIME_PM : inputDate._LOCALIZED_TIME_AM);
  };

  // Verify that this object is a valid date.  We check for presence of the toISOString function and verify that the time
  // in milliseconds in not NaN
  inputDate._isValidDate = function(date)
  {
    return (typeof date.toISOString === "function") && !isNaN(date.getTime());
  };

  // When the seconds and milliseconds on a date are both 0, the native control will remove them from the value attribute
  // and dateLabel.value returns "YYYY-MM-DDTHH:MMZ".  However, Date.parse() chokes on this even though it is a valid
  // ISO 8601 format.  To avoid this failure, we add the seconds and milliseconds so the value looks like "YYYY-MM-DDTHH:MM:00.000Z"
  inputDate._fillDateText = function(dateString)
  {
    var i = dateString.indexOf("T");
    if (i > -1 && (i + 1) < dateString.length)
    {
      var time = dateString.substring(i + 1);
      if (time.length == 6)
      {
        // this string looks like "HH:MMZ".  It is missing the optional seconds and milliseconds so we add them as zeroes
        time = time.substring(0, 5) + ":00.000Z";
      }
      else if (time.length == 9)
      {
        // this string looks like "HH:MM:SSZ".  It is missing the optional milliseconds so we add them as zeroes
        time = time.substring(0, 8) + ".000Z";
      }
      dateString = dateString.substring(0, i + 1) + time;
    }
    return dateString;
  };

  inputDate._daysInMonth = function(rawValue)
  {
    // Calculate days in a given month (also checks for leap year).

    var year = rawValue["year"];
    var monthIndex = rawValue["monthIndex"];

    // We need to start with this special January 1st date because otherwise
    // It will be a December 31st value by default which if we assign a month
    // with less than 31 days, the month will roll over to the next month
    // which of course will give us the wrong dates some of the time.
    // We also don't simply assign the year in this constructor because there
    // is no full-year constructor; JavaScript uses a horrible guessing
    // algorithm where 2-digit years are assumed to be years in the 1900s.
    // We also do not use the default constructor because that bases the date
    // off of the current point in time and we want a value with clean second,
    // millisecond, etc. components since we only care about minute precision.
    // All JavaScript date objects are assumed to be in the browser's local
    // time zone.
    dateObject = new Date(0, 1, 1);

    // Assign a date value that is of day #0 of the next month which equates to
    // the last day number of the current month:
    dateObject.setFullYear(year);
    dateObject.setMonth(monthIndex + 1); // next month
    dateObject.setDate(0); // last day of current month

    var daysInMonth = dateObject.getDate(); // normalizes the last day number
    return daysInMonth;
  };

  inputDate._populateTime = function(id, rawValues, updateTabText)
  {
    var chosenRawValue      = rawValues["chosen"];
    var lastRawValue        = rawValues["last"];
    var presentRawValue     = rawValues["present"];
    var incDateTimeSRowFCol = document.getElementById(id + "_txt1");
    var incDateTimeSRowSCol = document.getElementById(id + "_txt2");
    var incDateTimeSRowTCol = document.getElementById(id + "_txt3");
    var timeTabSpan         = document.getElementById(id + "_timeTxt");

    // Update the presentation text that appears between the spinners:
    var hours = parseInt(inputDate._getLocalizedHourFromRawValue(chosenRawValue), 10);
    var min = inputDate._getLocalizedMinutesFromRawValue(chosenRawValue);
    var amPm = inputDate._getLocalizedAmPmFromRawValue(chosenRawValue);
    var timeFormatOrder = inputDate._getTimeFormatOrderObject();

    var noLiteralPattern = inputDate._removePatternLiterals(inputDate._timePattern);
    var littleHIndex = noLiteralPattern.indexOf("h");
    var bigHIndex = noLiteralPattern.indexOf("H");
    var littleKIndex = noLiteralPattern.indexOf("k");
    var bigKIndex = noLiteralPattern.indexOf("K");
    var amPmIndex = noLiteralPattern.indexOf("a");

    if (amPmIndex == -1)
    {
      // Ensure the 3rd column is hidden (might get shown when viewing a date):
      var innerContainer = document.getElementById(id + "_inner-container");
      innerContainer.classList.remove("amx-3-col");
      innerContainer.classList.add("amx-2-col");
      document.getElementById(id + "_inc3").style.display = "none";
      incDateTimeSRowTCol.style.display = "none";
      document.getElementById(id + "_dec3").style.display = "none";
      amPm = "";
    }

    if (isNaN(hours))
      hours = "";

    if (chosenRawValue["hour1to12"] != null && hours != "")
    {
      // Convert the 1-12 raw value to a presentation value:
      if (littleHIndex != -1) // 1-12 hours (midnight = 12)
      {
        // hours is already in this format
      }
      else if (bigHIndex != -1) // 0-23 hours (midnight = 0)
      {
        if (chosenRawValue["isPm"])
        {
          if (hours != 12) // PM but not 12 PM
            hours += 12;
        }
        else // is AM
        {
          if (hours == 12) // 12 AM
            hours = 0;
        }
      }
      else if (littleKIndex != -1) // 1-24 hours (midnight = 24)
      {
        if (chosenRawValue["isPm"] && hours != 12)
          hours += 12;
        else if (!chosenRawValue["isPm"] && hours == 12)
          hours = 24;
      }
      else if (bigKIndex != -1) // 0-11 hours (midnight = 0)
      {
        if (hours == 12)
          hours = 0;
      }

      if (hours < 10)
      {
        if (noLiteralPattern.indexOf("hh") != -1 ||
          noLiteralPattern.indexOf("HH") != -1 ||
          noLiteralPattern.indexOf("kk") != -1 ||
          noLiteralPattern.indexOf("KK") != -1)
        {
          hours = "0" + hours; // pad with leading zero if needed
        }
      }
    }

    if (min != "" && noLiteralPattern.indexOf("mm") == -1)
    {
      min = parseInt(min, 10); // remove the leading zero padding
    }

    if (timeFormatOrder[0] == "hours")
      incDateTimeSRowFCol.textContent = hours;
    else if (timeFormatOrder[0] == "min")
      incDateTimeSRowFCol.textContent = min;
    else
      incDateTimeSRowFCol.textContent = amPm;

    if (timeFormatOrder[1] == "hours")
      incDateTimeSRowSCol.textContent = hours;
    else if (timeFormatOrder[1] == "min")
      incDateTimeSRowSCol.textContent = min;
    else
      incDateTimeSRowSCol.textContent = amPm;

    if (timeFormatOrder[2] == "hours")
      incDateTimeSRowTCol.textContent = hours;
    else if (timeFormatOrder[2] == "min")
      incDateTimeSRowTCol.textContent = min;
    else
      incDateTimeSRowTCol.textContent = amPm;

    if (updateTabText)
    {
      // Update the text on the toggle tab:
      if (inputDate._isRawValueEmpty(chosenRawValue))
      {
        if (inputDate._isRawValueEmpty(lastRawValue))
          timeTabSpan.textContent = inputDate._getLocalizedTimeTextFromRawValue(presentRawValue);
        else
          timeTabSpan.textContent = inputDate._getLocalizedTimeTextFromRawValue(lastRawValue);
      }
      else
        timeTabSpan.textContent = inputDate._getLocalizedTimeTextFromRawValue(chosenRawValue);
    }
  };

  inputDate._populateDate = function(id, rawValues, updateTabText)
  {
    var chosenRawValue      = rawValues["chosen"];
    var lastRawValue        = rawValues["last"];
    var presentRawValue     = rawValues["present"];
    var incDateTimeSRowFCol = document.getElementById(id + "_txt1");
    var incDateTimeSRowSCol = document.getElementById(id + "_txt2");
    var incDateTimeSRowTCol = document.getElementById(id + "_txt3");
    var dateTabSpan         = document.getElementById(id + "_dateTxt");

    // Ensure the 3rd column is present (might get hidden when viewing a 24-hour time):
    var innerContainer = document.getElementById(id + "_inner-container");
    innerContainer.classList.remove("amx-2-col");
    innerContainer.classList.add("amx-3-col");
    document.getElementById(id + "_inc3").style.display = "";
    incDateTimeSRowTCol.style.display = "";
    document.getElementById(id + "_dec3").style.display = "";

    // Make sure the day of the month is actually valid for the specified month
    var daysForThisMonth = inputDate._daysInMonth(chosenRawValue);
    if (chosenRawValue["dayNumber"] > daysForThisMonth)
      chosenRawValue["dayNumber"] = daysForThisMonth;

    // Update the text between the spinners:
    var month = inputDate._getLocalizedMonthFromRawValue(chosenRawValue).toUpperCase();
    var day = inputDate._getLocalizedDayFromRawValue(chosenRawValue);
    var year = inputDate._getLocalizedYearFromRawValue(chosenRawValue);
    var dateFormatOrder = inputDate._getDateFormatOrderObject();

    if (dateFormatOrder[0] == "year")
      incDateTimeSRowFCol.textContent = year;
    else if (dateFormatOrder[0] == "month")
      incDateTimeSRowFCol.textContent = month;
    else
      incDateTimeSRowFCol.textContent = day;

    if (dateFormatOrder[1] == "year")
      incDateTimeSRowSCol.textContent = year;
    else if (dateFormatOrder[1] == "month")
      incDateTimeSRowSCol.textContent = month;
    else
      incDateTimeSRowSCol.textContent = day;

    if (dateFormatOrder[2] == "year")
      incDateTimeSRowTCol.textContent = year;
    else if (dateFormatOrder[2] == "month")
      incDateTimeSRowTCol.textContent = month;
    else
      incDateTimeSRowTCol.textContent = day;

    if (updateTabText)
    {
      // Update the text on the toggle tab:
      if (inputDate._isRawValueEmpty(chosenRawValue))
      {
        if (inputDate._isRawValueEmpty(lastRawValue))
          dateTabSpan.textContent = inputDate._getLocalizedDateTextFromRawValue(presentRawValue);
        else
          dateTabSpan.textContent = inputDate._getLocalizedDateTextFromRawValue(lastRawValue);
      }
      else
        dateTabSpan.textContent = inputDate._getLocalizedDateTextFromRawValue(chosenRawValue);
    }
  };

  inputDate._initialPickerPopulation = function(
    id,
    inputType,
    rawValues,
    eventData)
  {
    var dateTimePicker = document.getElementById(id + "_picker");
    var titleBarText   = document.getElementById(id + "_title");
    var dateTabDiv     = document.getElementById(id + "_dateTab");
    var timeTabDiv     = document.getElementById(id + "_timeTab");

    // Check for inputTypes: time, date or dateTime and display the picker accordingly.
    // If the inputType value is undefined (for the case where inputType is not declared in the amx page), default to "date".
    if (inputType == "time")
    {
      dateTimePicker.setAttribute("class", "amx-inputDate-picker-wrapper amx-purge-on-nav amx-inputDate-picker-timeOnly");
      timeTabDiv.className = "amx-inputDate-picker-time-header";
      dateTabDiv.className = "amx-inputDate-picker-time-header";
      dateTabDiv.style.display = "none";
      titleBarText.textContent = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_SET_TIME");
      inputDate._populateTime(id, rawValues, true);
    }
    else if (inputType == "datetime")
    {
      dateTimePicker.setAttribute("class", "amx-inputDate-picker-wrapper amx-purge-on-nav");

      inputDate._populateTime(id, rawValues, true);
      inputDate._populateDate(id, rawValues, true);

      timeTabDiv.style.display = "block";
      dateTimePicker.setAttribute("class", "amx-inputDate-picker-wrapper amx-purge-on-nav");
      timeTabDiv.className = "amx-inputDate-picker-timeTab";
      dateTabDiv.className = "amx-inputDate-picker-dateTab-selected";

      adf.mf.api.amx.addBubbleEventListener(timeTabDiv, "tap", inputDate._customTimeTabTapHandler, eventData);
      adf.mf.api.amx.addBubbleEventListener(dateTabDiv, "tap", inputDate._customDateTabTapHandler, eventData);

      titleBarText.textContent = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_SET_DATE_TIME");
    }
    else // inputType is "date" or not specified
    {
      dateTimePicker.setAttribute("class", "amx-inputDate-picker-wrapper amx-purge-on-nav amx-inputDate-picker-dateOnly");
      dateTabDiv.className = "amx-inputDate-picker-date-header";
      timeTabDiv.className = "amx-inputDate-picker-date-header";
      timeTabDiv.style.display = "none";
      titleBarText.textContent = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_SET_DATE");
      inputDate._populateDate(id, rawValues, true);
    }
  };

  inputDate._createCustomInputDate = function(amxNode, field, value, inputType, id)
  {
    var dateTrigger = document.createElement("div");
    dateTrigger.id = id + "_trigger";
    dateTrigger.setAttribute("role", "button");
    dateTrigger.setAttribute("tabindex", "0");
    dateTrigger.setAttribute("class", "amx-inputDate-trigger-dateTime");

    // Set wai-aria required attribute to true if required/showRequired is set to true
    var isRequired = (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("showRequired")) ||
                      adf.mf.api.amx.isValueTrue(amxNode.getAttribute("required")));
    if (isRequired)
      dateTrigger.setAttribute("aria-required", "true");

    var dateTriggerSpan = document.createElement("span");
    dateTriggerSpan.setAttribute("class", "amx-inputDate-text");
    dateTriggerSpan.setAttribute("id", id + "_triggerText");

    var dateTriggerIconWrapper = document.createElement("div");
    dateTriggerIconWrapper.setAttribute("class", "amx-inputDate-triggerIconStyleWrapper");

    var dateTriggerIcon = document.createElement("div");
    dateTriggerIcon.setAttribute("class", "amx-inputDate-triggerIconStyle");
    dateTrigger.appendChild(dateTriggerSpan);
    dateTrigger.appendChild(dateTriggerIconWrapper);
    dateTrigger.appendChild(dateTriggerIcon);
    field.fieldValue.appendChild(dateTrigger);

    // since disabled is not required and it defaults to false if unspecified,
    // then we must use the adf.mf.api.amx.isValueTrue() helper method. This will return
    // false unless the attribute is explicitly set to true
    var disabledInputType = adf.mf.api.amx.isValueTrue(amxNode.getAttribute("disabled"));
    var androidDateObject = null;
    var androidInputDateValue = amxNode.getAttribute("value");
    var oldAndroidDateValue = null;
    var rawValue = inputDate._getRawValueFromDateObject(null);

    // If the value is already provided for inputDate, update the UI for all three (date, time, and datetime)
    if (typeof androidInputDateValue !== "undefined")
    {
      // call our date parser that attempts both native and ISO-8601 parsing
      var dateParse = adf.mf.internal.converters.dateParser.parse(androidInputDateValue);

      if (!isNaN(dateParse))
      {
        androidDateObject = new Date(dateParse);
      }

      if (androidDateObject == null)
      {
        if (adf.mf.environment.profile.dtMode)
        {
          androidDateObject = new Date();
        }
        else // cleared value
        {
          androidDateObject = {};
          androidDateObject[".null"] = true;
        }
      }

      rawValue = inputDate._getRawValueFromDateObject(androidDateObject);

      if (androidDateObject.toISOString != null)
        oldAndroidDateValue = androidDateObject.toISOString();
      else
        oldAndroidDateValue = "";

      dateTriggerSpan.textContent = inputDate._getTriggerText(inputType, rawValue);
    }
    else // cleared value
    {
      androidDateObject = {};
      androidDateObject[".null"] = true;
    }

    var presentDateObj = androidDateObject;
    if (presentDateObj.getDate == null)
      presentDateObj = new Date();
    var presentRawValue = inputDate._getRawValueFromDateObject(presentDateObj);

    // if disabled is false for Android then we don't inject the Date Picker in the DOM and don't invoke the tap event
    if (disabledInputType == false) // aka enabled
    {
      var eventData = {
        "amxNode":             amxNode,
        "id":                  id,
        "inputType":           inputType,
        "rawValue":            rawValue,
        "presentRawValue":     presentRawValue,
        "oldAndroidDateValue": oldAndroidDateValue
      };
      adf.mf.api.amx.addBubbleEventListener(dateTrigger, "tap", inputDate._customTriggerTapHandler, eventData);
    }

    if (adf.mf.environment.profile.dtMode != false)
    {
      adf.mf.api.amx.removeDomNode(dateTrigger);
      var dateTriggerSpanDTOnly = document.createElement("span");
      dateTriggerSpanDTOnly.classList.add("amx-inputDate-readOnly");
      // We need to show the value just as it was entered in the PI for DT Mode
      dateTriggerSpanDTOnly.textContent = value;
      field.fieldValue.appendChild(dateTriggerSpanDTOnly);
    }
  };

  /**
   * Whether this value is empty (has been cleared or was never set).
   * @param {Object} rawValue the value to test
   * @return {boolean} whether the given value is empty
   */
  inputDate._isRawValueEmpty = function(rawValue)
  {
    return (rawValue["year"] == null && rawValue["hour1to12"] == null);
  };

  /**
   * Assigns the values from one rawValue into another rawValue.
   * @param {Object} destinationRawValue the destination value
   * @param {Object} sourceRawValue the source value (or null to clear the members)
   */
  inputDate._assignRawValueMembers = function(destinationRawValue, sourceRawValue)
  {
    if (sourceRawValue == null)
    {
      destinationRawValue["year"] =       null;
      destinationRawValue["monthIndex"] = null;
      destinationRawValue["dayNumber"] =  null;
      destinationRawValue["hour1to12"] =  null;
      destinationRawValue["min"] =        null;
      destinationRawValue["isPm"] =       null;
    }
    else
    {
      destinationRawValue["year"] =       sourceRawValue["year"];
      destinationRawValue["monthIndex"] = sourceRawValue["monthIndex"];
      destinationRawValue["dayNumber"] =  sourceRawValue["dayNumber"];
      destinationRawValue["hour1to12"] =  sourceRawValue["hour1to12"];
      destinationRawValue["min"] =        sourceRawValue["min"];
      destinationRawValue["isPm"] =       sourceRawValue["isPm"];
    }
  };

  /**
   * Creates a copy of a raw value.
   * @param {Object} rawValue the value to copy
   * @return {Object} the new copy
   */
  inputDate._cloneRawValue = function(rawValue)
  {
    var newRawValue = {
      "year":       rawValue["year"],
      "monthIndex": rawValue["monthIndex"],
      "dayNumber":  rawValue["dayNumber"],
      "hour1to12":  rawValue["hour1to12"],
      "min":        rawValue["min"],
      "isPm":       rawValue["isPm"]
    };
    return newRawValue;
  };

  /**
   * Creates a JavaScript date object from a raw value object.
   * @param {Object} rawValue a raw value date object
   * @return {Date} a JavaScript date object based on the given raw value
   */
  inputDate._getDateObjectFromRawValue = function(rawValue)
  {
    var dateObject;
    if (inputDate._isRawValueEmpty(rawValue))
    {
      dateObject = null;
    }
    else
    {
      var year = rawValue["year"];
      var monthIndex = rawValue["monthIndex"];
      var dayNumber = rawValue["dayNumber"];
      var hour = rawValue["hour1to12"];
      var min = rawValue["min"];
      var isPm = rawValue["isPm"];

      var milHours = hour;
      if (isPm)
      {
        if (milHours != 12) // PM but not 12 PM
          milHours += 12;
      }
      else // is AM
      {
        if (milHours == 12) // 12 AM
          milHours = 0;
      }

      // We need to start with this special January 1st date because otherwise
      // It will be a December 31st value by default which if we assign a month
      // with less than 31 days, the month will roll over to the next month
      // which of course will give us the wrong dates some of the time.
      // We also don't simply assign the year in this constructor because there
      // is no full-year constructor; JavaScript uses a horrible guessing
      // algorithm where 2-digit years are assumed to be years in the 1900s.
      // We also do not use the default constructor because that bases the date
      // off of the current point in time and we want a value with clean second,
      // millisecond, etc. components since we only care about minute precision.
      // All JavaScript date objects are assumed to be in the browser's local
      // time zone.
      dateObject = new Date(0, 1, 1);

      // Assign the actual date values:
      dateObject.setFullYear(year);
      dateObject.setMonth(monthIndex);
      dateObject.setDate(dayNumber);
      dateObject.setHours(milHours);
      dateObject.setMinutes(min);
    }
    return dateObject;
  };

  /**
   * Creates a raw value object from a JavaScript date object.
   * @param {Date} dateObject a JavaScript date object
   * @return {Object} the raw value object based on the given date
   */
  inputDate._getRawValueFromDateObject = function(dateObject)
  {
    var rawValue = {
      "year":       null,
      "monthIndex": null,
      "dayNumber":  null,
      "hour1to12":  null,
      "min":        null,
      "isPm":       null
    };

    if (dateObject == null || dateObject.getFullYear == null)
      return rawValue;

    var milHour = dateObject.getHours(); // In 24 hours time (number 0 through 23)
    var hour = milHour;
    var isPm = false;
    if (hour == 0)
    {
      hour = 12;
    }
    else if (hour == 12)
    {
      isPm = true; // noon is 12 PM
    }
    else if (hour > 12)
    {
      isPm = true;
      hour = hour - 12;
    }

    rawValue["year"]       = dateObject.getFullYear()
    rawValue["monthIndex"] = dateObject.getMonth();
    rawValue["dayNumber"]  = dateObject.getDate();
    rawValue["hour1to12"]  = hour;
    rawValue["min"]        = dateObject.getMinutes();
    rawValue["isPm"]       = isPm;
    return rawValue;
  };

  inputDate._customTriggerTapHandler = function(event)
  {
    // Don't show the picker if we are navigating:
    if (!adf.mf.api.amx.acceptEvent())
      return;

    // Stop propagation of the event to parent components
    event.stopPropagation();

    // Build the structure for the editor UI:
    var eventData           = event.data;
    var id                  = eventData["id"];
    var inputType           = eventData["inputType"];
    var rawValue            = eventData["rawValue"];
    var presentRawValue     = eventData["presentRawValue"];

    // The "chosen" value is the one that will be used when the set button is clicked.
    var chosenRawValue;
    if (inputDate._isRawValueEmpty(rawValue)) // use present when empty
      chosenRawValue = inputDate._cloneRawValue(presentRawValue);
    else
      chosenRawValue = inputDate._cloneRawValue(rawValue);

    // The "last" value is the one that will be used when either the date or
    // time tabs are clicked when it they are already selected--to reset the value.
    // The "last" value gets gets updated each time a new tab is selected.
    // If the "last" value happens to be cleared when resetting, the "present"
    // value is used for the reset instead.
    // In the beginning, chosen and last are the same:
    var lastRawValue = inputDate._cloneRawValue(chosenRawValue);

    var rawValues = {
      "chosen":  chosenRawValue,
      "last":    lastRawValue,
      "present": presentRawValue
    };
    eventData["rawValues"] = rawValues;

    var dateTimePicker = document.createElement("div");
    dateTimePicker.setAttribute("class", "amx-inputDate-picker-wrapper amx-purge-on-nav");
    dateTimePicker.setAttribute("id", id + "_picker");

    // Creation of Date Picker including the Tabs for Date/Time and Table for values and inc/dec buttons and appended to the DOM
    var dateTabDiv = document.createElement("div");
    dateTabDiv.id = id + "_dateTab";
    dateTabDiv.setAttribute("role", "button");
    dateTabDiv.setAttribute("tabindex", "0");
    dateTabDiv.setAttribute("class", "amx-inputDate-picker-dateTab-selected");

    var dateTabSpan = document.createElement("span");
    dateTabSpan.setAttribute("class", "amx-inputDate-picker-dateTab-text");
    dateTabSpan.setAttribute("id", id + "_dateTxt");
    dateTabDiv.appendChild(dateTabSpan);

    var timeTabDiv = document.createElement("div");
    timeTabDiv.id = id + "_timeTab";
    timeTabDiv.setAttribute("role", "button");
    timeTabDiv.setAttribute("tabindex", "0");
    timeTabDiv.setAttribute("class", "amx-inputDate-picker-timeTab");

    var timeTabSpan = document.createElement("span");
    timeTabSpan.setAttribute("class", "amx-inputDate-picker-timeTab-text");
    timeTabSpan.setAttribute("id", id + "_timeTxt");

    // Title Bar Text and the horizontal divider are created using this div for Alta Skin
    var titleBarText = document.createElement("div");
    titleBarText.setAttribute("class", "amx-inputDate-picker-titleBarText");
    titleBarText.setAttribute("id", id + "_title");
    dateTimePicker.appendChild(titleBarText);

    timeTabDiv.appendChild(timeTabSpan);
    dateTimePicker.appendChild(dateTabDiv);
    dateTimePicker.appendChild(timeTabDiv);

    var dateTimePickerTable = document.createElement("div");
    dateTimePickerTable.id = id + "_inner-container";
    dateTimePickerTable.setAttribute("class", "amx-inputDate-datePicker-inner-container");

    var incDateTimeFRow = document.createElement("div");
    incDateTimeFRow.setAttribute("class", "amx-inputDate-datePicker-row-increment");
    dateTimePickerTable.appendChild(incDateTimeFRow);
    var incDateTimeFRowFCol = document.createElement("div");
    incDateTimeFRow.appendChild(incDateTimeFRowFCol);
    incDateTimeFRowFCol.id = id + "_inc1";
    incDateTimeFRowFCol.setAttribute("role", "button");
    incDateTimeFRowFCol.setAttribute("tabindex", "0");
    incDateTimeFRowFCol.setAttribute("aria-label", "+"); // This should be a word that changes on tab switch or format order change
    incDateTimeFRowFCol.setAttribute("class", "amx-inputDate-datePicker-firstColumn-increment amx-inputDate-incrementButton amx-inputDate-datePicker-col");
    var incDateTimeFRowSCol = document.createElement("div");
    incDateTimeFRow.appendChild(incDateTimeFRowSCol);
    incDateTimeFRowSCol.id = id + "_inc2";
    incDateTimeFRowSCol.setAttribute("role", "button");
    incDateTimeFRowSCol.setAttribute("tabindex", "0");
    incDateTimeFRowSCol.setAttribute("aria-label", "+"); // This should be a word that changes on tab switch or format order change
    incDateTimeFRowSCol.setAttribute("class", "amx-inputDate-datePicker-secondColumn-increment amx-inputDate-incrementButton amx-inputDate-datePicker-col");
    var incDateTimeFRowTCol = document.createElement("div");
    incDateTimeFRow.appendChild(incDateTimeFRowTCol);
    incDateTimeFRowTCol.id = id + "_inc3";
    incDateTimeFRowTCol.setAttribute("role", "button");
    incDateTimeFRowTCol.setAttribute("tabindex", "0");
    incDateTimeFRowTCol.setAttribute("aria-label", "+"); // This should be a word that changes on tab switch or format order change
    incDateTimeFRowTCol.setAttribute("class", "amx-inputDate-datePicker-thirdColumn-increment amx-inputDate-incrementButton amx-inputDate-datePicker-col amx-inputDate-datePicker-lastCol");

    var incDateTimeSRow = document.createElement("div");
    incDateTimeSRow.setAttribute("class", "amx-inputDate-datePicker-row-text");
    dateTimePickerTable.appendChild(incDateTimeSRow);
    var incDateTimeSRowFCol = document.createElement("div");
    incDateTimeSRow.appendChild(incDateTimeSRowFCol);
    incDateTimeSRowFCol.id = id + "_txt1";
    incDateTimeSRowFCol.setAttribute("class", "amx-inputDate-datePicker-month-text amx-inputDate-datePicker-col");
    var incDateTimeSRowSCol = document.createElement("div");
    incDateTimeSRow.appendChild(incDateTimeSRowSCol);
    incDateTimeSRowSCol.id = id + "_txt2";
    incDateTimeSRowSCol.setAttribute("class", "amx-inputDate-datePicker-day-text amx-inputDate-datePicker-col");
    var incDateTimeSRowTCol = document.createElement("div");
    incDateTimeSRow.appendChild(incDateTimeSRowTCol);
    incDateTimeSRowTCol.id = id + "_txt3";
    incDateTimeSRowTCol.setAttribute("class", "amx-inputDate-datePicker-year-text amx-inputDate-datePicker-col amx-inputDate-datePicker-lastCol");
    var clearCell = document.createElement("div");
    clearCell.setAttribute("class", "amx-inputDate-datePicker-clear-col");
    incDateTimeSRow.appendChild(clearCell);
    var clearBtn = document.createElement("div");
    clearBtn.id = id + "_clear";
    clearBtn.setAttribute("role", "button");
    clearBtn.setAttribute("tabindex", "0");
    clearBtn.setAttribute("class", "amx-inputDate-picker-clearButton");
    clearBtn.setAttribute("aria-label", adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_CLEAR_BUTTON"));
    var targetArea = document.createElement("div");
    targetArea.className = "amx-extendedTarget";
    clearBtn.appendChild(targetArea);
    clearCell.appendChild(clearBtn);

    var decDateTimeTRow = document.createElement("div");
    decDateTimeTRow.setAttribute("class", "amx-inputDate-datePicker-row-decrement");
    dateTimePickerTable.appendChild(decDateTimeTRow);
    var decDateTimeTRowFCol = document.createElement("div");
    decDateTimeTRow.appendChild(decDateTimeTRowFCol);
    decDateTimeTRowFCol.id = id + "_dec1";
    decDateTimeTRowFCol.setAttribute("role", "button");
    decDateTimeTRowFCol.setAttribute("tabindex", "0");
    decDateTimeTRowFCol.setAttribute("aria-label", "-"); // This should be a word that changes on tab switch or format order change
    decDateTimeTRowFCol.setAttribute("class", "amx-inputDate-datePicker-firstColumn-decrement amx-inputDate-decrementButton amx-inputDate-datePicker-col");
    var decDateTimeTRowSCol = document.createElement("div");
    decDateTimeTRow.appendChild(decDateTimeTRowSCol);
    decDateTimeTRowSCol.id = id + "_dec2";
    decDateTimeTRowSCol.setAttribute("role", "button");
    decDateTimeTRowSCol.setAttribute("tabindex", "0");
    decDateTimeTRowSCol.setAttribute("aria-label", "-"); // This should be a word that changes on tab switch or format order change
    decDateTimeTRowSCol.setAttribute("class", "amx-inputDate-datePicker-secondColumn-decrement amx-inputDate-decrementButton amx-inputDate-datePicker-col");
    var decDateTimeTRowTCol = document.createElement("div");
    decDateTimeTRow.appendChild(decDateTimeTRowTCol);
    decDateTimeTRowTCol.id = id + "_dec3";
    decDateTimeTRowTCol.setAttribute("role", "button");
    decDateTimeTRowTCol.setAttribute("tabindex", "0");
    decDateTimeTRowTCol.setAttribute("aria-label", "-"); // This should be a word that changes on tab switch or format order change
    decDateTimeTRowTCol.setAttribute("class", "amx-inputDate-datePicker-thirdColumn-decrement amx-inputDate-decrementButton amx-inputDate-datePicker-col amx-inputDate-datePicker-lastCol");

    dateTimePicker.appendChild(dateTimePickerTable);

    //Creation of set and cancel buttons and appended to the DOM
    var dateTimeSetBtn = document.createElement("div");
    dateTimeSetBtn.id = id + "_set";
    dateTimeSetBtn.setAttribute("role", "button");
    dateTimeSetBtn.setAttribute("tabindex", "0");
    dateTimeSetBtn.setAttribute("class", "amx-inputDate-picker-setButton");

    var dateTimeSetBtnSpan = document.createElement("span");
    dateTimeSetBtnSpan.setAttribute("class", "amx-inputDate-picker-button-text");
    dateTimeSetBtnSpan.textContent = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_OK_BUTTON");
    dateTimeSetBtn.appendChild(dateTimeSetBtnSpan);
    dateTimePicker.appendChild(dateTimeSetBtn);

    var dateTimeCancelBtn = document.createElement("div");
    dateTimeCancelBtn.id = id + "_cancel";
    dateTimeCancelBtn.setAttribute("role", "button");
    dateTimeCancelBtn.setAttribute("tabindex", "0");
    dateTimeCancelBtn.setAttribute("class", "amx-inputDate-picker-cancelButton");

    var dateTimeCancelBtnSpan = document.createElement("span");
    dateTimeCancelBtnSpan.setAttribute("class", "amx-inputDate-picker-button-text");
    dateTimeCancelBtnSpan.textContent = adf.mf.resource.getInfoString("AMXInfoBundle", "amx_inputDate_LABEL_CANCEL_BUTTON");

    dateTimeCancelBtn.appendChild(dateTimeCancelBtnSpan);
    dateTimePicker.appendChild(dateTimeCancelBtn);

    // The opacity screen for the date picker component
    var overlayElement = document.createElement("div");
    overlayElement.id = id + "_overlay";
    overlayElement.setAttribute("class", "amx-inputDate-picker-modalOverlay amx-purge-on-nav");

    // Tapping the overlay works just like tapping the cancel button
    adf.mf.api.amx.addBubbleEventListener(overlayElement, "tap", inputDate._customCancelButtonTapHandler, eventData);

    document.body.appendChild(overlayElement);
    document.body.appendChild(dateTimePicker);
    inputDate._initialPickerPopulation(id, inputType, rawValues, eventData);

    // Set the new value
    adf.mf.api.amx.addBubbleEventListener(dateTimeSetBtn, "tap", inputDate._customSetButtonTapHandler, eventData);

    // Cancel and go back to the old value
    adf.mf.api.amx.addBubbleEventListener(dateTimeCancelBtn, "tap", inputDate._customCancelButtonTapHandler, eventData);

    // Clear the new value
    adf.mf.api.amx.addBubbleEventListener(clearBtn, "tap", inputDate._customClearButtonTapHandler, eventData);

    // Events are bound to the touchstart and touchend events to deal with
    // incrementing/decrementing the date and time values and updating the style
    // of the button.

    // Handling MONTH & HOUR increments
    adf.mf.api.amx.addBubbleEventListener(
      incDateTimeFRowFCol, inputDate._tapEvents.start, inputDate._customIncrement1stTouchStartHandler, eventData);

    // Changes the image back to normal on touchend
    adf.mf.api.amx.addBubbleEventListener(
      incDateTimeFRowFCol, inputDate._tapEvents.end, inputDate._customIncrementTouchEndHandler, incDateTimeFRowFCol.id);

    // Handling DAY & MINUTE increment here
    adf.mf.api.amx.addBubbleEventListener(
      incDateTimeFRowSCol, inputDate._tapEvents.start, inputDate._customIncrement2ndTouchStartHandler, eventData);

    // Changes the image back to normal on touchend
    adf.mf.api.amx.addBubbleEventListener(
      incDateTimeFRowSCol, inputDate._tapEvents.end, inputDate._customIncrementTouchEndHandler, incDateTimeFRowSCol.id);

    // Handling YEAR increment & AM/PM toggle here
    adf.mf.api.amx.addBubbleEventListener(
      incDateTimeFRowTCol, inputDate._tapEvents.start, inputDate._customIncrement3rdTouchStartHandler, eventData);

    // Changes the image back to normal on touchend
    adf.mf.api.amx.addBubbleEventListener(
      incDateTimeFRowTCol, inputDate._tapEvents.end, inputDate._customIncrementTouchEndHandler, incDateTimeFRowTCol.id);

    // Attached event handlers to the respective mm/dd/yy decrement buttons to keep decrementing untill the last first in the array
    // Handling MONTH & HOUR decrement here
    adf.mf.api.amx.addBubbleEventListener(
      decDateTimeTRowFCol, inputDate._tapEvents.start, inputDate._customDecrement1stTouchStartHandler, eventData);

    // Changes the image back to normal on touchend
    adf.mf.api.amx.addBubbleEventListener(
      decDateTimeTRowFCol, inputDate._tapEvents.end, inputDate._customDecrementTouchEndHandler, decDateTimeTRowFCol.id);

    // Handling DAY & MINUTE decrement here
    adf.mf.api.amx.addBubbleEventListener(
      decDateTimeTRowSCol, inputDate._tapEvents.start, inputDate._customDecrement2ndTouchStartHandler, eventData);

    // Changes the image back to normal on touchend
    adf.mf.api.amx.addBubbleEventListener(
      decDateTimeTRowSCol, inputDate._tapEvents.end, inputDate._customDecrementTouchEndHandler, decDateTimeTRowSCol.id);

    // Handling YEAR decrement & AM/PM toggle here
    adf.mf.api.amx.addBubbleEventListener(
      decDateTimeTRowTCol, inputDate._tapEvents.start, inputDate._customDecrement3rdTouchStartHandler, eventData);

    // Changes the image back to normal on touchend
    adf.mf.api.amx.addBubbleEventListener(
      decDateTimeTRowTCol, inputDate._tapEvents.end, inputDate._customDecrementTouchEndHandler, decDateTimeTRowTCol.id);
  };

  inputDate._customSetButtonTapHandler = function(event)
  {
    // Eat the event since this button is handling it:
    event.preventDefault();
    event.stopPropagation();

    var eventData = event.data;
    var amxNode             = eventData["amxNode"];
    var id                  = eventData["id"];
    var inputType           = eventData["inputType"];
    var rawValues           = eventData["rawValues"];
    var oldAndroidDateValue = eventData["oldAndroidDateValue"];

    var dateTriggerSpan = document.getElementById(id + "_triggerText");
    var chosenRawValue  = rawValues["chosen"];
    var newAndroidDateValue;
    var vceAndroid;

    if (inputDate._isRawValueEmpty(chosenRawValue)) // user cleared the value
    {
      androidDateObject = {
        ".null": true
      };
      newAndroidDateValue = androidDateObject;
      dateTriggerSpan.textContent = "";
    }
    else if (inputType == "datetime")
    {
      androidDateObject = inputDate._getDateObjectFromRawValue(chosenRawValue);
      newAndroidDateValue = androidDateObject.toISOString();
      dateTriggerSpan.textContent = inputDate._getLocalizedDateTimeTextFromRawValue(chosenRawValue);
    }
    else if (inputType == "time")
    {
      androidDateObject = inputDate._getDateObjectFromRawValue(chosenRawValue);
      newAndroidDateValue = androidDateObject.toISOString();
      dateTriggerSpan.textContent = inputDate._getLocalizedTimeTextFromRawValue(chosenRawValue);
    }
    else // inputType == date or not specified
    {
      androidDateObject = inputDate._getDateObjectFromRawValue(chosenRawValue);
      newAndroidDateValue = androidDateObject.toISOString();
      dateTriggerSpan.textContent = inputDate._getLocalizedDateTextFromRawValue(chosenRawValue);
    }

    // Process the valueChange AMX event:
    vceAndroid = new amx.ValueChangeEvent(oldAndroidDateValue, newAndroidDateValue);
    adf.mf.api.amx.processAmxEvent(amxNode, "valueChange", "value", newAndroidDateValue, vceAndroid);

    // Update the eventData in for future re-triggering:
    eventData["oldAndroidDateValue"] = newAndroidDateValue;
    eventData["rawValue"] = chosenRawValue;

    // Purge the picker:
    var dateTimePicker = document.getElementById(id + "_picker");
    var overlayElement = document.getElementById(id + "_overlay");
    adf.mf.api.amx.removeDomNode(dateTimePicker);
    adf.mf.api.amx.removeDomNode(overlayElement);
    dateTimePicker = null;
    overlayElement = null;
  };

  inputDate._customCancelButtonTapHandler = function(event)
  {
    // Eat the event since this button is handling it:
    event.preventDefault();
    event.stopPropagation();

    var id = event.data["id"];
    var dateTimePicker = document.getElementById(id + "_picker");
    var overlayElement = document.getElementById(id + "_overlay");
    adf.mf.api.amx.removeDomNode(dateTimePicker);
    adf.mf.api.amx.removeDomNode(overlayElement);
    dateTimePicker = null;
    overlayElement = null;
  };

  inputDate._customClearButtonTapHandler = function(event)
  {
    var eventData      = event.data;
    var id             = eventData["id"];
    var rawValues      = eventData["rawValues"];
    var chosenRawValue = rawValues["chosen"];

    // Clear the chosen value:
    inputDate._assignRawValueMembers(chosenRawValue, null);

    // Update the display:
    var incDateTimeSRowFCol = document.getElementById(id + "_txt1");
    var incDateTimeSRowSCol = document.getElementById(id + "_txt2");
    var incDateTimeSRowTCol = document.getElementById(id + "_txt3");
    incDateTimeSRowFCol.textContent = "";
    incDateTimeSRowSCol.textContent = "";
    incDateTimeSRowTCol.textContent = "";
  };

  inputDate._customTimeTabTapHandler = function(event)
  {
    var eventData           = event.data;
    var id                  = eventData["id"];
    var rawValues           = eventData["rawValues"];
    var chosenRawValue      = rawValues["chosen"];
    var lastRawValue        = rawValues["last"];
    var dateTabDiv          = document.getElementById(id + "_dateTab");
    var timeTabDiv          = document.getElementById(id + "_timeTab");

    if (timeTabDiv.classList.contains("amx-inputDate-picker-timeTab-selected"))
    {
      // Revert the chosen value back to the last value:
      inputDate._assignRawValueMembers(chosenRawValue, lastRawValue);
    }
    else // we are changing tabs
    {
      // Preserve the chosen value by assigning it to the last value:
      inputDate._assignRawValueMembers(lastRawValue, chosenRawValue);
    }

    // Update the values that are shown in the picker's UI:
    inputDate._populateDate(id, rawValues, true);
    inputDate._populateTime(id, rawValues, true); // Do this last so the spinner shows the time

    // Ensure the proper tab is selected:
    dateTabDiv.className = "amx-inputDate-picker-dateTab";
    timeTabDiv.className = "amx-inputDate-picker-timeTab-selected";
  };

  inputDate._customDateTabTapHandler = function(event)
  {
    var eventData           = event.data;
    var id                  = eventData["id"];
    var rawValues           = eventData["rawValues"];
    var chosenRawValue      = rawValues["chosen"];
    var lastRawValue        = rawValues["last"];
    var dateTabDiv          = document.getElementById(id + "_dateTab");
    var timeTabDiv          = document.getElementById(id + "_timeTab");

    if (dateTabDiv.classList.contains("amx-inputDate-picker-dateTab-selected"))
    {
      // Revert the chosen value back to the last value:
      inputDate._assignRawValueMembers(chosenRawValue, lastRawValue);
    }
    else // we are changing tabs
    {
      // Preserve the chosen value by assigning it to the last value:
      inputDate._assignRawValueMembers(lastRawValue, chosenRawValue);
    }

    // Update the values that are shown in the picker's UI:
    inputDate._populateTime(id, rawValues, true);
    inputDate._populateDate(id, rawValues, true); // Do this last so the spinner shows the date

    // Ensure the proper tab is selected:
    dateTabDiv.className = "amx-inputDate-picker-dateTab-selected";
    timeTabDiv.className = "amx-inputDate-picker-timeTab";
  };

  inputDate._customIncrement1stTouchStartHandler = function(event)
  {
    // Handles month and hour incrementing (if US English format):
    inputDate._handleSpinnerIncrement(event, 1);
  };

  inputDate._customIncrement2ndTouchStartHandler = function(event)
  {
    // Handles day and minute incrementing (if US English format):
    inputDate._handleSpinnerIncrement(event, 2);
  };

  inputDate._customIncrement3rdTouchStartHandler = function(event)
  {
    // Handles year and AM/PM incrementing (if US English format):
    inputDate._handleSpinnerIncrement(event, 3);
  };

  inputDate._handleSpinnerIncrement = function(event, elementSubIdNumber)
  {
    var eventData           = event.data;
    var id                  = eventData["id"];
    var inputType           = eventData["inputType"];
    var rawValues           = eventData["rawValues"];
    var chosenRawValue      = rawValues["chosen"];
    var spinningDateValues  = inputDate._isSpinningDateValues(id, inputType);
    var spinnerElement      = document.getElementById(id + "_inc" + elementSubIdNumber);

    // Change the button image to the highlighted version on touch start:
    inputDate._customIncrementTouchStartStyling(spinnerElement);

    // Make the value non-cleared if applicable:
    inputDate._choosePresentValueIfEmpty(id, rawValues, spinningDateValues);

    if (spinningDateValues) // dealing with the a date
    {
      var dateFormatOrder = inputDate._getDateFormatOrderObject();
      var dateFormatType = dateFormatOrder[elementSubIdNumber-1];
      if (dateFormatType == "month")
      {
        if (chosenRawValue["monthIndex"] < 11)
          chosenRawValue["monthIndex"]++;
        else
          chosenRawValue["monthIndex"] = 0;
      }
      else if (dateFormatType == "day")
      {
        var daysForThisMonth = inputDate._daysInMonth(chosenRawValue);
        if (chosenRawValue["dayNumber"] < daysForThisMonth)
          chosenRawValue["dayNumber"]++;
        else
          chosenRawValue["dayNumber"] = 1;
      }
      else // year
      {
        chosenRawValue["year"]++;
      }
      inputDate._populateDate(id, rawValues, false);
    }
    else // dealing with a time (update the non-presentation value)
    {
      var timeFormatOrder = inputDate._getTimeFormatOrderObject();
      var timeFormatType = timeFormatOrder[elementSubIdNumber-1];
      if (timeFormatType == "hours")
      {
        if (chosenRawValue["hour1to12"] < 12)
          chosenRawValue["hour1to12"]++;
        else
          chosenRawValue["hour1to12"] = 1;

        if (chosenRawValue["hour1to12"] == 12) // incremented to 12
          chosenRawValue["isPm"] = !chosenRawValue["isPm"]; // switch between AM and PM
      }
      else if (timeFormatType == "min")
      {
        if (chosenRawValue["min"] < 59)
          chosenRawValue["min"]++;
        else
          chosenRawValue["min"] = 0;
      }
      else // amPm
      {
        chosenRawValue["isPm"] = !chosenRawValue["isPm"];
      }
      inputDate._populateTime(id, rawValues, false);
    }
  };

  inputDate._customDecrement1stTouchStartHandler = function(event)
  {
    // Handles month and hour decrementing (if US English format):
    inputDate._handleSpinnerDecrement(event, 1);
  };

  inputDate._customDecrement2ndTouchStartHandler = function(event)
  {
    // Handles day and minute decrementing (if US English format):
    inputDate._handleSpinnerDecrement(event, 2);
  };

  inputDate._customDecrement3rdTouchStartHandler = function(event)
  {
    // Handles year and AM/PM decrementing (if US English format):
    inputDate._handleSpinnerDecrement(event, 3);
  };

  inputDate._handleSpinnerDecrement = function(event, elementSubIdNumber)
  {
    var eventData           = event.data;
    var id                  = eventData["id"];
    var inputType           = eventData["inputType"];
    var rawValues           = eventData["rawValues"];
    var chosenRawValue      = rawValues["chosen"];
    var spinningDateValues  = inputDate._isSpinningDateValues(id, inputType);
    var spinnerElement      = document.getElementById(id + "_dec" + elementSubIdNumber);

    // Change the button image to the highlighted version on touch start:
    inputDate._customDecrementTouchStartStyling(spinnerElement);

    // Make the value non-cleared if applicable:
    inputDate._choosePresentValueIfEmpty(id, rawValues, spinningDateValues);

    if (spinningDateValues) // dealing with the a date
    {
      var dateFormatOrder = inputDate._getDateFormatOrderObject();
      var dateFormatType = dateFormatOrder[elementSubIdNumber-1];
      if (dateFormatType == "month")
      {
        if (chosenRawValue["monthIndex"] > 0)
          chosenRawValue["monthIndex"]--;
        else
          chosenRawValue["monthIndex"] = 11;
      }
      else if (dateFormatType == "day")
      {
        var daysForThisMonth = inputDate._daysInMonth(chosenRawValue);
        if (chosenRawValue["dayNumber"] > 1 &&
            chosenRawValue["dayNumber"] <= daysForThisMonth)
          chosenRawValue["dayNumber"]--;
        else
          chosenRawValue["dayNumber"] = daysForThisMonth;
      }
      else // year
      {
        chosenRawValue["year"]--;
      }
      inputDate._populateDate(id, rawValues, false);
    }
    else // dealing with a time (update the non-presentation value)
    {
      var timeFormatOrder = inputDate._getTimeFormatOrderObject();
      var timeFormatType = timeFormatOrder[elementSubIdNumber-1];
      if (timeFormatType == "hours")
      {
        if (chosenRawValue["hour1to12"] > 1)
          chosenRawValue["hour1to12"]--;
        else
          chosenRawValue["hour1to12"] = 12;

        if (chosenRawValue["hour1to12"] == 11) // decremented from 12
          chosenRawValue["isPm"] = !chosenRawValue["isPm"]; // switch between AM and PM
      }
      else if (timeFormatType == "min")
      {
        if (chosenRawValue["min"] > 0)
          chosenRawValue["min"]--;
        else
          chosenRawValue["min"] = 59;
      }
      else // amPm
      {
        chosenRawValue["isPm"] = !chosenRawValue["isPm"];
      }
      inputDate._populateTime(id, rawValues, false);
    }
  };

  inputDate._customIncrementTouchEndHandler = function(event)
  {
    var spinnerId = event.data;
    var spinnerElement = document.getElementById(spinnerId);
    spinnerElement.classList.remove("amx-inputDate-incrementButton-selected");
    spinnerElement.classList.add("amx-inputDate-incrementButton");
  };

  inputDate._customDecrementTouchEndHandler = function(event)
  {
    var spinnerId = event.data;
    var spinnerElement = document.getElementById(spinnerId);
    spinnerElement.classList.remove("amx-inputDate-decrementButton-selected");
    spinnerElement.classList.add("amx-inputDate-decrementButton");
  };

  inputDate._customIncrementTouchStartStyling = function(spinnerElement)
  {
    spinnerElement.classList.remove("amx-inputDate-incrementButton");
    spinnerElement.classList.add("amx-inputDate-incrementButton-selected");
  };

  inputDate._customDecrementTouchStartStyling = function(spinnerElement)
  {
    spinnerElement.classList.remove("amx-inputDate-decrementButton");
    spinnerElement.classList.add("amx-inputDate-decrementButton-selected");
  };

  inputDate._isSpinningDateValues = function(id, inputType)
  {
    // We are dealing with date spinners if the "date" tab of the datetime mode
    // is selected or if inputType is either date or unspecified:
    var dateTabDiv = document.getElementById(id + "_dateTab");
    var spinningDateValues =
      dateTabDiv.classList.contains("amx-inputDate-picker-dateTab-selected") ||
      (inputType != "datetime" && inputType != "time");
    return spinningDateValues;
  }

  inputDate._choosePresentValueIfEmpty = function(id, rawValues, dealingWithDateSpinners)
  {
    var chosenRawValue  = rawValues["chosen"];
    var presentRawValue = rawValues["present"];
    if (inputDate._isRawValueEmpty(chosenRawValue))
    {
      // The value was cleared so we need to set it to the present point in time to adjust it:
      inputDate._assignRawValueMembers(chosenRawValue, presentRawValue);
      if (dealingWithDateSpinners)
      {
        inputDate._populateTime(id, rawValues, true);
        inputDate._populateDate(id, rawValues, true); // Do this last so the spinner shows the date
      }
      else
      {
        inputDate._populateDate(id, rawValues, true);
        inputDate._populateTime(id, rawValues, true); // Do this last so the spinner shows the time
      }
    }
  };

  inputDate._createHtml5InputDate = function(amxNode, field, value, inputType, dateObject)
  {
    var dateLabel = document.createElement("input");
    dateLabel.setAttribute("id", amxNode.getId() + "_trigger");
    dateLabel.setAttribute("class", "amx-inputDate-content");
    dateLabel.setAttribute("type", inputType);
    field.fieldValue.appendChild(dateLabel);
    if (inputType == "datetime")
    {
      // iOS 7 dropped type="datetime" so we have to use type="datetime-local"
      // and convert the actual value between those types.
      // Since we are giving the browser a value, it wants a datetime-local
      // value and we need to convert it from a datetime value since that's our
      // tag's API:
      dateLabel.setAttribute("type", "datetime-local");
      dateLabel.setAttribute("data-datetime-value", value);
      dateLabel.value = inputDate._toDateTimeLocalString(value);
    }
    else // use the value directly
    {
      dateLabel.value = value;
    }
    adf.mf.internal.amx._setNonPrimitiveElementData(dateLabel, "value", dateObject);
    adf.mf.internal.amx.registerFocus(dateLabel);
    adf.mf.internal.amx.registerBlur(
      dateLabel,
      function(event)
      {
        var oldDate = adf.mf.internal.amx._getNonPrimitiveElementData(dateLabel, "value");
        var newDate;
        if (dateLabel.value === "")
        {
          // The value is set to "" when the user clicks "Clear" on the picker.  When that happens we simply want to set the new value to null
          newDate = {};
          newDate[".null"] = true;
        }
        else // The value is an actual date/time so we create a Date object
        {
          if (inputType === "time")
          {
            if (inputDate._isValidDate(oldDate))
            {
              newDate = new Date(oldDate.getTime());
            }
            else
            {
              newDate = new Date();
            }
            adf.mf.internal.amx.updateTime(newDate, dateLabel.value);
          }
          else if (inputType === "date")
          {
            if (inputDate._isValidDate(oldDate))
            {
              newDate = new Date(oldDate.getTime());
            }
            else
            {
              newDate = new Date();
            }
            adf.mf.internal.amx.updateDate(newDate, dateLabel.value);
          }
          else // datetime
          {
            // iOS 7 dropped type="datetime" so we have to use type="datetime-local"
            // and convert the actual value between those types.
            // Since we are asking the browser for a value, it is now giving us
            // a datetime-local value and we need to convert it to a datetime
            // value since that's our tag's API:
            var dateTimeValue = dateLabel.value;
            dateLabel.setAttribute("data-datetime-value", dateTimeValue);
            dateTimeValue =
              inputDate._toDateTimeIsoString(inputDate._fillDateText(dateTimeValue));

            newDate = new Date(dateTimeValue);
            if (inputDate._isValidDate(oldDate))
            {
              newDate.setMilliseconds(oldDate.getMilliseconds());
            }
          }
        }

        // if old and new date are null or if they represent the same time, we don't fire an event
        if ((newDate[".null"] == true && oldDate[".null"] == true) ||
          (inputDate._isValidDate(newDate) && inputDate._isValidDate(oldDate) && newDate.getTime() == oldDate.getTime()))
        {
          // do nothing
        }
        else
        {
          // old and new date are different so fire the event
          var newValue;
          if (inputDate._isValidDate(newDate))
          {
            newValue = newDate.toISOString(); // a predictable 24-character ISO value
            newValue = newValue.replace(/:\d\d.\d\d\d/, ":00.000"); // zero out seconds and millis
          }
          else
          {
            newValue = newDate;
          }

          var oldValue;
          if (inputDate._isValidDate(oldDate))
          {
            oldValue = oldDate.toISOString();
          }
          else
          {
            oldValue = oldDate;
          }

          var vce = new amx.ValueChangeEvent(oldValue, newValue);
          adf.mf.api.amx.processAmxEvent(amxNode, "valueChange", "value", newValue, vce);
        }

        adf.mf.internal.amx._setNonPrimitiveElementData(dateLabel, "value", newDate);
      });
    adf.mf.api.amx.addBubbleEventListener(dateLabel, "tap", function(event)
    {
      // Stop propagation of the event to parent components
      event.stopPropagation();
    });

    // if disabled is set to true for iOS
    var disabled = amxNode.getAttribute("disabled");
    if (disabled == true)
    {
      dateLabel.setAttribute("disabled", disabled);
      // Adding WAI-ARIA Attribute for the disabled state
      dateLabel.setAttribute("aria-disabled", disabled);
    }

    // Add a clear button if the browser doesn't provide one:
    var needCustomClearButton = (adf.mf.internal.amx.agent["type"] == "UWP");
    if (needCustomClearButton)
    {
      var readOnly = adf.mf.api.amx.isValueTrue(amxNode.getAttribute("readOnly"));
      if (disabled != true && readOnly != true)
      {
        var clearButton = document.createElement("a");
        clearButton.className = "amx-inputDate-clear";
        field.fieldValue.appendChild(clearButton);
        adf.mf.api.amx.addBubbleEventListener(clearButton, "tap",
          function(event)
          {
            // Stop propagation of the event to parent components
            event.stopPropagation();
            event.preventDefault();

            dateLabel.value = "";

            var oldDate = adf.mf.internal.amx._getNonPrimitiveElementData(dateLabel, "value");
            var newDate = {};
            newDate[".null"] = true;

            // if old and new date are null, we don't fire an event
            if (newDate[".null"] == true && oldDate[".null"] != true)
            {
              var oldValue;
              if (inputDate._isValidDate(oldDate))
              {
                oldValue = oldDate.toISOString();
              }
              else
              {
                oldValue = oldDate;
              }

              var newValue = newDate;
              var vce = new amx.ValueChangeEvent(oldValue, newValue);
              adf.mf.api.amx.processAmxEvent(amxNode, "valueChange", "value", newValue, vce);
              adf.mf.internal.amx._setNonPrimitiveElementData(dateLabel, "value", newDate);
            }
          });
      }
    }

    // Set wai-aria required attribute to true if required/showRequired is set to true
    var isRequired = (adf.mf.api.amx.isValueTrue(amxNode.getAttribute("showRequired")) ||
                   adf.mf.api.amx.isValueTrue(amxNode.getAttribute("required")));
    if (isRequired)
      dateLabel.setAttribute("aria-required", "true");
  };

  inputDate.setUnitTestFormat = function(datePattern, timePattern)
  {
    if (document.querySelector(".amx-automation") == null &&
      !adf.mf.environment.profile.mockData)
      return;

    if (inputDate._defaultDatePattern == null)
      inputDate._defaultDatePattern = inputDate._datePattern; // set up the default
    if ((datePattern == null || datePattern == "") && inputDate._defaultDatePattern != null)
      datePattern = inputDate._defaultDatePattern; // reset to default

    if (inputDate._defaultTimePattern == null)
      inputDate._defaultTimePattern = inputDate._timePattern; // set up the default
    if ((timePattern == null || timePattern == "") && inputDate._defaultTimePattern != null)
      timePattern = inputDate._defaultTimePattern; // reset to default

    if (datePattern != null)
    {
      if (inputDate._defaultDatePattern == null)
        inputDate._defaultDatePattern = inputDate._datePattern;
      inputDate._datePattern = datePattern;
      inputDate._datePatternFetched = true;

      // reset things so they will be recomputed
      inputDate._dateFormatOrder = null;
    }

    if (timePattern != null)
    {
      if (inputDate._defaultTimePattern == null)
        inputDate._defaultTimePattern = inputDate._timePattern;
      inputDate._timePattern = timePattern;
      inputDate._timePatternFetched = true;

      // reset things so they will be recomputed
      inputDate._timeFormatOrder = null;
    }

    // Re-render the view:
    adf.mf.api.amx.AmxNode.getAmxNodeForElement(document.querySelector(".amx-view")).rerender();
  };

  /*
   * Examples of datetime:
   * - 2013-10-15T20:40:20.000Z
   * - 2013-10-15T14:40:20Z
   *
   * Examples of datetime-local:
   * - 2013-10-15T14:40:20.000
   * - 2013-10-15T14:40:20.000+00:00
   * - 2013-10-15T14:40:20.000-00:00
   * - 2013-10-15T14:40:20
   * - 2013-10-15T14:40:20+00:00
   * - 2013-10-15T14:40:20-00:00
   */

  /**
   * Converts an HTML5 input type="datetime" value to a type="datetime-local" value.
   * @param {String} dateTimeIsoString an HTML5 input type="datetime" value
   * @return {String} blank or an HTML5 input type="datetime-local" value
   */
  inputDate._toDateTimeLocalString = function(dateTimeIsoString)
  {
    try
    {
      if (dateTimeIsoString == null || dateTimeIsoString == "")
        return "";

      // Use the current local timezone offset to do the conversion:
      var dateObj = new Date(dateTimeIsoString);
      var timezoneOffset = dateObj.getTimezoneOffset();
      dateObj.setMinutes(dateObj.getMinutes() - timezoneOffset);
      var dateTimeLocalString = dateObj.toISOString().replace("Z", "");
      return inputDate._fillDateText(dateTimeLocalString);
    }
    catch (e)
    {
      return "";
    }
  };

  /**
   * Converts an HTML5 input type="datetime-local" value to a type="datetime" value.
   * @param {String} dateTimeLocalString an HTML5 input type="datetime-local" value
   * @return {String} blank or an HTML5 input type="datetime" value
   */
  inputDate._toDateTimeIsoString = function(dateTimeLocalString)
  {
    try
    {
      if (dateTimeLocalString == null || dateTimeLocalString == "")
        return "";

      // Format the local string for better browser support (e.g. Firefox 21):
      var tIndex = dateTimeLocalString.indexOf("T");
      var timePortion = dateTimeLocalString.substring(tIndex);
      if (timePortion.indexOf("-") == -1 && timePortion.indexOf("+") == -1)
      {
        // Then there was no timezone offset given so let's add it:
        dateTimeLocalString += "+00:00";
      }

      // Use the current local timezone offset to do the conversion:
      var dateObj = new Date(dateTimeLocalString);
      var timezoneOffset = dateObj.getTimezoneOffset();
      dateObj.setMinutes(dateObj.getMinutes() + timezoneOffset);
      var dateTimeIsoString = dateObj.toISOString();
      return inputDate._fillDateText(dateTimeIsoString);
    }
    catch (e)
    {
      return "";
    }
  };

})();

