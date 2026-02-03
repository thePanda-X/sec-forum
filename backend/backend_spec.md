### posts
 - GET /api/v1/posts - List posts with filtering/sorting/pagination  
 - POST /api/v1/posts - Create post  
 - GET /api/v1/posts/[id] - Get single post  
 - POST /api/v1/posts/[id]/comments - Get/create comments for post  
 - POST /api/v1/posts/[id]/pin - Toggle pin  
 - POST /api/v1/posts/[id]/lock - Toggle lock  

### categories
 - GET /api/v1/categories - List categories  
 - GET /api/v1/stats/forum - Forum stats & trending tags  
 - GET /api/v1/users/[username] - Get user profile  
 - GET /api/v1/users/[username]/posts - Get user's posts  

### notifications
 - GET /api/v1/notifications - Get notifications  
 - GET /api/v1/notifications/unread-count - Unread count  
 - POST /api/v1/notifications/[id]/read - Mark as read  
 - POST /api/v1/notifications/read-all - Mark all as read  
 - DELETE /api/v1/notifications/[id] - Delete notification  
 - DELETE /api/v1/notifications/clear - Clear all notifications  

### Auth
 - POST /api/auth/login - Login  
 - POST /api/auth/logout - Logout  
 - GET /api/auth/me - Get current user  

### Posts
 - PUT /api/v1/posts/[id] - Update post  
 - DELETE /api/v1/posts/[id] - Delete post  
 - PUT /api/v1/posts/[id]/views - Increment views (or handle internally)
### Comments
 - GET /api/v1/comments/[id] - Get comment  
 - PUT /api/v1/comments/[id] - Update comment  
 - DELETE /api/v1/comments/[id] - Delete comment  

### Users
 - PUT /api/v1/users/[username] - Update profile  
 - PUT /api/v1/users/[username]/avatar - Update avatar  
 - POST /api/v1/users/[username]/follow - Follow user  
 - DELETE /api/v1/users/[username]/follow - Unfollow user  
 - GET /api/v1/users/[username]/followers - Get followers  
 - GET /api/v1/users/[username]/following - Get following  

### Settings
 - GET /api/v1/settings - Get user settings  
 - PUT /api/v1/settings - Update user settings  
 - POST /api/v1/settings/password - Change password  
 - DELETE /api/v1/settings/account - Delete account  

### Admin
 - GET /api/v1/admin/dashboard - Dashboard stats  
 - GET /api/v1/admin/users - List all users  
 - PUT /api/v1/admin/users/[id]/role - Update user role  
 - POST /api/v1/admin/users/[id]/ban - Ban user  
 - GET /api/v1/admin/reports - List reports (optional filter by status)  
 - PUT /api/v1/admin/reports/[id]/status - Update report status  
 - GET /api/v1/admin/audit-logs - Get audit logs  
 - POST /api/v1/admin/categories - Create category  
 - PUT /api/v1/admin/categories/[id] - Update category  
 - DELETE /api/v1/admin/categories/[id] - Delete category  

### Reports
 - POST /api/v1/reports - Create report (for user to report content)

### Code Quality
 - GET /api/v1/quality/report - Backend code quality report
