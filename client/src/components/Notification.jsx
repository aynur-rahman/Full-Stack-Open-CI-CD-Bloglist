import { Notice } from '../styles'
const Notification = ({ notification }) =>
  notification && (
    <Notice
      $error={notification.type === 'error'}
      role={notification.type === 'error' ? 'alert' : 'status'}
    >
      {notification.message}
    </Notice>
  )
export default Notification
