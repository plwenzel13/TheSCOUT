/*
 * Copyright (c) 2011, 2013, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

#import <Foundation/Foundation.h>
#import "VMMessage.h"
#import "VMMessageHandler.h"
#import "VMControlHandler.h"
#import "VMChannelState.h"
#import "YesNo.h"

/*!
 * \mainpage
 *
 * VM channel is a message passing system allowing the native application to
 * interact with the embedded Java Virtual Machine. This channel is
 * bidirectional and supports priority based messages. All messages passed
 * on the channel are encapsulated within a VM message that provides internal
 * channel information such as routing and priority.
 *
 * The native application and embedded VM act independently of each
 * other. The state of the channel is controlled by inspecting control
 * messages passed on the control channel. These control messages act as
 * channel events. When a channel is created, registers a message handler,
 * or deletes a channel the underlying channel implementation will
 * transition the channel thru its states. The control channel
 * is also responsible for interpreting some of the events and instructing
 * the channel to transition into either the initialization or deletion states.
 * <dl class="data"><dt><b>Copyright:</b></dt><dd>
 * Copyright (c) 2013, Oracle and/or its affiliates. All rights reserved. ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 * </dd></dl>
 * \date 2013-10-01
 */
/*!
 * \private
 */
#define DEFAULT_PRIORITY 5

/*!
 * \class VMChannel
 * \brief VM channel is a message passing system.
 * \details VMChannel allows the native application to
 * interact with the embedded Java Virtual Machine. This channel is
 * bidirectional and supports priority based messages. All messages passed
 * on the channel are encapsulated within a VM message that provides internal
 * channel information such as routing and priority.
 *
 * The native application and embedded VM act independently of each
 * other. The state of the channel is controlled by inspecting control
 * messages passed on the control channel. These control messages act as
 * channel events. When a channel is created, registers a message handler,
 * or deletes the channel the underlying channel implementation will
 * transition the channel thru its states. The control channel
 * is also responsible for interpreting some of the events and instructing
 * the channel to transition into either the initialization or deletion states.
 *
 * \see VMMessage
 * \see VMChannelManager
 * \see VMChannelState
 */
@interface VMChannel : NSObject {
    int channelID;
    int messageID;
    int attributes;

    VMChannelState *state;

    volatile id<VMMessageHandler> messageHandler;
    id<VMControlHandler> controlHandler;

    /*! \private */
    YesNo *ableToSend;
    BOOL listening;
    NSThread *thisThread;

    BOOL deferredMode;
    BOOL stopped;

    NSObject *handlerLock;

    pthread_mutex_t *threadMutex;
    pthread_cond_t *threadCond;
}

/*
 * \private
 * \brief Initialize the instance with the given channel ID.
 * \details Calls ChannelManager_createOrGetChannel with the given ID.
 * \return the VMMChannel instance.
 */
-(id) initWithID:(int)aChannelID;

/*!
 * \brief Gets the unique ID that identifies this channel.
 *
 * \return the unique ID that identifies this channel
 */
-(int) getID;

/*!
 * \brief Check if this channel is able to send messages.
 * \details Messages should not be sent until this method returns true.
 *
 * \see sendMessage:(VMMessage *)
 *
 * \return true if messages can be sent, false otherwise
 */
-(BOOL) isAbleToSendMessage;

/*!
 * \brief Send a VMMessage on this channel.
 * \details The channel must be in a state to accept messages.
 *
 * \param message the message to send.
 *
 * \throws NoListenerException if there is no listener set to receive
 * the message
 */
-(void) sendMessage:(VMMessage *) message;

/*!
 * \brief Create and send a VMMessage with priority.
 * \details The new VMMessage is assigned the next message id, and
 * initialized with the specified priority, and message data.
 * The new message is transmitted on this channel.
 *
 * \param p where the lowest number gets preference
 * \param l the size of the transmitting message in bytes
 * \param data contains the transmitting message
 * \return the new VMMessage instance.
 */
-(void) sendMessageWithPriority:(int)p ofLength:(int)l data:(char *)data;

/**
 * \brief Create and send a VMMessage with priority and attributes.
 * \details The new VMMessage is assigned the next message id, and
 * initialized with the specified priority, attributes, and message data.
 * The new message is transmitted on this channel.
 *
 * \param p where the lowest number gets preference
 * \param aAttributes the attributes of the message. One of the literal
 * constants PLAIN_MESSAGE_ATTR or PRIVATE_MESSAGE_ATTR.
 * \param l the size of the transmitting message in bytes
 * \param data contains the transmitting message
 * \return the new VMMessage instance.
 */
-(void) sendMessageWithPriority:(int)p attributes:(int)aAttributes ofLength:(int)l data:(char *)data;

/*!
 * \brief Create and send a VMMessage.
 * \details The new VMMessage is assigned the next message id, and
 * initialized with the specified message data. The new message is transmitted
 * on this channel.
 *
 * \param l the length of the message
 * \param data contains the transmitting message
 *
 * \throws NoListenerException if there is no listener set to receive
 * the message
 *
 * \see sendMessage
 * \see newMessageOfLength
 */
