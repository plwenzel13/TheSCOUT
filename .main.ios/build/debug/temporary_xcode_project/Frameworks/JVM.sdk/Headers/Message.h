/*
 * Copyright (c) 2011-2012, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

#ifndef MESSAGE_H
#define MESSAGE_H

#include <stdio.h>
#include <stdlib.h>
#include <memory.h>

#ifdef ENABLE_VMCHANNEL_LOGGING
#ifdef __OBJC__
#define LOG(fmt , args...) NSLog(fmt , ## args)
#else
#define LOG(fmt , args...) fprintf(stdout, fmt , ## args); fflush(stdout)
#endif
#else
#define LOG(fmt , args...)
#endif

#ifdef  __cplusplus
extern "C" {
#endif

struct _MessageHeader {
    int type;
    int priority;
    int channelID;
    int messageID;
    int attributes;
};

struct _MessageBody {
    int length;
    char *data;
};

typedef struct _MessageHeader *MessageHeader;
typedef struct _MessageBody *MessageBody;

struct _Message {
    MessageHeader header;
    MessageBody body;
};

typedef struct _Message *Message;


MessageHeader MessageHeader_new(int type, int priority, int channelID, int messageID, int attributes);
void MessageHeader_free(MessageHeader header);

MessageBody MessageBody_new(int length, char *data);
void MessageBody_free(MessageBody body);

Message Message_new(int type, int priority, int channelID, int messageID, int attributes, int length, char *data);
void Message_free(Message message);

#ifdef  __cplusplus
}
#endif

#endif  /* MESSAGE_H */

