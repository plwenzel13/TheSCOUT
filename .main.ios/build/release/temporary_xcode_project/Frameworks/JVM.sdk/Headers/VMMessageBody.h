/*
 * Copyright (c) 2011, 2013, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

#import <Foundation/Foundation.h>

/*!
 * \class VMMessageBody
 * \brief The VMMmessageBody encapsulates the opaque data of a VMMessage.
 * \details The <b>data</b> property is treated as
 * an opaque set of bytes.  These bytes can represent anything
 * for application scoped messages. A VMMessage with an attribute equal to
 * one of the literal constants PLAIN_MESSAGE_ATTR or PRIVATE_MESSAGE_ATTR
 * is considered an application scoped message.
 */
@interface VMMessageBody : NSObject {
    int length;
    char *data;
}

/*
 * \private
 * \brief Initialize a VMMessageBody instance with the specified data.
 * \param aData the payload
 * \param aLength the length of the payload in bytes
 * \return the VMMessageBody instance
 */
-(id) initWithData:(char *)aData ofLength:(int)aLength;

/*!
 * The size of data in bytes.
 */
@property (readonly) int length;
/*!
 * The raw bytes of the VMMessage message data.
 */
@property (readonly) char *data;

@end
