/*
 * Copyright (c) 2011, 2013, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

#import <Foundation/Foundation.h>
@class VMChannel;

/*!
 * \protocol VMControlHandler
 * \brief The VMControlHandler protocol defines methods for handling
 * system level control messages.
 * \details The class that implements the VMControlHandler protocol
 * is be responsible for handling VMChannel create and delete system
 * control messages sent on the control channel. Since this is
 * for handling control message that only flow on the control channel, only
 * one class needs to implement this interface. The implementing class should
 * be thought of as "main" or as the JVM primortial handler that is
 * responsible for all "system" level functionality such as
 * channel management.
 */
@protocol VMControlHandler

/*!
 * \brief Called by the VMChannelManager after the channel has been created.
 * \details This method is called after the channel has been created to
 * provide a hook for the control handler implementor to perform any
 * initialization required on a new channel. Typically
 * this is where channel message handler is created and registered.
 *
 * \param channel the VM channel to be created
 */
-(void) channelCreated: (VMChannel *) channel;

/*!
 * \brief Called by the VMChannelManager when the channel is deleted.
 * \details This method is called as one of the first
 * steps of the channel being deleted. Typically this is where any clean up
 * is done by the channel message handler.
 *
 * \param channel the VM channel to be deleted
 */
-(void) channelDeleted: (VMChannel *) channel;

@end
