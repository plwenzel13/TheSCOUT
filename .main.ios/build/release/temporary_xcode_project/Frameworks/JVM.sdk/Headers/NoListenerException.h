/*
 * Copyright (c) 2011, 2013, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

#import <Foundation/Foundation.h>
#import "VMChannelException.h"

/*!
 * \class NoListenerException
 * \brief This exception is thrown from [VMChannel sendMessage].
 * \details It is thrown from [VMChannel sendMessage]
 * if the channel is not able to send. A channel is not able to send if there
 * is no listener on other side channel.
 */
@interface NoListenerException : VMChannelException {

}

@end
