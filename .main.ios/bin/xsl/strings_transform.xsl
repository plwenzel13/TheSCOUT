<?xml version="1.0" encoding="windows-1252" ?>
<xsl:stylesheet version="2.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:adfmf="http://xmlns.oracle.com/adf/mf"
                xmlns:xlf="urn:oasis:names:tc:xliff:document:1.1"
                xmlns:FileUtils=
                      "http://www.oracle.com/XSL/Transform/java/oracle.tools.maf.build.settings.FileUtils"
>
  <!--
  Design for iOS Deployment Internationalization is at:
  
     http://aseng-wiki.us.oracle.com/asengwiki/display/ASDevJDeveloper/Design+for+iOS+Deployment+
        Internationalization#DesignforiOSDeploymentInternationalization-DeploymentOutput

  Implementation Notes:
  Name space "xlf" is required to access XML nodes in the XLIFF files.  It is required because nodes
  in the .xlf file are bound to the default (un-named) name space in that file.  Therefore, 
  accessing XLIFF nodes from this stylesheet requires the following:
  
    1. We must explicitely use a name-space.
    2. The "xlf" name space defined here must match the default namespace in the XLIFF files.
  
  with the same value specified as the
  default name-space in the .xlf file.
  
  Without the "xlf" name-space, then the XLIFF nodes would be access via the default (un-named)
  namespace of this stylesheet which doesn't match the default name-space in the .xlf files.
  
  For details on this technique, see the following article, in section "XSLT" just above section 
  "Conclusion":
  
    http://www.edankert.com/defaultnamespaces.html

  String values passed as parameters into XSLT must be surrounded by single quotes so that it's 
  interpreted  as a string literal.
   
  The stylesheet parameters are defined with default values.  These are used only for isolated
  testing during development. Stylesheet parameters passed in from the calling Java code override 
  all default values declared by the stylesheet parameters. Thus, the default values have no effect
  when delivered to customers.
  -->
  <xsl:output method="text" indent="yes" name="iosStringsFile" encoding="UTF-16"/>
  <!--
  The following parameter identifies the full path to directory "Settings.bundle" where the .plist 
  files must be created. The value must be a URL string that is provided by the caller of this XSL.
  
  The URL string value must satisfy the following requirements.
  1. It must not be percent-encoded.
  2. It must be surrounded by single quotes so that it's interpreted as a string literal.
  
  An example value is below.
        
    'file:/C:/JDeveloper/mywork/MyAdfMobileApplication/deploy/IOS_MOBILE_NATIVE_archive1/
      temporary_xcode_project/Settings.bundle/'
         
  The default value is used only for unit testing and is overridden by the Java value passed in at 
  runtime.
  -->
  <xsl:param name="XSL_PARAM_TargetDirectoryPath"
             required="yes"
             as="xsl:string"
             select="'file:///C:/JDeveloper/mywork/Transformer/deploy/'"/>

  <!--
  This is the relative path of maf-feature.xml in feature archive JAR file.
  The relative path of file "maf-feature.xml" is always the same inside every FAR.
  However, it is provided by the caller in case the location ever changes.

  The URL string value must satisfy the following requirements.
  
  1. It must not be percent-encoded.
  2. It must be surrounded by single quotes so that it's interpreted as a string literal.

      Example:  'META-INF/maf-feature.xml'
  
  The default value is used only for unit testing and is overridden by the Java value passed in at 
  runtime.
  -->  
  <xsl:param name="XSL_PARAM_FeatureXmlRelativePathInFAR"
             required="yes"
             as="xsl:string"
             select="'META-INF/maf-feature.xml'"/>

  <!--
  Base path XLIFF files referenced from "maf-application.xml".
  
  The URL string value must satisfy the following requirements.
  
  1. It must not be percent-encoded.
  2. It must be surrounded by single quotes so that it's interpreted as a string literal.
  
  The default value is used only for unit testing and is overridden by the Java value passed in at 
  runtime.
  -->
  <xsl:param name="XSL_PARAM_ApplicationXliffBasePath"
             required="yes"
             as="xsl:string"
             select="'file:/C:/JDeveloper/mywork/Transformer/.adf/META-INF/'"/>

  <!--
  This parameter specifies a set of FAR URLs.  Each FAR URL must specify the jar protocol.
  To accomplish this, the Java caller must provide a sequence of FAR_URL elements.
  The content of each FAR_URL element specifies a FAR URL.  Each FAR URL must not be percent-
  encoded.
  
  The commented default value is used only for unit testing.
  -->
  <xsl:param name="XSL_PARAM_FeatureArchiveUrlNodeSet"
             required="yes">
  <!-- BUGBUG:
    Do not uncomment the default values for this parameter because it prevents
    the code from working when invoked from Java.  I'm guessing that the Java code
    is not overwriting the default value in that case, perhaps because the Java code
    paramter value is considered the equivalent of a select clause where as the default
    values are specified as element content.
  -->
<!-- BUGBUG:
     Specifying more than one default FAR in this stylesheet causes an error when testing this
     XSLT is isolation (i.e. without invoking it from Java). However, this is not a
     problem when invoking the xsl from Java which passes the data in as a parameter.
     
    <FAR_URL>jar:file:/C:/JDeveloper/mywork/Transformer/MyFars/mobileFeatureArchive1.jar!/</FAR_URL>     
    <FAR_URL>jar:file:/C:/JDeveloper/mywork/Transformer/MyFars/mobileFeatureArchive2.jar!/</FAR_URL>
    <FAR_URL>jar:file:/C:/JDeveloper/mywork/Transformer/MyFars/mobileFeatureArchive3.jar!/</FAR_URL>