-(void) sendMessageOfLength:(int)l data:(char *)data;

/*!
 * \brief Create and send a VMMessage with attributes.
 * \details The new VMMessage is assigned the next message id, and
 * initialized with the specified attributes and message data.
 * The new message is transmitted on this channel.
 *
 * \param aAttributes the attributes of the message. One of the literal
 * constants PLAIN_MESSAGE_ATTR or PRIVATE_MESSAGE_ATTR.
 * \param l the length of the message
 * \param data raw bytes representing the message payload
 *
 * \throws NoListenerException if there is no listener set to receive
 * the message
 *
 * \see sendMessage:(VMMessage *)VMMessage
 */
-(void) sendMessageOfLength:(int)aAttributes ofLength:(int)l data:(char *)data;

/*!
 * \brief Create a new VMMessage with priority.
 * \details The new VMMessage is assigned the next message id, and
 * initialized with the specified priority and message data.
 * It can be transmitted on this channel.
 *
 * \param p where the lowest number gets preference
 * \param l the size of the transmitting message in bytes
 * \param data contains the transmitting message
 * \return a VMMessage instance
 */
-(VMMessage *) newMessageWithPriority:(int)p ofLength:(int)l data:(char *)data;

/*!
 * \brief Create a new VMMessage with priority and attributes.
 * \details The new VMMessage is assigned the next message id, and
 * initialized with the specified priority, attributes and message data.
 * It can be transmitted on this channel.
 *
 * \param p where the lowest number gets preference
 * \param aAttributes the attributes of the message. One of the literal
 * constants PLAIN_MESSAGE_ATTR or PRIVATE_MESSAGE_ATTR.
 * \param l the size of the transmitting message in bytes
 * \param data contains the transmitting message
 * \return a VMMessage instance
 */
-(VMMessage *) newMessageWithPriority:(int)p attributes:(int)aAttributes ofLength:(int)l data:(char *)data;

/*!
 * \brief Create a VMMessage.
 * \details The new VMMessage is assigned the next message id, and
 * initialized with the specified message data.
 * It can be transmitted on this channel.
 *
 * \param l the size of the transmitting message in bytes
 * \param data contains the transmitting message
 * \return a VMMessage instance
 */
-(VMMessage *) newMessageOfLength:(int)l data:(char *)data;

/*!
 * \brief Create a VMMessage with attributes.
 * \details The new VMMessage wil is assigned the next message id, and
 * initialized with the specified attributes and message data.
 * It can be transmitted on this channel.
 *
 * \param aAttributes the attributes of the message. One of the literal
 * constants PLAIN_MESSAGE_ATTR or PRIVATE_MESSAGE_ATTR.
 * \param l the size of the transmitting message in bytes
 * \param data contains the transmitting message
 * \return a VMMessage instance
 */
-(VMMessage *) newMessageOfLength:(int)aAttributes ofLength:(int)l data:(char *)data;

/*!
 * \brief Read <b>and remove</b> the "next" message from the channel.
 *
 * \return the "next" message from the channel if one is present or null
 * otherwise.
 */
-(VMMessage *) readMessage;

/*!
 * \brief Read <b>but do not remove</b> the "next" message from the channel.
 *
 * \return the "next" message from the channel if one is present or null
 * otherwise.
 */
-(VMMessage *) peekMessage;

/*
 * \private
 * \brief Return the next available message ID.
 * \return the next available message ID.
 */
-(int) getNextMessageID;

/*!
 * \brief The number of messages currently queued on the channel.
 * \return The number of messages currently queued on the channel.
 */
-(int) size;

/*!
 * \brief Clear all pending messages from the channel.
 */
-(void) clear;

/*!
 * \brief Start receiving messages on this channel.
 * \details startListening issues the START_LISTENING message on the control
 * channel.
 *
 * \param aHandler object to handle incomming VMMessages
 * \throws ChannelNotAvailableException if the channel is not available
 */
-(void) startListening:(id<VMMessageHandler>)aHandler;

/*!
 * \brief Stop receiving messages on this channel.
 * \details stopListening issues the STOP_LISTENING message on the control
 * channel. Messages may have correlated responses and if deferred is
 * set to true, the channel stops listening after the currently queued
 * messages are processed. This allows the other end to respond to existing
 * messages.
 *
 * \param deferred if set to true, the channel stops listening after the
 * currently queued messages are processed
 *
 * \throws ChannelNotAvailableException if the channel is not available
 */
-(void) stopListening:(BOOL) deferred;

/*!
 * The state of the channel.
 * \see VMChannelState
 */
@property (nonatomic, assign) VMChannelState *state;
/*
 * \private
 * If YES, the channel is able to send messages, else it is not able to send
 * messages.
 */
@property (nonatomic, readonly) YesNo *ableToSend;

@end
