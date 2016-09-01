/*
 * Copyright (c) 2011, 2013, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

#import <Foundation/Foundation.h>
#import "VMControlHandler.h"
#import "VMChannel.h"

@interface VMControlChannel : VMChannel {

}

-(void) setControlHandler: (id<VMControlHandler>)aControlHandler;

-(VMMessage *) newControlMessageOfType:(int)aTtype forChannel:(int)aChannelID;
-(VMMessage *) newControlMessageOfType:(int)aTtype forChannel:(int)aChannelID attributes:(int)aAttributes;
-(void) issueControlMessageOfType:(int)aType forChannel:(int)aChannelID;
-(void) issueControlMessageOfType:(int)aType forChannel:(int)aChannelID attributes:(int)aAttributes;

@end
