/**
 * i18n Translation Keys for API Responses
 * 
 * These keys are returned by the API and should be translated on the frontend.
 * The frontend should look for these keys in the `errors.api` namespace.
 */

export const I18N_KEYS = {
  // Error Keys
  ERROR: {
    // General
    UNAUTHORIZED: "error.unauthorized",
    FORBIDDEN: "error.forbidden",
    NOT_FOUND: "error.notFound",
    
    // Users
    USER_NOT_FOUND: "error.userNotFound",
    EMAIL_EXISTS: "error.emailExists",
    EMAIL_REGISTERED: "error.emailRegistered",
    INVALID_CREDENTIALS: "error.invalidCredentials",
    EMAIL_PASSWORD_REQUIRED: "error.emailPasswordRequired",
    PASSWORD_INCORRECT: "error.passwordIncorrect",
    CANNOT_FOLLOW_SELF: "error.cannotFollowSelf",
    ALREADY_FOLLOWING: "error.alreadyFollowing",
    
    // Posts
    POST_NOT_FOUND: "error.postNotFound",
    POST_LOCKED: "error.postLocked",
    
    // Comments
    COMMENT_NOT_FOUND: "error.commentNotFound",
    COMMENT_CREATE_FAILED: "error.commentCreateFailed",
    
    // Categories
    CATEGORY_NOT_FOUND: "error.categoryNotFound",
    
    // Notifications
    NOTIFICATION_NOT_FOUND: "error.notificationNotFound",
    
    // Reports
    REPORT_NOT_FOUND: "error.reportNotFound",
    
    // Tags
    TAG_EXISTS: "error.tagExists",
    
    // Admin
    MODERATOR_REQUIRED: "error.moderatorRequired",
    ADMIN_REQUIRED: "error.adminRequired",
    USER_ALREADY_MODERATOR: "error.userAlreadyModerator",
    USER_ALREADY_USER: "error.userAlreadyUser",
    CANNOT_DEMOTE_ADMIN: "error.cannotDemoteAdmin",
  },

  // Success Keys
  SUCCESS: {
    // Posts
    POST_CREATED: "success.postCreated",
    POST_UPDATED: "success.postUpdated",
    POST_DELETED: "success.postDeleted",
    POST_PINNED: "success.postPinned",
    POST_UNPINNED: "success.postUnpinned",
    POST_LOCKED: "success.postLocked",
    POST_UNLOCKED: "success.postUnlocked",
    VIEW_RECORDED: "success.viewRecorded",
    VIEW_ALREADY_RECORDED: "success.viewAlreadyRecorded",
    
    // Comments
    COMMENT_CREATED: "success.commentCreated",
    COMMENT_UPDATED: "success.commentUpdated",
    COMMENT_DELETED: "success.commentDeleted",
    
    // Votes
    UPVOTED: "success.upvoted",
    DOWNVOTED: "success.downvoted",
    UPVOTE_REMOVED: "success.upvoteRemoved",
    DOWNVOTE_REMOVED: "success.downvoteRemoved",
    CHANGED_TO_UPVOTE: "success.changedToUpvote",
    CHANGED_TO_DOWNVOTE: "success.changedToDownvote",
    
    // Users/Profile
    PROFILE_UPDATED: "success.profileUpdated",
    AVATAR_UPDATED: "success.avatarUpdated",
    USER_FOLLOWED: "success.userFollowed",
    USER_UNFOLLOWED: "success.userUnfollowed",
    USER_CREATED: "success.userCreated",
    LOGIN_SUCCESSFUL: "success.loginSuccessful",
    LOGOUT_SUCCESSFUL: "success.logoutSuccessful",
    
    // Notifications
    NOTIFICATION_READ: "success.notificationRead",
    ALL_NOTIFICATIONS_READ: "success.allNotificationsRead",
    NOTIFICATION_DELETED: "success.notificationDeleted",
    ALL_NOTIFICATIONS_CLEARED: "success.allNotificationsCleared",
    
    // Reports
    REPORT_CREATED: "success.reportCreated",
    REPORT_UPDATED: "success.reportUpdated",
    
    // Tags
    TAG_CREATED: "success.tagCreated",
    
    // Settings
    APPEARANCE_UPDATED: "success.appearanceUpdated",
    PASSWORD_CHANGED: "success.passwordChanged",
    ACCOUNT_DELETED: "success.accountDeleted",
    LANGUAGE_UPDATED: "success.languageUpdated",
    
    // Admin
    USER_ROLE_UPDATED: "success.userRoleUpdated",
    USER_PROMOTED: "success.userPromoted",
    USER_DEMOTED: "success.userDemoted",
    USER_BANNED: "success.userBanned",
    USER_UNBANNED: "success.userUnbanned",
    CATEGORY_CREATED: "success.categoryCreated",
    CATEGORY_UPDATED: "success.categoryUpdated",
    CATEGORY_DELETED: "success.categoryDeleted",
  },

  // Notification Types (for creating notifications)
  NOTIFICATION: {
    TYPE: {
      REPLY: "reply",
      MENTION: "mention",
      LIKE: "like",
      ACHIEVEMENT: "achievement",
      FOLLOW: "follow",
    },
    TITLE: {
      POST_PINNED: "notification.postPinned",
      NEW_COMMENT: "notification.newComment",
      NEW_REPLY: "notification.newReply",
      MENTION: "notification.mention",
      POST_LIKED: "notification.postLiked",
      NEW_FOLLOWER: "notification.newFollower",
    },
  },
} as const;

export type I18nErrorKey = typeof I18N_KEYS.ERROR[keyof typeof I18N_KEYS.ERROR];
export type I18nSuccessKey = typeof I18N_KEYS.SUCCESS[keyof typeof I18N_KEYS.SUCCESS];
