/*
 * Copyright (c) 2011, 2013, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

#import <Foundation/Foundation.h>


/*!
 * \class YesNo
 * \brief Synchronized boolean.
 */
@interface YesNo : NSObject {
    BOOL value;
}

/*!
 * \brief Iniitialize the YesNo instance with the specified value.
 * \param aValue
 * \return the YesNo instance
 */
-(id) initWith:(BOOL) aValue;

/*!
 * \brief Return true if the value is Yes.
 * \return true if the value is Yes.
 */
-(BOOL) isYes;

/*!
 * \brief Return false if the value is No
 * \return true if the value is No.
 */
-(BOOL) isNo;

/*!
 * \brief Assign the YesNo value to the specified value.
 * \param aValue the intended YesNo value.
 */
-(void) setTo: (BOOL) aValue;

@end
