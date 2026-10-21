import DateTimeBar from './components/DateTimeBar'
import WidgetGrid from './components/WidgetGrid'

export default function AdminPage() {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 72px', boxSizing: 'border-box' }}>
      <DateTimeBar />
      <WidgetGrid />
    </div>
  )
}