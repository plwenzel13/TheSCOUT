/*
 * Copyright (c) 2011, 2013, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

#import <Foundation/Foundation.h>
#import "VMMessage.h"

/*!
 * \class VMChannelState
 * \brief Encapsulates the states of a VM channel.
 * \details
 * Encapsulates the valid states of a VM channel.
 * <p><table>
 * <tr><td>Initial</td><td>State</td><td>Event</td>Ending State</td></tr>
 * <tr><td>UNINITIALIZED</td><td>[by impl]</td><td>INITIALIZED</td></tr>
 * <tr><td>INITIALIZED</td><td> [create_channel]</td><td>CREATING</td></tr>
 * <tr><td>CREATING</td><td>[create_channel_conf]</td><td>CREATED</td></tr>
 * <tr><td>&lt;any state&gt;</td><td>[delete_channel]</td><td>DELETING</td></tr>
 * <tr><td>DELETING</td><td>[delete_channel_conf]</td><td>CLOSED</td></tr>
 * </table>
 */
@interface VMChannelState : NSObject {
    NSString *name;
}

/*
 * \private
 * Returns the next valid state based on the current state.
 */
-(VMChannelState *) nextState: (VMMessage *) message;

/*!
 * The initial state of the channel prior to being formally
 * initialized.
 */
+(VMChannelState *) UNINITIALIZED;
/*!
 * Established by the channel implementation when the channel
 * has been initialized to a know startup state.
 */
+(VMChannelState *) INITIALIZED;
/*!
 * Established by the implementation to denote the channel is in
 * the "creation" phase and until the creation is complete the channel is
 * unable to handle any events (other than delete).
 */
+(VMChannelState *) CREATING;
/*!
 * Established by the implementation to denote the channel has been
 * successfully created and ready to receive message over. No messages will
 * be sent until the channel has transitioned into the ABLE_TO_SEND state.
 */
+(VMChannelState *) CREATED;
//+(VMChannelState *) ABLE_TO_SEND;
/*!
 * Established by the implementation to denote the channel is in
 * the close/delete phase. In this state no new messages can be sent on the
 * channel. This state can be reached via several conditions: a. the channel
 * had entered the "shutdown" phase by invoking a deleteChannel. b. the
 * control channel has entered the "shutdown" phase. c. an unrecoverable
 * error on the channel or the control channel
 */
+(VMChannelState *) DELETING;
/*!
 * Established by the implementation to denote the channel is no
 * longer in a usable state and all associated resources have or in the
 * process of being released.
 */
+(VMChannelState *) CLOSED;

@end
