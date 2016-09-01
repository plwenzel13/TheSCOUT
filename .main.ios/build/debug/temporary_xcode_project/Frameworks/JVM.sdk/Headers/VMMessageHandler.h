/*
 * Copyright (c) 2011, 2013, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

#import <Foundation/Foundation.h>
#import "VMMessage.h"

/*!
 * \protocol VMMessageHandler
 * \brief The VMMessageHandler protocol defines a method for handling received
 * VMMessages.
 */
@protocol VMMessageHandler <NSObject>

/*!
 * \brief The notification method for handling received VMMessage's.
 *
 * \param message received message to handle
 */
-(void) handle: (VMMessage *) message;

@end
