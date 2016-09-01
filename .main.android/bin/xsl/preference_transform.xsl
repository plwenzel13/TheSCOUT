<?xml version="1.0" encoding="windows-1252" ?>
<!-- Copyright (c) 2011, 2014, Oracle and/or its affiliates. 
All rights reserved.-->
<!-- 
  This XSL document transforms the preferences contained in maf-application.xml and 
  maf-feature.xml from MAF definitions to corresponding Android definitions.  This XSL must 
  first be transformed by the "SetIncludes.xsl" before it can be used.  The "SetIncludes.xsl" sets 
  the location of the XSL file that this file includes - namely "TransformUtilities.xsl" (see the 
  <xsl:include> element at the root of
  this XSL). 
   
-->
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:adfmf="http://xmlns.oracle.com/adf/mf"
                xmlns:android="http://schemas.android.com/apk/res/android"
                xmlns:ora="http://www.oracle.com/XSL/Transform/java" 
                xmlns:xlf="urn:oasis:names:tc:xliff:document:1.1"
                xmlns:FileUtils=
                      "http://www.oracle.com/XSL/Transform/java/oracle.tools.maf.build.settings.FileUtils"
                exclude-result-prefixes="adfmf xlf">
  <!-- 
    NOTE:  the exclude-result-prefixes attribute above must be specified in order to prevent
           the adfmf namespace of http://xmlns.oracle.com/adfmf from appearing in the
           output file(s).
    -->
  <!-- 
    Root folder where the Android maf_preferences.xml, maf_strings.xml and maf_arrays.xml should be created 
  -->
  
  <xsl:param name="XSL_PARAM_targetDirectoryPath" 
             required="yes" 
             as="xsl:string"/>
  
  <!-- Application package name.-->
  <xsl:param name="XSL_PARAM_applicationPackage" 
             required="yes" 
             as="xsl:string"/>
  
  <!--
  This parameter is an unordered sequence of zero or more "LocalData" elements,
  as specified in the "as" attribute of the parameter declaration.

  Each LocaleData element identifies a locale.  The locale is specified as two different
  representations corresponding to the following two attributes.  Both attributes must
  both be populated.
  
    oracleLocale   <- Standard (canonical) representation of a locale extracted from
                      an XLIFF file name suffix. Each oracleLocale attribute is
                      used to construct the name of a localized XLIFF file.
                      For the definition of a valid Oracle locale,
                      see Java method "isValidOracleLocale" in class
                      "oracle.adfmf.common.OracleLocale".
    
    androidLocale  <- Corresponding Android representation of a locale specified
                      in attribute oracleLocale. Each androidLocale value is used
                      to construct a localized directory name for Android string
                      resources. Each locale value corresponds to a custom Android
                      localization pattern.  The Android locale pattern is described
                      in table entry "Language and region" in section
                      "Providing Alternate Resources" in the Android localization
                      document at 
                      "http://developer.android.com/guide/topics/resources/providing-resources.html#
                      AlternativeResources".

  The following table shows example attribute values.

    oracleLocale    androidLocale
    ************    ***********************
    en              en
    pt              pt
    pt_PT           pt-rPT
    fr              fr
    fr_FR           fr-rFR

   The oracle and Android locale values are different only when the Oracle locale
   includes a country code appended to the language code.
  -->
  <xsl:param name="XSL_PARAM_LocaleDataElements" 
             required="yes" 
             as="xsl:element(LocaleData)*"/>
  
  <!-- A XML document containing the list of FAR JAR URL paths.  Used when processing features -->
  <xsl:param name="XSL_PARAM_FeatureArchiveUrlNodeSet" 
             required="yes" 
             as="document-node()"/>
  
  <!-- A relative path to the location of maf-feature.xml in a FAR JAR file. -->
  <xsl:param name="XSL_PARAM_FeatureXmlRelativePathInFAR" 
             required="yes" 
             as="xsl:string"/>
  
  <!-- A path to the location of the XLIFF files -->
  <xsl:param name="XSL_PARAM_applicationXliffBasePath" 
             required="yes" 
             as="xsl:string"/>
  
  <xsl:output method="xml" indent="yes" name="xml"/>
  
  <!-- The namespace alias required in the Android maf_preferences.xml file in the root element. -->
  <xsl:variable name="g_nsPrefix" select="'adfmf'"/>
  
  <!-- The namespace URI required in the Android maf_preferences.xml file in the root element. -->
  <xsl:variable name="g_nsNamespace"
                select="concat ('http://schemas.android.com/apk/res/', 
                                $XSL_PARAM_applicationPackage)"/>

  <!-- Name of the Android preference 'title' attribute -->                
  <xsl:variable name="g_androidTitleAttributeName" select="'title'"/>
  
  <!-- Name of the Android preference 'defaultValue' attribute -->
  <xsl:variable name="g_androidDefaultAttributeName" select="'defaultValue'"/>
  
  <!-- Name of the ADFmf preference 'default' attribute -->
  <xsl:variable name="g_adfmfDefaultAttributeName" select="'default'"/>
  
  <!-- Name of the ADFmf preference 'label' attribute -->
  <xsl:variable name="g_adfmfLabelAttributeName" select="'label'"/>
  
  <!-- Name of the ADFmf preference 'id' attribute -->
  <xsl:variable name="g_adfmfIdAttributeName" select="'id'"/>
  
  <!-- Name of the ADFmf preference 'name' attribute -->
  <xsl:variable name="g_adfmfNameAttributeName" select="'name'"/>
  
  <!-- Name of the ADFmf preference 'value' attribute -->
  <xsl:variable name="g_adfmfValueAttributeName" select="'value'"/>

  <!-- Used to construct an Android string identifer.  Separates a
       preference identifier value from the Android attribute -->
  <xsl:variable name="g_androidAttributeValueSeparator" select="'___'"/>

  <!-- . character -->  
  <xsl:variable name="g_periodChar" select="'.'"/>

  <!-- _ character -->  
  <xsl:variable name="g_underscoreChar" select="'_'"/>
  
  <!-- empty string -->
  <xsl:variable name="g_emptyString" select="''"/>
  
  <!-- - character used as the separator for locale specific directory names -->
  <xsl:variable name="g_androidLocaleSeparator" select="'-'"/>
  
  <!-- Non-escaped and escaped definitions for apostrophe (') -->
  <xsl:variable name="g_APOSTROPHE">
    <xsl:text>'</xsl:text>
  </xsl:variable>
  
  <xsl:variable name="g_ESCAPED_APOSTROPHE">
    <xsl:text>\'</xsl:text>
  </xsl:variable>

  <!-- Non-escaped and escaped definitions for double quotes (") -->
  <xsl:variable name="g_DOUBLE_QUOTE">
    <xsl:text>"</xsl:text>
  </xsl:variable>
  
  <xsl:variable name="g_ESCAPED_DOUBLE_QUOTE">
    <xsl:text>\"</xsl:text>
  </xsl:variable>

  <!-- Non-escaped and escaped definitions for backslash (\) -->
  <xsl:variable name="g_BACK_SLASH">
    <xsl:text>\</xsl:text>
  </xsl:variable>
  
  <xsl:variable name="g_ESCAPED_BACK_SLASH">
    <xsl:text>\\</xsl:text>
  </xsl:variable>
  
  <!-- Maps non-escaped strings to corresponding escaped strings.  Android
       uses "\" to escape XML values.  For example, a MAF boolean
       preference definition of:
       <adfmf:preferenceBoolean id="foo" label="Don't Load Images\Icons"/>
       must be translated in maf_strings.xml as:
       <string name="foo">Don\'t Load Images\\Icons</string>
       in order for the preference to appear as "Don't Load Images\Icons"
       at runtime.
  -->
  <xsl:variable name="g_ESCAPE_CHARACTER_MAP">
    <android:entries>
      <android:entry>
        <android:nonescaped><xsl:value-of select="$g_BACK_SLASH"/></android:nonescaped>
        <android:escaped><xsl:value-of select="$g_ESCAPED_BACK_SLASH"/></android:escaped>
      </android:entry>
      <android:entry>
        <android:nonescaped><xsl:value-of select="$g_APOSTROPHE"/></android:nonescaped>
        <android:escaped><xsl:value-of select="$g_ESCAPED_APOSTROPHE"/></android:escaped>
      </android:entry>
      <android:entry>
        <android:nonescaped><xsl:value-of select="$g_DOUBLE_QUOTE"/></android:nonescaped>
        <android:escaped><xsl:value-of select="$g_ESCAPED_DOUBLE_QUOTE"/></android:escaped>
      </android:entry>
    </android:entries>
  </xsl:variable>
  <xsl:variable name="g_XLIFF_FILE_EXTENSION" 
                select="'.xlf'" 
                as="xsl:string"/>
                
  <xsl:variable name="g_LANGUAGE_CODE_SEPARATOR" 
                select="'_'" 
                as="xsl:string"/>
                
  <xsl:variable name="g_TARGET_STRING_RESOURCE_FILE_NAME" 
                select="'Localizable.strings'" 
                as="xsl:string"/>
                
  <xsl:variable name="g_STRING_RESOURCE_DELIMITER_START" 
                select="'#{'" 
                as="xsl:string"/>
                
  <xsl:variable name="g_STRING_RESOURCE_DELIMITER_END" 
                select="'}'" 
                as="xsl:string"/>
                
  <xsl:variable name="g_STRING_RESOURCE_DELIMITOR_MIDDLE" 
                select="'.'" 
                as="xsl:string"/>
                
  <xsl:variable name="g_FILE_PATH_SEPARATOR" 
                select="'/'" 
                as="xsl:string"/>
  
  <!--
  Dot separator character to use between tokens.
  TODO: This constant is copied (without change) from iOS XSL file "PreferenceTransform.xsl"
        and also is duplicated in iOS XSL file "TransformStringResources.xsl".  So the iOS
        should be refactored to use this constant if/when it is updated to use this 
        TransformUtilities.xsl file.
  -->
  <xsl:variable name="g_TOKEN_DELIMITOR_DOT" select="'.'" as="xsl:string"/>

  <!--
  Constant string literal that represents the prefix [' to a decorated
  string ID.
  TODO: This constant is copied (without change) from iOS XSL file "PreferenceTransform.xsl"
        and also is duplicated in iOS XSL file "TransformStringResources.xsl".  So the iOS
        should be refactored to use this constant if/when it is updated to use this 
        TransformUtilities.xsl file.
  -->
  <xsl:variable name="g_PREFIX_TO_STRING_ID_THAT_CONTAINS_DOTS"
                as="xsl:string">
    <!--
    Initializing a string with an embedded apostrophe can be complicated when using
    using "xsl:variable/@select". Therefore, we use xsl:text to simplify how the string
    is specified.  This technique of using xsl:text to simplify a string definition having
    embedded quotes is taken from page 533 of book "XSLT 2.0 and XPath 2.0",
    4th edition, Programmer's Reference, by Michael Kay.
    -->
    <xsl:text>['</xsl:text>
  </xsl:variable>

  <!--
  Constant string literal that represents the suffix '] to a decorated
  string ID.
  TODO: This constant is copied (without change) from iOS XSL file "PreferenceTransform.xsl"
        and also is duplicated in iOS XSL file "TransformStringResources.xsl".  So the iOS
        should be refactored to use this constant if/when it is updated to use this 
        TransformUtilities.xsl file.
  -->          
  <xsl:variable name="g_SUFFIX_TO_STRING_ID_THAT_CONTAINS_DOTS"
                as="xsl:string">
    <!--
    Initializing a string with an embedded apostrophe can be complicated when using
    using "xsl:variable/@select". Therefore, we use xsl:text to simplify how the string
    is specified.  This technique of using xsl:text to simplify a string definition having
    embedded quotes is taken from page 533 of book "XSLT 2.0 and XPath 2.0",
    4th edition, Programmer's Reference, by Michael Kay.
    -->
    <xsl:text>']</xsl:text>
  </xsl:variable>
  <!--
  Prefix token that must appear first for any iOS preference element
  or iOS string resource that originates from adfmf:application.
  This constant is duplicated in file "TransformStringResources.xsl".
  -->
  <xsl:variable name="g_APPLICATION_CONTEXT_TOKEN" 
                select="'application'" 
                as="xsl:string"/>
  
  <!--
  Prefix token that must appear first for any iOS preference element
  or iOS string resource that originates from adfmf:feature.
  This constant is duplicated in file "TransformStringResources.xsl".
  -->
  <xsl:variable name="g_FEATURE_CONTEXT_TOKEN" 
                select="'feature'" 
                as="xsl:string"/>
  
  <!-- Application token that must preceded each resource string identifier that comes from 
       "maf-application.xml". 
  -->
  <xsl:variable name="g_APPLICATION_PREFIX" 
                select="'application'" 
                as="xsl:string"/>

  <!-- Feature token that must preceded each resource string identifier that comes from 
       "maf-application.xml". 
  -->
  <xsl:variable name="g_FEATURE_PREFIX" select="'feature'" as="xsl:string"/>

  <!-- Use this key to find a particular trans-unit with a specified @id attribute value -->
  <xsl:key name="xliffStringKey" 
           match="xlf:trans-unit" 
           use="@id"/>

  <!-- Use this key to find a particular feature with a specified @id attribute value -->
  <xsl:key name="featureKey" 
           match="adfmf:feature" 
           use="@id"/>
  
   <!-- Get the set of adfmf:featureReference elements, in document order, from file 
        "maf-application.xml".  We know that adfmf:featureReference elements are direct 
        descendents of the outtermost element. Therefore, we use prefix "/*/" to ensure efficiency 
        because using select value "//adfmf:featureReference" might result in a search of the entire
        document, depending on the xslt parser.
   -->
  <xsl:variable name="gFeatureReferenceSet" select="/*/adfmf:featureReference"/>
  <!-- *********************************************************************************************
    This function returns true if the given attribute start with
    #{ and ends with }
    
    param:  p_attribute - a XML attribute to test if it has a string resource reference
    return: true if the given attribute starts with #{ and ends with }
            false otherwise.
  -->
  <xsl:function name="adfmf:hasStringResourceReference" as="xsl:boolean">
    <xsl:param name="p_attribute" 
               as="attribute()" 
               required="yes"/>  
    <xsl:choose>
      <xsl:when test="starts-with($p_attribute, $g_STRING_RESOURCE_DELIMITER_START) and 
                      ends-with($p_attribute, $g_STRING_RESOURCE_DELIMITER_END)">
        <xsl:sequence select="true()"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:sequence select="false()"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>

  <!-- *********************************************************************************************
    This function loads the maf-feature.xml specified by the given URL as a 
    xsl:document-node
    param:  p_featureArchiveUrl a path to the location of a FAR JAR file.  Must
                                be a jar style path.
    return: a xsl:document-node() representation of the maf-feature.xml file.
  -->
  <xsl:function name="adfmf:loadFeatureDocument" as="document-node()">
    <xsl:param name="p_featureArchiveUrl" 
               as="xsl:string" 
               required="yes"/>

    <xsl:variable name="featureXmlUrl" 
                  select="concat($p_featureArchiveUrl, $XSL_PARAM_FeatureXmlRelativePathInFAR)"/>
    
    <xsl:if test="FileUtils:doesUrlResourceExist($p_featureArchiveUrl) = true()"> 
      <xsl:sequence select="document($featureXmlUrl)"/>
    </xsl:if>
  </xsl:function>

  <!-- ******************************************************************************************
  Get all ancestor-or-self elements in document order for the specified preference element.
  Element "adfmf:features" is excluded from the list because it's unique within file
  "maf-feature.xml" and doesn't have an "id" attribute.
  
  IMPORTANT: This function is a duplicate of the same-named function in iOS
  file "PreferenceTransform.xsl"
  -->
  <xsl:function name="adfmf:getFeaturePreferenceAncestorList" as="xsl:string">
    <!-- 
    This parameter specifies the preference element whose identifier will be generated.
    It must be a descendant of "adfmf:feature".
    -->
    <xsl:param name="elementToIdentify" as="element(adfmf:*)"/>

    <!--
    Get all ancestor-or-self elements in document order except for element adfmf:features.
    
    Pages 607 and 1228 of "XSLT 2.0 and XPath 2.0", 4th Edition, indicate that the result
    of any axis step is always in forward document order. This also applies to reverse axis,
    such as "ancestor-or-self". However, the Oracle XSLT processor has a bug in
    "ancestor-or-self" that causes it to sometimes return nodes in reverse document order.
    
    See Bug 13088996 - ancestor-or-self axis returns nodes in reverse document order

    For both iOS and Android, this bug does not occur for preference elements in
    file "maf-application.xml".

    Furthermore, for Android the bug in "ancestor-or-self" seems to consistently occur for
    preferences in "maf-feature.xml".  Until recently, iOS usage also seemed consistent.
    However, the following analysis shows this bug now occurs sporadically when iOS uses
    "ancestor-or-self" for preferences in "maf-feature.xml".
    
    At the time of this writing, this bug occurs only when both the following are true for iOS.
    
      1. when building a plist file name that results from an element of type
         "/adfmf:features/adfmf:feature//adfmf:preferencePage".
         
      2. and when the file name is used to actually create the file.
      
    For iOS, the bug does not occur when ancestor-or-self is used to build a plist file
    name reference that is written inside a plist file.
    -->
    <xsl:variable name="featureAncestorsAndSelf" as="node-set">
      <xsl:sequence select="$elementToIdentify/ancestor-or-self::adfmf:*[not(self::adfmf:features)]"/>
    </xsl:variable>
    
    <!-- Normalize the list order if needed. -->
    <xsl:choose>
      <xsl:when test="$featureAncestorsAndSelf/child::adfmf:*[position() = last() and self::adfmf:feature] ">
        <!--
        When execution gets here, it means that ancestor-or-self erroneously returned nodes in
        reverse document order rather than forward document order. We know this because element
        "adfmf:features" should be first, not last. Therefore, undo the damage by putting the
        nodes in document order.
        -->
        <xsl:sequence select="reverse($featureAncestorsAndSelf/child::*)"/>
      </xsl:when>
      <xsl:otherwise>
        <!-- The list order is correct. Keep as is. -->
        <xsl:sequence select="$featureAncestorsAndSelf/child::*"/>
      </xsl:otherwise>
    </xsl:choose>

  </xsl:function>

  <!-- ******************************************************************************************
  Return:  Returns a string that represents a fully qualified preference id.
  
  IMPORTANT: This function is a duplicate of the same-named function in iOS
  file "PreferenceTransform.xsl"
  -->
  <xsl:function name="adfmf:generatePreferenceId" as="xsl:string">
    <!-- This parameter specifies the preference element whose identifier will be generated. -->
    <xsl:param name="elementToIdentify" as="element(adfmf:*)"/>

    <!-- Get the first token to use for the identifier. -->
    <xsl:variable name="prefixToken" as="xsl:string">
      <xsl:choose>
        <xsl:when test="$elementToIdentify/ancestor::adfmf:application">
          <!-- The element is from maf-application.xml -->
          <xsl:sequence select="$g_APPLICATION_CONTEXT_TOKEN"/>
        </xsl:when>
        <xsl:otherwise>
          <!-- The element is from maf-feature.xml -->
          <xsl:sequence select="$g_FEATURE_CONTEXT_TOKEN"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <!-- Get the set of elements that are used to build the fully
         qualified identifier. It includes all necessary parent preference
         elements as well as the target element itself.  It's OK that
         element adfmf-preferences is included in the set because it doesn't
         have an "id" attribute and so it won't be included in the final
         identifier string that is built.
    -->
    <xsl:variable name="parentPreferenceElementsAndSelf" as="node-set">
      <!-- The result of this is to produce a document that contains the elements we want. -->
      <xsl:choose>
        <xsl:when test="$elementToIdentify/ancestor::adfmf:application">
          <!--
          Get all ancestor-or-self elements in document order except for element adfmf:application.
          -->
          <xsl:sequence select="$elementToIdentify/ancestor-or-self::adfmf:*[not(self::adfmf:application)]"/>
        </xsl:when>
        <xsl:otherwise>

          <!--
          Get all ancestor-or-self elements in document order except for element adfmf:features.
          -->        
          <xsl:sequence select="adfmf:getFeaturePreferenceAncestorList ($elementToIdentify)"/>

        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <!-- Get the sequence of "id" attributes under the document node.
         These will be the tokens we use for building the identifer. -->
    <xsl:variable name="identifierTokens"
                  select="$parentPreferenceElementsAndSelf/child::adfmf:*/@id"/>

    <!-- Put the prefix element at the top of the sequence of identifier token elements -->
    <xsl:variable name="completeTokenSequence" select="($prefixToken, $identifierTokens)"/>
    
    <xsl:value-of select="string-join($completeTokenSequence,
                                      $g_TOKEN_DELIMITOR_DOT)"/>
  </xsl:function>

  <!-- *********************************************************************************************
       This function loads a localized XLIFF file if it exists.  If the
       file doesn't exist then an empty sequence is returned.
       Returns an XML document.
       param: p_oracleLocale - the XLIFF file locale suffix, which may be empty, or may specify just
                               a language code alone, or a language code followed by underscore and
                               a country code. For the definition of a valid Oracle locale,
                               see Java method "isValidOracleLocale" in class 
                               "oracle.adfmf.common.OracleLocale".
       param: p_baseXliffPath - a path to the base location of the XLIFF files.
       param: p_relativeXliffPathAndBaseFileName  - a relative path derived from loadBundle.baseName
       attribute.  This value contains the base name of the XLIFF file.
       
       return:  
       if p_oracleLocale is not null/empty:  a XLIFF document read from the location 
          $p_baseXliffPath/$p_relativeXliffPath_$p_oracleLocale.xlif
       if p_oracleLocale is not null/empty:  a XLIFF document read from the location 
          $p_baseXliffPath/$p_relativeXliffPath.xlif
  -->
  <xsl:function name="adfmf:getXliffDocument" as="document-node()">

    <xsl:param name="p_oracleLocale" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_baseXliffPath" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_relativeXliffPathAndBaseFileName" 
               as="xsl:string" 
               required="yes"/>

    <!-- Calculate XLIFF file URL for current language -->
    <xsl:variable name="localizedXliffFileName">
      <xsl:choose>
        <xsl:when test="$p_oracleLocale != ''">
        <xsl:value-of select="string-join(($p_relativeXliffPathAndBaseFileName, 
                                           $g_LANGUAGE_CODE_SEPARATOR, 
                                           $p_oracleLocale, 
                                           $g_XLIFF_FILE_EXTENSION), 
                                          '')"/>
        </xsl:when>
        <xsl:otherwise>
        <xsl:value-of select="string-join(($p_relativeXliffPathAndBaseFileName, 
                                           $g_XLIFF_FILE_EXTENSION), 
                                           '')"/>
        
        </xsl:otherwise>
    </xsl:choose>
    </xsl:variable>
    
    <xsl:variable name="languageXliffFileUrl" 
                  select="concat($p_baseXliffPath, $localizedXliffFileName)"/>

    <!-- Get localized XLIFF file if it exists. Otherwise, return nothing -->
   <xsl:if test="FileUtils:doesUrlResourceExist($languageXliffFileUrl) = true()">
      <xsl:sequence select="document($languageXliffFileUrl)"/>
    </xsl:if>
  </xsl:function>

  <!-- *********************************************************************************************
      This function determines if the given p_attribute belongs to an adfmf
      preference element.
      
      param:  p_attribute a xml attribute 
      return: true if the given attribute is associated with a preference.
              false otherwise.
   -->
   <xsl:function name="adfmf:isPreferenceAttribute" as="xsl:boolean">
      <xsl:param name="p_attribute" 
                 as="attribute()" 
                 required="yes"/>
        <xsl:choose>
          <xsl:when test="$p_attribute/ancestor-or-self::adfmf:preferenceGroup">
            <xsl:sequence select="true()"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:sequence select="false()"/>
          </xsl:otherwise>
       </xsl:choose>
   </xsl:function>
   
  <!-- *********************************************************************************************
      This function returns the value of the 'var' attribute of the 'loadBundle'
      element contained in maf-application.xml or maf-feature.xml
      param:  p_appOrFeatureElement either an adfmf:application or adfmf:features element
      return: the 'var' value of the 'loadBundle' element if it exists.  Empty
              string otherwise.
   -->
   <xsl:function name="adfmf:getLoadBundleVariableName" as="xsl:string">
     <xsl:param name="p_appOrFeatureElement" 
                as="element(adfmf:application) or element(adfmf:features)"/>
                
      <xsl:variable name="loadBundle" select="$p_appOrFeatureElement/adfmf:loadBundle"/>
      <xsl:variable name="loadBundleVarValue">
          <xsl:choose>
            <xsl:when test="$loadBundle">
              <xsl:value-of select="$loadBundle/@var"/>
            </xsl:when>

            <xsl:otherwise>
              <xsl:sequence select="''"/>
              </xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        <xsl:sequence select="$loadBundleVarValue"/>
    </xsl:function>
    
  <!-- *********************************************************************************************
    This function creates a resource string prefix of the form:
    feature.<featureId>.<bundleVarName> if the given p_featureId is non-empty.
    Otherwise, the returned string is of the form: application.<bundleVarName>
  -->
  <xsl:function name="adfmf:createResourceStringPrefix" as="xsl:string">
    <xsl:param name="p_adfmfBundleVariableName" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_featureId" 
               as="xsl:string" 
               required="yes"/>
   
      <xsl:variable name="resourceStringPrefix">
        <xsl:choose>
        <xsl:when test="$p_featureId and string-length ($p_featureId) > 0">
              <xsl:value-of select="string-join(($g_FEATURE_PREFIX, 
                                                 $p_featureId, 
                                                 $p_adfmfBundleVariableName), 
                                                 $g_STRING_RESOURCE_DELIMITOR_MIDDLE)"/>
          </xsl:when>
        <xsl:otherwise>
              <xsl:value-of select="concat($g_APPLICATION_PREFIX, 
                                           $g_STRING_RESOURCE_DELIMITOR_MIDDLE, 
                                           $p_adfmfBundleVariableName)"/>
          </xsl:otherwise>
      </xsl:choose>
      </xsl:variable>
    <xsl:value-of select="$resourceStringPrefix"/>
  </xsl:function>
  <!-- *********************************************************************************************
      This function determines if the given p_AppOrFeatureElem contains one or more 
      adfmf:preferences/adfmf:preferenceGroup elements.
      
      param:  p_AppOrFeatureElem an adfmf:application or adfmf:feature element
      return: true() if the given element contains one or more adfmf:preferences/
              adfmf:preferenceGroup elements. false() otherwise.
   -->
  <xsl:function name="adfmf:hasPreferenceElement" as="xsl:boolean">
    <xsl:param name="p_AppOrFeatureElem" 
               as="element (adfmf:application) or element (adfmf:feature)" 
               required="yes"/>
    <xsl:choose>
      <xsl:when test="$p_AppOrFeatureElem/adfmf:preferences/adfmf:preferenceGroup != ''">
        <xsl:sequence select="true()"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:sequence select="false()"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>
  
  <!-- *********************************************************************************************
      This function determines if the given p_applicationElement contains at least one 
      adfmf:preferences/adfmf:preferenceGroup element in the application or any of the 
      features imported into the application.
      
      param:  p_applicationElement an adfmf:application element
      param:  p_featureArchiveUrlNodeSet a document-node containing the URLs of the FARs imported to
              the application.
      return: true() if at least one adfmf:preferences/adfmf:preferenceGroup element
              was found.  false() otherwise.
   -->
  <xsl:function name="adfmf:applicationHasPreferenceElements" as="xsl:boolean">
    <xsl:param name="p_applicationElement" 
               as="element (adfmf:application)" 
               required="yes"/>
               
    <xsl:param name="p_featureArchiveUrlNodeSet" 
               as="document-node()" 
               required="yes"/>
    <!-- 
         Set to true if and only if an adfmf:preferenceGroup element is found.
    -->
    <xsl:variable name="hasPreferenceElement" as="xsl:boolean">
      <xsl:choose>
        <xsl:when test="adfmf:hasPreferenceElement ($p_applicationElement) = true()">
          <!-- maf-application.xml has preference elements -->
          <xsl:value-of select="true()"/>
        </xsl:when>
        <xsl:otherwise>
          <!-- Examine all the features in the FARs and build a variable 
               consisting of true or false strings (true if there is a 
               preferences element, false otherwise).  When done, if this 
               variable has 'true' in it, then some feature had a preference
               element.  This is a fairly simple XSLT solution to determine if
               any of the FARs have preferences.  An alternative, but more 
               complex solution, would be to use recursion instead of the 
               looping.
           -->
          <xsl:variable name="featurePreferenceResults">

            <!-- Loop through the FAR JAR URLs and load each maf-feature.xml document -->
            <xsl:for-each select="$p_featureArchiveUrlNodeSet">
              <xsl:variable name="featureArchiveUrl" select="." as="xsl:string"/>      
              <xsl:variable name="featureDoc" 
                            select="adfmf:loadFeatureDocument ($featureArchiveUrl)"/>

              <!-- Loop through the list of featureReference's contained in 
              maf-application.xml -->
              <xsl:for-each select="$gFeatureReferenceSet">
                
                <!-- featureId from featureReference element -->
                <xsl:variable name="featureId" select="@refId"/>
                
                <!-- Loop through each of the features in the current feature document and,
                     if the feature document has the featureId, check to see if it contains
                     a preference element.
                -->
                <xsl:for-each select="$featureDoc/adfmf:features">
                  <xsl:variable name="featureElem" select="key('featureKey', $featureId)"/>
                  <xsl:choose>
                    <xsl:when test="$featureElem and adfmf:hasPreferenceElement 
                                    ($featureElem) = true()">
                      true
                    </xsl:when>
                    <xsl:otherwise>
                      false
                    </xsl:otherwise>
                  </xsl:choose>
                </xsl:for-each>
              </xsl:for-each>
            </xsl:for-each>
          </xsl:variable>
          <!-- If featurePreferenceResults contains 'true', then some feature had
               preferences.
          -->
          <xsl:value-of select="contains ($featurePreferenceResults, 'true')"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    
    <xsl:sequence select="$hasPreferenceElement"/>
  </xsl:function>

  <!-- *********************************************************************************************
    This template recursively replaces all occurrences of p_searchString with p_replaceString 
    in the given p_sourceString.  This template is used because at the time of writing
    Oracle's XSLT processor:
    1) does not support XSLT2.0 replace() string function
    2) done not support function recursion
    This template can also be used when the XSLT translate() function does not
    meet the string replacement requirements - for example, translate() can only
    be used when replacing a single character with another single character or
    empty character.
    
    Note that this template is taken from book, "XSLT Cookbook", 2nd edition, 
    by Sal Mangano. Chapter 2.7, "Replacing Text" on page 41.

    If bug 14045664 (xdkj-xslt20:replace() function is not implemented correctly) is fixed, then 
    this template can be removed and clients of the template can be updated to use the Oracle XSLT 
    method.
  -->
  <xsl:template name="adfmf:string-replace-all">
    <xsl:param name="p_sourceString" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_searchString" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_replaceString" 
               as="xsl:string" 
               required="yes"/>
    <xsl:choose>
      <!-- See if the source string has the search string in it -->
      <xsl:when test="$p_sourceString and contains ($p_sourceString, $p_searchString) = true ()">
          <!-- 
            If so, output (order is important):
               1) the value of the source string up to the search string
               2) the replacement string
               3) the result of recursively calling this template with the
                  remaining string that after the search string.
          -->
          <xsl:value-of select="substring-before ($p_sourceString, $p_searchString)"/>
          
          <xsl:value-of select="$p_replaceString"/>
          
          <xsl:call-template name="adfmf:string-replace-all">
            <xsl:with-param name="p_sourceString" 
                            select="substring-after ($p_sourceString, $p_searchString)"/>
            <xsl:with-param name="p_searchString" select="$p_searchString"/>
            <xsl:with-param name="p_replaceString" select="$p_replaceString"/>
          </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <!-- No more occurrences of the search string found in the source string so
             output the current source string.  
        -->
        <xsl:value-of select="$p_sourceString"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  <!-- Copied from iOS XSL(s) -->
