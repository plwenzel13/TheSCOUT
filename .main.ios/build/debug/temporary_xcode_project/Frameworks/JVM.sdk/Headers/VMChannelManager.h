/*
 * Copyright (c) 2011, 2013, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

#import <Foundation/Foundation.h>
#import "VMChannel.h"
#import "VMControlHandler.h"
#import "VMControlChannel.h"

/*!
 * \class VMChannelManager
 * \brief The VMChannelManager manages the VM message system.
 * \details The VMChannelManager is used to initialize the system with
 * control and message handlers, create and delete VM channels and
 * shut down the VM channel message system.
 *
 * A simple example of using the VM message system.
 * \code
    ...
    // initialize the VM channel system with control and message handlers.
    [[VMChannelManager getInstance] initWithControlHandler:self andMessageHandler:self];

    // Obtain a VMChannel instance. In this case since no other channels
    // have been created, a channel with id 1 will be created and returned.
    //
    @try {
        channel1 = [[VMChannelManager getInstance] getChannel:1];
    } @catch (VMChannelException *ex) {
        NSLog(@"Unable to get channel 1. Exception %@", ex);
    }

    // Start listening on the channel. In this case "self"
    // will be the message handler for this channel. It must implement
    // the VMMessageHandler handle method.
    [channel1 startListening:self];

    // Check if the channel is able to send messages.
    if (![channel1 isAbleToSendMessage]) {
        [NSThread sleepForTimeInterval:5];
    }
    ...
    // send a message
    char *data = "Here I am Moe";
    [channel1 sendMessageOfLength: strlen(data) : data];
    ...
 * \endcode
 */
@interface VMChannelManager : NSObject {
    VMControlChannel *controlChannel;

    NSMutableDictionary *channels;

    BOOL creationDone;
    NSCondition *createLock;

    BOOL deletionDone;
    NSCondition *deleteLock;

    long maxTimeout;
}

/*!
 * \private
 */
+(NSObject *) GOVERNOR;

/*!
 * \brief Return the VMChannelManager instance.
 * \details The first time an instance of VMChannelManager is obtained
 * it must be called with one of the initWithControlHandler methods to
 * initialize the VM channel system.
 */
+(VMChannelManager *) getInstance;

/*!
 * \brief Initialize the VM channel system and create the control channel.
 * \details This method Initializes the VM channel system and creates
 * the control channel, channel id 0, with the given control and message
 * handlers. The timeout factor will be 100ms for channel create or delete
 * confirmations.
 *
 * \param aControlHandler - Handler for high level channel life-cycle events
 * (create, delete)
 * \param aMessageHandler - Regular message handler
 * \return the VMChannel instance
 * \throws VMChannelException
 */
-(VMChannel *) initWithControlHandler:(id<VMControlHandler>)aControlHandler
                    andMessageHandler:(id<VMMessageHandler>)aMessageHandler __attribute__((objc_method_family(none)));

/*!
 * \brief Initialize the VM channel system and create the control channel.
 * \details This method initializes the VM channel system and creates
 * the control channel, channel id 0, with the given control and message
 * handlers. The timeout factor is to <b>aMaxTimeout</b> for channel create
 * or delete confirmations.
 *
 * \param aControlHandler - Handler for high level channel life-cycle events
 * (create, delete)
 * \param aMessageHandler - Regular message handler
 * \param aMaxTimeout the timeout in milliseconds for create or delete
 * confirmations
 * \return the VMChannel instance
 * \throws VMChannelException
 */
-(VMChannel *) initWithControlHandler:(id<VMControlHandler>)aControlHandler
                    andMessageHandler:(id<VMMessageHandler>)aMessageHandler
                    andMaxTimeout: (long) aMaxTimeout __attribute__((objc_method_family(none )));

/*!
 * \brief Get or create, if required, a channel with the given
 * unique id.
 *
 * \param aChannelID the unique id for the channel, may not be
 *                  zero
 *
 * \return a newly created channel if there is not an existing
 *         channel with the given id otherwise return the existing
 *         channel with that id
 *
 * \throws VMChannelException if the channel ID passed is
 *                 the control channel, channel zero, or if this
 *                 VM channel manager has not yet been initialized
 */
-(VMChannel *) getChannel:(int)aChannelID;

/*!
 * \brief Close and delete the given channel.
 * \details This method may not be called with the control channel
 *
 * \param aChannel the VM channel to be deleted
 *
 * \throws VMChannelException if channel is the control
 *         channel (channel zero), or if this manager has not
 *         been initialized
 *
 * \see terminate
 */
-(void) deleteChannel:(VMChannel *)aChannel;

/*!
 * \brief Terminate all channels and clean up.
 *
 * \see deleteChannel:(VMChannel*)VMChannel  with the control channel
 */
-(void) terminate;

/*!
 * \private
 */
-(void) channelCreateConfirmedForChannel:(int)aChannelID;

/*!
 * \private
 */
-(void) channelDeleteConfirmedForChannel:(int)aChannelID;

/*!
 * \private
 */
-(void) issueControlMessageOfType:(int)aType forChannel:(int)aChannelID;
/*!
 * \private
 */
-(void) issueControlMessageOfType:(int)aType forChannel:(int)aChannelID attributes:(int)aAttributes;

/*!
 * \brief Checks if a given channel exists.
 *
 * \param channelID id of the channel to test for
 * \return true if the given channel exists
 */
-(BOOL) channelExists: (int) channelID;

@end
