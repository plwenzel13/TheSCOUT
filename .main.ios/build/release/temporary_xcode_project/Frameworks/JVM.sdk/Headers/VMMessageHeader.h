/*
 * Copyright (c) 2011, 2013, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

#import <Foundation/Foundation.h>


/*!
 * \class VMMessageHeader
 * \brief A VMMessageHeader is part of every VMMessage.
 * \details All VMMessage instances have an associated VMMessageHeader
 * that provides the VMChannel infrastructure with
 * routing, priorities, and other information necessary to propagate
 * the message through the VM message system.
 *
 * Messages can be from plain or private, application scoped messages, or
 * control message used to control one or more channel states. The message type
 * is used as the discriminator for determining the message purpose and
 * content.
 */
@interface VMMessageHeader : NSObject {
    int type;
    int priority;
    int channelID;
    int messageID;
    int attributes;
}

/*
 * \private
 * \brief Initialize the VMMessageHeader instance with the given type, priority,
 * channel ID and message ID.
 *
 * \param aType the type of message, application or control type
 * \param aPriority where the lowest number gets preference
 * \param aChannelID the channel ID
 * \param aMessageID the message ID
 * \return the VMMessageHeader instance.
 */
-(id) initWithType:(int)aType priority:(int)aPriority channelID:(int)aChannelID messageID:(int)aMessageID;

/*
 * \private
 * \brief Initialize the VMMessageHeader instance with the given type, priority,
 * channel ID, message ID and attributes.
 * \param aType the type of message, application or control type
 * \param aPriority where the lowest number gets preference
 * \param aChannelID the channel ID
 * \param aMessageID the message ID
 * \param aAttributes the attributes of the message. One of the literal
 * constants PLAIN_MESSAGE_ATTR or PRIVATE_MESSAGE_ATTR.
 * \return the VMMessageHeader instance.
 */
-(id) initWithType:(int)aType priority:(int)aPriority channelID:(int)aChannelID messageID:(int)aMessageID attributes:(int)aAttributes;

/*!
 * The associated message type
 */
@property (readonly) int type;
/*!
 * the priority of the message
 */
@property (readonly) int priority;
/*!
 * the associated channel id for the message
 */
@property (readonly) int channelID;
/*!
 * the message message id
 */
@property (readonly) int messageID;
/*!
 * the associated attributes of the message header
 */
@property (readonly) int attributes;

/*!
 * Message attribute represented as a bit-wise flag for a PLAIN message.
 */
#define PLAIN_MESSAGE_ATTR      0
/*!
 * Message attribute represented as a bit-wise flag for a PRIVATE message.
 * A private message attribute indicates the contents will never be
 * persisted in any way, such as by logging.
 *
 * Note that once the handler for a private message has returned,
 * the payload of the message is immediately overwritten.
 */
#define PRIVATE_MESSAGE_ATTR    1

/*!
 * \brief the associated attributes of the message header
 * \details the associated attributes of the message header
 * \return the associated attributes of the message header
 */
-(int) getAttributes;

/*!
 * \brief true if the message contains the VMMessageHeader.PRIVATE_MESSAGE
 *           attribute, false otherwise
 * \details true if the message contains the VMMessageHeader.PRIVATE_MESSAGE
 *           attribute, false otherwise
 * \return true if the message contains the VMMessageHeader.PRIVATE_MESSAGE
 *           attribute, false otherwise
 */
-(BOOL) isPrivateMessage;

@end
