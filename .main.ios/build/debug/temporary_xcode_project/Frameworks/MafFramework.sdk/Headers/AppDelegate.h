/* Copyright (c) 2013, 2014, Oracle and/or its affiliates. All rights reserved. */
//
//  AppDelegate.h
//  MafFramework
//

#import <Foundation/Foundation.h>
#import <Cordova/CDVViewController.h>

// Base class for AppDelegate+notifications category that is part of
// PushPlugin (Cordova plugin for Push Notification support). This is
// NOT an application delegate class - don't go on the name. It is
// named "AppDelegate" so that PushPlugin category AppDelegate+notification
// can be used without any modifications. It is a proxy b/w AdfmfApplicationDelegate
// and AppDelegate+notifications. It observes the notifications from
// push methods in AdfmfAppDelegate and then invoke corresponding category
// methods in AppDelegate+notifications.
@interface AppDelegate : NSObject

- (id) initWithCDVViewController:(CDVViewController *) viewController;

- (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSNotification *) notification;
- (void)didFailToRegisterForRemoteNotificationsWithError:(NSNotification *) notification;
- (void)didReceiveRemoteNotification:(NSNotification *) notification;
- (void)applicationDidBecomeActiveHandler:(NSNotification *) notification;

@property (nonatomic, weak) CDVViewController* viewController;

@end