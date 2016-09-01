/*
 * Copyright (c) 2012, 2013, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

#import <Foundation/Foundation.h>
#import "VMChannelException.h"

/*!
 * \class ChannelNotAvailableException
 * \brief This exception is thrown from [VMChannel startListening] or
 * [VMChannel stopListening].
 * \details It is thrown if [VMChannel startListening] or
 * [VMChannel stopListening] is called and the channel's state is
 * DELETING or CLOSED.
 */
@interface ChannelNotAvailableException : VMChannelException {

}

@end
