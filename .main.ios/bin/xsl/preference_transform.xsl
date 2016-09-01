<?xml version="1.0" encoding="windows-1252" ?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:adfmf="http://xmlns.oracle.com/adf/mf"
                xmlns:FileUtils="http://www.oracle.com/XSL/Transform/java/oracle.tools.maf.build.settings.FileUtils">
  <!--
  Search for TODO items to identify issues that should be addressed.
  
  Documentation for iOS application preferences is at:
  
     http://developer.apple.com/library/ios/#documentation/iphone/conceptual/iphoneosprogrammingguide/Preferences/Preferences.html
  
  Detailed documentation of the schema for each iOS control is at:
  
     http://developer.apple.com/library/ios/#documentation/PreferenceSettings/Conceptual/SettingsApplicationSchemaReference/Introduction/Introduction.html#//apple_ref/doc/uid/TP40007071

  The stylesheet parameters are defined with default values.  These are used only for isolated testing
  during development. Stylesheet parameters passed in from the calling Java code override all default values
  declared by the stylesheet parameters. Thus, the default values have no effect when delivered to customers.
  -->
  <xsl:output method="xml" indent="yes" name="xml"/>
  <!--
  The following parameter identifies the full path to directory "Settings.bundle" where the .plist files
  must be created. The value must be an un-encoded URL string that is provided by the caller of this XSL.
  The URL string value must satisfy the following requirements.
  1. It must not be percent-encoded.
  2. It must be surrounded by single quotes so that it's interpreted as a string literal.
  
  An example value is below.
        
    'file:/C:/JDeveloper/mywork/MyAdfMobileApplication/deploy/IOS_MOBILE_NATIVE_archive1/temporary_xcode_project/Settings.bundle/'

  The default value is used only for testing and is overridden by the Java value passed in at runtime.
  -->
  <xsl:param name="XSL_PARAM_SettingsBundleFolderPath"
             required="yes"
             select="'file:///C:/JDeveloper/mywork/Transformer/deploy/'"/>

  <!--
  This is the relative path of maf-feature.xml in feature archive JAR file.
  The relative path of file "maf-feature.xml" is always the same inside every FAR.
  However, it is provided by the caller in case the location ever changes.
  
  The URL string value must satisfy the following requirements.
  
  1. It must not be percent-encoded.
  2. It must be surrounded by single quotes so that it's interpreted as a string literal.

      Example:  'META-INF/maf-feature.xml'
  
  The default value is used only for testing and is overridden by the Java value passed in at runtime.
  -->  
  <xsl:param name="XSL_PARAM_FeatureXmlRelativePathInFAR"
             required="yes"
             as="xsl:string"
             select="'META-INF/maf-feature.xml'"/>
  <!--
  This parameter specifies a set of absolute URLs to FAR directories.
  To accomplish this, the Java caller must provide a sequence of FAR_URL elements.
  The content of each FAR_URL element specifies a FAR URL.  Each FAR URL must not
  be percent-encoded.  The commented default value is used only for testing.
  -->
  <xsl:param name="XSL_PARAM_FeatureArchiveUrlNodeSet" required="yes">
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

    <FAR_URL>file:///C:/JDeveloper/mywork/MyApp/deploy/iOS1/temporary_xcode_project/FARs/ViewController/</FAR_URL>
    <FAR_URL>file:///C:/JDeveloper/mywork/MyApp/deploy/iOS1/temporary_xcode_project/FARs/ViewController2/</FAR_URL>
    <FAR_URL>file:///C:/JDeveloper/mywork/MyApp/deploy/iOS1/temporary_xcode_project/FARs/ViewController3/</FAR_URL>
  -->
  </xsl:param>

  <!--
  Name of the top-most PList file in the Settings bundle.  The ".plist" extension is added by this XSLT when the
  file is created.  The Settings application requires that the file name is "Root.plist" (case sensitive), as
  documented by fixed bug 13356802.
  -->
  <xsl:variable name="g_ROOT_PLIST_FILE_NAME" select="'Root'" as="xsl:string"/>
  
  <!-- Use this key to find a particular adfmf:feature with a specified @id attribute value -->
  <xsl:key name="featureKey" match="adfmf:feature" use="@id"/>

  <!-- Get the set of adfmf:featureReference elements, in document order, from file "maf-application.xml".
       We know that adfmf:featureReference elements are direct descendents of the outtermost element. Therefore,
       we use prefix "/*/" to ensure efficiency because using select value "//adfmf:featureReference"
       might result in a search of the entire document, depending on the xslt parser.
  -->
  <xsl:variable name="g_FEATURE_REFERENCE_SET"
                select="/*/adfmf:featureReference"
                as="element(adfmf:featureReference)"/>

  <!--
  Prefix token that must appear first for any iOS preference element
  or iOS string resource that originates from adfmf:application.
  This constant is duplicated in file "TransformStringResources.xsl".
  -->
  <xsl:variable name="g_APPLICATION_CONTEXT_TOKEN" select="'application'" as="xsl:string"/>
  
  <!--
  Prefix token that must appear first for any iOS preference element
  or iOS string resource that originates from adfmf:feature.
  This constant is duplicated in file "TransformStringResources.xsl".
  -->
  <xsl:variable name="g_FEATURE_CONTEXT_TOKEN" select="'feature'" as="xsl:string"/>

  <!--
  Marks the start of a string resource reference from either maf-application.xml or maf-feature.xml .
  This constant is duplicated in file "TransformStringResources.xsl".
  -->
  <xsl:variable name="g_STRING_RESOURCE_DELIMITER_START" select="'#{'"  as="xsl:string"/>
  
  <!--
  Marks the end of a string resource reference from either maf-application.xml or maf-feature.xml .
  This constant is duplicated in file "TransformStringResources.xsl".
  -->
  <xsl:variable name="g_STRING_RESOURCE_DELIMITER_END" select="'}'"  as="xsl:string"/>

  <!--
  Dot separator character to use between tokens.
  This constant is duplicated in file "TransformStringResources.xsl".
  -->
  <xsl:variable name="g_TOKEN_DELIMITOR_DOT" select="'.'" as="xsl:string"/>

  <!--
  Constant string literal that represents the prefix [' to a decorated
  string ID.
  This constant is duplicated in file "TransformStringResources.xsl".
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
  This constant is duplicated in file "TransformStringResources.xsl".
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

  <!-- *********************************************************************************************
  Function returns true if the specified attribute value content is a string resource reference.
  
  This function is duplicated in file "TransformStringResources.xsl".
  -->
  <xsl:function name="adfmf:hasStringResourceReference" as="xsl:boolean">
    <xsl:param name="attribute"
               as="attribute()"
               required="yes"/>  
    <xsl:choose>
      <xsl:when test="starts-with($attribute, $g_STRING_RESOURCE_DELIMITER_START) and ends-with($attribute, $g_STRING_RESOURCE_DELIMITER_END)">
        <xsl:sequence select="true()"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:sequence select="false()"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>

  <!-- *********************************************************************************************
  Get all ancestor-or-self elements in document order for the specified preference element.
  Element "adfmf:features" is excluded from the list because it's unique within file
  "maf-features.xml" and doesn't have an "id" attribute.
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
    preferences in "maf-features.xml".  Until recently, iOS usage also seemed consistent.
    However, the following analysis shows this bug now occurs sporadically when iOS uses
    "ancestor-or-self" for preferences in "maf-features.xml".
    
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
  Get the content of the specified Expression Language string resource reference.
  This is accomplished by removing the surrounding delimiters #{} .
  Thus, the EL expression having pattern #{<BundleVarName><DECORATED_STRING_ID>}
  will return the following content:
  
     <BundleVarName><DECORATED_STRING_ID>
  
  See function "adfmf:getStringResourceId" for more information on
  the above string ID reference.
  
  TODO: This function is duplicated in file "TransformStringResources.xsl".
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
      select="substring($noPrefix, 1, string-length($noPrefix) - (string-length($g_STRING_RESOURCE_DELIMITER_END)))"
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
      <xsl:when test="contains($expressionLanguageContent, $g_PREFIX_TO_STRING_ID_THAT_CONTAINS_DOTS)">
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

  TODO: This function is duplicated in file "TransformStringResources.xsl".
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
  Gets the absolute reference (i.e. bundleVarName.StringId) of the XLIFF string resource
  identifier that is embedded in the EL expression of the specified attribute value.
  
  See function "adfmf:getStringResourceId" for information on the
  following XLIFF string resource pattern.
  
    #{<BundleVarName><DECORATED_STRING_ID>}
  
  Given the above pattern, this function returns a string
  with the following pattern.
  
    <BundleVarName>.<STRING_ID>
  -->
  <xsl:function name="adfmf:getAbsoluteStringResourceReference" as="xsl:string">
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

    <xsl:variable name="nakedStringIdentifier"
                  select="adfmf:getStringResourceId($p_adfmfStringResourceReference)"
                  as="xsl:string"/>

    <xsl:variable name="absoluteStringReference"
                  select="concat($loadBundleVar,
                                 $g_TOKEN_DELIMITOR_DOT
                                 $nakedStringIdentifier)"/>

    <xsl:value-of select="$absoluteStringReference"/>
  </xsl:function>

  <!-- *********************************************************************************************
  Given an attribute, this function returns either an iOS string resource ID, or the unmodified
  attribute content.  An iOS string resource ID is returned only if the attribute content
  specifies an XLIFF string resource using Expression Language as shown by the following
  example:
  
    #{<BundleVarName><DECORATED_STRING_ID>}
    
  See function "adfmf:getStringResourceId" for information on the above EL.
  
  This function returns a string that represents an iOS string resource id. If a problem is detected,
  such as adfmf:loadBundle not available, then an empty string will be returned.
  
  This function assumes that element adfmf:loadBundle exists because the specified attribute
  must have a value of the form "#{bundleName.stringId}".
  -->
  <xsl:function name="adfmf:getIosStringResourceIdOrText" as="xsl:string">
    <!--
    This parameter specifies the element whose identifier will be generated.
    The attribute must have a value of the form "${bundleName.stringId}".
    -->
    <xsl:param name="p_stringResourceAttribute" as="attribute(adfmf:*)"/>

    <xsl:choose>
      <xsl:when test="adfmf:hasStringResourceReference($p_stringResourceAttribute) = true()">
        <!--
        The attribute content is a reference to a resource, so transform it to an
        equivalent iOS resource reference.
        -->
      
        <!-- Get content of the form bundleName.stringId -->
        <xsl:variable name="absoluteStringResourceReference" select="adfmf:getAbsoluteStringResourceReference($p_stringResourceAttribute)"/>
    
        <!--
        The single ancestor application element, if the attribute has one.
        The superfluous predicate is just to clarify that there is at most one application element.
        -->
        <xsl:variable name="applicationElement" select="$p_stringResourceAttribute/ancestor::adfmf:application[1]"/>

        <!--
        The single ancestor feature element, if the attribute has one.
        The XSD ensures there is only one feature ancestor for any preference attribute coming from a FAR.
        The superfluous predicate is just for clarify that here.
        -->
        <xsl:variable name="featureElement" select="$p_stringResourceAttribute/ancestor::adfmf:feature[1]"/>
    
        <!-- The result of this is to produce a document that contains the elements we want. -->
        <xsl:choose>
          <xsl:when test="$applicationElement">
            <!-- We now know that the string resource attribute is a descendent of adfmf:application -->
    
            <!-- 
            Build a prefix of the form "application.<BundleName>.<StringId>".
            -->
            <xsl:variable name="iosStringResourceId"
                          select="concat($g_APPLICATION_CONTEXT_TOKEN,
                                         $g_TOKEN_DELIMITOR_DOT
                                         $absoluteStringResourceReference)"/>

            <xsl:value-of select="$iosStringResourceId"/>
          </xsl:when>
          <xsl:when test="$featureElement">
            <!-- We now know that the string resource attribute is a descendent of adfmf:feature -->
    
            <!-- 
            Build a prefix of the form "feature.<Feature_Id>.<BundleName>.<StringId>".
            As a prerequisite, the feature and feature/@id must be valid.
            -->
            <xsl:variable name="iosStringResourceId"
                          select="string-join(($g_FEATURE_CONTEXT_TOKEN,
                                               $featureElement/@id,
                                               $absoluteStringResourceReference),
                                              $g_TOKEN_DELIMITOR_DOT)"/>
            <xsl:value-of select="$iosStringResourceId"/>
          </xsl:when>
          <xsl:otherwise>
            <!-- Control should never get here. -->
            <!-- TODO: Consider flagging an error if control ever gets here. -->
            
            <!--
            Return the attribute content, as a consolation, since it can't be transformed
            to an iOS string resource identifier.
            -->
            <xsl:value-of select="$p_stringResourceAttribute"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:otherwise>
        <!-- The attribute content is not a resource. So just return the attribute content. -->
        <xsl:value-of select="$p_stringResourceAttribute"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>

  <!-- *********************************************************************************************
  This template is the xslt entrypoint.  The purpose is to create a tree hierarchy of XML files beginning
  with "Root.plist".  The hierarchy matches the structure of element "adfmf:preferences" in file
  "maf-application.xml" and the set of "maf-feature.xml" files.  There may be zero to many
  "maf-feature.xml" files, one in each FAR.
  
  We use a preorder tree traversal algorithm to parse the preferences in file "maf-application.xml"
  and the set of "maf-feature.xml" files.

  The algorithm ensures that each call to <xsl:result-document> ends before making another call
  to <xsl:result-document>.  That is because command <xsl:result-document> appears to have a limitation that
  prevents re-entrancy.  This means that each file created by this XSLT is completely written before
  attempting to create a new file.
  -->
  <xsl:template match="adfmf:application">
    <!-- Create file Root.plist -->
    <xsl:call-template name="adfmf:createPlistFile">
      <xsl:with-param name="p_fileName" select="$g_ROOT_PLIST_FILE_NAME"/>
      <!-- Pass in element adfmf:preferences -->
      <xsl:with-param name="p_PListFileContentRootNode" select="./adfmf:preferences"/>
    </xsl:call-template>

    <!-- Create a new XML file for each preferencePage element that is a descendant of adfmf:preferences. -->
    <xsl:for-each select="./adfmf:preferences//adfmf:preferencePage">
      <xsl:variable name="preferencePage" select="."/>
    
      <xsl:call-template name="adfmf:createPlistFile">
        <xsl:with-param name="p_fileName" select="adfmf:generatePreferenceId($preferencePage)"/>
        <xsl:with-param name="p_PListFileContentRootNode" select="$preferencePage"/>
      </xsl:call-template>
    </xsl:for-each>

    <!-- Write the preference PList files for each FAR. -->
    <xsl:call-template name="adfmf:writePlistFilesFromFarSet">
    </xsl:call-template>
  </xsl:template>

  <!-- *********************************************************************************************
  Get FAR file if it exists. Otherwise, return nothing.
  This function is duplicated in file "TransformStringResources.xsl".
  
  TODO: Consider enhancing this to result in an error that stops deployment if the FAR doesn't exist.
  
  This same function is duplicated in "TransformStringResources.xsl".
  -->
  <xsl:function name="adfmf:loadFeatureDocument">
    <!-- Specifies the URL to a Feature Archive ZIP/JAR file.  The URL must not be percent-encoded. -->
    <xsl:param name="featureArchiveUrl" as="xsl:string" required="yes"/>

    <xsl:variable name="featureXmlUrl" select="concat($featureArchiveUrl, $XSL_PARAM_FeatureXmlRelativePathInFAR)"/>

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
  Loop through FARs to write the preference PList files for each FAR.
  -->
  <xsl:template name="adfmf:writePlistFilesFromFarSet">

    <!-- BUGBUG:
    $XSL_PARAM_FeatureArchiveUrlNodeSet must not have suffix "/FAR_URL" or the
    loop won't work when the xsl is invoked from Java.
    
    On the other hand, must use code like either of the following when testing xslt in
    isolation (i.e. not called from Java) with more than one FAR_URL element.

      <xsl:for-each select="$XSL_PARAM_FeatureArchiveUrlNodeSet/FAR_URL">
      <xsl:for-each select="$XSL_PARAM_FeatureArchiveUrlNodeSet/*:FAR_URL">
    -->
    <xsl:for-each select="$XSL_PARAM_FeatureArchiveUrlNodeSet">
      <xsl:variable name="featureArchiveUrl" select="." as="xsl:string"/>

      <xsl:call-template name="adfmf:writePlistFilesFromFar">
        <xsl:with-param name="p_featureArchiveUrl" select="$featureArchiveUrl"/>
      </xsl:call-template>
    </xsl:for-each>
  </xsl:template>

  <!-- *********************************************************************************************
  This function looks in each of the specified FARs until it finds the specified feature.
  
  Returns a document fragment containing an adfmf:feature element, if a match is found for
  the specified feature identifier.  Otherwise, returns an empty document fragment.
  
  This template is implemented using tail-recursion.
  
  Oracle's XSLT processor has a bug that prevents recursion using a function.
  Otherwise, function recursion would be more elegant to use here.
  
  There is a negative side effect of this template. That is, the resulting
  adfmf:feature element, that is returned, loses knowledge of its ancestor
  when it's assigned to the content of a variable. This is documented by the
  following bug report:
  
  Bug 13777267 - CORRUPT ELEMENT RETURNED BY XSL:SEQUENCE TO XSL:VARIABLE SELECT ATTRIBUTE
  -->
  <xsl:template name="adfmf:getFeatureElement">
  
    <!-- Specifies the feature to retrieve. -->
    <xsl:param name="p_featureIdentifier"
               as="xsl:string"
               required="yes"/>

    <!--
    Feature Archive URLs that identify where to look for the specified p_featureIdentifier.
    Set the default value to all FARS so the initial caller does not have to provide it.
    -->
    <xsl:param name="p_FarUrls"
               required="yes"/>

    <xsl:if test="$p_FarUrls">
      <!-- Get first FAR URL in the set, if there is one. -->
      <xsl:variable name="featureArchiveUrl" select="$p_FarUrls[1]" as="xsl:string"/>
      
      <xsl:if test="$featureArchiveUrl">
        <!-- A FAR URL exists, so process it. -->
    
        <!-- Get the FAR's maf-feature.xml document  -->
        <xsl:variable name="featureDoc" select="adfmf:loadFeatureDocument($featureArchiveUrl)"/>
    
        <!-- Search for the specified feature ID -->
        <xsl:for-each select="$featureDoc/adfmf:features">  <!-- This line needed only to set content to the feature document -->
          <xsl:variable name="featureElem" select="key('featureKey', $p_featureIdentifier)"/>

          <!-- Get the subset of FAR URLs after the first one. -->          
          <xsl:variable name="farUrlsSubset" select="$p_FarUrls[position() > 1]"/>
          
          <xsl:choose>
            <xsl:when test="$featureElem">
              <!-- Found it. So return the Feature -->
              <xsl:sequence select="$featureElem"/>
            </xsl:when>
            <xsl:otherwise>
              <!-- Call recursively to find the specified feature in the remaining FARs -->
              <xsl:call-template name="adfmf:getFeatureElement">
                <xsl:with-param name="p_featureIdentifier" select="$p_featureIdentifier"/>
                <xsl:with-param name="p_FarUrls" select="$farUrlsSubset"/>
              </xsl:call-template>

              <!-- BUGBUG:
              Submit bug indicating that the XSLT processor has a bug that
              prevents function recursion.  For example, defining this template recursion as a
              function doesn't work. It complains about the recursive call below.
              
                  <xsl:sequence select="adfmf:getFeatureElement($p_featureIdentifier, $farUrlsSubset)"/>
              -->
            </xsl:otherwise>
          </xsl:choose>
        </xsl:for-each>
      </xsl:if>
    </xsl:if>
  </xsl:template>

  <!-- *********************************************************************************************
  Write shallow preference content for all features referenced from "maf-application.xml".
  -->
  <xsl:template name="adfmf:writeShallowPreferencesFromAllFeatures">
    <!--
    Write the preference content of each feature in the
    order that they are referenced from "adfm-application.xml".
    -->
    <xsl:for-each select="$g_FEATURE_REFERENCE_SET">
      <xsl:variable name="featureId" select="@refId"/>

      <!--
      A document fragment that contains the specified adfmf:feature element if it is found.
      BUGBUG:
        Variable $featureElem is converted to a document-fragment even when its "as" attribute
        is specified as follows.
        
          as="element(adfmf:feature)"
        
        This problem causes element adfmf:feature to lose its ancestor information because
        its new parent is the document-fragment of variable $featureElem. Therefore, element
        adfmf:features is not accessible via the "ancestor" axis step.
      -->
      <xsl:variable name="featureElem">
        <xsl:call-template name="adfmf:getFeatureElement">
          <xsl:with-param name="p_featureIdentifier" select="$featureId"/>

          <!-- BUGBUG:
          $XSL_PARAM_FeatureArchiveUrlNodeSet must not have suffix "/FAR_URL" or the
          loop won't work when the xsl is invoked from Java.
          
          On the other hand, must use code like the following when testing xslt in
          isolation (i.e. not called from Java) with more than one FAR_URL element.

            <xsl:with-param name="p_FarUrls" select="$XSL_PARAM_FeatureArchiveUrlNodeSet/FAR_URL"/>
          -->
          <xsl:with-param name="p_FarUrls" select="$XSL_PARAM_FeatureArchiveUrlNodeSet"/>
        </xsl:call-template>
      </xsl:variable>

      <!-- A feature can have zero or one child element adfmf:preferences. -->
      <xsl:variable name="preferencesElement" select="$featureElem/adfmf:feature/adfmf:preferences[1]"/>
  
      <!-- Process element adfmf:preferences if it exists. -->
      <xsl:if test="boolean($preferencesElement)">  <!-- Is this test superfluous? -->
        <xsl:call-template name="adfmf:AddShallowFeaturePrefs">
          <xsl:with-param name="preferencesElement" select="$preferencesElement" as="element(adfmf:preferences)"/>
        </xsl:call-template>
      </xsl:if>
    </xsl:for-each>
  </xsl:template>

  <!-- *********************************************************************************************
  Write all preference .plist files for the specified FAR.
  -->
  <xsl:template name="adfmf:writePlistFilesFromFar">
    <xsl:param name="p_featureArchiveUrl"
               as="xsl:string"
               required="yes"/>

    <xsl:variable name="featureDoc" select="adfmf:loadFeatureDocument($p_featureArchiveUrl)"/>

    <!-- For each referenced feature, perform a deep tree traversal of all feature preferences,
         to create a new XML file for each child preferenceGroup that requires it.
    -->
    <xsl:for-each select="$g_FEATURE_REFERENCE_SET">
      <xsl:variable name="featureId" select="@refId"/>
      <!-- Function key() doesn't appear to support the XSLT 2.0 ability to specify the document
           to be searched.  For example, it doesn't accept the optional third argument "top",
           that identifies the document to be searched.  As another example, an XSLT parsing error also
           occurs if the document is specified in the path expression as shown on page 815 of
           "XSLT 2.0 and XPath 2.0", Programmer's Reference, 4th edition, by Michael Kay.
           Therefore, we resort to using the XSLT 1.0 technique of wrapping element <xsl:for-each> around
           the code that calls function key().  This solves the problem of using function key() to look
           up something in another document. The xsl:for-each element changes the context node to one
           that's inside document "maf-feature.xml" and serves no other purpose. We want to restrict
           <xsl:for-each> to a single loop so we specify to loop over element adfmf:features because
           we know that only one instance of element adfmf:features is allowed by the schema.
           For an explanation of this technique see article "http://www.xml.com/pub/a/2002/03/06/xslt.html".
      -->
      <xsl:for-each select="$featureDoc/adfmf:features">  <!-- This line needed only to access feature document -->
        <xsl:variable name="featureElem" select="key('featureKey', $featureId)"/>

        <!--
          Create a new XML file for each preferencePage element that is a descendant of adfmf:preferences.
          Note that a feature may have zero or one adfmf:preferences element.
        -->
        <xsl:for-each select="$featureElem/adfmf:preferences//adfmf:preferencePage">
          <xsl:variable name="preferencePage" select="."/>
        
          <xsl:call-template name="adfmf:createPlistFile">
            <xsl:with-param name="p_fileName" select="adfmf:generatePreferenceId($preferencePage)"/>
            <xsl:with-param name="p_PListFileContentRootNode" select="$preferencePage"/>
          </xsl:call-template>
        </xsl:for-each>

      </xsl:for-each>
    </xsl:for-each>
  </xsl:template>

  <!-- *********************************************************************************************
  This named template creates and populates an XML file with the specified name.
  The file name will be appended with extension ".plist" (example: "Root.plist").
  
  Also, if this template is invoked to create "Root.plist" then feature preferences
  are appended to the XML file.  The feature preferences are added, to 'Root.plist',
  in the order specified by adfmf:featureReference elements in 'maf-application.xml'.
  -->
  <xsl:template name="adfmf:createPlistFile">
    <!--
    Specifies file name without the file-name extension.
    Extension ".plist" will be appended to the specified name.
    -->
    <xsl:param name="p_fileName"
               as="xsl:string"
               required="yes"/>
    
    <!-- Contains all content for the plist file -->
    <xsl:param name="p_PListFileContentRootNode"
               as="element(adfmf:preferences) or element(adfmf:preferencePage)"
               required="yes"/>

    <xsl:variable name="FullFileName" select="concat($p_fileName, '.plist')"/>

     <xsl:result-document href="{$XSL_PARAM_SettingsBundleFolderPath}{$FullFileName}" indent="yes">
          <xsl:text disable-output-escaping="yes"><![CDATA[<!DOCTYPE plist PUBLIC "-//Apple//DTD 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">]]></xsl:text>
          <plist version="1.0">
        <dict>
          <key>PreferenceSpecifiers</key>
          <array>
            <!-- Populate the file with preference content from file maf-application.xml -->
            <xsl:for-each select="$p_PListFileContentRootNode/adfmf:preferenceGroup">
              <xsl:call-template name="adfmf:ShallowTransformPreferenceGroup">
                <xsl:with-param name="PrefGroup" select="." as="element(adfmf:preferenceGroup)"/>
              </xsl:call-template>
            </xsl:for-each>

            <xsl:if test="compare($p_fileName, $g_ROOT_PLIST_FILE_NAME) eq 0">
              <!--
              We are writing to file "Root.plist", so write all shallow
              feature preferences into the file.
              -->
              <xsl:call-template name="adfmf:writeShallowPreferencesFromAllFeatures">
              </xsl:call-template>
            </xsl:if>
          </array>
          <key>StringsTable</key>
          <string>Localizable</string>
        </dict>
      </plist>
    </xsl:result-document>
  </xsl:template>

  <!-- *********************************************************************************************
  This named template appends the specified feature preferences to the .plist file that is
  being created.  It does not create any child .plist files.
  -->
  <xsl:template name="adfmf:AddShallowFeaturePrefs">
    <!-- Specifies element adfmf:preferences for a particular feature. -->
    <xsl:param name="preferencesElement"
               as="element(adfmf:preferences)"
               required="yes"/>

    <xsl:for-each select="$preferencesElement/adfmf:preferenceGroup">
      <xsl:call-template name="adfmf:ShallowTransformPreferenceGroup">
        <!-- Pass in current preferenceGroup -->
        <xsl:with-param name="PrefGroup" select="." as="element(adfmf:preferenceGroup)"/>
      </xsl:call-template>
    </xsl:for-each>
  </xsl:template>

  <!-- *********************************************************************************************
  This named template writes iOS control metadata for the specified child element of a adfm:preferenceGroup.
  -->
  <xsl:template name="adfmf:TransformChildElementOfPreferenceGroup">
    <!--
    Must be the child of an adfmf:preferenceGroup element. Provides the source for
    transformation from adfmf content to the corresponding iOS schema content.
    -->
    <xsl:param name="p_prefGroupChild"
               as="element(adfmf:preferencePage)
                   or element(adfmf:preferenceText)
                   or element(adfmf:preferenceBoolean)
                   or element(adfmf:preferenceNumber)
                   or element(adfmf:preferenceList)"
               required="yes"/>
  
    <!-- Output content depending on the child's type -->
    <xsl:choose>
      <xsl:when test="$p_prefGroupChild[self::adfmf:preferencePage]">
        <xsl:call-template name="adfmf:Create_PSChildPaneSpecifier">
          <xsl:with-param name="p_preferencePage" select="."/>
        </xsl:call-template>
      </xsl:when>
      <xsl:when test="$p_prefGroupChild[self::adfmf:preferenceBoolean]">
        <xsl:call-template name="adfmf:Create_PSToggleSwitchSpecifier">
          <xsl:with-param name="preferenceBoolean" select="."/>
        </xsl:call-template>
      </xsl:when>
      <xsl:when test="$p_prefGroupChild[self::adfmf:preferenceList]">
        <xsl:call-template name="adfmf:Create_PSMultiValueSpecifier">
          <xsl:with-param name="preferenceList" select="."/>
        </xsl:call-template>
      </xsl:when>
      <xsl:when test="$p_prefGroupChild[self::adfmf:preferenceNumber or self::adfmf:preferenceText]">
        <xsl:call-template name="adfmf:Create_PSTextFieldSpecifier">
          <xsl:with-param name="preferenceTextOrNumber" select="."/>
        </xsl:call-template>
      </xsl:when>
      <!--
      TODO: The following use of fn:error is incorrect.  So commented out for now.  Ideally we should throw
      an error in the xsl:otherwise clause because it's content should never execute provided that
      file maf-application.xml satisfies schema "adfmf-application.xsd".
      <xsl:otherwise>
        <xsl:value-of select="fn:error((), 'Invalid node type.')"/>
      </xsl:otherwise>
      -->
    </xsl:choose>
  </xsl:template>
  <!-- *********************************************************************************************
  This named template writes iOS metadata for the adfmf:preferenceGroup element specified in
  parameter $PrefGroup.

  This template does not create any new .plist files.
  
  If $PrefGroup, or any of its child adfmf:preferenceGroup elements, represent a new
  preference page then a iOS PSChildPaneSpecifier entry is added to the current preference
  page to reference the corresponding plist file.  The children of any such
  adfmf:preferenceGroup elements are not traversed.

  If $PrefGroup represents same-page content then all the $PrefGroup content is recursively added to the
  same page by writing the iOS representation as a sequence of nodes.
  
  Parameter: PrefGroup is an element of type adfmf:preferenceGroup whose content is to be transformed to
             iOS metadata.
  -->
  <xsl:template name="adfmf:ShallowTransformPreferenceGroup">
      <!-- We only want element nodes, in namespace adfmf, that contain content for an entire plist file -->
    <xsl:param name="PrefGroup"
               as="element(adfmf:preferenceGroup)"
               required="yes"/>

    <xsl:call-template name="adfmf:Create_PSGroupSpecifier">
      <xsl:with-param name="prefGroupForSamePage" select="."/>
    </xsl:call-template>

    <!-- Process all child adfmf element nodes of the current preferenceGroup -->
    <xsl:for-each select="$PrefGroup/adfmf:*">
      <xsl:call-template name="adfmf:TransformChildElementOfPreferenceGroup">
        <xsl:with-param name="p_prefGroupChild" select="." as="element(adfmf:*)"/>
      </xsl:call-template>
    </xsl:for-each>
  </xsl:template>
  <!-- *********************************************************************************************
  This template writes a sequence of nodes to represent iOS PSGroupSpecifier,
  using the specified adfmf:preferenceGroup element.
  -->
  <xsl:template name="adfmf:Create_PSGroupSpecifier">
    <!-- Specifies a group on a preference page. -->
    <xsl:param name="prefGroupForSamePage"
               as="element(adfmf:preferenceGroup)"
               required="yes"/>

    <!-- Add group to current plist file -->
    <dict>
      <key>Type</key>
      <string>PSGroupSpecifier</string>
      <key>Title</key>
      <string>
        <xsl:value-of select="adfmf:getIosStringResourceIdOrText($prefGroupForSamePage/@label)"/>
      </string>
    </dict>
  </xsl:template>
  <!-- *********************************************************************************************
  This template writes a sequence of nodes to represent iOS PSChildPaneSpecifier,
  using the specified adfmf:preferencePage element.

  Control PSChildPaneSpecifier acts as a reference to a child XML file with extension ".plist".
  -->
  <xsl:template name="adfmf:Create_PSChildPaneSpecifier">
    <!-- Specifies a new preference page. -->
    <xsl:param name="p_preferencePage"
               as="element(adfmf:preferencePage)"
               required="yes"/>

    <dict>
      <key>Type</key>
      <string>PSChildPaneSpecifier</string>
      <key>File</key>
      <string>
        <xsl:value-of select="adfmf:generatePreferenceId($p_preferencePage)"/>
      </string>
      <key>Title</key>
      <string>
        <xsl:value-of select="adfmf:getIosStringResourceIdOrText($p_preferencePage/@label)"/>
      </string>
    </dict>    
  </xsl:template>

  <!-- *********************************************************************************************
  This template writes a sequence of nodes to represent iOS PSToggleSwitchSpecifier,
  using the specified adfmf:preferenceGroup element.
  
  Parameter: preferenceBoolan - Specifies an adfmf:preferenceBoolean to use for the transformation.
  -->
  <xsl:template name="adfmf:Create_PSToggleSwitchSpecifier">
    <xsl:param name="preferenceBoolean"
               as="element(adfmf:preferenceBoolean)"
               required="yes"/>
    
    <dict>
      <key>Type</key>
      <string>PSToggleSwitchSpecifier</string>
      <key>Key</key>
      <string>
        <xsl:value-of select="adfmf:generatePreferenceId($preferenceBoolean)"/>
      </string>
      <key>Title</key>
      <string>
        <xsl:value-of select="adfmf:getIosStringResourceIdOrText($preferenceBoolean/@label)"/>
      </string>
      <key>DefaultValue</key>
      <xsl:choose>
        <xsl:when test="$preferenceBoolean/@default='true'">
          <true/>
        </xsl:when>
        <xsl:otherwise>
          <false/>
        </xsl:otherwise>
      </xsl:choose>
    </dict>
  </xsl:template>
  <!-- *********************************************************************************************
  This template writes a sequence of nodes for control PSMultiValueSpecifier.
  
  Parameter: preferenceList - Specifies an adfmf:preferenceList to use for the transformation.
  -->
  <xsl:template name="adfmf:Create_PSMultiValueSpecifier">
    <xsl:param name="preferenceList"
               as="element(adfmf:preferenceList)"
               required="yes"/>
    <dict>
      <key>Type</key>
      <string>PSMultiValueSpecifier</string>
      <key>Key</key>
      <string>
        <xsl:value-of select="adfmf:generatePreferenceId($preferenceList)"/>
      </string>
      <key>Title</key>
      <string>
        <xsl:value-of select="adfmf:getIosStringResourceIdOrText($preferenceList/@label)"/>
      </string>
      <key>DefaultValue</key>
      <string>
        <!-- Never convert the source text to an iOS resource string identifier
        because text for iOS key "DefaultValue" is not localizable per Apple's
        "Settings Application Schema Reference".
        -->
        <xsl:value-of select="$preferenceList/@default"/>
      </string>
      <key>Titles</key>
      <array>
        <xsl:for-each select="$preferenceList/adfmf:preferenceValue">
          <string>
            <xsl:value-of select="adfmf:getIosStringResourceIdOrText(@name)"/>
          </string>
        </xsl:for-each>
      </array>
      <!-- Each entry in the Values array must have a corresponding entry in the Titles array -->
      <key>Values</key>
      <array>
        <xsl:for-each select="$preferenceList/adfmf:preferenceValue">
          <string>
            <!-- Never convert the source text to an iOS resource string identifier
            because text for iOS key "Values" is not localizable per Apple's
            "Settings Application Schema Reference".
            -->
            <xsl:value-of select="@value"/>
          </string>
        </xsl:for-each>
      </array>
    </dict>
  </xsl:template>
  <!-- *********************************************************************************************
  This template writes a sequence of nodes for control PSTextFieldSpecifier.
  
  Parameter: preferenceTextOrNumber -
                        Contains the source metadata to use for the transformation.
                        It must be an element of type adfmf:preferenceText or
                        adfmf:preferenceNumber.  Both these element types can have
                        attributes @id, @label and @default that are used by
                        this transformation.
  -->
  <xsl:template name="adfmf:Create_PSTextFieldSpecifier">
    <xsl:param name="preferenceTextOrNumber"
               as="element(adfmf:preferenceText) or element(adfmf:preferenceNumber)"
               required="yes"/>
    <dict>
      <key>Type</key>
      <string>PSTextFieldSpecifier</string>
      <key>Key</key>
      <string>
        <xsl:value-of select="adfmf:generatePreferenceId($preferenceTextOrNumber)"/>
      </string>
      <key>Title</key>
      <string>
        <xsl:value-of select="adfmf:getIosStringResourceIdOrText($preferenceTextOrNumber/@label)"/>
      </string>
      <key>DefaultValue</key>
      <string>
        <!-- Never convert the source text to an iOS resource string identifier
        because text for iOS key "DefaultValue" is not localizable per Apple's
        "Settings Application Schema Reference".
        -->
        <xsl:value-of select="$preferenceTextOrNumber/@default"/>
      </string>
      <!-- Replace typed text with bullet characters only if secret is set to true -->
      <xsl:choose>
        <xsl:when test="$preferenceTextOrNumber/@secret='true'">
          <key>IsSecure</key>
          <true/>
        </xsl:when>
        <xsl:otherwise>
          <key>IsSecure</key>
          <false/>
        </xsl:otherwise>
      </xsl:choose>
      <!-- By design, there are no corresponding adfmf attributes that can be
           used to populate the following iOS options.  Therefore, hardcode
           these options to values desired by Oracle.
      -->
      <key>AutocapitalizationType</key>
      <string>None</string>
      <key>AutocorrectionType</key>
      <string>No</string>
      <key>KeyboardType</key>
      <string>Alphabet</string>
    </dict>
  </xsl:template>
</xsl:stylesheet>