<!-- ***********************************************************************************************
  Get the content of the specified Expression Language string resource reference.
  This is accomplished by removing the surrounding delimiters #{} .
  Thus, the EL expression having pattern #{<BundleVarName><DECORATED_STRING_ID>}
  will return the following content:
  
     <BundleVarName><DECORATED_STRING_ID>
  
  See function "adfmf:getStringResourceId" for more information on
  the above string ID reference.
  
  TODO: This function is copied (without change) from iOS XSL file "PreferenceTransform.xsl"
        and also is duplicated in iOS XSL file "TransformStringResources.xsl".  So the iOS
        should be refactored to use this method if/when it is updated to use this 
        TransformUtilities.xsl file.
  -->
  <xsl:function name="adfmf:getExpressionLanguageContent" as="xsl:string">
    <!-- This is an ADFMF string resource identifier that
         must satisfy pattern "#{<BundleVarName><DECORATED_STRING_ID>}"
    -->
    <xsl:param name="adfmfStringResourceReference"
               as="xsl:string"
               required="yes"/>
    
    <!-- Remove prefix delimiter "#{" from the string resource reference -->
    <xsl:variable
      name="noPrefix"
      select="substring-after($adfmfStringResourceReference, $g_STRING_RESOURCE_DELIMITER_START)"
      as="xsl:string"
    />
    
    <!-- Remove suffix delimiter "}" from the string resource ID pattern -->
    <xsl:variable
      name="getExpressionLanguageContent"
      select="substring($noPrefix, 
                        1, 
                        string-length($noPrefix) - 
                         (string-length($g_STRING_RESOURCE_DELIMITER_END)))"
      as="xsl:string"
    />

    <xsl:value-of select="$getExpressionLanguageContent"/>
  </xsl:function>

  <!-- *********************************************************************************************
  Gets the value of attribute adfmf:loadBundle/@var directly from the EL expression
  of the specified attribute.  The EL expression must specify a string resource reference
  with the following format,
  
      #{<BundleVarName><DECORATED_STRING_ID>}
      
  where DECORATED_STRING_ID has one of the following patterns:
  
      .STRING_ID
      ['STRING_ID']

  TODO: This function is duplicated in file "TransformStringResources.xsl".
        So they should be refactored to use a single common method.
  -->
  <xsl:function name="adfmf:getLoadBundleVar" as="xsl:string">
    <!-- The value of this attribute must represent a string resource identifier that
         satisfies the following pattern that is described in the function comments.
         
            #{<BundleVarName><DECORATED_STRING_ID>}
    -->
    <xsl:param name="p_adfmfStringResourceReference"
               as="attribute(adfmf:*)"
               required="yes"/>

    <!-- Extract content of the form <BundleVarName><DECORATED_STRING_ID> by
         stripping outter prefix "${" and suffix "}".
    -->
    <xsl:variable
      name="expressionLanguageContent"
      select="adfmf:getExpressionLanguageContent($p_adfmfStringResourceReference)"
      as="xsl:string"/>

    <!-- Get the value of loadBundle/@var value from the EL expression content -->
    <xsl:choose>
      <xsl:when test="contains($expressionLanguageContent, 
                               $g_PREFIX_TO_STRING_ID_THAT_CONTAINS_DOTS)">
        <!--
        Now we know that the expression language content has the following pattern:
        
            bundle['STRING_ID']
              
        where STRING_ID contains dots.
        -->
        <xsl:sequence select="substring-before($expressionLanguageContent,
                                               $g_PREFIX_TO_STRING_ID_THAT_CONTAINS_DOTS)"/>
      </xsl:when>
      <xsl:otherwise>
        <!--
        Now we know that the expression language content has the following pattern:
        
            bundle.STRING_ID
              
        where STRING_ID does not contain dots.
        -->
      <xsl:value-of select="substring-before($expressionLanguageContent,
                                             $g_TOKEN_DELIMITOR_DOT)"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>
 

  <!-- *********************************************************************************************
  Gets the naked resource string identifier (i.e. STRING_ID) of the XLIFF string resource
  identifier that is embedded in the EL expression of the specified attribute value.
  
  The specified attribute must satisfy the following pattern:
         
    #{<BundleVarName><DECORATED_STRING_ID>}
         
  <BundleVarName> is the value of attribute adfmf:loadBundle/@var from the same file
                  as the specified attribute.
         
  <DECORATED_STRING_ID> is one of the following:
         
      .STRING_ID   - where STRING_ID is an XLIFF resource string identifier that is
                     prefixed by a dot (i.e. ".") token delimeter, but doesn't
                     contain dot in the string identifier itself.
   or
      ['STRING_ID'] - where STRING_ID is an XLIFF resource string identifier that is
                     prefixed by a dot token delimeter, and does contains one or
                     more dots within the string identifier
                     Example: ['oracle.mobile.name']
  
  Given the above pattern, this function returns a string with value STRING_ID
  as defined above.

  TODO: This function is copied (without change) from iOS XSL file "PreferenceTransform.xsl"
        and also is duplicated in iOS XSL file "TransformStringResources.xsl".  So the iOS
        should be refactored to use this method if/when it is updated to use this 
        TransformUtilities.xsl file.
  -->
  <xsl:function name="adfmf:getStringResourceId" as="xsl:string">
    <!-- The value of this attribute must represent a string resource identifier that
         satisfies the following pattern as described in the function comments.
         
            #{<BundleVarName><DECORATED_STRING_ID>}
    -->
    <xsl:param name="p_adfmfStringResourceReference"
               as="attribute(adfmf:*)"
               required="yes"/>

    <xsl:variable name="loadBundleVar"
                  select="adfmf:getLoadBundleVar($p_adfmfStringResourceReference)"
                  as="xsl:string"/>
    
    <!-- Extract content of the form <BundleVarName><DECORATED_STRING_ID> by
         stripping outter prefix "${" and suffix "}".
    -->
    <xsl:variable
      name="expressionLanguageContent"
      select="adfmf:getExpressionLanguageContent($p_adfmfStringResourceReference)"
      as="xsl:string"/>

    <!--
    Remove the string bundle file prefix. The following table shows two source
    patterns and the corresponding result we want after removing the bundle prefix.
    
                          Result String
    Original String       (documented earlier as <DECORATED_STRING_ID>)
    *****************     **********************************************
    bundle.STRING_ID      .STRING_ID
    bundle['STRING_ID']   ['STRING_ID']
    -->
    <xsl:variable
      name="decoratedXliffStringId"
      select="substring-after($expressionLanguageContent, $loadBundleVar)"
      as="xsl:string"
    />

    <!--
    Parse to get the naked XLIFF string identifier. This is the
    same ID as what appears in an XLIFF file.  The following table
    shows two source string and the corresponding result we want.
         
    Original String       Result String
    *****************     **********************************************         
    .STRING_ID            STRING_ID
    ['STRING_ID']         STRING_ID
    -->
    <xsl:variable name="nakedStringIdentifier" as="xsl:string">
      <xsl:choose>
        <xsl:when test="starts-with($decoratedXliffStringId, $g_TOKEN_DELIMITOR_DOT)">
          <!--
          A dot delimiter prefixes the XLIFF string identifier token. So we have
          the following pattern.
          
             .STRING_ID
          
          So remove the dot prefix to get the XLIFF string identifier by itself.
          As a corollary, this pattern tells us that the XLIFF string identifier does
          not contain embedded dots, although that does not make a difference for our use-case.
          -->
          <xsl:sequence select="substring-after($decoratedXliffStringId, $g_TOKEN_DELIMITOR_DOT)"/>
        </xsl:when>
        <xsl:otherwise>
          <!--
          We have the following pattern.
          
             ['STRING_ID']

          We need to extract the STRING_ID from within the surrounding
          brackets and single-quotes.
            
          This pattern tells us that STRING_ID represents a string ID
          that contains dots, although that does not make a difference
          for our use-case.
          
          For example, suppose we have the following decorated XLIFF string ID:
          
            ['city.employee.middle.name']
            
          then the STRING_ID component is:
          
            city.employee.middle.name
          -->

          <!-- Remove prefix [' -->
          <xsl:variable name="stringIdWithSuffix"
                        select="substring-after($decoratedXliffStringId,
                                                $g_PREFIX_TO_STRING_ID_THAT_CONTAINS_DOTS)"
                        as="xsl:string"/>

          <!-- Remove suffix '] to finally get the XLIFF resource string identifier.  -->
          <xsl:sequence select="substring-before($stringIdWithSuffix,
                                                 $g_SUFFIX_TO_STRING_ID_THAT_CONTAINS_DOTS)"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:value-of select="$nakedStringIdentifier"/>
  </xsl:function>  
  