-->
  </xsl:param>

  <!-- XLIFF file extension -->
  <xsl:variable name="g_XLIFF_FILE_EXTENSION" 
                select="'.xlf'" 
                as="xsl:string"/>

  <!-- Use when appending a language code to a base XLIFF file name. -->
  <xsl:variable name="g_LANGUAGE_CODE_SEPARATOR" 
                select="'_'"
                as="xsl:string"/>
  
  <!-- File extension for iOS preference files -->
  <xsl:variable name="g_IOS_LANGUAGE_DIRECTORY_EXTENSION" 
                select="'.lproj'"
                as="xsl:string"/>

  <!-- 
  Name of string resource file for iOS that holds the application name for a specific locale. 
  -->
  <xsl:variable name="g_IOS_STRING_RESOURCE_FILE_NAME_INFOPLIST" 
                select="'InfoPlist.strings'" 
                as="xsl:string"/>

  <!--
  Name of iOS string resource file for iOS that holds string resources referenced from
  "maf-application.xml", and referenced from FAR files by "maf-feature.xml", for a specific 
  locale.
  -->
  <xsl:variable name="g_TARGET_STRING_RESOURCE_FILE_NAME" 
                select="'Localizable.strings'"
                as="xsl:string"/>
  
  <!--
  Marks the start of a string resource reference from either maf-application.xml or 
  maf-feature.xml.  This constant is duplicated in file "PreferenceTransform.xsl".
  -->
  <xsl:variable name="g_STRING_RESOURCE_DELIMITER_START" select="'#{'" as="xsl:string"/>
  
  <!--
  Marks the end of a string resource reference from either maf-application.xml or 
  maf-feature.xml.  This constant is duplicated in file "PreferenceTransform.xsl".
  -->
  <xsl:variable name="g_STRING_RESOURCE_DELIMITER_END" select="'}'" as="xsl:string"/>
  
  <!--
  Dot separator character to use between tokens.
  This constant is duplicated in file "PreferenceTransform.xsl".
  -->
  <xsl:variable name="g_TOKEN_DELIMITOR_DOT" select="'.'" as="xsl:string"/>

  <!--
  Constant string literal that represents the prefix [' to a decorated
  string ID.
  This constant is duplicated in file "PreferenceTransform.xsl".
  -->
  <xsl:variable name="g_PREFIX_TO_STRING_ID_THAT_CONTAINS_DOTS" as="xsl:string">
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
  This constant is duplicated in file "PreferenceTransform.xsl".
  -->          
  <xsl:variable name="g_SUFFIX_TO_STRING_ID_THAT_CONTAINS_DOTS" as="xsl:string">
    <!--
    Initializing a string with an embedded apostrophe can be complicated when using
    using "xsl:variable/@select". Therefore, we use xsl:text to simplify how the string
    is specified.  This technique of using xsl:text to simplify a string definition having
    embedded quotes is taken from page 533 of book "XSLT 2.0 and XPath 2.0",
    4th edition, Programmer's Reference, by Michael Kay.
    -->
    <xsl:text>']</xsl:text>
  </xsl:variable>

  <xsl:variable name="g_FILE_PATH_SEPARATOR" select="'/'" as="xsl:string"/>
  
  <!--
  Application token that must preceded each iOS resource string identifier that comes from 
  "maf-application.xml".  This constant is duplicated in file "PreferenceTransform.xsl".
  -->
  <xsl:variable name="g_APPLICATION_CONTEXT_TOKEN" select="'application'" as="xsl:string"/>

  <!--
  Feature token that must preceded each iOS resource string identifier that comes from 
  "maf-feature.xml".  This constant is duplicated in file "PreferenceTransform.xsl".
  -->
  <xsl:variable name="g_FEATURE_CONTEXT_TOKEN" select="'feature'" as="xsl:string"/>
  
  <!-- This table maps Oracle language codes to iOS language codes.
       The name of each localized Oracle XLIFF file requires the following:
       1. The base XLIFF file name.
       2. An underscore suffix followed by an Oracle language code specified
          by one of the oracleCode attributes below.
          
          Loading XLIFF files from inside each FAR is case-sensitive because
          URL access to file elements in a jar (i.e. zip) file are case-sensitive.
          Thus, we configure all oracleCode language suffixes to be lower-case and
          require all localized XLIFF files to be named with a lower-case language
          suffix.  This allows element xsl:document to successfully load
          each XLIFF file from a FAR.

       If any XLIFF file uses an Oracle language code not in this list,
       then the XLIFF file will not be used as a source string resource text.
       That should never happen unless configuration is incorrect. But
       if it does, then the base XLIFF file would be used.
       
       Each iOS language code, specified by attribute iosCode, corresponds
       to an iOS language directory.  All iOS languages are listed in the table
       as of iOS 5.
  -->
  <xsl:variable name="g_LANGUAGE_CODES">
    <languages>
      <language oracleCode="en" iosCode="en"/>
      <language oracleCode="fr" iosCode="fr"/>
      <language oracleCode="de" iosCode="de"/>
      <language oracleCode="ja" iosCode="ja"/>
      <language oracleCode="nl" iosCode="nl"/>
      <language oracleCode="it" iosCode="it"/>
      <language oracleCode="es" iosCode="es"/>
      <language oracleCode="pt" iosCode="pt"/>
      <language oracleCode="pt_PT" iosCode="pt-PT"/>
      <language oracleCode="da" iosCode="da"/>
      <language oracleCode="fi" iosCode="fi"/>
      <language oracleCode="nb" iosCode="nb"/>
      <language oracleCode="sv" iosCode="sv"/>
      <language oracleCode="ko" iosCode="ko"/>
      <language oracleCode="zh_CN" iosCode="zh-Hans"/>
      <language oracleCode="zh_TW" iosCode="zh-Hant"/>
      <language oracleCode="ru" iosCode="ru"/>
      <language oracleCode="pl" iosCode="pl"/>
      <language oracleCode="tr" iosCode="tr"/>
      <language oracleCode="uk" iosCode="uk"/>
      <language oracleCode="ar" iosCode="ar"/>
      <language oracleCode="hr" iosCode="hr"/>
      <language oracleCode="cs" iosCode="cs"/>
      <language oracleCode="el" iosCode="el"/>
      <language oracleCode="he" iosCode="he"/>
      <language oracleCode="ro" iosCode="ro"/>
      <language oracleCode="sk" iosCode="sk"/>
      <language oracleCode="th" iosCode="th"/>
      <language oracleCode="id" iosCode="id"/>
      <language oracleCode="en_GB" iosCode="en-GB"/>
      <language oracleCode="ca" iosCode="ca"/>
      <language oracleCode="hu" iosCode="hu"/>
      <language oracleCode="vi" iosCode="vi"/>
    </languages>
  </xsl:variable>

  <!-- Standard representation for neutral double-quotes character -->
  <xsl:variable name="g_QUOTE" as="xsl:string">"</xsl:variable>
  
  <!-- Standard representation for backslash character -->
  <xsl:variable name="g_BACKSLASH" as="xsl:string">\</xsl:variable>
  
  <!-- Standard representation for carriage return -->
  <xsl:variable name="g_CARRIAGE_RETURN" as="xsl:string">
    <xsl:text>&#x0D;</xsl:text>
  </xsl:variable>
  
  <!-- Standard representation for line feed -->
  <xsl:variable name="g_LINE_FEED" as="xsl:string">
    <xsl:text>&#x0A;</xsl:text>
  </xsl:variable>
  
  <!-- This escaped double-quote is for normalizing text content prior to writing it to a *.strings
  file.  All *.strings files require a backslash to precede a neutral double-quote in the resource
  string content.  iOS interprets the backslash as an escape character within the *.strings file.
  To be clear, the XPath Expression of the escaped double-quote is "'\\&quot;'", which corresponds
  to the literal string used below.
  -->
  <xsl:variable name="g_ESCAPED_QUOTE_FOR_IOS_STRINGS_FILE" as="xsl:string">\"</xsl:variable>
  
  <!-- Like the escaped double-quote above, the backslash character must also be escaped
  within a *.strings file. Escaping the backslash allows it to be displayed. Otherwise,
  a single backslash is interpreted as the beginning of an escape sequence.
  -->
  <xsl:variable name="g_ESCAPED_BACKSLASH_FOR_IOS_STRINGS_FILE" as="xsl:string">\\</xsl:variable>

  <!-- *.strings files require this escaped carriage return representation rather than the standard
  value represented by HTML &#xA; or 0x000A hexacecimal. If a carriage return exists then it must
  be followed by a line feed or the remainder of the text won't display, as determined by testing
  with utility "plutil" on a Mac. But lack of a line feed character would not be a problem because
  editing string resources on a Mac/Linux adds only a LF character (e.g. 0x0A or 0x000A) for
  newline, while a newline on Microsoft Windows is represented by the CRLF pair (e.g. 0x0D0A)
  -->
  <xsl:variable name="g_ESCAPED_CARRIAGE_RETURN" as="xsl:string">\r</xsl:variable>

  <!-- *.strings files require this escaped line feed representation rather than the
       standard value represented by &#xA;.
  -->  
  <xsl:variable name="g_ESCAPED_LINE_FEED" as="xsl:string">\n</xsl:variable>
  
  <!-- End of row for iOS string resource -->
  <xsl:variable name="g_END_OF_ROW_TERMINATOR" as="xsl:string">;</xsl:variable>

  <!-- 
      Use g_CRLF as follows to output a new-line:  <xsl:value-of select="$g_CRLF"/>
  -->
  <xsl:variable name="g_CRLF" as="xsl:string">
    <xsl:text>&#x0D;&#x0A;</xsl:text>
  </xsl:variable>

  <xsl:variable name="g_COPYRIGHT" 
                select="'/* Copyright (c) 2011 Oracle.  All rights reserved. */'"/>

  <!-- 
      iOS string resource key name that identifies the application name in each 
      "InfoPlist.strings" file -->
  <xsl:variable name="g_APPLICATION_STRING_RESOURCE_KEY_NAME" select="'CFBundleDisplayName'"/>

  <!-- *********************************************************************************************
  Use this key to find a particular trans-unit with a specified @id attribute value
  -->
  <xsl:key name="xliffStringKey" match="xlf:trans-unit" use="@id"/>

  <!-- Use this key to find a particular adfmf:feature with a specified @id attribute value -->
  <xsl:key name="featureKey" match="adfmf:feature" use="@id"/>

  <!-- Get the set of adfmf:featureReference elements, in document order, from file 
       "maf-application.xml".  We know that adfmf:featureReference elements are direct descendents
       of the outtermost element. Therefore, we use prefix "/*/" to ensure efficiency because using
       select value "//adfmf:featureReference" might result in a search of the entire document, 
       depending on the xslt parser.
  -->
  <xsl:variable name="gFeatureReferenceSet" select="/*/adfmf:featureReference"/>

  <!-- *********************************************************************************************
  Get the content of the specified Expression Language string resource reference.
  This is accomplished by removing the surrounding delimiters #{} .
  Thus, the EL expression having pattern #{<BundleVarName><DECORATED_STRING_ID>}
  will return the following content:
  
     <BundleVarName><DECORATED_STRING_ID>
  
  See function "adfmf:getStringResourceId" for more information on
  the above string ID reference.
  
  TODO: This function is duplicated in file "PreferenceTransform.xsl".
        So they should be refactored to use a single common method.
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

  TODO: This function is duplicated in file "PreferenceTransform.xsl".
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

  TODO: This function is duplicated in file "PreferenceTransform.xsl".
        So they should be refactored to use a single common method.
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
  This template is the xslt entrypoint.  The purpose is to create a tree hierarchy of XML files 
  beginning with "root.plist".  The hierarchy matches the structure of element "adfmf:preferences" 
  in each input file "maf-application.xml" and "maf-feature.xml".
  
  We use a preorder tree traversal algorithm to parse the preferences in files 
  "maf-application.xml" and "maf-feature.xml".

  The algorithm ensures that each call to <xsl:result-document> ends before making another call to 
  <xsl:result-document>.  That is because command <xsl:result-document> appears to have a limitation
  that prevents re-entrancy.
  -->
  <xsl:template match="adfmf:application">
    <!-- Save element adfm:application so it can be used when
         a different document context is active. -->
    <xsl:variable name="applicationElement" select="." as="element(adfmf:application)"/>

    <!-- Loop each language -->
    <xsl:for-each select="$g_LANGUAGE_CODES/languages/language">
  
      <xsl:variable name="iosLanguageCode" select="./@iosCode"/>

      <xsl:variable name="oracleLanguageCode" select="./@oracleCode"/>

      <!-- Calculate target language directory name. Example: en.lproj -->
      <xsl:variable name="iosLanguageDirectoryName" 
                    select="concat($iosLanguageCode, 
                                   $g_IOS_LANGUAGE_DIRECTORY_EXTENSION)"/>
      
      <!-- Calculate a complete URL to the current target language directory, such as "en.lproj" -->
      <xsl:variable name="iosLanguageDirectoryUrl"
                    select="string-join(($XSL_PARAM_TargetDirectoryPath,
                                         $iosLanguageDirectoryName),
                                         $g_FILE_PATH_SEPARATOR)"/>

      <!-- Write application name to file "InfoPlist.strings" for the current language. -->
      <xsl:call-template name="adfmf:writeLocalizedApplicationName">
        <xsl:with-param name="p_OracleLanguageCode" select="$oracleLanguageCode"/>
        <xsl:with-param name="p_applicationElement" select="$applicationElement"/>
        <xsl:with-param name="p_iosLanguageDirectoryUrl" select="$iosLanguageDirectoryUrl"/>
      </xsl:call-template>    

      <!-- Write "Localizable.strings" file -->
      <xsl:call-template name="adfmf:writeStringsFile">
        <xsl:with-param name="p_OracleLanguageCode" select="$oracleLanguageCode"/>
        <xsl:with-param name="p_applicationElement" select="$applicationElement"/>
        <xsl:with-param name="p_iosLanguageDirectoryUrl" select="$iosLanguageDirectoryUrl"/>
      </xsl:call-template>    
  
    </xsl:for-each>
  </xsl:template>

  <!-- *********************************************************************************************
  Write iOS string resources for the specified language and resource attributes.
  Each call to this method processes string resources for either the singleton
  maf-application.xml or one of the maf-feature.xml files.
  -->
  <xsl:template name="adfmf:writeAdfmfXmlFileResources">
  
    <!-- a adfmf:application or adfmf:feature element -->
    <xsl:param name="p_appOrFeatureElement" 
               as="element (adfmf:application) or element (adfmf:feature)" 
               required="yes"/>

    <!-- This is a base path provided to the family of XLIFF files. -->
    <xsl:param name="p_baseXliffPath"
               as="xsl:string"
               required="yes"/>

    <!-- Specifies a single Oracle language code from xpath 
          "$g_LANGUAGE_CODES/languages/language/@oracleCode". -->
    <xsl:param name="p_OracleLanguageCode"
               as="xsl:string"
               required="yes"/>

    <!-- Contains attributes from the source adfmf XML document.
         Some or all of these may contain references to resource strings. -->
    <xsl:param name="p_adfmfXmlFileAttributes"
               required="yes"/>
      <!-- Write the ADFMF string resources to iOS representation. -->
      <xsl:apply-templates mode="writeIosResource" select="$p_adfmfXmlFileAttributes">
        <xsl:with-param name="p_appOrFeatureElement" select="$p_appOrFeatureElement"/>
        <xsl:with-param name="p_baseXliffPath" select="$p_baseXliffPath"/>
        <xsl:with-param name="p_OracleLanguageCode" select="$p_OracleLanguageCode"/>
        <xsl:with-param name="p_adfmfXmlFileAttributes" select="$p_adfmfXmlFileAttributes"/>
      </xsl:apply-templates>

  </xsl:template>

  <!-- *********************************************************************************************
  This template processes each adfmf:feature by writing it's string resources to one iOS *.strings
  file for the specified language.
  -->
  <xsl:template match="adfmf:feature" mode="writeFeatureResources">

    <xsl:param name="p_appOrFeatureElement" 
               as="element (adfmf:application) or element (adfmf:feature)" 
               required="yes"/>
               
    <xsl:param name="p_OracleLanguageCode" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_featureArchiveUrl" 
               as="xsl:string" 
               required="yes"/>

    <xsl:variable name="featureElement" select="."/>

    <!-- Each call writes the string resources for a single feature -->
    <xsl:call-template name="adfmf:writeAdfmfXmlFileResources">
      <xsl:with-param name="p_appOrFeatureElement" select="$featureElement"/>
      <xsl:with-param name="p_baseXliffPath" select="$p_featureArchiveUrl"/>
      <xsl:with-param name="p_OracleLanguageCode" select="$p_OracleLanguageCode"/>
      <xsl:with-param name="p_adfmfXmlFileAttributes" 
                      select="$featureElement/descendant-or-self::node()/@*"/>
    </xsl:call-template>
  </xsl:template>

  <!-- *********************************************************************************************
  Creates and populates a single Localizable.strings file in the specified iOS language folder.
  -->
  <xsl:template name="adfmf:writeStringsFile">
    <!-- 
    Specifies a single Oracle language code from xpath 
    "$g_LANGUAGE_CODES/languages/language/@oracleCode". 
    -->
    <xsl:param name="p_OracleLanguageCode"
               as="xsl:string"
               required="yes"/>
  
    <!-- Use to get the resource strings from adfmf:application -->
    <xsl:param name="p_applicationElement"
               as="element(adfmf:application)"
               required="yes"/>

    <!-- A complete URL to the current target language directory, such as "en.lproj" -->
    <xsl:param name="p_iosLanguageDirectoryUrl"
               as="xsl:string"
               required="yes"/>

    <xsl:result-document 
    href="{$p_iosLanguageDirectoryUrl}{$g_FILE_PATH_SEPARATOR}{$g_TARGET_STRING_RESOURCE_FILE_NAME}"
    indent="yes"
    format="iosStringsFile">

      <xsl:value-of select="$g_COPYRIGHT"/>
      <!-- Put a new line -->
      <xsl:value-of select="$g_CRLF"/>

      <!-- Write iOS resources from maf-application.xml -->
        <xsl:call-template name="adfmf:writeAdfmfXmlFileResources">
          <xsl:with-param name="p_appOrFeatureElement" select="$p_applicationElement"/>
          <xsl:with-param name="p_baseXliffPath" select="$XSL_PARAM_ApplicationXliffBasePath"/>
          <xsl:with-param name="p_OracleLanguageCode" select="$p_OracleLanguageCode"/>
          <xsl:with-param name="p_adfmfXmlFileAttributes" select="$p_applicationElement//@*"/>
        </xsl:call-template>

      <xsl:call-template name="adfmf:writeAllFeatureArchiveResources">
        <xsl:with-param name="p_OracleLanguageCode" select="$p_OracleLanguageCode"/>
      </xsl:call-template>

    </xsl:result-document>
  </xsl:template>

  <!-- *********************************************************************************************
  Get FAR file if it exists. Otherwise, return nothing.
  This function is duplicated in file "PreferenceTransform.xsl".
  
  TODO: Consider enhancing this to result in an error that stops deployment if the FAR doesn't exist.
  
  This same function is duplicated in "PreferenceTransform.xsl".
  -->
  <xsl:function name="adfmf:loadFeatureDocument">
    <!-- 
    Specifies the URL to a Feature Archive ZIP/JAR file.  The URL must not be percent-encoded. 
    -->
    <xsl:param name="featureArchiveUrl" 
               as="xsl:string" 
               required="yes"/>

    <xsl:variable name="featureXmlUrl" 
                  select="concat($featureArchiveUrl, $XSL_PARAM_FeatureXmlRelativePathInFAR)"/>

    <!--
    FileUtils:doesUrlResourceExist expects URL that is not percent-encoded, since it is
    a JDeveloper utility method.
    -->
    <xsl:if test="FileUtils:doesUrlResourceExist($featureArchiveUrl) = true()">
      <!-- BUGBUG: The XSLT 'document' function fails when given a percent-encoded URI,
           even though it is requires a URI. So we pass it a URL that is not percent-encoded.
      -->
      <xsl:sequence select="document($featureXmlUrl)"/>
    </xsl:if>
  </xsl:function>

  <!-- *********************************************************************************************
  Loops through FARs to write the string resources for each maf-feature.xml file
  for the specified language.
  -->
  <xsl:template name="adfmf:writeAllFeatureArchiveResources">
    <!-- Specifies a single Oracle language code from xpath 
    "$g_LANGUAGE_CODES/languages/language/@oracleCode". -->
    <xsl:param name="p_OracleLanguageCode"
               as="xsl:string"
               required="yes"/>

    <!-- BUGBUG:
    Removed "/FAR_URL" to get the loop working when the xsl is invoked from Java.
    
    However, must use code like either of the following when testing xslt in isolation without 
    calling from Java, when more than one FAR_URL is specified as a default value for 
    $XSL_PARAM_FeatureArchiveUrlNodeSet.
      <xsl:for-each select="$XSL_PARAM_FeatureArchiveUrlNodeSet/*:FAR_URL">
      <xsl:for-each select="$XSL_PARAM_FeatureArchiveUrlNodeSet/FAR_URL">
    -->
    <xsl:for-each select="$XSL_PARAM_FeatureArchiveUrlNodeSet">
      <xsl:variable name="featureArchiveUrl" select="." as="xsl:string"/>

      <xsl:variable name="featureDoc" select="adfmf:loadFeatureDocument($featureArchiveUrl)"/>
      <xsl:variable name="featuresElement" select="$featureDoc/adfmf:features"/>
        <!-- Write the iOS resources for each feature. -->
        <xsl:apply-templates select="$featuresElement//adfmf:feature" mode="writeFeatureResources">
          <xsl:with-param name="p_appOrFeatureElement" select="."/>
          <xsl:with-param name="p_OracleLanguageCode" select="$p_OracleLanguageCode"/>
          <xsl:with-param name="p_featureArchiveUrl" select="$featureArchiveUrl"/>
        </xsl:apply-templates>
    </xsl:for-each>

  </xsl:template>

  <!-- *********************************************************************************************
  Function returns true if the specified attribute value content is a string resource reference.
  
  This function is duplicated in file "PreferenceTransform.xsl".
  -->
  <xsl:function name="adfmf:hasStringResourceReference" as="xsl:boolean">
    <xsl:param name="attribute"
               as="attribute(adfmf:*)"
               required="yes"/>  
    <xsl:choose>
      <xsl:when test="starts-with($attribute, $g_STRING_RESOURCE_DELIMITER_START) and 
                      ends-with($attribute, $g_STRING_RESOURCE_DELIMITER_END)">
        <xsl:sequence select="true()"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:sequence select="false()"/>
      </xsl:otherwise>
    </xsl:choose>
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
   Creates a iOS string id prefix for the given p_attributeValue.    
    
    param: p_appOrFeatureElement - a adfmf:application or adfmf:feature element.
    param: p_baseXliffPath  - a path to the base location of the XLIFF files.
    param: p_attributeValue - a attribute value
       
    return: 
      The returned prefix is of one of the following two forms:
        application.<loadBundleVar> if p_appOrFeatureElement is a adfmf:application
        feature.<featureId>.<loadBundleVar> if p_appOrFeatureElement is a adfmf:feature
      
      where 
        <loadBundleVar> is the adfmf:loadBundle/@var value obtained directly from the given
        p_attributeValue and <featureId> is the id of the feature.
  -->
  <xsl:function name="adfmf:getIosStringIdPrefix" as="xsl:string">
    <xsl:param name="p_appOrFeatureElement" 
               as="element (adfmf:application) or element (adfmf:feature)" 
               required="yes"/>
               
    <xsl:param name="p_baseXliffPath" 
               as="xsl:string" 
               required="yes"/>
               
    <xsl:param name="p_attributeValue" 
               as="xsl:string" 
               required="yes"/>
    
    <xsl:variable name="loadBundleVarValue" 
                  select="adfmf:getLoadBundleVar ($p_attributeValue)"/>
     
      <xsl:choose>
        <xsl:when test="$p_appOrFeatureElement/ancestor-or-self::adfmf:application">
          <xsl:value-of select="concat($g_APPLICATION_CONTEXT_TOKEN, 
                                       $g_TOKEN_DELIMITOR_DOT, 
                                       $loadBundleVarValue)"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="string-join(($g_FEATURE_CONTEXT_TOKEN, 
                                            $p_appOrFeatureElement/@id, 
                                            $loadBundleVarValue), 
                                            $g_TOKEN_DELIMITOR_DOT)"/>
        </xsl:otherwise>
      </xsl:choose>
      
  </xsl:function>
