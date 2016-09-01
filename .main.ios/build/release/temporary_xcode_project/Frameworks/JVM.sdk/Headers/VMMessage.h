/*
 * Copyright (c) 2011, 2013, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

#import <Foundation/Foundation.h>
#import "Message.h"
#import "VMMessageHeader.h"
#import "VMMessageBody.h"

/*!
 * \private */
#define PLAIN_MESSAGE                           0x00
/*!
 * \private */
#define CONTROL_MESSAGE_VM_INIT_DONE            0x11
/*!
 * \private */
#define CONTROL_MESSAGE_CREATE_CHANNEL          0x22
/*!
 * \private */
#define CONTROL_MESSAGE_CREATE_CHANNEL_CONF     0x33
/*!
 * \private */
#define CONTROL_MESSAGE_START_LISTENING         0x44
/*!
 * \private */
#define CONTROL_MESSAGE_START_LISTENING_CONF    0x55
/*!
 * \private */
#define CONTROL_MESSAGE_STOP_LISTENING          0x66
/*!
 * \private */
#define CONTROL_MESSAGE_STOP_LISTENING_CONF     0x77
/*!
 * \private */
#define CONTROL_MESSAGE_DELETE_CHANNEL          0x88
/*!
 * \private */
#define CONTROL_MESSAGE_DELETE_CHANNEL_CONF     0x99

/*!
 * \class VMMessage
 * \brief The VMMessage is the object that is transported across a VMChannel.
 * \details The VMMessage is composed of a VMMessageHeader and a
 * VMMessageBody. The header provides routing, priority, and other information
 * that is required for the VM channel infrastructure to correctly route and
 * deliver messages on the channel. The body is treated as an opaque byte
 * array allowing the client to pass anything in the message.
 */
@interface VMMessage : NSObject {
    VMMessageHeader *header;
    VMMessageBody *body;
}

/*
 * \private
 * \brief Initialize a VMMessage instance.
 * \details This method inializes a VMMessage instance with the given
 * priority, channel ID, message ID, and message.
 *
 * \param aType the type of message, application or control type
 * \param aPriority where the lowest number gets preference
 * \param aChannelID the channel ID
 * \param aMessageID the message ID
 * \param aLength the length of the message
 * \param aData the message
 * \return the VMMessage instance.
 */
-(id) initWithType:(int)aType priority:(int)aPriority channelID:(int)aChannelID messageID:(int)aMessageID length:(int)aLength data:(char *)aData;

/*
 * \private
 * \brief Initialize a VMMessage instance.
 * \details This method inializes a VMMessage instance with the given
 * priority, channel ID, message ID, attributes, and message.
 *
 * \param aType the type of message, application or control type
 * \param aPriority where the lowest number gets preference
 * \param aChannelID the channel ID
 * \param aMessageID the message ID
 * \param aAttributes the attributes of the message,
 *                       VMMessageHeader.PLAIN_MESSAGE or
 *                       VMMessageHeader.PRIVATE_MESSAGE
 * \param aLength the length of the message
 * \param aData the message
 * \return the VMMessage instance.
 */
-(id) initWithType:(int)aType priority:(int)aPriority channelID:(int)aChannelID messageID:(int)aMessageID attributes:(int)aAttributes length:(int)aLength data:(char *)aData;

/*
 * \private
 * \brief Initialize a VMMessage instance.
 * \details This method inializes a VMMessage instance with the given header
 * and body.
 *
 * \param aHeader a VMMessageHeader instance
 * \param aBody a VMMessageBody instance
 * \return the VMMessage instance.
 */
-(id) initWithHeader:(VMMessageHeader *)aHeader andBody:(VMMessageBody *)aBody;

/*
 * \private
 * \brief Returns true if the message type is associated with a known control
 * message.
 * \return true if the message type is associated with a known control
 * message.
 */
-(BOOL) isControlMessage;

/*!
 * The message header associated with this message
 */
@property (nonatomic, retain) VMMessageHeader *header;
/*!
 * The opaque message body object associated with this message
 */
@property (nonatomic, retain) VMMessageBody *body;

@end