<!-- *********************************************************************************************
  Returns the resource text that corresponds to the specified string resource identifier
  in the  specified XLIFF document.  For the specified string resource identifier, this
  method returns the value of element <xlf:target> if it exists and specifies a non-empty
  string. If <xlf:target> does not exist or is empty then the value of element <xlf:source>
  is returned if it exists and specifies a non-empty string. If the string identifier is not
  found or both elements <xlf:target> and <xlf:source> are not found or are empty then this
  function does not return a string.
  
  If the specified XLIFF document is a localized XLIFF document then the string may or may not be 
  found.  However, if the specified XLIFF document is a base (non-localized) XLIFF document, then 
  the string should always be found because a base XLIFF document is supposed to always have all 
  resource strings whether or not they are localized.
  -->
  <xsl:function name="adfmf:getResourceTextFromTargetOrSource" as="xsl:string">
    <!-- Either a base XLIff document or a localized XLIFF document. -->
    <xsl:param name="p_xliffDocument"
               required="yes"
               as="document-node()"/>

    <!-- String resource identifier that will be searched for in the specified XLIFF document. -->
    <xsl:param name="p_stringResourceId"
               as="xsl:string"
               required="yes"/>

    <xsl:for-each select="$p_xliffDocument/xlf:xliff/xlf:file/xlf:body">

      <!-- This loop only enters once.  The above for loop is only needed to
           change context node for key(). No actual looping is needed. -->
      <xsl:variable name="transUnitElement" select="key('xliffStringKey', $p_stringResourceId)"/>
      
      <!-- Element <xlf:source> of the specified string resource. -->
      <xsl:variable name="sourceElement" select="$transUnitElement/xlf:source"/>
      
      <!-- Element <xlf:target> of the specified string resource. -->
      <xsl:variable name="targetElement" select="$transUnitElement/xlf:target"/>
      
      <xsl:choose>
        <xsl:when test="$targetElement and (string-length($targetElement) &gt; 0)">
          <!-- Control gets here iff element <xlf:target> exists with a non-empty string -->
          <xsl:value-of select="$targetElement"/>
        </xsl:when>
        <xsl:when test="$sourceElement and (string-length($sourceElement) &gt; 0)">
          <!-- Control gets here iff element <xlf:source> exists with a non-empty string -->
          <xsl:value-of select="$sourceElement"/>
        </xsl:when>
      </xsl:choose>      
    </xsl:for-each>
  </xsl:function>  
  <!-- *********************************************************************************************
  Returns the resource text that corresponds to the specified string resource identifier.
  First try to get the resource string from the localized XLIFF document.  If the localized XLIFF
  file does not exist or doesn't contain the resource string, then retrieve the resource
  string from the base XLIFF document.
  -->
  <xsl:function name="adfmf:getResourceText" as="xsl:string">
    <!-- Specifies a string resource identifier. -->
    <xsl:param name="p_stringResourceId"
               required="yes"
               as="xsl:string"/>

    <!-- The base (non-localized) XLIFF file must always exist. -->
    <xsl:param name="p_baseXliffDocument"
               required="yes"
               as="document-node()"/>

    <!-- The localized XLIFF file may or may not exist. -->
    <xsl:param name="p_localizedXliffFileDocument"
               required="no"
               as="document-node()"/>

    <!-- Get resource text from localized XLIFF document if possible. -->
    <xsl:variable name="localizedResourceString" as="xsl:string">
      <xsl:if test="exists($p_localizedXliffFileDocument/*)">
        <xsl:value-of select="adfmf:getResourceTextFromTargetOrSource($p_localizedXliffFileDocument, 
                                                                      $p_stringResourceId)"/>
      </xsl:if>
    </xsl:variable>

    <xsl:choose>
      <xsl:when test="(string-length($localizedResourceString) &gt; 0)">
        <!-- Return localized string -->
        <xsl:value-of select="$localizedResourceString"/>
      </xsl:when>
      <xsl:otherwise>
        <!-- Get resource text from base XLIFF document. -->
        <xsl:value-of select="adfmf:getResourceTextFromTargetOrSource($p_baseXliffDocument, 
                                                                      $p_stringResourceId)"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>  

  <!-- *********************************************************************************************
       This function loads a XLIFF file, if it exists.  If the file doesn't exist then an 
       empty sequence is returned.
       
       param: p_appOrFeatureElement - an adfmf:application or adfmf:feature element
       param: p_baseXliffPath  - a path to the base location of the XLIFF files.
       param: p_attributeValue - a value of an attribute containing a EL-expression reference to a
                                 string in a XLIFF file.
       param: p_oracleLocale   - the XLIFF file locale suffix, which may be empty, or may specify 
                                 just a language code alone, or a language code followed by 
                                 underscore and a country code. For the definition of a valid Oracle 
                                 locale, see Java method "isValidOracleLocale" in class 
                                 "oracle.adfmf.common.OracleLocale".
       return:  
       
        if p_oracleLocale is not null/empty:  a XLIFF document read from the location 
          $p_baseXliffPath/<relativeXLIFFPath>_$p_oracleLocale.xlif
          
        if p_oracleLocale is null/empty:  a XLIFF document read from the location 
          $p_baseXliffPath/<relativeXLIFFPath>.xlif
          
        where <relativeXLIFFPath> is determined by using the adfmf:loadBundle/@basename attribute 
        whose adfmf:loadBundle/@var attribute value matches the value contained in the given 
        $p_attributeValue.  For example, if:
          1) p_oracleLocale is null/empty 
          2) $p_appOrFeatureElement has the following loadBundle elements:
             <adfmf:loadBundle basename='mobile.foo' var='vcBundle1'/>
             <adfmf:loadBundle basename='mobile.bar' var='vcBundle2'/>
          3) $p_attributeValue was '#{vcBundle2.SOME_ID_FROM_VIEW_CONTROLLER_BUNDLE2}',
          
        then the <relativeXLIFFPath> would be generated using the second <adfmf:loadBundle> and
        would be "mobile/bar" and the .xlf file loaded would be $p_baseXliffPath/mobile/bar.xlf
   -->
  <xsl:function name="adfmf:getXliffDocumentFromAttribute" as="document-node()">
    
    <xsl:param name="p_appOrFeatureElement" 
               as="element (adfmf:application) or element (adfmf:feature)" 
               required="yes"/>
               
    <xsl:param name="p_baseXliffPath" 
               as="xsl:string"
               required="yes"/>
               
    <xsl:param name="p_attributeValue" 
               as="xsl:string"
               required="yes" />
               
    <xsl:param name="p_oracleLocale" 
               as="xsl:string" 
               required="no" />

    <!-- Get the loadBundle/@var value directly from the attribute value -->
    <xsl:variable name="loadBundleVar" select="adfmf:getLoadBundleVar ($p_attributeValue)"/>
    
    <!-- Get the basename attribute from the adfmf:loadBundle element whose var attribute value
         matches the value obtained from the attribute -->
    <xsl:variable name="baseNameValue">

      <xsl:choose>
        
        <xsl:when test="$p_appOrFeatureElement/ancestor-or-self::adfmf:application">
          <!-- adfmf:loadBundle elements are child elements of adfmf:application -->
          <xsl:value-of 
                   select="$p_appOrFeatureElement/adfmf:loadBundle[@var=$loadBundleVar]/@basename"/>
        </xsl:when>
        
        <xsl:otherwise>
           <!-- adfmf:loadBundle elements are child elements of adfmf:features element. Since
                p_appOrFeatureElement is an adfmf:feature, locate the adfmf:loadBundle using the 
                parent -->
          <xsl:value-of 
                select="$p_appOrFeatureElement/../adfmf:loadBundle[@var=$loadBundleVar]/@basename"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    
    <!-- Convert the basename to a relative path by replacing all '.'s with '/'s -->
    <xsl:variable name="relativeXliffPath" 
                  select="translate ($baseNameValue,
                                     $g_STRING_RESOURCE_DELIMITOR_MIDDLE, 
                                     $g_FILE_PATH_SEPARATOR)"/>
    
    <!-- Load the .xlf file -->
    <xsl:sequence select="adfmf:getXliffDocument ($p_oracleLocale, 
                                                  $p_baseXliffPath, 
                                                  $relativeXliffPath)"/>
  </xsl:function>  
  
  <!-- *********************************************************************************************
    Returns the resource string whose XLIFF id is contained in the given p_xliffStringReferenceValue
    
    If the resource string is contained in a localized XLIFF file, it is returned.  If the 
    localized XLIFF file does not exist or doesn't contain the resource string, then the resource
    string from the base XLIFF document is returned.

    param:  p_appOrFeatureElement an adfmf:application or adfmf:feature element 
    param:  p_baseXliffPath a relative path to the location of a .xlf file
    param:  p_xliffStringReferenceValue a full EL-expression reference to a string in a .xlf file 
    param:  p_oracleLocale an oracle locale.  May be empty/null
    
    return: A string from a .xlf file
   -->
  <xsl:function name="adfmf:getStringFromXliffFile" as="xsl:string">
    <xsl:param name="p_appOrFeatureElement" 
               as="element (adfmf:application) or element (adfmf:feature)" 
               required="yes"/>
               
    <xsl:param name="p_baseXliffPath" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_xliffStringReferenceValue" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_oracleLocale" 
               as="xsl:string" 
               required="no"/>

    <xsl:variable name="baseDoc" 
                  as="document-node()"
                  select="adfmf:getXliffDocumentFromAttribute ($p_appOrFeatureElement,
                                                               $p_baseXliffPath,
                                                               $p_xliffStringReferenceValue,
                                                               '')"/>
                                                                                        
    <xsl:variable name="localizedDoc" 
                  as="document-node()"    
                  select="adfmf:getXliffDocumentFromAttribute ($p_appOrFeatureElement,
                                                               $p_baseXliffPath,
                                                               $p_xliffStringReferenceValue,
                                                               $p_oracleLocale)"/>

    <xsl:variable name="xliffId" 
                  as="xsl:string" 
                  select="adfmf:getStringResourceId($p_xliffStringReferenceValue)"/>
                                                                                  
    <xsl:variable name="xliffResource" 
                  select="adfmf:getResourceText ($xliffId, 
                                                 $baseDoc, 
                                                 $localizedDoc)"/>
    <xsl:value-of select="$xliffResource"/>
    
  </xsl:function>


  <!-- *********************************************************************************************
    This function generates a string id for an Android preference value.
    param:  p_attribute
    param:  p_bIsResourceBundleRef
    param:  p_bIsPreferenceAttribute
    param:  p_resourceStringPrefix
    return: A string id if the given attribute
            * is a resource bundle reference
            * is a preference attribute and 
              ** is the 'default' or 'name' attribute of a element 
            Empty string otherwise.
   -->
  <xsl:function name="android:getStringId" as="xsl:string">
      <xsl:param name="p_attribute" 
                 as="attribute()" 
                 required="yes"/>
                 
      <xsl:param name="p_bIsResourceBundleRef" 
                 as="xsl:boolean" 
                 required="yes"/>
                 
      <xsl:param name="p_bIsPreferenceAttribute" 
                 as="xsl:boolean" 
                 required="yes"/>
                 
      <xsl:param name="p_resourceStringPrefix" 
                 as="xsl:boolean" 
                 required="yes"/>

    <xsl:variable name="stringId">

      <xsl:choose>

        <xsl:when test="$p_bIsResourceBundleRef = true()">
          <!-- The given attribute is a reference to a string in a xliff file, which
               may or may not be an ADFmf preference attribute.  Generate a string id
               of the form [PreferenceId].[LoadBundleVariableName].[String_Id].[AttributeName]
               where:
               [PreferenceId]:      is a fully qualified dot-delimited list of id's up to the
                                    element containing the xliff reference.
               [LoadBundleVarName]: is the 'var' attribute value of the <loadBundle> element
               [String_Id]:         is the xliff string id w/o the #{} (or #{''}) delimiters
               [AttributeName]:     is the name of the given attribute.
               NOTE:  Even though the xliff string may not be associated with a preference element
                      a fully qualified preference id is used in order to ensure the returned
                      string id is unique.
          -->
          <xsl:sequence select="concat (adfmf:generatePreferenceId ($p_attribute), 
                                        $g_periodChar, 
                                        adfmf:getLoadBundleVar($p_attribute),
                                        $g_periodChar,
                                        adfmf:getStringResourceId($p_attribute),
                                         $g_periodChar,
                                        name($p_attribute))"/>
        </xsl:when>

        <xsl:when test="$p_bIsPreferenceAttribute = true()">
          <!-- the given attribute is part of a preference element whose value is either hard-coded 
               or is a bundle reference. Generate a string id only when the given attribute:
               1) is the 'default' attribute
               2) is the 'label' attribute
               3) is the id attribute and the preference element has a label 
               attribute that is not a resource bundle reference (if it is,
               it will be processed when the label attribute is processed).
          -->
          <xsl:choose>
            <xsl:when test="name($p_attribute) = $g_adfmfDefaultAttributeName">
            <!-- default attribute -->
                <xsl:sequence select="concat (adfmf:generatePreferenceId ($p_attribute), 
                                              $g_androidAttributeValueSeparator, 
                                              $g_androidDefaultAttributeName)"/>
            </xsl:when>

            <xsl:when test="name($p_attribute) = $g_adfmfLabelAttributeName">
            <!-- label attribute-->
                <xsl:sequence select="concat (adfmf:generatePreferenceId ($p_attribute), 
                                              $g_androidAttributeValueSeparator, 
                                              $g_androidTitleAttributeName)"/>
            </xsl:when>

            <!-- id attribute -->
            <xsl:otherwise>
              <xsl:sequence select="$g_emptyString"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:when>

        <xsl:otherwise>
          <!-- the given attribute doesn't need to be translated to a resource string -->
          <xsl:sequence select="$g_emptyString"/>
        </xsl:otherwise>
      </xsl:choose>
   </xsl:variable>

   <xsl:value-of select="$stringId"/>
   
  </xsl:function>

  <!-- *********************************************************************************************
      This template drives the creation of three files:
      * maf_preferences.xml - contains Android preferences derived from the source MAF application
                          XML.  Also contains feferences to arrays and localizable strings contained
                          in the maf_arrays.xml and maf_strings.xml file.
      * maf_arrays.xml - contains Android list preference elements.  Each ADFmf preferenceList is
                     represented as two Android <string-array> elements (one for enumerating keys
                     and one for enumerating values) in this file.
      * maf_strings.xml - contains Android strings. 
      
      If locale tokens are provided to the XSL, then localized versions of these three files
      get created in locale-specific folders.
   -->
  <xsl:template match="adfmf:application">
      <xsl:variable name="rootxml" select="."/>
      <!-- Create file maf_preferences.xml -->
     <xsl:call-template name="android:createPreferencesXmlFile">
      <xsl:with-param name="p_appElement" select="$rootxml"/>
    </xsl:call-template>
      
      <!-- Create file maf_strings.xml -->
      <xsl:call-template name="android:createStringsXmlFile">
      <xsl:with-param name="p_appElement" select="$rootxml"/>
    </xsl:call-template>

      <!-- Create file maf_arrays.xml -->
      <xsl:call-template name="android:createArraysXmlFile">
      <xsl:with-param name="p_appElement" select="$rootxml"/>
    </xsl:call-template>
   </xsl:template>
   
  <!-- *********************************************************************************************
      Writes the content of a single ADFmf preferenceGroup element as a collection
      of Android preferences elements to the output.
      
      p_prefGroup - the preference group or page whose elements are to be written.
      p_featureId - if the given prefGroup is defined in a feature preference, this is the id of the 
                    feature. Otherwise, it is null/empty.
   -->
  <xsl:template name="android:writePreferenceElements">
      <xsl:param name="p_prefGroup" 
                 as="element (adfmf:preferenceGroup) or element (adfmf:preferencePage)"
                 required="yes"/>
                 
      <xsl:param name="p_featureId" 
                 as="xsl:string" 
                 required="no"/>

      <xsl:call-template name="android:writeKeyAndTitlePreferenceAttributes">
        <xsl:with-param name="p_prefNode" select="$p_prefGroup"/>
        <xsl:with-param name="p_featureId" select="$p_featureId"/>
      </xsl:call-template>

      <xsl:for-each select="$p_prefGroup/adfmf:*">

         <xsl:if test=".[self::adfmf:preferencePage]">

            <xsl:call-template name="android:writePreferencePageElements">
              <xsl:with-param name="p_prefPage" select="."/>
              <xsl:with-param name="p_featureId" select="$p_featureId"/>
            </xsl:call-template>

         </xsl:if>
      
         <xsl:if test=".[self::adfmf:preferenceGroup]">

            <xsl:call-template name="android:writePreferenceCategoryElement">
              <xsl:with-param name="p_prefGroup" select="."/>
              <xsl:with-param name="p_featureId" select="$p_featureId"/>
            </xsl:call-template>

         </xsl:if>

         <xsl:if test=".[self::adfmf:preferenceText]">

            <xsl:call-template name="android:writeAdfMFPreferenceText">
              <xsl:with-param name="p_prefText" select="."/>
              <xsl:with-param name="p_featureId" select="$p_featureId"/>
            </xsl:call-template>

         </xsl:if>

         <xsl:if test=".[self::adfmf:preferenceBoolean]">

            <xsl:call-template name="android:writeAdfMfPreferenceBoolean">
              <xsl:with-param name="p_prefBool" select="."/>
              <xsl:with-param name="p_featureId" select="$p_featureId"/>
            </xsl:call-template>

         </xsl:if>

         <xsl:if test=".[self::adfmf:preferenceNumber]">

            <xsl:call-template name="android:writeAdfMFPreferenceText">
              <xsl:with-param name="p_prefText" select="."/>
              <xsl:with-param name="p_featureId" select="$p_featureId"/>
            </xsl:call-template>

         </xsl:if>

         <xsl:if test=".[self::adfmf:preferenceList]">

            <xsl:call-template name="android:writeAdfMFPreferenceList">
              <xsl:with-param name="p_prefList" select="."/>
              <xsl:with-param name="p_featureId" select="$p_featureId"/>
            </xsl:call-template>

         </xsl:if>

      </xsl:for-each>
   </xsl:template>
   
  <!-- *********************************************************************************************
      Writes the content of a single ADFmf preferencePage element as a collection
      of Android preferences elements to the output.
      
      p_prefPage - the preference page whose elements are to be written.
      p_featureId - if the given prefGroup is defined in a feature preference, this is the id of the
      feature. Otherwise, it is null/empty.
   -->
  <xsl:template name="android:writePreferencePageElements">
    <xsl:param name="p_prefPage" 
               as="element(adfmf:preferencePage)" 
               required="yes"/>
               
    <xsl:param name="p_featureId" 
               select="$p_featureId" 
               as="xsl:string" 
               required="yes"/>
    
    <xsl:call-template name="android:writePreferenceScreenElement">
      <xsl:with-param name="p_prefPage" select="$p_prefPage"/>
      <xsl:with-param name="p_featureId" select="$p_featureId"/>
    </xsl:call-template>
    
   </xsl:template>
   
  <!-- *********************************************************************************************
      Writes the content of the ADFmf preferencePage child elements as a collection
      of Android preferences elements to the output.
      
      p_prefPage - the preference page whose elements are to be written.
      p_featureId - if the given prefGroup is defined in a feature preference, this is the id of the
                    feature. Otherwise, it is null/empty.
   -->
  <xsl:template name="android:writePreferenceScreenElement">
      <xsl:param name="p_prefPage"
                 as="element (adfmf:preferencePage)" 
                 required="yes"/>
                 
      <xsl:param name="p_featureId" 
                 as="xsl:string" 
                 required="no"/>
      
      <PreferenceScreen>
        <xsl:call-template name="android:writePreferenceElements">
          <xsl:with-param name="p_prefGroup" select="$p_prefPage"/>
          <xsl:with-param name="p_featureId" select="$p_featureId"/>
        </xsl:call-template>

     </PreferenceScreen>
   </xsl:template>
   
  <!-- *********************************************************************************************
        Writes the content of an ADFmf preferenceGroup element as an Android
        PreferenceCategory element to the output.
        
        p_prefGroup - the preference group or page whose elements are to be written.
        p_featureId - if the given prefGroup is defined in a feature preference, this is the id of 
                      the feature.  Otherwise, it is null/empty.
   -->
  <xsl:template name="android:writePreferenceCategoryElement">
      <xsl:param name="p_prefGroup" 
                 as="element (adfmf:preferenceGroup)" 
                 required="yes"/>
                 
      <xsl:param name="p_featureId" 
                 as="xsl:string" 
                 required="no"/>
      
      <PreferenceCategory>

        <xsl:call-template name="android:writePreferenceElements">
          <xsl:with-param name="p_prefGroup" select="$p_prefGroup"/>
          <xsl:with-param name="p_featureId" select="$p_featureId"/>
        </xsl:call-template>

      </PreferenceCategory>
   </xsl:template>
   
   
  <!-- *********************************************************************************************
        Writes the content of an ADFmf preferenceText element as an Android AdfMFPreferenceText 
        element to the output.

        p_prefText - to be written as an Android template AdfMFPreferenceText
        p_featureId - if the given prefGroup is defined in a feature preference, this is the id of 
                      the feature. Otherwise, it is null/empty.
   -->
  <xsl:template name="android:writeAdfMFPreferenceText">
      <xsl:param name="p_prefText" 
                 as="element (adfmf:preferenceText)" 
                 required="yes"/>
                 
      <xsl:param name="p_featureId" 
                 as="xsl:string" 
                 required="no"/>
      
      <oracle.adfmf.preferences.AdfMFPreferenceText>
      
        <xsl:call-template name="android:writeKeyAndTitlePreferenceAttributes">
          <xsl:with-param name="p_prefNode" select="$p_prefText"/>
          <xsl:with-param name="p_featureId" select="$p_featureId"/>
        </xsl:call-template>

        <xsl:attribute name="android:defaultValue">
          <xsl:call-template name="android:getTextDefaultValue">
            <xsl:with-param name="p_xmlValue" select="$p_prefText/@default"/>
            <xsl:with-param name="p_id" select="@id"/>
            <xsl:with-param name="p_featureId" select="$p_featureId"/>
          </xsl:call-template>
        </xsl:attribute>
        
        <xsl:if test="@secret">
          <xsl:attribute name="android:password">
            <xsl:value-of select="$p_prefText/@secret"/>
          </xsl:attribute>
        </xsl:if>
    </oracle.adfmf.preferences.AdfMFPreferenceText>
  </xsl:template>
  <!-- *********************************************************************************************
        Writes the content of an ADFmf preferenceBoolean element as an Android 
        AdfMFPreferenceBoolean element to the output.

        p_prefBool  - to be written as an Android template AdfMFPreferenceBoolean
        p_featureId - if the given prefGroup is defined in a feature preference, this is the id of 
                      the feature.  Otherwise, it is null/empty.
   -->
  <xsl:template name="android:writeAdfMfPreferenceBoolean">
      <xsl:param name="p_prefBool" 
                 as="element(adfmf:preferenceBoolean)" 
                 required="yes"/>
                 
      <xsl:param name="p_featureId" 
                 as="xsl:string" 
                 required="no"/>

    <oracle.adfmf.preferences.AdfMFPreferenceBoolean>
        <xsl:call-template name="android:writeKeyAndTitlePreferenceAttributes">
          <xsl:with-param name="p_prefNode" select="$p_prefBool"/>
          <xsl:with-param name="p_featureId" select="$p_featureId"/>
        </xsl:call-template>
      
      <xsl:attribute name="android:defaultValue">
        <xsl:call-template name="android:getBooleanDefaultValue">
          <xsl:with-param name="p_xmlValue" select="$p_prefBool/@default"/>
          <xsl:with-param name="p_id" select="@id"/>
        </xsl:call-template>
      </xsl:attribute>
    </oracle.adfmf.preferences.AdfMFPreferenceBoolean>
  </xsl:template>
  <!-- *********************************************************************************************
        Writes the content of an ADFmf AdfMFPreferenceList element as an Android AdfMFPreferenceList
        element

        p_prefList - to be written as an Android template AdfMFPreferenceList
        p_featureId - if the given prefGroup is defined in a feature preference, this is the id of 
                      the feature.  Otherwise, it is null/empty.
   -->
  <xsl:template name="android:writeAdfMFPreferenceList">
      <xsl:param name="p_prefList" 
                 as="element(adfmf:preferenceList)" 
                 required="yes"/>
                 
      <xsl:param name="p_featureId" 
                 as="xsl:string" 
                 required="no"/>

      <oracle.adfmf.preferences.AdfMFPreferenceList>

      <xsl:call-template name="android:writeKeyAndTitlePreferenceAttributes">
        <xsl:with-param name="p_prefNode" select="$p_prefList"/>
        <xsl:with-param name="p_featureId" select="$p_featureId"/>
      </xsl:call-template>
      
      <xsl:attribute name="android:defaultValue">
        <xsl:call-template name="android:getListDefaultValue">
          <xsl:with-param name="p_xmlValue" select="$p_prefList/@default"/>
          <xsl:with-param name="p_prefList" select="$p_prefList"/>
          <xsl:with-param name="p_id" select="@id"/>
          <xsl:with-param name="p_featureId" select="$p_featureId"/>
        </xsl:call-template>
      </xsl:attribute>
      
      <xsl:attribute name="android:entries">
        <xsl:call-template name="android:entriesAttributeValueName">
          <xsl:with-param name="p_arrayId" select="@id"/>
        </xsl:call-template>
      </xsl:attribute>
      
      <xsl:attribute name="android:entryValues">
        <xsl:call-template name="android:entryValuesAttributeValueName">
          <xsl:with-param name="p_arrayId" select="@id"/>
        </xsl:call-template>
      </xsl:attribute>
    </oracle.adfmf.preferences.AdfMFPreferenceList>
  </xsl:template>
  
  <!-- *********************************************************************************************
      Creates a value to be used as the XML attribute value of a <android:entries> XML element.
      The generated value is of the form "<arrayId>_entries" where <arrayId> is the id of an array.
      The value is used in both maf_preferences.xml and maf_arrays.xml:
      * in maf_preferences.xml the value is a reference to a resource in maf_arrays.xml and has the form
        "@array/<id>" where <id> is the array identifier generated by this template.
      * in maf_arrays.xml the value is used as the value of the 'name' attribute of a <string-array>
        element as in (<id> below is the array identifier generated by this template):
         <string-array name='<id>'>
            <item>...</item>
         </string-array>
         
         param:  p_arrayId - the id value of a preferenceList.
   -->
  <xsl:template name="android:generateEntriesId">
      <xsl:param name="p_arrayId" 
                 as="xsl:string" 
                 required="yes"/>
      
      <!-- The fully qualified dot-path of an ADFmf preference list id -->
      <xsl:variable name="preferenceId" select="adfmf:generatePreferenceId ($p_arrayId)"/>
      
      <!-- The Android attribute name whose value refers to the entries in a list -->
      <xsl:variable name="ENTRIES_ATTRIBUTE" select="'entries'"/>

      <!-- TODO:  Determine why AAPT throws an error if the identifiers for the list preferences are
           "." characters.  Working around the problem by using "_" instead of "." for the
           <arrayId>_entries value -->
           
      <!-- Build an id of the form <preferenceId>___entries (replacing '.' with '_') -->
      <xsl:value-of select="translate (concat ($preferenceId, 
                                               $g_androidAttributeValueSeparator, 
                                               $ENTRIES_ATTRIBUTE),
                                       $g_periodChar, 
                                       $g_underscoreChar)"/>
   </xsl:template>
   
  <!-- *********************************************************************************************
      Creates a value to be used as the XML attribute value of a <android:entries> XML element
      that refers to a value contained in maf_arrays.xml.  The constructed value is of the form:
      "@array/<arrayId>_entries" where <arrayId> is the id of an array.

         param: p_arrayId - - the id of the array.
   -->
  <xsl:template name="android:entriesAttributeValueName">
      <xsl:param name="p_arrayId" 
                 as="xsl:string" 
                 required="yes"/>
                 
      <xsl:variable name="entriesId">
         <xsl:call-template name="android:generateEntriesId">
        <xsl:with-param name="p_arrayId" select="$p_arrayId"/>
      </xsl:call-template>
      </xsl:variable>

      <!-- Contains the prefix of an Android array reference of the form '@array/<endtriesId>' -->
      <xsl:variable name="ARRAY_REFERENCE_PREFIX" select="'@array/'"/>
      
      <!-- create a identifier for the list  -->
      <xsl:value-of select="concat ($ARRAY_REFERENCE_PREFIX, $entriesId)"/>
   </xsl:template>
  <!-- *********************************************************************************************
      Creates a value to be used as the XML attribute value of a <android:entryValues> XML element.
      The generated value is of the form "<arrayId>___entry_values" where <arrayId> is the id of an 
      array.  The value is used in both maf_preferences.xml and maf_arrays.xml:
      * in maf_preferences.xml the value is a reference to a resource in maf_arrays.xml and has the form
        "@array/<id>" where <id> is the array identifier generated by this template.
      * in maf_arrays.xml the value is used as the value of the 'name' attribute of a <string-array>
        element as in (<id> below is the array identifier generated by this template):
         <string-array name='<id>'>
            <item>...</item>
         </string-array>

         param:  p_arrayId - the id value of a preferenceList.
   -->
  <xsl:template name="android:generateEntryValuesId">
      <xsl:param name="p_arrayId" 
                 as="xsl:string" 
                 required="yes"/>
      
      <!-- The fully qualified dot-path of an ADFmf preference list id -->
      <xsl:variable name="preferenceId" select="adfmf:generatePreferenceId ($p_arrayId)"/>

      <!-- The Android attribute name whose value refers to the entry values in a list -->
      <xsl:variable name="ENTRY_VALUES_ATTRIBUTE" select="'entry_values'"/>


      <!-- TODO:  Determine why AAPT throws an error if the identifiers for the list preferences are
           "." characters.  Working around the problem by using "_" instead of "." for the
           <arrayId>___entryValues value -->
      <!-- Build an id of the form <preferenceId>___entryValues (replacing '.' with '_') -->
      <xsl:value-of select="translate (concat ($preferenceId, 
                                               $g_androidAttributeValueSeparator, 
                                               $ENTRY_VALUES_ATTRIBUTE),
                                       $g_periodChar, 
                                       $g_underscoreChar)"/>
   </xsl:template>
  <!-- *********************************************************************************************
      Creates a value to be used as the XML attribute value of a <android:entryValues> XML element
      that refers to a value contained in maf_arrays.xml.  The constructed value is of the form:
      "@array/<arrayId>_entry_values" where <arrayId> is the id of an array.
         preferenceGroupId - the preferenceGroupId if the preference group containing a 
         preferenceList

      param:  p_arrayId - the id of the array.
   -->
  <xsl:template name="android:entryValuesAttributeValueName">
      <xsl:param name="p_arrayId" 
                 as="xsl:string" 
                 required="yes"/>
      
      <xsl:variable name="entryValuesId">
        <xsl:call-template name="android:generateEntryValuesId">
          <xsl:with-param name="p_arrayId" select="$p_arrayId"/>
        </xsl:call-template>
      </xsl:variable>

      <!-- Contains the prefix of an Android array reference of the form '@array/<entryValuesId>' -->
      <xsl:variable name="ARRAY_REFERENCE_PREFIX" select="'@array/'"/>
      
      <!-- create a identifier for the list ensuring replace any spaces with an _ -->
      <xsl:value-of select="concat($ARRAY_REFERENCE_PREFIX, $entryValuesId)"/>
   </xsl:template>
   
  <!-- *********************************************************************************************
        Writes the content of an ADFmf preferenceGroup element as an Android
        * PreferenceScreen element when the depth of the preferenceGroup is a even number.
        * PreferenceCategory element when the depth of the preference group is a odd number.
        
         param:  p_prefGroup - the preference group id of preference group to write.
         param:  p_featureId - name of the feature id if the given preferenceGroup is defined in a 
                               feature..
   -->
  <xsl:template name="android:writePreferenceGroup">
    <xsl:param name="p_prefGroup" 
               as="element (adfmf:preferenceGroup)" 
               required="yes"/>
               
    <xsl:param name="p_featureId" 
               as="xsl:string" 
               required="no"/>
    
    <xsl:call-template name="android:writePreferenceCategoryElement">
      <xsl:with-param name="p_prefGroup" select="."/>
      <xsl:with-param name="p_featureId" select="$p_featureId"/>
    </xsl:call-template>
  </xsl:template>
  <!-- *********************************************************************************************
        Creates a maf_preferences.xml file located in the directory specified as a parameter
        to the XSL and populates it with Android preferences if and only if the MAF
        application contains preferences.
        
        p_appElement - an adfmf:application containing the application preferences.
   -->
  <xsl:template name="android:createPreferencesXmlFile">
    <xsl:param name="p_appElement" 
               as="element (adfmf:application)" 
               required="yes"/>
    <!-- Folder name to contain the maf_preferences.xml file. -->
    <xsl:variable name="PREFERENCE_XML_FOLDER_NAME" select="'xml'"/>
    
    <xsl:variable name="PREFERENCES_XML" select="'maf_preferences.xml'"/>

    <xsl:variable name="p_filePath" 
                  select="concat ($XSL_PARAM_targetDirectoryPath, 
                                  $PREFERENCE_XML_FOLDER_NAME,
                                  $g_FILE_PATH_SEPARATOR
                                  $PREFERENCES_XML)"/>
                  
    <xsl:if test="adfmf:applicationHasPreferenceElements ($p_appElement, 
                                                          $XSL_PARAM_FeatureArchiveUrlNodeSet) = 
                                                          true()">
    
      <xsl:result-document href="{$p_filePath}" indent="yes">

       <!-- Android preferences XML always has a <PreferenceScreen> root element. -->
       <PreferenceScreen>
          <xsl:namespace name="{$g_nsPrefix}">
            <xsl:value-of select="$g_nsNamespace"/>
          </xsl:namespace>
        
          <!-- write the application level resources -->
          <xsl:call-template name="android:writeApplicationPreferences">
            <xsl:with-param name="p_appElement" select="$p_appElement"/>
          </xsl:call-template>
        
          <!-- write the feature preferences -->
          <xsl:call-template name="android:writeFeaturePreferences"/>
        </PreferenceScreen>
      </xsl:result-document>
    </xsl:if>
  </xsl:template>
  <!-- *********************************************************************************************
        Create an maf_arrays.xml file located in the directory specified as a parameter
        to the XSL and populates it with Android list preferences.  Each ADFmf
        preferenceList element maps to two Android XML elements.  One of the elements
        enumerates the keys of the preference list and the other element enumerates the
        values of the preference list.
        
        p_appElement - an adfmf:application containing the application preferences.
   -->
  <xsl:template name="android:createArraysXmlFile">
      <xsl:param name="p_appElement" 
                 as="element (adfmf:application)" 
                 required="yes"/>

      <xsl:variable name="ARRAYS_XML" select="'maf_arrays.xml'"/>
      <!-- Create the default maf_arrays.xml file -->
      <xsl:call-template name="android:createLocalizedArraysXml">
        <xsl:with-param name="p_fileName" select="$ARRAYS_XML"/>
        <xsl:with-param name="p_localeData"/>
        <xsl:with-param name="p_appElement" select="$p_appElement"/>
      </xsl:call-template>

      <!-- Create an maf_arrays.xml file for each locale -->
      <xsl:for-each select="$XSL_PARAM_LocaleDataElements">
         <xsl:call-template name="android:createLocalizedArraysXml">
          <xsl:with-param name="p_fileName" select="$ARRAYS_XML"/>
          <xsl:with-param name="p_localeData" select="."/>
          <xsl:with-param name="p_appElement" select="$p_appElement"/>
        </xsl:call-template>
      </xsl:for-each>
   </xsl:template>

  <!-- *********************************************************************************************
    return: A path to the specified Android resource file.
   -->
  <xsl:function name="android:getResourceFilePath" as="xsl:string">
    <!-- Resource file name -->
    <xsl:param name="p_fileName" 
               as="xsl:string" 
               required="yes"/>
    
    <!-- This parameter is optional. If the caller specifies it, then the resource file is for a
         particular language, or language and country if the country code is also specified.
    -->
    <xsl:param name="p_localeData" 
               as="element(LocaleData)" 
               required="no"/>

    <!-- Name of the folder to contain a default version of maf_strings.xml and maf_arrays.xml -->
    <xsl:variable name="DEFAULT_FOLDER_NAME" select="'values'"/>
    
    <!-- Prefix name of the folder to contain a localized version of maf_strings.xml and maf_arrays.xml.
         Each folder name is of the form values-<languageCode>-[r<countryCode>] where:
         <languageCode> is a 2 character language code and
         [r<countryCode>] is optional and <countryCode> is a country code
    -->
    <xsl:variable name="LOCALIZED_VALUES_FOLDER_NAME_PREFIX" 
                  select="concat ($DEFAULT_FOLDER_NAME, $g_androidLocaleSeparator)"/>
    
    <xsl:variable name="filePath">
      <xsl:choose>
        <xsl:when test="$p_localeData/@androidLocale != ''">
          <!-- $p_localeData/@oracleLocale must also have a non-empty value since androidLocale is 
               non-empty. -->
          <xsl:value-of select="concat ($XSL_PARAM_targetDirectoryPath, 
                                        $LOCALIZED_VALUES_FOLDER_NAME_PREFIX, 
                                        $p_localeData/@androidLocale, 
                                        $g_FILE_PATH_SEPARATOR, 
                                        $p_fileName)"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="concat ($XSL_PARAM_targetDirectoryPath, 
                                        $DEFAULT_FOLDER_NAME,
                                        $g_FILE_PATH_SEPARATOR, 
                                        $p_fileName)"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:value-of select="$filePath"/>
  </xsl:function>

  <!-- *********************************************************************************************
    This template creates an maf_arrays.xml in a directory whose name indicates it is a localized 
    maf_arrays.xml.
    
    param: p_fileName name of the maf_arrays.xml file
    param: p_localeData an optional LocaleData element.
    param: p_appElement an adfmf:application element
  -->
  <xsl:template name="android:createLocalizedArraysXml">
    <xsl:param name="p_fileName" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_localeData" 
               as="element(LocaleData)" 
               required="no"/>
               
    <xsl:param name="p_appElement" 
               as="element (adfmf:application)" 
               required="yes"/>
    
    <xsl:variable name="filePath"
                  select="android:getResourceFilePath($p_fileName, $p_localeData)"/>
    
    <xsl:result-document href="{$filePath}" indent="yes">
      <!-- Android arrays XML always has a <resources> root element. -->
      <resources>

        <!-- write the lists from the maf-application.xml file -->
        <xsl:call-template name="android:writeLists">
          <xsl:with-param name="p_appOrFeatureElement" select="$p_appElement"/>
          <xsl:with-param name="p_localeData" select="$p_localeData"/>
          <xsl:with-param name="p_baseXliffPath" select="$XSL_PARAM_applicationXliffBasePath"/>
        </xsl:call-template>
      
        <!-- write the strings for each locale and feature in the maf-feature.xml file -->
        <!-- Loop through the FAR JAR URLs and load each maf-feature.xml document -->
        <xsl:for-each select="$XSL_PARAM_FeatureArchiveUrlNodeSet"> 
        
          <xsl:variable name="featureArchiveUrl" select="." as="xsl:string"/>      
          <xsl:variable name="featureDoc" select="adfmf:loadFeatureDocument ($featureArchiveUrl)"/>
          <xsl:variable name="featuresElement" select="$featureDoc/adfmf:features"/>

          <!-- Loop through the list of featureReference's contained in maf-application.xml -->
          <xsl:for-each select="$gFeatureReferenceSet">

            <!-- featureId from featureReference element -->
            <xsl:variable name="featureId" select="@refId"/>

            <!-- Loop through each of the features in the current feature document and,
                 if the feature document has the featureId, write the lists.
            -->
            <xsl:for-each select="$featureDoc/adfmf:features">

              <xsl:variable name="featureElem" select="key('featureKey', $featureId)"/>
              
              <xsl:if test="$featureElem">
                <xsl:call-template name="android:writeLists">
                  <xsl:with-param name="p_appOrFeatureElement" select="$featureElem"/>
                  <xsl:with-param name="p_localeData" select="$p_localeData"/>
                  <xsl:with-param name="p_baseXliffPath" select="$featureArchiveUrl"/>
                </xsl:call-template>
              </xsl:if>              
            </xsl:for-each>
          </xsl:for-each>
        </xsl:for-each>
      </resources>  
    </xsl:result-document>
  </xsl:template>

  <!-- *********************************************************************************************
    This template writes each preferenceList element to maf_arrays.xml 
    
    param: p_appOrFeatureElement - an adfmf:application or adfmf:features element.
    param: p_localeData    - an optional LocaleData element.
    param: p_baseXliffPath - absolute URL path to the directory containing the base .xlif file.
  -->
  <xsl:template name="android:writeLists">
    <xsl:param name="p_appOrFeatureElement" 
               as="element (adfmf:application) or element (adfmf:feature)" 
               required="yes"/>
               
    <xsl:param name="p_localeData" 
               as="element(LocaleData)" 
               required="no"/>
               
    <xsl:param name="p_baseXliffPath" 
               as="xsl:string"
               required="no"/>
    
    <xsl:for-each select="$p_appOrFeatureElement//adfmf:preferenceList">
      
      <!-- Write out the 'name' values of each preferenceValue node as an Android <string-array> -->
      <xsl:variable name="prefList" select="."/>

      <xsl:call-template name="android:writeStringArrayElement">
        <xsl:with-param name="p_appOrFeatureElement" select="$p_appOrFeatureElement"/>
        <xsl:with-param name="p_prefList" select="$prefList"/>
        <xsl:with-param name="p_preferenceValueAttributeName" select="$g_adfmfNameAttributeName"/>
        <xsl:with-param name="p_localeData" select="$p_localeData"/>
        <xsl:with-param name="p_baseXliffPath" select="$p_baseXliffPath"/>
      </xsl:call-template>
      
      <!-- Write out the 'value' values of each preferenceValue node as an Android <string-array> -->
      <xsl:call-template name="android:writeStringArrayElement">
        <xsl:with-param name="p_appOrFeatureElement" select="$p_appOrFeatureElement"/>
        <xsl:with-param name="p_prefList" select="$prefList"/>
        <xsl:with-param name="p_preferenceValueAttributeName" select="$g_adfmfValueAttributeName"/>
        <xsl:with-param name="p_localeData" select="$p_localeData"/>
        <xsl:with-param name="p_baseXliffPath" select="$p_baseXliffPath"/>
      </xsl:call-template>

    </xsl:for-each>
  </xsl:template>
  <!-- *********************************************************************************************
      Generates a reference to a string resource.  The reference is used in maf_preferences.xml and
      the maf_strings.xml contains the actual string.
      
      param:  p_stringId the android string id of the string.
   -->
  <xsl:template name="android:generateStringIdReference">
      <xsl:param name="p_stringId" 
                 as="xsl:string" 
                 required="yes"/>
      
      <!-- Contains the prefix of an Android string reference of the form '@string/<stringId>' -->
      <xsl:variable name="STRING_REFERENCE_PREFIX" select="'@string/'"/>

      <xsl:value-of select="concat ($STRING_REFERENCE_PREFIX, $p_stringId)"/>
   </xsl:template>

  <!-- *********************************************************************************************
        Create a maf_strings.xml file located in the directory specified as a parameter
        to the XSL and populates it with Android list preferences.  
        
        The file contains the string identifiers and values for all the ADFmf preferences having a 
        label attribute.
        
        param:  p_appElement - an adfmf:application element.
   -->
  <xsl:template name="android:createStringsXmlFile">
    <xsl:param name="p_appElement" 
               as="element (adfmf:application)" 
               required="yes"/>
    
    <xsl:variable name="STRINGS_XML" select="'maf_strings.xml'"/>
    
    <!-- Create the default maf_strings.xml file -->
    <xsl:call-template name="android:createLocalizedStringsXml">
      <xsl:with-param name="p_fileName" select="$STRINGS_XML"/>
      <xsl:with-param name="p_appElement" select="$p_appElement"/>
      <xsl:with-param name="p_localeData"/>
      <xsl:with-param name="p_baseXliffPath" select="$XSL_PARAM_applicationXliffBasePath"/>
    </xsl:call-template>

      <!-- Create a maf_strings.xml file for each locale -->
      <xsl:for-each select="$XSL_PARAM_LocaleDataElements">
        <xsl:call-template name="android:createLocalizedStringsXml">
          <xsl:with-param name="p_fileName" select="$STRINGS_XML"/>
          <xsl:with-param name="p_appElement" select="$p_appElement"/>
          <xsl:with-param name="p_localeData" select="."/>
          <xsl:with-param name="p_baseXliffPath" select="$XSL_PARAM_applicationXliffBasePath"/>
        </xsl:call-template>
      </xsl:for-each>
   </xsl:template>
   
  <!-- *********************************************************************************************
    This template creates a maf_strings.xml in a directory whose name indicates it is a localized 
    maf_strings.xml.
    
    param: p_fileName - name of the maf_strings.xml file
    param: p_appElement - an adfmf:application element
    param: p_localeData    - an optional LocaleData element.
    param: p_baseXliffPath - absolute URL path to the directory containing the base .xlif file.
  -->
   
  <xsl:template name="android:createLocalizedStringsXml">
    <xsl:param name="p_fileName" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_appElement" 
               as="element (adfmf:application)"/>
               
    <xsl:param name="p_localeData" 
               as="element(LocaleData)" 
               required="no"/>
               
    <xsl:param name="p_baseXliffPath"
               as="xsl:string" 
               required="yes"/>

    <xsl:variable name="filePath"
                  select="android:getResourceFilePath($p_fileName, $p_localeData)"/>

    <xsl:result-document href="{$filePath}" indent="yes">
       <!-- Android strings XML always has a <resources> root element. -->
       <resources>
  
        <xsl:call-template name="android:writeApplicationName">
          <xsl:with-param name="p_appElement" select="$p_appElement"/>
          <xsl:with-param name="p_localeData" select = "$p_localeData"/>
          <xsl:with-param name="p_baseXliffPath" select="$p_baseXliffPath"/>
        </xsl:call-template>
  
        <!-- write the strings from the maf-application.xml file -->
        <xsl:call-template name="android:writeStrings">
          <xsl:with-param name="p_appOrFeatureElement" select="$p_appElement"/>
          <xsl:with-param name="p_localeData" select="$p_localeData"/>
          <xsl:with-param name="p_featureId"/>
          <xsl:with-param name="p_baseXliffPath" select="$p_baseXliffPath"/>
        </xsl:call-template>

        <!-- write the strings for each feature the maf-feature.xml file -->
        
        <!-- Loop through the FAR JAR URLs and load each maf-feature.xml document -->
        <xsl:for-each select="$XSL_PARAM_FeatureArchiveUrlNodeSet">
  
          <xsl:variable name="featureArchiveUrl" select="." as="xsl:string"/>      
          <xsl:variable name="featureDoc" select="adfmf:loadFeatureDocument ($featureArchiveUrl)"/>
          <xsl:variable name="featuresElement" select="$featureDoc/adfmf:features"/>
          <!-- Loop through the list of featureReference's contained in maf-application.xml -->
          <xsl:for-each select="$gFeatureReferenceSet">
            
            <!-- featureId from featureReference element -->
            <xsl:variable name="featureId" select="@refId"/>
            
            <!-- Loop through each of the features in the current feature document and,
                 if the feature document has the featureId, write the strings.
            -->
            <xsl:for-each select="$featureDoc/adfmf:features">
            
              <xsl:variable name="featureElem" 
                            select="key('featureKey', $featureId)" 
                            as="element(adfmf:feature)"/>
                            
              <!-- Verify the FAR has the feature identified by featureId -->
              <xsl:if test="$featureElem">
                <xsl:call-template name="android:writeStrings">
                  <xsl:with-param name="p_appOrFeatureElement" select="$featureElem"/>
                  <xsl:with-param name="p_localeData" select="$p_localeData"/>
                  <xsl:with-param name="p_featureId" select="$featureId"/>
                  <xsl:with-param name="p_baseXliffPath" select="$featureArchiveUrl"/>
                </xsl:call-template>
              </xsl:if>
            </xsl:for-each> <!-- end for-each feature -->
          </xsl:for-each> <!-- end for-each feature reference -->
        </xsl:for-each> <!-- end for-each FAR -->
      </resources>  
    </xsl:result-document>
  </xsl:template>

  <!-- *********************************************************************************************
    This template writes the application name to maf_strings.xml.  The value for the "name" attribute 
    must be "app_name" as it is written to AndroidManifest.xml at deploy time.  This value is 
    rendered under the application icon.

    param: p_appElement - an adfmf:application element
    param: p_localeData    - an optional LocaleData element.
    param: p_baseXliffPath - absolute URL path to the directory containing the base .xlif file.
  -->
  <xsl:template name="android:writeApplicationName">
    <xsl:param name="p_appElement" 
               as="element (adfmf:application)" 
               required="yes"/>
               
    <xsl:param name="p_localeData" 
               as="element(LocaleData)" 
               required ="no"/>
                 
    <xsl:param name="p_baseXliffPath" 
               as="xsl:string" 
               required="yes"/>
    
    <xsl:variable name="bIsResourceBundleRef" 
                  select="adfmf:hasStringResourceReference ($p_appElement/@name)"/>

    <xsl:variable name="appNameValue">
      <xsl:choose>
  
        <xsl:when test="$bIsResourceBundleRef = false()">
          <xsl:value-of select="$p_appElement/@name"/>
        </xsl:when>
  
        <xsl:otherwise>
          <xsl:variable name="xliffValue" 
                        select="adfmf:getStringFromXliffFile ($p_appElement, 
                                                              $p_baseXliffPath,
                                                              $p_appElement/@name, 
                                                              $p_localeData/@oracleLocale)"/>

          <xsl:value-of select="$xliffValue"/>
          
        </xsl:otherwise>
  
      </xsl:choose>
    </xsl:variable>
    
    <xsl:if test="$appNameValue != ''">
      <string>
        <xsl:attribute name="name">app_name</xsl:attribute>
        <xsl:value-of select="$appNameValue"/>
      </string>
    </xsl:if>
  </xsl:template>
  
  <!-- *********************************************************************************************
    This template writes a <string> element to maf_strings.xml if p_stringId and p_stringValue are both 
    not empty
    param: p_appOrFeatureElement - an adfmf:application or adfmf:feature element.
    param: p_stringId - the android string id (may be empty)
    param: p_stringValue - the value (may be empty)
    param: p_bIsResourceBundleRef - whether or not the string value is resource bundle reference.
    param: p_localeData - an optional LocaleData element.
    param: p_baseXliffPath - absolute URL path to the directory containing the base .xlif file.
  -->
  <xsl:template name="android:writeStringElement">
    <xsl:param name="p_appOrFeatureElement" 
               as="element (adfmf:application) or element (adfmf:feature)" 
               required="yes"/>
               
    <xsl:param name="p_stringId" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_stringValue" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_bIsResourceBundleRef" 
               as="xsl:boolean" 
               required="yes"/>
               
    <xsl:param name="p_localeData" 
               as="element(LocaleData)" 
               required="no"/>
               
    <xsl:param name="p_baseXliffPath" 
               as="xsl:string" 
               required="yes"/>

    <!-- Attribute name for an Android <string> element in maf_strings.xml -->
    <xsl:variable name="ANDROID_STRING_NAME_ATTRIBUTE" select="'name'"/>

    <xsl:if test="string-length ($p_stringId) > 0 and string-length ($p_stringValue) > 0">
      <xsl:choose>

        <xsl:when test="$p_bIsResourceBundleRef = true()">
          <xsl:variable name="xliffValue" 
                        select="adfmf:getStringFromXliffFile ($p_appOrFeatureElement, 
                                                              $p_baseXliffPath,
                                                              $p_stringValue, 
                                                              $p_localeData/@oracleLocale)"/>

          <xsl:if test="string-length ($xliffValue) > 0">
            <string>
              <xsl:attribute name="{$ANDROID_STRING_NAME_ATTRIBUTE}">
                <xsl:value-of select="$p_stringId"/>
              </xsl:attribute>
              
              <!-- Escape any special characters in the value and write it.  -->
              <xsl:call-template name="android:escapeCharactersInString">
                <xsl:with-param name="p_sourceString" select="$xliffValue"/>
                <xsl:with-param name="p_entryList" 
                                select="$g_ESCAPE_CHARACTER_MAP/android:entries/android:entry"/>
              </xsl:call-template>
              
            </string>
          </xsl:if>
        </xsl:when>
  
        <xsl:otherwise>
          <string>
            <xsl:attribute name="{$ANDROID_STRING_NAME_ATTRIBUTE}">
              <xsl:value-of select="$p_stringId"/>
            </xsl:attribute>
            
            <!-- Escape any special characters in the value and write it.  -->
            <xsl:call-template name="android:escapeCharactersInString">
              <xsl:with-param name="p_sourceString" select="$p_stringValue"/>
              <xsl:with-param name="p_entryList" 
                              select="$g_ESCAPE_CHARACTER_MAP/android:entries/android:entry"/>
            </xsl:call-template>
          </string>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:if>
   </xsl:template>
   
  <!--
      Writes out all the strings to maf_strings.xml
        
      param: p_appOrFeatureElement an adfmf:application or adfmf:feature element
      param: p_localeData - an optional LocaleData element.
      param: p_featureId a feature id if the string belongs to a feature.
      param: p_baseXliffPath - absolute URL path to the directory containing the base .xlif file.
   -->
  <xsl:template name="android:writeStrings">
    <xsl:param name="p_appOrFeatureElement" 
               as="element (adfmf:application) or element (adfmf:feature)" 
               required="yes"/>
               
    <xsl:param name="p_localeData" 
               as="element(LocaleData)" 
               required="no"/>
               
    <xsl:param name="p_featureId" 
               as="xsl:string" 
               required="no"/>
               
    <xsl:param name="p_baseXliffPath" 
               as="xsl:string" 
               required="yes"/>

    <xsl:for-each select="$p_appOrFeatureElement/descendant-or-self::node()/@*">

      <xsl:variable name="currAttribute" as="attribute()" select="."/>
      <xsl:variable name="loadBundleVarValue" select="adfmf:getLoadBundleVar ($currAttribute)"/>
      <xsl:variable name="resourceStringPrefix"
                    select="adfmf:createResourceStringPrefix ($loadBundleVarValue, $p_featureId)"/>
      
      <xsl:variable name="bIsResourceBundleRef" 
                    as="xsl:boolean" 
                    select="adfmf:hasStringResourceReference ($currAttribute)"/>
                    
      <xsl:variable name="bIsPreferenceAttribute" 
                    as="xsl:boolean" 
                    select="adfmf:isPreferenceAttribute ($currAttribute)"/>
                    
      <xsl:variable name="stringId" 
                    select="android:getStringId ($currAttribute, 
                                                 $bIsResourceBundleRef, 
                                                 $bIsPreferenceAttribute, 
                                                 $resourceStringPrefix)"/>

        <xsl:variable name="stringValue" as="xsl:string">
          <xsl:choose>
            <!-- if the attribute is a preferenceValue attribute, then do not write the
                 string to maf_strings.xml.  The strings for preferenceValue are written to
                 maf_arrays.xml directly and don't need to be in maf_strings.xml.
            -->
            <xsl:when test="ancestor::adfmf:preferenceValue">
                  <xsl:value-of select="$g_emptyString"/>
            </xsl:when>
            <!-- if the attribute is the 'default' attribute:
                  * skip it if it is a preferenceList attribute having a string resource bundle 
                    reference because the localized list elements are written out when they are 
                    encountered.  If the default is not localized, then we have write a reference to
                    the default value
                  * skip it if it is not a preferenceList or preferenceText default as these are the
                    only preferences that have default values that should be in maf_strings.xml.
            -->
            <xsl:when test="name($currAttribute) = $g_adfmfDefaultAttributeName">
                <xsl:choose>
                  <xsl:when test="ancestor::adfmf:preferenceList and
                                  $bIsResourceBundleRef=true()">
                    <xsl:value-of select="$g_emptyString"/>
                  </xsl:when>
                  <xsl:when test="not(ancestor::adfmf:preferenceList) and
                                  not(ancestor::adfmf:preferenceText)">
                      <xsl:value-of select="$g_emptyString"/>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:value-of select="$currAttribute"/>
                  </xsl:otherwise>
                  
                </xsl:choose>
            </xsl:when>
            <xsl:when test="name($currAttribute) = $g_adfmfIdAttributeName and ../@label">
              <xsl:value-of select="../@label"/>
            </xsl:when>
            
            <xsl:otherwise>
              <xsl:value-of select="$currAttribute"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        
        <xsl:call-template name="android:writeStringElement">
          <xsl:with-param name="p_appOrFeatureElement" select="$p_appOrFeatureElement"/>
          <xsl:with-param name="p_stringId" select="$stringId"/>
          <xsl:with-param name="p_stringValue" select="$stringValue"/>
          <xsl:with-param name="p_bIsResourceBundleRef" select="$bIsResourceBundleRef"/>
          <xsl:with-param name="p_localeData" select="$p_localeData"/>
          <xsl:with-param name="p_baseXliffPath" select="$p_baseXliffPath"/>
      </xsl:call-template>
    </xsl:for-each>
   </xsl:template>
  <!-- *********************************************************************************************
         This template writes an ADFmf preferenceGroup as an Android PreferenceScreen or 
         PreferenceCategory.
         
         param:  p_appElement an adfmf:application element whose preferences are to be written to 
                 maf_preferences.xml.
         
         If a given ADFmf attribute value is a resource bundle reference, the constructed 
         maf_preferences.xml will contain an android-style reference to a localizable string 
         contained in maf_strings.xml.  
         
         This template does not:
         1) transform any resource bundle references that are part of non-preference constructs.  
         2) construct maf_strings.xml file(s) containing the localized strings.
   -->
  <xsl:template name="android:writeApplicationPreferences">
    <xsl:param name="p_appElement" 
               as="element (adfmf:application)" 
               required="yes"/>

    <xsl:for-each select="$p_appElement/adfmf:preferences/adfmf:*">
      <xsl:choose>
        <xsl:when test=".[self::adfmf:preferenceGroup]">
          <!-- Transform the current preference group elements to Android counterparts.-->
          <xsl:call-template name="android:writePreferenceGroup">
            <xsl:with-param name="p_prefGroup" select="."/>
            <xsl:with-param name="p_featureId"/>
          </xsl:call-template>
        </xsl:when>
      </xsl:choose>
    </xsl:for-each>
   </xsl:template>

  <!-- *********************************************************************************************
      Writes an ADFmf preferenceGroup contained in maf-feature.xml as an Android PreferenceScreen or 
      PreferenceCategory.
   -->
  <xsl:template name="android:writeFeaturePreferences">

    <!-- Loop through the FAR JAR URLs and load each maf-feature.xml document -->
    <xsl:for-each select="$XSL_PARAM_FeatureArchiveUrlNodeSet">
    
      <xsl:variable name="featureArchiveUrl" select="." as="xsl:string"/>      
      <xsl:variable name="featureDoc" select="adfmf:loadFeatureDocument ($featureArchiveUrl)"/>
      <xsl:variable name="featuresElement" select="$featureDoc/adfmf:features"/>
      
      <!-- Loop through the list of featureReference's contained in maf-application.xml -->
      <xsl:for-each select="$gFeatureReferenceSet">

        <!-- featureId from featureReference element -->
        <xsl:variable name="featureId" select="@refId"/>
   
        <!-- Loop through each of the features in the current feature document and,
             if the feature document has the featureId, write the feature preferences.
        -->
        <xsl:for-each select="$featureDoc/adfmf:features">
        
          <xsl:variable name="featureElem" select="key('featureKey', $featureId)"/>
          
          <xsl:if test="$featureElem">
             <!-- Loop through each preference group and write it -->
             <xsl:for-each select="$featureElem/adfmf:preferences/adfmf:preferenceGroup">
                <xsl:choose>
                  <xsl:when test=".[self::adfmf:preferenceGroup]">
                    <!-- Transform the current preference group elements to Android counterparts.-->
                    <xsl:call-template name="android:writePreferenceGroup">
                      <xsl:with-param name="p_prefGroup" select="."/>
                      <xsl:with-param name="p_featureId" select="$featureId"/>
                    </xsl:call-template>
                  </xsl:when>
                </xsl:choose>
            </xsl:for-each>
          </xsl:if>
        </xsl:for-each>
      </xsl:for-each>
    </xsl:for-each>
   </xsl:template>
  <!-- *********************************************************************************************
      Builds the default value for a text preference.

      This template specifies a value of an empty string if the given xmlValue is not defined.  
      Otherwise, iT specifies the given xmlValue for the android:defaultValue value.
      
      p_xmlValue        - a value from the maf-application.xml or maf-feature.xml containing the
                          value of the "default" attribute of the ADFmf preferenceText.  May be 
                          null/empty.
      p_id              - the id of the preferenceText
      p_featureId - the name of the feature if the given p_xmlValue belongs to a feature.
   -->
  <xsl:template name="android:getTextDefaultValue">
    <xsl:param name="p_xmlValue" 
               as="attribute()" 
               required="no"/>
               
    <xsl:param name="p_id" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_featureId" 
               as="xsl:string"
               required="yes"/>

    <xsl:variable name="bIsResourceBundleRef" as="xsl:boolean"
                  select="adfmf:hasStringResourceReference ($p_xmlValue)"/>

      <xsl:choose>
        <xsl:when test="$p_xmlValue != $g_emptyString">
          <!-- 
            Specify string reference to a string in maf_strings.xml only if the value is associated with
            a  preferenceText preference.
            This template is invoked for getting a default value for a preferenceNumber which should
            not be a string reference to string in maf_strings.xml
          -->
          <xsl:choose>
            <xsl:when test="$p_xmlValue/ancestor::adfmf:preferenceText">
                  <xsl:variable name="loadBundleVarValue" 
                                select="adfmf:getLoadBundleVar ($p_xmlValue)"/>
                  <xsl:variable name="resourceStringPrefix"
                    select="adfmf:createResourceStringPrefix ($loadBundleVarValue, $p_featureId)"/>

              <xsl:variable name="stringId"
                            select="android:getStringId ($p_xmlValue, 
                                                         $bIsResourceBundleRef, 
                                                         true(), 
                                                         $resourceStringPrefix)"/>
        
              <xsl:variable name="stringIdReference">
                <xsl:call-template name="android:generateStringIdReference">
                  <xsl:with-param name="p_stringId" select="$stringId"/>
                </xsl:call-template>
              </xsl:variable>
    
              <xsl:value-of select="$stringIdReference"/>
            </xsl:when>
            
            <xsl:otherwise>
              <xsl:value-of select="$p_xmlValue"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="$g_emptyString"/>
        </xsl:otherwise>
      </xsl:choose>  
   </xsl:template>
  <!-- *********************************************************************************************
      Builds the default value for a boolean preference.  
      
      This template specifies a value of "false" if the given xmlValue is not defined.  Otherwise,
      is specifies the given xmlValue for the android:defaultValue value.
      
      p_xmlValue        - a value from the maf-application.xml or maf-feature.xml containing the
                          value of the "default" attribute of the ADFmf preferenceBoolean.  May be 
                          null/empty.
      p_id              - the id of the preferenceBoolean
   -->
  <xsl:template name="android:getBooleanDefaultValue">
    <xsl:param name="p_xmlValue" 
               as="xsl:string" 
               required="no"/>
               
    <xsl:param name="p_id"
               as="xsl:string" 
               required="yes"/>

    <xsl:choose>
      <xsl:when test="$p_xmlValue">
        <xsl:value-of select="$p_xmlValue"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="'false'"/>
      </xsl:otherwise>
    </xsl:choose>
   </xsl:template>
  <!-- *********************************************************************************************
      Builds the default value for a list preference.  The adfmf:preferenceList element defines the 
      "default" attribute to be one of the "value" members of the preferenceList's child 
      adfmf:preferenceValue  elements.  
      
      This template iterates the given preferenceList to find the value and specify the 
      corresponding "name" attribute.  If one is not found, an empty string is specified.
      
      p_xmlValue        - a value from the maf-application.xml or maf-feature.xml containing the
                          value of the "default" attribute of the ADFmf preferenceList.  May be 
                          null/empty.
      p_prefList        - an adfmf:preferenceList element
      p_id              - the id of the preferenceText
      p_featureId - the name of the feature if the given p_xmlValue belongs to a feature.
      
   -->
  <xsl:template name="android:getListDefaultValue">
    <xsl:param name="p_xmlValue" 
               as="attribute" 
               required="no"/>
    
    <xsl:param name="p_prefList" 
               as="element (adfmf:preferenceList)" 
               required="yes"/>
               
    <xsl:param name="p_id" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_featureId" 
               as="xsl:string" 
               required="yes"/>
      
    <xsl:variable name="defaultValue">
      <xsl:choose>
  
        <xsl:when test="string-length ($p_prefList/@default) > 0">
          <xsl:variable name="bIsResourceBundleRef" as="xsl:boolean"
                        select="adfmf:hasStringResourceReference ($p_prefList/@default)"/>
    
          <xsl:variable name="loadBundleVarValue" select="adfmf:getLoadBundleVar ($p_xmlValue)"/>
          <xsl:variable name="resourceStringPrefix"
                    select="adfmf:createResourceStringPrefix ($loadBundleVarValue, $p_featureId)"/>

          <xsl:variable name="stringId"
                        select="android:getStringId ($p_prefList/@default, 
                                                     $bIsResourceBundleRef, 
                                                     true(), 
                                                     $resourceStringPrefix)"/>

          <xsl:variable name="stringIdReference">
            <xsl:call-template name="android:generateStringIdReference">
              <xsl:with-param name="p_stringId" select="$stringId"/>
            </xsl:call-template>
          </xsl:variable>

        <xsl:value-of select="$stringIdReference"/>
      </xsl:when>
  
      <xsl:otherwise>
        <xsl:value-of select="$g_emptyString"/>
      </xsl:otherwise>
    
      </xsl:choose>
      
    </xsl:variable>    
    <xsl:value-of select="$defaultValue"/>
   </xsl:template>
   
     <!-- ******************************************************************************************
      This template writes the android:key and android:title attributes to maf_preferences.xml
      
      p_prefNode - a preference node
      p_featureId - the name of the feature if the given p_prefNode belongs to a feature.
   -->
   <xsl:template name="android:writeKeyAndTitlePreferenceAttributes">
      <xsl:param name="p_prefNode" 
                 as="element (adfmf:preferenceText) or 
                     element (adfmf:preferenceBoolean) or
                     element (adfmf:preferenceNumber) or
                     element (adfmf:preferenceList) or
                     element (adfmf:preferencePage) or
                     element (adfmf:preferenceGroup)" 
                     required="yes"/>
                     
      <xsl:param name="p_featureId" 
                 as="xsl:string" 
                 required="no"/>

        <xsl:attribute name="android:key">
          <xsl:value-of select="adfmf:generatePreferenceId ($p_prefNode)"/>
        </xsl:attribute>

        <xsl:variable name="bIsResourceBundleRef" as="xsl:boolean"
                      select="adfmf:hasStringResourceReference ($p_prefNode/@label)"/>

        <!-- The preference node 'label' attribute value maps to the android:title
             attribute.  Output the title only if a label exists. -->
        <xsl:if test="$p_prefNode/@label and string-length ($p_prefNode/@label) > 0">
          <xsl:variable name="loadBundleVarValue" 
                        select="adfmf:getLoadBundleVar ($p_prefNode/@label)"/>
                        
          <xsl:variable name="resourceStringPrefix"
                        select="adfmf:createResourceStringPrefix ($loadBundleVarValue, 
                                                                  $p_featureId)"/>
          <xsl:variable name="stringId"
                        select="android:getStringId ($p_prefNode/@label, 
                                                     $bIsResourceBundleRef, 
                                                     true(), 
                                                     $resourceStringPrefix)"/>
      
          <xsl:variable name="stringRef">
            <xsl:call-template name="android:generateStringIdReference">
              <xsl:with-param name="p_stringId" select="$stringId"/>
            </xsl:call-template>
          </xsl:variable>
      
          <xsl:attribute name="android:title">
            <xsl:value-of select="$stringRef"/>
          </xsl:attribute>
        </xsl:if>
   </xsl:template>

  <!-- *********************************************************************************************
      This template writes an android <string-array> element to an maf_arrays.xml file for the given
      prefList preference list.  Each adfmf:preferenceList is represented in maf_arrays.xml as two 
      Android <string-array> elements where one <string-array> element contains the entries in the 
      list and the other <string-array> element contains the entry values.  
      
      Note that:
      * the adfmf:preferenceValue/@name maps to a <string-array> element whose name ends with, 
        "___entries", and the elements in this list may be localized.
        
      * the adfmf:preferenceValue/@value maps to a <string-array> eleement whose name ends with, 
        "___entry_values", and the elements in this list should not be localized.
      
      param: p_appOrFeatureElement  - an adfmf:application or adfmf:feature element
  
      param: p_prefList - an adfmf:preferenceList whose adfmf:preferenceValue elements are to be 
                          written as an android <string-array> element.
      
      param: p_preferenceValueAttributeName - the name of the adfmf preferenceValue attribute to use 
                                              when writing an adfmf  preferenceValue.  Can be 'name' 
                                              or 'value'. 
      
      param: p_localeData an optional LocaleData element.

      param: p_baseXliffPath - absolute URL path to the directory containing the base .xlif file.
      
   -->
  <xsl:template name="android:writeStringArrayElement">
    <xsl:param name="p_appOrFeatureElement" 
               as="element (adfmf:application) or element (adfmf:feature)" 
               required="yes"/>
               
    <xsl:param name="p_prefList" 
               as="element(adfmf:listPreference)" 
               required="yes"/>
               
    <xsl:param name="p_preferenceValueAttributeName" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_localeData" 
               as="element(LocaleData)" 
               required="no"/>
               
    <xsl:param name="p_baseXliffPath" 
               as="xsl:string" 
               required="yes"/>

      <string-array>

        <xsl:variable name="nameAttributeValue">
          <xsl:choose>
            <xsl:when test="$p_preferenceValueAttributeName = $g_adfmfNameAttributeName">
              <xsl:call-template name="android:generateEntriesId">
                <xsl:with-param name="p_arrayId" select="$p_prefList/@id"/>
              </xsl:call-template>
            </xsl:when>
            <xsl:otherwise>
              <xsl:call-template name="android:generateEntryValuesId">
                <xsl:with-param name="p_arrayId" select="$p_prefList/@id"/>
              </xsl:call-template>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:variable>

        <xsl:attribute name="{$g_adfmfNameAttributeName}">
          <xsl:value-of select="$nameAttributeValue"/>
        </xsl:attribute>
    
        <xsl:for-each select="$p_prefList/adfmf:preferenceValue">
          <item>
            <xsl:variable name="itemAttribute">
              <xsl:choose>

                <xsl:when test="$p_preferenceValueAttributeName = 'name'">
                  <xsl:value-of select="@name"/>
                </xsl:when>

                <xsl:otherwise>
                  <xsl:value-of select="@value"/>
                </xsl:otherwise>
                
              </xsl:choose>
            </xsl:variable>
            
            <xsl:variable name="bIsResourceBundleRef" as="xsl:boolean"
                          select="adfmf:hasStringResourceReference ($itemAttribute)"/>
            
            <xsl:choose>
              <xsl:when test="$bIsResourceBundleRef = true()">

                <xsl:variable name="xliffValue" 
                              select="adfmf:getStringFromXliffFile ($p_appOrFeatureElement, 
                                                                    $p_baseXliffPath,
                                                                    $itemAttribute, 
                                                                    $p_localeData/@oracleLocale)"/>
                
                <xsl:if test="$xliffValue != ''">
                  <!-- Escape any special characters in the value and write it. -->
                  <xsl:call-template name="android:escapeCharactersInString">
                    <xsl:with-param name="p_sourceString" select="$xliffValue"/>
                    <xsl:with-param name="p_entryList" 
                                    select="$g_ESCAPE_CHARACTER_MAP/android:entries/android:entry"/>
                  </xsl:call-template>
                </xsl:if>
              </xsl:when>
              <xsl:otherwise>
                  <!-- Escape any special characters in the value and write it. -->
                  <xsl:call-template name="android:escapeCharactersInString">
                    <xsl:with-param name="p_sourceString" select="$itemAttribute"/>
                    <xsl:with-param name="p_entryList" 
                                    select="$g_ESCAPE_CHARACTER_MAP/android:entries/android:entry"/>
                  </xsl:call-template>
              </xsl:otherwise>
            </xsl:choose>
          </item>
        </xsl:for-each>
      </string-array>
  </xsl:template>
  
  <!-- *********************************************************************************************
    This template searches the given p_sourceString for characters (represented
    as strings) that need to be escaped and replaces the characters with the
    escaped version.
    
    param: p_sourceString - a string to be searched for sub-strings that need to be escaped
    param: p_entryList - a 'list' of android:entry elements mapping non-escaped 
                         character (as a string) to it's escaped equivalent.  See
                         definition of global variable g_ESCAPE_CHARACTER_MAP for
                         more information on how the values are mapped.
  -->
  <xsl:template name="android:escapeCharactersInString">
    <xsl:param name="p_sourceString" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_entryList" 
               as="element (android:entry)" 
               required="yes"/>

    <xsl:choose>

      <xsl:when test="$p_entryList">
      
        <!-- Using the first android:entry in the list, replace the 
             non-escaped string with the escaped string and save it
             in a variable.  -->
        <xsl:variable name="newString">
          <xsl:call-template name="adfmf:string-replace-all">
            <xsl:with-param name="p_sourceString" select="$p_sourceString"/>
            <xsl:with-param name="p_searchString" select="$p_entryList[1]/android:nonescaped"/>
            <xsl:with-param name="p_replaceString" select="$p_entryList[1]/android:escaped"/>
          </xsl:call-template>
        </xsl:variable>

        <!-- recursively call the template passing:
             1) the android:entry element(s) after the first android:entry in the list 
             2) the new string created above
        -->
        <xsl:call-template name="android:escapeCharactersInString">
          <xsl:with-param name="p_sourceString" select="$newString"/>
          <xsl:with-param name="p_entryList" select="$p_entryList[position () > 1]"/> 
        </xsl:call-template>
      </xsl:when>
        
      <xsl:otherwise>
        <!-- Traversed the entire list.  Output the current source string. -->
        <xsl:value-of select="$p_sourceString"/>
      </xsl:otherwise>

    </xsl:choose>
  </xsl:template>
   
</xsl:stylesheet>