<!-- ***********************************************************************************************
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
                                                    attribute.  This value contains the base name of 
                                                    the XLIFF file.
       
       return:  
       if p_oracleLocale is not null/empty:  a XLIFF document read from the location 
          $p_baseXliffPath/$p_relativeXliffPathAndBaseFileName_$p_oracleLocale.xlif
       if p_oracleLocale is not null/empty:  a XLIFF document read from the location 
          $p_baseXliffPath/$p_relativeXliffPathAndBaseFileName.xlif
      
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
       This function loads a XLIFF file, if it exists.  If the file doesn't exist then an 
       empty sequence is returned.
       
       param: p_appOrFeatureElement - a adfmf:application or adfmf:feature element
       param: p_baseXliffPath  - a path to the base location of the XLIFF files.
       param: p_attributeValue - a value of a attribute containing a EL-expression reference to a
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
                p_appOrFeatureElement is a adfmf:feature, locate the adfmf:loadBundle using the 
                parent -->
          <xsl:value-of 
                select="$p_appOrFeatureElement/../adfmf:loadBundle[@var=$loadBundleVar]/@basename"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    
    <!-- Convert the basename to a relative path by replacing all '.'s with '/'s -->
    <xsl:variable name="relativeXliffPath" 
                  select="translate ($baseNameValue,
                                     $g_TOKEN_DELIMITOR_DOT, 
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

    param:  p_appOrFeatureElement a adfmf:application or adfmf:feature element 
    param:  p_baseXliffPath  - a path to the base location of the XLIFF files.
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
  Each invocation potentially writes a resource string to the iOS representation.
  -->
  <xsl:template mode="writeIosResource" match="adfmf:*/@*">
      <xsl:param name="p_appOrFeatureElement" 
                 as="element (adfmf:application) or element (adfmf:feature)" 
                 required="yes"/>
                 
      <xsl:param name="p_baseXliffPath" 
                 as="xsl:string" 
                 required="yes"/>
                 
      <xsl:param name="p_OracleLanguageCode" 
                 as="xsl:string" 
                 required="no"/>
                 
      <xsl:param name="p_adfmfXmlFileAttributes" 
                 required="yes"/>

    <xsl:if test="adfmf:hasStringResourceReference(.) = true()">

      <xsl:variable name="stringResourceAttribute" select="."/>

      <xsl:variable name="stringResourceId" 
                    select="adfmf:getStringResourceId($stringResourceAttribute)"/>

      <xsl:variable name="resourceStringPrefix" 
                    select="adfmf:getIosStringIdPrefix ($p_appOrFeatureElement, 
                                                        $p_baseXliffPath, 
                                                        $stringResourceAttribute)"/>

      <xsl:variable name="iosStringId" select="concat($resourceStringPrefix, 
                                                      $g_TOKEN_DELIMITOR_DOT, 
                                                      $stringResourceId)"/>

      <xsl:variable name="resourceString" 
                    select="adfmf:getStringFromXliffFile ($p_appOrFeatureElement, 
                                                          $p_baseXliffPath, 
                                                          $stringResourceAttribute, 
                                                          $p_OracleLanguageCode)"/>
      
      <xsl:call-template name="adfmf:writeIosStringResource">
        <xsl:with-param name="p_stringResourceKeyName" select="$iosStringId"/>
        <xsl:with-param name="p_stringResourceText" select="$resourceString"/>
      </xsl:call-template>
    </xsl:if>
  </xsl:template>
  <!-- *********************************************************************************************
  Write the application name to file "InfoPlist.strings" for the specified language. The application
  name originates from "adfmf:application/@name", which may specify a localizable string resource
  or a hard-coded string.
  -->
  <xsl:template name="adfmf:writeLocalizedApplicationName">
    <!-- 
      Specifies a single Oracle language code from xpath 
        "$g_LANGUAGE_CODES/languages/language/@oracleCode". 
    -->
    <xsl:param name="p_OracleLanguageCode"
               as="xsl:string"
               required="yes"/>
  
    <!-- Use to get the resource strings from adfmf:application -->
    <xsl:param name="p_applicationElement"
               as="element(adfmf:application)"
               required="yes"/>

    <!-- A complete URL to the current target language directory, such as "en.lproj" -->
    <xsl:param name="p_iosLanguageDirectoryUrl"
               as="xsl:string"
               required="yes"/>

    <xsl:result-document
      href="{$p_iosLanguageDirectoryUrl}{$g_FILE_PATH_SEPARATOR}{$g_IOS_STRING_RESOURCE_FILE_NAME_INFOPLIST}"
      indent="yes"
      format="iosStringsFile">

      <xsl:value-of select="$g_COPYRIGHT"/>
      <!-- Put a new line -->
      <xsl:value-of select="$g_CRLF"/>

      <!-- Write iOS resources from maf-application.xml -->

      <!-- Get the application name to write an as iOS resource string. It will either be localized
           or hard-coded. 
      -->
      <xsl:variable name="applicationNameText" as="xsl:string">
        <xsl:choose>
          <xsl:when test="adfmf:hasStringResourceReference($p_applicationElement/@name) = true()">
            <!-- Get the localized application name as an iOS string resource. -->
            
            <xsl:variable name="appNameStringResourceId" 
                          select="adfmf:getStringResourceId($p_applicationElement/@name)"/>
            
            <xsl:value-of select="adfmf:getStringFromXliffFile ($p_applicationElement,
                                                                $XSL_PARAM_ApplicationXliffBasePath,
                                                                $p_applicationElement/@name,
                                                                $p_OracleLanguageCode)"/>
          </xsl:when>
          <xsl:otherwise>
            <!--
            The application name attribute does not reference a string resource.
            So get the hard-coded application name itself as an iOS string resource.
            -->
            <xsl:value-of select="$p_applicationElement/@name"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:variable>

      <!-- Write the application name as an iOS string resource. -->
      <xsl:call-template name="adfmf:writeIosStringResource">
        <xsl:with-param name="p_stringResourceKeyName" 
                        select="$g_APPLICATION_STRING_RESOURCE_KEY_NAME"/>
        <xsl:with-param name="p_stringResourceText" 
                        select="$applicationNameText"/>
      </xsl:call-template>

    </xsl:result-document>
  </xsl:template>

  <!-- *********************************************************************************************
  This function is an adapter that wraps template "search-and-replace" so the caller can
  easily substitute it by calling XSLT 2.0 function "xsl:replace" when Oracle makes it available.
  This function can be removed when Oracle provides XSLT 2.0 function "xsl:replace".
  -->
  <xsl:function name="adfmf:SearchAndReplace" as="xsl:string">
    <xsl:param name="p_input-string" as="xsl:string" required="yes"/>
    <xsl:param name="p_search-string" as="xsl:string" required="yes"/>
    <xsl:param name="p_replacement-string" as="xsl:string" required="yes"/>

    <xsl:call-template name="adfmf:search-and-replace">
      <xsl:with-param name="p_input-string" select="$p_input-string"/>
      <xsl:with-param name="p_search-string" select="$p_search-string"/>
      <xsl:with-param name="p_replacement-string" select="$p_replacement-string"/>
    </xsl:call-template>
  </xsl:function>

  <!-- *********************************************************************************************
  This recursive template replaces all occurrences of a substring,
  within an input string, by a replacement string.
  
  Based on solution in section 2.7, "XSLT Cookbook", Second Edition by Sal Mangano.
  
  This template can be removed when Oracle provides XSLT 2.0 function "xsl:replace".
  -->
  <xsl:template name="adfmf:search-and-replace">
    <!-- The string that may have substrings to be replaced -->
    <xsl:param name="p_input-string" as="xsl:string" required="yes"/>
    
    <!-- Specifies the substring to replace -->
    <xsl:param name="p_search-string" as="xsl:string" required="yes"/>
    
    <!-- Specifies the replacement string -->
    <xsl:param name="p_replacement-string" as="xsl:string" required="yes"/>
  
    <xsl:choose>
      <!-- See if the input contains the search string -->
      <xsl:when test="$p_search-string and 
                      contains($p_input-string, $p_search-string)">
                       
        <!-- If so, then concatenate the substring before the search
        string, to the replacement string and to the result of
        recursively applying this template to the remaining substring.
        -->
        <xsl:value-of select="substring-before($p_input-string, $p_search-string)"/>
        <xsl:value-of select="$p_replacement-string"/>
        <xsl:call-template name="adfmf:search-and-replace">
          <xsl:with-param name="p_input-string"
                          select="substring-after($p_input-string, $p_search-string)"/>
          <xsl:with-param name="p_search-string" select="$p_search-string"/>
          <xsl:with-param name="p_replacement-string" select="$p_replacement-string"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <!-- There are no more occurrences of the search string so
        just return the current input string -->
        <xsl:value-of select="$p_input-string"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- *********************************************************************************************
  Normalize each of the following characters in a specified string.
  
    - backslash
    - neutral-double-quote 
    - carriage return
    - line feed
  
  This allows for proper representation in a *.strings file.  Left and right double-quotes do
  not require an escaped representation in a *.strings file.
  
  For more information, see section "Using Special Characters in String Resources" in the
  "Resource Programming Guide" of the iOS Developer Library.  The URL is:
  
    https://developer.apple.com/library/ios/documentation/Cocoa/Conceptual/LoadingResources/Strings/Strings.html
    
  Command line utility "plutil" can be used to check the content of any *.strings file.
  
  The following will validate the file is in the correct format
  
      plutil -lint /path/to/strings/file  
  
  The following will output the strings, so you can validate newlines, etc.
  
      plutil -p /path/to/strings/file
  -->
  <xsl:function name="adfmf:NormalizeString" as="xsl:string">
    <!-- The string that may have special characters to replace -->
    <xsl:param name="p_input-string" as="xsl:string" required="yes"/>

    <!-- TODO tdutchov
    In this entire method, substitute each call to function "SearchAndReplace" with a call
    to XSLT 2.0 function "xsl:replace", when Oracle makes it available.
    -->

    <!-- First normalize any backslash characters to go from "\" to "\\". This allows
    a backslash character to be properly represented in the *.strings file so it can
    be displayed.  A side effect of this conversion is that it prevents using a
    backslash escape sequence in the source text.
    -->
    <xsl:variable name="normalizedBackslashCharacters" as="xsl:string">
       <xsl:value-of select="adfmf:SearchAndReplace($p_input-string,
                                                    $g_BACKSLASH,
                                                    $g_ESCAPED_BACKSLASH_FOR_IOS_STRINGS_FILE)"/>
    </xsl:variable>

    <!-- All neutral double-quotes, within text content of an iOS resource string, must be
    escaped before writing the text to any *.strings file such as Localizable.strings"
    and "InfoPlist.strings".  All *.strings files use neutral double-quotes (i.e. "'&quot;'"
    to delimit (i.e. surround) the text content, which is why double-quotes must be escaped.
    If unescaped neutral double-quotes occur in any text content of a *.strings file
    then xcodebuild fails.  For example:
       Source text:                 This contains a "quoted" word.
       Desired iOS resource text:   "This contains a \"quoted\" word.";
    -->
    <xsl:variable name="normalizedDoubleQuoteCharacters" as="xsl:string">
       <xsl:value-of select="adfmf:SearchAndReplace($normalizedBackslashCharacters,
                                                    $g_QUOTE,
                                                    $g_ESCAPED_QUOTE_FOR_IOS_STRINGS_FILE)"/>
    </xsl:variable>

    <!-- Replace each carriage return (i.e. &#x0D; ) with escape sequence \r  .  The XML
    may likely not contain carriage returns for the following reasons.
    1. If the XLIFF string resources were created on Linux or Mac then only linefeed (i.e. &#x0A; )
       is used to designate a new line.  Mac and Linux do not use carriage return for new lines.
    2. If the XLIFF does contain carriage returns, such as the CRLF pair, then tests have so
       far shown that carriage returns do not appear in the resulting XML provided to the XSLT.
       It's may be that the XML parser is stripping out the CR characters in  this case.
    -->
    <xsl:variable name="normalizedCarriageReturnCharacters" as="xsl:string">
       <xsl:value-of select="adfmf:SearchAndReplace($normalizedDoubleQuoteCharacters,
                                                    $g_CARRIAGE_RETURN,
                                                    $g_ESCAPED_CARRIAGE_RETURN)"/>
    </xsl:variable>

    <!-- Replace each line feed character with escape sequence \n -->
    <xsl:variable name="normalizedText" as="xsl:string">
       <xsl:value-of select="adfmf:SearchAndReplace($normalizedCarriageReturnCharacters,
                                                    $g_LINE_FEED,
                                                    $g_ESCAPED_LINE_FEED)"/>
    </xsl:variable>

    <xsl:value-of select="$normalizedText"/>

  </xsl:function>

  <!-- *********************************************************************************************
  Writes a single iOS resource string using the specified key and string text.
  -->
  <xsl:template name="adfmf:writeIosStringResource">
  
    <!-- Key name of the iOS resource string. -->
    <xsl:param name="p_stringResourceKeyName" 
               as="xsl:string" 
               required="yes"/>
               
    <!-- Text of the iOS resource string. -->
    <xsl:param name="p_stringResourceText" 
               as="xsl:string" 
               required="yes"/>

    <!-- Normalize special characters by escaping them for proper representation
         in a *.strings file.
    -->
    <xsl:variable name="normalizedText" as="xsl:string">
       <xsl:value-of select="adfmf:NormalizeString($p_stringResourceText)"/>
    </xsl:variable>

    <xsl:value-of select="$g_CRLF"/>
    <xsl:text>    </xsl:text> <!-- Indent a few spaces to improve human readability -->
    <xsl:value-of select="concat($g_QUOTE, $p_stringResourceKeyName, $g_QUOTE)"/>
    <xsl:text> = </xsl:text>
    <xsl:value-of select="concat($g_QUOTE, 
                                 $normalizedText, 
                                 $g_QUOTE, 
                                 $g_END_OF_ROW_TERMINATOR)"/>
  </xsl:template>

</xsl:stylesheet>