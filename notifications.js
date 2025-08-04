document.addEventListener('DOMContentLoaded', () => {
    // Mark all notifications as read
    const markAllReadBtn = document.querySelector('.mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            const unreadNotifications = document.querySelectorAll('.notification-item.unread');
            unreadNotifications.forEach(notification => {
                notification.classList.remove('unread');
            });
            // Here you would typically make an API call to update the server
        });
    }

    // Clear all notifications
    const clearAllBtn = document.querySelector('.clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            const notificationsList = document.querySelector('.notifications-list');
            if (notificationsList) {
                notificationsList.innerHTML = '<p class="no-notifications">No notifications</p>';
            }
            // Here you would typically make an API call to delete all notifications
        });
    }

    // Mark individual notification as read
    const markReadButtons = document.querySelectorAll('.mark-read');
    markReadButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const notificationItem = e.target.closest('.notification-item');
            if (notificationItem) {
                notificationItem.classList.remove('unread');
                // Here you would typically make an API call to update the server
            }
        });
    });

    // Add notification count to the bell icon in the header
    function updateNotificationCount() {
        const unreadCount = document.querySelectorAll('.notification-item.unread').length;
        const bellIcon = document.querySelector('.user-menu button[onclick="window.location.href=\'notifications.html\'"]');
        
        if (bellIcon) {
            // Remove existing count if any
            const existingCount = bellIcon.querySelector('.notification-count');
            if (existingCount) {
                existingCount.remove();
            }

            // Add new count if there are unread notifications
            if (unreadCount > 0) {
                const countBadge = document.createElement('span');
                countBadge.className = 'notification-count';
                countBadge.textContent = unreadCount;
                bellIcon.appendChild(countBadge);
            }
        }
    }

    // Initial count update
    updateNotificationCount();

    // Simulate receiving new notifications (for demo purposes)
    function simulateNewNotification() {
        const notificationsList = document.querySelector('.notifications-list');
        if (notificationsList) {
            const newNotification = document.createElement('div');
            newNotification.className = 'notification-item unread';
            newNotification.innerHTML = `
                <div class="notification-icon">
                    <i class="fas fa-bell"></i>
                </div>
                <div class="notification-content">
                    <h3>New Notification</h3>
                    <p>This is a demo notification</p>
                    <span class="notification-time">Just now</span>
                </div>
                <button class="mark-read">
                    <i class="fas fa-check"></i>
                </button>
            `;
            notificationsList.insertBefore(newNotification, notificationsList.firstChild);
            updateNotificationCount();
        }
    }

    // Add some CSS for the notification count badge
    const style = document.createElement('style');
    style.textContent = `
        .notification-count {
            position: absolute;
            top: -5px;
            right: -5px;
            background-color: var(--accent-color);
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .no-notifications {
            text-align: center;
            color: var(--text-secondary);
            padding: 2rem;
        }
    `;
    document.head.appendChild(style);
}); 