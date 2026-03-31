import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
  }),

  actions: {
    addNotification (notification) {
      const id = Date.now()
      this.notifications.push({ id, ...notification })
      if (notification.timeout !== 0) {
        setTimeout(() => this.removeNotification(id), notification.timeout || 5000)
      }
    },

    removeNotification (id) {
      this.notifications = this.notifications.filter(n => n.id !== id)
    },

    clearAll () {
      this.notifications = []
    },
  },
})
